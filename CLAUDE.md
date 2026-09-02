# CLAUDE.md

Guidance for AI agents working in this repository.

## What this is

The test suite and tooling for the Hugo Relearn theme. **Nothing here is shipped to theme users.** The theme repo (`../hugo-theme-relearn`) holds what a consumer needs, plus the workflows, release actions and git hooks that act on it and can live nowhere else.

When deciding where a file goes, ask whether a person installing the theme needs it. If not, it belongs in this repo — unless it can only act from the theme repo, as its workflows, their actions and its git hooks do.

## Layout

- `runner/` — shared core used by both tests and tooling
  - `paths.js` resolves the theme checkout and the Hugo binary
  - `hugo.js` builds and serves a site
  - `config.js` assembles the config directory a build runs against
  - `cases.js` reads the cases and expands them into builds
  - `snapshot.js` golden-file comparison
- `tests/` — cases, sites, axes, environments, expected output, the CLI
- `tools/screenshots/` — regenerates the docs' `featured.png` images

`runner/` is why tests and screenshots share a repo: visual regression and screenshot generation are the same machinery.

## Running things

```bash
npm test                     # see README.md for flags
npm run screenshots
```

The theme is resolved via `RELEARN_THEME_DIR`, else a sibling `hugo-theme-relearn`, else the parent directory.

## Rules

- **Never use port 1313.** That is the user's own dev server. Tests serve on 3131, screenshots on 3132.
- **Do not add a warning to a baseline to make a run green.** A `warnings.txt` is a list of known outstanding theme work. Adding a line means accepting a real defect; removing one is the goal.
- **Regenerate expected output deliberately.** `npm test -- --update` rewrites it. Read the resulting diff before committing — that diff *is* the test result.
- **Sites stay small.** A diff should be readable. If a site needs hundreds of pages, it is testing the wrong thing.
- **A site's config is about the site.** Determinism comes from the `testing` environment, which the case names. Do not copy those switches into a site.

## Known issues

- The theme's `urlExists.gotmpl` reads a `hugo.Store` map with `isset` while sibling goroutines write it via `SetInMap`, which crashes Hugo intermittently with `fatal error: concurrent map read and map write`. Reproduced on v0.165.0: 2 of 6 docs builds fail with `urlExternalCheck` on, 0 of 6 with it off. The `testing` environment sets it off, so the suite is unaffected - but it is a live defect for users who enable it.

## Related

The theme repo has its own `CLAUDE.md` covering theme conventions, shortcodes and release process.
