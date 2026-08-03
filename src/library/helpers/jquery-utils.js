/**
 * KC3改 extended utilities for jquery & jquery-ui, so must be loaded after jquery.
 */
(() => {
  "use strict";

  /**
   * Simulate throttle/debounce func like the ones in lodash
   * docs see: https://github.com/cowboy/jquery-throttle-debounce
   * note: not actually depend on jQuery, just bind them to $
   */
  (function ($) {
    var jq_throttle = function (delay, no_trailing, callback, this_obj, debounce_mode) {
      var timeout_id, last_exec = 0;
      if (typeof no_trailing !== 'boolean') {
        debounce_mode = callback;
        callback = no_trailing;
        no_trailing = undefined;
      }
      function wrapper() {
        /* jshint validthis:true */
        var self = this || this_obj;
        var args = arguments;
        var elapsed = Date.now() - last_exec;
        function exec() {
          last_exec = Date.now();
          callback.apply(self, args);
        }
        function clear() {
          timeout_id = undefined;
        }
        if (debounce_mode && !timeout_id) {
          exec();
        }
        if (timeout_id) {
          clearTimeout(timeout_id);
        }
        if (debounce_mode === undefined && elapsed > delay) {
          exec();
        } else if (no_trailing !== true) {
          timeout_id = setTimeout(debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay);
        }
      }
      if ($.guid) {
        wrapper.guid = callback.guid = callback.guid || $.guid++;
      }
      return wrapper;
    };
    $.throttle = jq_throttle;
    $.debounce = function (delay, at_begin, callback, this_obj) {
      return callback === undefined
        ? jq_throttle(delay, at_begin, false)
        : jq_throttle(delay, callback, at_begin !== false, this_obj);
    };
  }(jQuery));


  /**
   * jQuery Unveil
   * A very lightweight jQuery plugin to lazy load images
   * https://luis-almeida.github.com/unveil
   *
   * Licensed under the MIT license.
   * Copyright 2013 Luís Almeida
   * https://github.com/luis-almeida
   *
   * with some modifications for working on a div container instead of window
   */
  (function ($) {
    $.fn.unveil = function (container, threshold, callback) {
      var $w = $(window),
        $con = $(container) || $w,
        th = threshold || 0,
        attrib = "data-src",
        images = this,
        loaded;
      this.one("unveil", function () {
        var source = this.getAttribute(attrib);
        source = source || this.getAttribute("data-src");
        if (source) {
          this.setAttribute("src", source);
          if (typeof callback === "function") callback.call(this);
        }
      });

      function unveil() {
        var inview = images.filter(function () {
          var $e = $(this);
          if ($e.is(":hidden")) return;
          var wt = $con.scrollTop(),
            wb = wt + $con.height(),
            et = wt + $e.offset().top - $con.offset().top,
            eb = et + $e.height();
          return eb >= wt - th && et <= wb + th;
        });
        loaded = inview.trigger("unveil");
        images = images.not(loaded);
      }

      $con.on("scroll.unveil resize.unveil lookup.unveil", unveil);
      unveil();
      return this;
    };
  }(jQuery));


  /**
   * jQuery Visible/Unvisible plugin, v2.0.3 modded
   * Copyright (c) 2017-2018 Dmitry Zavodnikov.
   * Licensed under the MIT License.
   *
   * By using DOM `Mutation Observer API` (chrome m18),
   * binds some event functions to an element like `$.fn.on()`,
   * triggered on some kind of changes (here visibility) occurred on the element.
   *
   * Alt full ver: https://github.com/kapetan/jquery-observe
   */
  (function ($) {
    var BECAME_VISIBLE_MESSAGE   = 'visible';
    var BECAME_UNVISIBLE_MESSAGE = 'invisible';
    var unvisibleSet = [];

    function isVisible(element) {
      return $(element).is(':visible');
    }
    function inUnvisibleSet(element) {
      return unvisibleSet.indexOf(element) !== -1;
    }
    function isElement(element) {
      return element.nodeType === 1;
    }
    function addToUnvisibleSet(element) {
      if (!inUnvisibleSet(element) && isElement(element)) {
        unvisibleSet.push(element);
      }
    }
    function removeFromUnvisibleSet(element) {
      var idx = unvisibleSet.indexOf(element);
      if (idx != -1) {
        unvisibleSet.splice(idx, 1);
      }
    }
    function initUnvisibleSet(element) {
      element.childNodes.forEach(function(child) {
        if (!isVisible(child)) {
          sendMessage(child, BECAME_UNVISIBLE_MESSAGE);
          addToUnvisibleSet(child);
        } else {
          sendMessage(child, BECAME_VISIBLE_MESSAGE);
          initUnvisibleSet(child);
        }
      });
    }
    function sendMessage(element, msg) {
      $(element).trigger(msg);
    }
    function sendTreeMessage(element, msg) {
      sendMessage(element, msg);
      element.childNodes.forEach(function(child) {
        sendTreeMessage(child, msg);
      });
    }
    function becameVisible(element) {
      removeFromUnvisibleSet(element);
      sendTreeMessage(element, BECAME_VISIBLE_MESSAGE);
    }
    function becameUnvisible(element) {
      addToUnvisibleSet(element);
      sendTreeMessage(element, BECAME_UNVISIBLE_MESSAGE);
    }

    function bindVisibleUnvisible() {
      // Select the target element
      var target = $('body').get(0);
      // Choose browser-specific MutationObserver
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

      // Create an observer instance
      var observer = new MutationObserver(function(mutations) {
        mutations.map(function(mutation) {
          return mutation.target;
        }).forEach(function(element) {
          if (inUnvisibleSet(element)) {
            if (isVisible(element)) {
              becameVisible(element);
            }
          } else {
            if (!isVisible(element)) {
              becameUnvisible(element);
            }
          }
        });
      });

      // Configuration of the observer
      var config = {
        childList:              false,
        attributes:             true,
        characterData:          false,
        subtree:                true,
        attributeOldValue:      false,
        characterDataOldValue:  false,
        attributeFilter:        ['class', 'style']
      };
      // Pass in the target element, as well as the observer options
      observer.observe(target, config);
    }

    $.bindVisibleObserver = function() {
      initUnvisibleSet($('body').get(0));
      bindVisibleUnvisible();
    };
  }(jQuery));


  (function ($) {
    // AOP around the dispatcher for any exception thrown from event handlers
    const originalEventDispatch = $.event.dispatch;
    $.event.dispatch = function () {
      try {
        originalEventDispatch.apply(this, arguments);
      } catch (error) {
        console.error("Uncaught event", error, this);
        throw error;
      }
    };

    // A jquery-ui tooltip options like native one
    const nativeTooltipOptions = {
      position: { my: "left top", at: "left+25 bottom", collision: "flipfit" },
      items: "[title],[titlealt]",
      content: function () {
        // Default escaping not used, keep html, simulate native one
        return ($(this).attr("title") || $(this).attr("titlealt") || "")
          .replace(/\n/g, "<br/>")
          .replace(/\t/g, "&emsp;&emsp;");
      }
    };

    // A lazy initializing method, prevent duplicate tooltip instance
    $.fn.lazyInitTooltip = function (opts, isExtendDefault = true) {
      if (typeof this.tooltip("instance") === "undefined") {
        this.tooltip(isExtendDefault ?
          $.extend(true, {}, nativeTooltipOptions, opts) :
          opts || nativeTooltipOptions
        );
      }
      return this;
    };

    // Create native-like tooltips of element and its children
    $.fn.createChildrenTooltips = function () {
      $.each($("[title]:not([disabled])", this), function (_, el) {
        $(el).lazyInitTooltip();
      });
      return this;
    };

    // Actively close tooltips of element and its children
    $.fn.hideChildrenTooltips = function () {
      $.each($("[title]:not([disabled]),[titlealt]:not([disabled])", this), function (_, el) {
        if (typeof $(el).tooltip("instance") !== "undefined")
          $(el).tooltip("close");
      });
      return this;
    };

  }(jQuery));

})();
