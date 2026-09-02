#!/usr/bin/env node
//
// Checks on the runner itself, as opposed to on the theme.
//
// The suite's own machinery now has logic worth pinning: a merge that has to
// match Hugo's, a filename convention with a surprising unwrap rule, and a
// dozen validations whose whole job is to abort. None of that is exercised by
// building sites - a merge bug shows up there as a wrong baseline, and an
// abort that never fires shows up as nothing at all.
//
//   npm run checks

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { flattenDir, merge, resolveEnvironmentDir, DEFAULT_ENVIRONMENT } from '../runner/config.js';
import { loadCase } from '../runner/cases.js';
import { resolveThemeDir } from '../runner/paths.js';

const themeDir = resolveThemeDir();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'relearn-checks-'));

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`ok       ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL     ${name}`);
    console.log(`         ${err.message.split('\n').join('\n         ')}`);
  }
}

/** Assert a call throws, and that the message says which mistake was made. */
function throws(fn, ...needles) {
  let message = null;
  try {
    fn();
  } catch (err) {
    message = err.message;
  }
  assert.ok(message !== null, 'expected an abort, got none');
  for (const needle of needles) {
    assert.ok(
      message.toLowerCase().includes(needle.toLowerCase()),
      `abort message does not mention "${needle}":\n${message}`
    );
  }
}

/** Write a directory of files and return its path. */
function dir(name, files) {
  const root = path.join(tmp, name);
  fs.mkdirSync(root, { recursive: true });
  for (const [file, body] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
  }
  return root;
}

/**
 * Write a synthetic case and load it, so validations can be provoked.
 *
 * The axes are synthetic too, so these checks pin the expansion rules rather
 * than whichever axes the suite happens to carry at the time.
 */
const casesDir = path.join(tmp, 'cases');
const axesDir = path.join(tmp, 'axes');
for (const [axis, values] of Object.entries({ urls: ['relative', 'ugly'], baseurl: ['root', 'subdir'] })) {
  for (const value of values) {
    dir(path.join('axes', axis, value), { 'hugo.toml': `# ${axis}/${value}\n` });
  }
}

function loadSynthetic(name, body) {
  fs.mkdirSync(path.join(casesDir, name), { recursive: true });
  fs.writeFileSync(path.join(casesDir, name, 'case.toml'), body, 'utf8');
  return loadCase(name, themeDir, { casesDir, axesDir });
}

// ---------------------------------------------------------------- the merge

check('merge is deep for maps', () => {
  const target = { params: { a: 1, b: 2 } };
  merge(target, { params: { b: 3, c: 4 } });
  assert.deepStrictEqual(target, { params: { a: 1, b: 3, c: 4 } });
});

check('merge replaces slices rather than concatenating', () => {
  const target = { versions: ['a', 'b'] };
  merge(target, { versions: ['c'] });
  assert.deepStrictEqual(target, { versions: ['c'] });
});

check('merge replaces a map with a scalar and back', () => {
  const target = { x: { a: 1 } };
  merge(target, { x: 'flat' });
  assert.deepStrictEqual(target, { x: 'flat' });
});

// ------------------------------------------------------------- flattening

check('a hugo.toml merges at the root', () => {
  const d = dir('flat-root', { 'hugo.toml': "title = 'x'\n" });
  assert.deepStrictEqual(flattenDir(d), { title: 'x' });
});

check('another name wraps the file under its own basename', () => {
  const d = dir('flat-wrap', { 'params.toml': "a = 1\n" });
  assert.deepStrictEqual(flattenDir(d), { params: { a: 1 } });
});

check('a sole top-level key matching the basename is not wrapped again', () => {
  const d = dir('flat-unwrap', { 'params.toml': "[params]\n  a = 1\n" });
  assert.deepStrictEqual(flattenDir(d), { params: { a: 1 } });
});

check('a matching key beside another key unwraps neither', () => {
  // Surprising, and Hugo's own behaviour: the unwrap is conditional on being
  // the only top-level key.
  const d = dir('flat-mixed', { 'params.toml': "[params]\n  a = 1\n[other]\n  b = 2\n" });
  assert.deepStrictEqual(flattenDir(d), { params: { params: { a: 1 }, other: { b: 2 } } });
});

check('files merge in lexical order, later winning', () => {
  const d = dir('flat-order', {
    'config.toml': "title = 'from config'\nsummaryLength = 11\n",
    'hugo.toml': "title = 'from hugo'\n",
  });
  assert.deepStrictEqual(flattenDir(d), { title: 'from hugo', summarylength: 11 });
});

check('keys are lowercased, as Hugo lowercases them', () => {
  const d = dir('flat-case', { 'hugo.toml': "relativeURLs = true\n" });
  assert.deepStrictEqual(flattenDir(d), { relativeurls: true });
});

check('a non-TOML config file aborts rather than being skipped', () => {
  const d = dir('flat-yaml', { 'hugo.yaml': 'title: x\n' });
  throws(() => flattenDir(d), 'TOML only');
});

check('a language-suffixed name aborts rather than being half-mapped', () => {
  const d = dir('flat-lang', { 'params.en.toml': "a = 1\n" });
  throws(() => flattenDir(d), 'language-suffixed');
});

// -------------------------------------------------- environment resolution

check('an environment held by both must be identical', () => {
  const site = path.join(tmp, 'site-agree');
  fs.mkdirSync(path.join(site, 'config'), { recursive: true });
  dir('site-agree/config/testing', { 'hugo.toml': "title = 'x'\n" });
  // infra's real `testing` differs, so this one must abort; a matching pair is
  // covered by the suite itself, where all three copies agree.
  throws(() => resolveEnvironmentDir(site, 'testing'), 'differ', 'identical');
});

check('an unknown environment aborts', () => {
  throws(() => resolveEnvironmentDir(path.join(tmp, 'nowhere'), 'nope'), 'resolves to no directory');
});

check('production is exempt from having to resolve', () => {
  assert.strictEqual(resolveEnvironmentDir(path.join(tmp, 'nowhere'), DEFAULT_ENVIRONMENT), null);
});

// ------------------------------------------------------------ case loading

check('a single-value axis does not branch the tree', () => {
  const c = loadSynthetic('one-value', 'site = "url-permutations"\n[axes]\n  urls = "relative"\n');
  assert.deepStrictEqual(c.results.map((r) => r.name), ['one-value']);
  assert.strictEqual(c.results[0].builds[0].layers.length, 1);
});

check('a multi-value axis branches, and a scalar axis still layers', () => {
  const c = loadSynthetic(
    'branching',
    'site = "url-permutations"\n[axes]\n  urls = ["relative", "ugly"]\n'
  );
  assert.deepStrictEqual(c.results.map((r) => r.name), [
    'branching/urls-relative',
    'branching/urls-ugly',
  ]);
});

check('nesting is alphabetical by axis name, not case-file order', () => {
  const c = loadSynthetic(
    'nesting',
    'site = "url-permutations"\n[axes]\n  urls = ["relative", "ugly"]\n  baseurl = ["root", "subdir"]\n'
  );
  assert.ok(
    c.results.every((r) => /^nesting\/baseurl-[a-z]+\/urls-[a-z]+$/.test(r.name)),
    `unexpected result names: ${c.results.map((r) => r.name).join(', ')}`
  );
});

check('config order follows the case file, not the nesting', () => {
  const c = loadSynthetic(
    'order',
    'site = "url-permutations"\n[axes]\n  urls = "relative"\n  baseurl = "root"\n'
  );
  const [urls, baseurl] = c.results[0].builds[0].layers;
  assert.ok(urls.endsWith(path.join('urls', 'relative')), `first layer was ${urls}`);
  assert.ok(baseurl.endsWith(path.join('baseurl', 'root')), `second layer was ${baseurl}`);
});

check('the layer defaults to content and opts down', () => {
  assert.strictEqual(loadSynthetic('layer-default', 'site = "minimal"\n').layer, 'content');
  assert.strictEqual(loadSynthetic('layer-files', 'layer = "files"\nsite = "minimal"\n').layer, 'files');
});

check('an unknown key in a case file aborts', () => {
  throws(() => loadSynthetic('typo', 'site = "minimal"\nenviroment = "testing"\n'), 'unknown key', 'enviroment');
});

check('an environment given a list aborts', () => {
  throws(() => loadSynthetic('env-list', 'site = "minimal"\nenvironment = ["a", "b"]\n'), 'one name');
});

check('naming _default as an environment aborts', () => {
  throws(() => loadSynthetic('env-default', 'site = "minimal"\nenvironment = "_default"\n'), 'not selectable');
});

check('an invalid layer aborts', () => {
  throws(() => loadSynthetic('layer-bad', 'layer = "contents"\nsite = "minimal"\n'), 'layer', 'contents');
});

check('an unknown site aborts', () => {
  throws(() => loadSynthetic('site-bad', 'site = "nosuchfixture"\n'), 'does not exist');
});

check('an axis value with no directory aborts', () => {
  throws(() => loadSynthetic('axis-bad', 'site = "minimal"\n[axes]\n  urls = "sideways"\n'), 'no value');
});

check('a sequence build carrying two axis values aborts', () => {
  throws(
    () =>
      loadSynthetic(
        'seq-multi',
        '[[builds]]\n  site = "url-permutations"\n  [builds.axes]\n    urls = ["relative", "ugly"]\n'
      ),
    'more than one value'
  );
});

check('a one-element array is accepted where one value is required', () => {
  const c = loadSynthetic(
    'seq-array',
    '[[builds]]\n  site = "url-permutations"\n  [builds.axes]\n    urls = ["relative"]\n'
  );
  assert.strictEqual(c.results[0].builds[0].layers.length, 1);
});

check('a case mixing [[builds]] with a top-level site aborts', () => {
  throws(
    () => loadSynthetic('seq-mixed', 'site = "minimal"\n[[builds]]\n  site = "minimal"\n'),
    'cannot also declare'
  );
});

check('a dest leaving the result root aborts', () => {
  throws(
    () => loadSynthetic('seq-escape', '[[builds]]\n  site = "minimal"\n  dest = "../outside"\n'),
    'leaves the result root'
  );
});

check('a sequence is one result however many builds it has', () => {
  const c = loadSynthetic(
    'seq-one-result',
    '[[builds]]\n  site = "minimal"\n[[builds]]\n  site = "shortcodes"\n  dest = "beneath"\n'
  );
  assert.strictEqual(c.results.length, 1);
  assert.strictEqual(c.results[0].builds.length, 2);
  assert.strictEqual(c.results[0].builds[1].dest, 'beneath');
});

check('a theme site resolves against the checkout and supplies its own theme', () => {
  const c = loadSynthetic('at-theme', 'site = "docs@theme"\nenvironment = "testing"\n');
  const b = c.results[0].builds[0];
  assert.strictEqual(b.injectTheme, false);
  assert.strictEqual(b.dir, path.join(themeDir, 'docs'));
});

check('a fixture is given the theme by the runner', () => {
  const b = loadSynthetic('fixture-theme', 'site = "minimal"\n').results[0].builds[0];
  assert.strictEqual(b.injectTheme, true);
});

fs.rmSync(tmp, { recursive: true, force: true });

console.log('');
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
