import readline from 'node:readline';
import { spawn } from 'node:child_process';

const blocked = new Set(['rebuild_start', 'build_command_run', 'assets_image_generate', 'assets_model_generate']);
export function startProxy({ craftCli, allowRun = false } = {}) {
  const child = spawn(craftCli, ['mcp', '--all-tools', ...(allowRun ? ['--allow-run'] : [])], { stdio: ['pipe', 'pipe', 'inherit'] });
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', line => {
    let req; try { req = JSON.parse(line); } catch { return; }
    if (req.method === 'tools/call' && blocked.has(req.params?.name) && !allowRun) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32010, message: `tool ${req.params.name} requires explicit run approval; restart with --allow-run or approve it in Codex` } }) + '\n');
      return;
    }
    child.stdin.write(line + '\n');
  });
  child.stdout.on('data', d => process.stdout.write(d));
  child.on('error', error => process.stderr.write(`craft-codex MCP backend failed: ${error.message}\n`));
  child.on('close', code => { if (code !== 0) process.stderr.write(`craft-codex MCP backend exited with code ${code}\n`); });
  return child;
}
