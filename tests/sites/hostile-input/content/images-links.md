---
title: Images and Links
weight: 3
---

The partials behind the image and link render hooks, called as a template
calls them.

## Image

{{< hostile partial="image" param="alt" set="text" url="https://example.com/a.png" >}}

{{< hostile partial="image" param="title" set="text" url="https://example.com/a.png" >}}

{{< hostile partial="image" param="url" set="url" alt="Image" >}}

## Link

{{< hostile partial="link" param="title" set="text" url="https://example.com" content="Title" >}}

{{< hostile partial="link" param="target" set="text" url="https://example.com" content="Target" >}}

{{< hostile partial="link" param="url" set="url" content="URL" >}}

## Blockquote

{{< hostile partial="blockquote" param="href" set="url" content="<p>Quoted</p>" author="Author" >}}
