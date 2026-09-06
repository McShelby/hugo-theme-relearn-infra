+++
title = 'Tags'
lastmod = 2024-01-01
weight = 2

# The taxonomy page lists its terms. Both terms hold two pages, so a count
# cannot order them and only `sort` can: by weight that is Zulu before Alpha,
# which is the reverse of the by-title order these listings fall back to.
[params]
  [params.children]
    type = 'flat'
    sort = 'weight'

# Every term page below inherits the same parameters, which is the documented
# way to configure a whole taxonomy at once.
[[cascade]]
  [cascade.params]
    [cascade.params.children]
      type = 'flat'
      sort = 'weight'
+++

A taxonomy page and its term pages build their own listing and hand it to the
`children` shortcode already assembled, so `sort` has to be honoured where the
listing is built rather than where it is rendered.
