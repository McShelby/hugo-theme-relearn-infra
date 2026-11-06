/*
    JavaScript autoComplete v1.0.4+
        McShelby/hugo-theme-relearn#155
            - PR #46, PR #75: introducing selectorToInsert and anchor to it
            - sticky dropdown on scrolling
        McShelby/hugo-theme-relearn#387
            - don't empty search input if no data-val is given
            - don't delete search term but close suggestions when suggestions are open
            - delete search term when suggestions are closed
        McShelby/hugo-theme-relearn#452
            - register focus event ignoring minChars because that doesn't make sense
        McShelby/hugo-theme-relearn#452
            - on ESC, close overlay without deleting search term if overlay is open
            - on ESC, delete search term if overlay is closed
            - on UP, preventDefault to keep cursor in position
        McShelby/hugo-theme-relearn#1258
            - tell assistive technology about the combobox, its list, its options and their state
        McShelby/hugo-theme-relearn#1304
            - name the list by the aria-label of the input, if it has one
            - number the lists, so their ids don't depend on the id of the input
            - insert the list into the closest ancestor of the input matching selectorToInsert
        McShelby/hugo-theme-relearn#1355
            - limit the height of the list to the visible part of the window below it
        McShelby/hugo-theme-relearn#490
            - keep the suggestions under the term they were asked for, and show them only while it is still in the box
            - ask for a term even if one of its beginnings had no suggestions
            - keep the suggestions of a term named like a member of an object, like "constructor"
            - ask for suggestions on input as well, for text coming without a key let go of

    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/JavaScript-autoComplete
    License: http://www.opensource.org/licenses/mit-license.php
*/

var autoComplete = (function(){
    // "use strict";
    var instances = 0;
    function autoComplete(options){
        if (!document.querySelector) return;

        // helpers
        function hasClass(el, className){ return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className); }

        function addEvent(el, type, handler){
            if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
        }
        function removeEvent(el, type, handler){
            if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
        }
        function live(elClass, event, cb, context){
            addEvent(context || document, event, function(e){
                var found, el = e.target || e.srcElement;
                while (el && !(found = hasClass(el, elClass))) el = el.parentElement;
                if (found) cb.call(el, e);
            });
        }

        var o = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            cache: 1,
            menuClass: '',
            selectorToInsert: 0,
            renderItem: function (item, search){
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
            },
            onSelect: function(e, term, item){}
        };
        for (var k in options) { if (options.hasOwnProperty(k)) o[k] = options[k]; }

        // init
        var elems = typeof o.selector == 'object' ? [o.selector] : document.querySelectorAll(o.selector);
        for (var i=0; i<elems.length; i++) {
            var that = elems[i];

            // create suggestions container "sc"
            that.sc = document.createElement('div');
            that.sc.className = 'autocomplete-suggestions '+o.menuClass;

            that.autocompleteAttr = that.getAttribute('autocomplete');
            that.setAttribute('autocomplete', 'off');
            // without a prototype, as a term may be named like one of its members
            that.cache = Object.create(null);
            that.last_val = '';

            // the input and its suggestions are a combobox and its list
            that.sc.id = 'autocomplete-' + (++instances) + '-suggestions';
            that.sc.setAttribute('role', 'listbox');
            var label = that.getAttribute('aria-label') || (that.labels && that.labels.length ? that.labels[0].textContent.replace(/^\s+|\s+$/g, '') : '');
            if (label) that.sc.setAttribute('aria-label', label);
            that.setAttribute('role', 'combobox');
            that.setAttribute('aria-autocomplete', 'list');
            that.setAttribute('aria-controls', that.sc.id);
            that.setAttribute('aria-expanded', 'false');
            var hide = function(){
                that.sc.style.display = 'none';
                that.setAttribute('aria-expanded', 'false');
                that.removeAttribute('aria-activedescendant');
            };
            var select = function(el){
                el.className += ' selected';
                el.setAttribute('aria-selected', 'true');
                that.setAttribute('aria-activedescendant', el.id);
            };
            var deselect = function(el){
                el.className = el.className.replace('selected', '');
                el.setAttribute('aria-selected', 'false');
                if (that.getAttribute('aria-activedescendant') == el.id) that.removeAttribute('aria-activedescendant');
            };

			var parentElement;
            if (typeof o.selectorToInsert === "string") {
                var insertInto = that.closest(o.selectorToInsert) || document.querySelector(o.selectorToInsert);
                if (insertInto instanceof HTMLElement) parentElement = insertInto;
			}
			that.updateSC = function(resize, next){
                var rect = that.getBoundingClientRect();
				var parentOffsetLeft = 0;
                var parentOffsetTop = 0;
                var pageXOffset = 0;
                var pageYOffset = 0;
                if (parentElement != false) {
                    parentOffsetLeft = parentElement.getBoundingClientRect().left;
                    parentOffsetTop = parentElement.getBoundingClientRect().top;
                } else {
                    pageXOffset = window.pageXOffset || document.documentElement.scrollLeft;
                    pageYOffset = window.pageYOffset || document.documentElement.scrollTop;
                }
                // Is this really the job of the tool or should it be deferred to the user?
                // that.sc.style.left = Math.round(rect.left + pageXOffset + o.offsetLeft - parentOffsetLeft) + 'px';
                // that.sc.style.top = Math.round(rect.bottom + pageYOffset + o.offsetTop - parentOffsetTop) + 'px';
                // that.sc.style.width = Math.round(rect.right - rect.left) + 'px'; // outerWidth
                if (!resize) {
                    that.sc.style.display = 'block';
                    that.setAttribute('aria-expanded', 'true');
                    fit();
                    that.sc.maxHeight = parseInt((window.getComputedStyle ? getComputedStyle(that.sc, null) : that.sc.currentStyle).maxHeight);
                    if (!that.sc.suggestionHeight) that.sc.suggestionHeight = that.sc.querySelector('.autocomplete-suggestion').offsetHeight;
                    if (that.sc.suggestionHeight)
                        if (!next) that.sc.scrollTop = 0;
                        else {
                            var scrTop = that.sc.scrollTop, selTop = next.getBoundingClientRect().top - that.sc.getBoundingClientRect().top;
                            if (selTop + that.sc.suggestionHeight - that.sc.maxHeight > 0)
                                that.sc.scrollTop = selTop + that.sc.suggestionHeight + scrTop - that.sc.maxHeight;
                            else if (selTop < 0)
                                that.sc.scrollTop = selTop + scrTop;
                        }
                }
                else if (that.sc.style.display == 'block') fit();
            }
            // the window may be partly covered, eg. by a virtual keyboard, so
            // only the visible part of it below the list is free for the list
            var fit = function(){
                var viewport = window.visualViewport;
                that.sc.style.setProperty('--autocomplete-visible-height', Math.floor(viewport.offsetTop + viewport.height - that.sc.getBoundingClientRect().top) + 'px');
            };
            addEvent(window, 'resize', that.updateSC);
            addEvent(window.visualViewport, 'resize', that.updateSC);
            addEvent(window.visualViewport, 'scroll', that.updateSC);

            if (parentElement) {
                parentElement.appendChild(that.sc);
            } else {
                document.body.appendChild(that.sc);
            }

            live('autocomplete-suggestion', 'mouseleave', function(e){
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) setTimeout(function(){ deselect(sel); }, 20);
            }, that.sc);

            live('autocomplete-suggestion', 'mouseover', function(e){
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) deselect(sel);
                select(this);
            }, that.sc);

            live('autocomplete-suggestion', 'mousedown', function(e){
                if (hasClass(this, 'autocomplete-suggestion')) { // else outside click
                    var v = this.getAttribute('data-val');
                    that.value = v;
                    o.onSelect(e, v, this);
                    hide();
                }
            }, that.sc);

            that.blurHandler = function(){
                try { var over_sb = document.querySelector('.autocomplete-suggestions:hover'); } catch(e){ var over_sb = 0; }
                if (!over_sb) {
                    that.last_val = that.value;
                    hide();
                    setTimeout(function(){ hide(); }, 350); // hide suggestions on fast input
                } else if (that !== document.activeElement) setTimeout(function(){ that.focus(); }, 20);
            };
            addEvent(that, 'blur', that.blurHandler);

            var suggest = function(data, val){
                // an answer belongs to the term it was asked for, which may no longer be in the box
                if (val === undefined) val = that.value;
                that.cache[val] = data;
                if (val != that.value) return;
                if (data.length && val.length >= o.minChars) {
                    var s = '';
                    for (var i=0;i<data.length;i++) s += o.renderItem(data[i], val);
                    that.sc.innerHTML = s;
                    var items = that.sc.querySelectorAll('.autocomplete-suggestion');
                    for (var j=0;j<items.length;j++) {
                        items[j].id = that.sc.id + '-' + j;
                        items[j].setAttribute('role', 'option');
                        items[j].setAttribute('aria-selected', 'false');
                    }
                    that.removeAttribute('aria-activedescendant');
                    that.updateSC(0);
                }
                else
                    hide();
            }

            that.keydownHandler = function(e){
                var key = window.event ? e.keyCode : e.which;
                // down (40), up (38)
                if ((key == 40 || key == 38) && that.sc.innerHTML) {
                    e.preventDefault();
                    var next, sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (!sel) {
                        next = (key == 40) ? that.sc.querySelector('.autocomplete-suggestion') : that.sc.childNodes[that.sc.childNodes.length - 1]; // first : last
                        select(next);
                        if (next.getAttribute('data-val')) that.value = next.getAttribute('data-val');
                    } else {
                        next = (key == 40) ? sel.nextSibling : sel.previousSibling;
                        if (next) {
                            deselect(sel);
                            select(next);
                            if (next.getAttribute('data-val')) that.value = next.getAttribute('data-val');
                        }
                        else {
                            deselect(sel);
                            that.value = that.last_val;
                            next = 0;
                        }
                    }
                    that.updateSC(0, next);
                    return false;
                }
                // esc
                else if (key == 27) {
                    if (that.sc.style.display != 'none') {
                        // just close the overlay if it's open, and prevent other listeners
                        // from recognizing it; this is not for you!
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        hide();
                        var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                        if (sel) {
                            that.focus();
                        }
                    }
                    else {
                        // if no overlay is open, we want to remove the search term and also
                        // want other listeners to recognize it
                        that.value = '';
                    }
                }
                // enter
                else if (key == 13 || key == 9) {
                    var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (sel && that.sc.style.display != 'none') { o.onSelect(e, sel.getAttribute('data-val'), sel); setTimeout(function(){ hide(); }, 20); }
                }
            };
            addEvent(that, 'keydown', that.keydownHandler);

            that.keyupHandler = function(e){
                var key = window.event ? e.keyCode : e.which;
                if (!key || (key < 35 || key > 40) && key != 13 && key != 27) {
                    var val = that.value;
                    if (val.length >= o.minChars) {
                        if (val != that.last_val) {
                            that.last_val = val;
                            clearTimeout(that.timer);
                            // a longer term may find what one of its beginnings didn't, by a similar spelling
                            if (o.cache && val in that.cache) { suggest(that.cache[val]); return; }
                            that.timer = setTimeout(function(){ o.source(val, function(data){ suggest(data, val); }) }, o.delay);
                        }
                    } else {
                        that.last_val = val;
                        hide();
                    }
                }
            };
            addEvent(that, 'keyup', that.keyupHandler);
            // text can come without a key let go of: committed by an input method, pasted by mouse or dictated;
            // only what the reader does, not a value a script sets, like the term of the last search on page load
            that.inputHandler = function(e){ if (e.isTrusted) that.keyupHandler(e); };
            addEvent(that, 'input', that.inputHandler);

            that.focusHandler = function(e){
                that.last_val = '\n';
                that.keyupHandler(e)
            };
            addEvent(that, 'focus', that.focusHandler);
        }

        // public destroy method
        this.destroy = function(){
            for (var i=0; i<elems.length; i++) {
                var that = elems[i];
                removeEvent(window, 'resize', that.updateSC);
                removeEvent(window.visualViewport, 'resize', that.updateSC);
                removeEvent(window.visualViewport, 'scroll', that.updateSC);
                removeEvent(that, 'blur', that.blurHandler);
                removeEvent(that, 'focus', that.focusHandler);
                removeEvent(that, 'keydown', that.keydownHandler);
                removeEvent(that, 'keyup', that.keyupHandler);
                removeEvent(that, 'input', that.inputHandler);
                if (that.autocompleteAttr)
                    that.setAttribute('autocomplete', that.autocompleteAttr);
                else
                    that.removeAttribute('autocomplete');
                try {
                    that.sc.parentNode.removeChild(that.sc);
                } catch (error) {
                    console.log('Destroying error: can\'t find target selector', error);
                    throw error;
                }
                that = null;
            }
        };
    }
    return autoComplete;
})();

(function(){
    if (typeof define === 'function' && define.amd)
        define('autoComplete', function () { return autoComplete; });
    else if (typeof module !== 'undefined' && module.exports)
        module.exports = autoComplete;
    else
        window.autoComplete = autoComplete;
})();

;
window.relearn = window.relearn || {};
window.relearn.search = window.relearn.search || {};
window.relearn.search.config = {"builtins":["stopwords","language","accentFold","stemmer"],"contentLangs":["en"],"home":"/2.0/","pipeline":["stopwords","language","stemmer"]};

;
/*

# Adapter Interface

The search adapter needs to provide the following functions that are called from search.js

## init()

Initialize the search engine and the search index; called once, not before a
search is about to happen

### Parameters

none

### Returns

none

### Remarks

Once successfully completed, needs to call

	````
    window.relearn.isSearchEngineReady = true;
    window.relearn.executeInitialSearch();
	````

## search()

Performs the search and returs found results.

### Parameters

term: string // the search term that was typed in by the user

### Returns

Must return an array of found pages, sorted with the most relevant page first.

Each array item needs the following layout:

````
{
    index: string, // optional, id of the page in the search index
    score: number, // optional, how well the page matches; higher is better, and only comparable between results of the same search
    matches: string[], // optional, array of found terms; will be used to show an excerpt of the content positioned at the term
    marks: string[], // optional, the words found in the page's title and content, as they are written there; used to mark the words on the pages, and for the excerpt where the term itself isn't found as a word
    corrected: string, // optional, the term as it was searched for, if some of its words were found nowhere and replaced by the words they were most likely meant as
    page: {
        breadcrumb: string,
        title: string,
        uri: string,
        content: string,
        tags: string[]
    }
}
````
*/

(function () {
  // searchSetup holds what a search term runs through: the tokenizer of the
  // index, all steps of the search, and those for a wildcard term
  let lunrIndex, pagesIndex, searchSetup;

  // Lunr warns about every function added to a pipeline it doesn't know by a
  // label, and not every language file registers all of its own
  function register(fn, label) {
    if (!fn.label) {
      lunr.Pipeline.registerFunction(fn, label);
    }
    return fn;
  }

  // what the file of a language sets up: its letters, its tokenizer and its
  // steps; lunr.multiLanguage of lunr-languages would only take trimmer,
  // stopword filter and stemmer by name and drop everything else, so we read
  // them from the language's own setup and combine the languages ourselves
  function languageSteps(lang) {
    var steps = { stopwords: { index: [], search: [] }, language: { index: [], search: [] }, accentFold: { index: [], search: [] }, stemmer: { index: [], search: [] } };
    if (lang == 'en') {
      // English is built into Lunr and has no file of its own
      steps.letters = '\\w';
      steps.stopwords.index.push(lunr.stopWordFilter);
      steps.stemmer.index.push(lunr.stemmer);
      return steps;
    }
    var plugin = lunr[lang];
    steps.letters = plugin.wordCharacters;
    // languages without spaces between their words, like Japanese
    steps.tokenizer = typeof plugin.tokenizer == 'function' ? plugin.tokenizer : null;
    // the plugin sets up a stand-in that only collects what it adds, as a
    // pipeline of Lunr warns about every function the language file didn't
    // register, and has no accessor for its functions
    var collector = function () {
      var fns = [];
      return {
        fns: fns,
        reset: function () {
          fns.length = 0;
        },
        add: function () {
          fns.push.apply(fns, arguments);
        },
      };
    };
    var setup = { pipeline: collector(), searchPipeline: collector() };
    plugin.call(setup);
    ['index', 'search'].forEach(function (kind) {
      var fns = kind == 'index' ? setup.pipeline.fns : setup.searchPipeline.fns;
      fns.forEach(function (fn, i) {
        // before it is added to a pipeline, which would warn
        register(fn, 'relearn-' + lang + '-' + kind + '-' + i);
        if (fn === plugin.trimmer) {
          // replaced by the trimmer shared by all content languages
        } else if (fn === plugin.stopWordFilter) {
          // filtering what is searched for finds nothing more
          kind == 'index' && steps.stopwords.index.push(fn);
        } else if (fn === plugin.stemmer) {
          // the search takes the stemmers of the index, as a stem the index
          // holds can only be found by a stemmed term
          kind == 'index' && steps.stemmer.index.push(fn);
        } else {
          steps.language[kind].push(fn);
        }
      });
    });
    // a folding the language file offers but doesn't use itself, like the
    // opt-in one of Spanish; it goes into both pipelines, as lunr-languages
    // documents it
    var fold = plugin.accentFold;
    if (typeof fold == 'function' && setup.pipeline.fns.indexOf(fold) < 0 && setup.searchPipeline.fns.indexOf(fold) < 0) {
      register(fold, 'relearn-' + lang + '-accentFold');
      steps.accentFold.index.push(fold);
      steps.accentFold.search.push(fold);
    }
    return steps;
  }

  // lunr-languages expects every language in Unicode NFC; per word, after the
  // tokenizer recorded where the word is, so positions keep pointing into the
  // text as written
  // Hugo writes an apostrophe as typed into the text as a typographic one,
  // like in the French "l’élève"; readers type the one of their keyboard
  var apostrophe = new RegExp(String.fromCharCode(0x2019), 'g');
  function nfc(token) {
    return token.update(function (s) {
      return s.normalize('NFC').replace(apostrophe, "'");
    });
  }

  // Lunr lowercases the Turkish "İ" into an "i" with a dot above, which no
  // one types and which takes a character more, shifting the positions of all
  // words after it; in Turkish its lowercase is a plain "i", which is what an
  // "I" lowercases into
  function plainI(obj) {
    if (obj == null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(plainI);
    }
    return obj.toString().replace(/İ/g, 'I');
  }

  function chain(fns, token, i, tokens) {
    return fns.reduce(function (t, fn) {
      return t && fn(t, i, tokens);
    }, token);
  }

  // the index holds every word as written and as its stem, so a term typed so
  // far still finds the word, as Lunr doesn't stem wildcard terms
  function wordAndStem(stemmers, label) {
    return register(function (token, i, tokens) {
      var stem = chain(stemmers, token.clone(), i, tokens);
      return !stem || stem.toString() == token.toString() ? token : [token, stem];
    }, label);
  }

  // all stemmers of a search in one function, so a wildcard term can skip the
  // stemming by leaving out just that one
  function stemOnly(stemmers, label) {
    return register(function (token, i, tokens) {
      return chain(stemmers, token, i, tokens);
    }, label);
  }

  // the words of a page's path within the site, without the base path of the
  // site, the folder of its language or version, and the "index.html" of a
  // page bundle
  function pathOf(page) {
    var uri = page.uri || '';
    var home = window.relearn.search.config.home || '/';
    if (uri.indexOf(home) == 0) {
      uri = uri.slice(home.length);
    }
    return uri.replace(/(^|\/)index\.html$|\.html$/, '').replace(/[/._-]+/g, ' ');
  }

  // the parts of a name written as one word, like "editURL", "Table.sortable"
  // or "search.adapter.params", each at its position, so a search for its
  // parts finds it
  var compound = /[._:/]\p{L}|\p{Ll}\p{Lu}|\p{Lu}\p{Lu}\p{Ll}/u;
  var part = /\p{Lu}+(?=\p{Lu}[\p{Ll}\p{M}])|\p{Lu}?[\p{Ll}\p{M}]+|\p{Lu}+|\p{N}+/gu;
  function subwords(obj, tokens) {
    if (obj == null || Array.isArray(obj)) {
      return [];
    }
    var text = obj.toString();
    var parts = [];
    tokens.forEach(function (t) {
      var p = t.metadata && t.metadata.position;
      if (!p) {
        return;
      }
      var word = text.slice(p[0], p[0] + p[1]);
      if (!compound.test(word)) {
        return;
      }
      var found = [];
      for (var m = part.exec(word); m; m = part.exec(word)) {
        found.push(m);
      }
      part.lastIndex = 0;
      if (found.length < 2) {
        return;
      }
      found.forEach(function (m) {
        var metadata = Object.assign({}, t.metadata, { position: [p[0] + m.index, m[0].length] });
        parts.push(new lunr.Token(m[0].toLowerCase(), metadata));
      });
    });
    return parts;
  }

  // the default tokenizer, plus the words the tokenizers of languages without
  // spaces between their words find; the same as lunr-languages merges them in
  // lunr.multi.js; some of these tokenizers, like Hindi's, return plain strings,
  // which the steps can't change, so they become tokens
  function mergedTokenizer(tokenizers) {
    return function (obj, metadata) {
      obj = plainI(obj);
      var tokens = lunr.tokenizer(obj, metadata);
      tokens = tokens.concat(subwords(obj, tokens));
      if (!tokenizers.length) {
        return tokens;
      }
      var runs = tokens.slice();
      var seen = Object.create(null);
      tokens.forEach(function (t) {
        seen[t.toString()] = true;
      });
      // the tokenizers of Japanese and Chinese count positions in the text
      // without its leading whitespace, like an ideographic space indenting a
      // paragraph; the default tokenizer and the marks count in the whole text
      var lead = Array.isArray(obj) || obj == null ? 0 : obj.toString().match(/^\s*/)[0].length;
      // where the words of the languages are, in the order they start
      var located = [];
      tokenizers.forEach(function (tokenizer) {
        tokenizer(obj, metadata).forEach(function (t) {
          t = typeof t == 'string' ? new lunr.Token(t, Object.assign({}, metadata)) : t;
          var p = t.metadata && t.metadata.position;
          if (p) {
            if (lead) {
              p = t.metadata.position = [p[0] + lead, p[1]];
            }
            located.push([p[0], p[0] + p[1]]);
          }
          if (!seen[t.toString()]) {
            seen[t.toString()] = true;
            tokens.push(t);
          }
        });
      });
      // the default tokenizer takes all text between two spaces as one word,
      // for Japanese a whole paragraph; where a language's tokenizer finds
      // other words in it, it stays in the index, but without its position it
      // gives no mark, which would cover the whole paragraph; a run the
      // language finds as one word keeps it, as that word was merged into it
      if (located.length) {
        located.sort(function (a, b) {
          return a[0] - b[0];
        });
        var next = 0;
        runs.forEach(function (t) {
          var p = t.metadata && t.metadata.position;
          if (!p) {
            return;
          }
          var start = p[0];
          var end = p[0] + p[1];
          while (next < located.length && located[next][0] < start) {
            next++;
          }
          var inside = false;
          for (var i = next; i < located.length && located[i][0] < end; i++) {
            if (located[i][0] == start && located[i][1] == end) {
              return;
            }
            inside = inside || located[i][1] <= end;
          }
          if (inside) {
            delete t.metadata.position;
          }
        });
      }
      return tokens;
    };
  }

  function setupPipelines(builder, contentLangs, steps, names, builtins) {
    var langs = contentLangs.join('-');
    // one trimmer for all content languages, as the trimmer of one language
    // would cut off the letters of another
    var trimmer = register(
      lunr.trimmerSupport.generateTrimmer(
        steps
          .map(function (s) {
            return s.letters;
          })
          .join('')
      ),
      'relearn-trimmer-' + langs
    );
    // NFC first, so the trimmer already sees the letters it knows
    var normalize = register(nfc, 'relearn-nfc');
    var index = [normalize, trimmer];
    var all = [normalize, trimmer];
    var stem = null;
    var stopwords = [];
    var add = function (pipeline, fns) {
      fns.forEach(function (fn) {
        if (pipeline.indexOf(fn) < 0) {
          pipeline.push(fn);
        }
      });
    };
    names.forEach(function (name) {
      var fns = { index: [], search: [] };
      // a built-in step takes what the languages have under its name
      if (builtins.indexOf(name) >= 0) {
        steps.forEach(function (s) {
          add(fns.index, s[name].index);
          add(fns.search, s[name].search);
        });
        if (name == 'stopwords') {
          stopwords = fns.index.slice();
        }
        if (name == 'stemmer') {
          stem = fns.index.length ? stemOnly(fns.index, 'relearn-stemmer-search-' + langs) : null;
          fns.index = stem ? [wordAndStem(fns.index, 'relearn-stemmer-index-' + langs)] : [];
          fns.search = stem ? [stem] : [];
        }
      } else {
        // a filter file; the build reports a missing one, this one a file
        // that doesn't define the filter by its name
        var filter = (window.relearn.lunrFilter ?? {})[name];
        if (!filter || typeof filter.filter != 'function') {
          console.warn('Search step "' + name + '" not found in assets/js/lunr-filter/' + name + '.js, it is left out');
          return;
        }
        var fn = register(filter.filter, 'relearn-filter-' + name);
        fns.index = filter.pipeline != 'search' ? [fn] : [];
        fns.search = filter.pipeline != 'index' ? [fn] : [];
      }
      add(index, fns.index);
      add(all, fns.search);
    });
    builder.pipeline.reset();
    builder.pipeline.add.apply(builder.pipeline, index);
    builder.searchPipeline.reset();
    builder.searchPipeline.add.apply(builder.searchPipeline, all);
    // the index keeps every word as written, which only misses the stemming;
    // so does a wildcard term, as it is a word as typed so far
    var wildcard = new lunr.Pipeline();
    wildcard.add.apply(
      wildcard,
      all.filter(function (fn) {
        return fn !== stem;
      })
    );
    // the same for the index and what is searched for, so both split words alike
    builder.tokenizer = mergedTokenizer(
      steps
        .map(function (s) {
          return s.tokenizer;
        })
        .filter(Boolean)
    );
    searchSetup = {
      tokenizer: builder.tokenizer,
      all: builder.searchPipeline,
      wildcard: wildcard,
      // the words the index leaves out, if it does
      stopwords: stopwords,
    };
  }

  function init() {
    var contentLangs = window.relearn.search.config.contentLangs;
    var pipeline = window.relearn.search.config.pipeline;
    var builtins = window.relearn.search.config.builtins;

    function initIndex(index) {
      if (!window.lunr) {
        return;
      }
      pagesIndex = index;
      // Set up Lunr by declaring the fields we use
      // Also provide their boost level for the ranking
      var steps = contentLangs.map(languageSteps);
      lunrIndex = lunr(function () {
        setupPipelines(this, contentLangs, steps, pipeline, builtins);
        // where each word is, so a result tells the words as they are written
        this.metadataWhitelist = ['position'];
        this.ref('index');
        this.field('title', {
          boost: 15,
        });
        this.field('tags', {
          boost: 10,
        });
        this.field('content', {
          boost: 5,
        });
        this.field('description', {
          boost: 5,
        });
        // the sections a page is in, by the titles of its breadcrumb and by the
        // words of its path within the site, like "releasenotes"; a search
        // naming one of them asks for the pages in them
        this.field('breadcrumb', {
          boost: 10,
        });
        this.field('address', {
          boost: 10,
          extractor: function (page) {
            return pathOf(page);
          },
        });

        // Feed Lunr with each file and let index them
        pagesIndex.forEach(function (page, idx) {
          page.index = idx;
          this.add(page);
        }, this);
      });

      window.relearn.isSearchEngineReady = true;
      window.relearn.executeInitialSearch();
    }

    if (window.relearn.index_js_url) {
      var js = document.createElement('script');
      js.src = window.relearn.index_js_url;
      if (window.relearn.index_js_integrity) {
        js.integrity = window.relearn.index_js_integrity;
      }
      js.setAttribute('async', '');
      js.addEventListener('load', function () {
        initIndex(relearn_searchindex);
      });
      js.addEventListener('error', function (e) {
        console.error('Error getting Hugo index file');
      });
      document.head.appendChild(js);
    }
  }

  // the words a step leaves of a token; a step may change it, add further ones
  // or drop it
  function words(pipeline, token) {
    return pipeline.run([token.clone()]).filter(function (t) {
      return t && t.toString();
    });
  }

  // the words of a page the index terms of a result were found at, as they are
  // written there; the steps may have changed a term into one the page doesn't
  // hold, like a stem or a word without its accents; tags are indexed as a list,
  // which Lunr records no positions for; only the index terms related to what
  // was searched for give marks, all if not told which
  function marks(page, metadata, related) {
    // without a prototype, as a word may be named like one of its members
    var found = Object.create(null);
    Object.keys(metadata).forEach(function (term) {
      if (related && !related(term)) {
        return;
      }
      ['title', 'content'].forEach(function (field) {
        var text = page[field] || '';
        ((metadata[term][field] || {}).position || []).forEach(function (p) {
          // a word added by a language's tokenizer may have no position
          if (!p) {
            return;
          }
          // a position covers everything between two separators, punctuation
          // around the word included
          var word = text.slice(p[0], p[0] + p[1]).replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '');
          if (word) {
            found[word] = true;
          }
        });
      });
    });
    return Object.keys(found);
  }

  function query(clauses) {
    return lunrIndex.query(function (q) {
      clauses.forEach(function (c) {
        q.term(c.term, Object.assign({ usePipeline: false }, c.options));
      });
    });
  }

  // how far apart two words are: letters inserted, deleted or replaced, and
  // two neighbours swapped, the most common typo, counting as one
  function distance(a, b) {
    var d = [];
    for (var i = 0; i <= a.length; i++) {
      d[i] = [i];
    }
    for (var j = 0; j <= b.length; j++) {
      d[0][j] = j;
    }
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }

  // a letter without its accents, so a word typed without them, like the
  // Turkish "sehir", still starts with the letter of "şehir"
  function base(letter) {
    return (letter || '').normalize('NFD').replace(/\p{M}/gu, '');
  }

  // on how many pages a word of the index is
  function pagesWith(term) {
    var fields = lunrIndex.invertedIndex[term] || {};
    var refs = Object.create(null);
    Object.keys(fields).forEach(function (field) {
      if (field != '_index') {
        Object.keys(fields[field]).forEach(function (ref) {
          refs[ref] = true;
        });
      }
    });
    return Object.keys(refs).length;
  }

  // the word of the index a word found nowhere was most likely meant as: one
  // typo for a word of four letters, two from eight on; starting with the same
  // letter, as a typo there is rare and more likely another word; the fewest
  // typos, and of those the word on the most pages; one word only, as the
  // reader meant one, and all words close to it bury the pages holding it
  function correction(word) {
    var allowed = word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0;
    if (!allowed) {
      return null;
    }
    var candidates = lunrIndex.tokenSet.intersect(lunr.TokenSet.fromFuzzyString(word, allowed)).toArray();
    // two neighbours swapped are one typo, which Lunr counts as two
    for (var i = 0; i + 1 < word.length; i++) {
      var swapped = word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
      if (lunrIndex.invertedIndex[swapped]) {
        candidates.push(swapped);
      }
    }
    var best = null;
    candidates.forEach(function (c) {
      if (c == word || Math.abs(c.length - word.length) > allowed) {
        return;
      }
      var d = distance(word, c);
      var swappedFirst = d == 1 && c[0] == word[1] && c[1] == word[0];
      if (d > allowed || (base(c[0]) != base(word[0]) && !swappedFirst)) {
        return;
      }
      var n = pagesWith(c);
      if (!best || d < best.d || (d == best.d && (n > best.n || (n == best.n && c < best.c)))) {
        best = { c: c, d: d, n: n };
      }
    });
    return best && best.c;
  }

  function search(term) {
    if (!window.lunr || !lunrIndex) {
      return [];
    }
    // the query is built term by term, so Lunr's query syntax has no meaning,
    // except for a hyphen that separates words
    var typed = term;
    term = term.replace(/[*:^~+-]/g, ' ');
    // Lunr skips the search pipeline for wildcard terms, so we run the steps
    // ourselves: the word as written gets all of them but the stemming, its
    // stem all of them
    var clausesOf = function (token) {
      var written = words(searchSetup.wildcard, token);
      var texts = written.map(String);
      var stems = words(searchSetup.all, token).filter(function (stem) {
        return texts.indexOf(stem.toString()) < 0;
      });
      // the word as written first, then other forms of it, then words
      // starting with it
      var found = written
        .map(function (word) {
          return { term: word, options: { boost: 100 } };
        })
        .concat(
          stems.map(function (stem) {
            return { term: stem, options: { boost: 50 } };
          }),
          written.map(function (word) {
            return { term: word, options: { boost: 10, wildcard: lunr.Query.wildcard.TRAILING } };
          })
        );
      // words ending with it, the costliest to look up, don't decide whether
      // the word is found at all
      var known = found.length && query(found).length;
      return {
        written: texts,
        // the word as written and its stems, without the words starting with it
        exact: found
          .filter(function (c) {
            return !c.options.wildcard;
          })
          .map(function (c) {
            return c.term.toString();
          }),
        known: known,
        clauses: found.concat(
          written.map(function (word) {
            return { term: word, options: { boost: 10, wildcard: lunr.Query.wildcard.LEADING } };
          })
        ),
      };
    };
    // a word found nowhere is searched for as the word it was most likely
    // meant as, and the reader is told so
    var corrected = false;
    var asSearched = [];
    // the words the index leaves out, like "the" or "how"; searched for, as a
    // word typed so far may start another one, but neither corrected nor
    // counted below
    var isStopword = function (written) {
      return !!searchSetup.stopwords.length && !chain(searchSetup.stopwords, new lunr.Token(written, {}), 0, []);
    };
    // a word of a language without spaces between its words, like Japanese,
    // is the whole run, found by its parts, not by itself
    var spaceless = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u;
    var groups = searchSetup.tokenizer(term).map(function (token) {
      var word = clausesOf(token);
      var stop = !!word.written.length && isStopword(word.written[0]);
      var meant = !word.known && !stop && word.written.length && !spaceless.test(word.written[0]) && correction(word.written[0]);
      if (meant) {
        corrected = true;
        var fixed = clausesOf(new lunr.Token(meant, {}));
        asSearched.push({ text: token.toString(), typed: word.written[0], meant: meant });
        return { clauses: fixed.clauses, exact: fixed.exact, stop: false };
      }
      return { clauses: word.clauses, exact: word.exact, stop: stop };
    });
    var clauses = groups.reduce(function (a, g) {
      return a.concat(g.clauses);
    }, []);
    if (!clauses.length) {
      return [];
    }
    // a search for several words lists every page holding any of them, so the
    // pages holding more of them rank higher; the share of the words a page
    // holds weighs in squared, so a page lacking some drops below the
    // threshold, unless it matches well otherwise, like by another form of a
    // word the stemmer doesn't take for the same; words found nowhere don't
    // count
    var held = Object.create(null);
    var counted = 0;
    // the forms of the words counted, which name a section of a page only as
    // they are, not as the start of another word, like "in" of "introduction"
    var named = Object.create(null);
    groups.forEach(function (g) {
      if (g.stop) {
        return;
      }
      g.exact.forEach(function (form) {
        named[form] = true;
      });
      var found = query(g.clauses);
      if (!found.length) {
        return;
      }
      counted++;
      found.forEach(function (r) {
        held[r.ref] = (held[r.ref] || 0) + 1;
      });
    });
    // a page's relevance from its front matter weighs in as a factor, the same
    // with every search adapter; a search naming a section the page is in, by
    // a title of its breadcrumb or a word of its path, asks for it, so a page
    // ranked lower counts in full, like "changelog" for the changelog
    var results = query(clauses)
      .map(function (result) {
        // a page found only by the words starting with a stopword holds none
        // of the words counted
        var share = counted ? (held[result.ref] || 0) / counted : 1;
        var metadata = result.matchData.metadata;
        var asked = Object.keys(metadata).some(function (term) {
          return (metadata[term].breadcrumb || metadata[term].address) && named[term];
        });
        var relevance = pagesIndex[result.ref].relevance ?? 1;
        if (asked) {
          relevance = Math.max(relevance, 1);
        }
        return Object.assign({}, result, { score: result.score * share * share * relevance, share: share });
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });
    // pages matching hardly at all compared to the best one only bury it in a
    // long list; a short one stays as it is, as the page describing a thing in
    // detail may name it only once in a long text, like a variant in the list
    // of all variants, and rank behind the short release notes naming it; but
    // only pages holding every word fill it up, not those holding some, like
    // every page of the changelog for "tome changelog"
    var least = results.length ? results[0].score * 0.2 : 0;
    results = results.filter(function (result, i) {
      return (i < 10 && result.share == 1) || result.score >= least;
    });
    // the forms searched for
    var forms = clauses.map(function (c) {
      return c.term.toString();
    });
    var related = function (term) {
      return forms.some(function (form) {
        return term.indexOf(form) >= 0;
      });
    };
    // a correction is a word of the index, which may be a stem, like the French
    // "elev"; the reader is told the word as a found page writes it, of those
    // the closest to what was typed
    var fold = function (s) {
      return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    };
    var writtenAs = function (part) {
      var closest = null;
      for (var i = 0; i < results.length; i++) {
        var found = marks(pagesIndex[results[i].ref], results[i].matchData.metadata, function (t) {
          return t.indexOf(part.meant) >= 0;
        });
        // the correction itself, if a page writes it so
        if (found.indexOf(part.meant) >= 0) {
          return part.meant;
        }
        closest =
          closest ||
          (found.length &&
            found.reduce(function (a, w) {
              return distance(fold(part.typed), fold(w)) < distance(fold(part.typed), fold(a)) ? w : a;
            }));
      }
      return closest || part.meant;
    };
    // the term as typed, with the corrected words in place; not built from all
    // tokens, which also hold the parts of names and of runs without spaces
    var meant = corrected
      ? asSearched.reduce(function (s, part) {
          var at = s.toLowerCase().indexOf(part.text);
          return at < 0 ? s : s.slice(0, at) + writtenAs(part) + s.slice(at + part.text.length);
        }, typed)
      : undefined;
    return results.map(function (result) {
      var page = pagesIndex[result.ref];
      var metadata = result.matchData.metadata;
      return {
        index: result.ref,
        score: result.score,
        matches: [meant || term, ...Object.keys(metadata)],
        marks: marks(page, metadata, related),
        corrected: meant,
        page: page,
      };
    });
  }

  window.relearn = window.relearn ?? {};
  window.relearn.search = window.relearn.search ?? {};
  window.relearn.search.adapter = { init, search };
})();

;
/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.9
 * Copyright (C) 2020 Oliver Nightingale
 * @license MIT
 */
 !function(){var e=function(t){var r=new e.Builder;return r.pipeline.add(e.trimmer,e.stopWordFilter,e.stemmer),r.searchPipeline.add(e.stemmer),t.call(r,r),r.build()};e.version="2.3.9",e.utils={},e.utils.warn=function(e){return function(t){e.console&&console.warn&&console.warn(t)}}(this),e.utils.asString=function(e){return void 0===e||null===e?"":e.toString()},e.utils.clone=function(e){if(null===e||void 0===e)return e;for(var t=Object.create(null),r=Object.keys(e),i=0;i<r.length;i++){var n=r[i],s=e[n];if(Array.isArray(s))t[n]=s.slice();else{if("string"!=typeof s&&"number"!=typeof s&&"boolean"!=typeof s)throw new TypeError("clone is not deep and does not support nested objects");t[n]=s}}return t},e.FieldRef=function(e,t,r){this.docRef=e,this.fieldName=t,this._stringValue=r},e.FieldRef.joiner="/",e.FieldRef.fromString=function(t){var r=t.indexOf(e.FieldRef.joiner);if(r===-1)throw"malformed field ref string";var i=t.slice(0,r),n=t.slice(r+1);return new e.FieldRef(n,i,t)},e.FieldRef.prototype.toString=function(){return void 0==this._stringValue&&(this._stringValue=this.fieldName+e.FieldRef.joiner+this.docRef),this._stringValue},e.Set=function(e){if(this.elements=Object.create(null),e){this.length=e.length;for(var t=0;t<this.length;t++)this.elements[e[t]]=!0}else this.length=0},e.Set.complete={intersect:function(e){return e},union:function(){return this},contains:function(){return!0}},e.Set.empty={intersect:function(){return this},union:function(e){return e},contains:function(){return!1}},e.Set.prototype.contains=function(e){return!!this.elements[e]},e.Set.prototype.intersect=function(t){var r,i,n,s=[];if(t===e.Set.complete)return this;if(t===e.Set.empty)return t;this.length<t.length?(r=this,i=t):(r=t,i=this),n=Object.keys(r.elements);for(var o=0;o<n.length;o++){var a=n[o];a in i.elements&&s.push(a)}return new e.Set(s)},e.Set.prototype.union=function(t){return t===e.Set.complete?e.Set.complete:t===e.Set.empty?this:new e.Set(Object.keys(this.elements).concat(Object.keys(t.elements)))},e.idf=function(e,t){var r=0;for(var i in e)"_index"!=i&&(r+=Object.keys(e[i]).length);var n=(t-r+.5)/(r+.5);return Math.log(1+Math.abs(n))},e.Token=function(e,t){this.str=e||"",this.metadata=t||{}},e.Token.prototype.toString=function(){return this.str},e.Token.prototype.update=function(e){return this.str=e(this.str,this.metadata),this},e.Token.prototype.clone=function(t){return t=t||function(e){return e},new e.Token(t(this.str,this.metadata),this.metadata)},e.tokenizer=function(t,r){if(null==t||void 0==t)return[];if(Array.isArray(t))return t.map(function(t){return new e.Token(e.utils.asString(t).toLowerCase(),e.utils.clone(r))});for(var i=t.toString().toLowerCase(),n=i.length,s=[],o=0,a=0;o<=n;o++){var u=i.charAt(o),l=o-a;if(u.match(e.tokenizer.separator)||o==n){if(l>0){var c=e.utils.clone(r)||{};c.position=[a,l],c.index=s.length,s.push(new e.Token(i.slice(a,o),c))}a=o+1}}return s},e.tokenizer.separator=/[\s\-]+/,e.Pipeline=function(){this._stack=[]},e.Pipeline.registeredFunctions=Object.create(null),e.Pipeline.registerFunction=function(t,r){r in this.registeredFunctions&&e.utils.warn("Overwriting existing registered function: "+r),t.label=r,e.Pipeline.registeredFunctions[t.label]=t},e.Pipeline.warnIfFunctionNotRegistered=function(t){var r=t.label&&t.label in this.registeredFunctions;r||e.utils.warn("Function is not registered with pipeline. This may cause problems when serialising the index.\n",t)},e.Pipeline.load=function(t){var r=new e.Pipeline;return t.forEach(function(t){var i=e.Pipeline.registeredFunctions[t];if(!i)throw new Error("Cannot load unregistered function: "+t);r.add(i)}),r},e.Pipeline.prototype.add=function(){var t=Array.prototype.slice.call(arguments);t.forEach(function(t){e.Pipeline.warnIfFunctionNotRegistered(t),this._stack.push(t)},this)},e.Pipeline.prototype.after=function(t,r){e.Pipeline.warnIfFunctionNotRegistered(r);var i=this._stack.indexOf(t);if(i==-1)throw new Error("Cannot find existingFn");i+=1,this._stack.splice(i,0,r)},e.Pipeline.prototype.before=function(t,r){e.Pipeline.warnIfFunctionNotRegistered(r);var i=this._stack.indexOf(t);if(i==-1)throw new Error("Cannot find existingFn");this._stack.splice(i,0,r)},e.Pipeline.prototype.remove=function(e){var t=this._stack.indexOf(e);t!=-1&&this._stack.splice(t,1)},e.Pipeline.prototype.run=function(e){for(var t=this._stack.length,r=0;r<t;r++){for(var i=this._stack[r],n=[],s=0;s<e.length;s++){var o=i(e[s],s,e);if(null!==o&&void 0!==o&&""!==o)if(Array.isArray(o))for(var a=0;a<o.length;a++)n.push(o[a]);else n.push(o)}e=n}return e},e.Pipeline.prototype.runString=function(t,r){var i=new e.Token(t,r);return this.run([i]).map(function(e){return e.toString()})},e.Pipeline.prototype.reset=function(){this._stack=[]},e.Pipeline.prototype.toJSON=function(){return this._stack.map(function(t){return e.Pipeline.warnIfFunctionNotRegistered(t),t.label})},e.Vector=function(e){this._magnitude=0,this.elements=e||[]},e.Vector.prototype.positionForIndex=function(e){if(0==this.elements.length)return 0;for(var t=0,r=this.elements.length/2,i=r-t,n=Math.floor(i/2),s=this.elements[2*n];i>1&&(s<e&&(t=n),s>e&&(r=n),s!=e);)i=r-t,n=t+Math.floor(i/2),s=this.elements[2*n];return s==e?2*n:s>e?2*n:s<e?2*(n+1):void 0},e.Vector.prototype.insert=function(e,t){this.upsert(e,t,function(){throw"duplicate index"})},e.Vector.prototype.upsert=function(e,t,r){this._magnitude=0;var i=this.positionForIndex(e);this.elements[i]==e?this.elements[i+1]=r(this.elements[i+1],t):this.elements.splice(i,0,e,t)},e.Vector.prototype.magnitude=function(){if(this._magnitude)return this._magnitude;for(var e=0,t=this.elements.length,r=1;r<t;r+=2){var i=this.elements[r];e+=i*i}return this._magnitude=Math.sqrt(e)},e.Vector.prototype.dot=function(e){for(var t=0,r=this.elements,i=e.elements,n=r.length,s=i.length,o=0,a=0,u=0,l=0;u<n&&l<s;)o=r[u],a=i[l],o<a?u+=2:o>a?l+=2:o==a&&(t+=r[u+1]*i[l+1],u+=2,l+=2);return t},e.Vector.prototype.similarity=function(e){return this.dot(e)/this.magnitude()||0},e.Vector.prototype.toArray=function(){for(var e=new Array(this.elements.length/2),t=1,r=0;t<this.elements.length;t+=2,r++)e[r]=this.elements[t];return e},e.Vector.prototype.toJSON=function(){return this.elements},e.stemmer=function(){var e={ational:"ate",tional:"tion",enci:"ence",anci:"ance",izer:"ize",bli:"ble",alli:"al",entli:"ent",eli:"e",ousli:"ous",ization:"ize",ation:"ate",ator:"ate",alism:"al",iveness:"ive",fulness:"ful",ousness:"ous",aliti:"al",iviti:"ive",biliti:"ble",logi:"log"},t={icate:"ic",ative:"",alize:"al",iciti:"ic",ical:"ic",ful:"",ness:""},r="[^aeiou]",i="[aeiouy]",n=r+"[^aeiouy]*",s=i+"[aeiou]*",o="^("+n+")?"+s+n,a="^("+n+")?"+s+n+"("+s+")?$",u="^("+n+")?"+s+n+s+n,l="^("+n+")?"+i,c=new RegExp(o),h=new RegExp(u),d=new RegExp(a),f=new RegExp(l),p=/^(.+?)(ss|i)es$/,y=/^(.+?)([^s])s$/,m=/^(.+?)eed$/,v=/^(.+?)(ed|ing)$/,g=/.$/,x=/(at|bl|iz)$/,w=new RegExp("([^aeiouylsz])\\1$"),Q=new RegExp("^"+n+i+"[^aeiouwxy]$"),k=/^(.+?[^aeiou])y$/,S=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/,E=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/,L=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,b=/^(.+?)(s|t)(ion)$/,P=/^(.+?)e$/,T=/ll$/,O=new RegExp("^"+n+i+"[^aeiouwxy]$"),I=function(r){var i,n,s,o,a,u,l;if(r.length<3)return r;if(s=r.substr(0,1),"y"==s&&(r=s.toUpperCase()+r.substr(1)),o=p,a=y,o.test(r)?r=r.replace(o,"$1$2"):a.test(r)&&(r=r.replace(a,"$1$2")),o=m,a=v,o.test(r)){var I=o.exec(r);o=c,o.test(I[1])&&(o=g,r=r.replace(o,""))}else if(a.test(r)){var I=a.exec(r);i=I[1],a=f,a.test(i)&&(r=i,a=x,u=w,l=Q,a.test(r)?r+="e":u.test(r)?(o=g,r=r.replace(o,"")):l.test(r)&&(r+="e"))}if(o=k,o.test(r)){var I=o.exec(r);i=I[1],r=i+"i"}if(o=S,o.test(r)){var I=o.exec(r);i=I[1],n=I[2],o=c,o.test(i)&&(r=i+e[n])}if(o=E,o.test(r)){var I=o.exec(r);i=I[1],n=I[2],o=c,o.test(i)&&(r=i+t[n])}if(o=L,a=b,o.test(r)){var I=o.exec(r);i=I[1],o=h,o.test(i)&&(r=i)}else if(a.test(r)){var I=a.exec(r);i=I[1]+I[2],a=h,a.test(i)&&(r=i)}if(o=P,o.test(r)){var I=o.exec(r);i=I[1],o=h,a=d,u=O,(o.test(i)||a.test(i)&&!u.test(i))&&(r=i)}return o=T,a=h,o.test(r)&&a.test(r)&&(o=g,r=r.replace(o,"")),"y"==s&&(r=s.toLowerCase()+r.substr(1)),r};return function(e){return e.update(I)}}(),e.Pipeline.registerFunction(e.stemmer,"stemmer"),e.generateStopWordFilter=function(e){var t=e.reduce(function(e,t){return e[t]=t,e},{});return function(e){if(e&&t[e.toString()]!==e.toString())return e}},e.stopWordFilter=e.generateStopWordFilter(["a","able","about","across","after","all","almost","also","am","among","an","and","any","are","as","at","be","because","been","but","by","can","cannot","could","dear","did","do","does","either","else","ever","every","for","from","get","got","had","has","have","he","her","hers","him","his","how","however","i","if","in","into","is","it","its","just","least","let","like","likely","may","me","might","most","must","my","neither","no","nor","not","of","off","often","on","only","or","other","our","own","rather","said","say","says","she","should","since","so","some","than","that","the","their","them","then","there","these","they","this","tis","to","too","twas","us","wants","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","yet","you","your"]),e.Pipeline.registerFunction(e.stopWordFilter,"stopWordFilter"),e.trimmer=function(e){return e.update(function(e){return e.replace(/^\W+/,"").replace(/\W+$/,"")})},e.Pipeline.registerFunction(e.trimmer,"trimmer"),e.TokenSet=function(){this["final"]=!1,this.edges={},this.id=e.TokenSet._nextId,e.TokenSet._nextId+=1},e.TokenSet._nextId=1,e.TokenSet.fromArray=function(t){for(var r=new e.TokenSet.Builder,i=0,n=t.length;i<n;i++)r.insert(t[i]);return r.finish(),r.root},e.TokenSet.fromClause=function(t){return"editDistance"in t?e.TokenSet.fromFuzzyString(t.term,t.editDistance):e.TokenSet.fromString(t.term)},e.TokenSet.fromFuzzyString=function(t,r){for(var i=new e.TokenSet,n=[{node:i,editsRemaining:r,str:t}];n.length;){var s=n.pop();if(s.str.length>0){var o,a=s.str.charAt(0);a in s.node.edges?o=s.node.edges[a]:(o=new e.TokenSet,s.node.edges[a]=o),1==s.str.length&&(o["final"]=!0),n.push({node:o,editsRemaining:s.editsRemaining,str:s.str.slice(1)})}if(0!=s.editsRemaining){if("*"in s.node.edges)var u=s.node.edges["*"];else{var u=new e.TokenSet;s.node.edges["*"]=u}if(0==s.str.length&&(u["final"]=!0),n.push({node:u,editsRemaining:s.editsRemaining-1,str:s.str}),s.str.length>1&&n.push({node:s.node,editsRemaining:s.editsRemaining-1,str:s.str.slice(1)}),1==s.str.length&&(s.node["final"]=!0),s.str.length>=1){if("*"in s.node.edges)var l=s.node.edges["*"];else{var l=new e.TokenSet;s.node.edges["*"]=l}1==s.str.length&&(l["final"]=!0),n.push({node:l,editsRemaining:s.editsRemaining-1,str:s.str.slice(1)})}if(s.str.length>1){var c,h=s.str.charAt(0),d=s.str.charAt(1);d in s.node.edges?c=s.node.edges[d]:(c=new e.TokenSet,s.node.edges[d]=c),1==s.str.length&&(c["final"]=!0),n.push({node:c,editsRemaining:s.editsRemaining-1,str:h+s.str.slice(2)})}}}return i},e.TokenSet.fromString=function(t){for(var r=new e.TokenSet,i=r,n=0,s=t.length;n<s;n++){var o=t[n],a=n==s-1;if("*"==o)r.edges[o]=r,r["final"]=a;else{var u=new e.TokenSet;u["final"]=a,r.edges[o]=u,r=u}}return i},e.TokenSet.prototype.toArray=function(){for(var e=[],t=[{prefix:"",node:this}];t.length;){var r=t.pop(),i=Object.keys(r.node.edges),n=i.length;r.node["final"]&&(r.prefix.charAt(0),e.push(r.prefix));for(var s=0;s<n;s++){var o=i[s];t.push({prefix:r.prefix.concat(o),node:r.node.edges[o]})}}return e},e.TokenSet.prototype.toString=function(){if(this._str)return this._str;for(var e=this["final"]?"1":"0",t=Object.keys(this.edges).sort(),r=t.length,i=0;i<r;i++){var n=t[i],s=this.edges[n];e=e+n+s.id}return e},e.TokenSet.prototype.intersect=function(t){for(var r=new e.TokenSet,i=void 0,n=[{qNode:t,output:r,node:this}];n.length;){i=n.pop();for(var s=Object.keys(i.qNode.edges),o=s.length,a=Object.keys(i.node.edges),u=a.length,l=0;l<o;l++)for(var c=s[l],h=0;h<u;h++){var d=a[h];if(d==c||"*"==c){var f=i.node.edges[d],p=i.qNode.edges[c],y=f["final"]&&p["final"],m=void 0;d in i.output.edges?(m=i.output.edges[d],m["final"]=m["final"]||y):(m=new e.TokenSet,m["final"]=y,i.output.edges[d]=m),n.push({qNode:p,output:m,node:f})}}}return r},e.TokenSet.Builder=function(){this.previousWord="",this.root=new e.TokenSet,this.uncheckedNodes=[],this.minimizedNodes={}},e.TokenSet.Builder.prototype.insert=function(t){var r,i=0;if(t<this.previousWord)throw new Error("Out of order word insertion");for(var n=0;n<t.length&&n<this.previousWord.length&&t[n]==this.previousWord[n];n++)i++;this.minimize(i),r=0==this.uncheckedNodes.length?this.root:this.uncheckedNodes[this.uncheckedNodes.length-1].child;for(var n=i;n<t.length;n++){var s=new e.TokenSet,o=t[n];r.edges[o]=s,this.uncheckedNodes.push({parent:r,"char":o,child:s}),r=s}r["final"]=!0,this.previousWord=t},e.TokenSet.Builder.prototype.finish=function(){this.minimize(0)},e.TokenSet.Builder.prototype.minimize=function(e){for(var t=this.uncheckedNodes.length-1;t>=e;t--){var r=this.uncheckedNodes[t],i=r.child.toString();i in this.minimizedNodes?r.parent.edges[r["char"]]=this.minimizedNodes[i]:(r.child._str=i,this.minimizedNodes[i]=r.child),this.uncheckedNodes.pop()}},e.Index=function(e){this.invertedIndex=e.invertedIndex,this.fieldVectors=e.fieldVectors,this.tokenSet=e.tokenSet,this.fields=e.fields,this.pipeline=e.pipeline},e.Index.prototype.search=function(t){return this.query(function(r){var i=new e.QueryParser(t,r);i.parse()})},e.Index.prototype.query=function(t){for(var r=new e.Query(this.fields),i=Object.create(null),n=Object.create(null),s=Object.create(null),o=Object.create(null),a=Object.create(null),u=0;u<this.fields.length;u++)n[this.fields[u]]=new e.Vector;t.call(r,r);for(var u=0;u<r.clauses.length;u++){var l=r.clauses[u],c=null,h=e.Set.empty;c=l.usePipeline?this.pipeline.runString(l.term,{fields:l.fields}):[l.term];for(var d=0;d<c.length;d++){var f=c[d];l.term=f;var p=e.TokenSet.fromClause(l),y=this.tokenSet.intersect(p).toArray();if(0===y.length&&l.presence===e.Query.presence.REQUIRED){for(var m=0;m<l.fields.length;m++){var v=l.fields[m];o[v]=e.Set.empty}break}for(var g=0;g<y.length;g++)for(var x=y[g],w=this.invertedIndex[x],Q=w._index,m=0;m<l.fields.length;m++){var v=l.fields[m],k=w[v],S=Object.keys(k),E=x+"/"+v,L=new e.Set(S);if(l.presence==e.Query.presence.REQUIRED&&(h=h.union(L),void 0===o[v]&&(o[v]=e.Set.complete)),l.presence!=e.Query.presence.PROHIBITED){if(n[v].upsert(Q,l.boost,function(e,t){return e+t}),!s[E]){for(var b=0;b<S.length;b++){var P,T=S[b],O=new e.FieldRef(T,v),I=k[T];void 0===(P=i[O])?i[O]=new e.MatchData(x,v,I):P.add(x,v,I)}s[E]=!0}}else void 0===a[v]&&(a[v]=e.Set.empty),a[v]=a[v].union(L)}}if(l.presence===e.Query.presence.REQUIRED)for(var m=0;m<l.fields.length;m++){var v=l.fields[m];o[v]=o[v].intersect(h)}}for(var R=e.Set.complete,F=e.Set.empty,u=0;u<this.fields.length;u++){var v=this.fields[u];o[v]&&(R=R.intersect(o[v])),a[v]&&(F=F.union(a[v]))}var C=Object.keys(i),N=[],_=Object.create(null);if(r.isNegated()){C=Object.keys(this.fieldVectors);for(var u=0;u<C.length;u++){var O=C[u],j=e.FieldRef.fromString(O);i[O]=new e.MatchData}}for(var u=0;u<C.length;u++){var j=e.FieldRef.fromString(C[u]),D=j.docRef;if(R.contains(D)&&!F.contains(D)){var A,B=this.fieldVectors[j],V=n[j.fieldName].similarity(B);if(void 0!==(A=_[D]))A.score+=V,A.matchData.combine(i[j]);else{var z={ref:D,score:V,matchData:i[j]};_[D]=z,N.push(z)}}}return N.sort(function(e,t){return t.score-e.score})},e.Index.prototype.toJSON=function(){var t=Object.keys(this.invertedIndex).sort().map(function(e){return[e,this.invertedIndex[e]]},this),r=Object.keys(this.fieldVectors).map(function(e){return[e,this.fieldVectors[e].toJSON()]},this);return{version:e.version,fields:this.fields,fieldVectors:r,invertedIndex:t,pipeline:this.pipeline.toJSON()}},e.Index.load=function(t){var r={},i={},n=t.fieldVectors,s=Object.create(null),o=t.invertedIndex,a=new e.TokenSet.Builder,u=e.Pipeline.load(t.pipeline);t.version!=e.version&&e.utils.warn("Version mismatch when loading serialised index. Current version of lunr '"+e.version+"' does not match serialized index '"+t.version+"'");for(var l=0;l<n.length;l++){var c=n[l],h=c[0],d=c[1];i[h]=new e.Vector(d)}for(var l=0;l<o.length;l++){var c=o[l],f=c[0],p=c[1];a.insert(f),s[f]=p}return a.finish(),r.fields=t.fields,r.fieldVectors=i,r.invertedIndex=s,r.tokenSet=a.root,r.pipeline=u,new e.Index(r)},e.Builder=function(){this._ref="id",this._fields=Object.create(null),this._documents=Object.create(null),this.invertedIndex=Object.create(null),this.fieldTermFrequencies={},this.fieldLengths={},this.tokenizer=e.tokenizer,this.pipeline=new e.Pipeline,this.searchPipeline=new e.Pipeline,this.documentCount=0,this._b=.75,this._k1=1.2,this.termIndex=0,this.metadataWhitelist=[]},e.Builder.prototype.ref=function(e){this._ref=e},e.Builder.prototype.field=function(e,t){if(/\//.test(e))throw new RangeError("Field '"+e+"' contains illegal character '/'");this._fields[e]=t||{}},e.Builder.prototype.b=function(e){e<0?this._b=0:e>1?this._b=1:this._b=e},e.Builder.prototype.k1=function(e){this._k1=e},e.Builder.prototype.add=function(t,r){var i=t[this._ref],n=Object.keys(this._fields);this._documents[i]=r||{},this.documentCount+=1;for(var s=0;s<n.length;s++){var o=n[s],a=this._fields[o].extractor,u=a?a(t):t[o],l=this.tokenizer(u,{fields:[o]}),c=this.pipeline.run(l),h=new e.FieldRef(i,o),d=Object.create(null);this.fieldTermFrequencies[h]=d,this.fieldLengths[h]=0,this.fieldLengths[h]+=c.length;for(var f=0;f<c.length;f++){var p=c[f];if(void 0==d[p]&&(d[p]=0),d[p]+=1,void 0==this.invertedIndex[p]){var y=Object.create(null);y._index=this.termIndex,this.termIndex+=1;for(var m=0;m<n.length;m++)y[n[m]]=Object.create(null);this.invertedIndex[p]=y}void 0==this.invertedIndex[p][o][i]&&(this.invertedIndex[p][o][i]=Object.create(null));for(var v=0;v<this.metadataWhitelist.length;v++){var g=this.metadataWhitelist[v],x=p.metadata[g];void 0==this.invertedIndex[p][o][i][g]&&(this.invertedIndex[p][o][i][g]=[]),this.invertedIndex[p][o][i][g].push(x)}}}},e.Builder.prototype.calculateAverageFieldLengths=function(){for(var t=Object.keys(this.fieldLengths),r=t.length,i={},n={},s=0;s<r;s++){var o=e.FieldRef.fromString(t[s]),a=o.fieldName;n[a]||(n[a]=0),n[a]+=1,i[a]||(i[a]=0),i[a]+=this.fieldLengths[o]}for(var u=Object.keys(this._fields),s=0;s<u.length;s++){var l=u[s];i[l]=i[l]/n[l]}this.averageFieldLength=i},e.Builder.prototype.createFieldVectors=function(){for(var t={},r=Object.keys(this.fieldTermFrequencies),i=r.length,n=Object.create(null),s=0;s<i;s++){for(var o=e.FieldRef.fromString(r[s]),a=o.fieldName,u=this.fieldLengths[o],l=new e.Vector,c=this.fieldTermFrequencies[o],h=Object.keys(c),d=h.length,f=this._fields[a].boost||1,p=this._documents[o.docRef].boost||1,y=0;y<d;y++){var m,v,g,x=h[y],w=c[x],Q=this.invertedIndex[x]._index;void 0===n[x]?(m=e.idf(this.invertedIndex[x],this.documentCount),n[x]=m):m=n[x],v=m*((this._k1+1)*w)/(this._k1*(1-this._b+this._b*(u/this.averageFieldLength[a]))+w),v*=f,v*=p,g=Math.round(1e3*v)/1e3,l.insert(Q,g)}t[o]=l}this.fieldVectors=t},e.Builder.prototype.createTokenSet=function(){this.tokenSet=e.TokenSet.fromArray(Object.keys(this.invertedIndex).sort())},e.Builder.prototype.build=function(){return this.calculateAverageFieldLengths(),this.createFieldVectors(),this.createTokenSet(),new e.Index({invertedIndex:this.invertedIndex,fieldVectors:this.fieldVectors,tokenSet:this.tokenSet,fields:Object.keys(this._fields),pipeline:this.searchPipeline})},e.Builder.prototype.use=function(e){var t=Array.prototype.slice.call(arguments,1);t.unshift(this),e.apply(this,t)},e.MatchData=function(e,t,r){for(var i=Object.create(null),n=Object.keys(r||{}),s=0;s<n.length;s++){var o=n[s];i[o]=r[o].slice()}this.metadata=Object.create(null),void 0!==e&&(this.metadata[e]=Object.create(null),this.metadata[e][t]=i)},e.MatchData.prototype.combine=function(e){for(var t=Object.keys(e.metadata),r=0;r<t.length;r++){var i=t[r],n=Object.keys(e.metadata[i]);void 0==this.metadata[i]&&(this.metadata[i]=Object.create(null));for(var s=0;s<n.length;s++){var o=n[s],a=Object.keys(e.metadata[i][o]);void 0==this.metadata[i][o]&&(this.metadata[i][o]=Object.create(null));for(var u=0;u<a.length;u++){var l=a[u];void 0==this.metadata[i][o][l]?this.metadata[i][o][l]=e.metadata[i][o][l]:this.metadata[i][o][l]=this.metadata[i][o][l].concat(e.metadata[i][o][l])}}}},e.MatchData.prototype.add=function(e,t,r){if(!(e in this.metadata))return this.metadata[e]=Object.create(null),void(this.metadata[e][t]=r);if(!(t in this.metadata[e]))return void(this.metadata[e][t]=r);for(var i=Object.keys(r),n=0;n<i.length;n++){var s=i[n];s in this.metadata[e][t]?this.metadata[e][t][s]=this.metadata[e][t][s].concat(r[s]):this.metadata[e][t][s]=r[s]}},e.Query=function(e){this.clauses=[],this.allFields=e},e.Query.wildcard=new String("*"),e.Query.wildcard.NONE=0,e.Query.wildcard.LEADING=1,e.Query.wildcard.TRAILING=2,e.Query.presence={OPTIONAL:1,REQUIRED:2,PROHIBITED:3},e.Query.prototype.clause=function(t){return"fields"in t||(t.fields=this.allFields),"boost"in t||(t.boost=1),"usePipeline"in t||(t.usePipeline=!0),"wildcard"in t||(t.wildcard=e.Query.wildcard.NONE),t.wildcard&e.Query.wildcard.LEADING&&t.term.charAt(0)!=e.Query.wildcard&&(t.term="*"+t.term),t.wildcard&e.Query.wildcard.TRAILING&&t.term.slice(-1)!=e.Query.wildcard&&(t.term=""+t.term+"*"),"presence"in t||(t.presence=e.Query.presence.OPTIONAL),this.clauses.push(t),this},e.Query.prototype.isNegated=function(){for(var t=0;t<this.clauses.length;t++)if(this.clauses[t].presence!=e.Query.presence.PROHIBITED)return!1;return!0},e.Query.prototype.term=function(t,r){if(Array.isArray(t))return t.forEach(function(t){this.term(t,e.utils.clone(r))},this),this;var i=r||{};return i.term=t.toString(),this.clause(i),this},e.QueryParseError=function(e,t,r){this.name="QueryParseError",this.message=e,this.start=t,this.end=r},e.QueryParseError.prototype=new Error,e.QueryLexer=function(e){this.lexemes=[],this.str=e,this.length=e.length,this.pos=0,this.start=0,this.escapeCharPositions=[]},e.QueryLexer.prototype.run=function(){for(var t=e.QueryLexer.lexText;t;)t=t(this)},e.QueryLexer.prototype.sliceString=function(){for(var e=[],t=this.start,r=this.pos,i=0;i<this.escapeCharPositions.length;i++)r=this.escapeCharPositions[i],e.push(this.str.slice(t,r)),t=r+1;return e.push(this.str.slice(t,this.pos)),this.escapeCharPositions.length=0,e.join("")},e.QueryLexer.prototype.emit=function(e){this.lexemes.push({type:e,str:this.sliceString(),start:this.start,end:this.pos}),this.start=this.pos},e.QueryLexer.prototype.escapeCharacter=function(){this.escapeCharPositions.push(this.pos-1),this.pos+=1},e.QueryLexer.prototype.next=function(){if(this.pos>=this.length)return e.QueryLexer.EOS;var t=this.str.charAt(this.pos);return this.pos+=1,t},e.QueryLexer.prototype.width=function(){return this.pos-this.start},e.QueryLexer.prototype.ignore=function(){this.start==this.pos&&(this.pos+=1),this.start=this.pos},e.QueryLexer.prototype.backup=function(){this.pos-=1},e.QueryLexer.prototype.acceptDigitRun=function(){var t,r;do t=this.next(),r=t.charCodeAt(0);while(r>47&&r<58);t!=e.QueryLexer.EOS&&this.backup()},e.QueryLexer.prototype.more=function(){return this.pos<this.length},e.QueryLexer.EOS="EOS",e.QueryLexer.FIELD="FIELD",e.QueryLexer.TERM="TERM",e.QueryLexer.EDIT_DISTANCE="EDIT_DISTANCE",e.QueryLexer.BOOST="BOOST",e.QueryLexer.PRESENCE="PRESENCE",e.QueryLexer.lexField=function(t){return t.backup(),t.emit(e.QueryLexer.FIELD),t.ignore(),e.QueryLexer.lexText},e.QueryLexer.lexTerm=function(t){if(t.width()>1&&(t.backup(),t.emit(e.QueryLexer.TERM)),t.ignore(),t.more())return e.QueryLexer.lexText},e.QueryLexer.lexEditDistance=function(t){return t.ignore(),t.acceptDigitRun(),t.emit(e.QueryLexer.EDIT_DISTANCE),e.QueryLexer.lexText},e.QueryLexer.lexBoost=function(t){return t.ignore(),t.acceptDigitRun(),t.emit(e.QueryLexer.BOOST),e.QueryLexer.lexText},e.QueryLexer.lexEOS=function(t){t.width()>0&&t.emit(e.QueryLexer.TERM)},e.QueryLexer.termSeparator=e.tokenizer.separator,e.QueryLexer.lexText=function(t){for(;;){var r=t.next();if(r==e.QueryLexer.EOS)return e.QueryLexer.lexEOS;if(92!=r.charCodeAt(0)){if(":"==r)return e.QueryLexer.lexField;if("~"==r)return t.backup(),t.width()>0&&t.emit(e.QueryLexer.TERM),e.QueryLexer.lexEditDistance;if("^"==r)return t.backup(),t.width()>0&&t.emit(e.QueryLexer.TERM),e.QueryLexer.lexBoost;if("+"==r&&1===t.width())return t.emit(e.QueryLexer.PRESENCE),e.QueryLexer.lexText;if("-"==r&&1===t.width())return t.emit(e.QueryLexer.PRESENCE),e.QueryLexer.lexText;if(r.match(e.QueryLexer.termSeparator))return e.QueryLexer.lexTerm}else t.escapeCharacter()}},e.QueryParser=function(t,r){this.lexer=new e.QueryLexer(t),this.query=r,this.currentClause={},this.lexemeIdx=0},e.QueryParser.prototype.parse=function(){this.lexer.run(),this.lexemes=this.lexer.lexemes;for(var t=e.QueryParser.parseClause;t;)t=t(this);return this.query},e.QueryParser.prototype.peekLexeme=function(){return this.lexemes[this.lexemeIdx]},e.QueryParser.prototype.consumeLexeme=function(){var e=this.peekLexeme();return this.lexemeIdx+=1,e},e.QueryParser.prototype.nextClause=function(){var e=this.currentClause;this.query.clause(e),this.currentClause={}},e.QueryParser.parseClause=function(t){var r=t.peekLexeme();if(void 0!=r)switch(r.type){case e.QueryLexer.PRESENCE:return e.QueryParser.parsePresence;case e.QueryLexer.FIELD:return e.QueryParser.parseField;case e.QueryLexer.TERM:return e.QueryParser.parseTerm;default:var i="expected either a field or a term, found "+r.type;throw r.str.length>=1&&(i+=" with value '"+r.str+"'"),new e.QueryParseError(i,r.start,r.end)}},e.QueryParser.parsePresence=function(t){var r=t.consumeLexeme();if(void 0!=r){switch(r.str){case"-":t.currentClause.presence=e.Query.presence.PROHIBITED;break;case"+":t.currentClause.presence=e.Query.presence.REQUIRED;break;default:var i="unrecognised presence operator'"+r.str+"'";throw new e.QueryParseError(i,r.start,r.end)}var n=t.peekLexeme();if(void 0==n){var i="expecting term or field, found nothing";throw new e.QueryParseError(i,r.start,r.end)}switch(n.type){case e.QueryLexer.FIELD:return e.QueryParser.parseField;case e.QueryLexer.TERM:return e.QueryParser.parseTerm;default:var i="expecting term or field, found '"+n.type+"'";throw new e.QueryParseError(i,n.start,n.end)}}},e.QueryParser.parseField=function(t){var r=t.consumeLexeme();if(void 0!=r){if(t.query.allFields.indexOf(r.str)==-1){var i=t.query.allFields.map(function(e){return"'"+e+"'"}).join(", "),n="unrecognised field '"+r.str+"', possible fields: "+i;throw new e.QueryParseError(n,r.start,r.end)}t.currentClause.fields=[r.str];var s=t.peekLexeme();if(void 0==s){var n="expecting term, found nothing";throw new e.QueryParseError(n,r.start,r.end)}switch(s.type){case e.QueryLexer.TERM:return e.QueryParser.parseTerm;default:var n="expecting term, found '"+s.type+"'";throw new e.QueryParseError(n,s.start,s.end)}}},e.QueryParser.parseTerm=function(t){var r=t.consumeLexeme();if(void 0!=r){t.currentClause.term=r.str.toLowerCase(),r.str.indexOf("*")!=-1&&(t.currentClause.usePipeline=!1);var i=t.peekLexeme();if(void 0==i)return void t.nextClause();switch(i.type){case e.QueryLexer.TERM:return t.nextClause(),e.QueryParser.parseTerm;case e.QueryLexer.FIELD:return t.nextClause(),e.QueryParser.parseField;case e.QueryLexer.EDIT_DISTANCE:return e.QueryParser.parseEditDistance;case e.QueryLexer.BOOST:return e.QueryParser.parseBoost;case e.QueryLexer.PRESENCE:return t.nextClause(),e.QueryParser.parsePresence;default:var n="Unexpected lexeme type '"+i.type+"'";throw new e.QueryParseError(n,i.start,i.end)}}},e.QueryParser.parseEditDistance=function(t){var r=t.consumeLexeme();if(void 0!=r){var i=parseInt(r.str,10);if(isNaN(i)){var n="edit distance must be numeric";throw new e.QueryParseError(n,r.start,r.end)}t.currentClause.editDistance=i;var s=t.peekLexeme();if(void 0==s)return void t.nextClause();switch(s.type){case e.QueryLexer.TERM:return t.nextClause(),e.QueryParser.parseTerm;case e.QueryLexer.FIELD:return t.nextClause(),e.QueryParser.parseField;case e.QueryLexer.EDIT_DISTANCE:return e.QueryParser.parseEditDistance;case e.QueryLexer.BOOST:return e.QueryParser.parseBoost;case e.QueryLexer.PRESENCE:return t.nextClause(),e.QueryParser.parsePresence;default:var n="Unexpected lexeme type '"+s.type+"'";throw new e.QueryParseError(n,s.start,s.end)}}},e.QueryParser.parseBoost=function(t){var r=t.consumeLexeme();if(void 0!=r){var i=parseInt(r.str,10);if(isNaN(i)){var n="boost must be numeric";throw new e.QueryParseError(n,r.start,r.end)}t.currentClause.boost=i;var s=t.peekLexeme();if(void 0==s)return void t.nextClause();switch(s.type){case e.QueryLexer.TERM:return t.nextClause(),e.QueryParser.parseTerm;case e.QueryLexer.FIELD:return t.nextClause(),e.QueryParser.parseField;case e.QueryLexer.EDIT_DISTANCE:return e.QueryParser.parseEditDistance;case e.QueryLexer.BOOST:return e.QueryParser.parseBoost;case e.QueryLexer.PRESENCE:return t.nextClause(),e.QueryParser.parsePresence;default:var n="Unexpected lexeme type '"+s.type+"'";throw new e.QueryParseError(n,s.start,s.end)}}},function(e,t){"function"==typeof define&&define.amd?define(t):"object"==typeof exports?module.exports=t():e.lunr=t()}(this,function(){return e})}();

;
!function(r,i){"function"==typeof define&&define.amd?define(i):"object"==typeof exports?module.exports=i():i()(r.lunr)}(this,function(){return function(r){r.stemmerSupport={Among:function(r,i,t,e){if(this.toCharArray=function(r){for(var i=r.length,t=new Array(i),e=0;e<i;e++)t[e]=r.charCodeAt(e);return t},!r&&""!=r||!i&&0!=i||!t)throw"Bad Among initialisation: s:"+r+", substring_i: "+i+", result: "+t;this.s_size=r.length,this.s=this.toCharArray(r),this.substring_i=i,this.result=t,this.method=e},SnowballProgram:function(){var r;return{bra:0,ket:0,limit:0,cursor:0,limit_backward:0,setCurrent:function(i){r=i,this.cursor=0,this.limit=i.length,this.limit_backward=0,this.bra=this.cursor,this.ket=this.limit},getCurrent:function(){var i=r;return r=null,i},in_grouping:function(i,t,e){if(this.cursor<this.limit){var s=r.charCodeAt(this.cursor);if(s<=e&&s>=t&&(s-=t,i[s>>3]&1<<(7&s)))return this.cursor++,!0}return!1},in_grouping_b:function(i,t,e){if(this.cursor>this.limit_backward){var s=r.charCodeAt(this.cursor-1);if(s<=e&&s>=t&&(s-=t,i[s>>3]&1<<(7&s)))return this.cursor--,!0}return!1},out_grouping:function(i,t,e){if(this.cursor<this.limit){var s=r.charCodeAt(this.cursor);if(s>e||s<t)return this.cursor++,!0;if(s-=t,!(i[s>>3]&1<<(7&s)))return this.cursor++,!0}return!1},out_grouping_b:function(i,t,e){if(this.cursor>this.limit_backward){var s=r.charCodeAt(this.cursor-1);if(s>e||s<t)return this.cursor--,!0;if(s-=t,!(i[s>>3]&1<<(7&s)))return this.cursor--,!0}return!1},eq_s:function(i,t){if(this.limit-this.cursor<i)return!1;for(var e=0;e<i;e++)if(r.charCodeAt(this.cursor+e)!=t.charCodeAt(e))return!1;return this.cursor+=i,!0},eq_s_b:function(i,t){if(this.cursor-this.limit_backward<i)return!1;for(var e=0;e<i;e++)if(r.charCodeAt(this.cursor-i+e)!=t.charCodeAt(e))return!1;return this.cursor-=i,!0},find_among:function(i,t){for(var e=0,s=t,n=this.cursor,u=this.limit,o=0,a=0,c=!1;;){for(var h=e+(s-e>>1),l=0,f=o<a?o:a,d=i[h],p=f;p<d.s_size;p++){if(n+f==u){l=-1;break}if(l=r.charCodeAt(n+f)-d.s[p])break;f++}if(l<0?(s=h,a=f):(e=h,o=f),s-e<=1){if(e>0||s==e||c)break;c=!0}}for(;;){var d=i[e];if(o>=d.s_size){if(this.cursor=n+d.s_size,!d.method)return d.result;var m=d.method();if(this.cursor=n+d.s_size,m)return d.result}if((e=d.substring_i)<0)return 0}},find_among_b:function(i,t){for(var e=0,s=t,n=this.cursor,u=this.limit_backward,o=0,a=0,c=!1;;){for(var h=e+(s-e>>1),l=0,f=o<a?o:a,d=i[h],p=d.s_size-1-f;p>=0;p--){if(n-f==u){l=-1;break}if(l=r.charCodeAt(n-1-f)-d.s[p])break;f++}if(l<0?(s=h,a=f):(e=h,o=f),s-e<=1){if(e>0||s==e||c)break;c=!0}}for(;;){var d=i[e];if(o>=d.s_size){if(this.cursor=n-d.s_size,!d.method)return d.result;var m=d.method();if(this.cursor=n-d.s_size,m)return d.result}if((e=d.substring_i)<0)return 0}},replace_s:function(i,t,e){var s=e.length-(t-i),n=r.substring(0,i),u=r.substring(t);return r=n+e+u,this.limit+=s,this.cursor>=t?this.cursor+=s:this.cursor>i&&(this.cursor=i),s},slice_check:function(){if(this.bra<0||this.bra>this.ket||this.ket>this.limit||this.limit>r.length)throw"faulty slice operation"},slice_from:function(r){this.slice_check(),this.replace_s(this.bra,this.ket,r)},slice_del:function(){this.slice_from("")},insert:function(r,i,t){var e=this.replace_s(r,i,t);r<=this.bra&&(this.bra+=e),r<=this.ket&&(this.ket+=e)},slice_to:function(){return this.slice_check(),r.substring(this.bra,this.ket)},eq_v_b:function(r){return this.eq_s_b(r.length,r)}}},addQueryParserWildcardNormalizer:function(r,i){if(r.Index&&r.Index.prototype&&r.Index.prototype.query&&r.QueryParser&&r.QueryParser.parseTerm&&r.QueryLexer){this.queryParserWildcardNormalizers||(this.queryParserWildcardNormalizers=[]);for(var t=0;t<this.queryParserWildcardNormalizers.length;t++)if(this.queryParserWildcardNormalizers[t].label===i.label)return;if(this.queryParserWildcardNormalizers.push(i),!this.queryParserWildcardNormalizerApplied){var e=this,s=r.Index.prototype.query,n=r.QueryParser.parseTerm;r.Index.prototype.query=function(r){var i=this;return s.call(this,function(t){return t._lunrLanguagesSearchPipeline=i.pipeline,r.call(this,t)})},r.QueryParser.parseTerm=function(i){var t=i.consumeLexeme;i.consumeLexeme=function(){var s=t.call(i);return s&&s.type===r.QueryLexer.TERM&&-1!==s.str.indexOf("*")?{type:s.type,str:e.applyQueryParserWildcardNormalizers(s.str,i.query),start:s.start,end:s.end}:s};try{return n(i)}finally{i.consumeLexeme=t}},this.queryParserWildcardNormalizerApplied=!0}}},applyQueryParserWildcardNormalizers:function(r,i){for(var t=this.queryParserWildcardNormalizers||[],e=i&&i._lunrLanguagesSearchPipeline,s=0;s<t.length;s++)e&&!this.pipelineContainsFunction(e,t[s].pipelineFunctionLabel)||(r=t[s](r));return r},pipelineContainsFunction:function(r,i){if(!i)return!0;if(!r._stack)return!1;for(var t=0;t<r._stack.length;t++)if(r._stack[t].label===i)return!0;return!1}},r.trimmerSupport={generateTrimmer:function(r){var i=r+"0-9",t=new RegExp("^[^"+i+"]+"),e=new RegExp("[^"+i+"]+$");return function(r){return"function"==typeof r.update?r.update(function(r){return r.replace(t,"").replace(e,"")}):r.replace(t,"").replace(e,"")}}}}});
;
/*!
 * Lunr languages, `English` language
 * This is build in into lunr and theirfore needs no other configuration
 *
 * Copyright 2022, Sören Weber
 * http://www.mozilla.org/MPL/
 */

;
(function () {
  function ready(fn) {
    if (document.readyState == 'complete') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // of two words starting alike, a regex takes the one it is given first
  function longestFirst(words) {
    return words.slice().sort(function (a, b) {
      return b.length - a.length;
    });
  }

  // the words all results were found at, for marking them on the pages; the
  // engine may have found a word by another form than the one typed; a word
  // holding one of the words typed is marked by that already
  function rememberMarks(value, results) {
    if (!window.relearn.setSearchMarks) {
      return false;
    }
    // split like the page splits them for marking
    var typed = value
      .toLowerCase()
      .split(' ')
      .filter(function (word) {
        return word.trim() != '';
      });
    // once each, but as written, as lowercasing may change a letter into ones
    // a match ignoring case doesn't take for it, like the Turkish "İ"
    // without a prototype, as a word may be named like one of its members
    var marks = Object.create(null);
    results.forEach(function (item) {
      (item.marks || []).forEach(function (mark) {
        var key = mark.toLowerCase();
        if (
          !(key in marks) &&
          !typed.some(function (word) {
            return key.indexOf(word) >= 0;
          })
        ) {
          marks[key] = mark;
        }
      });
    });
    return window.relearn.setSearchMarks(value, Object.values(marks));
  }

  // the searchinput of the dedicated search page; its form may be copied into
  // the content, but only the search page lists results
  function getSearchinput() {
    return document.querySelector('#R-searchresults') && document.querySelector('.searchform input.search-by');
  }

  window.relearn = window.relearn || {};

  // the adapter tells it is ready by calling executeInitialSearch; until then a
  // search waits instead of answering, as the suggestions keep what they got
  var resolveSearchEngine;
  var searchEngineReady = new Promise(function (resolve) {
    resolveSearchEngine = resolve;
  });

  // the index may be large, so it is only loaded once a search is about to happen
  var isSearchEngineRequested = false;
  function requestSearchEngine() {
    if (isSearchEngineRequested || !window.relearn.search || !window.relearn.search.adapter) {
      return;
    }
    isSearchEngineRequested = true;
    // the adapters expect the index URL and its integrity as globals; our data block
    // is the same for every page, so it knows the index's path from the site's root
    // and we put the page's own way up there in front of it
    var config = JSON.parse(document.querySelector('#R-search-config').textContent);
    window.relearn.index_js_url = window.relearn.relBasePath + '/' + config.indexFile;
    window.relearn.index_js_integrity = config.indexIntegrity;
    window.relearn.search.adapter.init();
  }

  window.relearn.executeInitialSearch = function executeInitialSearch() {
    if (window.relearn.isSearchEngineReady) {
      resolveSearchEngine();
    }
    if (window.relearn.isSearchInterfaceReady && window.relearn.isSearchEngineReady) {
      var input = getSearchinput();
      if (!input) {
        return;
      }
      var value = input.value;
      executeSearch(value);
    }
  };

  window.relearn.executeTriggeredSearch = function executeTriggeredSearch() {
    var input = getSearchinput();
    if (!input) {
      return;
    }
    var value = input.value;
    executeSearch(value);

    // add a new entry to the history after the user
    // changed the term; this does not reload the page
    // but will add to the history and update the address bar URL
    var url = new URL(window.location);
    var oldValue = url.searchParams.get('search-by');
    if (value != oldValue) {
      var state = window.history.state || {};
      state = Object.assign({}, typeof state === 'object' ? state : {});
      url.searchParams.set('search-by', value);
      state.search = url.toString();
      // with normal pages, this is handled by the 'pagehide' event, but this
      // doesn't fire in case of pushState, so we have to do the same thing
      // here, too; we only need a simplified version of transferScrollToHistory
      // as the scroll position can be directly taken from the content element
      state.contentScrollTop = +elc.scrollTop;
      var scrollPositionKey = window.relearn.absBaseUri + '/scroll-position/' + document.querySelector('body').dataset.origin;
      window.history.pushState(state, '', url);
      window.sessionStorage.removeItem(scrollPositionKey);
    }
  };

  function executeHistorySearch(event) {
    // restart search if browsed through history
    if (event.state) {
      var state = window.history.state || {};
      state = Object.assign({}, typeof state === 'object' ? state : {});
      if (state.search) {
        var url = new URL(state.search);
        if (url.searchParams.has('search-by')) {
          var search = url.searchParams.get('search-by');

          // we have to insert the old search term into the inputs
          var inputs = document.querySelectorAll('input.search-by');
          inputs.forEach(function (e) {
            e.value = search;
            e.dispatchEvent(new Event('input'));
          });

          // recreate the last search results and eventually
          // restore the previous scrolling position
          executeSearch(search);
        }
      }
    }
  }

  function renderItem(item) {
    var page = item.page;
    var context = [];
    var numContextWords = 2;
    // the content around one of the words, each as a word of its own; \b only
    // knows the letters of English, so the letters of all scripts are looked
    // at instead
    var around = function (words, bordered) {
      var pattern = longestFirst(words).map(escapeRegex).join('|');
      if (bordered) {
        pattern = '(?<![\\p{L}\\p{M}\\p{N}])(?:' + pattern + ')(?![\\p{L}\\p{M}\\p{N}])';
      }
      // without a border, the text around is a run without spaces, so only a
      // part of it
      var run = bordered ? '\\S*' : '\\S{0,20}';
      return page.content.match(new RegExp('(?:\\S+ +){0,' + numContextWords + '}' + run + '(?:' + pattern + ')' + run + '(?: +\\S+){0,' + numContextWords + '}', 'iu'));
    };
    var marks = item.marks && item.marks.length ? item.marks : null;
    if (marks) {
      // the term as typed first, so a term of several words is shown where
      // they stand together, then the words as they are written in the content
      context = (item.matches && item.matches.length && around(item.matches.slice(0, 1), true)) || around(marks, true);
    }
    // marks found only in the title leave the content to the terms
    if (!(context && context.length) && item.matches && item.matches.length) {
      var contextPattern = '(?:\\S+ +){0,' + numContextWords + '}\\S*\\b(?:' + escapeRegex(item.matches[0]) + ')\\b\\S*(?: +\\S+){0,' + numContextWords + '}';
      context = page.content.match(new RegExp(contextPattern, 'i'));
      if (!context && item.matches.length > 1) {
        // the suggestions render a result they kept once more, so it stays as it is
        var contextPattern = '(?:\\S+ +){0,' + numContextWords + '}\\S*\\b(?:' + item.matches.slice(1).map(escapeRegex).join('|') + ')\\b\\S*(?: +\\S+){0,' + numContextWords + '}';
        context = page.content.match(new RegExp(contextPattern, 'i'));
      }
    }
    // languages without spaces between their words have no border to a word
    if (!(context && context.length) && marks) {
      context = around(marks, false);
    }
    var divsuggestion = document.createElement('a');
    divsuggestion.className = 'autocomplete-suggestion';
    divsuggestion.setAttribute('href', window.relearn.relBaseUri + page.uri);
    var divlink = document.createElement('span');
    divlink.className = 'link';
    divlink.innerText = page.title;
    var divtitle = document.createElement('div');
    divtitle.className = 'title';
    // the mark in front of the title is decoration
    var spanmark = document.createElement('span');
    spanmark.setAttribute('aria-hidden', 'true');
    spanmark.innerText = '» ';
    divtitle.appendChild(spanmark);
    divtitle.appendChild(divlink);
    divsuggestion.appendChild(divtitle);
    var divbreadcrumb = document.createElement('div');
    divbreadcrumb.className = 'breadcrumbs';
    divbreadcrumb.innerText = page.breadcrumb || '';
    divsuggestion.appendChild(divbreadcrumb);
    if (context) {
      var divcontext = document.createElement('div');
      divcontext.className = 'context';
      divcontext.innerText = context || '';
      divsuggestion.appendChild(divcontext);
    }
    return divsuggestion;
  }

  function resolvePlaceholders(s, args) {
    var args = args || [];
    // use replace to iterate over the string
    // select the match and check if the related argument is present
    // if yes, replace the match with the argument
    return s.replace(/{([0-9]+)}/g, function (match, index) {
      // check if the argument is present
      return typeof args[index] == 'undefined' ? match : args[index];
    });
  }

  // what a search found; a term searched for as corrected is told as such
  function resultHint(value, results) {
    if (!results.length) {
      return resolvePlaceholders(window.T_No_results_found, [value]);
    }
    var corrected = results[0].corrected;
    return resolvePlaceholders(corrected && window.T_Corrected_results_found ? window.T_Corrected_results_found : window.T_N_results_found, [value, results.length, corrected]);
  }

  // a search box suggests the best pages only, and leads to the search page
  // for all of them
  var maxSuggestions = 10;

  // Chinese, Japanese and Korean write many words with two characters, other
  // scripts need a third letter before suggestions make sense
  var shortWords = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
  function tooShort(term) {
    return term.trim().length < (shortWords.test(term) ? 2 : 3);
  }

  function renderMore(item) {
    var more = document.createElement('a');
    more.className = 'autocomplete-suggestion autocomplete-more';
    more.setAttribute('href', item.href);
    more.innerText = item.text;
    return more;
  }

  // how many suggestions there are is told without having to look at them
  function initStatus(list) {
    var status = document.createElement('div');
    status.className = 'a11y-only';
    status.setAttribute('role', 'status');
    list.insertAdjacentElement('afterend', status);
    return status;
  }

  function executeSearch(value) {
    var input = getSearchinput();

    var results = document.querySelector('#R-searchresults');
    var hint = document.querySelector('.searchhint');
    hint.innerText = '';
    results.textContent = '';
    // the print version searches for the term it is given with its URL
    var print = document.querySelector('.topbar-button-print a');
    if (print) {
      var printUrl = new URL(print.href);
      printUrl.searchParams.delete('search-by');
      if (value.length) {
        printUrl.searchParams.set('search-by', value);
      }
      print.href = printUrl;
    }
    (async function () {
      requestSearchEngine();
      await searchEngineReady;
      var a = await window.relearn.search.adapter.search(value);
      if (a.length) {
        hint.innerText = resultHint(value, a);
        a.forEach(function (item) {
          results.appendChild(renderItem(item));
        });
        // new marks mark the page again, the results included
        if (!rememberMarks(value, a)) {
          window.relearn.markSearch();
        }
      } else if (value.length) {
        hint.innerText = resolvePlaceholders(window.T_No_results_found, [value]);
      }
      input.focus();

      // if we are initiating search because of a browser history
      // operation, we have to restore the scrolling postion the
      // user previously has used; if this search isn't initiated
      // by a browser history operation, it simply does nothing
      var state = window.history.state || {};
      state = Object.assign({}, typeof state === 'object' ? state : {});
      if (Object.hasOwn(state, 'contentScrollTop')) {
        window.setTimeout(function () {
          elc.scrollTop = +state.contentScrollTop;
        }, 10);
        return;
      }
    })();
  }

  function initSearchAfterLoad() {
    if (!window.relearn.search || !window.relearn.search.adapter) {
      return;
    }

    var input = getSearchinput();
    if (input) {
      // the search page is there to show results, so it needs the index right away
      requestSearchEngine();
      var state = window.history.state || {};
      state = Object.assign({}, typeof state === 'object' ? state : {});
      state.search = window.location.toString();
      window.history.replaceState(state, '');
    }

    // each search box gets its own suggestions and its own status
    document.querySelectorAll('.searchbox input.search-by').forEach(function (box) {
      // a reader putting the focus into the box is about to search, so the index
      // has its head start while the term is still typed
      box.addEventListener('focus', requestSearchEngine, { once: true });
      var status = null;
      // the search page the box leads to, if there is one
      var page = box.form && box.form.getAttribute('action') ? box.form.action : null;
      new autoComplete({
        /* selector for the search box element */
        selectorToInsert: 'search:has(.searchbox)',
        selector: box,
        minChars: 2,
        /* source is the callback to perform the search */
        source: async function (term, response) {
          if (tooShort(term)) {
            response([]);
            return;
          }
          requestSearchEngine();
          await searchEngineReady;
          let a = await window.relearn.search.adapter.search(term);
          var shown = a;
          if (page && a.length > maxSuggestions) {
            var url = new URL(page);
            url.searchParams.set('search-by', term);
            shown = a.slice(0, maxSuggestions).concat({ more: true, href: url.toString(), text: resultHint(term, a) });
          }
          response(shown);
          rememberMarks(term, a);
          // the answer to an earlier term, coming in late, isn't told
          if (status && box.value == term) {
            status.innerText = resultHint(term, a);
          }
        },
        /* renderItem displays individual search results */
        renderItem: function (item, _term) {
          return (item.more ? renderMore(item) : renderItem(item)).outerHTML;
        },
        /* onSelect callback fires when a search suggestion is chosen */
        onSelect: function (e, term, item) {
          location.href = item.getAttribute('href');
          e.preventDefault();
        },
      });
      if (box.sc) {
        status = initStatus(box.sc);
      }
    });
  }

  function initSearch() {
    window.addEventListener('popstate', executeHistorySearch);

    var input = getSearchinput();
    if (input) {
      // search in place instead of reloading the page with the term in its URL
      input.form.addEventListener('submit', function (event) {
        event.preventDefault();
        window.relearn.executeTriggeredSearch();
      });
      input.addEventListener('keydown', function (event) {
        // if we are pressing ESC in the searchinput our focus will
        // be stolen by the other event handlers, so we have to refocus
        // here after a short while
        if (event.key == 'Escape') {
          setTimeout(function () {
            input.focus();
          }, 0);
        }
      });
    }
    ready(initSearchAfterLoad);
  }

  initSearch();
})();
