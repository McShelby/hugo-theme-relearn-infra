#!/usr/bin/env node
//
// Checks on what building sites cannot exercise.
//
// Two things: the suite's own machinery - a merge that has to match Hugo's, a
// filename convention with a surprising unwrap rule, and a dozen validations
// whose whole job is to abort - and the theme's dependency declaration, which
// nothing else in the suite would notice going stale. A merge bug shows up in
// a build as a wrong baseline, and an abort that never fires shows up as
// nothing at all.
//
//   npm run checks

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { flattenDir, merge, resolveEnvironmentDir, DEFAULT_ENVIRONMENT } from '../runner/config.js';
import { loadCase } from '../runner/cases.js';
import { resolveThemeDir } from '../runner/paths.js';
import { loadDeclaration, reconcile, describeDrift, DECLARATION } from '../tools/sbom/declaration.js';
import { build, render, contentSerial, NIL_SERIAL } from '../tools/sbom/cyclonedx.js';

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
    assert.ok(message.toLowerCase().includes(needle.toLowerCase()), `abort message does not mention "${needle}":\n${message}`);
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
  const d = dir('flat-wrap', { 'params.toml': 'a = 1\n' });
  assert.deepStrictEqual(flattenDir(d), { params: { a: 1 } });
});

check('a sole top-level key matching the basename is not wrapped again', () => {
  const d = dir('flat-unwrap', { 'params.toml': '[params]\n  a = 1\n' });
  assert.deepStrictEqual(flattenDir(d), { params: { a: 1 } });
});

check('a matching key beside another key unwraps neither', () => {
  // Surprising, and Hugo's own behaviour: the unwrap is conditional on being
  // the only top-level key.
  const d = dir('flat-mixed', { 'params.toml': '[params]\n  a = 1\n[other]\n  b = 2\n' });
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
  const d = dir('flat-case', { 'hugo.toml': 'relativeURLs = true\n' });
  assert.deepStrictEqual(flattenDir(d), { relativeurls: true });
});

check('a non-TOML config file aborts rather than being skipped', () => {
  const d = dir('flat-yaml', { 'hugo.yaml': 'title: x\n' });
  throws(() => flattenDir(d), 'TOML only');
});

check('a language-suffixed name aborts rather than being half-mapped', () => {
  const d = dir('flat-lang', { 'params.en.toml': 'a = 1\n' });
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
  assert.deepStrictEqual(
    c.results.map((r) => r.name),
    ['one-value']
  );
  assert.strictEqual(c.results[0].builds[0].layers.length, 1);
});

check('a multi-value axis branches, and a scalar axis still layers', () => {
  const c = loadSynthetic('branching', 'site = "url-permutations"\n[axes]\n  urls = ["relative", "ugly"]\n');
  assert.deepStrictEqual(
    c.results.map((r) => r.name),
    ['branching/urls-relative', 'branching/urls-ugly']
  );
});

check('nesting is alphabetical by axis name, not case-file order', () => {
  const c = loadSynthetic('nesting', 'site = "url-permutations"\n[axes]\n  urls = ["relative", "ugly"]\n  baseurl = ["root", "subdir"]\n');
  assert.ok(
    c.results.every((r) => /^nesting\/baseurl-[a-z]+\/urls-[a-z]+$/.test(r.name)),
    `unexpected result names: ${c.results.map((r) => r.name).join(', ')}`
  );
});

check('config order follows the case file, not the nesting', () => {
  const c = loadSynthetic('order', 'site = "url-permutations"\n[axes]\n  urls = "relative"\n  baseurl = "root"\n');
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
  throws(() => loadSynthetic('seq-multi', '[[builds]]\n  site = "url-permutations"\n  [builds.axes]\n    urls = ["relative", "ugly"]\n'), 'more than one value');
});

check('a one-element array is accepted where one value is required', () => {
  const c = loadSynthetic('seq-array', '[[builds]]\n  site = "url-permutations"\n  [builds.axes]\n    urls = ["relative"]\n');
  assert.strictEqual(c.results[0].builds[0].layers.length, 1);
});

check('a case mixing [[builds]] with a top-level site aborts', () => {
  throws(() => loadSynthetic('seq-mixed', 'site = "minimal"\n[[builds]]\n  site = "minimal"\n'), 'cannot also declare');
});

check('a dest leaving the result root aborts', () => {
  throws(() => loadSynthetic('seq-escape', '[[builds]]\n  site = "minimal"\n  dest = "../outside"\n'), 'leaves the result root');
});

check('a sequence is one result however many builds it has', () => {
  const c = loadSynthetic('seq-one-result', '[[builds]]\n  site = "minimal"\n[[builds]]\n  site = "shortcodes"\n  dest = "beneath"\n');
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

// ------------------------------------------------- the dependency declaration
//
// These run against the real theme rather than a synthetic tree, because the
// declaration is only useful if it describes what is actually vendored. A
// dependency updated without its entry, or an entry left behind after one is
// dropped, fails here and nowhere else.

check('the dependency declaration loads and validates', () => {
  const declaration = loadDeclaration(themeDir);
  assert.ok(
    declaration.components.some((c) => c.scope === 'theme'),
    'no component is declared as shipping with the theme'
  );
});

/**
 * A synthetic theme holding a declaration and one vendored file to claim.
 *
 * Enough for the validations, which read the file and resolve names within it.
 * The file exists because a `theme` component has to declare `paths` and those
 * have to resolve; it sits inside a vendored directory because that is the
 * only place a claim is allowed to point. Its contents are never read.
 */
const VENDORED = 'assets/js/fixture/fixture.js';

function declared(name, body) {
  return dir(name, { [DECLARATION]: body, [VENDORED]: '// fixture\n' });
}

const requiring = (scope, name) => `
[[components]]
  scope = 'theme'
  name = 'needs-it'
  license = 'MIT'
  paths = ['${VENDORED}']
  requires = ['${name}']

[[components]]
  scope = '${scope}'
  name = 'the-other'
  license = 'MIT'
  paths = ['${VENDORED}']
`;

check('a `requires` naming nothing aborts', () => {
  throws(() => loadDeclaration(declared('requires-unknown', requiring('theme', 'mistyped'))), 'requires', 'not declared');
});

check('a `requires` reaching into another scope aborts', () => {
  // Survives the emitter, which resolves names across every scope, and lands
  // in the document as a `dependsOn` naming a component the document does not
  // contain - only `theme` components are rendered.
  throws(() => loadDeclaration(declared('requires-cross-scope', requiring('docs', 'the-other'))), 'requires', 'scope');
});

check('a circular `requires` aborts', () => {
  // The one shape neither consumer reports on its own: every component in the
  // loop is named by another, so the credits page renders none of them and
  // the emitter writes a graph nothing depends on. Silent in both.
  const cycle = `
[[components]]
  scope = 'theme'
  name = 'first'
  license = 'MIT'
  paths = ['${VENDORED}']
  requires = ['second']

[[components]]
  scope = 'theme'
  name = 'second'
  license = 'MIT'
  paths = ['${VENDORED}']
  requires = ['first']
`;
  throws(() => loadDeclaration(declared('requires-cycle', cycle)), 'circular', 'first -> second -> first');
});

check('a self-referential `requires` aborts', () => {
  const self = `
[[components]]
  scope = 'theme'
  name = 'only'
  license = 'MIT'
  paths = ['${VENDORED}']
  requires = ['only']
`;
  throws(() => loadDeclaration(declared('requires-self', self)), 'circular', 'only -> only');
});

const extending = (scope, host, extra = '') => `
[[components]]
  scope = 'theme'
  name = 'plugin'
  license = 'MIT'
  paths = ['${VENDORED}']
  extends = '${host}'
${extra}
[[components]]
  scope = '${scope}'
  name = 'engine'
  license = 'MIT'
  paths = ['${VENDORED}']
`;

check('an `extends` naming nothing aborts', () => {
  throws(() => loadDeclaration(declared('extends-unknown', extending('theme', 'mistyped'))), 'extends', 'not declared');
});

check('an `extends` reaching into another scope aborts', () => {
  throws(() => loadDeclaration(declared('extends-cross-scope', extending('docs', 'engine'))), 'extends', 'scope');
});

check('an extension that also requires its host aborts', () => {
  // Extending already says the extension needs its host, and the two would
  // nest them in opposite directions on the credits page.
  throws(() => loadDeclaration(declared('extends-requires', extending('theme', 'engine', "  requires = ['engine']\n"))), 'plugin', 'neither may require the other');
});

check('a host that requires its own extension aborts', () => {
  // It would claim the extension came along with it while also running inside
  // it - and give the SBOM a loop between the two.
  const backwards = `${extending('theme', 'engine')}  requires = ['plugin']\n`;
  throws(() => loadDeclaration(declared('extends-required-by-host', backwards)), 'plugin', 'neither may require the other');
});

check('a circular `extends` aborts', () => {
  const cycle = `
[[components]]
  scope = 'theme'
  name = 'first'
  license = 'MIT'
  paths = ['${VENDORED}']
  extends = 'second'

[[components]]
  scope = 'theme'
  name = 'second'
  license = 'MIT'
  paths = ['${VENDORED}']
  extends = 'first'
`;
  throws(() => loadDeclaration(declared('extends-cycle', cycle)), 'circular', 'first -> second -> first');
});

check('what is required hangs off its requirer, an extension off the theme and its host', () => {
  // The rules the credits page nests by, pinned on the SBOM side. A required
  // component came along with what requires it, so the theme's own edges skip
  // it. An extension is not required by anything, so the theme keeps its edge
  // to it, and the extension gains one to the host it runs inside.
  const theme = dir('extends-edges', {
    [DECLARATION]: `
[[components]]
  scope = 'theme'
  name = 'engine'
  license = 'MIT'
  paths = ['${VENDORED}']
  requires = ['helper']

[[components]]
  scope = 'theme'
  name = 'helper'
  license = 'MIT'
  paths = ['${VENDORED}']

[[components]]
  scope = 'theme'
  name = 'plugin'
  license = 'MIT'
  paths = ['${VENDORED}']
  extends = 'engine'
`,
    [VENDORED]: '// fixture\n',
    'layouts/partials/version.txt': '1.0.0',
    'CHANGELOG.md': '## 1.0.0 (2026-01-01)\n',
    'theme.toml': '',
  });
  const doc = build(theme, loadDeclaration(theme), () => [VENDORED]);
  const edges = Object.fromEntries(doc.dependencies.map((d) => [d.ref, d.dependsOn]));
  assert.deepStrictEqual(edges, {
    [doc.metadata.component['bom-ref']]: ['relearn:engine', 'relearn:plugin'],
    'relearn:engine': ['relearn:helper'],
    'relearn:helper': [],
    'relearn:plugin': ['relearn:engine'],
  });
});

check('a shipped component with no paths aborts', () => {
  // It would otherwise reach the document named but pinned to nothing: no
  // hash, no tree hash, no location, and so no way for a later vendored
  // update to move the committed file.
  const pathless = "[[components]]\n  scope = 'theme'\n  name = 'nowhere'\n  license = 'MIT'\n";
  throws(() => loadDeclaration(declared('paths-missing', pathless)), 'nowhere', 'no paths');
});

check('two components collapsing onto one bom-ref abort', () => {
  // Distinct names, one identifier: without a purl the ref is a slug of the
  // name, and punctuation is what the slug throws away. The document would
  // carry a repeated bom-ref and an edge resolving to whichever won.
  const colliding = `
[[components]]
  scope = 'theme'
  name = 'Foo Bar'
  license = 'MIT'
  paths = ['${VENDORED}']

[[components]]
  scope = 'theme'
  name = 'Foo-Bar'
  license = 'MIT'
  paths = ['${VENDORED}']
`;
  throws(() => loadDeclaration(declared('bomref-collision', colliding)), 'both identify as', 'relearn:foo-bar');
});

check('a path naming a flat file beside the vendored directories aborts', () => {
  // The one shape that passes every other rule: the file is right there, so
  // existence says yes, but `reconcile` descends from the subdirectories and
  // never sees it. Caught here, a claim matching no file keeps meaning the
  // one thing it should - the files are gone.
  const theme = dir('path-flat', {
    [DECLARATION]: "[[components]]\n  scope = 'theme'\n  name = 'flat'\n  license = 'MIT'\n  paths = ['assets/css/nucleus.css']\n",
    'assets/css/nucleus.css': '/* ours */\n',
  });
  throws(() => loadDeclaration(theme), 'outside every vendored directory');
});

check('the declaration and the vendored tree agree', () => {
  const declaration = loadDeclaration(themeDir);
  const drift = describeDrift(reconcile(themeDir, declaration));
  assert.strictEqual(drift, null, drift || '');
});

/** The SBOM as the generator would write it, rendered fresh on every call. */
function renderSbom() {
  const declaration = loadDeclaration(themeDir);
  const reconciliation = reconcile(themeDir, declaration);
  return render(themeDir, declaration, (c) => reconciliation.byComponent.get(c.name) || []);
}

let sbomOnce = null;

/**
 * The same document, rendered once and shared by the checks below.
 *
 * A render digests every vendored file, which is by far the most expensive
 * thing in this file, and the checks all assert over one document - only the
 * determinism check has any reason to ask for a second. Memoised rather than
 * rendered at module scope, so that a declaration too broken to render still
 * fails inside a check, where it is reported by name.
 */
function sbom() {
  if (sbomOnce === null) {
    sbomOnce = renderSbom();
  }
  return sbomOnce;
}

check('every shipped component carries a license', () => {
  // loadDeclaration aborts on a missing one, so reaching here is the
  // assertion. Pinned separately because it is the omission that would make
  // the SBOM misleading rather than merely incomplete.
  const shipped = loadDeclaration(themeDir).components.filter((c) => c.scope === 'theme');
  assert.deepStrictEqual(
    shipped.filter((c) => !c.license).map((c) => c.name),
    []
  );
});

check('every component carries exactly one integrity tripwire', () => {
  // The tripwire for a vendored update that forgot to bump `version`. A
  // component vendored as one file gets it from `hashes`, one vendored as a
  // directory from `relearn:treehash`, and which of the two follows from the
  // declaration rather than from how many files the directory holds today.
  // Without this, everything vendored as a directory could change on disk and
  // leave the document byte-identical.
  const document = JSON.parse(sbom());
  const wrong = document.components
    .filter((c) => {
      const hashed = Boolean(c.hashes);
      const treehashed = (c.properties || []).some((p) => p.name === 'relearn:treehash');
      return hashed === treehashed;
    })
    .map((c) => c.name);
  assert.deepStrictEqual(wrong, [], 'a component carries neither a hash nor a tree hash, or carries both');
});

check('the SBOM renders identically twice', () => {
  // `serialNumber` and `metadata.timestamp` are the two fields whose obvious
  // implementations - a random UUID and the current time - would pass every
  // other check here while making the committed file differ on every run.
  assert.strictEqual(sbom(), renderSbom(), 'the emitter is not deterministic');
});

check('the SBOM timestamp is the release date, not the clock', () => {
  const document = JSON.parse(sbom());

  // Sourced independently of the emitter, so this fails if the timestamp ever
  // stops tracking the release it claims to describe.
  const version = fs
    .readFileSync(path.join(themeDir, 'layouts', 'partials', 'version.txt'), 'utf8')
    .trim()
    .split('+')[0];
  const changelog = fs.readFileSync(path.join(themeDir, 'CHANGELOG.md'), 'utf8');
  const released = changelog.match(new RegExp(`^## ${version.replace(/\./g, '\\.')} \\((\\d{4}-\\d{2}-\\d{2})\\)`, 'm'));

  assert.ok(released, `CHANGELOG.md has no release date for ${version}`);
  assert.strictEqual(document.metadata.timestamp, `${released[1]}T00:00:00Z`);
  assert.match(document.serialNumber, /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, 'the serial number is not a name-based (v5) UUID');
});

check('the serial number is recomputable from the document', () => {
  // The property the whole derivation exists for: a consumer holding nothing
  // but the file can put the placeholder back and arrive at the published
  // serial. If that ever stops holding, the serial has become an opaque number
  // again and a BOM-Link cannot be trusted to name this document.
  const document = JSON.parse(sbom());
  const published = document.serialNumber;

  document.serialNumber = NIL_SERIAL;
  assert.strictEqual(published, contentSerial(document, document.metadata.component.version));
});

check('the serial number tracks the contents', () => {
  // Deriving it from the release instead would leave this equal, which is the
  // defect the content digest removes: two materially different documents
  // answering to one BOM-Link.
  const document = JSON.parse(sbom());
  const before = document.serialNumber;

  document.serialNumber = NIL_SERIAL;
  document.components[0].version = `${document.components[0].version || ''}-not-the-same`;

  assert.notStrictEqual(before, contentSerial(document, document.metadata.component.version));
});

// Whether the committed document is current is left to `npm run sbom`, which
// `npm test` runs. Asserting it here as well would break `npm run test:update`:
// the checks run first, so a stale document - the reason for running it -
// would abort the chain before `sbom:update` could write a fresh one.

fs.rmSync(tmp, { recursive: true, force: true });

console.log('');
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
