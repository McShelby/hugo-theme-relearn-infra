# Relearn Infra

The test suite and tooling for the [Relearn](https://github.com/McShelby/hugo-theme-relearn) Hugo theme. The theme itself lives there, along with the workflows, release actions and git hooks that act on it.

**Nothing in this repository is shipped to theme users.** For a Hugo theme the repository *is* the distributed artifact — everything committed to it is downloaded by every user who runs `hugo mod get`, adds a submodule or unpacks a release archive. A snapshot suite and a headless browser are of no use to them, so they live here instead.

The rule for deciding where a file belongs is one question: *does somebody installing the theme need this?* If not, it goes here — unless it can only act from the theme repository, which is true of its workflows, the actions they call and its git hooks.

> [!IMPORTANT]
> **Please open issues in the [theme repository](https://github.com/McShelby/hugo-theme-relearn/issues), not here** — including issues about the tests or the tooling.
>
> Issues, milestones and releases are all tracked on the theme side, and a release is cut from a milestone there. Splitting the tracker would split that history. A `#123` reference in a commit message on either side therefore points at the same ticket; the `.issuetracker` file here is configured to resolve them against the theme repository.

---

## Quick Start

Check both repositories out side by side:

```
repos/
├── hugo-theme-relearn/
└── hugo-theme-relearn-infra/
```

```bash
cd hugo-theme-relearn-infra
npm ci
npm test
```

That prints one line per site and a count, every one of them `ok`.

A single `npm ci` prepares everything, for every script. That includes the headless browser the screenshot generator drives, so the first install pulls a Chromium build and is correspondingly slow.

Beyond those packages:

**Node.js** at the version `.nvmrc` pins. Install it through a version manager — [nvm](https://github.com/nvm-sh/nvm), or [nvm-windows](https://github.com/coreybutler/nvm-windows) — rather than as a system package, so the version can follow the project rather than the machine. `nvm use` here reads `.nvmrc`, and so does CI, so a working copy and a runner cannot drift.

The pin is not arbitrary. Before v26.8.1, Node's `fs.rmSync` silently removed nothing on Windows when a path contained a non-ASCII character — [nodejs/node#61067](https://github.com/nodejs/node/issues/61067), fixed by [#61108](https://github.com/nodejs/node/pull/61108) — which turned "replace this directory" into "merge into it" without a word, and a checkout under `C:\…\Sören\…` was enough to trigger it. `fs.cpSync` had a matching blind spot. A suite whose whole job is comparing directories cannot run on a filesystem API that quietly declines; the pin is what lets the runner use the plain calls rather than hand-rolled substitutes.

**Hugo** at least the minimum the theme declares in its `theme.toml`. The plain edition is enough; the theme uses no Sass. Install it the same way, through [hvm](https://github.com/jmooring/hvm), which keeps several versions side by side — `--hugo=min`, `--hugo=latest` and pinned versions are all resolved through it, and fetched on demand. `HUGO_BIN` bypasses the lookup entirely, which is what CI uses.

### Finding the theme

The theme is never vendored here. It is located at runtime, in this order:

1. `RELEARN_THEME_DIR`, if set
2. a sibling directory named `hugo-theme-relearn`
3. the parent directory

So the suite always runs against a real checkout — your working tree, a release tag, or whatever CI checked out:

```bash
RELEARN_THEME_DIR=/path/to/theme npm test
```

---

## Layout

| Path | Purpose |
|------|---------|
| `runner/paths.js` | resolves the theme checkout and the Hugo binary |
| `runner/hugo.js` | builds and serves a site |
| `runner/config.js` | assembles the config directory a build runs against |
| `runner/cases.js` | reads the cases and expands them into builds |
| `runner/snapshot.js` | golden-file comparison |
| `tests/run.js` | the test CLI |
| `tests/checks.js` | checks on the runner itself |
| `tests/cases/` | what to build, and how deeply to check it |
| `tests/sites/` | content and configuration, one directory per site |
| `tests/axes/` | configuration dimensions, one directory per value |
| `tests/environments/` | environments for sites that have none of their own |
| `tests/expected/` | stored expected output |
| `tools/screenshots/` | regenerates the docs' `featured.png` images |
| `.github/actions/run-test/` | the test procedure, called by the theme's `test-execution` workflow — the only action here |

`runner/` is the reason tests and tooling share one repository: visual regression testing and screenshot generation are the same machinery — resolve a theme, build a site, serve it, drive a browser.

---

## Tests

```bash
npm test                               # the runner checks, then every case
npm run checks                         # the runner checks alone
node tests/run.js --build=minimal      # one case, or one build inside it
node tests/run.js --hugo=min           # the theme's declared minimum version
node tests/run.js --hugo=latest        # the newest release
node tests/run.js --hugo=v0.165.0      # one specific version
node tests/run.js --update             # rewrite the expected output
```

`npm test` runs `tests/checks.js` and then `tests/run.js`. Either form works — these two are the same command:

```bash
npm test -- --build=minimal
node tests/run.js --build=minimal
```

Flags reach the runner directly; through `npm` they have to follow a `--` separator first. The examples above use the runner, being the shorter of the two.

Version selection asks [hvm](https://github.com/jmooring/hvm) for the executable, fetching the version first if it is not cached. `min` comes from the theme's `theme.toml` and `latest` is resolved by hvm; the `standard` edition is always used, which is enough because the theme uses no Sass. `HUGO_BIN` overrides the lookup entirely, which is what CI uses.

### Cases, sites, axes

A **case** says what to build and how deeply to check it. A **site** is content plus the configuration it needs to be itself. An **axis** is a dimension of configuration whose values are config directories. Most cases are one site in one configuration; some vary an axis and produce a result per combination; some spell out several builds that share one output tree.

```toml
# tests/cases/url-permutations/case.toml
site        = "url-permutations"
environment = "testing"

[axes]
  urls = ["relative", "absolute", "ugly"]
```

One content set, three results. `urls` is a directory per value under `tests/axes/`, and adding a fourth mode is a directory and a name:

| Value | Settings | A link renders as |
|---|---|---|
| `relative` | `relativeURLs = true` | `./first-page/index.html` |
| `absolute` | `relativeURLs = false`, subdirectory `baseURL` | `/subdir/first-page/index.html` |
| `ugly` | `uglyURLs = true` | `/first-page.html` |

A site name ending in `@theme` resolves against the theme checkout rather than `tests/sites/`, so `docs@theme` is the theme's own documentation, built in place and always matching the code under test. It also settles who supplies the theme: a site inside the theme resolves it itself, a fixture is handed it by the runner.

### Three layers

| Layer | Asserts |
|-------|---------|
| Build | exits cleanly, and emits no `WARN`/`ERROR` outside a baseline |
| File set | exactly the expected files were generated — nothing missing, nothing extra |
| Content | every file identical to the stored expectation, byte for byte bar line endings |

Layers are cumulative. A case declares how deep with `layer`, defaulting to `content`, so it opts down rather than up and says why when it does. The theme's own sites stop at the file set: a content baseline over 2000 files churns on every prose edit and would be read by nobody.

A result is stored under `tests/expected/<case>/`, named after the layer that put it there — `files.txt` for the file set, `content/` for the content beside it.

### Builds that belong together

Some results are not one Hugo build. `github` is the docs with the exampleSite beneath them, which is what GitHub Pages actually serves; `versioning` is a current and an archived site, each configured to know about the other. Built separately, nothing checks the links running between them.

```toml
# tests/cases/github/case.toml
layer = "files"

[[builds]]
  site        = "docs@theme"
  environment = "github"

[[builds]]
  site        = "exampleSite@theme"
  environment = "github"
  dest        = "exampleSite"
```

`dest` says where in the shared tree a build writes. The builds run in the order written, and the result is compared once, as a whole.

### Configuration

Hugo reads one config directory, and only `_default/` and `<env>/` beneath it, so a site's own configuration cannot be layered onto from outside. The runner assembles a directory instead: the site's `_default` copied verbatim, and the environment and the build's axes merged into a single `<env>/hugo.json`.

Copying `_default` rather than parsing it is deliberate — that is where the filename convention gets awkward, with language-suffixed names and `module.toml`, and copying leaves all of it with Hugo.

An environment resolves in the site's own `config/` or in `tests/environments/`. A site answers for itself where it can; this repository answers for sites that have none. `testing` is held in both places — the theme keeps a copy per site so `hugo -e testing` works by hand — and the runner aborts if the copies ever stop agreeing.

### Reference versions

Layers 2 and 3 only run when Hugo is `path` or `latest`. On a pinned older version — `--hugo=min`, `--hugo=v0.141.0` — only the build layer runs, and the run says so.

That is not laziness. Hugo legitimately changes what it emits between releases: v0.141.0 writes a `search/index.print.html` for the exampleSite that v0.165.0 does not. Comparing stored output across the version matrix would be asserting something false, and the failure would be noise rather than signal. What the older versions still prove is the thing that actually matters for a declared minimum — that the theme builds cleanly and without new warnings.

`--update` refuses to run from a non-reference version, so a baseline cannot be regenerated from the wrong Hugo by accident.

### Why byte comparison works

Hugo's output is deliberately not reproducible by default — cache-busting hashes and generated element IDs differ per build. The `testing` environment turns that off (`disableAssetsBusting`, `disableRandomIds`, `disableGeneratorVersion`, `disableHugoGeneratorInject`, minification off), which is why almost every case names it.

A site does not repeat those switches. Its own configuration describes the site; reproducibility comes from the environment, in one place rather than one per site.

### Updating expected output

```bash
node tests/run.js --update
```

> **The resulting diff *is* the test result.** Read it before committing. An unreviewed snapshot update turns the suite from a safety net into a rubber stamp.

### Warning baselines

Any `WARN` or `ERROR` fails a run unless listed in a baseline, most specific last:

| File | Scope |
|------|-------|
| `tests/warnings.txt` | theme-wide, mostly Hugo deprecations |
| `tests/sites/<site>/warnings.txt` | what a site's own content provokes |
| `tests/cases/<case>/warnings.txt` | what a configuration provokes |

Each sits beside the thing it describes. A site's file is checked against the build of that site, so what the docs provoke applies wherever the docs are built — including inside the `github` sequence. Each line is a substring; a warning containing it is accepted.

These files are a record of known outstanding work, **not a place to silence noise**. Adding a line means consciously accepting a defect. Delete a line as soon as the underlying issue is fixed, so a regression fails the suite again.

`tests/warnings.txt` currently records the Hugo APIs the theme still relies on that have been deprecated in 0.156–0.158, at both template and configuration level. None break a build yet; all of them will when Hugo removes the API.

### Adding a case

```bash
mkdir -p tests/sites/yoursite/config/_default tests/sites/yoursite/content
# write config/_default/hugo.toml — about the site, not about determinism
mkdir -p tests/cases/yoursite
# write case.toml: site = "yoursite", environment = "testing"
node tests/run.js --build=yoursite --update
```

Review the generated `tests/expected/yoursite/` and commit site, case and output together. If a site needs hundreds of pages, it is testing the wrong thing.

`--build` matches a path prefix, so a case name runs everything in it and a combination runs the one. Asking for something that does not exist prints what does, which is the quickest way to check:

```bash
node tests/run.js --build=?
```

`--update` on a full run also prunes: a stored result no case produces any more is deleted rather than left behind.

### Checking the runner

```bash
npm run checks
```

The suite's own machinery has logic worth pinning — a merge that has to match Hugo's, a filename convention with a surprising unwrap rule, and a dozen validations whose whole job is to abort. Building sites does not exercise any of it: a merge bug surfaces there as a wrong baseline, and an abort that never fires surfaces as nothing at all.

---

## Screenshots

Regenerates the `featured.png` previews on the docs' shortcode pages.

```bash
npm ci                                    # full install — needs puppeteer
npm run screenshots                       # serves the docs itself on port 3132
npm run screenshots -- --base=http://localhost:1313   # use a running server
npm run screenshots -- --port=3140        # serve on a different port
```

Output goes to `<theme>/docs/content/<page>/featured.png` in the resolved theme checkout.

Port 1313 is never a default here — that belongs to your own dev server.

---

## CI

**This repository has no workflows.** It holds one composite action, `run-test`, which the theme's `test-execution` calls; nothing here triggers a run. The theme's build and release actions live with the theme, because they address its working tree directly.

| Workflow | Where | Trigger |
|----------|-------|---------|
| `test-execution` | theme repo | push, PR, nightly, dispatch, `workflow_call` |

`test-execution` never releases, deploys or publishes anything. The `workflow_call` trigger exists solely so `version-release` can gate on it.

### One driver

A single run tests the pair, and it happens in the theme repository — so **nothing you push here triggers anything**.

A change spanning both is pushed here first and to the theme second, which is what makes the pairing work: by then the branch the theme's run looks for exists. The other way round, that run pairs against infra `main` and can pass while testing half the change. A change with no theme counterpart triggers nothing at all — start a run by hand from the theme's Actions tab and name the branch in `infra_ref`.

The workflow is thin: it does its checkouts and hands off to the **`run-test`** composite action, which owns the actual procedure — resolving the Hugo version, installing Hugo and Node, installing dependencies and running the suite. Tool versions and install flags therefore exist in exactly one place. It takes `theme_dir`, `infra_dir` and `hugo` (`min`, `latest` or an explicit version); Node comes from `.nvmrc`. With `hugo: min` it reads the minimum out of the theme's own `theme.toml`, so the declared minimum is what actually gets tested.

That is also the boundary between the repositories: the workflow file always comes from the theme at the ref being tested, so triggers, the matrix and the lookup are a **theme** change, while what happens inside a run is an **infra** change, picked up from the paired branch.

### Everything goes through the checkout

`run-test` is not pinned to `@main`. `test-execution` resolves a branch first, checks this repository out at that ref, and then references the action by path — `./infra/.github/actions/run-test`.

That is partly a correctness choice and partly the only option available: GitHub does not allow expressions in `uses:`, so `@${{ steps.pick.outputs.ref }}` is impossible. Going through the checkout means the branch chosen applies to the action as well as to the code, so a matching branch pair is genuinely testing both halves of itself — including its own version of the test procedure.

`./` in a `uses:` is resolved against `$GITHUB_WORKSPACE`, not against the workflow's own repository — which is what makes this legal at all. `test-execution` checks the theme out into `theme/` and still reaches `./infra/.github/actions/run-test`.

The lookup itself cannot be factored into an action, because resolving the ref is precisely what determines which checkout the action would come from.

The nightly run builds against the latest Hugo release. Hugo breaks themes on its own schedule; this is how that gets found in CI rather than in an issue report. It lives in the theme repository with everything else, and fires only on that repository's default branch, as scheduled runs always do.

### Tokens

The theme's workflows only ever read from this repository, so the default `GITHUB_TOKEN` suffices. No personal access token or stored secret is needed — while both repositories are public, which is what makes a cross-repository checkout work without one.

---

## Git hooks

There are none here. The theme's `post-commit` hook acts on the theme repository, so it lives there in `hugo-theme-relearn/.githooks/` — a fresh theme clone then stamps versions correctly without needing this repository checked out at all.

---

## License

MIT, matching the theme.
