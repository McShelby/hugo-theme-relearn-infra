var relearn_searchindex = [
  {
    "breadcrumb": "Children Sort",
    "content": "One listing per documented sort value, over the same four pages. Each block carries the criterion in its class, so the order below a class either matches that criterion or the sort did not happen.\nsort expected order auto, default, weight Bravo, Alpha, Delta, Charlie title Alpha, Bravo, Charlie, Delta date Delta, Charlie, Bravo, Alpha modifieddate Charlie, Delta, Alpha, Bravo publishdate Bravo, Delta, Alpha, Charlie expirydate Alpha, Charlie, Bravo, Delta length Delta, Bravo, Charlie, Alpha auto Bravo Alpha Delta Charlie default Bravo Alpha Delta Charlie weight Bravo Alpha Delta Charlie title Alpha Bravo Charlie Delta date Delta Charlie Bravo Alpha modifieddate Charlie Delta Alpha Bravo publishdate Bravo Delta Alpha Charlie expirydate Alpha Charlie Bravo Delta length Delta Bravo Charlie Alpha nested sort applies to every level it descends into, not only the first. Bravo’s own two children are weighted against their titles, so a level that kept the default order reads Zulu before Alpha.\nAlpha Bravo Alpha Zulu Charlie Delta card A card template is handed the sort it was listed under, so sortprobe can print it back. Reaching that template at all is what shows cardtemplate arrived with it.\nAlpha template=sortprobe sort=title Bravo template=sortprobe sort=title Charlie template=sortprobe sort=title Delta template=sortprobe sort=title",
    "description": "One listing per documented sort value, over the same four pages. Each block carries the criterion in its class, so the order below a class either matches that criterion or the sort did not happen.\nsort expected order auto, default, weight Bravo, Alpha, Delta, Charlie title Alpha, Bravo, Charlie, Delta date Delta, Charlie, Bravo, Alpha modifieddate Charlie, Delta, Alpha, Bravo publishdate Bravo, Delta, Alpha, Charlie expirydate Alpha, Charlie, Bravo, Delta length Delta, Bravo, Charlie, Alpha auto Bravo Alpha Delta Charlie default Bravo Alpha Delta Charlie weight Bravo Alpha Delta Charlie title Alpha Bravo Charlie Delta date Delta Charlie Bravo Alpha modifieddate Charlie Delta Alpha Bravo publishdate Bravo Delta Alpha Charlie expirydate Alpha Charlie Bravo Delta length Delta Bravo Charlie Alpha nested sort applies to every level it descends into, not only the first. Bravo’s own two children are weighted against their titles, so a level that kept the default order reads Zulu before Alpha.",
    "tags": [],
    "title": "Sorted",
    "uri": "/sorted/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Sorted \u003e Bravo",
    "content": "First by weight, last by title.",
    "description": "First by weight, last by title.",
    "tags": [],
    "title": "Zulu",
    "uri": "/sorted/w1-bravo/nested-zulu/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Tags",
    "content": "Holds Bravo and Alpha. By weight that is Bravo first; by title, Alpha.",
    "description": "Holds Bravo and Alpha. By weight that is Bravo first; by title, Alpha.",
    "tags": [],
    "title": "Tag :: Zulu",
    "uri": "/tags/one/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Sorted",
    "content": "The second shortest body in the site. sort=length orders by the length of the rendered content, so these four bodies are the only thing that tells that criterion apart from the other six.",
    "description": "The second shortest body in the site. sort=length orders by the length of the rendered content, so these four bodies are the only thing that tells that criterion apart from the other six.",
    "tags": [
      "Zulu"
    ],
    "title": "Bravo",
    "uri": "/sorted/w1-bravo/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Sorted \u003e Bravo",
    "content": "Last by weight, first by title.",
    "description": "Last by weight, first by title.",
    "tags": [],
    "title": "Alpha",
    "uri": "/sorted/w1-bravo/nested-alpha/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Tags",
    "content": "Holds Delta and Charlie. By weight that is Delta first; by title, Charlie.",
    "description": "Holds Delta and Charlie. By weight that is Delta first; by title, Charlie.",
    "tags": [],
    "title": "Tag :: Alpha",
    "uri": "/tags/two/index.html"
  },
  {
    "breadcrumb": "Children Sort",
    "content": "A taxonomy page and its term pages build their own listing and hand it to the children shortcode already assembled, so sort has to be honoured where the listing is built rather than where it is rendered.",
    "description": "A taxonomy page and its term pages build their own listing and hand it to the children shortcode already assembled, so sort has to be honoured where the listing is built rather than where it is rendered.",
    "tags": [],
    "title": "Tags",
    "uri": "/tags/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Sorted",
    "content": "The longest body in the site, and so the last page under sort=length.\nIts weight puts it second, its title first, its date last, its lastmod third, its publishDate third and its expiryDate first. Seven criteria, seven distinct positions across the four pages, which is what stops one sort from passing while wearing another’s order.\nThe body has to be long enough that no amount of surrounding markup can close the gap to Charlie, so it runs to a few paragraphs rather than a few words. Length is measured after rendering, which includes whatever the theme wraps around it.",
    "description": "The longest body in the site, and so the last page under sort=length.\nIts weight puts it second, its title first, its date last, its lastmod third, its publishDate third and its expiryDate first. Seven criteria, seven distinct positions across the four pages, which is what stops one sort from passing while wearing another’s order.\nThe body has to be long enough that no amount of surrounding markup can close the gap to Charlie, so it runs to a few paragraphs rather than a few words. Length is measured after rendering, which includes whatever the theme wraps around it.",
    "tags": [
      "Zulu"
    ],
    "title": "Alpha",
    "uri": "/sorted/w2-alpha/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Sorted",
    "content": "The shortest body in the site.",
    "description": "The shortest body in the site.",
    "tags": [
      "Alpha"
    ],
    "title": "Delta",
    "uri": "/sorted/w3-delta/index.html"
  },
  {
    "breadcrumb": "Children Sort \u003e Sorted",
    "content": "The third shortest body in the site, which is to say the second longest.\nIt sits between Bravo and Alpha on length, last on weight, third on title, second on date, first on lastmod, last on publishDate and second on expiryDate.",
    "description": "The third shortest body in the site, which is to say the second longest.\nIt sits between Bravo and Alpha on length, last on weight, third on title, second on date, first on lastmod, last on publishDate and second on expiryDate.",
    "tags": [
      "Alpha"
    ],
    "title": "Charlie",
    "uri": "/sorted/w4-charlie/index.html"
  },
  {
    "breadcrumb": "",
    "content": "Two halves. Sorted calls the children shortcode once per documented sort value over one set of pages. Tags reaches the same shortcode the way a taxonomy and a term page do, where the listing is built before the shortcode ever sees it.",
    "description": "Two halves. Sorted calls the children shortcode once per documented sort value over one set of pages. Tags reaches the same shortcode the way a taxonomy and a term page do, where the listing is built before the shortcode ever sees it.",
    "tags": [],
    "title": "Children Sort",
    "uri": "/index.html"
  }
]
