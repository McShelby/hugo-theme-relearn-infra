# Test configuration structure — plan

Settled design for restructuring how the suite configures its builds. Nothing
here is implemented yet. Delete this file once the migration has landed.

## Vocabulary

| Term | Meaning |
|---|---|
| **site** | content plus the `config/` it needs to be itself — no variants |
| **axis** | a named dimension of configuration; each value is a config directory |
| **case** | an ordered sequence of builds that belong together; usually one |
| **build** | one Hugo invocation — one site, one configuration |
| **result** | one output tree, compared as a whole; a sequence's builds share one |
| **config order** | the order the runner merges the environment and the axes; later wins |
| **layer** | reserved for the three assertions: build, file set, content |

`layer` means an assertion and nothing else. What gets merged into what is
`config order`, never a layer.

## Structure

```
tests/
  warnings.txt                      theme-wide
  axes/
    urls/{relative,absolute,ugly}/hugo.toml
    baseurl/{root,subdir}/hugo.toml
    lang/{single,files,dirs}/hugo.toml
  environments/
    testing/                        a Hugo config directory, not site-specific
  sites/
    urls/
      config/_default/              optional; a root hugo.toml does as well
      content/
      warnings.txt                  optional
    versioning-current/
    versioning-archived/
    docs@theme/
      warnings.txt                  only this; config and content are the theme's
  cases/
    url-permutations/
      case.toml
    versioning/
      case.toml
      warnings.txt                  optional
  expected/
```

Axes are the directories under `axes/`, and nothing else lives there, so
enumeration needs no name-based exclusion.

A `site` is named for where it lives. A bare name is a directory under
`sites/`; an `@theme` suffix resolves against the theme checkout instead, so
`docs@theme` is the theme's own `docs/`. Names keep the spelling of the
directory they name, camelCase included: `exampleSite@theme`, never
`example-site@theme`.

The same spelling is the directory name, so nothing translates between a case
and the filesystem. `@` cannot occur in a fixture name, which keeps the two
namespaces apart by construction rather than by a rule about what fixtures may
be called, and it is legal on Windows and Linux both — `:` would not have been.

That directory holds what infra knows about a site it does not own and cannot
write to — a warning baseline, and anything else infra-only. Configuration is
not among them. Config reaches a theme site as an environment or as axes, both
already merged in config order, so this directory never becomes a second
`_default` needing a merge of its own.

A case is a directory too, holding `case.toml` and optionally a warning
baseline.

An axis value and an environment are the same shape: a directory of config
files named by Hugo's convention. What differs is how one gets chosen — an
environment by name, an axis value by the combination being built. The runner
flattens and merges them all the same way, before Hugo sees any of it.

## Cases

A case is a sequence of builds. Almost every case is a sequence of one and is
written flat; a case whose builds only mean something together spells the
sequence out.

A build may vary by environment, by axes, by both, or by neither. Both keys are
optional; a build declaring neither is the site built plain, in `production`.

Every selecting key is singular — `environment`, and each name under `[axes]`.

`environment` names exactly one environment, never a list. A site wanted under
two environments is two cases, which is what they already are: separate
results, asserting separate things.

An axis value is one name or an array of them, the array being what makes an
axis branch. Inside `[[builds]]` it must resolve to exactly one — a sequence
build is a build, and cannot stand in for a permutation.

A case declares how deep to assert with `layer` — `content`, `files` or
`build`, cumulative, naming the deepest. It defaults to `content`, so a case
opts down rather than up and the strictest assertion is what you get without
thinking about it. Fixtures take the default; the theme's own sites set
`files`, because 2000-file content snapshots churn on every prose edit. The key
sits on the case, not the build: no case has builds wanting different depths.

Every result lives under `expected/<case>/` — directly, where a case has one
result, and one level down per branching axis where it has several. What is in
a result is named after the layer that put it there: the files layer writes
`files.txt`, the content layer writes `content/` beside it, and the build layer
writes nothing and leaves no directory at all.

`--update` also prunes: a result no case produces any more is deleted rather
than left behind. Drop a value from an axis and its stored output goes with it,
instead of lingering as a baseline nothing compares against.

`files.txt` is one relative path per line, files only, forward slashes,
alphabetically ordered. Forward slashes because the same baseline has to
compare equal on Windows and on Linux.

Content is compared with line endings normalised and everything else byte for
byte. A CRLF against an LF between one machine and another is not a regression;
anything else is. Binary output — images, fonts — is compared byte for byte
throughout, since normalising a PNG would invent equality rather than find it.

`content/` holds what Hugo produced and nothing else. Nothing the runner writes
sits inside it, so the comparison needs no exclusion rule and no filename is
reserved against a fixture that might legitimately want it.

The word is overloaded once, harmlessly: `content/` under `sites/` is a Hugo
source directory, `content/` under `expected/` is rendered output. They never
meet in one path.

```
expected/
  minimal/                  content — listing and tree
    files.txt
    content/
      index.html
      css/theme.css
  url-permutations/         content — one result per combination
    urls-relative/
      files.txt
      content/
        index.html
    urls-absolute/
    urls-ugly/
  theme-docs/               files — listing only
    files.txt
  theme-exampleSite/
    files.txt
  github/                   files — one listing over the merged tree
    files.txt
  versioning/               content — one tree, both builds
    files.txt
    content/
      index.html
      0.666/
        index.html
```

The listing belongs to the result, not the case: `url-permutations` carries a
`files.txt` per combination, not one for all three.

Keeping it at the content layer costs a file and buys two things. A page
appearing or vanishing reads as one line in the listing rather than as a wall
of content diff, and moving a case between layers stops being a re-baselining —
drop the tree, keep the listing.

### Axis builds — the variation is layered configuration

```toml
site        = "urls"
environment = "testing"

[axes]
  urls    = ["relative", "absolute", "ugly"]
  baseurl = "root"
```

Config order: the environment first, then each `axes/<axis>/<value>/` in the
order the case lists them. Axes end up above both the site's `config/_default/`
and the environment, so an axis can vary any key either of them sets.

Where a build declares both an environment and axes, the axes still come last.

Determinism comes from the `testing` environment, which a fixture names like
any other case does. A fixture's `config/_default/` describes the site — title,
output formats, content wiring — and says nothing about reproducibility, so
those settings are written once for every fixture rather than once per fixture.

The config order is what makes that work: `_default` describes the site,
`testing` makes it reproducible, the axes vary the dimension under test, each
above the last.

### Environment builds — the variation is environment selection

```toml
site        = "docs@theme"
environment = "testing"
```

An environment carries everything a build needs that the site does not already
provide, determinism included.

`testing` is not a baseline: it applies where a build names it and nowhere
else. Nearly everything names it, which is the point — a fixture inherits
determinism rather than restating it. The `github` case is the one that does
not, and so is the one without determinism.

`github` is the configuration that actually gets published and stays that way,
so it is not made deterministic. Its file set is stable even so, and differs
from `testing` in exactly the nine assets that minification renames —
`theme.css` against `theme.min.css`, and so on. Asserting it is what would
notice minification silently breaking in the published build.

### Sequences — builds that only mean something together

Some results are not one Hugo build. Versioning is two sites that only mean
something as a pair: one current, one archived, each configured to know about
the other. Neither says anything on its own.

```toml
[[builds]]
  site        = "versioning-current"
  environment = "testing"
  [builds.axes]
    baseurl = "root"

[[builds]]
  site        = "versioning-archived"
  environment = "testing"
  dest        = "0.666"
  [builds.axes]
    baseurl = "subdir"
```

Each build pins exactly one value of every axis it declares — a scalar or a
one-element array, both meaning the same thing. The array form stays legal so a
sequence build can be copied from a permuting case and reduced by deleting
values, without having to unwrap the brackets afterwards.

Beyond that the builds are independent: they may declare different axes
altogether, and different values of any they share. None of it branches — a
sequence is one result, however its builds are configured.

A bare TOML key after a table header belongs to that table, so `site` and
`dest` are written above `[builds.axes]`, and a case's `layer` above its first
`[[builds]]`. Written below, either would silently become a property of the
table above it rather than of the thing it names.

The builds share one output tree — not a directory each. `dest` says where in
it a build writes, relative to the root, and defaults to the root itself.

`dest` does two jobs, and only one of them is about hierarchy. Where a
deployment nests, it mirrors that: `github` puts exampleSite beneath the docs
because that is where GitHub Pages serves it. Where builds sit on unrelated
origins — different hosts, different ports — `dest` is there only to keep them
from writing over one another, and stands in no relation to any baseURL. So it
can be neither derived from the configuration nor checked against it. It is the
author's statement of where the files go.

The result is the one drawn under Cases above: `content/` holding the current
version, with the archived one beneath it at `content/0.666/`.

Sharing a tree is what makes the order significant: builds run in the order
written, and where two write the same path the later one wins. It is also why
there are no build names here and no build level in the tree — there is one
result, compared once.

The runner empties the result directory itself, once, before the first build.
`--cleanDestinationDir` is never passed: a second build carrying it would wipe
what the first one wrote, and the damage would show up as a baseline diff long
after the cause.

A build in a sequence takes an `environment` and `[builds.axes]` on the same
terms as any other build.

Both are per build, so two builds of one sequence may name different
environments, or none at all. Both versioning builds name `testing`: the case
is compared at the content layer, so its output has to reproduce.

The sequence is selected as a unit: `--build` names the case, and a prefix
deeper than that is rejected. A build lifted out of a sequence proves nothing,
which is what makes it a sequence in the first place.

The versioning sites are infra fixtures rather than the theme's own, and small
on purpose; the reasoning is under Choosing a layer, below.

`github` is a sequence too, and for the same reason. `exampleSite` publishes to
a subdirectory of the docs baseURL, so what GitHub Pages actually serves is one
tree:

```toml
layer = "files"

[[builds]]
  site        = "docs@theme"
  environment = "github"

[[builds]]
  site        = "exampleSite@theme"
  environment = "github"
  dest        = "exampleSite"
```

Built as two separate trees, as they are today, nothing checks the links
running between the two projects. Built as one, the file-set layer sees the
shape that ships.

## Choosing a layer

`layer` is only ever declared to give something up, so the question is always
what forces the reduction.

Start from what the case exists to catch, and take the shallowest layer that
would see it:

| The regression | Caught by |
|---|---|
| a template error, a page that stops rendering at all | build |
| output formats, permalinks, a renamed page, a publish shape | file set |
| anything about what is *inside* a page | content |

Then reduce, but only where one of these forces it:

- **the output is not reproducible.** `github` is the configuration that
  actually ships and stays undeterministic, so it cannot be asserted past the
  file set.
- **the diff is not reviewable.** The theme's own sites emit over 2000 files,
  and a content baseline across them churns on every prose edit. A diff nobody
  reads is a rubber stamp rather than a test.

Where reducing would cost a case its whole purpose, change the site rather than
the layer. Versioning is worth testing for the version switcher and for links
resolving to the other version's baseURL — both content, neither visible in a
file set — so it is covered by two small fixtures instead of by the theme's own
sites.

### Carrying the reason into the case

This file gets deleted when the migration lands, so the reasoning goes where
the choice was made. A `layer` line is written with the reason it was reduced,
the way the fixtures already explain themselves:

```toml
# What GitHub Pages actually serves: docs at the root, exampleSite beneath it.
# Built as one tree because that is how it deploys - built separately, nothing
# checks the links running between the two projects.
#
# layer: `github` is the published configuration and stays undeterministic, so
# content cannot be compared. The file set still carries the minification
# assertion - theme.min.css against theme.css.
layer = "files"

[[builds]]
  …
```

A case with no `layer` line needs no such note: content is the default, and
taking the default gives nothing up.

### The Hugo version reduces it further

Stored output is only meaningful for the version that produced it. Hugo
legitimately changes what it emits between releases — v0.141.0 writes a
`search/index.print.html` for the exampleSite that v0.165.0 does not — so
comparing a baseline against an older Hugo would assert something false. Only
the reference versions compare at all; everything else stops at the build
layer.

The effective layer is the shallower of the two: what the case declares, and
what the version allows. `--hugo=min` runs every case at `build` whatever it
declares; the default and `--hugo=latest` let the declared layer stand.

A run says when the version reduced a layer. A result that reads like a content
check but was a build check is exactly what erodes trust in a suite.

`--update` refuses outright on a non-reference version rather than reducing —
regenerating from a Hugo whose output the baseline is not meant to hold would
write the wrong thing, silently.

## Amalgamated config directories

Every build assembles a config directory in a temp directory. A site's own
`config/` is optional: where it exists it is copied in as `_default`, and where
it does not the site is configured by its root `hugo.toml`, which Hugo reads
from the site directory regardless. The fixtures look like the second until
they migrate.

```
<tmp>/config/
  _default/         the site's own files, copied verbatim
  <env>/hugo.json   the environment and this build's axes, flattened and merged
```

built with `--configDir <tmp>/config -e <env>`. The site itself is built where
it lies, with `-d` pointing into the result; only the configuration is
assembled elsewhere. The copy is rebuilt per build, so it cannot go stale.

A fixture also gets `--themesDir` and `--theme` naming the theme checkout,
because it sits outside the theme and has no way to reach it. A theme site gets
neither: `docs` and `exampleSite` resolve the theme by sitting inside it, and
passing the flags anyway would send Hugo looking for the theme within the
theme. The `@theme` suffix already says which a site is, so nothing has to be
parsed to decide.

The theme's location goes on the command line rather than into the merged
configuration, and deliberately. It is not something a case declares — it is
where the checkout happens to be on this machine — and the merged document is
compared for equality elsewhere, which a machine-dependent path would break.

An environment comes from a site's own `config/` or from infra's
`environments/`. A site holds what only it can answer for — `_default`, and
deployment environments like `github` — and infra holds what a site has no copy
of. `testing` is held by both, which Environment resolution below covers.

Hugo merges `_default` into `<env>`. `_default` is copied verbatim and never
passes through the runner, so whatever it holds — `module.toml`,
`languages.toml`, language-suffixed names, a date in someone's own params —
stays Hugo's to interpret, exactly as it is today. Everything said below about
flattening applies to environments and axis values only.

What the runner merges is the environment's files with this build's axis files,
in config order, into that one `<env>` directory. Both sides are files infra
owns or copies whole, and the rule is Hugo's own, from
`defaultConfigProvider.go`: deep-merge where both values are maps, replace
otherwise — slices included — lowercase keys, later wins.

### Flattening

An environment or an axis value may hold more than one file — a `params.toml`
beside a `hugo.toml` — so each is flattened to a single document before
anything is merged onto it. Every file is parsed, its name mapped to a root key
the way Hugo maps it, and the results merged in lexical order, which is the
order Hugo reads a directory in.

The name-to-key mapping has three cases, not one. `hugo.toml` and `config.toml`
merge at the root. Any other name wraps the file under its own basename, so
`params.toml` holding `a = 1` becomes `params.a`. But a file whose *sole*
top-level key already equals its basename is taken as it stands — `params.toml`
holding `[params] a = 1` also becomes `params.a`, not `params.params.a`.

The sole-key condition is load-bearing and its failure is surprising rather
than wrong: `params.toml` holding `[params] a = 1` beside `[other] b = 2`
unwraps neither, resolving to `params.params.a` and `params.other.b`. A
faithful flattening reproduces that as well.

Axis values are directories because of that mapping. As bare `.toml` files they
would have been the one input it must *not* apply to — `relative.toml` holds a
root-shaped document, and wrapping it by name would bury the whole thing under
a `relative` key, silently. One shape for both, and no exemption to remember.

Flattening is a parse, never a concatenation. Splicing `params.toml` into a
`[params]` section as text would misplace nested tables and arrays of tables,
and would stack rather than merge any key two files share. A parser gives
structure to merge instead of lines to append.

It reads TOML and nothing else. Hugo accepts `.yaml` and `.json` configuration
too, so a directory holding one aborts rather than being quietly skipped.
Another format is a parser and a line of dispatch, the day something needs one.

This is the one place the filename convention is modelled rather than
delegated, and it stays the narrow half of it. Language-suffixed names like
`params.en.toml` are the wide half: a directory holding one aborts rather than
being mapped by halves. Nothing uses them today.

### Writing the result

The merged document is written as `<env>/hugo.json`. Hugo takes `hugo.toml`,
`hugo.yaml` and `hugo.json` alike, and a TOML `_default` beside a JSON
environment resolves exactly as two TOML files would — measured, not assumed.
JSON is also what the runner can write without another dependency: `js-toml`
parses and does not serialise, and `JSON.stringify` is already there.

Reading TOML and writing JSON costs one thing worth naming. TOML has native
datetimes and JSON has not, so a date in an environment or an axis value would
arrive as a string. Hugo's configuration documents no date-valued key, and the
one place a date would plausibly sit is `_default`.

Nothing verifies the merge separately. A wrong merge yields a wrong
configuration, a wrong configuration yields different output, and different
output is the thing the stored results already catch. A check would only
restate the baselines in a place where it could itself be wrong.

### `production` is the default environment

A build naming no environment gets `production`, which is what Hugo uses for a
build anyway. `-e production` is indistinguishable from passing no `-e`: same
`hugo.Environment`, same `hugo.IsProduction`, and a site's own
`config/production/` is loaded either way. Any invented name — `axes`, say —
flips `IsProduction` to false and quietly changes what is being built.

So there is no synthetic environment and no second code path. A build with axes
and no environment merges them into `production`.

As it happens no case relies on it today: each one names an environment,
because each wants either determinism or the published configuration. The
default is there to be correct when something does, not because something
already does.

`hugo server` defaults to `development` instead. Pinning to the build default
is deliberate: the suite tests what gets published, not what you see while
writing.

### Why assembly, and how it fails

Assembly is required rather than chosen, and every shortcut around it fails
silently. `--configDir` names one directory and *replaces* the site's — a
comma-separated list is read as a single path, and a directory that does not
exist yields an empty config and exit 0. A `--config` list cannot stand in for
`_default` either: the filename-to-key convention holds only inside a config
directory, so everything but `hugo.toml` is dropped without a warning; and
`--config` fills the slot a root `hugo.toml` occupies rather than adding one,
so passing it stops that file being read at all.

The assembled directory must keep the `_default/` level. Hugo reads only
`_default/` and `<env>/` beneath a config directory; a file placed directly in
it is ignored, with no error and no output. Copying the *contents* of a site's
`_default/` into `<tmp>/config/` rather than into `<tmp>/config/_default/`
therefore yields an empty configuration and a build that still exits 0.

Within one directory Hugo reads files in lexical order, so `params.toml` wins
over `hugo.toml` for the `params` key. Flattening reproduces that, because a
faithful flattening has to. What the runner never does is *exploit* it — it
does not place two files in one directory to manufacture precedence between
them, which is why the assembled `<env>/` ends up a single file.

## Environment resolution

`_default` is not selected — Hugo loads it for every site and every build,
whatever the case says. Naming it is an error: there is nothing there to
select. A build naming no environment gets `production`.

A name resolves to a directory, in the site's own `config/` or in infra's
`tests/environments/`. A site answers for itself wherever it can; infra answers
for sites that have none of their own. Where both hold the name, the two must
be identical — so which is read never has to be decided.

A name must resolve, which is what catches a typo or an environment that has
moved. `production` is exempt, because it applies whether a directory exists
for it or not — resolving to nothing is its ordinary state, not a mistake.
`environment` therefore stays optional: a build that names none is a
`production` build, and needs no directory to be one.

That is what lets `testing` exist in three places without anyone arbitrating.
`docs` and `exampleSite` keep their own, so `hugo -e testing` still works by
hand in the theme repo. Infra keeps one for its fixtures, which have nothing of
their own to fall back on. Nobody writes a copy for a site that already has one.

The runner flattens both and compares, and a difference aborts the run naming
the keys that disagree. That is the check three hand-kept copies actually need:
their existing side by side is the design, their drifting apart is the failure,
and it would otherwise surface as output moving for no visible reason — from an
edit in the other repository, which would not even appear in the same diff.

It compares flattened documents, so comments and formatting are not part of it.
That matters straight away: the theme's two copies differ today in one word of
one comment, and infra's will differ in more, since it has no reason to tell
anyone which directory to run Hugo from.

`github` never needs the fallback: `docs` and `exampleSite` publish to
different URLs, so each answers for its own and infra holds none.

Nothing in the suite runs in `production`. Everything names `testing` instead,
because everything wants determinism, and for the theme's own sites there is a
second reason on top: `production` is where their link checking is on, so a
build there would reach the network for every external URL — the flakiness
`testing` exists to avoid.

## Two independent orders

| | Source | Effect of changing it |
|---|---|---|
| config order | the environment, then the `[axes]` order in the case file | none on names |
| directory nesting | alphabetical by axis name | — |

Reordering the case file changes which config wins without renaming any golden
directory.

Config order is the `[axes]` key order as parsed, so axis names must not look
like integers: a JavaScript object sorts integer-like keys ahead of the rest,
and an axis called `2024` would quietly move to the front of the order.

## Single-value rule

Every axis is merged in; only multi-valued axes branch the tree.

```
urls = ["relative", "absolute", "ugly"], baseurl = ["root", "subdir"]
  → expected/url-permutations/baseurl-root/urls-relative/   … 6 builds

urls = ["relative", "absolute", "ugly"], baseurl = "root"
  → expected/url-permutations/urls-relative/                … 3 builds
```

A one-element array and a scalar mean the same thing and nest the same way.

Build names are paths, each segment written `<axis>-<value>`:
`url-permutations/baseurl-root/urls-relative`.

`--build` matches a path prefix, so naming a case runs every build in it and
naming a combination runs the one. A sequence is the exception already
described: it takes its case name and rejects anything deeper. A prefix that
matches nothing lists what there is rather than running nothing quietly.

Only axes ever add a segment. An environment cannot, because it takes exactly
one value and so has nothing to branch on — which is why `theme-docs` sits at
`expected/theme-docs/` with no `testing/` beneath it, and why a case with no
multi-valued axis has its result directly under its own name.

Known churn: taking an axis from one value to two makes it start branching and
reshapes the tree beneath it. That is a real dimensional change, so it earns a
visible diff. No axis defaults, no hand-named combinations.

## Warning baselines

Any `WARN` or `ERROR` fails a build unless it is listed. Three files are
consulted and their entries unioned:

| File | Holds |
|---|---|
| `tests/warnings.txt` | theme-wide, mostly Hugo deprecations |
| `tests/sites/<site>/warnings.txt` | what a site's own content provokes |
| `tests/cases/<case>/warnings.txt` | what a configuration provokes |

Each sits beside the thing it describes, so no key is encoded into a filename
and a site and a case may share a name without colliding.

Keyed by site and not only by case, because a warning coming from content
follows that content into every case that builds it. The docs' seven entries
are provoked by the docs, so they hold for `theme-docs` and for the `github`
sequence alike; keyed by case alone they would have to be copied and kept in
step by hand.

The case level covers warnings that depend on configuration instead. Nothing
needs it today.

A site's file is checked against the build of that site, so a sequence consults
a different one per build: `github` holds the docs' entries against the docs
build and exampleSite's against its own. The theme-wide and case files apply to
every build in the case.

An entry is a substring, and adding one is a deliberate act — it records
outstanding work, so it is deleted once the underlying issue is fixed and the
regression is allowed to fail again.

## Validation — abort before building

Each of these would otherwise yield a green run of something other than what was
asked for. All must name the mistake and list the valid values, as `--build`
now does.

- a case file carrying a key the schema does not have; the schema is closed, so
  `enviroment` is caught rather than ignored into a `production` build
- a build naming `_default` as its environment
- a `layer` that is not `content`, `files` or `build`
- an `environment` given a list rather than a name
- an axis inside `[[builds]]` carrying more than one value
- a `dest` that leaves the result root
- an axis value with no matching directory
- a named environment other than `production` resolving to no directory —
  **exists today**: fixtures are built with `--environment testing`, which
  matches nothing and is silently ignored
- an environment or axis value holding a language-suffixed filename, which
  flattening does not map
- an environment or axis value holding a config file that is not TOML
- an environment held by both a site and infra whose two copies differ
- a case naming a site that does not exist

## Theme repo changes

`config/_default/` and `config/github/` stay as they are. Nothing is
neutralised and `urlExternalCheck = true` stays in `_default`, so link checking
keeps happening in the environment you develop in.

`testing` stays in both theme sites, unchanged, so `hugo -e testing` keeps
working by hand. Infra adds one of its own for its fixtures, which have no
`config/testing/` to fall back on. Three copies of the same settings — and the
alternative, infra writing a `testing` for sites that already have one, buys
nothing.

`versioning`, `performance` and `dev` stay where they are and stay as they are.
All three are dev aids against the real content, and the suite builds none of
them.

- `versioning` is covered by infra fixtures instead, at the content layer,
  which is the only layer that sees what versioning does.
- `dev` is the local rehearsal of the `github` deployment. Once the `github`
  case is a sequence, that shape is under test and `dev` has nothing left to
  add.
- `performance` turns features *off* — no print output, no search index, no
  `pir`. It asserts strictly less than `testing` does, so building it would
  only show that a reduced site reduces. Where its toggles are worth covering,
  they belong on axes over a fixture, not on a full docs build.

## Migration order

1. Runner: config assembly and environment resolution. Theme sites use
   `testing` from their own `config/`, assembled rather than read in place.
2. Give infra a `testing` environment for its own fixtures. Nothing leaves the
   theme repo, and nothing reads infra's copy until step 4.
3. Runner: case loading, build sequences, axis resolution, the config merge and
   its order, nesting, layer selection, warning baselines, validation.
4. Write case files for the builds that already exist — `theme-docs`,
   `theme-exampleSite`, and `github` still as two separate cases — and drive
   them from those instead of the hardcoded list. The runner stops knowing any
   site by name.
5. Migrate `minimal`, `shortcodes`, `url-permutations` onto sites/axes/cases,
   each gaining a `config/_default/` in place of its root `hugo.toml` and
   naming `testing` instead of carrying its own determinism.
6. Turn `github` into a sequence over one tree. The two file sets merge into
   one and the baselines are rewritten, so this is a deliberate change, not a
   step where nothing may move.
7. Build the `versioning-current` and `versioning-archived` fixtures and the
   case over them. First sequence over fixtures, and the first coverage
   versioning has ever had — its expected output is new rather than migrated,
   so read it as a fixture being born, not as a diff.
8. Regenerate expected output; review the diff as the test result.
9. Update the theme's Testing page and the infra README to the new vocabulary —
   including `layer` versus `config order`. They are where this file's
   reasoning has to survive, since this file goes.

Steps 1 through 5 must not change a single generated file. The committed
`theme-docs` and `theme-exampleSite` file sets cover the first four, and must
not move at all — step 4 is the one to watch there, since it is where every
existing build stops being driven by a name in the runner and starts being
driven by a case file.

Step 5 renames directories — `url-permutations-relative` becomes
`url-permutations/urls-relative` — so compare contents across the rename rather
than expecting the tree to sit still. It also swaps each fixture's own
determinism for `testing`, which is output-neutral only if the two are
equivalent. They are not identical: `testing` adds `keepComments`, inert while
`minify = false`, and an explicit `urlExternalCheck = false`, which is the
default anyway. Both look harmless, and step 5 is where that stops being an
argument and becomes a result.

Steps 5 and 6 are the two meant to change output. Anywhere else, output moving
without intent is the signal to stop.
