// Resolves the theme under test and the Hugo executable to test it with.
//
// The theme is never vendored here. It is always an external checkout, so the
// same fixtures can be run against a working tree, a release tag or CI.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as TOML from 'js-toml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const infraRoot = path.resolve(__dirname, '..');

// Marker file that identifies a directory as a Relearn checkout.
const THEME_MARKER = path.join('layouts', 'partials', 'version.txt');

/**
 * Resolve the theme checkout to test against.
 *
 * Order: RELEARN_THEME_DIR, then a sibling of this repo, then a parent.
 *
 * The sibling is this checkout's own name without the `-infra` suffix, which
 * is the same rule CI applies to repository names. A `test-` copy of the pair
 * therefore resolves inside itself, and the production pair resolves exactly
 * as it did when the name was written out. Every candidate still has to carry
 * the marker file, so a name that does not end in `-infra` fails the lookup
 * rather than quietly resolving to this repository.
 */
export function resolveThemeDir() {
  const sibling = path.basename(infraRoot).replace(/-infra$/, '');
  const candidates = [
    process.env.RELEARN_THEME_DIR,
    path.resolve(infraRoot, '..', sibling),
    path.resolve(infraRoot, '..'),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, THEME_MARKER))) {
      return path.resolve(dir);
    }
  }

  throw new Error(
    `Relearn theme not found. Looked in:\n  ${candidates.join('\n  ')}\n` +
      'Set RELEARN_THEME_DIR to your theme checkout.'
  );
}

/** The theme's declared minimum Hugo version, from its hugo.toml. */
export function minHugoVersion(themeDir) {
  const parsed = TOML.load(fs.readFileSync(path.join(themeDir, 'hugo.toml'), 'utf8'));
  const min = parsed.module?.hugoVersion?.min;
  if (!min) {
    throw new Error('module.hugoVersion.min is not set in the theme hugo.toml');
  }
  return min.startsWith('v') ? min : `v${min}`;
}

/** The theme version string, used to label snapshots and screenshots. */
export function themeVersion(themeDir) {
  return fs.readFileSync(path.join(themeDir, THEME_MARKER), 'utf8').trim();
}

/**
 * Resolve a Hugo executable.
 *
 * `spec` is one of:
 *   'path'      use whatever `hugo` is on PATH (default)
 *   'min'       the theme's declared minimum
 *   'latest'    the newest release, resolved by hvm
 *   'vX.Y.Z'    that exact version
 *
 * HUGO_BIN overrides everything, so CI can point at a version it installed
 * itself without needing hvm at all.
 */
export function resolveHugoBin(spec, themeDir, siteDir) {
  if (process.env.HUGO_BIN) {
    return process.env.HUGO_BIN;
  }
  if (!spec || spec === 'path') {
    return (siteDir && hvmDotFileExecPath(siteDir)) || 'hugo';
  }

  // `latest` is a keyword hvm resolves itself, so it passes through untouched.
  let version;
  if (spec === 'min') {
    version = minHugoVersion(themeDir);
  } else if (spec === 'latest') {
    version = 'latest';
  } else if (spec.startsWith('v')) {
    version = spec;
  } else {
    version = `v${spec}`;
  }

  return hvmExecPath(`${version}/standard`);
}

// Resolving shells out to hvm twice, so keep the answer for the rest of the run.
const hvmCache = new Map();

/**
 * Honour an `.hvm` file beside a site, so building it picks the same Hugo an
 * interactive shell would pick in that directory.
 *
 * The file is never parsed - hvm reads it, exactly as its shell alias does,
 * which keeps the file format hvm's business rather than ours. Returns null
 * when there is no `.hvm`, or when hvm is not installed.
 *
 * A pin applies only to the site it sits beside, so one run can build
 * different sites with different Hugo versions. `--hugo` overrides every pin
 * and is the way to hold the whole run to one version.
 */
const dotFileCache = new Map();

function hvmDotFileExecPath(dir) {
  if (dotFileCache.has(dir)) {
    return dotFileCache.get(dir);
  }
  const resolved = queryDotFile(dir);
  dotFileCache.set(dir, resolved);
  return resolved;
}

function queryDotFile(dir) {
  if (!fs.existsSync(path.join(dir, '.hvm'))) {
    return null;
  }

  const cached = spawnSync('hvm', ['status', '--printExecPathCached'], { cwd: dir, encoding: 'utf8' });
  if (cached.status === 0 && cached.stdout.trim()) {
    return cached.stdout.trim();
  }

  // Named but not downloaded yet - fetch it, as the alias would.
  const fetch = spawnSync('hvm', ['use', '--useVersionInDotFile'], { cwd: dir, encoding: 'utf8' });
  if (fetch.error || fetch.status !== 0) {
    return null;
  }

  const retry = spawnSync('hvm', ['status', '--printExecPathCached'], { cwd: dir, encoding: 'utf8' });
  return retry.status === 0 && retry.stdout.trim() ? retry.stdout.trim() : null;
}

/**
 * Ask hvm where a given version lives, fetching it first if necessary.
 *
 * hvm is directory-scoped: it reads the version out of an `.hvm` file in the
 * working directory. Resolving therefore happens in a scratch directory, both
 * to keep `.hvm` files out of the repositories and so that pins a developer
 * has set for their own use cannot decide what the suite builds with.
 *
 * The edition is always `standard`, which is enough here because the theme
 * uses no Sass.
 */
function hvmExecPath(versionEdition) {
  if (hvmCache.has(versionEdition)) {
    return hvmCache.get(versionEdition);
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relearn-hvm-'));
  try {
    const use = spawnSync('hvm', ['use', versionEdition], { cwd: dir, encoding: 'utf8' });
    if (use.error || use.status !== 0) {
      throw new Error(
        `hvm could not provide Hugo ${versionEdition}.\n` +
          `${(use.stderr || use.error?.message || '').trim()}\n` +
          'Install hvm from https://github.com/jmooring/hvm, or set HUGO_BIN to a Hugo executable.'
      );
    }

    const query = spawnSync('hvm', ['status', '--printExecPathCached'], { cwd: dir, encoding: 'utf8' });
    const bin = (query.stdout || '').trim();
    if (query.status !== 0 || !bin) {
      throw new Error(`hvm reported no executable for ${versionEdition}.`);
    }

    hvmCache.set(versionEdition, bin);
    return bin;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
