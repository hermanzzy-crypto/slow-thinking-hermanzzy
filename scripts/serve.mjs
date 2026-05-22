#!/usr/bin/env node
/**
 * Step 3 本地服务：渲染交互 HTML + 接住保存请求，直接写入 Obsidian。
 * 取代「下载 JSON 文件」的旧体验 —— 用户点保存即直存，无需任何文件下载。
 *
 * Usage:
 *   node serve.mjs --data /tmp/slow-thinking-payload.json [--obsidian <dir>] [--port N]
 *
 * 生命周期：
 *   - 就绪后 stdout 打印 "URL http://127.0.0.1:<port>"，
 *     同时把 URL 写入 <tmpdir>/slow-thinking/serve-url.txt（供 agent 稳定读取）。
 *   - 收到 POST /save：调 sediment.mjs 把 <date>.md 写进 Obsidian，
 *     打印 "SAVED <obsidian_path>"，~1.5s 后自行退出。
 *   - 闲置保护：45 分钟没人保存则打印 "TIMEOUT" 退出。
 *
 * payload.json schema 同 render.mjs。
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_DIR = path.resolve(__dirname, '..');
const TEMPLATE = path.join(SKILL_DIR, 'templates', 'interactive.html');
const SEDIMENT = path.join(__dirname, 'sediment.mjs');
const RESULT_DIR = path.join(os.tmpdir(), 'slow-thinking');
const IDLE_MS = 45 * 60 * 1000;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--data') out.data = args[++i];
    else if (args[i] === '--obsidian') out.obsidian = args[++i];
    else if (args[i] === '--port') out.port = parseInt(args[++i], 10);
  }
  if (!out.data) {
    console.error('Usage: node serve.mjs --data <payload.json> [--obsidian <dir>] [--port N]');
    process.exit(1);
  }
  return out;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderHtml(payload) {
  let html = fs.readFileSync(TEMPLATE, 'utf8');
  const replacements = {
    '{{DATE}}': escapeHtml(payload.date || new Date().toISOString().slice(0, 10)),
    '{{IDENTITY}}': escapeHtml(payload.identity || '个人视角'),
    '{{SOURCE_HTML}}': payload.source_html || '<em>（无素材）</em>',
    '{{SOURCE_JSON}}': JSON.stringify(payload.source || {}),
    '{{CARDS_JSON}}': JSON.stringify(payload.cards || [])
  };
  for (const [k, v] of Object.entries(replacements)) {
    html = html.split(k).join(v);
  }
  return html;
}

(function main() {
  const opts = parseArgs();
  const payload = JSON.parse(fs.readFileSync(opts.data, 'utf8'));
  const html = renderHtml(payload);
  fs.mkdirSync(RESULT_DIR, { recursive: true });

  let idleTimer = setTimeout(() => {
    console.log('TIMEOUT');
    process.exit(0);
  }, IDLE_MS);

  const server = http.createServer((req, res) => {
    // 渲染好的交互页
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // 保存：直写 Obsidian
    if (req.method === 'POST' && req.url === '/save') {
      let body = '';
      req.on('data', (c) => {
        body += c;
        if (body.length > 2_000_000) req.destroy();
      });
      req.on('end', () => {
        try {
          const result = JSON.parse(body);
          const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const tmp = path.join(RESULT_DIR, `result-${result.date || 'x'}-${stamp}.json`);
          fs.writeFileSync(tmp, JSON.stringify(result, null, 2));
          // 稳定路径，供 agent 做飞书镜像
          fs.writeFileSync(path.join(RESULT_DIR, 'result-latest.json'), JSON.stringify(result, null, 2));

          const sedArgs = [SEDIMENT, '--result', tmp];
          if (opts.obsidian) sedArgs.push('--obsidian', opts.obsidian);
          const r = spawnSync('node', sedArgs, { encoding: 'utf8' });
          if (r.status !== 0) throw new Error(r.stderr || 'sediment.mjs 执行失败');

          const m = r.stdout.match(/<!-- SLOW_THINKING_RESULT (.*?) -->/);
          const meta = m ? JSON.parse(m[1]) : {};

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            ok: true,
            obsidian_path: meta.obsidian_path || null,
            has_obsidian: !!meta.has_obsidian
          }));

          clearTimeout(idleTimer);
          console.log('SAVED ' + (meta.obsidian_path || '(no-obsidian-dir)'));
          setTimeout(() => {
            try { server.close(); } catch (e) {}
            process.exit(0);
          }, 1500);
        } catch (e) {
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ ok: false, error: String((e && e.message) || e) }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
    res.end('not found');
  });

  server.listen(opts.port || 0, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:' + server.address().port;
    try { fs.writeFileSync(path.join(RESULT_DIR, 'serve-url.txt'), url); } catch (e) {}
    process.stdout.write('URL ' + url + '\n');
  });

  server.on('error', (e) => {
    console.error('serve.mjs 启动失败: ' + e.message);
    process.exit(1);
  });
})();
