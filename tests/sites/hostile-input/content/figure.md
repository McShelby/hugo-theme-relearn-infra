---
title: Figure
weight: 2
---

The caption and the attribution are Markdown and may hold HTML, so they are
left out; the alt text a caption falls back to is not.

## Text

{{< hostile partial="figure" param="alt" set="text" src="https://example.com/a.png" >}}

{{< hostile partial="figure" param="title" set="text" src="https://example.com/a.png" >}}

{{< hostile partial="figure" param="class" set="text" src="https://example.com/a.png" >}}

{{< hostile partial="figure" param="target" set="text" src="https://example.com/a.png" link="https://example.com" >}}

## Alt Text From the Caption

{{< figure src="https://example.com/a.png" caption="It's a caption with &lt;escaped&gt; markup & an ampersand" >}}

## URLs

{{< hostile partial="figure" param="src" set="url" >}}

{{< hostile partial="figure" param="link" set="url" src="https://example.com/a.png" >}}

{{< hostile partial="figure" param="attrlink" set="url" src="https://example.com/a.png" attr="Attribution" >}}

A link of nothing but spaces names nothing, not the page itself.

{{< figure src="https://example.com/a.png" link=" " >}}
