+++
title = 'Expand'
weight = 1
+++

A page footnote.[^page]

## Parameters

### All defaults

{{% expand %}}
Body.
{{% /expand %}}

### title

{{% expand title="A title with **markup**" %}}
Body.
{{% /expand %}}

### title, positional

{{% expand "A positional title" %}}
Body.
{{% /expand %}}

### expanded=true

{{% expand title="Expanded" expanded=true %}}
Body.
{{% /expand %}}

### expanded="true"

{{% expand title="Expanded" expanded="true" %}}
Body.
{{% /expand %}}

### expanded="false"

{{% expand title="Collapsed" expanded="false" %}}
Body.
{{% /expand %}}

### expanded, positional

{{% expand "A positional title" "true" %}}
Body.
{{% /expand %}}

### open

The deprecated predecessor of `expanded`, which warns on the console. The
site's `warnings.txt` lists that message.

{{% expand title="Open" open="true" %}}
Body.
{{% /expand %}}

## Body

### Markdown in `%` notation

{{% expand title="Markdown" %}}
A first paragraph with **markup**.

- a list item
- another one

```text
a code block

with an empty line in it and **no markup**
```

A last paragraph.
{{% /expand %}}

### Markdown in `<` notation

{{< expand title="Markdown" >}}
A first paragraph with **markup**.

- a list item
- another one
{{< /expand >}}

### HTML in `<` notation

{{< expand title="HTML" >}}
<p>A paragraph written as <em>HTML</em>.</p>
{{< /expand >}}

### No body in `%` notation

{{% expand title="Nothing" %}}{{% /expand %}}

### No body in `<` notation

{{< expand title="Nothing" >}}{{< /expand >}}

## Nesting

### A shortcode in a `%` body

{{% expand title="Nested" %}}
A paragraph with **markup** and {{< nested >}}.
{{% /expand %}}

### A shortcode in a `<` body

{{< expand title="Nested" >}}
<p>A paragraph with {{< nested >}}.</p>
{{< /expand >}}

### Inside a list

- A list item.

  {{% expand title="In a list" %}}
  A paragraph with **markup**.
  {{% /expand %}}

- Another list item.

### From a template

{{< expandcall title="From a template" >}}

## Footnotes

### Reference inside, definition outside

{{% expand title="Reference inside" expanded=true %}}
A reference to the page footnote.[^page]
{{% /expand %}}

### Reference and definition inside

{{% expand title="Both inside" expanded=true %}}
A reference to a footnote of its own.[^inner]

[^inner]: The footnote defined inside the body.
{{% /expand %}}

## Headings

{{% expand title="A heading inside" expanded=true %}}
### Heading inside the body

A paragraph.
{{% /expand %}}

[^page]: The footnote defined on the page.
