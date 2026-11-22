import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeCraftServer, writeConfig } from '../src/config.js';
import { checkCodex } from '../src/codex.js';
import { saveSession, loadSession } from '../src/session.js';

test('merges server while preserving unrelated config', () => {
  const input = '# keep me\n[mcp_servers.other]\ncommand = "other"\n';
  const output = mergeCraftServer(input, { command: '/tmp/craft-anything-cli' });
  assert.match(output, /# keep me/);
  assert.match(output, /\[mcp_servers\.other\]/);
  assert.match(output, /\[mcp_servers\.craft-codex\]/);
});

test('updates existing craft-codex section idempotently', () => {
  const first = mergeCraftServer('', { command: '/tmp/cli' });
  const second = mergeCraftServer(first, { command: '/tmp/cli' });
  assert.equal(second, first);
});

test('dry run does not write config', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-codex-'));
  const file = path.join(dir, 'config.toml');
  const result = writeConfig({ file, command: '/tmp/cli', dryRun: true });
  assert.equal(result.changed, true);
  assert.equal(fs.existsSync(file), false);
});

test('session metadata round trips without credentials', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-codex-project-'));
  saveSession(dir, { thread_id: 'abc', project_folder: dir });
  assert.deepEqual(loadSession(dir).thread_id, 'abc');
  assert.equal(loadSession(dir).token, undefined);
});

test('codex login parser prioritizes signed-out state', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-codex-bin-'));
  const fake = path.join(dir, 'codex');
  fs.writeFileSync(fake, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo codex-cli 0.1; else echo "Not logged in"; fi\n');
  fs.chmodSync(fake, 0o755);
  const result = await checkCodex(fake, process.env);
  assert.equal(result.executable, true);
  assert.equal(result.signedIn, false);
});
import { initProject, loadProject, updateProject, writeEvidence } from '../src/project.js';
import { studyUrl } from '../src/study.js';

test('project lifecycle creates manifest and evidence folders', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-codex-app-'));
  const state = initProject(dir, { target: 'https://example.com', request: 'Recreate it' });
  assert.equal(state.status, 'ready-to-study');
  assert.equal(loadProject(dir).target, 'https://example.com');
  assert.equal(fs.existsSync(path.join(dir, 'evidence')), true);
  assert.equal(fs.existsSync(path.join(dir, 'app')), true);
});

test('project errors are persisted and evidence creates its directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-codex-error-'));
  initProject(dir, { target: 'https://invalid.local', request: '' });
  updateProject(dir, { status: 'study-failed', last_error: 'ENOTFOUND' });
  writeEvidence(dir, 'nested.json', { ok: true });
  assert.equal(loadProject(dir).status, 'study-failed');
  assert.equal(fs.existsSync(path.join(dir, 'evidence', 'nested.json')), true);
});

test('study reports network failures with a stable prefix', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-codex-study-'));
  await assert.rejects(() => studyUrl(dir, 'http://nonexistent.invalid/'), /study failed:/);
});
