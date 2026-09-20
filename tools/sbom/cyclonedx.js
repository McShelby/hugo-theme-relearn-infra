// Maps the dependency declaration onto a CycloneDX 1.6 document.
//
// `serialNumber` and `metadata.timestamp` both identify a document rather than
// describe its contents, and the obvious values for them - a random UUID and
// the moment of generation - would make every run differ from the last. This
// file is committed to the theme, so that would leave `npm run sbom` permanently
// red and each regeneration showing a diff that means nothing.
//
// Both are therefore derived. The serial number is a name-based UUIDv5 over the
// document's own contents, so it is identical for everyone who renders the same
// document and different the moment anything in it changes - which is what a
// serial number is for, and what lets `version` stay at 1. Deriving it from the
// release instead would give two materially different documents one identity,
// since a vendored update between releases moves the components while the
// release stands still. The timestamp is that release's date from CHANGELOG.md.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as TOML from 'js-toml';
import { DECLARATION, Refusal, bomRef } from './declaration.js';

const SPEC_VERSION = '1.6';

// RFC 4122's namespace for URLs, which is what a purl is.
const URL_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

// `github` rather than `golang`. A Go coordinate would have to read
// `…/v9@v9.1.0`, since the proxy wants semver tags and a major-version path
// suffix, and this repository has neither - every tag is bare and `go.mod`
// names no major. It would name something that has never resolved, and a
// scanner trying it gets a silent miss rather than an error. A repository at a
// tag is also what a submodule, an archive download and `hugo mod get` all
// land on. Lowercase throughout, as the purl type requires.
const PURL = 'pkg:github/mcshelby/hugo-theme-relearn';

// RFC 4122's nil UUID, standing in for the serial number while the document is
// being hashed to produce it. A consumer verifying the serial puts this back
// and repeats the derivation below, so the placeholder has to be a fixed value
// rather than an omission - dropping the key would change the JSON.
const NIL_SERIAL = 'urn:uuid:00000000-0000-0000-0000-000000000000';

/** An SPDX expression needs a different shape from a bare licence id. */
function licenses(expression) {
  if (!expression) {
    return undefined;
  }
  return /[()]|\s(AND|OR|WITH)\s/.test(expression) ? [{ expression }] : [{ license: { id: expression } }];
}

function externalReferences(component) {
  const refs = [];
  if (component.homepage) {
    refs.push({ type: 'website', url: component.homepage });
  }
  if (component.vcs && component.vcs !== component.homepage) {
    refs.push({ type: 'vcs', url: component.vcs });
  }
  return refs.length ? refs : undefined;
}

/**
 * The single file a component is vendored as, or null when it is a directory.
 *
 * Decided by the declaration rather than by how many files the tree happens to
 * yield. A directory holding one file is still a directory: `relearn:path`
 * names the directory and not what sits inside it, so a rename there would
 * leave a digest over the bytes alone unmoved and the committed document
 * unchanged - the case `treeHash` below exists to catch. Reading the
 * declaration also keeps a component's fields from changing shape on the day a
 * second file is vendored beside the first.
 */
function soleFile(themeDir, component) {
  const [only, ...rest] = component.paths || [];
  if (!only || rest.length) {
    return null;
  }
  return fs.statSync(path.join(themeDir, only)).isFile() ? only : null;
}

/**
 * Hash a component, but only when it is vendored as exactly one file.
 *
 * CycloneDX hashes describe the component's artifact. For a component vendored
 * as a directory there is no single artifact to describe, and inventing a
 * digest over a concatenation would put a number in the document that no
 * consumer could reproduce. Those components carry no hash, which is the
 * honest answer - `treeHash` below gives them a tripwire of our own instead.
 *
 * Takes the resolved file rather than the component, so that this and
 * `properties` below cannot come to different conclusions about the same
 * component. `build` asks `soleFile` once and hands the answer to both; the
 * two fields are exclusive, and a check asserts it.
 */
function hashes(themeDir, file) {
  if (!file) {
    return undefined;
  }
  const digest = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(themeDir, file)))
    .digest('hex');
  return [{ alg: 'SHA-256', content: digest }];
}

/**
 * A digest over every file a multi-file component resolves to.
 *
 * `version` is hand-kept, so a vendored update that did not bump it is the one
 * failure this mechanism cannot catch by itself. A component vendored as one
 * file gets its tripwire from `hashes` and `relearn:path` together: between
 * them the bytes and the name are covered, so any change to either moves the
 * committed document and the diff asks the question. This is that tripwire for
 * a component vendored as a directory, where `relearn:path` stops at the
 * directory name and the files inside it would otherwise go unwatched.
 *
 * A property rather than a `hashes` entry, because CycloneDX hashes describe
 * the component's own artifact and a digest over a directory is not one - no
 * consumer could reproduce it from the upstream release. Its only audience is
 * the diff of `sbom.cdx.json`.
 *
 * Over each file's path and content digest rather than over the bytes alone,
 * so that renaming or moving a file registers too. Sorted here rather than
 * trusting the caller: a drifting order would change the digest while every
 * determinism check still passed, both renders sharing the same wrong order.
 */
function treeHash(themeDir, files) {
  const summary = [...files]
    .sort()
    .map((file) => {
      const digest = crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(themeDir, file)))
        .digest('hex');
      return `${file}\0${digest}\n`;
    })
    .join('');
  return crypto.createHash('sha256').update(summary, 'utf8').digest('hex');
}

/**
 * Where the component lives, plus whatever the declaration wants to say.
 *
 * The declared prefixes go in rather than the files they resolve to. A reader
 * wants to know where a component sits, and a component vendored as a
 * directory can hold a great many files - listing every one would swell the
 * document to say nothing the directory name does not already say.
 *
 * `sole` is the one `hashes` above was given, so the tree hash appears exactly
 * where the checksum did not.
 */
function properties(themeDir, component, files, sole) {
  const props = [];
  if (component.notes) {
    props.push({ name: 'relearn:notes', value: component.notes });
  }
  if (component.bundled) {
    props.push({ name: 'relearn:bundled', value: 'true' });
  }
  if (!sole) {
    props.push({ name: 'relearn:treehash', value: treeHash(themeDir, files) });
  }
  for (const p of component.paths || []) {
    props.push({ name: 'relearn:path', value: p });
  }
  return props.length ? props : undefined;
}

/**
 * A patched copy is not the upstream release, and a scanner matching the purl
 * against an advisory needs to know that. `pedigree` is the field that says so.
 */
function pedigree(component) {
  if (!component.patched) {
    return undefined;
  }
  const ancestor = { type: 'library', name: component.name };
  if (component.version) {
    ancestor.version = component.version;
  }
  if (component.purl) {
    ancestor.purl = component.purl;
  }
  return { ancestors: [ancestor], patches: [{ type: 'unofficial' }] };
}

/** Drop undefined members so the emitted JSON has no empty keys. */
function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/**
 * Case-insensitive, but without `localeCompare`.
 *
 * Collation there comes from ICU, which differs between Node builds, and this
 * document is committed and compared byte for byte on both Windows and Linux.
 * Lowercasing and falling back to codepoint order sorts the same everywhere.
 */
function byName(a, b) {
  const [x, y] = [a.name.toLowerCase(), b.name.toLowerCase()];
  if (x !== y) {
    return x < y ? -1 : 1;
  }
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

/**
 * A name-based UUID, per RFC 4122 section 4.3.
 *
 * Deterministic by construction: the same name always yields the same UUID,
 * on any machine and any Node build.
 */
function uuidv5(name, namespace = URL_NAMESPACE) {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const digest = crypto
    .createHash('sha1')
    .update(Buffer.concat([ns, Buffer.from(name, 'utf8')]))
    .digest();

  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = bytes.toString('hex');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

/**
 * A serial number naming this exact document.
 *
 * The name hashed into the UUID is the theme's versioned purl carrying a digest
 * of the document as a qualifier, so it stays a URL - which is what
 * `URL_NAMESPACE` above promises - while moving whenever anything in the
 * document moves. The document passed in must still carry `NIL_SERIAL`, so the
 * field being computed cannot influence its own value.
 *
 * Reproducible by anyone holding the file: put `NIL_SERIAL` back and repeat
 * this. The digest is over the compact `JSON.stringify`, not over the file's
 * own pretty-printed bytes.
 */
function contentSerial(document, version) {
  const digest = crypto.createHash('sha256').update(JSON.stringify(document), 'utf8').digest('hex');
  return `urn:uuid:${uuidv5(`${PURL}@${version}?content=${digest}`)}`;
}

/**
 * The released version, without the commit the post-commit hook stamps on.
 *
 * The SBOM describes a release. Carrying `+<commit>` would mean regenerating
 * this file on every commit to keep it honest.
 */
function themeVersion(themeDir) {
  const stamped = fs.readFileSync(path.join(themeDir, 'layouts', 'partials', 'version.txt'), 'utf8').trim();
  return stamped.split('+')[0];
}

/**
 * When that version was released, as the release workflow recorded it.
 *
 * An unknown version aborts rather than falling back to the current time: a
 * timestamp that quietly means "whenever this happened to run" is worse than
 * no document at all, because nothing downstream can tell the two apart.
 */
function releaseTimestamp(themeDir, version) {
  const changelog = fs.readFileSync(path.join(themeDir, 'CHANGELOG.md'), 'utf8');
  const heading = new RegExp(`^## ${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\((\\d{4}-\\d{2}-\\d{2})\\)`, 'm');

  const found = changelog.match(heading);
  if (!found) {
    throw new Refusal(`CHANGELOG.md records no release date for ${version}.\n` + 'The SBOM timestamp comes from there, so it cannot be generated for a version that has not been released.');
  }

  // CycloneDX wants a date-time and the changelog records a date, so this is
  // midnight UTC on the day of release rather than a spurious clock reading.
  return `${found[1]}T00:00:00Z`;
}

/** The theme's own identity, read rather than hardcoded. */
function themeComponent(themeDir, version) {
  const meta = TOML.load(fs.readFileSync(path.join(themeDir, 'theme.toml'), 'utf8')) || {};

  // The version belongs in `bom-ref` as well as in `purl`. A bom-ref only has
  // to be unique inside one document, but it is also what merge tools join on
  // - and a versionless one collapses the roots of two releases onto a single
  // node, silently combining their dependency edges.
  const coordinate = `${PURL}@${version}`;

  return compact({
    'type': 'library',
    'bom-ref': coordinate,
    'name': meta.name ? `hugo-theme-${meta.name.toLowerCase()}` : 'hugo-theme-relearn',
    version,
    'description': meta.description,
    'authors': meta.author?.name ? [{ name: meta.author.name }] : undefined,
    'purl': coordinate,
    'licenses': licenses(meta.license),
    // `homepage` in theme.toml is the repository and `demosite` is the
    // published documentation, which is the way round CycloneDX wants them.
    'externalReferences': [
      { type: 'website', url: meta.demosite || meta.homepage },
      { type: 'vcs', url: meta.homepage },
      { type: 'license', url: meta.licenselink },
    ].filter((r) => r.url),
  });
}

/**
 * Build the document.
 *
 * Only `theme` scope components are included. They are what a site using this
 * theme publishes; the docs, dev and build scopes describe what the project
 * consumes, and listing them here would misdescribe what a user serves.
 */
export function build(themeDir, declaration, resolveFiles) {
  const version = themeVersion(themeDir);
  const root = themeComponent(themeDir, version);

  const components = declaration.components
    .filter((c) => c.scope === 'theme')
    .map((c) => {
      const files = resolveFiles(c);
      // Asked once, so the checksum and the tree hash are two answers to one
      // question rather than two questions that happen to agree.
      const sole = soleFile(themeDir, c);
      return compact({
        'type': 'library',
        'bom-ref': bomRef(c),
        'name': c.name,
        'version': c.version,
        'description': c.description,
        'purl': c.purl,
        'licenses': licenses(c.license),
        'copyright': c.copyright,
        'hashes': hashes(themeDir, sole),
        'externalReferences': externalReferences(c),
        'pedigree': pedigree(c),
        'properties': properties(themeDir, c, files, sole),
      });
    })
    .sort(byName);

  // A component vendored only because another needs it hangs off that one
  // rather than off the theme. Saying the theme depends directly on every d3
  // package would be false - it calls one of them, and the rest came along
  // with it.
  //
  // An extension - a component that `extends` another - is not required by
  // anything, so the theme keeps its own edge to it: the theme loads it
  // itself. It depends on its host all the same, since it only runs inside
  // it, and that edge is added to its own.
  //
  // The credits page nests its list by these same rules, out of the same
  // fields, in the theme's `docs/layouts/partials/shortcodes/thirdparty.html`.
  // A change to either rule belongs in both.
  //
  // Nothing is validated here. `loadDeclaration` resolves `requires` and
  // `extends` for both consumers precisely because the two fail differently on
  // the same mistake, and it has already run by the time anything reaches this
  // function.
  const refOf = new Map(declaration.components.map((c) => [c.name, bomRef(c)]));
  const required = new Set();
  for (const c of declaration.components) {
    for (const name of c.requires || []) {
      required.add(name);
    }
  }

  // Two orders, deliberately. The root's edges follow `components`, which is
  // sorted by name, so reading the document top to bottom meets them in the
  // order the components themselves appear. A component's own edges come from
  // a hand-written `requires` array and its `extends`, where the order is
  // whatever the declaration happened to list - so they are sorted, or editing
  // the TOML would move lines in the committed document for no reason. Making
  // the two agree would rewrite every root edge to buy nothing.
  const byRef = new Map(declaration.components.map((c) => [bomRef(c), c]));
  const dependencies = [
    {
      ref: root['bom-ref'],
      dependsOn: components.filter((c) => !required.has(c.name)).map((c) => c['bom-ref']),
    },
    ...components.map((c) => {
      const declared = byRef.get(c['bom-ref']);
      const needs = [...(declared.requires || []), ...(declared.extends ? [declared.extends] : [])];
      return { ref: c['bom-ref'], dependsOn: needs.map((n) => refOf.get(n)).sort() };
    }),
  ];

  // `version` counts revisions of one serial number, and this serial names one
  // exact document - so a changed document is never a new revision of an old
  // one, and this stays at 1. The theme's own version is `metadata.component`.
  const document = {
    bomFormat: 'CycloneDX',
    specVersion: SPEC_VERSION,
    serialNumber: NIL_SERIAL,
    version: 1,
    metadata: {
      timestamp: releaseTimestamp(themeDir, version),
      tools: {
        components: [
          {
            type: 'application',
            name: 'relearn-sbom',
            description: `Generated from ${DECLARATION} by the Relearn infra repository`,
          },
        ],
      },
      component: root,
    },
    components,
    dependencies,
  };

  // Assigning over the placeholder rather than adding the key, so the serial
  // keeps the position it was hashed in.
  document.serialNumber = contentSerial(document, version);
  return document;
}

/**
 * The document as it belongs on disk.
 *
 * Every value on its own line, so that adding one dependency shows up as one
 * added line rather than as a rewrite of whichever line held the list. That is
 * why `sbom.cdx.json` is in the theme's `.prettierignore`: Prettier cannot
 * keep an array of strings expanded - `objectWrap` covers objects only - so at
 * the configured width it would join every `dependsOn` back onto one line.
 *
 * LF and a trailing newline whatever the platform: both repositories are
 * `eol=lf`, and the suite compares this file byte for byte.
 */
export function render(themeDir, declaration, resolveFiles) {
  return `${JSON.stringify(build(themeDir, declaration, resolveFiles), null, 2)}\n`;
}

export { SPEC_VERSION, NIL_SERIAL, contentSerial };
