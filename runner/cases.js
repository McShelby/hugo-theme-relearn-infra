// Reads the case files and expands them into the builds a run performs.
//
// A case is a sequence of builds. Almost every case is a sequence of one and is
// written flat; a case whose builds only mean something together spells the
// sequence out with `[[builds]]` and shares one output tree between them.

import fs from 'fs';
import path from 'path';
import * as TOML from 'js-toml';
import { infraRoot } from './paths.js';

export const LAYERS = ['build', 'files', 'content'];
const DEFAULT_LAYER = 'content';

const CASES_DIR = path.join(infraRoot, 'tests', 'cases');
const SITES_DIR = path.join(infraRoot, 'tests', 'sites');
const AXES_DIR = path.join(infraRoot, 'tests', 'axes');

const CASE_KEYS = new Set(['site', 'environment', 'layer', 'axes', 'builds']);
const BUILD_KEYS = new Set(['site', 'environment', 'axes', 'dest']);

class CaseError extends Error {}

const fail = (where, message) => {
  throw new CaseError(`${where}: ${message}`);
};

/** Reject a key the schema does not have, rather than ignore it into silence. */
function checkKeys(obj, allowed, where) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      fail(where, `unknown key "${key}". Valid keys: ${[...allowed].sort().join(', ')}.`);
    }
  }
}

/**
 * Where a site lives.
 *
 * A bare name is a directory under `tests/sites/`. An `@theme` suffix resolves
 * against the theme checkout instead, so `docs@theme` is the theme's own
 * `docs/` - which also settles whether the runner has to supply the theme:
 * a site inside the theme resolves it itself.
 */
export function resolveSite(name, themeDir, where) {
  const atTheme = name.endsWith('@theme');
  const dir = atTheme ? path.join(themeDir, name.slice(0, -'@theme'.length)) : path.join(SITES_DIR, name);

  if (!fs.existsSync(dir)) {
    fail(where, `site "${name}" does not exist. Looked in ${dir}.`);
  }
  return { name, dir, injectTheme: !atTheme };
}

/** Infra's directory for a site, which for a theme site holds only metadata. */
export function siteMetaDir(name) {
  return path.join(SITES_DIR, name);
}

function axisValueDir(axis, value, where, axesDir) {
  const dir = path.join(axesDir, axis, value);
  if (!fs.existsSync(dir)) {
    fail(where, `axis "${axis}" has no value "${value}". Looked in ${dir}.`);
  }
  return dir;
}

/** One name, or an array of them. Anything else is a mistake worth naming. */
function axisValues(axis, raw, where) {
  const values = Array.isArray(raw) ? raw : [raw];
  if (!values.length || values.some((v) => typeof v !== 'string')) {
    fail(where, `axis "${axis}" must be a value or a list of values.`);
  }
  return values;
}

/**
 * Expand `[axes]` into combinations.
 *
 * Every axis is merged in; only multi-valued axes branch the tree, and they
 * nest alphabetically by axis name. That is deliberately not the order the case
 * lists them in - that order decides which config wins, and tying the two
 * together would rename every golden directory whenever precedence changed.
 */
function combinations(axes, where, axesDir) {
  const names = Object.keys(axes);
  let out = [{ segments: [], layers: [] }];

  for (const axis of names) {
    const values = axisValues(axis, axes[axis], where);
    out = out.flatMap((combo) =>
      values.map((value) => ({
        segments: combo.segments.concat(values.length > 1 ? [[axis, `${axis}-${value}`]] : []),
        layers: combo.layers.concat([axisValueDir(axis, value, where, axesDir)]),
      }))
    );
  }

  return out.map((combo) => ({
    // Config order is the order the case lists its axes; nesting is
    // alphabetical. Two orders, neither borrowed from the other.
    segments: combo.segments.sort(([a], [b]) => a.localeCompare(b)).map(([, seg]) => seg),
    layers: combo.layers,
  }));
}

function environmentOf(raw, where) {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') {
    fail(where, '`environment` takes one name, not a list.');
  }
  if (raw === '_default') {
    fail(where, '`_default` is not selectable; Hugo loads it for every build.');
  }
  return raw;
}

function destOf(raw, where) {
  if (raw === undefined) return '';
  if (typeof raw !== 'string') {
    fail(where, '`dest` must be a path.');
  }
  const normalised = path.normalize(raw).replace(/\\/g, '/');
  if (path.isAbsolute(raw) || normalised === '..' || normalised.startsWith('../')) {
    fail(where, `dest "${raw}" leaves the result root.`);
  }
  return normalised === '.' ? '' : normalised;
}

function layerOf(raw, where) {
  if (raw === undefined) return DEFAULT_LAYER;
  if (!LAYERS.includes(raw)) {
    fail(where, `layer "${raw}" is not one of ${LAYERS.join(', ')}.`);
  }
  return raw;
}

/** One build of a sequence: every axis pinned to exactly one value. */
function sequenceBuild(entry, themeDir, index, where, axesDir) {
  checkKeys(entry, BUILD_KEYS, where);
  if (entry.site === undefined) {
    fail(where, 'a build must name a site.');
  }

  const axes = entry.axes || {};
  for (const [axis, raw] of Object.entries(axes)) {
    if (axisValues(axis, raw, where).length !== 1) {
      fail(where, `axis "${axis}" carries more than one value; a sequence build is one build.`);
    }
  }

  const [combo] = combinations(axes, where, axesDir);
  return {
    ...resolveSite(entry.site, themeDir, where),
    environment: environmentOf(entry.environment, where),
    layers: combo.layers,
    dest: destOf(entry.dest, where),
    index,
  };
}

/**
 * Read one `case.toml` and expand it into the results it produces.
 *
 * `casesDir` is a parameter so the checks can point at synthetic cases without
 * writing them into the real ones.
 */
export function loadCase(name, themeDir, { casesDir = CASES_DIR, axesDir = AXES_DIR } = {}) {
  const file = path.join(casesDir, name, 'case.toml');
  const where = path.relative(infraRoot, file).replace(/\\/g, '/');
  const doc = TOML.load(fs.readFileSync(file, 'utf8')) || {};

  checkKeys(doc, CASE_KEYS, where);
  const layer = layerOf(doc.layer, where);

  if (doc.builds !== undefined) {
    for (const key of ['site', 'environment', 'axes']) {
      if (doc[key] !== undefined) {
        fail(where, `a case with [[builds]] cannot also declare \`${key}\` at the top level.`);
      }
    }
    if (!Array.isArray(doc.builds) || !doc.builds.length) {
      fail(where, '[[builds]] must hold at least one build.');
    }
    return {
      name,
      layer,
      results: [
        { name, builds: doc.builds.map((e, i) => sequenceBuild(e, themeDir, i, where, axesDir)) },
      ],
    };
  }

  if (doc.site === undefined) {
    fail(where, 'a case must name a site.');
  }

  const site = resolveSite(doc.site, themeDir, where);
  const environment = environmentOf(doc.environment, where);

  return {
    name,
    layer,
    results: combinations(doc.axes || {}, where, axesDir).map((combo) => ({
      name: [name, ...combo.segments].join('/'),
      builds: [{ ...site, environment, layers: combo.layers, dest: '', index: 0 }],
    })),
  };
}

/** Every case, in directory order, expanded. */
export function loadCases(themeDir, opts = {}) {
  const casesDir = opts.casesDir || CASES_DIR;
  if (!fs.existsSync(casesDir)) {
    return [];
  }
  return fs
    .readdirSync(casesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .map((name) => loadCase(name, themeDir, opts));
}

export { CaseError };
