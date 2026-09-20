#!/usr/bin/env node
//
// Generates the theme's CycloneDX SBOM from its dependency declaration.
//
//   npm run sbom                 fail if the committed file is out of date
//   npm run sbom:update          rewrite <theme>/sbom.cdx.json
//
// The declaration lives in the theme repository because it describes what the
// theme ships; this generator lives here because it is tooling. The theme
// checkout is resolved the same way the tests resolve it.
//
// Generation refuses while the declaration and the tree disagree: an SBOM
// built over a stale declaration is the failure this mechanism exists to
// prevent, so drift aborts rather than warns.
//
// Failure sets `process.exitCode` and returns rather than calling
// `process.exit`. Writes to a pipe are asynchronous and `exit` does not flush
// them, so exiting mid-write would truncate the drift report - under `npm`,
// where stderr is always a pipe, and where that report is the whole reason the
// run is red.

import fs from 'fs';
import path from 'path';
import { resolveThemeDir } from '../../runner/paths.js';
import { loadDeclaration, reconcile, describeDrift, Refusal, DECLARATION, SBOM_FILE } from './declaration.js';
import { render } from './cyclonedx.js';

const updating = process.argv.slice(2).includes('--update');
const themeDir = resolveThemeDir();

function run() {
  const declaration = loadDeclaration(themeDir);
  const reconciliation = reconcile(themeDir, declaration);

  const drift = describeDrift(reconciliation);
  if (drift) {
    throw new Refusal(`${DECLARATION} does not match the vendored tree.\n\n${drift}`);
  }

  const rendered = render(themeDir, declaration, (c) => reconciliation.byComponent.get(c.name) || []);

  const target = path.join(themeDir, SBOM_FILE);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;

  if (!updating) {
    if (current === rendered) {
      console.log(`ok       ${SBOM_FILE} is up to date`);
      return;
    }
    console.error(`FAIL     ${SBOM_FILE} is ${current === null ? 'missing' : 'out of date'}`);
    console.error('         Run `npm run sbom:update` and commit the result.');
    process.exitCode = 1;
    return;
  }

  if (current === rendered) {
    console.log(`unchanged  ${SBOM_FILE}`);
  } else {
    fs.writeFileSync(target, rendered, 'utf8');
    console.log(`written    ${SBOM_FILE}`);
  }

  const shipped = declaration.components.filter((c) => c.scope === 'theme');
  const unversioned = shipped.filter((c) => !c.version).map((c) => c.name);

  console.log(`           ${shipped.length} shipped component(s), ${reconciliation.vendored.length} vendored file(s)`);
  if (unversioned.length) {
    console.log(`           no version declared for: ${unversioned.join(', ')}`);
  }
}

try {
  run();
} catch (err) {
  // A `Refusal` names a state of the repository to go and fix - an undeclared
  // dependency, an unreleased version - and is worth no more than its message.
  // Anything else is a defect in this tooling and keeps its stack, which is
  // the only thing that would locate it.
  if (!(err instanceof Refusal)) {
    throw err;
  }
  console.error(err.message);
  process.exitCode = 1;
}
