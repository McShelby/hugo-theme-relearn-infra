+++
title = 'Front Matter'
weight = 4

[params.pages]
  display = 'list'
  groupby = 'params.shape'
  headinglevel = 4
  orderby = 'weight desc'

[[cascade]]
  [cascade.params.pages]
    columns = 2
+++

Parameters set in front matter rather than on the call. Three children - Round,
Square and Nested, a branch with two pages - each carrying a `shape`.

This page's own `params.pages` asks for a list, grouped by shape, heaviest
first. It also cascades `columns = 2` down to the pages below it, which only
Nested lists anything with.

## From front matter

No parameter on the call: everything comes from front matter.

{{% pages %}}

## A call wins over front matter

`display` from the call, everything else still from front matter.

{{% pages display="tree" %}}

## An empty value on a call is not set

`orderby=""` leaves the front matter's `weight desc` in place: an empty value
counts as not given.

{{% pages orderby="" %}}

## Whitespace resets a value

`groupby=" "` resets the front matter's grouping to no value, so the listing is
ungrouped.

{{% pages groupby=" " %}}
