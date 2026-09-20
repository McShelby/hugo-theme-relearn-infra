// Reads the theme's dependency declaration and reconciles it with the tree.
//
// The theme vendors its third-party resources as files, with no package
// manifest anywhere - by design, since contributors are not required to have a
// front-end toolchain. That leaves nothing for a scanner to read: pointed at
// the theme, Syft or cdxgen find the Go module and whatever `package.json` came
// along with a bundle, and report a project with next to nothing in it. An SBOM
// that confidently omits Mermaid, Lunr, Orama and the fonts is worse than none,
// so components are declared rather than discovered - and this module makes
// sure the declaration and the tree cannot drift apart unnoticed.
//
// The vendoring convention is the one `.prettierignore` already encodes: below
// these roots, a subdirectory is third-party and a flat file is the theme's
// own code. `exampleSite` is the exception that file cannot express - it skips
// the directory whole, as a demo site rather than source - so below that root
// the convention rests on this list alone.

import fs from 'fs';
import path from 'path';
import * as TOML from 'js-toml';

// Under `docs` rather than at the theme root: Hugo mounts a theme's `data`
// into every site using it, so a declaration there would ship the project's
// own dev and build inventory to every consumer. The docs site is the only
// Hugo site that renders it.
const DECLARATION = path.posix.join('docs', 'data', 'relearn', 'thirdparty.toml');

/** Where the generated SBOM is committed, relative to the theme checkout. */
const SBOM_FILE = 'sbom.cdx.json';

const VENDOR_ROOTS = ['assets/js', 'assets/css', 'assets/fonts', 'docs/assets/js', 'exampleSite/assets/js'];

const SCOPES = ['theme', 'docs', 'dev', 'build'];

/**
 * A refusal raised deliberately, as opposed to a defect in the generator.
 *
 * Everything this tooling aborts on is a state of the repository to go and fix
 * - an undeclared dependency, an unreleased version - and is worth no more
 * than its message. Anything not of this type is a bug here, and the caller
 * lets it keep its stack.
 */
export class Refusal extends Error {}

/**
 * How a component identifies itself in the document.
 *
 * Here rather than in the emitter, because uniqueness is a property of the
 * declaration and is checked below alongside the other identity rules.
 */
export function bomRef(component) {
  return component.purl || `relearn:${component.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/** Every file below `dir`, as repository-relative paths. */
function walk(root, dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const child = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(root, child));
    } else {
      out.push(child);
    }
  }
  return out;
}

/**
 * Validate a path declared by a component or by an `[[own]]` entry.
 *
 * The last rule is the one worth stating. `reconcile` walks the subdirectories
 * of the vendor roots and nothing else, so a path outside them - or one naming
 * a flat file beside them, which the convention makes ours - can never match a
 * vendored file however the tree looks. Left to `reconcile` it would arrive as
 * a claim matching no file, advising a restore for files sitting exactly where
 * they were declared. Checked here, the message names the mistake, and a claim
 * matching no file keeps meaning that the files are gone.
 */
function checkPath(themeDir, p, who) {
  // Backslashes are rejected outright rather than by comparing against
  // `path.sep`, which would only notice them on Windows and leave Linux
  // to fail later with a different message for the same mistake.
  // `..` as a segment, not as a substring: a vendored file is free to carry
  // two dots in its name, and `foo..min.js` is not traversal.
  if (p.includes('\\') || p.startsWith('/') || p.split('/').includes('..')) {
    throw new Refusal(`${DECLARATION}: ${who} has an unusable path "${p}"`);
  }
  if (!fs.existsSync(path.join(themeDir, p))) {
    throw new Refusal(`${DECLARATION}: ${who} claims "${p}", which does not exist`);
  }

  // The root alone is not enough: what it holds directly has to be a
  // directory, because that is the level `reconcile` descends from.
  const root = VENDOR_ROOTS.find((r) => p.startsWith(`${r}/`));
  const held = root ? p.slice(root.length + 1).split('/')[0] : '';
  if (!held || !fs.statSync(path.join(themeDir, root, held)).isDirectory()) {
    throw new Refusal(`${DECLARATION}: ${who} claims "${p}", which sits outside every vendored directory.\nOnly subdirectories of ${VENDOR_ROOTS.join(', ')} are reconciled. A flat file beside them is ours by convention and needs no entry - not even under [[own]].`);
  }
}

/**
 * Load the declaration, failing loudly on anything that would silently
 * produce a wrong SBOM rather than an error.
 */
export function loadDeclaration(themeDir) {
  const where = path.join(themeDir, DECLARATION);
  if (!fs.existsSync(where)) {
    throw new Refusal(`no dependency declaration at ${DECLARATION}`);
  }

  const doc = TOML.load(fs.readFileSync(where, 'utf8')) || {};
  const components = doc.components || [];
  const own = doc.own || [];

  if (!components.length) {
    throw new Refusal(`${DECLARATION} declares no components`);
  }

  const seen = new Set();
  const refs = new Map();
  for (const c of components) {
    if (!c.name) {
      throw new Refusal(`${DECLARATION}: a component has no name`);
    }
    if (seen.has(c.name)) {
      throw new Refusal(`${DECLARATION}: "${c.name}" is declared twice`);
    }
    seen.add(c.name);

    // Distinct names can still collapse onto one bom-ref, which is the purl
    // where there is one and a slug of the name otherwise - so "Foo Bar" and
    // "Foo-Bar" arrive at the same string. A repeated bom-ref makes the
    // document invalid, and the emitter's dependency edges would resolve to
    // whichever component won the collision - possibly one in another scope,
    // which is not in the document at all.
    const ref = bomRef(c);
    if (refs.has(ref)) {
      throw new Refusal(`${DECLARATION}: "${c.name}" and "${refs.get(ref)}" both identify as "${ref}"`);
    }
    refs.set(ref, c.name);

    if (!SCOPES.includes(c.scope)) {
      throw new Refusal(`${DECLARATION}: "${c.name}" has scope "${c.scope}", expected one of ${SCOPES.join(', ')}`);
    }

    // A shipped component without a licence is the one omission that makes the
    // SBOM actively misleading, so it aborts rather than emitting a hole.
    if (c.scope === 'theme' && !c.license) {
      throw new Refusal(`${DECLARATION}: "${c.name}" ships with the theme but declares no license`);
    }

    // Without paths a shipped component resolves to no files, so it reaches
    // the document with no hash, no tree hash and no location - named, and
    // pinned to nothing. That tripwire is the point of declaring it, so its
    // absence aborts here beside the license rather than emitting a component
    // that only looks complete.
    if (c.scope === 'theme' && !(c.paths || []).length) {
      throw new Refusal(`${DECLARATION}: "${c.name}" ships with the theme but declares no paths`);
    }

    for (const p of c.paths || []) {
      checkPath(themeDir, p, `"${c.name}"`);
    }
  }

  // `requires` is resolved here rather than by each consumer, because the two
  // fail differently on the same mistake and neither failure is legible. A
  // name that resolves to nothing renders nothing on the credits page,
  // silently promoting whatever it should have nested; a name in another scope
  // survives the emitter and puts a `dependsOn` in the document pointing at a
  // bom-ref that is not in it, because only `theme` components are rendered -
  // a dangling reference that makes the document invalid, unremarked.
  const scopeOf = new Map(components.map((c) => [c.name, c.scope]));
  for (const c of components) {
    for (const name of c.requires || []) {
      if (!scopeOf.has(name)) {
        throw new Refusal(`${DECLARATION}: "${c.name}" requires "${name}", which is not declared`);
      }
      if (scopeOf.get(name) !== c.scope) {
        throw new Refusal(`${DECLARATION}: "${c.name}" is scope "${c.scope}" but requires "${name}", which is scope "${scopeOf.get(name)}"`);
      }
    }
  }

  // `extends` names the one component another only runs inside - a plugin its
  // engine, an extension its editor, an action its platform. The credits page
  // nests the extension beneath that host; the SBOM gives it an edge to it.
  // Resolved here for the same reasons as `requires`, and refused together
  // with a `requires` between the same two in either direction: the
  // extension's own would repeat what extending already says, and the host's
  // would claim the extension came along with it while also running inside it.
  for (const c of components) {
    if (c.extends === undefined) {
      continue;
    }
    if (typeof c.extends !== 'string') {
      throw new Refusal(`${DECLARATION}: "${c.name}" extends ${JSON.stringify(c.extends)}, expected the name of one component`);
    }
    if (!scopeOf.has(c.extends)) {
      throw new Refusal(`${DECLARATION}: "${c.name}" extends "${c.extends}", which is not declared`);
    }
    if (scopeOf.get(c.extends) !== c.scope) {
      throw new Refusal(`${DECLARATION}: "${c.name}" is scope "${c.scope}" but extends "${c.extends}", which is scope "${scopeOf.get(c.extends)}"`);
    }
    const host = components.find((h) => h.name === c.extends);
    if ((c.requires || []).includes(host.name) || (host.requires || []).includes(c.name)) {
      throw new Refusal(`${DECLARATION}: "${c.name}" extends "${host.name}", so neither may require the other`);
    }
  }

  // A cycle is the mistake neither consumer reports. Every component in one is
  // named by another, so the credits page renders none of them at the top
  // level and the recursion that would notice never starts - they simply
  // vanish. The emitter is equally content, writing the loop into the graph
  // with nothing depending on it. Caught here, once, for both.
  //
  // Two graphs are walked, because `extends` points the consumers in opposite
  // directions: the SBOM follows an extension to its host, while the credits
  // page nests the extension beneath it. Either can loop where the other does
  // not.
  const dependsOn = new Map(components.map((c) => [c.name, [...(c.requires || []), ...(c.extends ? [c.extends] : [])]]));
  const nests = new Map(components.map((c) => [c.name, [...(c.requires || [])]]));
  for (const c of components) {
    if (c.extends) {
      nests.get(c.extends).push(c.name);
    }
  }
  for (const edges of [dependsOn, nests]) {
    const settled = new Set();
    const chain = [];
    const visit = (name) => {
      if (settled.has(name)) {
        return;
      }
      const looped = chain.indexOf(name);
      if (looped !== -1) {
        throw new Refusal(`${DECLARATION}: circular \`requires\` or \`extends\`: ${[...chain.slice(looped), name].join(' -> ')}`);
      }
      chain.push(name);
      for (const next of edges.get(name)) {
        visit(next);
      }
      chain.pop();
      settled.add(name);
    };
    for (const c of components) {
      visit(c.name);
    }
  }

  // Held to the same path rules as a component's. An `[[own]]` entry is a
  // claim like any other, and it reaches `reconcile` the same way.
  for (const o of own) {
    if (!o.path || !o.reason) {
      throw new Refusal(`${DECLARATION}: every [[own]] entry needs a path and a reason`);
    }
    checkPath(themeDir, o.path, 'an [[own]] entry');
  }

  return { components, own };
}

/**
 * Compare the declaration against what is actually vendored.
 *
 * Returns the two ways they can disagree: files nobody claims, and claims that
 * match no file. Both are reported rather than thrown, so a caller can show
 * every problem in one run instead of one per invocation.
 */
export function reconcile(themeDir, declaration) {
  // Longest prefix wins, which is how one directory holds several components:
  // `assets/js/lunr` is Lunr Languages and the single file `lunr.min.js`
  // inside it is Lunr.
  const claims = [];
  for (const c of declaration.components) {
    for (const p of c.paths || []) {
      claims.push({ prefix: p, by: c.name });
    }
  }
  for (const o of declaration.own) {
    claims.push({ prefix: o.path, by: null });
  }
  claims.sort((a, b) => b.prefix.length - a.prefix.length);

  const vendored = [];
  for (const root of VENDOR_ROOTS) {
    const full = path.join(themeDir, root);
    if (!fs.existsSync(full)) {
      continue;
    }
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      // A flat file beside the vendored directories is the theme's own code.
      if (entry.isDirectory()) {
        vendored.push(...walk(themeDir, path.posix.join(root, entry.name)));
      }
    }
  }

  const unclaimed = [];
  const used = new Set();
  const byComponent = new Map();
  for (const file of vendored) {
    const claim = claims.find((c) => file === c.prefix || file.startsWith(`${c.prefix}/`));
    if (!claim) {
      unclaimed.push(file);
      continue;
    }
    used.add(claim.prefix);
    // `by` is null for an [[own]] entry, which claims a file precisely so that
    // it belongs to no component.
    if (claim.by) {
      byComponent.set(claim.by, [...(byComponent.get(claim.by) || []), file]);
    }
  }

  const empty = claims.filter((c) => !used.has(c.prefix)).map((c) => c.prefix);

  for (const files of byComponent.values()) {
    files.sort();
  }

  return { vendored, byComponent, unclaimed: unclaimed.sort(), empty: [...new Set(empty)].sort() };
}

/** One sentence per disagreement, or null when the two agree. */
export function describeDrift({ unclaimed, empty }) {
  const lines = [];
  if (unclaimed.length) {
    lines.push(`${unclaimed.length} vendored file(s) that no component claims:`, ...unclaimed.map((f) => `  ${f}`), `Add them to a component's \`paths\` in ${DECLARATION}, or to [[own]] if they are ours.`);
  }
  if (empty.length) {
    lines.push(`${empty.length} declared path(s) matching no vendored file:`, ...empty.map((f) => `  ${f}`), `Remove the entry from ${DECLARATION}, or restore the files.`);
  }
  return lines.length ? lines.join('\n') : null;
}

export { DECLARATION, SBOM_FILE, VENDOR_ROOTS };
