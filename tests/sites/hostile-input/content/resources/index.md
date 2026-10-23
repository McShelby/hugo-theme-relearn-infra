---
title: Resources
weight: 6
resources:
  - src: notes.txt
    name: 'c:notes.txt'
  - src: script.txt
    name: 'javascript:alert(1).txt'
  - src: entity.txt
    name: 'x&lt;y.txt'
---

A file name the theme turns into a link: its spaces must not end the link, a
colon must not make it a scheme and an entity must not be decoded. A `%` or `#`
is left out, as Hugo itself can not give such a resource a URL. A file name can
not hold a colon everywhere, so those names are given in front matter.

{{< resources />}}
