+++
title = 'Cards'
weight = 5
+++

Where the `alt` of a card image comes from: `imagealt`, else the title of the
page the card links to, else that link itself. A card that shows a title names
itself and leaves its image decorative.

{{% card image="/images/square.gif" title="Titled" %}}
A title, a text and an image.
{{% /card %}}

{{% card image="/images/square.gif" title="Titled" %}}{{% /card %}}

{{% card image="/images/square.gif" %}}{{% /card %}}

{{% card image="/images/square.gif" imagealt="A grey square" %}}{{% /card %}}

{{< cards >}}
{{% card image="/images/square.gif" title="Titled" imagealt="A grey square" %}}{{% /card %}}
{{% card image="/images/square.gif" href="../notice/" imagealt="A grey square" %}}{{% /card %}}
{{% card image="/images/square.gif" href="../notice/" %}}{{% /card %}}
{{% card image="/images/square.gif" href="https://example.com/" %}}{{% /card %}}
{{% card image="/images/square.gif" title="Titled" href="../notice/" %}}{{% /card %}}
{{< /cards >}}
