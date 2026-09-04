+++
title = 'Formats'
weight = 3
+++

# Formats

Hugo can read dimensions from some image resources and not from others. Both
kinds are here, sized identically, so the difference is the resource and nothing
else.

## Measurable

![PNG, 30x20](/images/landscape.png?width=20vw)

![JPEG, 20x30](/images/portrait.jpg?width=20vw)

![GIF, 24x24](/images/square.gif?width=20vw)

## Unmeasurable

![SVG, 40x10](/images/vector.svg?width=20vw)

![SVG without an XML declaration, 10x40](/images/vector-plain.svg?width=20vw)

## Inlined

`inlinecontent` replaces the element entirely, and strips the XML declaration on
the way.

![SVG inlined](/images/vector.svg?inlinecontent)

![SVG without a declaration, inlined](/images/vector-plain.svg?inlinecontent)

![SVG inlined and sized](/images/vector.svg?inlinecontent&width=20vw)

`inlinecontent` on anything else is ignored.

![PNG, inlinecontent ignored](/images/landscape.png?inlinecontent)

## Embedded

![PNG as a data URL](/images/landscape.png?dataurl)

![SVG as a data URL](/images/vector.svg?dataurl)

![PNG as a sized data URL](/images/landscape.png?dataurl&width=20vw)
