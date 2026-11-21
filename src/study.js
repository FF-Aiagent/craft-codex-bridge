import fs from 'node:fs';
import { writeEvidence } from './project.js';
export async function studyUrl(project, url) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'craft-codex-study/0.1' } });
  if (!response.ok) throw new Error(`study failed: HTTP ${response.status}`);
  const html = await response.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
  const links = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].slice(0, 100).map(m => m[1]);
  const evidence = { url: response.url, status: response.status, title, bytes: Buffer.byteLength(html), links, captured_at: new Date().toISOString() };
  writeEvidence(project, 'page.html', html); writeEvidence(project, 'page.json', evidence);
  return evidence;
}
