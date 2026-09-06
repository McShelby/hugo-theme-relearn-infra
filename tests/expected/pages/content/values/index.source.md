+++
title = 'Values'
weight = 8
+++

What an expression makes of a value that is not plain text: a missing weight,
zero, padding, a list, a map, and one key holding numbers and text alike. Five
children, Copper, Iron, Lead, Tin and Zinc.

Tin weighs 10, Copper 20 and Iron 30; Lead and Zinc are unweighted. Their
`rank` is the number -1 for Tin, 1 for Lead and 2 for Copper, but the text `x`
for Iron and the text `10` for Zinc.

Every grouped listing here sets `headinglevel="4"`.

## weight - a weight of 0 has no value

### orderby=weight

Lead and Zinc are unweighted and come last, in Hugo's order.

{{% pages orderby="weight" %}}

### orderby=weight desc

And stay last when the direction is reversed.

{{% pages orderby="weight desc" %}}

### where="weight <= 20"

Tin and Copper. The unweighted pages are not kept, as a missing value only
matches `!=`.

{{% pages where="weight <= 20" %}}

### where="weight >= 9"

Numbers compare as numbers, so every weighted page is kept - as text, `10`,
`20` and `30` would all sort before `9`.

{{% pages where="weight >= 9" %}}

### where="weight < abc"

A literal that is no number makes the weights compare as text, which all sort
before `abc`.

{{% pages where="weight < abc" %}}

## coalesce and default

Copper's `count` is 3, Iron's is 0, and the others have none.

### coalesce

Only a missing value is replaced: Iron keeps its group `0`. The `none` group
is text and so follows the numbers.

{{% pages groupby="params.count | coalesce none" headinglevel="4" %}}

### default

A zero is replaced as well: Iron joins the `none` group.

{{% pages groupby="params.count | default none" headinglevel="4" %}}

## trim

Copper's `note` is `padded` with spaces around it, Zinc's is `padded` without.

### Untrimmed

Two groups, although their headings read the same.

{{% pages groupby="params.note" headinglevel="4" %}}

### trim

One group.

{{% pages groupby="params.note | trim" headinglevel="4" %}}

## path and section

### groupby=section

Every page here is in the `values` section.

{{% pages groupby="section" headinglevel="4" %}}

### orderby="path desc"

The paths end in the file names, so this is the reverse of the alphabet.

{{% pages orderby="path desc" %}}

## Lists and maps have no value

Copper's and Iron's `crew` is a list, Copper's `author` a map.

### groupby=params.crew

A list is no single value to group by: every page is in `Other`.

{{% pages groupby="params.crew" headinglevel="4" %}}

### where on a list

A list is replaced by `coalesce` like any missing value, so every page is
kept.

{{% pages where="params.crew | coalesce none = none" %}}

### groupby=params.author

A map has no value either.

{{% pages groupby="params.author" headinglevel="4" %}}

### groupby=params.author.name

A value inside the map has one.

{{% pages groupby="params.author.name" headinglevel="4" %}}

## Numbers and text in one key

Numbers and text have no common order: Hugo compares text with a number as if
it were one, or else as `0`, which puts `x` below `1` and `10` above `2`, yet
`10` below `x`. So the numbers are ordered as numbers, then the texts as text,
the numbers first in either direction. Zinc's `10` is text and orders as such.

### orderby=params.rank

Tin, Lead and Copper by number, then Zinc and Iron by text.

{{% pages orderby="params.rank" %}}

### orderby=params.rank desc

Copper, Lead and Tin, then Iron and Zinc: both parts reversed, the numbers
still first.

{{% pages orderby="params.rank desc" %}}

### groupby=params.rank

The groups follow the ascending order above.

{{% pages groupby="params.rank" headinglevel="4" %}}
