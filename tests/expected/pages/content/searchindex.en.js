var relearn_searchindex = [
  {
    "breadcrumb": "Pages",
    "content": "Expressions over strings. Eight children: Anchor, Anchorage, Beacon, Compass, Drift (linked as Signal), Ember, Lantern (hidden) and Ösen.\nTheir weights run 10, 15, 20, 30, 35, 40, 50, 60 and deliberately disagree with the alphabet: Beacon is lightest, Ösen heaviest. Lantern weighs 15 and only shows where hidden pages are asked for.\nEvery grouped listing here sets headinglevel=\"4\" so that a group heading renders below the heading naming the listing, rather than beside it.\nDefault No parameter at all: the children in Hugo’s order, which is by weight, as a tree. Lantern is absent.\nBeacon Signal Anchor Anchorage Ember Compass Ösen groupby - which value a group is keyed by linktitle | left 1 | upper The letter index taxonomy and term pages use by default. Drift is listed as Signal and grouped under S, the letter of the label it is shown with.\nA Anchor Anchorage B Beacon C Compass E Ember Ö Ösen S Signal title | left 1 | upper The same, keyed by the page’s own title. Drift moves to D while its label stays Signal - title and linktitle are two fields, not two spellings.\nA Anchor Anchorage B Beacon C Compass D Signal E Ember Ö Ösen params.flavor A front matter parameter. Ember has no flavor, so it forms a last group of its own, labelled Other, rather than being dropped.\nguide Anchor Compass reference Beacon Ösen tutorial Signal Anchorage Other Ember params.flavor | coalesce none coalesce gives Ember a value, so it joins the ordered groups as none instead of trailing them as Other.\nguide Anchor Compass none Ember reference Beacon Ösen tutorial Signal Anchorage params.tier Four pages say Basic/Core and three say basic/core. Nothing folds case unless asked to, so this is four groups.\nbasic Beacon Basic Anchor Anchorage Ember core Ösen Core Signal Compass params.tier | lower Folded: two groups, every page kept.\nbasic Beacon Anchor Anchorage Ember core Signal Compass Ösen grouplabel Keyed by the folded tier, labelled by the upper-cased one. The label is evaluated for a group’s first page, so a group keyed basic is headed BASIC whether that page says Basic or basic.\nBASIC Beacon Anchor Anchorage Ember CORE Signal Compass Ösen Text functions left 1 The first rune. Ösen must group under Ö, not under a half of it.\nA Anchor Anchorage B Beacon C Compass E Ember Ö Ösen S Signal left 2 Anchor and Anchorage still share their first two letters; everything else separates. Without upper the keys keep their case.\nAn Anchor Anchorage Be Beacon Co Compass Em Ember Ös Ösen Si Signal left 3 Three letters still hold both. This is the last width at which they agree, and Ösen shows the count is in runes rather than bytes.\nAnc Anchor Anchorage Bea Beacon Com Compass Emb Ember Öse Ösen Sig Signal right 2 Counted from the end, in runes as well.\nal Signal en Ösen er Ember ge Anchorage on Beacon or Anchor ss Compass upper and lower The whole link title, upper-cased as a key and lower-cased as its label.\nanchor Anchor anchorage Anchorage beacon Beacon compass Compass ember Ember ösen Ösen signal Signal translate - translated text The site’s own translation file translates flavor-guide, flavor-tutorial and reference, and nothing else, so each listing here has a value without a translation. Such a value stays as it is, and Hugo reports the missing key - listed in the site’s warnings.txt, where it is the assertion.\ntranslate with a prefix Grouped by the flavor, labelled by its translation under the flavor- prefix: Guides and Tutorials, and reference, which has no flavor-reference. The groups keep the order of the untranslated flavors.\nGuides Anchor Compass reference Beacon Ösen Tutorials Signal Anchorage Other Ember translate without a prefix The flavor itself is the key: only reference is translated, as References.\nguide Anchor Compass References Beacon Ösen tutorial Signal Anchorage Other Ember translate in groupby Grouped by the translation itself, so the groups are ordered by the translated text: Guides, reference, Tutorials.\nGuides Anchor Compass reference Beacon Ösen Tutorials Signal Anchorage Other Ember grouporder - the order of the groups asc The default, spelled out. Has to match the linktitle | left 1 | upper listing above.\nA Anchor Anchorage B Beacon C Compass E Ember Ö Ösen S Signal desc The same groups, reversed. The pages inside a group keep their own order - grouporder and orderby are separate parameters, and the A group holding two pages is where a confusion between them would show.\nS Signal Ö Ösen E Ember C Compass B Beacon A Anchor Anchorage desc with a missing value Other stays last when the groups are reversed; it is not part of the ordered domain.\ntutorial Signal Anchorage reference Beacon Ösen guide Anchor Compass Other Ember orderby - the order of the pages auto The default, spelled out: Hugo’s order, by weight.\nBeacon Signal Anchor Anchorage Ember Compass Ösen auto desc Hugo’s order, reversed.\nÖsen Compass Ember Anchorage Anchor Signal Beacon linktitle Alphabetical by the label shown: Signal sorts among the S.\nAnchor Anchorage Beacon Compass Ember Ösen Signal title Alphabetical by the page’s own title: the same page sorts as Drift, among the D, while still labelled Signal.\nAnchor Anchorage Beacon Compass Signal Ember Ösen weight desc Ösen Compass Ember Anchorage Anchor Signal Beacon length By content length, which the bodies here differ in.\nAnchor Compass Beacon Anchorage Ember Signal Ösen params.flavor Ember has no flavor and comes last.\nAnchor Compass Beacon Ösen Signal Anchorage Ember params.flavor desc And stays last when the direction is reversed.\nSignal Anchorage Beacon Ösen Anchor Compass Ember params.flavor, weight desc Two keys in mixed directions: flavors ascending, and within one flavor the heavier page first. Anchor and Compass share guide, Anchorage and Drift share tutorial, Beacon and Ösen share reference. The second key only decides because Hugo’s sort keeps the order of ties - if it stopped doing so, these pairs are where it would show.\nCompass Anchor Ösen Beacon Anchorage Signal Ember orderby inside groups Grouped by flavor, each group ordered by weight descending.\nguide Compass Anchor reference Ösen Beacon tutorial Anchorage Signal Other Ember where - which pages are kept params.flavor = guide Anchor Compass params.flavor != guide Ember, having no flavor, is kept: a missing value only matches !=.\nBeacon Signal Anchorage Ember Ösen params.flavor in guide, reference Beacon Anchor Compass Ösen weight \u003c 30 Numbers compare as numbers: Beacon and Drift.\nBeacon Signal weight \u003e= 35 Anchorage Ember Compass Ösen linktitle \u003e M Text compares as text: Signal and Ösen, and neither Drift nor Lantern.\nSignal Ösen Quoting - a separator inside a delimited string An argument or a literal delimited by ' or a backtick is taken as a whole, so a |, a comma or an operator inside it separates nothing.\nA | in an argument Ember’s missing flavor becomes no | flavor, one group, not a stage flavor.\nguide Anchor Compass no | flavor Ember reference Beacon Ösen tutorial Signal Anchorage A comma in an orderby argument Ember is ordered as zz, last, after every flavor, and then by title: the comma inside the quotes does not end the first expression.\nAnchor Compass Beacon Ösen Anchorage Signal Ember Both delimiters in an in list guide and tutorial, one delimited by ', the other by a backtick.\nSignal Anchor Anchorage Compass A comma in an in value One value, guide, tutorial, which no flavor equals: the listing is empty.\nAn operator in an argument The = inside the quotes is not the operator: only Ember, whose missing flavor becomes x = y, is kept.\nEmber limit limit=3 after orderby The three heaviest, as limit applies after ordering.\nÖsen Compass Ember limit before grouping The three lightest, then grouped: the groups hold only what limit kept.\nguide Anchor reference Beacon tutorial Signal hidden - whether Lantern is listed Default Lantern is absent, so guide holds Anchor and Compass.\nguide Anchor Compass reference Beacon Ösen tutorial Signal Anchorage Other Ember hidden=true Lantern joins the guide group rather than forming one of its own.\nguide Lantern Anchor Compass reference Beacon Ösen tutorial Signal Anchorage Other Ember",
    "description": "Expressions over strings. Eight children: Anchor, Anchorage, Beacon, Compass, Drift (linked as Signal), Ember, Lantern (hidden) and Ösen.\nTheir weights run 10, 15, 20, 30, 35, 40, 50, 60 and deliberately disagree with the alphabet: Beacon is lightest, Ösen heaviest. Lantern weighs 15 and only shows where hidden pages are asked for.\nEvery grouped listing here sets headinglevel=\"4\" so that a group heading renders below the heading naming the listing, rather than beside it.",
    "tags": [],
    "title": "Text",
    "uri": "/text/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "Expressions over dates. Nine children, Alpha through India.\nThe four date fields are set decades apart on purpose - date in 2020-2023, lastmod in 2024-2027, publishDate in 2018-2021, expiryDate in 2090-2093 - so no two fields can produce the same set of groups. India has none of them.\nWithin the five pages that share a date year, lastmod ranks them in the exact reverse of their date order. Ordering inside a group is therefore the one place where naming the wrong field cannot pass for the right one.\nEvery listing here sets headinglevel=\"4\".\nWhich date field a group is keyed by date | year Four years: 2020, 2021 with five pages, 2022 and 2023. India has no date, so it forms the last group, Other, rather than a group for the year one.\n2020 Golf 2021 Alpha Charlie Delta Echo Foxtrot 2022 Bravo 2023 Hotel Other India lastmod | year A different decade, and a different partition: 2024, 2025, 2026 and 2027 hold two pages each.\n2024 Bravo Foxtrot 2025 Echo Golf 2026 Delta Hotel 2027 Alpha Charlie Other India publishdate | year 2018 through 2021, and Golf moves from the earliest group to the latest.\n2018 Alpha Bravo 2019 Charlie Delta 2020 Echo Foxtrot 2021 Golf Hotel Other India expirydate | year 2090 through 2093. These are far enough out that the site has to build expired and future pages alike, which is what its config says.\n2090 Alpha Bravo 2091 Charlie Delta 2092 Echo Foxtrot 2093 Golf Hotel Other India params.released | year A date held as text in a front matter parameter rather than in one of Hugo’s own fields; the date functions read it as a date. Echo and India have none.\n2019 Alpha Bravo 2020 Charlie Delta 2021 Foxtrot 2022 Golf Hotel Other Echo India Date functions month The month number without a year, so pages from different years merge: Alpha and Bravo both fall into 1.\n1 Alpha Bravo 2 Charlie 3 Golf 6 Delta 7 Hotel 9 Echo Foxtrot Other India month, labelled by name The same partition, headed by the month’s name. The groups keep calendar order, because they are ordered by the month number and not by the heading.\nJanuary Alpha Bravo February Charlie March Golf June Delta July Hotel September Echo Foxtrot Other India day 1 Delta Hotel 15 Charlie Echo Foxtrot Golf 20 Alpha Bravo Other India weekday ISO numbering, Monday 1 through Sunday 7. Charlie is the only Monday, Delta the only Tuesday, Bravo the only Thursday, Hotel the only Saturday, Golf the only Sunday, and Alpha, Echo and Foxtrot are Wednesdays.\n1 Charlie 2 Delta 3 Alpha Echo Foxtrot 4 Bravo 6 Hotel 7 Golf Other India weekday, labelled by name Alphabetically the names would read Monday, Saturday, Sunday, Thursday, Tuesday, Wednesday - which is not the week. The groups keep the week’s order.\nMonday Charlie Tuesday Delta Wednesday Alpha Echo Foxtrot Thursday Bravo Saturday Hotel Sunday Golf Other India format - a date as display text A groupby ending in format is keyed by the formatted text but ordered by the parts of the date the layout shows, in calendar order.\nformat :date_long The locale’s long form, a token only Hugo’s own function understands. Almost every page gets a group of its own; Echo and Foxtrot share a day.\nMarch 15, 2020 Golf January 20, 2021 Alpha February 15, 2021 Charlie June 1, 2021 Delta September 15, 2021 Echo Foxtrot January 20, 2022 Bravo July 1, 2023 Hotel Other India format :date_medium A second localized token, to show the tokens are read as tokens rather than copied through as literal text.\nMar 15, 2020 Golf Jan 20, 2021 Alpha Feb 15, 2021 Charlie Jun 1, 2021 Delta Sep 15, 2021 Echo Foxtrot Jan 20, 2022 Bravo Jul 1, 2023 Hotel Other India format 2006-01 Year and month. The 2021 group of five splits into January, February, June and September, the last holding Echo and Foxtrot.\n2020-03 Golf 2021-01 Alpha 2021-02 Charlie 2021-06 Delta 2021-09 Echo Foxtrot 2022-01 Bravo 2023-07 Hotel Other India format January The month name alone, keyed by text, merging months across years. The layout shows only the month, so the groups read January to September in calendar order, whatever the year of their pages. Has to match date | month labelled by name above.\nJanuary Alpha Bravo February Charlie March Golf June Delta July Hotel September Echo Foxtrot Other India format Monday The weekday name alone: the week’s order, Monday first, as for date | weekday labelled by name above.\nMonday Charlie Tuesday Delta Wednesday Alpha Echo Foxtrot Thursday Bravo Saturday Hotel Sunday Golf Other India format 2. January The day and month, pooled across years: Alpha’s and Bravo’s 20th of January share a group ahead of Charlie’s 15th of February.\n20. January Alpha Bravo 15. February Charlie 15. March Golf 1. June Delta 1. July Hotel 15. September Echo Foxtrot Other India format January 2006 A layout with a space, taken as one argument. January 2021 precedes March 2020 alphabetically and follows it chronologically; the listing has to read chronologically.\nMarch 2020 Golf January 2021 Alpha February 2021 Charlie June 2021 Delta September 2021 Echo Foxtrot January 2022 Bravo July 2023 Hotel Other India format 2006 January The same groups with the two halves swapped. Has to come in the same order as the listing above.\n2020 March Golf 2021 January Alpha 2021 February Charlie 2021 June Delta 2021 September Echo Foxtrot 2022 January Bravo 2023 July Hotel Other India grouporder - the order of the groups desc 2023 first, Other still last. The 2021 group holds five pages, so this also shows that reversing the groups does not reach inside them.\n2023 Hotel 2022 Bravo 2021 Alpha Charlie Delta Echo Foxtrot 2020 Golf Other India desc on formatted months Reversing groups whose text order is not their order.\nJuly 2023 Hotel January 2022 Bravo September 2021 Echo Foxtrot June 2021 Delta February 2021 Charlie January 2021 Alpha March 2020 Golf Other India orderby - the order of pages inside a group The 2021 group holds Alpha, Charlie, Delta, Echo and Foxtrot, which is where an order inside a group is visible.\ndate Alpha in January, Charlie in February, Delta in June, then Echo and Foxtrot in September.\n2020 Golf 2021 Alpha Charlie Delta Echo Foxtrot 2022 Bravo 2023 Hotel Other India date desc The same group order, the pages inside reversed.\n2020 Golf 2021 Echo Foxtrot Delta Charlie Alpha 2022 Bravo 2023 Hotel Other India lastmod Ordering by one date field while grouping by another. lastmod ranks the 2021 pages in reverse of their date order, so this reads Foxtrot, Echo, Delta, Charlie, Alpha - a listing that quietly ordered by date instead could not.\n2020 Golf 2021 Foxtrot Echo Delta Charlie Alpha 2022 Bravo 2023 Hotel Other India date | month An expression as order, not only a field. Echo and Foxtrot tie in September, and India, having no date, comes last.\nAlpha Bravo Charlie Golf Delta Hotel Echo Foxtrot India date | format ‘2. January’ A format orders by the parts of the date its layout shows, here day and month whatever the year: Alpha and Bravo on the 20th of January first, then Charlie, Golf, Delta, Hotel, Echo and Foxtrot, and India, having no date, last.\nAlpha Bravo Charlie Golf Delta Hotel Echo Foxtrot India date | format ‘January 2, 2006’ desc A layout with a comma, delimited so the comma does not end the expression: the full date, newest first.\nHotel Bravo Echo Foxtrot Delta Charlie Alpha Golf India where on dates date \u003e= 2021-06-01 Dates compare as dates. India, having no date, is not kept.\nBravo Delta Echo Foxtrot Hotel date != 2021-09-15 Every page but Echo and Foxtrot - India included, as a missing value matches !=.\nAlpha Bravo Charlie Delta Golf Hotel India flatten over dates An archive: the whole tree as one list, grouped by year and month, the newest group and the newest page first.\n2023-07 Hotel 2022-01 Bravo 2021-09 Echo Foxtrot 2021-06 Delta 2021-02 Charlie 2021-01 Alpha 2020-03 Golf Other India",
    "description": "Expressions over dates. Nine children, Alpha through India.\nThe four date fields are set decades apart on purpose - date in 2020-2023, lastmod in 2024-2027, publishDate in 2018-2021, expiryDate in 2090-2093 - so no two fields can produce the same set of groups. India has none of them.\nWithin the five pages that share a date year, lastmod ranks them in the exact reverse of their date order. Ordering inside a group is therefore the one place where naming the wrong field cannot pass for the right one.",
    "tags": [],
    "title": "Dates",
    "uri": "/dates/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "The tree a listing is taken from, and what a display makes of it. Three children - One, a leaf; Two, a branch with two pages under it; and Three, a branch with one - so a second level exists to be shown or withheld. A fourth, Four, is a hidden branch with one page under it, and absent from every listing that does not ask for hidden pages.\nlevels and flatten - the tree levels=1 The default: the children only.\nOne Two Three levels=2 The children and their children, as a tree. Four is hidden, so Four A is missing as well, although it is not hidden itself.\nOne Two Two A Two B Three Three A levels=2, hidden=true Four and Four A join the tree.\nOne Two Two A Two B Three Three A Four Four A levels=2, flatten=true The same pages as one list, in tree order: each branch directly followed by the pages below it.\nOne Two Two A Two B Three Three A levels=2, flatten=true, orderby=linktitle Flattened pages are ordered together, not level by level: One, Three, Three A, Two, Two A, Two B.\nOne Three Three A Two Two A Two B levels=2, limit=2 limit counts the first level only: One and Two, and Two keeps both of its pages.\nOne Two Two A Two B levels=2, flatten=true, limit=2 Flattened, every page counts: One and Two, without the pages below Two.\nOne Two kind - which kind of page is kept kind=leaf In a tree a page not kept takes the pages below it along, so of the children only One remains.\nOne kind=leaf, flatten=true Flattened, every page is kept or dropped on its own: One, Two A, Two B and Three A.\nOne Two A Two B Three A kind=branch Two and Three, without the leaves below them.\nTwo Three display - how the pages are rendered Each at levels=2, so the second level has to be shown the display’s way.\ntree Nested, levels shown by indentation.\nOne Two Two A Two B Three Three A headings One list of headings, levels shown by heading size.\nOne Two Two A Two B Three Three A sections A heading per page of the first level, a tree of the pages below it.\nOne Two Two A Two B Three Three A sections at levels=1 Headings only, as there is nothing below them to list.\nOne Two Three list One list, levels not shown.\nOne Two Two A Two B Three Three A cards A card per page, levels not shown.\nOne Two Two A Two B Three Three A cards, grouped The group heading has to be HTML here, as a markdown heading would show as text inside the cards’ HTML.\nguide One Three reference Two An unknown display Falls back to tree and says so on the console, rather than aborting the build.\nOne Two Three columns columns reaches the markup as a class on the list, so what a listing here asserts is the class rather than the rendering.\nDefault One column, and no columnize class at all.\nOne Two Three columns=1 One column named explicitly. Has to match the default.\nOne Two Three columns=3 One Two Three columns=5 The documented maximum.\nOne Two Three columns=9 Above the maximum, so clamped to 5.\nOne Two Three columns=0 Below the minimum, so clamped to 1.\nOne Two Three cards default Cards default to three columns.\nOne Two Three cards, columns=2 One Two Three headinglevel Default, grouped The group headings arrive at level 2.\nguide One Three reference Two headinglevel=4, grouped guide One Three reference Two headings, ungrouped The page headings start at the given level.\nOne Two Two A Two B Three Three A headings, grouped The page headings start one level below the group heading.\nguide One Three Three A reference Two Two A Two B headinglevel=9 Above the maximum, so clamped to 6.\nguide One Three reference Two description and breadcrumb description=true One\nA leaf directly under the section.\nTwo\nA branch with two children of its own.\nTwo A\nSecond level, first page.\nTwo B\nSecond level, second page.\nThree\nA branch with one child.\nThree A\nThe only page below Three.\nbreadcrumb=true One\nPages \u003e Layout\nTwo\nPages \u003e Layout\nTwo A\nPages \u003e Layout \u003e Two\nTwo B\nPages \u003e Layout \u003e Two\nThree\nPages \u003e Layout\nThree A\nPages \u003e Layout \u003e Three\nBoth, as a list One\nPages \u003e Layout\nA leaf directly under the section.\nTwo\nPages \u003e Layout\nA branch with two children of its own.\nTwo A\nPages \u003e Layout \u003e Two\nSecond level, first page.\nTwo B\nPages \u003e Layout \u003e Two\nSecond level, second page.\nThree\nPages \u003e Layout\nA branch with one child.\nThree A\nPages \u003e Layout \u003e Three\nThe only page below Three.\nBoth, as headings One Pages \u003e Layout\nA leaf directly under the section.\nTwo Pages \u003e Layout\nA branch with two children of its own.\nTwo A Pages \u003e Layout \u003e Two\nSecond level, first page.\nTwo B Pages \u003e Layout \u003e Two\nSecond level, second page.\nThree Pages \u003e Layout\nA branch with one child.\nThree A Pages \u003e Layout \u003e Three\nThe only page below Three.\nimage=false on cards One A leaf directly under the section. Two A branch with two children of its own. Three A branch with one child. axis and pageref - where the pages come from pageref A relative reference: the children of Two.\nTwo A Two B pageref, absolute The same page by its absolute path.\nTwo A Two B axis=siblings The other children of Two’s parent: One and Three.\nOne Three axis=ancestors Up from Two A: Two, then this section.\nTwo Layout axis=ancestors, levels=1 Just the parent.\nTwo params and cardtemplate The debug card template dumps what it receives, so this is where params arriving next to the theme’s own keys is visible.\nTwo A All Parameter\n{ \"action\": \"\", \"color\": \"\", \"content\": \"\", \"href\": \"/layout/two/two-a/index.html\", \"hrefattributes\": { \"class\": \"\", \"download\": false, \"href\": \"/layout/two/two-a/index.html\", \"target\": false }, \"icon\": \"\", \"image\": \"\", \"imagealt\": \"\", \"imageattributes\": {}, \"onclick\": \"\", \"page\": \"/layout/two\", \"params\": { \"depth\": 1, \"description\": false, \"flavor\": \"custom\", \"level\": 1, \"page\": \"/layout/two/two-a\", \"showhidden\": false }, \"style\": \"filled\", \"template\": \"debug\", \"title\": \"Two A\" } Two B All Parameter\n{ \"action\": \"\", \"color\": \"\", \"content\": \"\", \"href\": \"/layout/two/two-b/index.html\", \"hrefattributes\": { \"class\": \"\", \"download\": false, \"href\": \"/layout/two/two-b/index.html\", \"target\": false }, \"icon\": \"\", \"image\": \"\", \"imagealt\": \"\", \"imageattributes\": {}, \"onclick\": \"\", \"page\": \"/layout/two\", \"params\": { \"depth\": 1, \"description\": false, \"flavor\": \"custom\", \"level\": 1, \"page\": \"/layout/two/two-b\", \"showhidden\": false }, \"style\": \"filled\", \"template\": \"debug\", \"title\": \"Two B\" }",
    "description": "The tree a listing is taken from, and what a display makes of it. Three children - One, a leaf; Two, a branch with two pages under it; and Three, a branch with one - so a second level exists to be shown or withheld. A fourth, Four, is a hidden branch with one page under it, and absent from every listing that does not ask for hidden pages.\nlevels and flatten - the tree levels=1 The default: the children only.",
    "tags": [],
    "title": "Layout",
    "uri": "/layout/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "Parameters set in front matter rather than on the call. Three children - Round, Square and Nested, a branch with two pages - each carrying a shape.\nThis page’s own params.pages asks for a list, grouped by shape, heaviest first. It also cascades columns = 2 down to the pages below it, which only Nested lists anything with.\nFrom front matter No parameter on the call: everything comes from front matter.\nround Round square Nested Square A call wins over front matter display from the call, everything else still from front matter.\nround Round square Nested Square An empty value on a call is not set orderby=\"\" leaves the front matter’s weight desc in place: an empty value counts as not given.\nround Round square Nested Square Whitespace resets a value groupby=\" \" resets the front matter’s grouping to no value, so the listing is ungrouped.\nNested Square Round",
    "description": "Parameters set in front matter rather than on the call. Three children - Round, Square and Nested, a branch with two pages - each carrying a shape.\nThis page’s own params.pages asks for a list, grouped by shape, heaviest first. It also cascades columns = 2 down to the pages below it, which only Nested lists anything with.\nFrom front matter No parameter on the call: everything comes from front matter.",
    "tags": [],
    "title": "Front Matter",
    "uri": "/frontmatter/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "Taxonomy and term pages, listed from here by pageref. The pages of the text section carry the tags harbor, sea and drift-ice:\nharbor has a content file titled Harbour and linked as Port, drift-ice has a content file without a title, sea has no content file at all. The taxonomy and term pages themselves render their listings through the same shortcode, with the defaults below, and are part of this site’s output too.\nA taxonomy page Defaults The defaults of the page listed from, not of this page: the terms, grouped by the letter of the title shown, in three columns. Harbor is listed as Port under P, with its page count.\nD Drift Ice (2) P Port (4) S Sea (4) groupby=\" \" The grouping reset: one list, ordered by the title shown.\nDrift Ice (2) Port (4) Sea (4) title | left 1 | upper A term’s title is its heading, Tag :: …, so every term falls under T. The letter index is keyed by linktitle for that reason.\nT Drift Ice (2) Port (4) Sea (4) A term page Defaults The term’s pages, grouped by letter, with breadcrumbs. Lantern is hidden but listed, as disableTagHiddenPages is not set.\nA Anchor\nPages \u003e Text\nAnchorage\nPages \u003e Text\nC Compass\nPages \u003e Text\nL Lantern\nPages \u003e Text\norderby=weight, groupby=\" \" Lantern\nPages \u003e Text\nAnchor\nPages \u003e Text\nAnchorage\nPages \u003e Text\nCompass\nPages \u003e Text\nA term without a content file B Beacon\nPages \u003e Text\nC Compass\nPages \u003e Text\nE Ember\nPages \u003e Text\nÖ Ösen\nPages \u003e Text",
    "description": "Taxonomy and term pages, listed from here by pageref. The pages of the text section carry the tags harbor, sea and drift-ice:\nharbor has a content file titled Harbour and linked as Port, drift-ice has a content file without a title, sea has no content file at all. The taxonomy and term pages themselves render their listings through the same shortcode, with the defaults below, and are part of this site’s output too.",
    "tags": [],
    "title": "Terms",
    "uri": "/terms/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "The deprecated children shortcode, now a translation into pages. Three children - Aft, Bow, a branch with one page, and Keel, hidden - weighted in the reverse of their titles, so an order by title and one by weight disagree.\nEvery call here warns on the console and names the pages call it was translated into. The site’s warnings.txt lists each of those messages in full, so the warning is the assertion: a translation that changed would fail the suite until the baseline is brought along with it.\nThis page also sets ordersectionsby = 'name', the Learn theme’s spelling of title, which still orders by title but warns once as deprecated.\nOrdered by ordersectionsby A pages listing of its own: auto follows ordersectionsby, so Aft comes before Bow.\nAft Bow type Default Aft Bow type=list Aft Bow Inner type=flat Aft Bow Inner type=card Aft Bow type=group Grouped by the letter of the title shown. depth is not translated for type=group, as it was never honored there.\nA Aft B Bow sort sort=name The Learn theme’s spelling of title, translated into linktitle.\nAft Bow sort=modifieddate Aft Bow Other parameters showhidden=true Aft Bow Keel headingdepth=4 Aft Bow description and breadcrumb Aft\nPages \u003e Legacy\nFirst by title, last by weight.\nBow\nPages \u003e Legacy\nA branch, so depth has a second level to reach.\nstyle=h2 The deprecated predecessor of type=list, which warns about itself before the translation warns about the shortcode.\nAft Bow",
    "description": "The deprecated children shortcode, now a translation into pages. Three children - Aft, Bow, a branch with one page, and Keel, hidden - weighted in the reverse of their titles, so an order by title and one by weight disagree.\nEvery call here warns on the console and names the pages call it was translated into. The site’s warnings.txt lists each of those messages in full, so the warning is the assertion: a translation that changed would fail the suite until the baseline is brought along with it.",
    "tags": [],
    "title": "Legacy",
    "uri": "/legacy/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "Every expression and parameter the shortcode refuses. A refused parameter is reported on the console and left out, so each listing here renders as if it had not been given - never an aborted build. The warnings are the assertion rather than noise: they are listed in the site’s warnings.txt, and a message that changes wording fails the suite until the baseline is brought along with it.\nThree children, First, Second and Third. This is what a valid listing over them looks like, grouped by flavor:\nguide First Third reference Second Expressions An unknown field First Second Third name The Learn theme’s spelling of title is no field of an expression.\nFirst Second Third params without a key First Second Third A field with an argument First Second Third An empty stage First Second Third An unknown function First Second Third A function without argument given one First Second Third left without a number First Second Third left 0 A width has to be positive.\nFirst Second Third format without a layout First Second Third An invalid grouplabel The grouping stands, the groups are labelled by their key.\nguide First Third reference Second A quote not closed An argument opened with a quote that never closes can’t be told apart from the stages after it, so the whole expression is refused.\nFirst Second Third One invalid orderby item The valid item still orders, the invalid one is left out.\nThird Second First where without an operator First Second Third where with an unknown field First Second Third Parameters An unknown axis The one refusal that leaves nothing to render: without an axis there is no source of pages.\nlevels that is no number First Second Third columns that is no number First Second Third params that is no map First Second Third",
    "description": "Every expression and parameter the shortcode refuses. A refused parameter is reported on the console and left out, so each listing here renders as if it had not been given - never an aborted build. The warnings are the assertion rather than noise: they are listed in the site’s warnings.txt, and a message that changes wording fails the suite until the baseline is brought along with it.\nThree children, First, Second and Third. This is what a valid listing over them looks like, grouped by flavor:",
    "tags": [],
    "title": "Invalid",
    "uri": "/invalid/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "What an expression makes of a value that is not plain text: a missing weight, zero, padding, a list, a map, and one key holding numbers and text alike. Five children, Copper, Iron, Lead, Tin and Zinc.\nTin weighs 10, Copper 20 and Iron 30; Lead and Zinc are unweighted. Their rank is the number -1 for Tin, 1 for Lead and 2 for Copper, but the text x for Iron and the text 10 for Zinc.\nEvery grouped listing here sets headinglevel=\"4\".\nweight - a weight of 0 has no value orderby=weight Lead and Zinc are unweighted and come last, in Hugo’s order.\nTin Copper Iron Lead Zinc orderby=weight desc And stay last when the direction is reversed.\nIron Copper Tin Lead Zinc where=“weight \u003c= 20” Tin and Copper. The unweighted pages are not kept, as a missing value only matches !=.\nTin Copper where=“weight \u003e= 9” Numbers compare as numbers, so every weighted page is kept - as text, 10, 20 and 30 would all sort before 9.\nTin Copper Iron where=“weight \u003c abc” A literal that is no number makes the weights compare as text, which all sort before abc.\nTin Copper Iron coalesce and default Copper’s count is 3, Iron’s is 0, and the others have none.\ncoalesce Only a missing value is replaced: Iron keeps its group 0. The none group is text and so follows the numbers.\n0 Iron 3 Copper none Tin Lead Zinc default A zero is replaced as well: Iron joins the none group.\n3 Copper none Tin Iron Lead Zinc trim Copper’s note is padded with spaces around it, Zinc’s is padded without.\nUntrimmed Two groups, although their headings read the same.\npadded Copper padded Zinc plain Lead Other Tin Iron trim One group.\npadded Copper Zinc plain Lead Other Tin Iron path and section groupby=section Every page here is in the values section.\nvalues Tin Copper Iron Lead Zinc orderby=“path desc” The paths end in the file names, so this is the reverse of the alphabet.\nZinc Tin Lead Iron Copper Lists and maps have no value Copper’s and Iron’s crew is a list, Copper’s author a map.\ngroupby=params.crew A list is no single value to group by: every page is in Other.\nOther Tin Copper Iron Lead Zinc where on a list A list is replaced by coalesce like any missing value, so every page is kept.\nTin Copper Iron Lead Zinc groupby=params.author A map has no value either.\nOther Tin Copper Iron Lead Zinc groupby=params.author.name A value inside the map has one.\nAnn Copper Other Tin Iron Lead Zinc Numbers and text in one key Numbers and text have no common order: Hugo compares text with a number as if it were one, or else as 0, which puts x below 1 and 10 above 2, yet 10 below x. So the numbers are ordered as numbers, then the texts as text, the numbers first in either direction. Zinc’s 10 is text and orders as such.\norderby=params.rank Tin, Lead and Copper by number, then Zinc and Iron by text.\nTin Lead Copper Zinc Iron orderby=params.rank desc Copper, Lead and Tin, then Iron and Zinc: both parts reversed, the numbers still first.\nCopper Lead Tin Iron Zinc groupby=params.rank The groups follow the ascending order above.\n-1 Tin 1 Lead 2 Copper 10 Zinc x Iron",
    "description": "What an expression makes of a value that is not plain text: a missing weight, zero, padding, a list, a map, and one key holding numbers and text alike. Five children, Copper, Iron, Lead, Tin and Zinc.\nTin weighs 10, Copper 20 and Iron 30; Lead and Zinc are unweighted. Their rank is the number -1 for Tin, 1 for Lead and 2 for Copper, but the text x for Iron and the text 10 for Zinc.",
    "tags": [],
    "title": "Values",
    "uri": "/values/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Invalid",
    "content": "One of three children that exist so that a listing whose parameter was refused shows what it falls back to: the listing without that parameter.",
    "description": "One of three children that exist so that a listing whose parameter was refused shows what it falls back to: the listing without that parameter.",
    "tags": [],
    "title": "First",
    "uri": "/invalid/first/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "A Wednesday in January 2021. Shares its month name with Bravo a year later.",
    "description": "A Wednesday in January 2021. Shares its month name with Bravo a year later.",
    "tags": [],
    "title": "Alpha",
    "uri": "/dates/alpha/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "tier is basic here and Basic on Anchor, Anchorage and Ember. Whether those are one group or two is the question the tier listings ask.",
    "description": "Carries the lower-case twin of the tier Anchor carries.",
    "tags": [
      "Sea"
    ],
    "title": "Beacon",
    "uri": "/text/beacon/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout \u003e Four",
    "content": "Not hidden itself, so it is only missing from a listing because its parent is.",
    "description": "The only page below Four.",
    "tags": [],
    "title": "Four A",
    "uri": "/layout/four/four-a/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Legacy \u003e Bow",
    "content": "The only page below Bow.",
    "description": "The only page below Bow.",
    "tags": [],
    "title": "Inner",
    "uri": "/legacy/bow/inner/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Front Matter \u003e Nested",
    "content": "A page below Nested, so its listing has something to show.",
    "description": "A page below Nested, so its listing has something to show.",
    "tags": [],
    "title": "Inner A",
    "uri": "/frontmatter/nested/inner-a/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Legacy",
    "content": "Hidden, and the lightest, so it only appears where showhidden asks for it.",
    "description": "Hidden, and the lightest, so it only appears where showhidden asks for it.",
    "tags": [],
    "title": "Keel",
    "uri": "/legacy/keel/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout",
    "content": "A page with no children, so a nested listing has something flat to put beside the nested entries.",
    "description": "A leaf directly under the section.",
    "tags": [],
    "title": "One",
    "uri": "/layout/one/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Front Matter",
    "content": "The lightest page, so a weight desc order puts it last.",
    "description": "The lightest page, so a weight desc order puts it last.",
    "tags": [],
    "title": "Round",
    "uri": "/frontmatter/round/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout \u003e Three",
    "content": "An only child, so a second level holding exactly one entry is covered too.",
    "description": "The only page below Three.",
    "tags": [],
    "title": "Three A",
    "uri": "/layout/three/three-a/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Values",
    "content": "Weighs 10, the lightest. Its rank is the number -1.",
    "description": "Weighs 10, the lightest. Its rank is the number -1.",
    "tags": [],
    "title": "Tin",
    "uri": "/values/tin/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout \u003e Two",
    "content": "A second-level page.",
    "description": "Second level, first page.",
    "tags": [],
    "title": "Two A",
    "uri": "/layout/two/two-a/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "Hiding is orthogonal to grouping, so this page appears in a listing only when hidden=true is set - and when it does, it has to land in the guide group with Anchor and Compass rather than in one of its own. On a term page the disableTagHiddenPages option decides instead, which by default lists it.",
    "description": "Hidden from the menu unless hidden says otherwise.",
    "tags": [
      "Port"
    ],
    "title": "Lantern",
    "uri": "/text/lantern/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Invalid",
    "content": "A second flavor and a second year, so a refused groupby or orderby is visible as the grouping or order that did not happen.",
    "description": "A second flavor and a second year, so a refused groupby or orderby is visible as the grouping or order that did not happen.",
    "tags": [],
    "title": "Second",
    "uri": "/invalid/second/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "The same day of the same month as Alpha, one year on: a year layout separates the two, a month-name layout merges them.",
    "description": "The same day of the same month as Alpha, one year on: a year layout separates the two, a month-name layout merges them.",
    "tags": [],
    "title": "Bravo",
    "uri": "/dates/bravo/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Legacy",
    "content": "A branch, so depth has a second level to reach.",
    "description": "A branch, so depth has a second level to reach.",
    "tags": [],
    "title": "Bow",
    "uri": "/legacy/bow/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Values",
    "content": "Weighs 20. Its crew is a list and its author a map, its note is padded with spaces, and its rank is the number 2.",
    "description": "Weighs 20. Its crew is a list and its author a map, its note is padded with spaces, and its rank is the number 2.",
    "tags": [],
    "title": "Copper",
    "uri": "/values/copper/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Front Matter \u003e Nested",
    "content": "A sibling of Inner A.",
    "description": "A sibling of Inner A.",
    "tags": [],
    "title": "Inner B",
    "uri": "/frontmatter/nested/inner-b/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "The only page whose linkTitle differs from its title, and it differs in the first letter. The title and linktitle fields are documented as two different things, so this is the page that shows whether they really are: it falls under D where the title was read and under S where the link title was - and every listing labels it Signal, whichever of the two ordered or grouped it.",
    "description": "Titled D, linked as S.",
    "tags": [
      "Drift Ice"
    ],
    "title": "Drift",
    "uri": "/text/drift/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Front Matter",
    "content": "Shares its shape with Nested, so a group holds more than one page.",
    "description": "Shares its shape with Nested, so a group holds more than one page.",
    "tags": [],
    "title": "Square",
    "uri": "/frontmatter/square/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout",
    "content": "The deeper of the two branches. levels, flatten and the displays are only distinguishable against a section that has a second level at all.",
    "description": "A branch with two children of its own.",
    "tags": [],
    "title": "Two",
    "uri": "/layout/two/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout \u003e Two",
    "content": "A sibling at the second level, so that level is a list rather than a single entry.",
    "description": "Second level, second page.",
    "tags": [],
    "title": "Two B",
    "uri": "/layout/two/two-b/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Invalid",
    "content": "Shares a flavor with First, so a valid params.flavor listing over this section is two groups of unequal size - the shape a refused one has to lack.",
    "description": "Shares a flavor with First, so a valid params.flavor listing over this section is two groups of unequal size - the shape a refused one has to lack.",
    "tags": [],
    "title": "Third",
    "uri": "/invalid/third/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "The only Monday among the dated pages, which makes it the page a weekday layout has to put first.",
    "description": "The only Monday among the dated pages, which makes it the page a weekday layout has to put first.",
    "tags": [],
    "title": "Charlie",
    "uri": "/dates/charlie/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Legacy",
    "content": "First by title, last by weight.",
    "description": "First by title, last by weight.",
    "tags": [],
    "title": "Aft",
    "uri": "/legacy/aft/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "The plain case: title and link title agree, both parameters are set.",
    "description": "Shares its first three letters with Anchorage.",
    "tags": [
      "Port"
    ],
    "title": "Anchor",
    "uri": "/text/anchor/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Values",
    "content": "Weighs 30. Its count is zero, its crew a list of one, and its rank the text x.",
    "description": "Weighs 30. Its count is zero, its crew a list of one, and its rank the text x.",
    "tags": [],
    "title": "Iron",
    "uri": "/values/iron/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Front Matter",
    "content": "Has no params.pages of its own, but receives columns = 2 from its parent’s cascade - and nothing else, as its parent’s own params.pages is not cascaded.\nCascaded A tree in two columns.\nInner A Inner B Whitespace resets a cascaded value columns=\" \" resets the cascaded value, so the default of one column applies.\nInner A Inner B",
    "description": "Has no params.pages of its own, but receives columns = 2 from its parent’s cascade - and nothing else, as its parent’s own params.pages is not cascaded.\nCascaded A tree in two columns.\nInner A Inner B Whitespace resets a cascaded value columns=\" \" resets the cascaded value, so the default of one column applies.",
    "tags": [],
    "title": "Nested",
    "uri": "/frontmatter/nested/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout",
    "content": "A second branch, so a nested listing is not one branch and some leaves.",
    "description": "A branch with one child.",
    "tags": [],
    "title": "Three",
    "uri": "/layout/three/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "Together with Anchor this separates left 1 from left 2 and left 3: the two share A, An and Anc, and part company only at Anch.",
    "description": "Splits from Anchor only at the fourth letter.",
    "tags": [
      "Drift Ice",
      "Port"
    ],
    "title": "Anchorage",
    "uri": "/text/anchorage/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "The only Tuesday. Its released parameter shares a month with Charlie’s, so a parameter grouped by month holds two pages.",
    "description": "The only Tuesday. Its released parameter shares a month with Charlie’s, so a parameter grouped by month holds two pages.",
    "tags": [],
    "title": "Delta",
    "uri": "/dates/delta/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "The page with the parameter missing. A flavor listing has to keep it - in a last group of its own, labelled Other - rather than drop it, order it last whatever the direction, and let only != match it in a where.",
    "description": "Has no flavor at all.",
    "tags": [
      "Sea"
    ],
    "title": "Ember",
    "uri": "/text/ember/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Layout",
    "content": "Listed only where hidden pages are asked for, and the page below it only together with it.",
    "description": "A hidden branch with one child.",
    "tags": [],
    "title": "Four",
    "uri": "/layout/four/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "Shares its exact date with Foxtrot, so even a full 2006-01-02 layout has one group holding two pages. Has no released parameter, which is what a parameter listing has to account for.",
    "description": "Shares its exact date with Foxtrot, so even a full 2006-01-02 layout has one group holding two pages. Has no released parameter, which is what a parameter listing has to account for.",
    "tags": [],
    "title": "Echo",
    "uri": "/dates/echo/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "Shares flavor with Anchor and the hidden Lantern, so a flavor listing has at least one group holding more than one page.",
    "description": "A second guide, so that group is not a synonym for page.",
    "tags": [
      "Port",
      "Sea"
    ],
    "title": "Compass",
    "uri": "/text/compass/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "Echo’s twin by date and nobody’s twin by any other field: the pair is how a listing that silently drops a duplicate key gets caught.",
    "description": "Echo’s twin by date and nobody’s twin by any other field: the pair is how a listing that silently drops a duplicate key gets caught.",
    "tags": [],
    "title": "Foxtrot",
    "uri": "/dates/foxtrot/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Text",
    "content": "Ö is one rune and two bytes in UTF-8, so left 1 must yield Ö and not half of it, and right counts from the other end in runes too. The file name stays ASCII: an expression reads the title, never the file name, and a non-ASCII path would only make the output depend on the filesystem it was built on.\nIts tier is core to Compass’s and Drift’s Core, giving the tier listing a second case collision independent of the first.",
    "description": "Starts with a two-byte character.",
    "tags": [
      "Sea"
    ],
    "title": "Ösen",
    "uri": "/text/oesen/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "The earliest date and the only Sunday. Its publishDate is the latest of the set, so a listing that confuses the two fields inverts.",
    "description": "The earliest date and the only Sunday. Its publishDate is the latest of the set, so a listing that confuses the two fields inverts.",
    "tags": [],
    "title": "Golf",
    "uri": "/dates/golf/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "The latest date and the only Saturday. With Charlie’s Monday and Golf’s Sunday this makes the weekday set one whose ISO order and alphabetical order disagree.",
    "description": "The latest date and the only Saturday. With Charlie’s Monday and Golf’s Sunday this makes the weekday set one whose ISO order and alphabetical order disagree.",
    "tags": [],
    "title": "Hotel",
    "uri": "/dates/hotel/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Dates",
    "content": "The page with no date of any kind, and no released parameter either. Hugo gives an unset date field the zero time, which is the first of January in year one - a Monday. Every date listing here therefore has to say what it does with a page that has nothing to be grouped by.",
    "description": "The page with no date of any kind, and no released parameter either. Hugo gives an unset date field the zero time, which is the first of January in year one - a Monday. Every date listing here therefore has to say what it does with a page that has nothing to be grouped by.",
    "tags": [],
    "title": "India",
    "uri": "/dates/india/index.html"
  },
  {
    "breadcrumb": "",
    "content": "One section per kind of question a listing has to answer.\nText - expressions over strings: the title fields, front matter parameters, the text functions, grouping, ordering, filtering and limit. Dates - the four date fields and a date in front matter, the date functions, and the order the resulting groups fall into. Layout - the tree a listing is taken from, the displays that render it, and the listing shape: columns, headinglevel, description, breadcrumb, axis and pageref. Front matter - parameters set in params.pages and by cascade, and what a call does to them. Terms - taxonomy and term pages, and the titles they are listed by. Legacy - the deprecated children shortcode, and the pages call it names as its replacement. Invalid - every expression and parameter the shortcode refuses, and the warning it refuses it with. Values - values that are not plain text: a missing weight, zero, padding, lists and maps, and numbers and text mixed in one key. Each section’s fixtures are shaped for its own question and stay deliberately plain otherwise, so that a listing that comes out wrong is visible as wrong.",
    "description": "One section per kind of question a listing has to answer.\nText - expressions over strings: the title fields, front matter parameters, the text functions, grouping, ordering, filtering and limit. Dates - the four date fields and a date in front matter, the date functions, and the order the resulting groups fall into. Layout - the tree a listing is taken from, the displays that render it, and the listing shape: columns, headinglevel, description, breadcrumb, axis and pageref. Front matter - parameters set in params.pages and by cascade, and what a call does to them. Terms - taxonomy and term pages, and the titles they are listed by. Legacy - the deprecated children shortcode, and the pages call it names as its replacement. Invalid - every expression and parameter the shortcode refuses, and the warning it refuses it with. Values - values that are not plain text: a missing weight, zero, padding, lists and maps, and numbers and text mixed in one key. Each section’s fixtures are shaped for its own question and stay deliberately plain otherwise, so that a listing that comes out wrong is visible as wrong.",
    "tags": [],
    "title": "Pages",
    "uri": "/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "",
    "description": "",
    "tags": [],
    "title": "Categories",
    "uri": "/categories/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Values",
    "content": "Unweighted. Its rank is the number 1.",
    "description": "Unweighted. Its rank is the number 1.",
    "tags": [],
    "title": "Lead",
    "uri": "/values/lead/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Tags",
    "content": "A term with a content file of its own, titled Harbour and linked as Port. Its heading reads Tag :: Harbour; the menu, the breadcrumbs and every listing show Port, and a letter index files it under P.",
    "description": "A term with a content file of its own, titled Harbour and linked as Port. Its heading reads Tag :: Harbour; the menu, the breadcrumbs and every listing show Port, and a letter index files it under P.",
    "tags": [],
    "title": "Tag :: Harbour",
    "uri": "/tags/harbor/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Tags",
    "content": "",
    "description": "",
    "tags": [],
    "title": "Tag :: Sea",
    "uri": "/tags/sea/index.html"
  },
  {
    "breadcrumb": "Pages",
    "content": "",
    "description": "",
    "tags": [],
    "title": "Tags",
    "uri": "/tags/index.html"
  },
  {
    "breadcrumb": "Pages \u003e Values",
    "content": "Unweighted. Its note is unpadded, and its rank the text 10.",
    "description": "Unweighted. Its note is unpadded, and its rank the text 10.",
    "tags": [],
    "title": "Zinc",
    "uri": "/values/zinc/index.html"
  }
]
