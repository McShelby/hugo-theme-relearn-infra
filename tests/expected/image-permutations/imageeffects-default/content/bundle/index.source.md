+++
title = 'Page Bundle'
weight = 6

[imageEffects]
  border = true
  lazy = false
+++

`local.png` is a resource of this page rather than of the site, which is a
different lookup and the one a page bundle relies on.

The front matter above switches two effects, so every image on this page carries
them until its URL says otherwise. That makes this page the middle layer of the
stack: the site-wide axis underneath, URL parameters on top.

## Page resource

![Page resource](local.png)

![Page resource, sized](local.png?width=20vw)

![Page resource, front matter overridden](local.png?border=false&lazy=true)

## Global resource seen from a bundle

![Global resource](/images/landscape.png)

![Global resource, sized](/images/landscape.png?width=20vw)

## Unmeasurable resource under front matter effects

![Vector](/images/vector.svg)
