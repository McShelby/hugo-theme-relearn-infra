+++
title = 'Nested'
weight = 30

[params]
  shape = 'square'
+++

Has no `params.pages` of its own, but receives `columns = 2` from its parent's
`cascade` - and nothing else, as its parent's own `params.pages` is not
cascaded.

## Cascaded

A tree in two columns.

{{% pages %}}

## Whitespace resets a cascaded value

`columns=" "` resets the cascaded value, so the default of one column applies.

{{% pages columns=" " %}}
