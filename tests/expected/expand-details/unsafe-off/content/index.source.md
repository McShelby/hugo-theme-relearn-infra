+++
title = 'Expand and Details'
+++

Two pages, one per shortcode, built from the same sections.

- **Parameters** - every parameter a call accepts, in each form it accepts it.
- **Body** - Markdown and HTML bodies in both notations, and no body at all.
- **Nesting** - a shortcode inside the body, and the call itself inside a list.
- **Footnotes** - a reference and its definition on either side of the call.
- **Headings** - a heading inside the body, and whether the page's table of
  contents knows about it.

The `nested` shortcode writes `<b class="nested">nested</b>` and stands for any
shortcode that writes HTML.
