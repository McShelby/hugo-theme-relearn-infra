# Setting up the `test-` repository pair

A throwaway copy of both repositories on GitHub, used to rehearse the CI before
it runs on the real ones:

```
McShelby/test-hugo-theme-relearn         # theme
McShelby/test-hugo-theme-relearn-infra   # infra
```

Delete this file once the pair has served its purpose.

## What the code already does

No workflow names a repository any more. Each derives its sibling from
`github.repository` — the theme appends `-infra`, infra strips it and aborts if
the suffix was not there — so a `test-` pair, or a fork, stays inside itself
instead of reaching into the original. `runner/paths.js` applies the same rule
to the local checkout name. `build-site` and `release-milestone` derive the
Pages URL from the repository rather than reading it from the site config, and
all four workflows declare `permissions:` explicitly instead of inheriting a
repository default that differs between an old repository and a new one.

The one thing left in code is conditional on a decision you have not made yet —
see *Settings → If the repositories are private*.

## 1. Create the repositories

- [ ] Create `test-hugo-theme-relearn` and `test-hugo-theme-relearn-infra`,
      empty, no README, no license, no `.gitignore`
- [ ] **Disable Actions in both** (Settings → Actions → General → Disable) before
      pushing anything

The second step avoids a confusing red first run: whichever repository is
pushed first has no sibling to check out yet. Re-running the failed workflows
afterwards works too, but disabling is cleaner.

- [ ] Add each as a remote and push the branch to **both**
- [ ] Push the branch as `main` in both, so the deploy and release paths are
      reachable at all — they gate on `refs/heads/main`
- [ ] Re-enable Actions in both

## 2. Settings

### If the repositories are public

Nothing to configure. Cross-repo checkout of a public sibling needs no token.

### If the repositories are private

`secrets.GITHUB_TOKEN` is scoped to its own repository and cannot read the
sibling, even under the same account. Both the `ls-remote` probe and
`actions/checkout` fail without a token, so this needs a code change as well as
a secret.

- [ ] Create a fine-grained PAT with **Contents: Read** on both test
      repositories
- [ ] Store it as `SIBLING_TOKEN` in **both** repositories
- [ ] Wire it into the four workflows with a fallback, so the public pair needs
      no secret and pull requests from forks keep working:

```yaml
token: ${{ secrets.SIBLING_TOKEN || github.token }}
```

```bash
TOKEN="${SIBLING_TOKEN:-$GITHUB_TOKEN}"
git ls-remote --exit-code --heads \
  "https://x-access-token:${TOKEN}@github.com/${SIBLING}" "$BRANCH"
```

An undefined secret evaluates to the empty string, so the `||` falls through.
Secrets are masked in logs. The fallback is a convenience for the public case
only — on a private pair the PAT is mandatory.

- [ ] Note that private-repository Actions bill against the account quota, and
      infra's nightly `cron` keeps spending it. Delete the pair when done rather
      than guarding the schedule in code.

### Pages

Leave Pages **off**. `peaceiris/actions-gh-pages` pushes the `gh-pages` branch
over plain git and never touches the Pages API or its settings, so the deploy
step is fully exercised without a served site — and the branch can be diffed
byte for byte, which a served site cannot.

- [ ] After the first deploy, check Settings → Pages. GitHub has historically
      auto-enabled Pages on seeing a `gh-pages` branch; if it did here, the test
      site is served for real.

## 3. Exercise every path

### 3.1 `test-execution`, both directions

- [ ] Push a branch to test-theme → checks out test-infra, not production infra
- [ ] Push the same branch name to test-infra → the pair finds each other
- [ ] Push a branch to test-infra only → falls back to theme `main`
- [ ] Both `min` and `latest` matrix legs pass
- [ ] Break a fixture deliberately → the run fails **and** uploads an
      `actual-hugo-*` artifact containing `tests/actual`

The artifact check is worth the deliberate breakage: it is the half that only
exists on the runner, and a silent `if-no-files-found: ignore` would hide a
broken upload path.

### 3.2 `docs-publication` on main

- [ ] Push to test-theme `main`
- [ ] The built-site artifact is uploaded
- [ ] The `gh-pages` branch is created, and its contents carry
      `https://mcshelby.github.io/test-hugo-theme-relearn/`, not production's
      URL

That last one is the whole point of the derivation — grep the branch for
`github.io` and confirm nothing points at the real site.

### 3.3 `version-release`

Rehearsal first:

- [ ] `workflow_dispatch` from a branch → tests run, site builds, artifact
      uploads, nothing is tagged, committed, published or deployed

Then the real path. `check-milestone` requires a milestone with at least one
closed issue, no open issues, and a matching release-notes file — a fresh
repository has none of that:

- [ ] Create a milestone in test-theme named after a version whose
      `docs/content/introduction/releasenotes/<major>/<minor>.en.md` already
      exists in the copied content
- [ ] Create an issue, assign it to the milestone, close it
- [ ] `workflow_dispatch` from `main` with that milestone
- [ ] A tag, a release-back commit and a GitHub release appear in the test repo
- [ ] The release body's "What's new" link points at the test repo

Reusing an existing version number is safe here — a fresh repository has no tags
to collide with.

## 4. Teardown

- [ ] Delete both `test-` repositories, which also stops the nightly spend
- [ ] Revoke the `SIBLING_TOKEN` PAT if one was created
- [ ] Revert the `SIBLING_TOKEN` wiring if you added it and the production pair
      stays public
- [ ] Delete this file
