import fs from 'node:fs';
import { writeEvidence } from './project.js';
export async function studyUrl(project, url) {
  let response;
  try {
    response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000), headers: { 'user-agent': 'craft-codex-study/0.1' } });
  } catch (error) {
    throw new Error(`study failed: ${error.cause?.code || error.message}`);
  }
  if (!response.ok) throw new Error(`study failed: HTTP ${response.status}`);
  const html = await response.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
  const links = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].slice(0, 100).map(m => m[1]);
  const evidence = { url: response.url, status: response.status, title, bytes: Buffer.byteLength(html), links, captured_at: new Date().toISOString() };
  writeEvidence(project, 'page.html', html); writeEvidence(project, 'page.json', evidence);
  return evidence;
}
