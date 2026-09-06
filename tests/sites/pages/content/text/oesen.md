+++
description = 'Starts with a two-byte character.'
tags = ['sea']
title = 'Ösen'
weight = 60

[params]
  flavor = 'reference'
  tier = 'core'
+++

`Ö` is one rune and two bytes in UTF-8, so `left 1` must yield `Ö` and not half
of it, and `right` counts from the other end in runes too. The file name stays
ASCII: an expression reads the title, never the file name, and a non-ASCII path
would only make the output depend on the filesystem it was built on.

Its `tier` is `core` to Compass's and Drift's `Core`, giving the tier listing a
second case collision independent of the first.
