#!/usr/bin/env node
import { discoverCraftCli, checkCodex, execCodex } from './codex.js';
import { writeConfig, configPath } from './config.js';
import { startProxy } from './mcp.js';
import { loadSession, saveSession } from './session.js';
import { initProject, loadProject, updateProject } from './project.js';
import { studyUrl } from './study.js';
import path from 'node:path';

const argv = process.argv.slice(2), command = argv[0] || 'doctor';
const flag = name => argv.includes(name);
const value = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
function out(x) { process.stdout.write(typeof x === 'string' ? x + '\n' : JSON.stringify(x, null, 2) + '\n'); }

if (command === 'init') {
  const project = path.resolve(value('--project') || argv[1] || process.cwd());
  out(initProject(project, { target: value('--target'), request: value('--request') || '' }));
} else if (command === 'study') {
  const project = path.resolve(value('--project') || process.cwd()); const target = value('--url') || loadProject(project)?.target;
  if (!target) throw new Error('study requires --url or a project target');
  const evidence = await studyUrl(project, target); updateProject(project, { target, status: 'studied' }); out(evidence);
} else if (command === 'status') {
  const project = path.resolve(value('--project') || process.cwd()); const state = loadProject(project);
  if (!state) { out({ error: 'not a craft-codex project' }); process.exitCode = 1; } else out(state);
} else if (command === 'build') {
  const project = path.resolve(value('--project') || process.cwd()); const state = loadProject(project); if (!state) throw new Error('run init first');
  const prompt = value('--prompt') || state.request || `Recreate the studied target ${state.target || ''}. Read evidence/page.json and build the app in app/.`; updateProject(project, { request: prompt, status: 'building' });
  const previous = loadSession(project); const args = previous?.thread_id ? ['exec', '--sandbox', 'workspace-write', 'resume', previous.thread_id] : ['exec', '--sandbox', 'workspace-write'];
  const result = await execCodex(value('--codex') || 'codex', args, prompt, { cwd: project }); process.stdout.write(result.stdout); if (result.stderr) process.stderr.write(result.stderr);
  if (result.code === 0) updateProject(project, { status: 'built' }); process.exitCode = result.code;
} else if (command === 'doctor') {
  const craft = await discoverCraftCli(); const codex = await checkCodex(value('--codex') || 'codex');
  out({ craft_anything: craft || { available: false }, codex }); process.exitCode = craft && codex.executable ? 0 : 1;
} else if (command === 'setup') {
  const craft = await discoverCraftCli(); if (!craft) { out({ error: 'craft-anything-cli not found' }); process.exitCode = 1; }
  else out(writeConfig({ command: craft.path, dryRun: flag('--dry-run'), file: value('--file') }));
} else if (command === 'mcp') {
  const craft = await discoverCraftCli(); if (!craft) throw new Error('craft-anything-cli not found'); startProxy({ craftCli: craft.path, allowRun: flag('--allow-run') });
} else if (command === 'resume') {
  const project = path.resolve(value('--project') || process.cwd()); const codex = value('--codex') || 'codex'; const prompt = value('--prompt') || '';
  const previous = loadSession(project); const args = previous?.thread_id ? ['exec', '--sandbox', 'workspace-write', 'resume', previous.thread_id] : ['exec', '--sandbox', 'workspace-write'];
  if (flag('--ephemeral') || flag('--worktree')) throw new Error('--ephemeral and --worktree are not supported by resumable sessions');
  const result = await execCodex(codex, args, prompt, { cwd: project });
  process.stdout.write(result.stdout); if (result.code !== 0) { process.stderr.write(result.stderr); if (!/no rollout found for thread id/i.test(result.stderr)) process.exitCode = result.code; }
  const match = result.stdout.match(/(?:thread|conversation)[ _-]?id\s*[:=]\s*([\w-]+)/i); if (match) saveSession(project, { thread_id: match[1], project_folder: project, codex_path: codex });
} else { out('Usage: craft-codex init|study|build|status|doctor|setup|mcp|resume'); process.exitCode = 2; }
