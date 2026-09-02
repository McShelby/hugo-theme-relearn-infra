// Builds and serves fixture sites against the theme under test.

import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { resolveHugoBin } from './paths.js';

/**
 * Hugo resolves a theme by name inside a themes directory. Rather than require
 * the checkout to be named `hugo-theme-relearn`, we hand Hugo the parent
 * directory and the actual basename, so any checkout name works.
 */
function themeArgs(themeDir) {
  return ['--themesDir', path.dirname(themeDir), '--theme', path.basename(themeDir)];
}

/**
 * Build a fixture site once.
 *
 * Returns { code, stdout, stderr }. Never throws on a failed build - callers
 * decide whether a non-zero exit is a failure or an expected outcome.
 */
export function build({
  siteDir,
  destDir,
  themeDir,
  configDir,
  hugo = 'path',
  environment = 'testing',
  extraArgs = [],
  injectTheme = true,
}) {
  const bin = resolveHugoBin(hugo, themeDir, siteDir);
  const args = [
    '--source',
    siteDir,
    '--destination',
    destDir,
    ...(injectTheme ? themeArgs(themeDir) : []),
    ...(configDir ? ['--configDir', configDir] : []),
    '--environment',
    environment,
    // Never --cleanDestinationDir: a sequence writes several builds into one
    // tree, and the second carrying it would wipe what the first one wrote.
    // The runner empties the destination itself, once, beforehand.
    '--printPathWarnings',
    '--printI18nWarnings',
    '--logLevel',
    'info',
    ...extraArgs,
  ];

  const res = spawnSync(bin, args, { encoding: 'utf8', shell: false });
  return {
    code: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    command: `${bin} ${args.join(' ')}`,
    bin,
  };
}

/**
 * Start `hugo server` and resolve once it is actually serving.
 *
 * Port 1313 is deliberately not the default here - that is the port a human
 * runs their own dev server on, and colliding with it is a nuisance.
 */
export function serve({ siteDir, themeDir, hugo = 'path', environment = 'testing', port = 3131, injectTheme = true }) {
  const bin = resolveHugoBin(hugo, themeDir, siteDir);
  const args = [
    'server',
    '--source',
    siteDir,
    ...(injectTheme ? themeArgs(themeDir) : []),
    '--environment',
    environment,
    '--port',
    String(port),
    '--bind',
    '127.0.0.1',
    '--disableLiveReload',
    '--renderToMemory',
  ];

  const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`hugo server did not start within 60s\n${out}`)), 60_000);
    const check = (chunk) => {
      out += chunk.toString();
      if (/Web Server is available/i.test(out)) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on('data', check);
    child.stderr.on('data', check);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`hugo server exited with ${code}\n${out}`));
    });
  });

  return {
    url: `http://127.0.0.1:${port}`,
    ready,
    stop: () => child.kill(),
  };
}
