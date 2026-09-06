+++
title = 'Pages'
+++

One section per kind of question a listing has to answer.

- **Text** - expressions over strings: the title fields, front matter
  parameters, the text functions, grouping, ordering, filtering and `limit`.
- **Dates** - the four date fields and a date in front matter, the date
  functions, and the order the resulting groups fall into.
- **Layout** - the tree a listing is taken from, the displays that render it,
  and the listing shape: `columns`, `headinglevel`, `description`,
  `breadcrumb`, `axis` and `pageref`.
- **Front matter** - parameters set in `params.pages` and by `cascade`, and
  what a call does to them.
- **Terms** - taxonomy and term pages, and the titles they are listed by.
- **Legacy** - the deprecated `children` shortcode, and the `pages` call it
  names as its replacement.
- **Invalid** - every expression and parameter the shortcode refuses, and the
  warning it refuses it with.
- **Values** - values that are not plain text: a missing weight, zero,
  padding, lists and maps, and numbers and text mixed in one key.

Each section's fixtures are shaped for its own question and stay deliberately
plain otherwise, so that a listing that comes out wrong is visible as wrong.
