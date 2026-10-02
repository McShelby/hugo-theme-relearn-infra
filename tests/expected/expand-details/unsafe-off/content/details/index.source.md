+++
title = 'Details'
weight = 2
+++

A page footnote.[^page]

## Parameters

### All defaults

{{< details >}}
Body.
{{< /details >}}

### summary

{{< details summary="A summary with **markup**" >}}
Body.
{{< /details >}}

### open=true

{{< details summary="Open" open=true >}}
Body.
{{< /details >}}

### open="true"

{{< details summary="Open" open="true" >}}
Body.
{{< /details >}}

### open=1

{{< details summary="Open" open=1 >}}
Body.
{{< /details >}}

### open=false

{{< details summary="Closed" open=false >}}
Body.
{{< /details >}}

### open=0

{{< details summary="Closed" open=0 >}}
Body.
{{< /details >}}

### open="yes"

Not a value the parameter knows.

{{< details summary="Closed" open="yes" >}}
Body.
{{< /details >}}

### name

Two calls sharing a name, of which a browser keeps one open at a time.

{{< details summary="First of a group" name="group" open=true >}}
Body.
{{< /details >}}

{{< details summary="Second of a group" name="group" >}}
Body.
{{< /details >}}

### class

{{< details summary="Classes" class="first second" >}}
Body.
{{< /details >}}

### title

{{< details summary="Title" title="A tooltip" >}}
Body.
{{< /details >}}

## Body

### Markdown in `<` notation

{{< details summary="Markdown" >}}
A first paragraph with **markup**.

- a list item
- another one

```text
a code block

with an empty line in it and **no markup**
```

A last paragraph.
{{< /details >}}

### Markdown in `%` notation

{{% details summary="Markdown" %}}
A first paragraph with **markup**.

- a list item
- another one

```text
a code block

with an empty line in it and **no markup**
```

A last paragraph.
{{% /details %}}

### HTML in `<` notation

{{< details summary="HTML" >}}
<p>A paragraph written as <em>HTML</em>.</p>
{{< /details >}}

### HTML in `<` notation, raw=true

{{< details summary="HTML" raw=true >}}
<p>A paragraph written as <em>HTML</em> with **no markup**.</p>
{{< /details >}}

### No body in `<` notation

{{< details summary="Nothing" >}}{{< /details >}}

### No body in `%` notation

{{% details summary="Nothing" %}}{{% /details %}}

## Nesting

### A shortcode in a `<` body

{{< details summary="Nested" >}}
A paragraph with **markup** and {{< nested >}}.
{{< /details >}}

### A shortcode in a `<` body, raw=true

{{< details summary="Nested" raw=true >}}
<p>A paragraph with {{< nested >}}.</p>
{{< /details >}}

### A shortcode in a `<` body, raw="true"

{{< details summary="Nested" raw="true" >}}
<p>A paragraph with {{< nested >}}.</p>
{{< /details >}}

### A shortcode in a `%` body

{{% details summary="Nested" %}}
A paragraph with **markup** and {{< nested >}}.
{{% /details %}}

### Inside a list

- A list item.

  {{< details summary="In a list" >}}
  A paragraph with **markup**.
  {{< /details >}}

- Another list item.

## Footnotes

### Reference inside, definition outside

{{< details summary="Reference inside" open=true >}}
A reference to the page footnote.[^page]
{{< /details >}}

### Reference and definition inside

{{< details summary="Both inside" open=true >}}
A reference to a footnote of its own.[^inner]

[^inner]: The footnote defined inside the body.
{{< /details >}}

## Headings

{{< details summary="A heading inside" open=true >}}
### Heading inside the body

A paragraph.
{{< /details >}}

[^page]: The footnote defined on the page.
