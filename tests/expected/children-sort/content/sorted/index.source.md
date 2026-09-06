+++
title = 'Sorted'
lastmod = 2024-01-01
weight = 1
+++

One listing per documented `sort` value, over the same four pages. Each block
carries the criterion in its class, so the order below a class either matches
that criterion or the sort did not happen.

| sort | expected order |
|---|---|
| `auto`, `default`, `weight` | Bravo, Alpha, Delta, Charlie |
| `title` | Alpha, Bravo, Charlie, Delta |
| `date` | Delta, Charlie, Bravo, Alpha |
| `modifieddate` | Charlie, Delta, Alpha, Bravo |
| `publishdate` | Bravo, Delta, Alpha, Charlie |
| `expirydate` | Alpha, Charlie, Bravo, Delta |
| `length` | Delta, Bravo, Charlie, Alpha |

## auto

{{% children type="flat" %}}

## default

{{% children type="flat" sort="default" %}}

## weight

{{% children type="flat" sort="weight" %}}

## title

{{% children type="flat" sort="title" %}}

## date

{{% children type="flat" sort="date" %}}

## modifieddate

{{% children type="flat" sort="modifieddate" %}}

## publishdate

{{% children type="flat" sort="publishdate" %}}

## expirydate

{{% children type="flat" sort="expirydate" %}}

## length

{{% children type="flat" sort="length" %}}

## nested

`sort` applies to every level it descends into, not only the first. Bravo's own
two children are weighted against their titles, so a level that kept the
default order reads Zulu before Alpha.

{{% children type="tree" depth="2" sort="title" %}}

## card

A card template is handed the `sort` it was listed under, so `sortprobe` can
print it back. Reaching that template at all is what shows `cardtemplate`
arrived with it.

{{< children type="card" cardtemplate="sortprobe" sort="title" >}}
