+++
title = 'Template'
weight = 7
+++

# Template

The theme documents calling its image partial from a template, passing effects
as `attributes`. That is the highest layer of the effect stack, above the URL,
the front matter and the site configuration - and the only layer that can hand
the partial an HTML attribute directly.

A fixture-local shortcode makes the call, so these are template calls rather
than markdown images.

## Nothing passed

{{< imagecall url="/images/landscape.png" alt="Plain call" >}}

## Effect classes

{{< imagecall url="/images/landscape.png" alt="Lightbox off" class="nolightbox" >}}

{{< imagecall url="/images/landscape.png" alt="Bordered" class="border" >}}

{{< imagecall url="/images/landscape.png" alt="Bordered without a lightbox" class="border nolightbox" >}}

## Unknown classes

Effect names are consumed; anything else is passed through to the element.

{{< imagecall url="/images/landscape.png" alt="Custom class" class="my-own-class" >}}

{{< imagecall url="/images/landscape.png" alt="Custom and effect classes" class="my-own-class nolightbox" >}}

## Attributes the element carries

{{< imagecall url="/images/landscape.png" alt="With a title" title="A title" >}}

{{< imagecall url="/images/landscape.png" alt="With dimensions" width="100" height="50" >}}

{{< imagecall url="/images/landscape.png?width=20vw" alt="With dimensions and a sized URL" width="100" height="50" >}}

## Outranking the URL

{{< imagecall url="/images/landscape.png?lightbox=true" alt="URL says lightbox, caller says no" class="nolightbox" >}}

{{< imagecall url="/images/landscape.png?border=false" alt="URL says no border, caller says border" class="border" >}}
