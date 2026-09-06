+++
description = 'Hidden from the menu unless hidden says otherwise.'
tags = ['harbor']
title = 'Lantern'
weight = 15

[params]
  flavor = 'guide'
  hidden = true
  tier = 'Basic'
+++

Hiding is orthogonal to grouping, so this page appears in a listing only when
`hidden=true` is set - and when it does, it has to land in the `guide` group
with Anchor and Compass rather than in one of its own. On a term page the
`disableTagHiddenPages` option decides instead, which by default lists it.
