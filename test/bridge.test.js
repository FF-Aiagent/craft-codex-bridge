import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeCraftServer, writeConfig } from '../src/config.js';
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
