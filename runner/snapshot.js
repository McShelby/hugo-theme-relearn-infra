// Golden-file comparison of a built site against committed expected output.
//
// The `testing` environment makes Hugo's output deterministic
// (disableAssetsBusting, disableRandomIds, disableGeneratorVersion, minify
// off), which is what makes byte comparison viable at all. Anything still
// volatile after that belongs in `normalize()` below, not in a fuzzy compare.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/** Text files get newline-normalised so baselines survive a CRLF checkout. */
const TEXT = new Set(['.html', '.xml', '.json', '.css', '.js', '.txt', '.md', '.svg']);

function normalize(file, buf) {
  if (!TEXT.has(path.extname(file).toLowerCase())) {
    return buf;
  }
  return Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
}

/**
 * Every file below `root`, as sorted relative paths with forward slashes.
 *
 * Forward slashes because the same baseline is compared on Windows and on
 * Linux, and a separator is not a difference worth failing over.
 */
function walk(root) {
  return fs
    .readdirSync(root, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .sort();
}

/** Map of relative path -> md5 of normalised content. */
export function fingerprint(root) {
  const map = new Map();
  for (const rel of walk(root)) {
    const buf = normalize(rel, fs.readFileSync(path.join(root, rel)));
    map.set(rel, crypto.createHash('md5').update(buf).digest('hex'));
  }
  return map;
}

/**
 * Compare a freshly built tree against expected output.
 *
 * Returns { missing, unexpected, changed } - all relative paths.
 */
export function compare(expectedDir, actualDir) {
  if (!fs.existsSync(expectedDir)) {
    return { missing: [], unexpected: [], changed: [], noBaseline: true };
  }
  const expected = fingerprint(expectedDir);
  const actual = fingerprint(actualDir);

  const missing = [...expected.keys()].filter((k) => !actual.has(k));
  const unexpected = [...actual.keys()].filter((k) => !expected.has(k));
  const changed = [...expected.keys()].filter((k) => actual.has(k) && actual.get(k) !== expected.get(k));

  return { missing, unexpected, changed, noBaseline: false };
}

/** Replace one tree with another. */
export function copyTree(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

/** Replace the expected tree with the actual one. */
export function update(expectedDir, actualDir) {
  copyTree(actualDir, expectedDir);
}

/**
 * A sorted listing of every output file.
 *
 * Cheap to store and to review, and it catches the failure the golden files
 * cannot: pages that stop being generated at all. Used at the files layer,
 * where full content would churn on every prose edit.
 */
export function listing(root) {
  return walk(root).join('\n') + '\n';
}
