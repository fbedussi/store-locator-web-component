var hyperHTML = (function (global) {
    'use strict';
  
    var G = document.defaultView;
  
    // Node.CONSTANTS
    // 'cause some engine has no global Node defined
    // (i.e. Node, NativeScript, basicHTML ... )
    var ELEMENT_NODE = 1;
    var TEXT_NODE = 3;
    var COMMENT_NODE = 8;
    var DOCUMENT_FRAGMENT_NODE = 11;
  
    // HTML related constants
    var VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
  
    // SVG related constants
    var OWNER_SVG_ELEMENT = 'ownerSVGElement';
    var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  
    // Custom Elements / MutationObserver constants
    var CONNECTED = 'connected';
    var DISCONNECTED = 'dis' + CONNECTED;
  
    // hyperHTML related constants
    var EXPANDO = '_hyper: ';
    var SHOULD_USE_TEXT_CONTENT = /^(?:style|textarea)$/i;
    var UID = EXPANDO + (Math.random() * new Date() | 0) + ';';
    var UIDC = '<!--' + UID + '-->';
  
    // you know that kind of basics you need to cover
    // your use case only but you don't want to bloat the library?
    // There's even a package in here:
    // https://www.npmjs.com/package/poorlyfills
  
    // used to dispatch simple events
    var Event = G.Event;
    try {
      new Event('Event');
    } catch (o_O) {
      Event = function Event(type) {
        var e = document.createEvent('Event');
        e.initEvent(type, false, false);
        return e;
      };
    }
  
    // used to store template literals
    /* istanbul ignore next */
    var Map$1 = G.Map || function Map() {
      var keys = [],
          values = [];
      return {
        get: function get(obj) {
          return values[keys.indexOf(obj)];
        },
        set: function set(obj, value) {
          values[keys.push(obj) - 1] = value;
        }
      };
    };
  
    // used to store wired content
    var ID = 0;
    var WeakMap = G.WeakMap || function WeakMap() {
      var key = UID + ID++;
      return {
        delete: function _delete(obj) {
          delete obj[key];
        },
        get: function get(obj) {
          return obj[key];
        },
        set: function set(obj, value) {
          Object.defineProperty(obj, key, {
            configurable: true,
            value: value
          });
        }
      };
    };
  
    // used to store hyper.Components
    var WeakSet = G.WeakSet || function WeakSet() {
      var wm = new WeakMap();
      return {
        delete: function _delete(obj) {
          wm.delete(obj);
        },
        add: function add(obj) {
          wm.set(obj, true);
        },
        has: function has(obj) {
          return wm.get(obj) === true;
        }
      };
    };
  
    // used to be sure IE9 or older Androids work as expected
    var isArray = Array.isArray || function (toString) {
      return function (arr) {
        return toString.call(arr) === '[object Array]';
      };
    }({}.toString);
  
    var trim = UID.trim || function () {
      return this.replace(/^\s+|\s+$/g, '');
    };
  
    // hyperHTML.Component is a very basic class
    // able to create Custom Elements like components
    // including the ability to listen to connect/disconnect
    // events via onconnect/ondisconnect attributes
    // Components can be created imperatively or declaratively.
    // The main difference is that declared components
    // will not automatically render on setState(...)
    // to simplify state handling on render.
    function Component() {
      return this; // this is needed in Edge !!!
    }
  
    // Component is lazily setup because it needs
    // wire mechanism as lazy content
    function setup(content) {
      // there are various weakly referenced variables in here
      // and mostly are to use Component.for(...) static method.
      var children = new WeakMap();
      var create = Object.create;
      var createEntry = function createEntry(wm, id, component) {
        wm.set(id, component);
        return component;
      };
      var get = function get(Class, info, context, id) {
        var relation = info.get(Class) || relate(Class, info);
        switch (typeof id) {
          case 'object':
          case 'function':
            var wm = relation.w || (relation.w = new WeakMap());
            return wm.get(id) || createEntry(wm, id, new Class(context));
          default:
            var sm = relation.p || (relation.p = create(null));
            return sm[id] || (sm[id] = new Class(context));
        }
      };
      var relate = function relate(Class, info) {
        var relation = { w: null, p: null };
        info.set(Class, relation);
        return relation;
      };
      var set = function set(context) {
        var info = new Map$1();
        children.set(context, info);
        return info;
      };
      // The Component Class
      Object.defineProperties(Component, {
        // Component.for(context[, id]) is a convenient way
        // to automatically relate data/context to children components
        // If not created yet, the new Component(context) is weakly stored
        // and after that same instance would always be returned.
        for: {
          configurable: true,
          value: function value(context, id) {
            return get(this, children.get(context) || set(context), context, id == null ? 'default' : id);
          }
        }
      });
      Object.defineProperties(Component.prototype, {
        // all events are handled with the component as context
        handleEvent: {
          value: function value(e) {
            var ct = e.currentTarget;
            this['getAttribute' in ct && ct.getAttribute('data-call') || 'on' + e.type](e);
          }
        },
        // components will lazily define html or svg properties
        // as soon as these are invoked within the .render() method
        // Such render() method is not provided by the base class
        // but it must be available through the Component extend.
        // Declared components could implement a
        // render(props) method too and use props as needed.
        html: lazyGetter('html', content),
        svg: lazyGetter('svg', content),
        // the state is a very basic/simple mechanism inspired by Preact
        state: lazyGetter('state', function () {
          return this.defaultState;
        }),
        // it is possible to define a default state that'd be always an object otherwise
        defaultState: {
          get: function get() {
            return {};
          }
        },
        // dispatch a bubbling, cancelable, custom event
        // through the first known/available node
        dispatch: {
          value: function value(type, detail) {
            var _wire$ = this._wire$;
  
            if (_wire$) {
              var event = new CustomEvent(type, {
                bubbles: true,
                cancelable: true,
                detail: detail
              });
              event.component = this;
              return (_wire$.dispatchEvent ? _wire$ : _wire$.childNodes[0]).dispatchEvent(event);
            }
            return false;
          }
        },
        // setting some property state through a new object
        // or a callback, triggers also automatically a render
        // unless explicitly specified to not do so (render === false)
        setState: {
          value: function value(state, render) {
            var target = this.state;
            var source = typeof state === 'function' ? state.call(this, target) : state;
            for (var key in source) {
              target[key] = source[key];
            }if (render !== false) this.render();
            return this;
          }
        }
      });
    }
  
    // instead of a secret key I could've used a WeakMap
    // However, attaching a property directly will result
    // into better performance with thousands of components
    // hanging around, and less memory pressure caused by the WeakMap
    var lazyGetter = function lazyGetter(type, fn) {
      var secret = '_' + type + '$';
      return {
        get: function get() {
          return this[secret] || setValue(this, secret, fn.call(this, type));
        },
        set: function set(value) {
          setValue(this, secret, value);
        }
      };
    };
  
    // shortcut to set value on get or set(value)
    var setValue = function setValue(self, secret, value) {
      return Object.defineProperty(self, secret, {
        configurable: true,
        value: typeof value === 'function' ? function () {
          return self._wire$ = value.apply(this, arguments);
        } : value
      })[secret];
    };
  
    var attributes = {};
    var intents = {};
    var keys = [];
    var hasOwnProperty = intents.hasOwnProperty;
  
    var length = 0;
  
    var Intent = {
  
      // used to invoke right away hyper:attributes
      attributes: attributes,
  
      // hyperHTML.define('intent', (object, update) => {...})
      // can be used to define a third parts update mechanism
      // when every other known mechanism failed.
      // hyper.define('user', info => info.name);
      // hyper(node)`<p>${{user}}</p>`;
      define: function define(intent, callback) {
        if (intent.indexOf('-') < 0) {
          if (!(intent in intents)) {
            length = keys.push(intent);
          }
          intents[intent] = callback;
        } else {
          attributes[intent] = callback;
        }
      },
  
      // this method is used internally as last resort
      // to retrieve a value out of an object
      invoke: function invoke(object, callback) {
        for (var i = 0; i < length; i++) {
          var key = keys[i];
          if (hasOwnProperty.call(object, key)) {
            return intents[key](object[key], callback);
          }
        }
      }
    };
  
    // TODO:  I'd love to code-cover RegExp too here
    //        these are fundamental for this library
  
    var spaces = ' \\f\\n\\r\\t';
    var almostEverything = '[^ ' + spaces + '\\/>"\'=]+';
    var attrName = '[ ' + spaces + ']+' + almostEverything;
    var tagName = '<([A-Za-z]+[A-Za-z0-9:_-]*)((?:';
    var attrPartials = '(?:=(?:\'[^\']*?\'|"[^"]*?"|<[^>]*?>|' + almostEverything + '))?)';
  
    var attrSeeker = new RegExp(tagName + attrName + attrPartials + '+)([ ' + spaces + ']*/?>)', 'g');
  
    var selfClosing = new RegExp(tagName + attrName + attrPartials + '*)([ ' + spaces + ']*/>)', 'g');
  
    // these are tiny helpers to simplify most common operations needed here
    var create = function create(node, type) {
      return doc(node).createElement(type);
    };
    var doc = function doc(node) {
      return node.ownerDocument || node;
    };
    var fragment = function fragment(node) {
      return doc(node).createDocumentFragment();
    };
    var text = function text(node, _text) {
      return doc(node).createTextNode(_text);
    };
  
    var testFragment = fragment(document);
  
    // DOM4 node.append(...many)
    var hasAppend = 'append' in testFragment;
  
    // detect old browsers without HTMLTemplateElement content support
    var hasContent = 'content' in create(document, 'template');
  
    // IE 11 has problems with cloning templates: it "forgets" empty childNodes
    testFragment.appendChild(text(testFragment, 'g'));
    testFragment.appendChild(text(testFragment, ''));
    var hasDoomedCloneNode = testFragment.cloneNode(true).childNodes.length === 1;
  
    // old browsers need to fallback to cloneNode
    // Custom Elements V0 and V1 will work polyfilled
    // but native implementations need importNode instead
    // (specially Chromium and its old V0 implementation)
    var hasImportNode = 'importNode' in document;
  
    // appends an array of nodes
    // to a generic node/fragment
    // When available, uses append passing all arguments at once
    // hoping that's somehow faster, even if append has more checks on type
    var append = hasAppend ? function (node, childNodes) {
      node.append.apply(node, childNodes);
    } : function (node, childNodes) {
      var length = childNodes.length;
      for (var i = 0; i < length; i++) {
        node.appendChild(childNodes[i]);
      }
    };
  
    var findAttributes = new RegExp('(' + attrName + '=)([\'"]?)' + UIDC + '\\2', 'gi');
    var comments = function comments($0, $1, $2, $3) {
      return '<' + $1 + $2.replace(findAttributes, replaceAttributes) + $3;
    };
    var replaceAttributes = function replaceAttributes($0, $1, $2) {
      return $1 + ($2 || '"') + UID + ($2 || '"');
    };
  
    // given a node and a generic HTML content,
    // create either an SVG or an HTML fragment
    // where such content will be injected
    var createFragment = function createFragment(node, html) {
      return (OWNER_SVG_ELEMENT in node ? SVGFragment : HTMLFragment)(node, html.replace(attrSeeker, comments));
    };
  
    // IE/Edge shenanigans proof cloneNode
    // it goes through all nodes manually
    // instead of relying the engine to suddenly
    // merge nodes together
    var cloneNode = hasDoomedCloneNode ? function (node) {
      var clone = node.cloneNode();
      var childNodes = node.childNodes ||
      // this is an excess of caution
      // but some node, in IE, might not
      // have childNodes property.
      // The following fallback ensure working code
      // in older IE without compromising performance
      // or any other browser/engine involved.
      /* istanbul ignore next */
      [];
      var length = childNodes.length;
      for (var i = 0; i < length; i++) {
        clone.appendChild(cloneNode(childNodes[i]));
      }
      return clone;
    } :
    // the following ignore is due code-coverage
    // combination of not having document.importNode
    // but having a working node.cloneNode.
    // This shenario is common on older Android/WebKit browsers
    // but basicHTML here tests just two major cases:
    // with document.importNode or with broken cloneNode.
    /* istanbul ignore next */
    function (node) {
      return node.cloneNode(true);
    };
  
    // used to import html into fragments
    var importNode = hasImportNode ? function (doc$$1, node) {
      return doc$$1.importNode(node, true);
    } : function (doc$$1, node) {
      return cloneNode(node);
    };
  
    // just recycling a one-off array to use slice
    // in every needed place
    var slice = [].slice;
  
    // lazy evaluated, returns the unique identity
    // of a template literal, as tempalte literal itself.
    // By default, ES2015 template literals are unique
    // tag`a${1}z` === tag`a${2}z`
    // even if interpolated values are different
    // the template chunks are in a frozen Array
    // that is identical each time you use the same
    // literal to represent same static content
    // around its own interpolations.
    var unique = function unique(template) {
      return _TL(template);
    };
  
    // https://codepen.io/WebReflection/pen/dqZrpV?editors=0010
    // TL returns a unique version of the template
    // it needs lazy feature detection
    // (cannot trust literals with transpiled code)
    var _TL = function TL(t) {
      if (
      // TypeScript template literals are not standard
      t.propertyIsEnumerable('raw') || !Object.isFrozen(t.raw) ||
      // Firefox < 55 has not standard implementation neither
      /Firefox\/(\d+)/.test((G.navigator || {}).userAgent) && parseFloat(RegExp.$1) < 55) {
        var T = {};
        _TL = function TL(t) {
          var k = '^' + t.join('^');
          return T[k] || (T[k] = t);
        };
      } else {
        // make TL an identity like function
        _TL = function TL(t) {
          return t;
        };
      }
      return _TL(t);
    };
  
    // used to store templates objects
    // since neither Map nor WeakMap are safe
    var TemplateMap = function TemplateMap() {
      try {
        var wm = new WeakMap();
        var o_O = Object.freeze([]);
        wm.set(o_O, true);
        if (!wm.get(o_O)) throw o_O;
        return wm;
      } catch (o_O) {
        // inevitable legacy code leaks due
        // https://github.com/tc39/ecma262/pull/890
        return new Map$1();
      }
    };
  
    // create document fragments via native template
    // with a fallback for browsers that won't be able
    // to deal with some injected element such <td> or others
    var HTMLFragment = hasContent ? function (node, html) {
      var container = create(node, 'template');
      container.innerHTML = html;
      return container.content;
    } : function (node, html) {
      var container = create(node, 'template');
      var content = fragment(node);
      if (/^[^\S]*?<(col(?:group)?|t(?:head|body|foot|r|d|h))/i.test(html)) {
        var selector = RegExp.$1;
        container.innerHTML = '<table>' + html + '</table>';
        append(content, slice.call(container.querySelectorAll(selector)));
      } else {
        container.innerHTML = html;
        append(content, slice.call(container.childNodes));
      }
      return content;
    };
  
    // creates SVG fragment with a fallback for IE that needs SVG
    // within the HTML content
    var SVGFragment = hasContent ? function (node, html) {
      var content = fragment(node);
      var container = doc(node).createElementNS(SVG_NAMESPACE, 'svg');
      container.innerHTML = html;
      append(content, slice.call(container.childNodes));
      return content;
    } : function (node, html) {
      var content = fragment(node);
      var container = create(node, 'div');
      container.innerHTML = '<svg xmlns="' + SVG_NAMESPACE + '">' + html + '</svg>';
      append(content, slice.call(container.firstChild.childNodes));
      return content;
    };
  
    function Wire(childNodes) {
      this.childNodes = childNodes;
      this.length = childNodes.length;
      this.first = childNodes[0];
      this.last = childNodes[this.length - 1];
      this._ = null;
    }
  
    // when a wire is inserted, all its nodes will follow
    Wire.prototype.valueOf = function valueOf(different) {
      var noFragment = this._ == null;
      if (noFragment) this._ = fragment(this.first);
      /* istanbul ignore else */
      if (noFragment || different) append(this._, this.childNodes);
      return this._;
    };
  
    // when a wire is removed, all its nodes must be removed as well
    Wire.prototype.remove = function remove() {
      this._ = null;
      var first = this.first;
      var last = this.last;
      if (this.length === 2) {
        last.parentNode.removeChild(last);
      } else {
        var range = doc(first).createRange();
        range.setStartBefore(this.childNodes[1]);
        range.setEndAfter(last);
        range.deleteContents();
      }
      return first;
    };
  
    // every template literal interpolation indicates
    // a precise target in the DOM the template is representing.
    // `<p id=${'attribute'}>some ${'content'}</p>`
    // hyperHTML finds only once per template literal,
    // hence once per entire application life-cycle,
    // all nodes that are related to interpolations.
    // These nodes are stored as indexes used to retrieve,
    // once per upgrade, nodes that will change on each future update.
    // A path example is [2, 0, 1] representing the operation:
    // node.childNodes[2].childNodes[0].childNodes[1]
    // Attributes are addressed via their owner node and their name.
    var createPath = function createPath(node) {
      var path = [];
      var parentNode = void 0;
      switch (node.nodeType) {
        case ELEMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          parentNode = node;
          break;
        case COMMENT_NODE:
          parentNode = node.parentNode;
          prepend(path, parentNode, node);
          break;
        default:
          parentNode = node.ownerElement;
          break;
      }
      for (node = parentNode; parentNode = parentNode.parentNode; node = parentNode) {
        prepend(path, parentNode, node);
      }
      return path;
    };
  
    var prepend = function prepend(path, parent, node) {
      path.unshift(path.indexOf.call(parent.childNodes, node));
    };
  
    var Path = {
      create: function create(type, node, name) {
        return { type: type, name: name, node: node, path: createPath(node) };
      },
      find: function find(node, path) {
        var length = path.length;
        for (var i = 0; i < length; i++) {
          node = node.childNodes[path[i]];
        }
        return node;
      }
    };
  
    // from https://github.com/developit/preact/blob/33fc697ac11762a1cb6e71e9847670d047af7ce5/src/constants.js
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
  
    // style is handled as both string and object
    // even if the target is an SVG element (consistency)
    var Style = (function (node, original, isSVG) {
      if (isSVG) {
        var style = original.cloneNode(true);
        style.value = '';
        node.setAttributeNode(style);
        return update(style, isSVG);
      }
      return update(node.style, isSVG);
    });
  
    // the update takes care or changing/replacing
    // only properties that are different or
    // in case of string, the whole node
    var update = function update(style, isSVG) {
      var oldType = void 0,
          oldValue = void 0;
      return function (newValue) {
        switch (typeof newValue) {
          case 'object':
            if (newValue) {
              if (oldType === 'object') {
                if (!isSVG) {
                  if (oldValue !== newValue) {
                    for (var key in oldValue) {
                      if (!(key in newValue)) {
                        style[key] = '';
                      }
                    }
                  }
                }
              } else {
                if (isSVG) style.value = '';else style.cssText = '';
              }
              var info = isSVG ? {} : style;
              for (var _key in newValue) {
                var value = newValue[_key];
                var styleValue = typeof value === 'number' && !IS_NON_DIMENSIONAL.test(_key) ? value + 'px' : value;
                if (!isSVG && /^--/.test(_key)) info.setProperty(_key, styleValue);else info[_key] = styleValue;
              }
              oldType = 'object';
              if (isSVG) style.value = toStyle(oldValue = info);else oldValue = newValue;
              break;
            }
          default:
            if (oldValue != newValue) {
              oldType = 'string';
              oldValue = newValue;
              if (isSVG) style.value = newValue || '';else style.cssText = newValue || '';
            }
            break;
        }
      };
    };
  
    var hyphen = /([^A-Z])([A-Z]+)/g;
    var ized = function ized($0, $1, $2) {
      return $1 + '-' + $2.toLowerCase();
    };
    var toStyle = function toStyle(object) {
      var css = [];
      for (var key in object) {
        css.push(key.replace(hyphen, ized), ':', object[key], ';');
      }
      return css.join('');
    };
  
    /* AUTOMATICALLY IMPORTED, DO NOT MODIFY */
    var append$1 = function append(get, parent, children, start, end, before) {
      if (end - start < 2) parent.insertBefore(get(children[start], 1), before);else {
        var fragment = parent.ownerDocument.createDocumentFragment();
        while (start < end) {
          fragment.appendChild(get(children[start++], 1));
        }parent.insertBefore(fragment, before);
      }
    };
  
    var eqeq = function eqeq(a, b) {
      return a == b;
    };
  
    var identity = function identity(O) {
      return O;
    };
  
    var indexOf = function indexOf(moreNodes, moreStart, moreEnd, lessNodes, lessStart, lessEnd, compare) {
      var length = lessEnd - lessStart;
      /* istanbul ignore if */
      if (length < 1) return -1;
      while (moreEnd - moreStart >= length) {
        var m = moreStart;
        var l = lessStart;
        while (m < moreEnd && l < lessEnd && compare(moreNodes[m], lessNodes[l])) {
          m++;
          l++;
        }
        if (l === lessEnd) return moreStart;
        moreStart = m + 1;
      }
      return -1;
    };
  
    var isReversed = function isReversed(futureNodes, futureEnd, currentNodes, currentStart, currentEnd, compare) {
      while (currentStart < currentEnd && compare(currentNodes[currentStart], futureNodes[futureEnd - 1])) {
        currentStart++;
        futureEnd--;
      }  return futureEnd === 0;
    };
  
    var next = function next(get, list, i, length, before) {
      return i < length ? get(list[i], 0) : 0 < i ? get(list[i - 1], -0).nextSibling : before;
    };
  
    var remove = function remove(get, parent, children, start, end) {
      if (end - start < 2) parent.removeChild(get(children[start], -1));else {
        var range = parent.ownerDocument.createRange();
        range.setStartBefore(get(children[start], -1));
        range.setEndAfter(get(children[end - 1], -1));
        range.deleteContents();
      }
    };
  
    // - - - - - - - - - - - - - - - - - - -
    // diff related constants and utilities
    // - - - - - - - - - - - - - - - - - - -
  
    var DELETION = -1;
    var INSERTION = 1;
    var SKIP = 0;
    var SKIP_OND = 50;
  
    /* istanbul ignore next */
    var Rel = typeof Map === 'undefined' ? function () {
      var k = [],
          v = [];
      return {
        has: function has(key) {
          return -1 < k.indexOf(key);
        },
        get: function get(key) {
          return v[k.indexOf(key)];
        },
        set: function set(key, value) {
          var i = k.indexOf(key);
          v[i < 0 ? k.push(key) - 1 : i] = value;
        }
      };
    } : Map;
  
    var HS = function HS(futureNodes, futureStart, futureEnd, futureChanges, currentNodes, currentStart, currentEnd, currentChanges) {
  
      var k = 0;
      /* istanbul ignore next */
      var minLen = futureChanges < currentChanges ? futureChanges : currentChanges;
      var link = Array(minLen++);
      var tresh = Array(minLen);
      tresh[0] = -1;
  
      for (var i = 1; i < minLen; i++) {
        tresh[i] = currentEnd;
      }var keymap = new Rel();
      for (var _i = currentStart; _i < currentEnd; _i++) {
        keymap.set(currentNodes[_i], _i);
      }for (var _i2 = futureStart; _i2 < futureEnd; _i2++) {
        var idxInOld = keymap.get(futureNodes[_i2]);
        if (idxInOld != null) {
          k = findK(tresh, minLen, idxInOld);
          /* istanbul ignore else */
          if (-1 < k) {
            tresh[k] = idxInOld;
            link[k] = {
              newi: _i2,
              oldi: idxInOld,
              prev: link[k - 1]
            };
          }
        }
      }
  
      k = --minLen;
      --currentEnd;
      while (tresh[k] > currentEnd) {
        --k;
      }minLen = currentChanges + futureChanges - k;
      var diff = Array(minLen);
      var ptr = link[k];
      --futureEnd;
      while (ptr) {
        var _ptr = ptr,
            newi = _ptr.newi,
            oldi = _ptr.oldi;
  
        while (futureEnd > newi) {
          diff[--minLen] = INSERTION;
          --futureEnd;
        }
        while (currentEnd > oldi) {
          diff[--minLen] = DELETION;
          --currentEnd;
        }
        diff[--minLen] = SKIP;
        --futureEnd;
        --currentEnd;
        ptr = ptr.prev;
      }
      while (futureEnd >= futureStart) {
        diff[--minLen] = INSERTION;
        --futureEnd;
      }
      while (currentEnd >= currentStart) {
        diff[--minLen] = DELETION;
        --currentEnd;
      }
      return diff;
    };
  
    // this is pretty much the same petit-dom code without the delete map part
    // https://github.com/yelouafi/petit-dom/blob/bd6f5c919b5ae5297be01612c524c40be45f14a7/src/vdom.js#L556-L561
    var OND = function OND(futureNodes, futureStart, rows, currentNodes, currentStart, cols, compare) {
      var length = rows + cols;
      var v = [];
      var d = void 0,
          k = void 0,
          r = void 0,
          c = void 0,
          pv = void 0,
          cv = void 0,
          pd = void 0;
      outer: for (d = 0; d <= length; d++) {
        /* istanbul ignore if */
        if (d > SKIP_OND) return null;
        pd = d - 1;
        /* istanbul ignore next */
        pv = d ? v[d - 1] : [0, 0];
        cv = v[d] = [];
        for (k = -d; k <= d; k += 2) {
          if (k === -d || k !== d && pv[pd + k - 1] < pv[pd + k + 1]) {
            c = pv[pd + k + 1];
          } else {
            c = pv[pd + k - 1] + 1;
          }
          r = c - k;
          while (c < cols && r < rows && compare(currentNodes[currentStart + c], futureNodes[futureStart + r])) {
            c++;
            r++;
          }
          if (c === cols && r === rows) {
            break outer;
          }
          cv[d + k] = c;
        }
      }
  
      var diff = Array(d / 2 + length / 2);
      var diffIdx = diff.length - 1;
      for (d = v.length - 1; d >= 0; d--) {
        while (c > 0 && r > 0 && compare(currentNodes[currentStart + c - 1], futureNodes[futureStart + r - 1])) {
          // diagonal edge = equality
          diff[diffIdx--] = SKIP;
          c--;
          r--;
        }
        if (!d) break;
        pd = d - 1;
        /* istanbul ignore next */
        pv = d ? v[d - 1] : [0, 0];
        k = c - r;
        if (k === -d || k !== d && pv[pd + k - 1] < pv[pd + k + 1]) {
          // vertical edge = insertion
          r--;
          diff[diffIdx--] = INSERTION;
        } else {
          // horizontal edge = deletion
          c--;
          diff[diffIdx--] = DELETION;
        }
      }
      return diff;
    };
  
    var applyDiff = function applyDiff(diff, get, parentNode, futureNodes, futureStart, currentNodes, currentStart, currentLength, before) {
      var live = new Rel();
      var length = diff.length;
      var currentIndex = currentStart;
      var i = 0;
      while (i < length) {
        switch (diff[i++]) {
          case SKIP:
            futureStart++;
            currentIndex++;
            break;
          case INSERTION:
            // TODO: bulk appends for sequential nodes
            live.set(futureNodes[futureStart], 1);
            append$1(get, parentNode, futureNodes, futureStart++, futureStart, currentIndex < currentLength ? get(currentNodes[currentIndex], 1) : before);
            break;
          case DELETION:
            currentIndex++;
            break;
        }
      }
      i = 0;
      while (i < length) {
        switch (diff[i++]) {
          case SKIP:
            currentStart++;
            break;
          case DELETION:
            // TODO: bulk removes for sequential nodes
            if (live.has(currentNodes[currentStart])) currentStart++;else remove(get, parentNode, currentNodes, currentStart++, currentStart);
            break;
        }
      }
    };
  
    var findK = function findK(ktr, length, j) {
      var lo = 1;
      var hi = length;
      while (lo < hi) {
        var mid = (lo + hi) / 2 >>> 0;
        if (j < ktr[mid]) hi = mid;else lo = mid + 1;
      }
      return lo;
    };
  
    var smartDiff = function smartDiff(get, parentNode, futureNodes, futureStart, futureEnd, futureChanges, currentNodes, currentStart, currentEnd, currentChanges, currentLength, compare, before) {
      applyDiff(OND(futureNodes, futureStart, futureChanges, currentNodes, currentStart, currentChanges, compare) || HS(futureNodes, futureStart, futureEnd, futureChanges, currentNodes, currentStart, currentEnd, currentChanges), get, parentNode, futureNodes, futureStart, currentNodes, currentStart, currentLength, before);
    };
  
    /* AUTOMATICALLY IMPORTED, DO NOT MODIFY */
  
    var domdiff = function domdiff(parentNode, // where changes happen
    currentNodes, // Array of current items/nodes
    futureNodes, // Array of future items/nodes
    options // optional object with one of the following properties
    //  before: domNode
    //  compare(generic, generic) => true if same generic
    //  node(generic) => Node
    ) {
      if (!options) options = {};
  
      var compare = options.compare || eqeq;
      var get = options.node || identity;
      var before = options.before == null ? null : get(options.before, 0);
  
      var currentLength = currentNodes.length;
      var currentEnd = currentLength;
      var currentStart = 0;
  
      var futureEnd = futureNodes.length;
      var futureStart = 0;
  
      // common prefix
      while (currentStart < currentEnd && futureStart < futureEnd && compare(currentNodes[currentStart], futureNodes[futureStart])) {
        currentStart++;
        futureStart++;
      }
  
      // common suffix
      while (currentStart < currentEnd && futureStart < futureEnd && compare(currentNodes[currentEnd - 1], futureNodes[futureEnd - 1])) {
        currentEnd--;
        futureEnd--;
      }
  
      var currentSame = currentStart === currentEnd;
      var futureSame = futureStart === futureEnd;
  
      // same list
      if (currentSame && futureSame) return futureNodes;
  
      // only stuff to add
      if (currentSame && futureStart < futureEnd) {
        append$1(get, parentNode, futureNodes, futureStart, futureEnd, next(get, currentNodes, currentStart, currentLength, before));
        return futureNodes;
      }
  
      // only stuff to remove
      if (futureSame && currentStart < currentEnd) {
        remove(get, parentNode, currentNodes, currentStart, currentEnd);
        return futureNodes;
      }
  
      var currentChanges = currentEnd - currentStart;
      var futureChanges = futureEnd - futureStart;
      var i = -1;
  
      // 2 simple indels: the shortest sequence is a subsequence of the longest
      if (currentChanges < futureChanges) {
        i = indexOf(futureNodes, futureStart, futureEnd, currentNodes, currentStart, currentEnd, compare);
        // inner diff
        if (-1 < i) {
          append$1(get, parentNode, futureNodes, futureStart, i, get(currentNodes[currentStart], 0));
          append$1(get, parentNode, futureNodes, i + currentChanges, futureEnd, next(get, currentNodes, currentEnd, currentLength, before));
          return futureNodes;
        }
      }
      /* istanbul ignore else */
      else if (futureChanges < currentChanges) {
          i = indexOf(currentNodes, currentStart, currentEnd, futureNodes, futureStart, futureEnd, compare);
          // outer diff
          if (-1 < i) {
            remove(get, parentNode, currentNodes, currentStart, i);
            remove(get, parentNode, currentNodes, i + futureChanges, currentEnd);
            return futureNodes;
          }
        }
  
      // common case with one replacement for many nodes
      // or many nodes replaced for a single one
      /* istanbul ignore else */
      if (currentChanges < 2 || futureChanges < 2) {
        append$1(get, parentNode, futureNodes, futureStart, futureEnd, get(currentNodes[currentStart], 0));
        remove(get, parentNode, currentNodes, currentStart, currentEnd);
        return futureNodes;
      }
  
      // the half match diff part has been skipped in petit-dom
      // https://github.com/yelouafi/petit-dom/blob/bd6f5c919b5ae5297be01612c524c40be45f14a7/src/vdom.js#L391-L397
      // accordingly, I think it's safe to skip in here too
      // if one day it'll come out like the speediest thing ever to do
      // then I might add it in here too
  
      // Extra: before going too fancy, what about reversed lists ?
      //        This should bail out pretty quickly if that's not the case.
      if (currentChanges === futureChanges && isReversed(futureNodes, futureEnd, currentNodes, currentStart, currentEnd, compare)) {
        append$1(get, parentNode, futureNodes, futureStart, futureEnd, next(get, currentNodes, currentEnd, currentLength, before));
        return futureNodes;
      }
  
      // last resort through a smart diff
      smartDiff(get, parentNode, futureNodes, futureStart, futureEnd, futureChanges, currentNodes, currentStart, currentEnd, currentChanges, currentLength, compare, before);
  
      return futureNodes;
    };
  
    /* AUTOMATICALLY IMPORTED, DO NOT MODIFY */
    /*! (c) Andrea Giammarchi */
    function disconnected(poly) {
  
      var CONNECTED = 'connected';
      var DISCONNECTED = 'dis' + CONNECTED;
      var Event = poly.Event;
      var WeakSet = poly.WeakSet;
      var notObserving = true;
      var observer = new WeakSet();
      return function observe(node) {
        if (notObserving) {
          notObserving = !notObserving;
          startObserving(node.ownerDocument);
        }
        observer.add(node);
        return node;
      };
      function startObserving(document) {
        var dispatched = null;
        try {
          new MutationObserver(changes).observe(document, { subtree: true, childList: true });
        } catch (o_O) {
          var timer = 0;
          var records = [];
          var reschedule = function reschedule(record) {
            records.push(record);
            clearTimeout(timer);
            timer = setTimeout(function () {
              changes(records.splice(timer = 0, records.length));
            }, 0);
          };
          document.addEventListener('DOMNodeRemoved', function (event) {
            reschedule({ addedNodes: [], removedNodes: [event.target] });
          }, true);
          document.addEventListener('DOMNodeInserted', function (event) {
            reschedule({ addedNodes: [event.target], removedNodes: [] });
          }, true);
        }
        function changes(records) {
          dispatched = new Tracker();
          for (var record, length = records.length, i = 0; i < length; i++) {
            record = records[i];
            dispatchAll(record.removedNodes, DISCONNECTED, CONNECTED);
            dispatchAll(record.addedNodes, CONNECTED, DISCONNECTED);
          }
          dispatched = null;
        }
        function dispatchAll(nodes, type, counter) {
          for (var node, event = new Event(type), length = nodes.length, i = 0; i < length; (node = nodes[i++]).nodeType === 1 && dispatchTarget(node, event, type, counter)) {}
        }
        function dispatchTarget(node, event, type, counter) {
          if (observer.has(node) && !dispatched[type].has(node)) {
            dispatched[counter].delete(node);
            dispatched[type].add(node);
            node.dispatchEvent(event);
            /*
            // The event is not bubbling (perf reason: should it?),
            // hence there's no way to know if
            // stop/Immediate/Propagation() was called.
            // Should DOM Level 0 work at all?
            // I say it's a YAGNI case for the time being,
            // and easy to implement in user-land.
            if (!event.cancelBubble) {
              var fn = node['on' + type];
              if (fn)
                fn.call(node, event);
            }
            */
          }
          for (var children = node.children, length = children.length, i = 0; i < length; dispatchTarget(children[i++], event, type, counter)) {}
        }
        function Tracker() {
          this[CONNECTED] = new WeakSet();
          this[DISCONNECTED] = new WeakSet();
        }
      }
    }
  
    var document$1 = G.document;
  
    var observe = disconnected({ Event: Event, WeakSet: WeakSet });
  
    // a basic dictionary used to filter already cached attributes
    // while looking for special hyperHTML values.
    function Cache() {}
    Cache.prototype = Object.create(null);
  
    // returns an intent to explicitly inject content as html
    var asHTML = function asHTML(html) {
      return { html: html };
    };
  
    // returns nodes from wires and components
    var asNode = function asNode(item, i) {
      return 'ELEMENT_NODE' in item ? item : item.constructor === Wire ?
      // in the Wire case, the content can be
      // removed, post-pended, inserted, or pre-pended and
      // all these cases are handled by domdiff already
      /* istanbul ignore next */
      1 / i < 0 ? i ? item.remove() : item.last : i ? item.valueOf(true) : item.first : asNode(item.render(), i);
    };
  
    // returns true if domdiff can handle the value
    var canDiff = function canDiff(value) {
      return 'ELEMENT_NODE' in value || value instanceof Wire || value instanceof Component;
    };
  
    // updates are created once per context upgrade
    // within the main render function (../hyper/render.js)
    // These are an Array of callbacks to invoke passing
    // each interpolation value.
    // Updates can be related to any kind of content,
    // attributes, or special text-only cases such <style>
    // elements or <textarea>
    var create$1 = function create$$1(root, paths) {
      var updates = [];
      var length = paths.length;
      for (var i = 0; i < length; i++) {
        var info = paths[i];
        var node = Path.find(root, info.path);
        switch (info.type) {
          case 'any':
            updates.push(setAnyContent(node, []));
            break;
          case 'attr':
            updates.push(setAttribute(node, info.name, info.node));
            break;
          case 'text':
            updates.push(setTextContent(node));
            node.textContent = '';
            break;
        }
      }
      return updates;
    };
  
    // finding all paths is a one-off operation performed
    // when a new template literal is used.
    // The goal is to map all target nodes that will be
    // used to update content/attributes every time
    // the same template literal is used to create content.
    // The result is a list of paths related to the template
    // with all the necessary info to create updates as
    // list of callbacks that target directly affected nodes.
    var find = function find(node, paths, parts) {
      var childNodes = node.childNodes;
      var length = childNodes.length;
      for (var i = 0; i < length; i++) {
        var child = childNodes[i];
        switch (child.nodeType) {
          case ELEMENT_NODE:
            findAttributes$1(child, paths, parts);
            find(child, paths, parts);
            break;
          case COMMENT_NODE:
            if (child.textContent === UID) {
              parts.shift();
              paths.push(
              // basicHTML or other non standard engines
              // might end up having comments in nodes
              // where they shouldn't, hence this check.
              SHOULD_USE_TEXT_CONTENT.test(node.nodeName) ? Path.create('text', node) : Path.create('any', child));
            }
            break;
          case TEXT_NODE:
            // the following ignore is actually covered by browsers
            // only basicHTML ends up on previous COMMENT_NODE case
            // instead of TEXT_NODE because it knows nothing about
            // special style or textarea behavior
            /* istanbul ignore if */
            if (SHOULD_USE_TEXT_CONTENT.test(node.nodeName) && trim.call(child.textContent) === UIDC) {
              parts.shift();
              paths.push(Path.create('text', node));
            }
            break;
        }
      }
    };
  
    // attributes are searched via unique hyperHTML id value.
    // Despite HTML being case insensitive, hyperHTML is able
    // to recognize attributes by name in a caseSensitive way.
    // This plays well with Custom Elements definitions
    // and also with XML-like environments, without trusting
    // the resulting DOM but the template literal as the source of truth.
    // IE/Edge has a funny bug with attributes and these might be duplicated.
    // This is why there is a cache in charge of being sure no duplicated
    // attributes are ever considered in future updates.
    var findAttributes$1 = function findAttributes(node, paths, parts) {
      var cache = new Cache();
      var attributes = node.attributes;
      var array = slice.call(attributes);
      var remove = [];
      var length = array.length;
      for (var i = 0; i < length; i++) {
        var attribute = array[i];
        if (attribute.value === UID) {
          var name = attribute.name;
          // the following ignore is covered by IE
          // and the IE9 double viewBox test
          /* istanbul ignore else */
          if (!(name in cache)) {
            var realName = parts.shift().replace(/^(?:|[\S\s]*?\s)(\S+?)=['"]?$/, '$1');
            cache[name] = attributes[realName] ||
            // the following ignore is covered by browsers
            // while basicHTML is already case-sensitive
            /* istanbul ignore next */
            attributes[realName.toLowerCase()];
            paths.push(Path.create('attr', cache[name], realName));
          }
          remove.push(attribute);
        }
      }
      var len = remove.length;
      for (var _i = 0; _i < len; _i++) {
        // Edge HTML bug #16878726
        var _attribute = remove[_i];
        if (/^id$/i.test(_attribute.name)) node.removeAttribute(_attribute.name);
        // standard browsers would work just fine here
        else node.removeAttributeNode(remove[_i]);
      }
  
      // This is a very specific Firefox/Safari issue
      // but since it should be a not so common pattern,
      // it's probably worth patching regardless.
      // Basically, scripts created through strings are death.
      // You need to create fresh new scripts instead.
      // TODO: is there any other node that needs such nonsense?
      var nodeName = node.nodeName;
      if (/^script$/i.test(nodeName)) {
        // this used to be like that
        // const script = createElement(node, nodeName);
        // then Edge arrived and decided that scripts created
        // through template documents aren't worth executing
        // so it became this ... hopefully it won't hurt in the wild
        var script = document$1.createElement(nodeName);
        for (var _i2 = 0; _i2 < attributes.length; _i2++) {
          script.setAttributeNode(attributes[_i2].cloneNode(true));
        }
        script.textContent = node.textContent;
        node.parentNode.replaceChild(script, node);
      }
    };
  
    // when a Promise is used as interpolation value
    // its result must be parsed once resolved.
    // This callback is in charge of understanding what to do
    // with a returned value once the promise is resolved.
    var invokeAtDistance = function invokeAtDistance(value, callback) {
      callback(value.placeholder);
      if ('text' in value) {
        Promise.resolve(value.text).then(String).then(callback);
      } else if ('any' in value) {
        Promise.resolve(value.any).then(callback);
      } else if ('html' in value) {
        Promise.resolve(value.html).then(asHTML).then(callback);
      } else {
        Promise.resolve(Intent.invoke(value, callback)).then(callback);
      }
    };
  
    // quick and dirty way to check for Promise/ish values
    var isPromise_ish = function isPromise_ish(value) {
      return value != null && 'then' in value;
    };
  
    // list of attributes that should not be directly assigned
    var readOnly = /^(?:form|list)$/i;
  
    // in a hyper(node)`<div>${content}</div>` case
    // everything could happen:
    //  * it's a JS primitive, stored as text
    //  * it's null or undefined, the node should be cleaned
    //  * it's a component, update the content by rendering it
    //  * it's a promise, update the content once resolved
    //  * it's an explicit intent, perform the desired operation
    //  * it's an Array, resolve all values if Promises and/or
    //    update the node with the resulting list of content
    var setAnyContent = function setAnyContent(node, childNodes) {
      var diffOptions = { node: asNode, before: node };
      var fastPath = false;
      var oldValue = void 0;
      var anyContent = function anyContent(value) {
        switch (typeof value) {
          case 'string':
          case 'number':
          case 'boolean':
            if (fastPath) {
              if (oldValue !== value) {
                oldValue = value;
                childNodes[0].textContent = value;
              }
            } else {
              fastPath = true;
              oldValue = value;
              childNodes = domdiff(node.parentNode, childNodes, [text(node, value)], diffOptions);
            }
            break;
          case 'function':
            anyContent(value(node));
            break;
          case 'object':
          case 'undefined':
            if (value == null) {
              fastPath = false;
              childNodes = domdiff(node.parentNode, childNodes, [], diffOptions);
              break;
            }
          default:
            fastPath = false;
            oldValue = value;
            if (isArray(value)) {
              if (value.length === 0) {
                if (childNodes.length) {
                  childNodes = domdiff(node.parentNode, childNodes, [], diffOptions);
                }
              } else {
                switch (typeof value[0]) {
                  case 'string':
                  case 'number':
                  case 'boolean':
                    anyContent({ html: value });
                    break;
                  case 'object':
                    if (isArray(value[0])) {
                      value = value.concat.apply([], value);
                    }
                    if (isPromise_ish(value[0])) {
                      Promise.all(value).then(anyContent);
                      break;
                    }
                  default:
                    childNodes = domdiff(node.parentNode, childNodes, value, diffOptions);
                    break;
                }
              }
            } else if (canDiff(value)) {
              childNodes = domdiff(node.parentNode, childNodes, value.nodeType === DOCUMENT_FRAGMENT_NODE ? slice.call(value.childNodes) : [value], diffOptions);
            } else if (isPromise_ish(value)) {
              value.then(anyContent);
            } else if ('placeholder' in value) {
              invokeAtDistance(value, anyContent);
            } else if ('text' in value) {
              anyContent(String(value.text));
            } else if ('any' in value) {
              anyContent(value.any);
            } else if ('html' in value) {
              childNodes = domdiff(node.parentNode, childNodes, slice.call(createFragment(node, [].concat(value.html).join('')).childNodes), diffOptions);
            } else if ('length' in value) {
              anyContent(slice.call(value));
            } else {
              anyContent(Intent.invoke(value, anyContent));
            }
            break;
        }
      };
      return anyContent;
    };
  
    // there are four kind of attributes, and related behavior:
    //  * events, with a name starting with `on`, to add/remove event listeners
    //  * special, with a name present in their inherited prototype, accessed directly
    //  * regular, accessed through get/setAttribute standard DOM methods
    //  * style, the only regular attribute that also accepts an object as value
    //    so that you can style=${{width: 120}}. In this case, the behavior has been
    //    fully inspired by Preact library and its simplicity.
    var setAttribute = function setAttribute(node, name, original) {
      var isSVG = OWNER_SVG_ELEMENT in node;
      var oldValue = void 0;
      // if the attribute is the style one
      // handle it differently from others
      if (name === 'style') {
        return Style(node, original, isSVG);
      }
      // the name is an event one,
      // add/remove event listeners accordingly
      else if (/^on/.test(name)) {
          var type = name.slice(2);
          if (type === CONNECTED || type === DISCONNECTED) {
            observe(node);
          } else if (name.toLowerCase() in node) {
            type = type.toLowerCase();
          }
          return function (newValue) {
            if (oldValue !== newValue) {
              if (oldValue) node.removeEventListener(type, oldValue, false);
              oldValue = newValue;
              if (newValue) node.addEventListener(type, newValue, false);
            }
          };
        }
        // the attribute is special ('value' in input)
        // and it's not SVG *or* the name is exactly data,
        // in this case assign the value directly
        else if (name === 'data' || !isSVG && name in node && !readOnly.test(name)) {
            return function (newValue) {
              if (oldValue !== newValue) {
                oldValue = newValue;
                if (node[name] !== newValue) {
                  node[name] = newValue;
                  if (newValue == null) {
                    node.removeAttribute(name);
                  }
                }
              }
            };
          } else if (name in Intent.attributes) {
            return function (any) {
              oldValue = Intent.attributes[name](node, any);
              node.setAttribute(name, oldValue == null ? '' : oldValue);
            };
          }
          // in every other case, use the attribute node as it is
          // update only the value, set it as node only when/if needed
          else {
              var owner = false;
              var attribute = original.cloneNode(true);
              return function (newValue) {
                if (oldValue !== newValue) {
                  oldValue = newValue;
                  if (attribute.value !== newValue) {
                    if (newValue == null) {
                      if (owner) {
                        owner = false;
                        node.removeAttributeNode(attribute);
                      }
                      attribute.value = newValue;
                    } else {
                      attribute.value = newValue;
                      if (!owner) {
                        owner = true;
                        node.setAttributeNode(attribute);
                      }
                    }
                  }
                }
              };
            }
    };
  
    // style or textareas don't accept HTML as content
    // it's pointless to transform or analyze anything
    // different from text there but it's worth checking
    // for possible defined intents.
    var setTextContent = function setTextContent(node) {
      var oldValue = void 0;
      var textContent = function textContent(value) {
        if (oldValue !== value) {
          oldValue = value;
          var type = typeof value;
          if (type === 'object' && value) {
            if (isPromise_ish(value)) {
              value.then(textContent);
            } else if ('placeholder' in value) {
              invokeAtDistance(value, textContent);
            } else if ('text' in value) {
              textContent(String(value.text));
            } else if ('any' in value) {
              textContent(value.any);
            } else if ('html' in value) {
              textContent([].concat(value.html).join(''));
            } else if ('length' in value) {
              textContent(slice.call(value).join(''));
            } else {
              textContent(Intent.invoke(value, textContent));
            }
          } else if (type === 'function') {
            textContent(value(node));
          } else {
            node.textContent = value == null ? '' : value;
          }
        }
      };
      return textContent;
    };
  
    var Updates = { create: create$1, find: find };
  
    // a weak collection of contexts that
    // are already known to hyperHTML
    var bewitched = new WeakMap();
  
    // all unique template literals
    var templates = TemplateMap();
  
    // better known as hyper.bind(node), the render is
    // the main tag function in charge of fully upgrading
    // or simply updating, contexts used as hyperHTML targets.
    // The `this` context is either a regular DOM node or a fragment.
    function render(template) {
      var wicked = bewitched.get(this);
      if (wicked && wicked.template === unique(template)) {
        update$1.apply(wicked.updates, arguments);
      } else {
        upgrade.apply(this, arguments);
      }
      return this;
    }
  
    // an upgrade is in charge of collecting template info,
    // parse it once, if unknown, to map all interpolations
    // as single DOM callbacks, relate such template
    // to the current context, and render it after cleaning the context up
    function upgrade(template) {
      template = unique(template);
      var info = templates.get(template) || createTemplate.call(this, template);
      var fragment = importNode(this.ownerDocument, info.fragment);
      var updates = Updates.create(fragment, info.paths);
      bewitched.set(this, { template: template, updates: updates });
      update$1.apply(updates, arguments);
      this.textContent = '';
      this.appendChild(fragment);
    }
  
    // an update simply loops over all mapped DOM operations
    function update$1() {
      var length = arguments.length;
      for (var i = 1; i < length; i++) {
        this[i - 1](arguments[i]);
      }
    }
  
    // a template can be used to create a document fragment
    // aware of all interpolations and with a list
    // of paths used to find once those nodes that need updates,
    // no matter if these are attributes, text nodes, or regular one
    function createTemplate(template) {
      var paths = [];
      var html = template.join(UIDC).replace(SC_RE, SC_PLACE);
      var fragment = createFragment(this, html);
      Updates.find(fragment, paths, template.slice());
      var info = { fragment: fragment, paths: paths };
      templates.set(template, info);
      return info;
    }
  
    // some node could be special though, like a custom element
    // with a self closing tag, which should work through these changes.
    var SC_RE = selfClosing;
    var SC_PLACE = function SC_PLACE($0, $1, $2) {
      return VOID_ELEMENTS.test($1) ? $0 : '<' + $1 + $2 + '></' + $1 + '>';
    };
  
    // all wires used per each context
    var wires = new WeakMap();
  
    // A wire is a callback used as tag function
    // to lazily relate a generic object to a template literal.
    // hyper.wire(user)`<div id=user>${user.name}</div>`; => the div#user
    // This provides the ability to have a unique DOM structure
    // related to a unique JS object through a reusable template literal.
    // A wire can specify a type, as svg or html, and also an id
    // via html:id or :id convention. Such :id allows same JS objects
    // to be associated to different DOM structures accordingly with
    // the used template literal without losing previously rendered parts.
    var wire = function wire(obj, type) {
      return obj == null ? content(type || 'html') : weakly(obj, type || 'html');
    };
  
    // A wire content is a virtual reference to one or more nodes.
    // It's represented by either a DOM node, or an Array.
    // In both cases, the wire content role is to simply update
    // all nodes through the list of related callbacks.
    // In few words, a wire content is like an invisible parent node
    // in charge of updating its content like a bound element would do.
    var content = function content(type) {
      var wire = void 0,
          container = void 0,
          content = void 0,
          template = void 0,
          updates = void 0;
      return function (statics) {
        statics = unique(statics);
        var setup = template !== statics;
        if (setup) {
          template = statics;
          content = fragment(document);
          container = type === 'svg' ? document.createElementNS(SVG_NAMESPACE, 'svg') : content;
          updates = render.bind(container);
        }
        updates.apply(null, arguments);
        if (setup) {
          if (type === 'svg') {
            append(content, slice.call(container.childNodes));
          }
          wire = wireContent(content);
        }
        return wire;
      };
    };
  
    // wires are weakly created through objects.
    // Each object can have multiple wires associated
    // and this is thanks to the type + :id feature.
    var weakly = function weakly(obj, type) {
      var i = type.indexOf(':');
      var wire = wires.get(obj);
      var id = type;
      if (-1 < i) {
        id = type.slice(i + 1);
        type = type.slice(0, i) || 'html';
      }
      if (!wire) wires.set(obj, wire = {});
      return wire[id] || (wire[id] = content(type));
    };
  
    // a document fragment loses its nodes as soon
    // as it's appended into another node.
    // This would easily lose wired content
    // so that on a second render call, the parent
    // node wouldn't know which node was there
    // associated to the interpolation.
    // To prevent hyperHTML to forget about wired nodes,
    // these are either returned as Array or, if there's ony one entry,
    // as single referenced node that won't disappear from the fragment.
    // The initial fragment, at this point, would be used as unique reference.
    var wireContent = function wireContent(node) {
      var childNodes = node.childNodes;
      var length = childNodes.length;
      var wireNodes = [];
      for (var i = 0; i < length; i++) {
        var child = childNodes[i];
        if (child.nodeType === ELEMENT_NODE || trim.call(child.textContent).length !== 0) {
          wireNodes.push(child);
        }
      }
      return wireNodes.length === 1 ? wireNodes[0] : new Wire(wireNodes);
    };
  
    /*! (c) Andrea Giammarchi (ISC) */
  
    // all functions are self bound to the right context
    // you can do the following
    // const {bind, wire} = hyperHTML;
    // and use them right away: bind(node)`hello!`;
    var bind = function bind(context) {
      return render.bind(context);
    };
    var define = Intent.define;
  
    hyper.Component = Component;
    hyper.bind = bind;
    hyper.define = define;
    hyper.diff = domdiff;
    hyper.hyper = hyper;
    hyper.observe = observe;
    hyper.wire = wire;
  
    // exported as shared utils
    // for projects based on hyperHTML
    // that don't necessarily need upfront polyfills
    // i.e. those still targeting IE
    hyper._ = {
      global: G,
      WeakMap: WeakMap,
      WeakSet: WeakSet
    };
  
    // the wire content is the lazy defined
    // html or svg property of each hyper.Component
    setup(content);
  
    // by default, hyperHTML is a smart function
    // that "magically" understands what's the best
    // thing to do with passed arguments
    function hyper(HTML) {
      return arguments.length < 2 ? HTML == null ? content('html') : typeof HTML === 'string' ? hyper.wire(null, HTML) : 'raw' in HTML ? content('html')(HTML) : 'nodeType' in HTML ? hyper.bind(HTML) : weakly(HTML, 'html') : ('raw' in HTML ? content('html') : hyper.wire).apply(null, arguments);
    }
  
    
    
    
    
    
    
    
    
  
    return hyper;
  
  }(window));