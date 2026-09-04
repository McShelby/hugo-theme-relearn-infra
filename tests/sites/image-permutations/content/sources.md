+++
title = 'Sources'
weight = 2
+++

# Sources

Where a URL is looked up decides whether there is a resource behind it at all,
and a resource is the only thing that can be asked its dimensions.

## Global resource

![Absolute path](/images/landscape.png)

![Relative path](images/landscape.png)

![Dot-relative path](./images/landscape.png)

## Missing resource

No `image.errorlevel` is configured, so an unresolvable image is emitted as
written rather than reported.

![Missing](missing.png)

![Missing, sized](missing.png?width=20vw)

## Absolute

An absolute URL is emitted as it was written and never resolved to a resource,
which is the whole of what these pin. None of them displays anywhere but on
`example.com` itself - the reserved documentation domain, which answers no path
- so in any preview they render as their alt text and no image. That is the
expected result rather than a broken fixture.

The first is worth its own line: it names an image this very site publishes,
written the long way round. Site-relative it would resolve, absolute it does
not, and after the theme learns to read dimensions that difference is the one
users will trip over.

![Absolute to this site](https://example.com/images/landscape.png)

![Absolute to nothing](https://example.com/remote.png)

![Absolute with a query of its own](https://example.com/remote.png?v=2)

![Absolute with a query and an effect](https://example.com/remote.png?v=2&width=20vw)
