#!/usr/bin/env node
//
// Test runner for the Relearn theme.
//
//   npm test                            every case
//   npm test -- --build=minimal         one case, or one build inside it
//   npm test -- --hugo=min              the theme's declared minimum version
//   npm test -- --update                rewrite the expected output
//
// A case declares how deep to assert with `layer`. The build layer asserts the
// build succeeds without unaccepted warnings, the files layer asserts the set
// of generated files, and the content layer asserts their bytes. Layers are
// cumulative, and a case opts down rather than up.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from '../runner/hugo.js';
import { assemble, resolveEnvironmentDir, DEFAULT_ENVIRONMENT } from '../runner/config.js';
import { loadCases, siteMetaDir, LAYERS, CaseError } from '../runner/cases.js';
import { resolveThemeDir, themeVersion } from '../runner/paths.js';
import { compare, copyTree, listing, update } from '../runner/snapshot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPECTED_DIR = path.join(__dirname, 'expected');
const CASES_DIR = path.join(__dirname, 'cases');

// What a failing result actually produced, kept beside what it should have.
// Untracked: it exists to be diffed against `expected/` and then thrown away,
// locally by hand and in CI by uploading it off the runner.
const ACTUAL_DIR = path.join(__dirname, 'actual');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);

const only = flag('build', null);
const hugo = flag('hugo', 'path');
const updating = has('update');

const themeDir = resolveThemeDir();

/**
 * Stored output is only meaningful for the version that produced it.
 *
 * Hugo legitimately changes what it emits between releases - v0.141.0 writes a
 * `search/index.print.html` for the exampleSite that v0.165.0 does not - so
 * comparing a baseline against an older Hugo would assert something false.
 * Only the reference versions compare at all; everything else stops at the
 * build layer.
 */
const REFERENCE_VERSIONS = ['path', 'latest'];
const isReference = REFERENCE_VERSIONS.includes(hugo);

if (updating && !isReference) {
  console.error(`Refusing to update expected output from a non-reference Hugo (${hugo}).`);
  console.error(`Regenerate with one of: ${REFERENCE_VERSIONS.join(', ')}.`);
  process.exit(1);
}

let cases;
try {
  cases = loadCases(themeDir);
} catch (err) {
  if (err instanceof CaseError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}

const results = cases.flatMap((c) =>
  c.results.map((r) => ({ ...r, caseName: c.name, layer: c.layer }))
);

// `--build` matches a path prefix, so naming a case runs every build in it and
// naming a combination runs the one.
const targets = only
  ? results.filter((r) => r.name === only || r.name.startsWith(`${only}/`))
  : results;

if (!targets.length) {
  console.error(only ? `No such build: ${only}\n` : 'No cases found.\n');
  if (results.length) {
    console.error('Available:');
    for (const r of results) {
      console.error(`  ${r.name}`);
    }
  }
  process.exit(1);
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'relearn-tests-'));
const outcomes = [];

// Anything kept from a previous run describes a failure that has since been
// re-run, so it would only mislead.
fs.rmSync(ACTUAL_DIR, { recursive: true, force: true });

console.log(`theme   ${themeDir}`);
console.log(`version ${themeVersion(themeDir)}`);
console.log(`hugo    ${hugo}`);
console.log('');

for (const result of targets) {
  const failures = [];
  const notes = [];

  // The builds of a sequence share one tree, so it is emptied once here rather
  // than by each build - `--cleanDestinationDir` would have the second wipe
  // what the first wrote.
  const destDir = path.join(tmpRoot, ...result.name.split('/'));
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });

  let built = true;
  for (const b of result.builds) {
    const environment = b.environment || DEFAULT_ENVIRONMENT;
    let configDir;
    try {
      configDir = assemble({
        outDir: path.join(tmpRoot, `${result.name.replace(/\//g, '__')}.config.${b.index}`),
        siteDir: b.dir,
        environment,
        layers: [resolveEnvironmentDir(b.dir, environment), ...b.layers].filter(Boolean),
      });
    } catch (err) {
      failures.push(err.message);
      built = false;
      break;
    }

    const res = build({
      siteDir: b.dir,
      destDir: b.dest ? path.join(destDir, ...b.dest.split('/')) : destDir,
      themeDir,
      configDir,
      hugo,
      injectTheme: b.injectTheme,
      environment,
    });

    // Which Hugo actually ran is worth saying out loud. Without `--hugo` a
    // site with an `.hvm` beside it is built with the version that pins, so
    // one run can legitimately span several - and a result would otherwise
    // look like it came from whatever the header names.
    if (res.bin && res.bin !== 'hugo') {
      notes.push(hugo === 'path' ? `hugo from .hvm: ${res.bin}` : `hugo: ${res.bin}`);
    }

    if (res.code !== 0) {
      const panic = /fatal error:.*/.exec(`${res.stdout}\n${res.stderr}`);
      failures.push(`${b.name}: build exited with ${res.code}${panic ? `\n    ${panic[0].trim()}` : ''}`);
      built = false;
    }

    const warnings = unacceptedWarnings(result, b, `${res.stdout}\n${res.stderr}`);
    if (warnings.length) {
      failures.push(`${b.name}: ${warnings.length} warning(s):\n    ${warnings.join('\n    ')}`);
    }
  }

  // The effective layer is the shallower of what the case declares and what
  // the version allows.
  const declared = LAYERS.indexOf(result.layer);
  const allowed = isReference ? LAYERS.length - 1 : 0;
  const layer = LAYERS[Math.min(declared, allowed)];
  if (layer !== result.layer) {
    notes.push(`layer reduced to ${layer}: hugo=${hugo} is not a reference version`);
  }

  if (built && layer !== 'build') {
    const resultDir = path.join(EXPECTED_DIR, ...result.name.split('/'));
    const filesFile = path.join(resultDir, 'files.txt');
    const contentDir = path.join(resultDir, 'content');

    if (updating) {
      fs.mkdirSync(resultDir, { recursive: true });
      fs.writeFileSync(filesFile, listing(destDir), 'utf8');
      if (layer === 'content') {
        update(contentDir, destDir);
      } else {
        fs.rmSync(contentDir, { recursive: true, force: true });
      }
    } else if (!fs.existsSync(filesFile)) {
      failures.push('no expected output committed yet; run with --update');
    } else {
      const want = fs.readFileSync(filesFile, 'utf8').split('\n').filter(Boolean);
      const got = listing(destDir).split('\n').filter(Boolean);
      report(failures, 'missing output file(s)', want.filter((f) => !got.includes(f)));
      report(failures, 'unexpected output file(s)', got.filter((f) => !want.includes(f)));

      if (layer === 'content') {
        const diff = compare(contentDir, destDir);
        if (diff.noBaseline) {
          failures.push('no expected content committed yet; run with --update');
        } else {
          report(failures, 'missing', diff.missing);
          report(failures, 'unexpected', diff.unexpected);
          report(failures, 'changed', diff.changed);
        }
      }
    }
  }

  // A failure is far easier to read as a diff than as a list of paths, and in
  // CI the built tree is gone the moment the runner exits. Keep what it
  // actually produced, so `expected/` and `actual/` can be diffed directly.
  if (failures.length && fs.existsSync(destDir)) {
    const kept = path.join(ACTUAL_DIR, ...result.name.split('/'));
    copyTree(destDir, kept);
    notes.push(`output kept: ${path.relative(process.cwd(), kept)}`);
  }

  outcomes.push({ name: result.name, failures });
  const mark = failures.length ? 'FAIL' : updating ? 'UPDATED' : 'ok';
  console.log(`${mark.padEnd(8)} ${result.name}`);
  for (const n of [...new Set(notes)]) {
    console.log(`         note: ${n}`);
  }
  for (const f of failures) {
    console.log(`         ${f}`);
  }
}

function report(failures, label, list) {
  if (!list.length) {
    return;
  }
  const shown = list.slice(0, 10).join('\n    ');
  failures.push(`${list.length} ${label}:\n    ${shown}${list.length > 10 ? `\n    ... and ${list.length - 10} more` : ''}`);
}

/**
 * Collect WARN/ERROR lines that have not been explicitly accepted.
 *
 * Three baselines are consulted and their entries unioned: theme-wide, what a
 * site's own content provokes, and what a configuration provokes. The site
 * file is checked against the build of that site, so a sequence consults a
 * different one per build.
 */
function readBaseline(file) {
  if (!fs.existsSync(file)) {
    return [];
  }
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

function unacceptedWarnings(result, b, output) {
  const allow = [
    ...readBaseline(path.join(__dirname, 'warnings.txt')),
    ...readBaseline(path.join(siteMetaDir(b.name), 'warnings.txt')),
    ...readBaseline(path.join(CASES_DIR, result.caseName, 'warnings.txt')),
  ];

  return output
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(WARN|ERROR)/.test(l))
    .filter((l) => !allow.some((a) => l.includes(a)));
}

/**
 * Delete stored results no case produces any more.
 *
 * Every result directory holds a `files.txt`, so those are what identifies one.
 * Only a full regeneration prunes: a filtered run has no way to know whether a
 * result it did not build still exists.
 */
function prune(keep) {
  if (!fs.existsSync(EXPECTED_DIR)) {
    return [];
  }
  const removed = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const full = path.join(dir, entry.name);
      const rel = path.relative(EXPECTED_DIR, full).split(path.sep).join('/');
      if (fs.existsSync(path.join(full, 'files.txt'))) {
        if (!keep.has(rel)) {
          fs.rmSync(full, { recursive: true, force: true });
          removed.push(rel);
        }
        continue;
      }
      walk(full);
      if (!fs.readdirSync(full).length) {
        fs.rmdirSync(full);
      }
    }
  };
  walk(EXPECTED_DIR);
  return removed;
}

if (updating && !only) {
  const removed = prune(new Set(results.filter((r) => r.layer !== 'build').map((r) => r.name)));
  for (const rel of removed) {
    console.log(`PRUNED   ${rel}`);
  }
}

fs.rmSync(tmpRoot, { recursive: true, force: true });

const failed = outcomes.filter((r) => r.failures.length);
console.log('');
console.log(`${outcomes.length - failed.length}/${outcomes.length} passed`);
process.exit(failed.length ? 1 : 0);
