+++
title = 'Text'
weight = 1
+++

Expressions over strings. Eight children: Anchor, Anchorage, Beacon, Compass,
Drift (linked as Signal), Ember, Lantern (hidden) and Ösen.

Their weights run 10, 15, 20, 30, 35, 40, 50, 60 and deliberately disagree with
the alphabet: Beacon is lightest, Ösen heaviest. Lantern weighs 15 and only
shows where hidden pages are asked for.

Every grouped listing here sets `headinglevel="4"` so that a group heading
renders below the heading naming the listing, rather than beside it.

## Default

No parameter at all: the children in Hugo's order, which is by weight, as a
tree. Lantern is absent.

{{% pages %}}

## groupby - which value a group is keyed by

### linktitle | left 1 | upper

The letter index taxonomy and term pages use by default. Drift is listed as
Signal and grouped under `S`, the letter of the label it is shown with.

{{% pages groupby="linktitle | left 1 | upper" headinglevel="4" %}}

### title | left 1 | upper

The same, keyed by the page's own title. Drift moves to `D` while its label
stays Signal - `title` and `linktitle` are two fields, not two spellings.

{{% pages groupby="title | left 1 | upper" headinglevel="4" %}}

### params.flavor

A front matter parameter. Ember has no `flavor`, so it forms a last group of
its own, labelled `Other`, rather than being dropped.

{{% pages groupby="params.flavor" headinglevel="4" %}}

### params.flavor | coalesce none

`coalesce` gives Ember a value, so it joins the ordered groups as `none`
instead of trailing them as `Other`.

{{% pages groupby="params.flavor | coalesce none" headinglevel="4" %}}

### params.tier

Four pages say `Basic`/`Core` and three say `basic`/`core`. Nothing folds case
unless asked to, so this is four groups.

{{% pages groupby="params.tier" headinglevel="4" %}}

### params.tier | lower

Folded: two groups, every page kept.

{{% pages groupby="params.tier | lower" headinglevel="4" %}}

### grouplabel

Keyed by the folded tier, labelled by the upper-cased one. The label is
evaluated for a group's first page, so a group keyed `basic` is headed `BASIC`
whether that page says `Basic` or `basic`.

{{% pages groupby="params.tier | lower" grouplabel="params.tier | upper" headinglevel="4" %}}

## Text functions

### left 1

The first rune. Ösen must group under `Ö`, not under a half of it.

{{% pages groupby="linktitle | left 1" headinglevel="4" %}}

### left 2

Anchor and Anchorage still share their first two letters; everything else
separates. Without `upper` the keys keep their case.

{{% pages groupby="linktitle | left 2" headinglevel="4" %}}

### left 3

Three letters still hold both. This is the last width at which they agree, and
Ösen shows the count is in runes rather than bytes.

{{% pages groupby="linktitle | left 3" headinglevel="4" %}}

### right 2

Counted from the end, in runes as well.

{{% pages groupby="linktitle | right 2" headinglevel="4" %}}

### upper and lower

The whole link title, upper-cased as a key and lower-cased as its label.

{{% pages groupby="linktitle | upper" grouplabel="linktitle | lower" headinglevel="4" %}}

## translate - translated text

The site's own translation file translates `flavor-guide`, `flavor-tutorial`
and `reference`, and nothing else, so each listing here has a value without a
translation. Such a value stays as it is, and Hugo reports the missing key -
listed in the site's `warnings.txt`, where it is the assertion.

### translate with a prefix

Grouped by the flavor, labelled by its translation under the `flavor-` prefix:
Guides and Tutorials, and `reference`, which has no `flavor-reference`. The
groups keep the order of the untranslated flavors.

{{% pages groupby="params.flavor" grouplabel="params.flavor | translate flavor-" headinglevel="4" %}}

### translate without a prefix

The flavor itself is the key: only `reference` is translated, as References.

{{% pages groupby="params.flavor" grouplabel="params.flavor | translate" headinglevel="4" %}}

### translate in groupby

Grouped by the translation itself, so the groups are ordered by the translated
text: Guides, `reference`, Tutorials.

{{% pages groupby="params.flavor | translate flavor-" headinglevel="4" %}}

## grouporder - the order of the groups

### asc

The default, spelled out. Has to match the `linktitle | left 1 | upper` listing
above.

{{% pages groupby="linktitle | left 1 | upper" grouporder="asc" headinglevel="4" %}}

### desc

The same groups, reversed. The pages inside a group keep their own order -
`grouporder` and `orderby` are separate parameters, and the `A` group holding
two pages is where a confusion between them would show.

{{% pages groupby="linktitle | left 1 | upper" grouporder="desc" headinglevel="4" %}}

### desc with a missing value

`Other` stays last when the groups are reversed; it is not part of the ordered
domain.

{{% pages groupby="params.flavor" grouporder="desc" headinglevel="4" %}}

## orderby - the order of the pages

### auto

The default, spelled out: Hugo's order, by weight.

{{% pages orderby="auto" %}}

### auto desc

Hugo's order, reversed.

{{% pages orderby="auto desc" %}}

### linktitle

Alphabetical by the label shown: Signal sorts among the `S`.

{{% pages orderby="linktitle" %}}

### title

Alphabetical by the page's own title: the same page sorts as Drift, among the
`D`, while still labelled Signal.

{{% pages orderby="title" %}}

### weight desc

{{% pages orderby="weight desc" %}}

### length

By content length, which the bodies here differ in.

{{% pages orderby="length" %}}

### params.flavor

Ember has no `flavor` and comes last.

{{% pages orderby="params.flavor" %}}

### params.flavor desc

And stays last when the direction is reversed.

{{% pages orderby="params.flavor desc" %}}

### params.flavor, weight desc

Two keys in mixed directions: flavors ascending, and within one flavor the
heavier page first. Anchor and Compass share `guide`, Anchorage and Drift share
`tutorial`, Beacon and Ösen share `reference`. The second key only decides
because Hugo's sort keeps the order of ties - if it stopped doing so, these
pairs are where it would show.

{{% pages orderby="params.flavor, weight desc" %}}

### orderby inside groups

Grouped by flavor, each group ordered by weight descending.

{{% pages groupby="params.flavor" orderby="weight desc" headinglevel="4" %}}

## where - which pages are kept

### params.flavor = guide

{{% pages where="params.flavor = guide" %}}

### params.flavor != guide

Ember, having no `flavor`, is kept: a missing value only matches `!=`.

{{% pages where="params.flavor != guide" %}}

### params.flavor in guide, reference

{{% pages where="params.flavor in guide, reference" %}}

### weight < 30

Numbers compare as numbers: Beacon and Drift.

{{% pages where="weight < 30" %}}

### weight >= 35

{{% pages where="weight >= 35" %}}

### linktitle > M

Text compares as text: Signal and Ösen, and neither Drift nor Lantern.

{{% pages where="linktitle > M" %}}

## Quoting - a separator inside a delimited string

An argument or a literal delimited by `'` or a backtick is taken as a whole, so
a `|`, a comma or an operator inside it separates nothing.

### A | in an argument

Ember's missing flavor becomes `no | flavor`, one group, not a stage `flavor`.

{{% pages groupby="params.flavor | coalesce 'no | flavor'" headinglevel="4" %}}

### A comma in an orderby argument

Ember is ordered as `zz, last`, after every flavor, and then by title: the
comma inside the quotes does not end the first expression.

{{% pages orderby="params.flavor | coalesce 'zz, last', linktitle" %}}

### Both delimiters in an in list

`guide` and `tutorial`, one delimited by `'`, the other by a backtick.

{{% pages where="params.flavor in 'guide', `tutorial`" %}}

### A comma in an in value

One value, `guide, tutorial`, which no flavor equals: the listing is empty.

{{% pages where="params.flavor in 'guide, tutorial'" %}}

### An operator in an argument

The ` = ` inside the quotes is not the operator: only Ember, whose missing
flavor becomes `x = y`, is kept.

{{% pages where="params.flavor | coalesce 'x = y' = 'x = y'" %}}

## limit

### limit=3 after orderby

The three heaviest, as `limit` applies after ordering.

{{% pages orderby="weight desc" limit="3" %}}

### limit before grouping

The three lightest, then grouped: the groups hold only what `limit` kept.

{{% pages orderby="weight" limit="3" groupby="params.flavor" headinglevel="4" %}}

## hidden - whether Lantern is listed

### Default

Lantern is absent, so `guide` holds Anchor and Compass.

{{% pages groupby="params.flavor" headinglevel="4" %}}

### hidden=true

Lantern joins the `guide` group rather than forming one of its own.

{{% pages groupby="params.flavor" hidden="true" headinglevel="4" %}}
