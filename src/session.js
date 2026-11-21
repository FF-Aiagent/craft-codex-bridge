import fs from 'node:fs';
import path from 'node:path';
export function sessionFile(project) { return path.join(project, '.craft-codex-session.json'); }
export function loadSession(project) { try { return JSON.parse(fs.readFileSync(sessionFile(project), 'utf8')); } catch { return null; } }
export function saveSession(project, data) { fs.mkdirSync(project, { recursive: true }); fs.writeFileSync(sessionFile(project), JSON.stringify({ ...data, last_seen_at: new Date().toISOString() }, null, 2) + '\n'); }
