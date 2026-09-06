+++
title = 'Layout'
weight = 3
+++

The tree a listing is taken from, and what a display makes of it. Three
children - One, a leaf; Two, a branch with two pages under it; and Three, a
branch with one - so a second level exists to be shown or withheld. A fourth,
Four, is a hidden branch with one page under it, and absent from every listing
that does not ask for hidden pages.

## levels and flatten - the tree

### levels=1

The default: the children only.

{{% pages %}}

### levels=2

The children and their children, as a tree. Four is hidden, so Four A is
missing as well, although it is not hidden itself.

{{% pages levels="2" %}}

### levels=2, hidden=true

Four and Four A join the tree.

{{% pages levels="2" hidden="true" %}}

### levels=2, flatten=true

The same pages as one list, in tree order: each branch directly followed by
the pages below it.

{{% pages levels="2" flatten="true" %}}

### levels=2, flatten=true, orderby=linktitle

Flattened pages are ordered together, not level by level: One, Three, Three A,
Two, Two A, Two B.

{{% pages levels="2" flatten="true" orderby="linktitle" %}}

### levels=2, limit=2

`limit` counts the first level only: One and Two, and Two keeps both of its
pages.

{{% pages levels="2" limit="2" %}}

### levels=2, flatten=true, limit=2

Flattened, every page counts: One and Two, without the pages below Two.

{{% pages levels="2" flatten="true" limit="2" %}}

## kind - which kind of page is kept

### kind=leaf

In a tree a page not kept takes the pages below it along, so of the children
only One remains.

{{% pages levels="2" kind="leaf" %}}

### kind=leaf, flatten=true

Flattened, every page is kept or dropped on its own: One, Two A, Two B and
Three A.

{{% pages levels="2" kind="leaf" flatten="true" %}}

### kind=branch

Two and Three, without the leaves below them.

{{% pages levels="2" kind="branch" %}}

## display - how the pages are rendered

Each at `levels=2`, so the second level has to be shown the display's way.

### tree

Nested, levels shown by indentation.

{{% pages levels="2" display="tree" %}}

### headings

One list of headings, levels shown by heading size.

{{% pages levels="2" display="headings" headinglevel="4" %}}

### sections

A heading per page of the first level, a tree of the pages below it.

{{% pages levels="2" display="sections" headinglevel="4" %}}

### sections at levels=1

Headings only, as there is nothing below them to list.

{{% pages display="sections" headinglevel="4" %}}

### list

One list, levels not shown.

{{% pages levels="2" display="list" %}}

### cards

A card per page, levels not shown.

{{% pages levels="2" display="cards" %}}

### cards, grouped

The group heading has to be HTML here, as a markdown heading would show as
text inside the cards' HTML.

{{% pages display="cards" groupby="params.flavor" headinglevel="4" %}}

### An unknown display

Falls back to `tree` and says so on the console, rather than aborting the
build.

{{% pages display="nonesuch" %}}

## columns

`columns` reaches the markup as a class on the list, so what a listing here
asserts is the class rather than the rendering.

### Default

One column, and no columnize class at all.

{{% pages %}}

### columns=1

One column named explicitly. Has to match the default.

{{% pages columns="1" %}}

### columns=3

{{% pages columns="3" %}}

### columns=5

The documented maximum.

{{% pages columns="5" %}}

### columns=9

Above the maximum, so clamped to 5.

{{% pages columns="9" %}}

### columns=0

Below the minimum, so clamped to 1.

{{% pages columns="0" %}}

### cards default

Cards default to three columns.

{{% pages display="cards" %}}

### cards, columns=2

{{% pages display="cards" columns="2" %}}

## headinglevel

### Default, grouped

The group headings arrive at level 2.

{{% pages groupby="params.flavor" %}}

### headinglevel=4, grouped

{{% pages groupby="params.flavor" headinglevel="4" %}}

### headings, ungrouped

The page headings start at the given level.

{{% pages levels="2" display="headings" headinglevel="3" %}}

### headings, grouped

The page headings start one level below the group heading.

{{% pages levels="2" display="headings" groupby="params.flavor" headinglevel="3" %}}

### headinglevel=9

Above the maximum, so clamped to 6.

{{% pages groupby="params.flavor" headinglevel="9" %}}

## description and breadcrumb

### description=true

{{% pages levels="2" description="true" %}}

### breadcrumb=true

{{% pages levels="2" breadcrumb="true" %}}

### Both, as a list

{{% pages levels="2" display="list" description="true" breadcrumb="true" %}}

### Both, as headings

{{% pages levels="2" display="headings" description="true" breadcrumb="true" headinglevel="4" %}}

### image=false on cards

{{% pages display="cards" description="true" image="false" %}}

## axis and pageref - where the pages come from

### pageref

A relative reference: the children of Two.

{{% pages pageref="two" %}}

### pageref, absolute

The same page by its absolute path.

{{% pages pageref="/layout/two" %}}

### axis=siblings

The other children of Two's parent: One and Three.

{{% pages pageref="two" axis="siblings" %}}

### axis=ancestors

Up from Two A: Two, then this section.

{{% pages pageref="two/two-a" axis="ancestors" levels="2" %}}

### axis=ancestors, levels=1

Just the parent.

{{% pages pageref="two/two-a" axis="ancestors" %}}

## params and cardtemplate

The `debug` card template dumps what it receives, so this is where `params`
arriving next to the theme's own keys is visible.

{{% pages pageref="two" display="cards" cardtemplate="debug" params="flavor: custom" %}}
