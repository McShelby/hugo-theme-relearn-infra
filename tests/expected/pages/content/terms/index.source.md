+++
title = 'Terms'
weight = 5
+++

Taxonomy and term pages, listed from here by `pageref`. The pages of the `text`
section carry the tags `harbor`, `sea` and `drift-ice`:

- `harbor` has a content file titled Harbour and linked as Port,
- `drift-ice` has a content file without a title,
- `sea` has no content file at all.

The taxonomy and term pages themselves render their listings through the same
shortcode, with the defaults below, and are part of this site's output too.

## A taxonomy page

### Defaults

The defaults of the page listed from, not of this page: the terms, grouped by
the letter of the title shown, in three columns. Harbor is listed as Port under
`P`, with its page count.

{{% pages pageref="/tags" headinglevel="4" %}}

### groupby=" "

The grouping reset: one list, ordered by the title shown.

{{% pages pageref="/tags" groupby=" " headinglevel="4" %}}

### title | left 1 | upper

A term's title is its heading, `Tag :: …`, so every term falls under `T`. The
letter index is keyed by `linktitle` for that reason.

{{% pages pageref="/tags" groupby="title | left 1 | upper" headinglevel="4" %}}

## A term page

### Defaults

The term's pages, grouped by letter, with breadcrumbs. Lantern is hidden but
listed, as `disableTagHiddenPages` is not set.

{{% pages pageref="/tags/harbor" headinglevel="4" %}}

### orderby=weight, groupby=" "

{{% pages pageref="/tags/harbor" groupby=" " orderby="weight" headinglevel="4" %}}

### A term without a content file

{{% pages pageref="/tags/sea" headinglevel="4" %}}
