#!/usr/bin/env node
/**
 * Take the user's saved JSON (from HTML save button) and write to Obsidian + state.
 *
 * Usage:
 *   node sediment.mjs --result ~/Downloads/slow-thinking-YYYY-MM-DD-HHMMSS.json
 *   node sediment.mjs --latest [YYYY-MM-DD]      # 自动取 ~/Downloads 里最新的结果文件
 *
 * Behavior:
 *   - Always writes the markdown summary to stdout (so agent can read it).
 *   - If OBSIDIAN_DIR or default Obsidian path exists, writes a .md file there.
 *   - Returns paths in a JSON footer (last line) for the agent to parse.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_OBSIDIAN = path.join(os.homedir(), 'Desktop', 'AI资讯积累', '思考跑步机');
const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--result') out.result = args[++i];
    else if (args[i] === '--obsidian') out.obsidian = args[++i];
    else if (args[i] === '--latest') {
      out.latest = true;
      const next = args[i + 1];
      if (next && !next.startsWith('--')) out.latestDate = args[++i];
    }
  }
  if (!out.result && !out.latest) {
    console.error('Usage: node sediment.mjs (--result <result.json> | --latest [YYYY-MM-DD]) [--obsidian <dir>]');
    process.exit(1);
  }
  return out;
}

// 在 ~/Downloads 里找最新的 slow-thinking-*.json（浏览器同日多次保存时取最新一份）
function findLatestResult(dateFilter) {
  if (!fs.existsSync(DOWNLOADS_DIR)) return null;
  const matches = fs.readdirSync(DOWNLOADS_DIR)
    .filter(f => /^slow-thinking-.*\.json$/i.test(f))
    .filter(f => !dateFilter || f.includes(dateFilter))
    .map(f => {
      const full = path.join(DOWNLOADS_DIR, f);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return matches.length ? matches[0].full : null;
}

function renderMarkdown(p) {
  const date = p.date;
  const source = p.source || {};
  const identity = p.identity || '';

  const sourceLines = (source.stories || []).map(s =>
    `- ${s.tag || ''} **[${s.title}](${s.url})** · ${s.points || 0} points / ${s.comments || 0} comments`
  ).join('\n');

  // 兼容两种结构：新版多卡 entries[]，旧版单卡 card/answers/insight/hook
  const entries = Array.isArray(p.entries) && p.entries.length
    ? p.entries
    : (p.card ? [{ card: p.card, answers: p.answers || [], insight: p.insight || '', hook: p.hook || '' }] : []);

  const cardNames = entries.map(e => (e.card && e.card.name) || '').filter(Boolean);

  const sections = entries.map((e, ei) => {
    const card = e.card || {};
    const questions = card.questions || [];
    const answers = e.answers || [];
    const dialog = questions.map((q, i) => `
#### Q${i + 1}. ${q}

${answers[i] || '_（未作答）_'}
`).join('\n');
    return `## ${ei + 1}. ${card.name || ''}${card.tagline ? ` — *${card.tagline}*` : ''}

### 📐 底层逻辑

${card.logic || ''}

### 🎯 本事件解读（${identity} 视角）

${card.reading || ''}

### 💡 思考对话
${dialog}
### 🎯 这张卡的 Take-away

> ${e.insight || '_（未填写）_'}

### 🌱 留给明天的钩子

${e.hook || '_（无）_'}
`;
  }).join('\n---\n\n');

  return `---
date: ${date}
identity: ${identity}
thinking_cards: [${cardNames.join(', ')}]
source_type: ${source.source ? 'hacker-news' : 'custom'}
tags: [思考跑步机, 刻意思考]
---

# 🏃 思考跑步机 · ${date}

> 今日身份：**${identity}** ｜ 走过 ${entries.length} 张思考卡：${cardNames.join(' / ') || '（无）'}

---

## 📰 今日素材

${sourceLines || '（无）'}

---

${sections || '_（本次未作答任何卡片）_'}

---

*保存于 ${p.saved_at || ''} ｜ 思考肌肉 +${entries.length || 1} 💪*
`;
}

(function main() {
  const { result, obsidian, latest, latestDate } = parseArgs();

  let resultPath = result;
  if (!resultPath && latest) {
    resultPath = findLatestResult(latestDate);
    if (!resultPath) {
      console.error(`未在 ${DOWNLOADS_DIR} 找到 slow-thinking-*.json` +
        (latestDate ? `（日期过滤：${latestDate}）` : '') +
        '。请确认用户已在 HTML 里点过「💾 保存今日思考」，或改用 --result 指定文件。');
      process.exit(1);
    }
    console.error(`[sediment] 使用最新结果文件: ${resultPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const md = renderMarkdown(payload);

  // print markdown to stdout
  process.stdout.write(md);

  // optional obsidian write
  const obsDir = obsidian || (fs.existsSync(DEFAULT_OBSIDIAN) ? DEFAULT_OBSIDIAN : null);
  let obsPath = null;
  if (obsDir) {
    fs.mkdirSync(obsDir, { recursive: true });
    obsPath = path.join(obsDir, `${payload.date}.md`);
    fs.writeFileSync(obsPath, md, 'utf8');
  }

  // footer JSON (last line) for the agent
  process.stdout.write(`\n\n<!-- SLOW_THINKING_RESULT ${JSON.stringify({
    obsidian_path: obsPath,
    has_obsidian: !!obsPath,
    date: payload.date
  })} -->\n`);
})();
