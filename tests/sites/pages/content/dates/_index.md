+++
title = 'Dates'
weight = 2
+++

Expressions over dates. Nine children, Alpha through India.

The four date fields are set decades apart on purpose - `date` in 2020-2023,
`lastmod` in 2024-2027, `publishDate` in 2018-2021, `expiryDate` in 2090-2093 -
so no two fields can produce the same set of groups. India has none of them.

Within the five pages that share a `date` year, `lastmod` ranks them in the
exact reverse of their `date` order. Ordering inside a group is therefore the
one place where naming the wrong field cannot pass for the right one.

Every listing here sets `headinglevel="4"`.

## Which date field a group is keyed by

### date | year

Four years: 2020, 2021 with five pages, 2022 and 2023. India has no date, so it
forms the last group, `Other`, rather than a group for the year one.

{{% pages groupby="date | year" headinglevel="4" %}}

### lastmod | year

A different decade, and a different partition: 2024, 2025, 2026 and 2027 hold
two pages each.

{{% pages groupby="lastmod | year" headinglevel="4" %}}

### publishdate | year

2018 through 2021, and Golf moves from the earliest group to the latest.

{{% pages groupby="publishdate | year" headinglevel="4" %}}

### expirydate | year

2090 through 2093. These are far enough out that the site has to build expired
and future pages alike, which is what its config says.

{{% pages groupby="expirydate | year" headinglevel="4" %}}

### params.released | year

A date held as text in a front matter parameter rather than in one of Hugo's
own fields; the date functions read it as a date. Echo and India have none.

{{% pages groupby="params.released | year" headinglevel="4" %}}

## Date functions

### month

The month number without a year, so pages from different years merge: Alpha
and Bravo both fall into `1`.

{{% pages groupby="date | month" headinglevel="4" %}}

### month, labelled by name

The same partition, headed by the month's name. The groups keep calendar
order, because they are ordered by the month number and not by the heading.

{{% pages groupby="date | month" grouplabel="date | format January" headinglevel="4" %}}

### day

{{% pages groupby="date | day" headinglevel="4" %}}

### weekday

ISO numbering, Monday 1 through Sunday 7. Charlie is the only Monday, Delta the
only Tuesday, Bravo the only Thursday, Hotel the only Saturday, Golf the only
Sunday, and Alpha, Echo and Foxtrot are Wednesdays.

{{% pages groupby="date | weekday" headinglevel="4" %}}

### weekday, labelled by name

Alphabetically the names would read Monday, Saturday, Sunday, Thursday,
Tuesday, Wednesday - which is not the week. The groups keep the week's order.

{{% pages groupby="date | weekday" grouplabel="date | format Monday" headinglevel="4" %}}

## format - a date as display text

A `groupby` ending in `format` is keyed by the formatted text but ordered by
the parts of the date the layout shows, in calendar order.

### format :date_long

The locale's long form, a token only Hugo's own function understands. Almost
every page gets a group of its own; Echo and Foxtrot share a day.

{{% pages groupby="date | format :date_long" headinglevel="4" %}}

### format :date_medium

A second localized token, to show the tokens are read as tokens rather than
copied through as literal text.

{{% pages groupby="date | format :date_medium" headinglevel="4" %}}

### format 2006-01

Year and month. The 2021 group of five splits into January, February, June and
September, the last holding Echo and Foxtrot.

{{% pages groupby="date | format 2006-01" headinglevel="4" %}}

### format January

The month name alone, keyed by text, merging months across years. The layout
shows only the month, so the groups read January to September in calendar
order, whatever the year of their pages. Has to match `date | month` labelled
by name above.

{{% pages groupby="date | format January" headinglevel="4" %}}

### format Monday

The weekday name alone: the week's order, Monday first, as for `date | weekday`
labelled by name above.

{{% pages groupby="date | format Monday" headinglevel="4" %}}

### format 2. January

The day and month, pooled across years: Alpha's and Bravo's 20th of January
share a group ahead of Charlie's 15th of February.

{{% pages groupby="date | format 2. January" headinglevel="4" %}}

### format January 2006

A layout with a space, taken as one argument. `January 2021` precedes
`March 2020` alphabetically and follows it chronologically; the listing has to
read chronologically.

{{% pages groupby="date | format January 2006" headinglevel="4" %}}

### format 2006 January

The same groups with the two halves swapped. Has to come in the same order as
the listing above.

{{% pages groupby="date | format 2006 January" headinglevel="4" %}}

## grouporder - the order of the groups

### desc

2023 first, `Other` still last. The 2021 group holds five pages, so this also
shows that reversing the groups does not reach inside them.

{{% pages groupby="date | year" grouporder="desc" headinglevel="4" %}}

### desc on formatted months

Reversing groups whose text order is not their order.

{{% pages groupby="date | format January 2006" grouporder="desc" headinglevel="4" %}}

## orderby - the order of pages inside a group

The 2021 group holds Alpha, Charlie, Delta, Echo and Foxtrot, which is where an
order inside a group is visible.

### date

Alpha in January, Charlie in February, Delta in June, then Echo and Foxtrot in
September.

{{% pages groupby="date | year" orderby="date" headinglevel="4" %}}

### date desc

The same group order, the pages inside reversed.

{{% pages groupby="date | year" orderby="date desc" headinglevel="4" %}}

### lastmod

Ordering by one date field while grouping by another. `lastmod` ranks the 2021
pages in reverse of their `date` order, so this reads Foxtrot, Echo, Delta,
Charlie, Alpha - a listing that quietly ordered by `date` instead could not.

{{% pages groupby="date | year" orderby="lastmod" headinglevel="4" %}}

### date | month

An expression as order, not only a field. Echo and Foxtrot tie in September,
and India, having no date, comes last.

{{% pages orderby="date | month, linktitle" %}}

### date | format '2. January'

A `format` orders by the parts of the date its layout shows, here day and
month whatever the year: Alpha and Bravo on the 20th of January first, then
Charlie, Golf, Delta, Hotel, Echo and Foxtrot, and India, having no date, last.

{{% pages orderby="date | format '2. January', linktitle" %}}

### date | format 'January 2, 2006' desc

A layout with a comma, delimited so the comma does not end the expression: the
full date, newest first.

{{% pages orderby="date | format 'January 2, 2006' desc" %}}

## where on dates

### date >= 2021-06-01

Dates compare as dates. India, having no date, is not kept.

{{% pages where="date >= 2021-06-01" %}}

### date != 2021-09-15

Every page but Echo and Foxtrot - India included, as a missing value matches
`!=`.

{{% pages where="date != 2021-09-15" %}}

## flatten over dates

An archive: the whole tree as one list, grouped by year and month, the newest
group and the newest page first.

{{% pages levels="999" kind="leaf" flatten="true" groupby="date | format 2006-01" grouporder="desc" orderby="date desc" display="list" headinglevel="4" %}}
