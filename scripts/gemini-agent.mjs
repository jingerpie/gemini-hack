#!/usr/bin/env node
// Hand a task to Google's Gemini CLI as a subprocess, signed in with the hackathon key from the repo-root .env.
// (The machine-level GEMINI_API_KEY belongs to another project, so the key is passed to the child only.)
//
//   node scripts/gemini-agent.mjs "task text"                 read-only (plan mode)
//   node scripts/gemini-agent.mjs --write "task text"         may edit files in --cwd
//   node scripts/gemini-agent.mjs --yolo "task text"          may edit files and run commands
//   options: --model <id> (default gemini-4-hydrogen)  --cwd <dir> (default: current dir)  --json
//   Task text can also come on stdin. Install once: npm install -g @google/gemini-cli
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function hackathonKey() {
  const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const m = env.match(/^GEMINI_API_KEY=(.*)$/m);
  if (!m) throw new Error('GEMINI_API_KEY is missing from the repo-root .env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

function cliEntry() {
  const dirs = [process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules'), '/usr/local/lib/node_modules', '/usr/lib/node_modules'];
  for (const d of dirs.filter(Boolean)) {
    const p = path.join(d, '@google', 'gemini-cli', 'bundle', 'gemini.js');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const args = process.argv.slice(2);
const take = (flag) => { const i = args.indexOf(flag); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
const has = (flag) => { const i = args.indexOf(flag); if (i < 0) return false; args.splice(i, 1); return true; };

const model = take('--model') || 'gemini-4-hydrogen';
const cwd = path.resolve(take('--cwd') || process.cwd());
const mode = has('--yolo') ? 'yolo' : has('--write') ? 'auto_edit' : 'plan';
const json = has('--json');
const prompt = args.join(' ');
if (!prompt && process.stdin.isTTY) {
  console.error('usage: node scripts/gemini-agent.mjs [--write|--yolo] [--model id] [--cwd dir] [--json] "task"');
  process.exit(2);
}

const cliArgs = ['-m', model, '--approval-mode', mode, '--skip-trust', '--allowed-mcp-server-names', 'none', '-o', json ? 'json' : 'text', '-p', prompt];
const entry = cliEntry();
const child = entry
  ? spawn(process.execPath, [entry, ...cliArgs], { cwd, stdio: 'inherit', env: { ...process.env, GEMINI_API_KEY: hackathonKey() } })
  : spawn('gemini', cliArgs, { cwd, stdio: 'inherit', shell: true, env: { ...process.env, GEMINI_API_KEY: hackathonKey() } });
child.on('error', (e) => { console.error(`could not start the Gemini CLI: ${e.message}`); process.exit(1); });
child.on('exit', (code) => process.exit(code ?? 1));
