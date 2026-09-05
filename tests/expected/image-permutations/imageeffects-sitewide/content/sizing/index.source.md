+++
title = 'Sizing'
weight = 1
+++

`width` and `height` are CSS lengths - `20vw` and `50%` are as valid as `50px` -
so they are style, not pixel counts. The intrinsic dimensions of the resource
are a separate thing, and what a browser needs to reserve space with before the
image has arrived.

## Unsized

![Unsized](/images/landscape.png)

## One dimension

![Width only](/images/landscape.png?width=20vw)

![Height only](/images/landscape.png?height=50px)

## Both dimensions

![Both](/images/landscape.png?width=40vw&height=50px)

![Both in pixels](/images/landscape.png?width=100px&height=100px)

## Relative lengths

![Width in percent](/images/landscape.png?width=50%25)

![Height in percent](/images/landscape.png?height=50%25)

![Width in ems](/images/landscape.png?width=10em)

## Portrait

The other aspect ratio, so a swapped pair of dimensions cannot pass unnoticed.

![Portrait unsized](/images/portrait.jpg)

![Portrait width only](/images/portrait.jpg?width=20vw)

## Unmeasurable

An SVG is an image resource Hugo cannot read dimensions from, so it has none to
carry into the markup however it is sized.

![Vector unsized](/images/vector.svg)

![Vector width only](/images/vector.svg?width=20vw)

## Elsewhere

An absolute URL never resolves to a resource and so can never carry intrinsic
dimensions - and, pointing at a host that does not answer, would show as alt
text on a page whose whole subject is what an image measures. Those live on the
`Sources` page, where showing nothing is the point.
