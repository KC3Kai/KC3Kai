/**
 * Common functions for KC3 devtool theme
 */
(() => {
  function Util() {
  }

  Util.prototype.setListener = function (listener) {
    this.listener = listener;
  };

  Util.prototype.addCommonControls = function () {
    // Fleet/LBAS view toggled by mousewheel
    $(".module.controls")
      .on('mousewheel', (ev) => {
        const scrollableContainer = $(".module.controls .scrollable").get(0);
        if (scrollableContainer === ev.originalEvent.target
          || scrollableContainer === ev.originalEvent.target.parentNode
          || scrollableContainer === ev.originalEvent.target.parentNode.parentNode) {
          return;
        }
        const btns = $(".module.controls .control[class*='fleet_']");
        const curIndex = btns.filter(".active").index();
        const newIndex = (curIndex + (ev.originalEvent.deltaY > 0 ? 1 : -1))
          .wrap(0, btns.length - 1);
        if (newIndex === curIndex) return;
        btns.removeClass('active');
        btns.eq(newIndex).addClass('active');
      })
      // Action that runs only after the user stops wheeling
      .on('mousewheel', $.debounce(300, (ev) => {
        $(".module.controls .control[class*='fleet_'].active").trigger('click');
      }));

    const scrollControlButtons = (setScrollLeft) => {
      const buttonCount = $(".module.controls .control_btn").length;
      const buttonSize = $(".module.controls .control_btn").outerWidth(true);
      const containerSize = $(".module.controls .scrollable").outerWidth(true);
      const maxLeft = buttonSize * (buttonCount - Math.floor(containerSize / buttonSize));
      const currentLeft = $(".module.controls .scrollable").scrollLeft();
      const newLeft = setScrollLeft(currentLeft, buttonSize, maxLeft);
      $(".module.controls .scroll_left").toggleClass("disabled", newLeft <= 0);
      $(".module.controls .scroll_right").toggleClass("disabled", newLeft >= maxLeft);
    };

    // Scrollable control buttons by mousewheel
    $(".module.controls .control_btns").on("mousewheel", (ev) => {
      scrollControlButtons((currentLeft, buttonSize, maxLeft) => {
        const newLeft = (currentLeft + buttonSize * (ev.originalEvent.deltaY > 0 ? 1 : -1))
          .clamp(0, maxLeft);
        ev.currentTarget.scroll({ left: newLeft, behavior: "smooth" });
        return newLeft;
      });
    });

    // Scrollable control buttons by clicking side arrows
    $(".module.controls .scroll_btn").on("click", (ev) => {
      scrollControlButtons((currentLeft, buttonSize, maxLeft) => {
        const goLeft = $(ev.target).hasClass("scroll_left");
        const newLeft = (currentLeft + (goLeft ? -buttonSize : buttonSize))
          .clamp(0, maxLeft);
        $(".module.controls .scrollable").scrollLeft(newLeft);
        return newLeft;
      });
    });
  };

  Util.prototype.addCommonActivity = function () {
    const self = this;

    // Switching Activity Tabs
    $(".module.activity .activity_tabs").on("mousewheel", (ev) => {
      const tabs = $(".module.activity .activity_tab");
      const curIndex = tabs.filter(".active").index();
      const newIndex = (curIndex + (ev.originalEvent.deltaY > 0 ? 1 : -1))
        .wrap(0, tabs.length - 1);
      if (newIndex === curIndex) return;
      tabs.eq(newIndex).trigger("click");
    });

    $(".module.activity .activity_tab").on("click", function () {
      const target = $(this).data("target");
      $(".module.activity .activity_tab").removeClass("active");
      $(this).addClass("active");
      $(".module.activity .activity_box").hide();
      if (target === "expeditionPlanner") {
        self.listener.UpdateExpeditionPlanner();
      }
      $(".module.activity .activity_" + target).show();
    });

    $(".module.activity .activity_tab.active").trigger("click");

    $(".module.activity .activity_dismissable").on("click", function () {
      $("#atab_basic").trigger("click");
    });
  };

  Util.prototype.addToggleSounds = function () {
    // Mute button
    $(".module.controls .btn_mute").on("click", function () {
      // Send toggle sound request to service to be forwarded to gameplay page
      (new RMsg("service", "toggleSounds", {
        tabId: chrome.devtools.inspectedWindow.tabId
      }, function (isMuted) {
        $(".module.controls .btn_mute img")
          .attr("src", "../../../../assets/img/ui/mute{0}.png".format(isMuted ? "-x" : ""));
      })).execute();
    });
  };

  Util.prototype.addFitScreen = function () {
    // Resize window to 1200x720
    $(".module.controls .btn_resize").on("click", function () {
      // Send fit-screen request to service to be forwarded to gameplay page
      (new RMsg("service", "fitScreen", {
        tabId: chrome.devtools.inspectedWindow.tabId
      })).execute();
    });
  };

  Util.prototype.addReloadQuotes = function () {
    // Reload subtitle quotes
    $(".module.controls .btn_reload_quotes").on("click", function () {
      // TODO request latest quotes.json for current lang from remote repo
      // Tell game screen tab use latest meta
      (new RMsg("service", "reloadMeta", {
        tabId: chrome.devtools.inspectedWindow.tabId,
        type: "Quotes"
      })).execute();
      // TODO add UI response to show reloading status
    });
  };

  Util.prototype.addReloadQuests = function () {
    // Reload meta of quests
    $(".module.controls .btn_reload_quests").on("click", function () {
      // TODO request latest quests.json for both EN and current lang from remote repo
      KC3Meta.reloadQuests();
      // Tell game screen tab use latest meta
      (new RMsg("service", "reloadMeta", {
        tabId: chrome.devtools.inspectedWindow.tabId,
        type: "Quests"
      })).execute();
      // TODO add UI response to show reloading status
    });
  };

  window.KC3ThemeUtil = new Util();

})();
