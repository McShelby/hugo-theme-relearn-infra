var relearn_searchindex = [
  {
    "breadcrumb": "Image Permutations",
    "content": "width and height are CSS lengths - 20vw and 50% are as valid as 50px - so they are style, not pixel counts. The intrinsic dimensions of the resource are a separate thing, and what a browser needs to reserve space with before the image has arrived.\nUnsized One dimension Both dimensions Relative lengths Portrait The other aspect ratio, so a swapped pair of dimensions cannot pass unnoticed.\nUnmeasurable An SVG is an image resource Hugo cannot read dimensions from, so it has none to carry into the markup however it is sized.\nElsewhere An absolute URL never resolves to a resource and so can never carry intrinsic dimensions - and, pointing at a host that does not answer, would show as alt text on a page whose whole subject is what an image measures. Those live on the Sources page, where showing nothing is the point.",
    "description": "width and height are CSS lengths - 20vw and 50% are as valid as 50px - so they are style, not pixel counts. The intrinsic dimensions of the resource are a separate thing, and what a browser needs to reserve space with before the image has arrived.\nUnsized One dimension",
    "tags": [],
    "title": "Sizing",
    "uri": "/sizing/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "Where a URL is looked up decides whether there is a resource behind it at all, and a resource is the only thing that can be asked its dimensions.\nGlobal resource A page, not a resource Pages are searched before resources, so an image URL naming one resolves to a page. A page answers about its media type like a resource does, and is not an image, so it has no dimensions to give.\nMissing resource No image.errorlevel is configured, so an unresolvable image is emitted as written rather than reported.\nAbsolute An absolute URL is emitted as it was written and never resolved to a resource, which is the whole of what these pin. None of them displays anywhere but on example.com itself - the reserved documentation domain, which answers no path\nso in any preview they render as their alt text and no image. That is the expected result rather than a broken fixture. The first is worth its own line: it names an image this very site publishes, written the long way round. Site-relative it would resolve, absolute it does not, and after the theme learns to read dimensions that difference is the one users will trip over.",
    "description": "Where a URL is looked up decides whether there is a resource behind it at all, and a resource is the only thing that can be asked its dimensions.\nGlobal resource A page, not a resource Pages are searched before resources, so an image URL naming one resolves to a page. A page answers about its media type like a resource does, and is not an image, so it has no dimensions to give.",
    "tags": [],
    "title": "Sources",
    "uri": "/sources/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "Hugo can read dimensions from some image resources and not from others. Both kinds are here, sized identically, so the difference is the resource and nothing else.\nMeasurable Unmeasurable Inlined inlinecontent replaces the element entirely, and strips the XML declaration on the way.\ninlinecontent on anything else is ignored.\nEmbedded",
    "description": "Hugo can read dimensions from some image resources and not from others. Both kinds are here, sized identically, so the difference is the resource and nothing else.\nMeasurable Unmeasurable",
    "tags": [],
    "title": "Formats",
    "uri": "/formats/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "Everything that changes the emitted element. Sizing stays out of the way here except where the two are deliberately combined.\nDefaults Lightbox The lightbox emits a second copy of the image, which is why turning it off changes more than a class.\nLazy loading Decoration Unknown classes A class the theme knows nothing about is dropped here rather than passed to the element - unlike the same class handed to the partial by a template, which the Template page shows arriving on the element. The asymmetry is the theme’s, and this is where it would show up if it changed.\nA custom class starting with no is not an effect being switched off, and is dropped for the same reason rather than for that one.\nCombined",
    "description": "Everything that changes the emitted element. Sizing stays out of the way here except where the two are deliberately combined.\nDefaults Lightbox The lightbox emits a second copy of the image, which is why turning it off changes more than a class.",
    "tags": [],
    "title": "Effects",
    "uri": "/effects/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "Every markdown spelling that reaches the render hook, because each arrives with a different set of what the hook calls attributes.\nPlain With a title Without alt text Reference style Inside a link Inside a paragraph Text before and text after it, on one line with the surrounding prose.\nWith markdown attributes Hugo wraps a standalone image in a paragraph unless told not to, so a block attribute below the image attaches to that paragraph and never reaches the image. It is consumed either way - it does not survive as text - so the images below are expected to come out exactly like the plain one above.\nAttributes that do reach the partial come from a template calling it, which is the Template page.",
    "description": "Every markdown spelling that reaches the render hook, because each arrives with a different set of what the hook calls attributes.\nPlain With a title",
    "tags": [],
    "title": "Syntax",
    "uri": "/syntax/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "local.png is a resource of this page rather than of the site, which is a different lookup and the one a page bundle relies on.\nThe front matter above switches two effects, so every image on this page carries them until its URL says otherwise. That makes this page the middle layer of the stack: the site-wide axis underneath, URL parameters on top.\nPage resource Global resource seen from a bundle Unmeasurable resource under front matter effects",
    "description": "local.png is a resource of this page rather than of the site, which is a different lookup and the one a page bundle relies on.\nThe front matter above switches two effects, so every image on this page carries them until its URL says otherwise. That makes this page the middle layer of the stack: the site-wide axis underneath, URL parameters on top.\nPage resource",
    "tags": [],
    "title": "Page Bundle",
    "uri": "/bundle/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "The theme documents calling its image partial from a template, passing effects as attributes. That is the highest layer of the effect stack, above the URL, the front matter and the site configuration - and the only layer that can hand the partial an HTML attribute directly.\nA fixture-local shortcode makes the call, so these are template calls rather than markdown images.\nNothing passed Effect classes Unknown classes Effect names are consumed; anything else is passed through to the element.\nAttributes the element carries Outranking the URL",
    "description": "The theme documents calling its image partial from a template, passing effects as attributes. That is the highest layer of the effect stack, above the URL, the front matter and the site configuration - and the only layer that can hand the partial an HTML attribute directly.\nA fixture-local shortcode makes the call, so these are template calls rather than markdown images.\nNothing passed Effect classes Unknown classes Effect names are consumed; anything else is passed through to the element.",
    "tags": [],
    "title": "Template",
    "uri": "/template/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "",
    "description": "",
    "tags": [],
    "title": "Categories",
    "uri": "/categories/index.html"
  },
  {
    "breadcrumb": "",
    "content": "One page per axis of the image partial, each varying that axis and holding the rest still:\nSizing - what width and height do, and what a browser has to reserve space with before the image arrives Sources - how a URL resolves to a resource, or fails to Formats - which resources Hugo can read dimensions from Effects - everything that changes the emitted element Syntax - every markdown spelling that reaches the render hook Page Bundle - a page resource, under front matter effects",
    "description": "One page per axis of the image partial, each varying that axis and holding the rest still:\nSizing - what width and height do, and what a browser has to reserve space with before the image arrives Sources - how a URL resolves to a resource, or fails to Formats - which resources Hugo can read dimensions from Effects - everything that changes the emitted element Syntax - every markdown spelling that reaches the render hook Page Bundle - a page resource, under front matter effects",
    "tags": [],
    "title": "Image Permutations",
    "uri": "/index.html"
  },
  {
    "breadcrumb": "Image Permutations",
    "content": "",
    "description": "",
    "tags": [],
    "title": "Tags",
    "uri": "/tags/index.html"
  }
]
