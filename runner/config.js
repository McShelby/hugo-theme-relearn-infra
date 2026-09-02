// Assembles the configuration directory a build is run against.
//
// Hugo reads one config directory, and only `_default/` and `<env>/` beneath
// it. A site's own `config/` therefore cannot be layered onto from outside, so
// the runner builds a directory of its own: the site's `_default` copied
// verbatim, and one environment directory holding the environment and this
// build's axes merged together.
//
// `_default` is copied rather than parsed on purpose. It is where the filename
// convention gets awkward - language-suffixed names, `module.toml`,
// `languages.toml` - and copying it leaves all of that with Hugo.

import fs from 'fs';
import path from 'path';
import * as TOML from 'js-toml';
import { infraRoot } from './paths.js';

/** Filenames Hugo merges at the root instead of under a key of their own. */
const ROOT_NAMES = new Set(['hugo', 'config']);

/** The environment a build gets when its case names none. */
export const DEFAULT_ENVIRONMENT = 'production';

const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Hugo lowercases every configuration key. So does this. */
function lower(value) {
  if (Array.isArray(value)) {
    return value.map(lower);
  }
  if (isMap(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k.toLowerCase()] = lower(v);
    }
    return out;
  }
  return value;
}

/**
 * Merge `source` onto `target` the way Hugo's own config provider does: deep
 * where both sides are maps, replace otherwise - slices included. Later wins.
 */
export function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (isMap(target[key]) && isMap(value)) {
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

/**
 * Read a config directory into a single document.
 *
 * A file named `hugo` or `config` merges at the root. Any other name wraps the
 * file under its own basename - `params.toml` holding `a = 1` becomes
 * `params.a` - unless the file's sole top-level key already equals that
 * basename, in which case it is taken as it stands. A file holding both a
 * matching key and something else unwraps neither, which is surprising but is
 * what Hugo does.
 *
 * Files are read in lexical order, which is the order Hugo reads them in.
 */
export function flattenDir(dir) {
  if (!dir || !fs.existsSync(dir)) {
    return null;
  }

  const names = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();

  const result = {};
  for (const name of names) {
    const where = path.join(dir, name);
    const ext = path.extname(name);
    const base = path.basename(name, ext);

    if (ext.toLowerCase() !== '.toml') {
      throw new Error(`${where}: flattening reads TOML only; ${ext || 'no extension'} is not mapped.`);
    }
    if (base.includes('.')) {
      throw new Error(`${where}: language-suffixed config names are not mapped.`);
    }

    const doc = lower(TOML.load(fs.readFileSync(where, 'utf8')) || {});
    const key = base.toLowerCase();

    if (ROOT_NAMES.has(key)) {
      merge(result, doc);
      continue;
    }

    const keys = Object.keys(doc);
    const sole = keys.length === 1 && keys[0] === key;
    merge(result, { [key]: sole ? doc[key] : doc });
  }

  return result;
}

/** Where infra keeps the environments it supplies for sites that have none. */
export function infraEnvironmentDir(name) {
  return path.join(infraRoot, 'tests', 'environments', name);
}

/**
 * Find the directory an environment name refers to.
 *
 * A site answers for itself wherever it can; infra answers for sites that have
 * none of their own. Where both hold the name the two must be identical, so
 * which is read never has to be decided.
 *
 * `production` is exempt from having to resolve at all: it applies whether a
 * directory exists for it or not.
 */
export function resolveEnvironmentDir(siteDir, name) {
  const own = path.join(siteDir, 'config', name);
  const shared = infraEnvironmentDir(name);
  const hasOwn = fs.existsSync(own);
  const hasShared = fs.existsSync(shared);

  if (hasOwn && hasShared) {
    const a = JSON.stringify(flattenDir(own));
    const b = JSON.stringify(flattenDir(shared));
    if (a !== b) {
      throw new Error(
        `environment "${name}" is held by both the site and infra, and the two differ:\n` +
          `  ${own}\n  ${shared}\n` +
          'They must be identical, or one of them must go.'
      );
    }
    return own;
  }

  if (hasOwn) return own;
  if (hasShared) return shared;
  if (name === DEFAULT_ENVIRONMENT) return null;

  throw new Error(
    `environment "${name}" resolves to no directory. Looked in:\n  ${own}\n  ${shared}`
  );
}

/**
 * Build the config directory for one build and return its path.
 *
 * `layers` are directories merged in config order - the environment first,
 * then this build's axis values - into a single `<env>/hugo.json`. JSON
 * because Hugo takes it exactly as it takes TOML, and because writing it needs
 * no serialiser we do not already have.
 */
export function assemble({ outDir, siteDir, environment, layers = [] }) {
  fs.mkdirSync(outDir, { recursive: true });

  const ownDefault = path.join(siteDir, 'config', '_default');
  if (fs.existsSync(ownDefault)) {
    fs.cpSync(ownDefault, path.join(outDir, '_default'), { recursive: true });
  } else {
    // Hugo reads only `_default/` and `<env>/` beneath a config directory, and
    // ignores a directory that has neither without a word. The level always
    // exists, even when the site keeps its configuration in a root hugo.toml.
    fs.mkdirSync(path.join(outDir, '_default'), { recursive: true });
  }

  const merged = {};
  for (const dir of layers) {
    const doc = flattenDir(dir);
    if (doc) {
      merge(merged, doc);
    }
  }

  const envDir = path.join(outDir, environment);
  fs.mkdirSync(envDir, { recursive: true });
  fs.writeFileSync(path.join(envDir, 'hugo.json'), JSON.stringify(merged, null, 2), 'utf8');

  return outDir;
}
