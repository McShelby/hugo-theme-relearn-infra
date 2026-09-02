+++
title = 'Dependencies'
weight = 4
+++

# Dependencies

This page exercises the on-demand dependency loader: math and mermaid should
each pull their assets in only because they are used here.

## Math

{{< math align="center" >}}
$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right)$$
{{< /math >}}

## Mermaid

{{< mermaid >}}
graph LR;
  A[Theme] --> B[Infra];
  B --> C[CI];
{{< /mermaid >}}

## Icon

{{< icon icon="star" >}} inline with text.
