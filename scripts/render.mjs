#!/usr/bin/env node
/**
 * Render templates/interactive.html with injected data.
 *
 * Usage:
 *   node render.mjs --data /path/to/payload.json [--out /tmp/slow-thinking/xxx.html]
 *
 * payload.json schema:
 *   {
 *     "date": "YYYY-MM-DD",
 *     "identity": "AI解决方案专家",
 *     "source": { ... },       // arbitrary JSON, embedded as window.__META__.source
 *     "source_html": "<p>...</p>",   // rendered into the source-card body
 *     "cards": [                // 3 cards
 *       { id, name, tagline, logic, reading, questions: [q1,q2,q3] }
 *     ]
 *   }
 *
 * Output: writes HTML and prints absolute path to stdout.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_DIR = path.resolve(__dirname, '..');
const TEMPLATE = path.join(SKILL_DIR, 'templates', 'interactive.html');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--data') out.data = args[++i];
    else if (args[i] === '--out') out.out = args[++i];
  }
  if (!out.data) {
    console.error('Usage: node render.mjs --data <payload.json> [--out <output.html>]');
    process.exit(1);
  }
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

(function main() {
  const { data, out } = parseArgs();
  const payload = JSON.parse(fs.readFileSync(data, 'utf8'));

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

  const date = payload.date || new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = out || path.join(os.tmpdir(), 'slow-thinking', `${date}-${stamp}.html`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  process.stdout.write(outPath + '\n');
})();
