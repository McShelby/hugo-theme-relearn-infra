---
title: Cards
weight: 7
---

A card runs the code of a script URL however it is spelled, and links any other
URL like the link shortcode does.

{{< cards >}}
{{% card title="Script" href="javascript:alert(41)" %}}Runs code{{% /card %}}
{{% card title="Mixed case" href="JaVaSCript:alert(42)" %}}Runs code{{% /card %}}
{{% card title="No code" href="javascript:" %}}Runs nothing, still no link{{% /card %}}
{{% card title="Phone" href="tel:+123" %}}Keeps its scheme{{% /card %}}
{{% card title="Entities" href="https://example.com/?a=1&copy=2&lt=3" %}}Keeps its query{{% /card %}}
{{% card title="Blank" href=" " %}}Links nowhere{{% /card %}}
{{% card image="data:image/png;base64,iVBORw0KGgo=" %}}An image as data URL{{% /card %}}
{{< /cards >}}
