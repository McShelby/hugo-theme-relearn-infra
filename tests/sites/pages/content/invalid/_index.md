+++
title = 'Invalid'
weight = 7
+++

Every expression and parameter the shortcode refuses. A refused parameter is
reported on the console and left out, so each listing here renders as if it
had not been given - never an aborted build. The warnings are the assertion
rather than noise: they are listed in the site's `warnings.txt`, and a message
that changes wording fails the suite until the baseline is brought along with
it.

Three children, First, Second and Third. This is what a valid listing over them
looks like, grouped by flavor:

{{% pages groupby="params.flavor" headinglevel="4" %}}

## Expressions

### An unknown field

{{% pages groupby="nonesuch" headinglevel="4" %}}

### name

The Learn theme's spelling of `title` is no field of an expression.

{{% pages groupby="name" headinglevel="4" %}}

### params without a key

{{% pages groupby="params." headinglevel="4" %}}

### A field with an argument

{{% pages groupby="title extra" headinglevel="4" %}}

### An empty stage

{{% pages groupby="title |" headinglevel="4" %}}

### An unknown function

{{% pages groupby="title | nonesuch" headinglevel="4" %}}

### A function without argument given one

{{% pages groupby="title | upper 1" headinglevel="4" %}}

### left without a number

{{% pages groupby="title | left" headinglevel="4" %}}

### left 0

A width has to be positive.

{{% pages groupby="title | left 0" headinglevel="4" %}}

### format without a layout

{{% pages groupby="date | format" headinglevel="4" %}}

### An invalid grouplabel

The grouping stands, the groups are labelled by their key.

{{% pages groupby="params.flavor" grouplabel="nonesuch" headinglevel="4" %}}

### A quote not closed

An argument opened with a quote that never closes can't be told apart from the
stages after it, so the whole expression is refused.

{{% pages groupby="params.flavor | coalesce 'none" headinglevel="4" %}}

### One invalid orderby item

The valid item still orders, the invalid one is left out.

{{% pages orderby="nonesuch desc, linktitle desc" %}}

### where without an operator

{{% pages where="title" %}}

### where with an unknown field

{{% pages where="nonesuch = x" %}}

## Parameters

### An unknown axis

The one refusal that leaves nothing to render: without an axis there is no
source of pages.

{{% pages axis="sideways" %}}

### levels that is no number

{{% pages levels="many" %}}

### columns that is no number

{{% pages columns="wide" %}}

### params that is no map

{{% pages display="cards" params="[1, 2]" %}}
