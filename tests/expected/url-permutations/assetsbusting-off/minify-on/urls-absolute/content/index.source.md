+++
title = 'URL Permutations'
+++

Links from the home page, so the snapshot captures how each mode renders them:

- [a sibling page](first-page)
- [into a section](chapter/)
- [deep into a section](chapter/child)
- [an external target](https://example.org/elsewhere)
- [an anchor on this page](#url-permutations)

![an image](/images/pixel.png)

Quotes naming where they are taken from. The address is written twice, as the link of the caption and as the `cite` attribute of the quote, and only the former is an attribute Hugo rewrites for a relative site:

> Quoted from a page of this site.
{source="Child" href="chapter/child"}

> Quoted from elsewhere.
{author="Somebody" href="https://example.org/elsewhere"}

> Quoted from this site without a caption to link.
{href="first-page"}
