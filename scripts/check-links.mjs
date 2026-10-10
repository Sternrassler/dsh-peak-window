#!/usr/bin/env node
/**
 * Checks the relative links and anchors in the tracked Markdown files:
 * a relative target must exist, and a `#fragment` must match a heading (or an
 * explicit `id="…"` anchor) in the target document.
 *
 *   node scripts/check-links.mjs   # exits non-zero when a link is broken
 *
 * External http(s) targets are not fetched: that would make the gate depend on
 * the network. The merge gate in CI runs this script.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = process.cwd();

/** Directories that never contain documentation we care about. */
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git', '.npm-cache']);

/** GitHub-style anchor slug for a Markdown heading. */
export function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-');
}

/** All anchors a document offers: heading slugs plus explicit HTML ids. */
export function anchorsOf(text) {
  const anchors = new Set();
  for (const line of text.split('\n')) {
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading !== null) anchors.add(slugify(heading[1]));
    for (const id of line.matchAll(/<a\s+id="([^"]+)"/g)) anchors.add(id[1]);
    for (const attr of line.matchAll(/\sid="([^"]+)"/g)) anchors.add(attr[1]);
  }
  return anchors;
}

/** Resolves a link target to a path relative to the repo root. */
export function resolveTarget(file, target) {
  return resolve(root, dirname(file), decodeURIComponent(target));
}

function markdownFilesOnDisk(directory = root) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      files.push(...markdownFilesOnDisk(join(directory, entry.name)));
    } else if (entry.name.endsWith('.md')) {
      files.push(relative(root, join(directory, entry.name)));
    }
  }
  return files;
}

/**
 * Tracked Markdown files, falling back to a directory walk when git is not
 * available (the check also runs from an installed package).
 */
function markdownFiles() {
  try {
    const tracked = execFileSync('git', ['ls-files', '*.md'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter((file) => file.length > 0);
    if (tracked.length > 0) return tracked;
  } catch {
    // no git repository or no git binary
  }
  return markdownFilesOnDisk();
}

function main() {
  const findings = [];
  let checked = 0;

  for (const file of markdownFiles()) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      const raw = match[1].replace(/^<|>$/g, '');
      if (/^([a-z][a-z0-9+.-]*:|#)/i.test(raw) && !raw.startsWith('#')) continue;
      checked += 1;

      const [target, fragment] = raw.split('#');
      let document = file;
      if (target.length > 0) {
        const absolute = resolveTarget(file, target);
        if (!existsSync(absolute)) {
          findings.push(`${file}: missing target ${target}`);
          continue;
        }
        if (statSync(absolute).isDirectory()) continue;
        document = join(root, absolute.slice(root.length).replace(/^\//, ''));
      }
      if (fragment === undefined || fragment.length === 0) continue;

      const anchors = anchorsOf(readFileSync(document, 'utf8'));
      if (!anchors.has(fragment)) {
        findings.push(`${file}: missing anchor #${fragment} in ${target || 'this file'}`);
      }
    }
  }

  for (const finding of findings) console.error(`broken link — ${finding}`);
  if (findings.length > 0) {
    console.error(`check-links: ${findings.length} broken of ${checked} checked`);
    process.exitCode = 1;
  } else {
    console.log(`check-links: ${checked} relative links checked, all resolvable`);
  }
}

if (process.argv[1]?.endsWith('check-links.mjs')) main();
