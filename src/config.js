import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function configPath(env = process.env) { return path.join(env.CODEX_HOME || path.join(env.HOME || os.homedir(), '.codex'), 'config.toml'); }

function quote(value) { return JSON.stringify(value); }
function findServer(text, name) {
  const re = new RegExp(`^\\[mcp_servers\\.${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\]\\s*$`, 'm');
  const match = re.exec(text); if (!match) return null;
  const start = match.index, rest = text.slice(start + match[0].length), next = rest.search(/^\[/m);
  return { start, end: next < 0 ? text.length : start + match[0].length + next };
}

export function mergeCraftServer(text, { command, args = ['mcp'], startupTimeout = 30, tools = { rebuild_start: { approval_mode: 'approve' } } }) {
  const block = `[mcp_servers.craft-codex]\ncommand = ${quote(command)}\nargs = ${quote(args)}\nstartup_timeout_sec = ${startupTimeout}\ntools = ${inlineTable(tools)}\n`;
  const section = findServer(text, 'craft-codex');
  if (!section) return `${text.trimEnd()}\n\n${block}`;
  return text.slice(0, section.start) + block + text.slice(section.end).replace(/^\n+/, '\n');
}
function inlineTable(value) {
  return `{ ${Object.entries(value).map(([k, v]) => `${k} = { ${Object.entries(v).map(([a,b]) => `${a} = ${quote(b)}`).join(', ')} }`).join(', ')} }`;
}
export function writeConfig(options = {}) {
  const file = options.file || configPath(options.env);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const updated = mergeCraftServer(current, options);
  if (options.dryRun) return { file, current, updated, changed: current !== updated };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (current) fs.writeFileSync(`${file}.craft-codex.backup`, current);
  fs.writeFileSync(file, updated);
  return { file, changed: current !== updated };
}
