import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

export function candidatePaths(env = process.env) {
  const out = [];
  if (env.CRAFT_ANYTHING_CLI) out.push(env.CRAFT_ANYTHING_CLI);
  out.push('craft-anything-cli');
  const home = env.HOME || os.homedir();
  for (const root of [path.join(home, 'Applications'), '/Applications']) {
    out.push(path.join(root, 'Craft Anything.app/Contents/MacOS/craft-anything-cli'));
    out.push(path.join(root, 'ChatGPT.app/Contents/Resources/craft-anything-cli'));
    out.push(path.join(root, 'Codex.app/Contents/Resources/craft-anything-cli'));
  }
  return [...new Set(out)];
}

function run(file, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(file, args, { cwd: options.cwd, env: options.env || process.env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d);
    if (options.input) child.stdin.end(options.input); else child.stdin.end();
    child.on('error', error => resolve({ code: -1, stdout, stderr, error }));
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

export async function discoverCraftCli(env = process.env) {
  for (const candidate of candidatePaths(env)) {
    if (candidate.includes(path.sep) && (!fs.existsSync(candidate) || !fs.statSync(candidate).mode.toString(8).endsWith('755') && !(fs.statSync(candidate).mode & 0o111))) continue;
    const result = await run(candidate, ['--version'], { env });
    if (result.code === 0) return { path: candidate, version: result.stdout.trim() || 'unknown' };
  }
  return null;
}

export async function checkCodex(codex = 'codex', env = process.env) {
  const version = await run(codex, ['--version'], { env });
  const login = await run(codex, ['login', 'status'], { env });
  const text = `${login.stdout}\n${login.stderr}`.toLowerCase();
  // Negative account states must win over broad "logged in" matches.
  const signedIn = /not logged in|not authenticated|unauthenticated|sign in required|not signed in/.test(text)
    ? false
    : /logged in|authenticated|signed in/.test(text) ? true : null;
  return { executable: version.code === 0, version: version.stdout.trim(), signedIn, loginError: login.code !== 0 ? login.stderr.trim() : undefined };
}

export async function execCodex(codex, args, input, options = {}) {
  return run(codex, args, { ...options, input });
}
