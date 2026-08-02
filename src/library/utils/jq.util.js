(() => {

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
        var self = this || this_obj, args = arguments;
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
  })(jQuery);

  (function ($) {
    // AOP around the dispatcher for any exception thrown from event handlers
    let originalEventDispatch = $.event.dispatch;
    $.event.dispatch = function () {
      try {
        originalEventDispatch.apply(this, arguments);
      } catch (error) {
        console.error("Uncaught event", error, this);
        throw error;
      }
    };

    // Actively close tooltips of element and its children
    $.fn.hideChildrenTooltips = function () {
      $.each($("[title]:not([disabled]),[titlealt]:not([disabled])", this), function (_, el) {
        if (typeof $(el).tooltip("instance") !== "undefined")
          $(el).tooltip("close");
      });
      return this;
    };

    // Create native-like tooltips of element and its children
    $.fn.createChildrenTooltips = function () {
      $.each($("[title]:not([disabled])", this), function (_, el) {
        $(el).lazyInitTooltip();
      });
      return this;
    };
  }(jQuery));

})();
