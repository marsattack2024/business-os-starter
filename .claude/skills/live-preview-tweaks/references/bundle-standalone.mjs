#!/usr/bin/env node
/**
 * bundle-standalone.mjs
 *
 * Generates a single self-contained HTML file from a built Next.js page.
 * All CSS, JS, and images are inlined as base64 data URIs.
 *
 * Usage:
 *   node scripts/bundle-standalone.mjs <url-or-path> <output.html>
 *
 * Examples:
 *   node scripts/bundle-standalone.mjs http://localhost:3000/dental-landing dist/preview.html
 *   node scripts/bundle-standalone.mjs https://my-vercel-preview.vercel.app/landing dist/client-v1.html
 */

import fs from 'fs/promises';
import path from 'path';

const [,, sourceUrl, outputPath] = process.argv;

if (!sourceUrl || !outputPath) {
  console.error('Usage: node bundle-standalone.mjs <url> <output.html>');
  process.exit(1);
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return { buffer: await res.arrayBuffer(), contentType: res.headers.get('content-type') ?? '' };
}

async function toBase64DataUri(url, baseUrl) {
  try {
    const fullUrl = url.startsWith('http') ? url : new URL(url, baseUrl).href;
    const { buffer, contentType } = await fetchBuffer(fullUrl);
    const mime = contentType.split(';')[0].trim() || guessMime(url);
    const b64 = Buffer.from(buffer).toString('base64');
    return `data:${mime};base64,${b64}`;
  } catch (e) {
    console.warn(`  [skip] ${url} — ${e.message}`);
    return url; // fallback to original URL
  }
}

function guessMime(url) {
  if (url.endsWith('.css'))  return 'text/css';
  if (url.endsWith('.js'))   return 'application/javascript';
  if (url.endsWith('.woff2'))return 'font/woff2';
  if (url.endsWith('.woff')) return 'font/woff';
  if (url.endsWith('.png'))  return 'image/png';
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
  if (url.endsWith('.webp')) return 'image/webp';
  if (url.endsWith('.svg'))  return 'image/svg+xml';
  return 'application/octet-stream';
}

async function main() {
  console.log(`Fetching ${sourceUrl}...`);
  const { buffer } = await fetchBuffer(sourceUrl);
  let html = Buffer.from(buffer).toString('utf8');

  const baseUrl = sourceUrl.startsWith('http')
    ? new URL(sourceUrl).origin
    : `http://localhost:3000`;

  // Inline <link rel="stylesheet" href="...">
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi;
  const cssMatches = [...html.matchAll(linkRe)];
  for (const m of cssMatches) {
    const href = m[1];
    if (href.startsWith('data:')) continue;
    console.log(`  CSS: ${href}`);
    const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
    try {
      const { buffer: cssBuffer } = await fetchBuffer(fullUrl);
      let css = Buffer.from(cssBuffer).toString('utf8');
      // Inline @font-face src URLs within the CSS
      const fontUrlRe = /url\(["']?(https?:\/\/[^"')]+)["']?\)/g;
      const fontMatches = [...css.matchAll(fontUrlRe)];
      for (const fm of fontMatches) {
        const fontUri = await toBase64DataUri(fm[1], baseUrl);
        css = css.replace(fm[0], `url("${fontUri}")`);
      }
      html = html.replace(m[0], `<style>${css}</style>`);
    } catch (e) {
      console.warn(`  [skip CSS] ${href}`);
    }
  }

  // Inline <script src="...">
  const scriptRe = /<script([^>]+)src=["']([^"']+)["']([^>]*)><\/script>/gi;
  const scriptMatches = [...html.matchAll(scriptRe)];
  for (const m of scriptMatches) {
    const src = m[2];
    if (src.startsWith('data:')) continue;
    console.log(`  JS: ${src}`);
    const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
    try {
      const { buffer: jsBuffer } = await fetchBuffer(fullUrl);
      const js = Buffer.from(jsBuffer).toString('utf8');
      // Strip integrity + crossorigin (not valid for inlined content)
      html = html.replace(m[0], `<script${m[1].replace(/\s+integrity="[^"]*"/gi,'').replace(/\s+crossorigin="[^"]*"/gi,'')}>${js}</script>`);
    } catch (e) {
      console.warn(`  [skip JS] ${src}`);
    }
  }

  // Inline <img src="..."> and background-image URLs in style attrs
  const imgRe = /<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi;
  const imgMatches = [...html.matchAll(imgRe)];
  for (const m of imgMatches) {
    const src = m[2];
    if (src.startsWith('data:') || src.startsWith('blob:')) continue;
    console.log(`  IMG: ${src}`);
    const uri = await toBase64DataUri(src, baseUrl);
    html = html.replace(m[0], `<img${m[1]}src="${uri}"${m[3]}>`);
  }

  // Strip integrity + crossorigin attributes globally (safe for self-contained file)
  html = html.replace(/\s+integrity="[^"]*"/gi, '');
  html = html.replace(/\s+crossorigin="[^"]*"/gi, '');

  // Write output
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, 'utf8');

  const stat = await fs.stat(outputPath);
  const kb = (stat.size / 1024).toFixed(0);
  console.log(`\nDone: ${outputPath} (${kb} KB)`);
  console.log('Share this single file with your client — no server needed.');
}

main().catch(err => { console.error(err); process.exit(1); });
