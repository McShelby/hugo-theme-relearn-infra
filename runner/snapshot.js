// Golden-file comparison of a built site against committed expected output.
//
// The `testing` environment makes Hugo's output deterministic
// (disableAssetsBusting, disableRandomIds, disableGeneratorVersion, minify
// off), which is what makes byte comparison viable at all.
//
// The comparison is over raw bytes, line endings included. Both repositories
// check out with `eol=lf`, so output is LF whoever built it, and a CRLF file
// is a defect to fail over rather than something to normalise away. Nor could
// normalising ever have covered the whole problem: asset busting hashes a file
// into its published name, so a stray CRLF renames a file, and no amount of
// content normalisation reaches that.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/** The extensions a line-ending difference is worth diagnosing for. */
const TEXT = new Set(['.html', '.xml', '.json', '.css', '.js', '.txt', '.md', '.svg']);

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

/** Map of relative path -> md5 of the file's bytes, exactly as they lie. */
export function fingerprint(root) {
  const map = new Map();
  for (const rel of walk(root)) {
    map.set(rel, crypto.createHash('md5').update(fs.readFileSync(path.join(root, rel))).digest('hex'));
  }
  return map;
}

/**
 * Of the differing files, those that differ in nothing but their line endings.
 *
 * This should not happen. When it does the cause is almost always a file some
 * editor rewrote as CRLF, and Git is unhelpful about saying so: `git status`
 * marks it modified while `git diff` shows nothing at all, because the clean
 * filter normalises the line endings away before comparing. Named plainly the
 * fix takes a moment - delete the file and check it out again; left as a
 * whole-file diff it reads as a content regression.
 */
function lineEndingOnly(expectedDir, actualDir, differing) {
  const eol = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return differing.filter((rel) => {
    if (!TEXT.has(path.extname(rel).toLowerCase())) {
      return false;
    }
    return eol(path.join(expectedDir, rel)) === eol(path.join(actualDir, rel));
  });
}

/**
 * Compare a freshly built tree against expected output.
 *
 * Returns { missing, unexpected, changed, lineEndings } - all relative paths.
 * A file differing only in its line endings is reported as `lineEndings` and
 * not also as `changed`, so each one is named once and named for what it is.
 */
export function compare(expectedDir, actualDir) {
  if (!fs.existsSync(expectedDir)) {
    return { missing: [], unexpected: [], changed: [], lineEndings: [], noBaseline: true };
  }
  const expected = fingerprint(expectedDir);
  const actual = fingerprint(actualDir);

  const missing = [...expected.keys()].filter((k) => !actual.has(k));
  const unexpected = [...actual.keys()].filter((k) => !expected.has(k));
  const differing = [...expected.keys()].filter((k) => actual.has(k) && actual.get(k) !== expected.get(k));

  const lineEndings = lineEndingOnly(expectedDir, actualDir, differing);
  const changed = differing.filter((k) => !lineEndings.includes(k));

  return { missing, unexpected, changed, lineEndings, noBaseline: false };
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
