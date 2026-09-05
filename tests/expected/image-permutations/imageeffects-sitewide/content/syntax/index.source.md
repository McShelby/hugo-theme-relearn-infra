+++
title = 'Syntax'
weight = 5
+++

Every markdown spelling that reaches the render hook, because each arrives with
a different set of what the hook calls attributes.

## Plain

![Alt text](/images/landscape.png)

## With a title

![Alt text](/images/landscape.png "A title")

## Without alt text

![](/images/landscape.png)

## Reference style

![Reference style][ref]

![Reference style, sized][ref-sized]

## Inside a link

[![Linked image](/images/landscape.png)](https://example.com/)

[![Linked image without a lightbox](/images/landscape.png?lightbox=false)](https://example.com/)

## Inside a paragraph

Text before ![an inline image](/images/landscape.png?classes=inline) and text
after it, on one line with the surrounding prose.

## With markdown attributes

Hugo wraps a standalone image in a paragraph unless told not to, so a block
attribute below the image attaches to that paragraph and never reaches the
image. It is consumed either way - it does not survive as text - so the images
below are expected to come out exactly like the plain one above.

![With dimensions](/images/landscape.png)
{width="100" height="50"}

![With a class](/images/landscape.png)
{class="my-own-class"}

Attributes that do reach the partial come from a template calling it, which is
the `Template` page.

[ref]: /images/landscape.png "Reference title"
[ref-sized]: /images/landscape.png?width=20vw "Reference title"
