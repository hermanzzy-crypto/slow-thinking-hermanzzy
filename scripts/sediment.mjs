#!/usr/bin/env node
/**
 * Take the user's saved JSON (from HTML save button) and write to Obsidian + state.
 *
 * Usage:
 *   node sediment.mjs --result ~/Downloads/slow-thinking-YYYY-MM-DD.json
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

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--result') out.result = args[++i];
    else if (args[i] === '--obsidian') out.obsidian = args[++i];
  }
  if (!out.result) {
    console.error('Usage: node sediment.mjs --result <result.json> [--obsidian <dir>]');
    process.exit(1);
  }
  return out;
}

function renderMarkdown(p) {
  const date = p.date;
  const card = p.card || {};
  const questions = card.questions || [];
  const answers = p.answers || [];
  const source = p.source || {};

  const sourceLines = (source.stories || []).map(s =>
    `- ${s.tag || ''} **[${s.title}](${s.url})** · ${s.points || 0} points / ${s.comments || 0} comments`
  ).join('\n');

  return `---
date: ${date}
identity: ${p.identity || ''}
thinking_card: ${card.name || ''}
source_type: ${source.source ? 'hacker-news' : 'custom'}
tags: [思考跑步机, 刻意思考]
---

# 🏃 思考跑步机 · ${date}

> 今日身份：**${p.identity || ''}** ｜ 思考卡片：**${card.name || ''}** — *${card.tagline || ''}*

---

## 📰 今日素材

${sourceLines || '（无）'}

---

## 📐 底层逻辑

${card.logic || ''}

## 🎯 本事件解读（${p.identity || ''} 视角）

${card.reading || ''}

---

## 💡 思考对话

${questions.map((q, i) => `
### Q${i + 1}. ${q}

${answers[i] || '_（未作答）_'}
`).join('\n')}

---

## 🎯 今日 Take-away

> ${p.insight || '_（未填写）_'}

---

## 🌱 留给明天的钩子

${p.hook || '_（无）_'}

---

*保存于 ${p.saved_at || ''} ｜ 思考肌肉 +1 💪*
`;
}

(function main() {
  const { result, obsidian } = parseArgs();
  const payload = JSON.parse(fs.readFileSync(result, 'utf8'));
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
