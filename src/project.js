import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function manifestPath(project) { return path.join(project, 'craft-codex.json'); }
export function loadProject(project) { try { return JSON.parse(fs.readFileSync(manifestPath(project), 'utf8')); } catch { return null; } }
export function initProject(project, { target, request }) {
  fs.mkdirSync(project, { recursive: true });
  for (const dir of ['evidence', 'app', 'checks']) fs.mkdirSync(path.join(project, dir), { recursive: true });
  const manifest = { version: 1, id: crypto.randomUUID(), target: target || null, request: request || '', status: 'ready-to-study', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  fs.writeFileSync(manifestPath(project), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
export function updateProject(project, patch) { const current = loadProject(project); if (!current) throw new Error('not a craft-codex project'); const next = { ...current, ...patch, updated_at: new Date().toISOString() }; fs.writeFileSync(manifestPath(project), JSON.stringify(next, null, 2) + '\n'); return next; }
export function writeEvidence(project, name, value) { const dir = path.join(project, 'evidence'); fs.mkdirSync(dir, { recursive: true }); const file = path.join(dir, name); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); return file; }
