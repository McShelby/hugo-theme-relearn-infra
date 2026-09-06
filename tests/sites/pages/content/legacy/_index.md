+++
ordersectionsby = 'name'
title = 'Legacy'
weight = 6
+++

The deprecated `children` shortcode, now a translation into `pages`. Three
children - Aft, Bow, a branch with one page, and Keel, hidden - weighted in the
reverse of their titles, so an order by title and one by weight disagree.

Every call here warns on the console and names the `pages` call it was
translated into. The site's `warnings.txt` lists each of those messages in
full, so the warning is the assertion: a translation that changed would fail
the suite until the baseline is brought along with it.

This page also sets `ordersectionsby = 'name'`, the Learn theme's spelling of
`title`, which still orders by title but warns once as deprecated.

## Ordered by ordersectionsby

A `pages` listing of its own: `auto` follows `ordersectionsby`, so Aft comes
before Bow.

{{% pages %}}

## type

### Default

{{% children %}}

### type=list

{{% children type="list" depth="2" %}}

### type=flat

{{% children type="flat" depth="2" %}}

### type=card

{{% children type="card" %}}

### type=group

Grouped by the letter of the title shown. `depth` is not translated for
`type=group`, as it was never honored there.

{{% children type="group" depth="2" %}}

## sort

### sort=name

The Learn theme's spelling of `title`, translated into `linktitle`.

{{% children sort="name" %}}

### sort=modifieddate

{{% children type="flat" sort="modifieddate" %}}

## Other parameters

### showhidden=true

{{% children showhidden="true" %}}

### headingdepth=4

{{% children type="list" headingdepth="4" %}}

### description and breadcrumb

{{% children description="true" breadcrumb="true" %}}

### style=h2

The deprecated predecessor of `type=list`, which warns about itself before the
translation warns about the shortcode.

{{% children style="h2" %}}
