#!/usr/bin/env node
/**
 * Read/write skill state (identity, last cards, feishu doc token).
 *
 * Storage strategy:
 *   1. If ~/.claude/workspace/MEMORY.md exists (OpenClaw layout), respect it:
 *      identity comes from a line like `slow_thinking_identity: <value>` in that file.
 *      Otherwise fall back to local state.
 *   2. Local state at <SKILL_DIR>/state/identity.json — always written here too.
 *
 * Commands:
 *   node state.mjs get               # print full state JSON
 *   node state.mjs set <key> <val>   # set a key
 *   node state.mjs remember-cards <id1,id2,id3>
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_DIR = path.resolve(__dirname, '..');
const STATE_FILE = path.join(SKILL_DIR, 'state', 'identity.json');
const OPENCLAW_MEMORY = path.join(os.homedir(), '.claude', 'workspace', 'MEMORY.md');

function readLocal() {
  if (!fs.existsSync(STATE_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return {}; }
}

function writeLocal(obj) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2));
}

function readOpenclaw() {
  if (!fs.existsSync(OPENCLAW_MEMORY)) return {};
  const txt = fs.readFileSync(OPENCLAW_MEMORY, 'utf8');
  const out = {};
  const id = txt.match(/slow_thinking_identity\s*[:：]\s*(.+)/);
  if (id) out.identity = id[1].trim();
  const tk = txt.match(/slow_thinking_feishu_doc_token\s*[:：]\s*(\S+)/);
  if (tk) out.feishu_doc_token = tk[1].trim();
  const lc = txt.match(/slow_thinking_last_cards\s*[:：]\s*([\w,\-]+)/);
  if (lc) out.last_cards = lc[1].split(',');
  return out;
}

function getState() {
  return { ...readLocal(), ...readOpenclaw(), openclaw: fs.existsSync(OPENCLAW_MEMORY) };
}

const [, , cmd, ...rest] = process.argv;

if (cmd === 'get' || !cmd) {
  process.stdout.write(JSON.stringify(getState(), null, 2));
} else if (cmd === 'set') {
  const [k, ...vs] = rest;
  if (!k) { console.error('usage: state.mjs set <key> <value>'); process.exit(1); }
  const v = vs.join(' ');
  const cur = readLocal();
  cur[k] = v;
  writeLocal(cur);
  process.stdout.write(JSON.stringify(cur, null, 2));
} else if (cmd === 'remember-cards') {
  const ids = (rest[0] || '').split(',').filter(Boolean);
  const cur = readLocal();
  cur.last_cards = ids;
  cur.last_cards_at = new Date().toISOString();
  writeLocal(cur);
  process.stdout.write(JSON.stringify(cur, null, 2));
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(1);
}
