+++
title = 'Effects'
weight = 4
+++

# Effects

Everything that changes the emitted element. Sizing stays out of the way here
except where the two are deliberately combined.

## Defaults

![Default](/images/landscape.png)

## Lightbox

The lightbox emits a second copy of the image, which is why turning it off
changes more than a class.

![Off by parameter](/images/landscape.png?lightbox=false)

![Off by class](/images/landscape.png?classes=nolightbox)

![On by parameter](/images/landscape.png?lightbox=true)

![On by bare parameter](/images/landscape.png?lightbox)

## Lazy loading

![Not lazy](/images/landscape.png?lazy=false)

![Lazy by class](/images/landscape.png?classes=lazy)

## Decoration

![Border and shadow](/images/landscape.png?classes=border,shadow)

![Floated left](/images/landscape.png?classes=left)

![Floated right](/images/landscape.png?classes=right)

![Inline](/images/landscape.png?classes=inline)

![Border off by class](/images/landscape.png?classes=noborder)

## Unknown classes

A class the theme knows nothing about is dropped here rather than passed to the
element - unlike the same class handed to the partial by a template, which the
`Template` page shows arriving on the element. The asymmetry is the theme's, and
this is where it would show up if it changed.

![Custom class](/images/landscape.png?classes=my-own-class)

![Custom and known classes](/images/landscape.png?classes=my-own-class,border,nolightbox)

A custom class starting with `no` is not an effect being switched off, and is
dropped for the same reason rather than for that one.

![Custom class starting with no](/images/landscape.png?classes=nonsense)

## Combined

![Sized, decorated, eager, no lightbox](/images/landscape.png?width=20vw&classes=border,shadow,nolightbox&lazy=false)

![Sized data URL without a lightbox](/images/landscape.png?dataurl&width=20vw&lightbox=false)
