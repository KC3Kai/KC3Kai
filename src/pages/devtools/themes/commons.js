/**
 * Common utility functions for KC3改 devtool themes.
 *
 * Kanji `Kai` here helps both human and text editor to recognize this file as UTF-8 without BOM.
 * If you dont see a kanji there, please set your editor for re-loading with UTF-8 charset.
 */
(() => {
  "use strict";

  // #region Core

  function Utils() {
    this.supports = ["natsuiro", "moonlight", "murasaki", "plain"];
  }

  Utils.prototype.setListener = function (listener) {
    this.listener = listener;
  };

  window.KC3ThemeUtils = new Utils();

  // #endregion Core

  // #region Static constants

  KC3ThemeUtils.LOG3 = Math.log10(3);

  // #endregion Static constants

  // #region Initialization

  Utils.prototype.initDataManagers = function () {
    // Initialize data managers
    ConfigManager.load();
    KC3Master.init();
    RemodelDb.init();
    WhoCallsTheFleetDb.init("../../../../");
    KC3Meta.init("../../../../data/");
    KC3Master.loadAbyssalShips("../../../../data/");
    KC3Meta.defaultIcon("../../../../assets/img/ui/empty.png");
    KC3Meta.loadQuotes();
    PlayerManager.init();
    PlayerManager.loadConsumables();
    KC3ShipManager.load();
    KC3GearManager.load();
    KC3SortieManager.load();
    KC3Database.init();
    KC3Translation.execute();
    KC3QuestSync.init();
  };

  Utils.prototype.initLiveTranslations = function () {
    // Live translations of Quests, only work for EN
    if (ConfigManager.checkLiveQuests && ConfigManager.language == "en") {
      $.ajax({
        async: true,
        dataType: "JSON",
        url: "https://raw.githubusercontent.com/KC3Kai/kc3-translations/master/data/" + ConfigManager.language + "/quests.json?v=" + (Date.now()),
        success: function (newQuestTLs) {
          if (JSON.stringify(newQuestTLs) !== JSON.stringify(KC3Meta._quests)) {
            var enQuests = JSON.parse($.ajax({
              url: '../../../../data/lang/data/en/quests.json',
              async: false
            }).responseText);
            KC3Meta._quests = $.extend(true, enQuests, newQuestTLs);
            //console.debug(KC3Meta._quests);
            console.info("New quests detected, live updated");/*RemoveLogging:skip*/
            // Only update meta when en translations actually get updated
            $.ajax({
              async: true,
              dataType: "JSON",
              url: "https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/data/quests_meta.json?v=" + (Date.now()),
              success: function (newQuestMeta) {
                if (JSON.stringify(newQuestMeta) !== JSON.stringify(KC3Meta._questsMeta)) {
                  KC3Meta._questsMeta = newQuestMeta;
                  console.info("Quests meta live updated");/*RemoveLogging:skip*/
                }
              }
            });
          } else {
            console.info("Quests is up to date");
          }
        }
      });
    }
  };

  Utils.prototype.activateGame = function () {
    // Attempt to activate game on inspected window
    (new RMsg("service", "activateGame", {
      tabId: chrome.devtools.inspectedWindow.tabId
    })).execute();
  };

  // #endregion Initialization Blocks

  // #region UI Event Binding

  Utils.prototype.addCommonControls = function () {
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

  Utils.prototype.addCommonActivity = function () {
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

  Utils.prototype.addToggleSounds = function () {
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

  Utils.prototype.addFitScreen = function () {
    // Resize window to 1200x720
    $(".module.controls .btn_resize").on("click", function () {
      // Send fit-screen request to service to be forwarded to gameplay page
      (new RMsg("service", "fitScreen", {
        tabId: chrome.devtools.inspectedWindow.tabId
      })).execute();
    });
  };

  Utils.prototype.addReloadQuotes = function () {
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

  Utils.prototype.addReloadQuests = function () {
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

  // #endregion UI Event Binding

  // #region Fleet & Expedition

  /**
   * make sure localStorage.expedTab is available
   * and is in correct format.
   * returns the configuration for expedTab
   * (previously called localStorage.expedTabLastPick)
   */
  Utils.prototype.ExpedTabValidateConfig = function (idToValid) {
    // data format for expedTab:
    // data.fleetConf: an object
    // data.fleetConf[fleetNum]:
    // * fleetNum: 1,2,3,4
    // * fleetNum could be either number or string
    //   they will all be implicitly converted
    //   to string (for indexing object) anyway
    // data.fleetConf[fleetNum].expedition: a number
    // data.expedConf: an object
    // data.expedConf[expedNum]:
    // * expedNum: 1..46, 100..105, 110..115, 131..133, 141..142
    // * expedNum is number or string, just like fleetNum
    // data.expedConf[expedNum].greatSuccess: boolean

    var data;
    const fillExpedConfDefaultGreatSuccess = (...ids) => {
      ids.forEach(i => {
        data.expedConf[i] = { greatSuccess: false };
      });
    };
    if (!localStorage.expedTab) {
      data = {};
      data.fleetConf = {};
      for (let i = 1; i <= 4; ++i) {
        data.fleetConf[i] = { expedition: 1 };
      }
      data.expedConf = {};
      fillExpedConfDefaultGreatSuccess(...Array.numbers(1, 46));
      fillExpedConfDefaultGreatSuccess(...Array.numbers(100, 105));
      fillExpedConfDefaultGreatSuccess(...Array.numbers(110, 115));
      fillExpedConfDefaultGreatSuccess(131, 132, 133, 141, 142);
      localStorage.expedTab = JSON.stringify(data);
    } else {
      data = JSON.parse(localStorage.expedTab);
      // add default GS config for new added expeditions
      // * extended since 2017-10-18: 100~102 display name A1~A3 for World 1
      // * extended since 2017-10-25: 110~111 B1~B2 for World 2
      // * extended since 2019-07-18: A4, B3, B4 and World 7. Monthly.
      // * extended since 2020-02-07: 45, D1, D2
      // * extended since 2020-03-27: B5, E1 for World 5
      // * extended since 2020-05-20: A5, A6
      // * extended since 2020-09-17: 46, E2
      // * extended since 2021-02-05: B6, D3
      if (idToValid > 0 && data.expedConf[idToValid] === undefined) {
        fillExpedConfDefaultGreatSuccess(idToValid);
      }
    }
    return data;
  };

  Utils.prototype.switchToFleet = function (targetFleet) {
    if (targetFleet === "combined") {
      $(".module.controls .fleet_rengo").trigger("click");
    } else if (targetFleet === "lbas") {
      $(".module.controls .fleet_lbas").trigger("click");
    } else {
      var fleetControls = $(".module.controls .fleet_num").toArray();
      for (var i = 0; i < fleetControls.length; ++i) {
        var thisFleet = parseInt($(fleetControls[i]).text(), 10);
        if (thisFleet === targetFleet) {
          $(fleetControls[i]).trigger("click");
          break;
        }
      }
    }
  };

  // #endregion Fleet & Expedition

  // #region Sortie & Battle Display

  Utils.prototype.clearSortieData = function () {
    $(".module.activity .activity_box").hideChildrenTooltips();
    $(".module.activity .activity_battle").css("opacity", "0.25");
    $(".module.activity .map_world").text("").attr("title", "").removeClass("debuffed");
    $(".module.activity .map_info").removeClass("map_finisher");
    $(".module.activity .map_gauge").removeAttr("titlealt");
    $(".module.activity .map_gauge *:not(.clear)").css("width", "0%");
    $(".module.activity .map_hp").text("");
    $(".module.activity .sortie_nodes .extra_node").remove();
    $(".module.activity .sortie_nodes").removeAttr("style");
    $(".module.activity .sortie_node").text("")
      .removeAttr("title")
      .removeClass("nc_battle nc_resource nc_maelstrom nc_select nc_avoid long_name")
      .removeClass("special_cutin smoke_screen")
      .removeClass(KC3Node.knownNodeExtraClasses().join(" "));
    $(".module.activity .sortie_nodes .boss_node").removeAttr("style");
    $(".module.activity .sortie_nodes .boss_node").hide();
    $(".module.activity .node_types").hide();
    $(".battle_support,.battle_drop", ".module.activity").find('img').css("visibility", "");
    $(".admiral_lvnext").attr("data-exp-gain", "");
  };

  Utils.prototype.clearBattleData = function () {
    $(".module.activity .activity_box").hideChildrenTooltips();
    $(".module.activity .abyss_ship img").attr("src", KC3Meta.abyssIcon(-1));
    $(".module.activity .abyss_ship img").attr("titlealt", "").lazyInitTooltip();
    $(".module.activity .abyss_ship").removeClass(KC3Meta.abyssShipBorderClass().join(" "));
    $(".module.activity .abyss_ship").removeClass("sunk");
    $(".module.activity .abyss_ship").removeData("masterId").off("dblclick");
    $(".module.activity .abyss_combined").hide();
    $(".module.activity .abyss_single").show();
    $(".module.activity .abyss_ship").hide();
    $(".module.activity .abyss_hp").hide().removeClass("sunk");
    $(".module.activity .sink_icons .sunk").removeClass("shown safe debuff");
    $(".module.activity .battle_eformation img").attr("src", "../../../../assets/img/ui/empty.png");
    $(".module.activity .battle_eformation").attr("title", "").lazyInitTooltip();
    $(".module.activity .battle_eformation").css("-webkit-transform", "rotate(0deg)");
    $(".module.activity .battle_support > img").attr("src", "../../../../assets/img/ui/dark_support.png");
    $(".module.activity .battle_support").attr("titlealt", KC3Meta.term("BattleSupportExped")).lazyInitTooltip();
    $(".module.activity .battle_support .support_lbas").hide();
    $(".module.activity .battle_support .support_exped").hide();
    $(".module.activity .battle_support .support_balloon").hide();
    $(".module.activity .battle_fish img").attr("src", "../../../../assets/img/ui/map_drop.png").removeClass("rounded");
    $(".module.activity .battle_fish").attr("title", KC3Meta.term("BattleItemDrop")).lazyInitTooltip();
    $(".module.activity .battle_aaci img").attr("src", "../../../../assets/img/ui/dark_aaci.png");
    $(".module.activity .battle_aaci").attr("title", KC3Meta.term("BattleAntiAirCutIn")).lazyInitTooltip();
    $(".module.activity .battle_night img").removeClass("hover").off("dblclick");
    $(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
    $(".module.activity .battle_night").attr("title", KC3Meta.term("BattleNightNeeded")).lazyInitTooltip();
    $(".module.activity .battle_rating img").attr("src", "../../../../assets/img/ui/dark_rating.png").css("opacity", "");
    $(".module.activity .battle_rating").attr("title", KC3Meta.term("BattleRating")).lazyInitTooltip();
    $(".module.activity .battle_drop img").attr("src", "../../../../assets/img/ui/dark_shipdrop.png").removeClass("rounded");
    $(".module.activity .battle_drop").removeData("masterId").off("dblclick").removeClass("new_ship");
    $(".module.activity .battle_drop").attr("title", "").lazyInitTooltip();
    $(".module.activity .battle_cond_value").text("");
    $(".module.activity .battle_engagement").prev().text(KC3Meta.term("BattleEngangement"));
    $(".module.activity .battle_engagement").removeClass(KC3Meta.battleSeverityClass(KC3Meta.engagement()));
    $(".module.activity .battle_engagement").attr("title", "").lazyInitTooltip();
    $(".module.activity .battle_detection").prev().text(KC3Meta.term("BattleDetection"));
    $(".module.activity .battle_detection").removeClass(KC3Meta.battleSeverityClass(KC3Meta.detection()));
    $(".module.activity .battle_detection").attr("title", "").lazyInitTooltip();
    $(".module.activity .battle_cond_extra.smoke_screen").hide().attr("title", "").lazyInitTooltip();
    $(".module.activity .battle_airbattle").removeClass(KC3Meta.battleSeverityClass(KC3Meta.airbattle()));
    $(".module.activity .battle_airbattle").attr("title", "").lazyInitTooltip();
    $(".module.activity .plane_text span").text("");
    $(".module.activity .battle_planes .fighter_ally .plane_icon img").attr("src", KC3Meta.itemIcon(6));
    $(".module.activity .battle_planes .fighter_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(6));
    $(".module.activity .battle_planes .bomber_ally .plane_icon img").attr("src", KC3Meta.itemIcon(7));
    $(".module.activity .battle_planes .bomber_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(7));
  };

  Utils.prototype.updateMapGauge = function (gaugeDmg, fsKill, noBoss) {
    // Map Gauge and status
    var thisMapId = KC3SortieManager.getSortieMap().join(''),
      thisMap = KC3SortieManager.getCurrentMapData(),
      mapHP = 0,
      onBoss = KC3SortieManager.currentNode().isValidBoss(),
      depleteOK = onBoss || !!noBoss,
      mainFsKill = !!fsKill;

    // Normalize Parameters
    gaugeDmg = (gaugeDmg || 0) * (depleteOK);

    if (Object.notEmpty(thisMap)) {
      $(".module.activity .map_info").removeClass("map_finisher");
      $(".module.activity .map_hp").removeAttr("title");
      if (KC3SortieManager.isPvP() || KC3Meta.isEventWorld(KC3SortieManager.map_world)) {
        $(".module.activity .map_gauge").removeAttr("titlealt");
      } else {
        const minimapImg = $("<img />")
          .attr("src", "/assets/img/client/minimaps/m{0}.png".format(thisMapId))
          .attr("width", 300).attr("height", 180)
          .attr("alt", KC3Meta.term("MinimapImageFailure"));
        $(".module.activity .map_gauge").attr("titlealt",
          $("<div></div>").css({ "width": "300px", "height": "180px" })
            .append(minimapImg).prop("outerHTML")
        ).lazyInitTooltip({
          position: {
            my: "left top", at: "left bottom+2",
            of: $(".module.activity .sortie_nodes"),
          },
        });
      }
      if (thisMap.clear && !thisMap.killsRequired) {
        $(".module.activity .map_hp").text(KC3Meta.term("BattleMapCleared"));
        $(".module.activity .map_gauge .curhp").css('width', '0%');
      } else {
        var requireFinisher = false;

        // If HP-based gauge
        if (typeof thisMap.maxhp != "undefined") {
          // Reduce current map HP with known gauge damage given
          mapHP = thisMap.curhp - gaugeDmg;
          // Normalize the gauge until flagship sinking flag
          mapHP = Math.max(mapHP, mainFsKill ? 0 : 1);

          var rate = [mapHP, thisMap.curhp].sort(function (a, b) {
            return b - a;
          }).map(function (x) {
            return (x / thisMap.maxhp) * 100;
          });

          console.debug("Map HP:", thisMap.curhp, thisMap.baseHp, rate[0], rate[1]);
          $(".module.activity .map_hp").text([
            thisMap.curhp,
            thisMap.curhp > 9999 ? "" : " ",
            "/",
            thisMap.maxhp > 9999 ? "" : " ",
            thisMap.maxhp
          ].join(""));
          $(".module.activity .map_gauge")
            .find('.nowhp').css("width", (rate[0]) + "%").end()
            .find('.curhp').css("width", (rate[1]) + "%").end();

          requireFinisher = thisMap.curhp > 0 && thisMap.curhp <= thisMap.baseHp;
          // If kill-based gauge
        } else {
          var totalKills = thisMap.killsRequired || KC3Meta.gauge(thisMapId, thisMap.gaugeNum);
          console.debug("Map " + thisMapId + " total kills:", totalKills);
          var
            killsLeft = totalKills - thisMap.kills + (!onBoss && !!noBoss),
            postBounty = killsLeft - (depleteOK && mainFsKill);
          if (totalKills) {
            $(".module.activity .map_hp")
              .text(killsLeft + " / " + totalKills + KC3Meta.term("BattleMapKills"));
            $(".module.activity .map_gauge")
              .find('.curhp').css("width", ((postBounty / totalKills) * 100) + "%").end()
              .find('.nowhp').css("width", ((killsLeft / totalKills) * 100) + "%").end();

            requireFinisher = killsLeft > 0 && killsLeft <= 1;
          } else {
            $(".module.activity .map_hp").text(KC3Meta.term("BattleMapNotClear"));
          }
        }

        if (requireFinisher) {
          (function () {
            var infoElm = $(".module.activity .map_info");
            infoElm.addClass("map_finisher");
            if (!ConfigManager.info_blink_gauge)
              infoElm.addClass("noBlink").removeClass("use-gpu");
            else
              infoElm.addClass("use-gpu").removeClass("noBlink");
            $(".module.activity .map_hp")
              .attr("title", $(".module.activity .map_hp").text())
              .text(KC3Meta.term("StrategyEvents1HP"))
              .lazyInitTooltip();
          })();
        }
      }
    } else {
      $(".module.activity .map_hp").removeAttr("title")
        .text(KC3Meta.term("BattleMapNoHpGauge"));
    }
  };

  Utils.prototype.updateEnemyHpBarStyles = function (hpBarSelector, hpPercent, maxWidth) {
    if (maxWidth > 0) {
      $(hpBarSelector).css("width", maxWidth * hpPercent);
    } else {
      $(hpBarSelector).css("width", "");
    }
    if (hpPercent === undefined || isNaN(hpPercent)) {
      $(hpBarSelector).css("background", "#999999");
    } else if (hpPercent <= 0.25) {
      $(hpBarSelector).css("background", "#FF0000");
    } else if (hpPercent <= 0.50) {
      $(hpBarSelector).css("background", "#FF9900");
    } else if (hpPercent <= 0.75) {
      $(hpBarSelector).css("background", "#FFFF00");
    } else {
      $(hpBarSelector).css("background", "#00FF00");
    }
    $(hpBarSelector).parent().toggleClass("sunk", hpPercent <= 0);
  };

  Utils.prototype.buildContactPlaneSpan = function (fcontactId, fcontact, econtactId, econtact) {
    var fContactIcon = null,
      eContactIcon = null,
      contactSpan = $("<span/>");
    if (fcontactId > 0) {
      var fcpMaster = KC3Master.slotitem(fcontactId);
      fContactIcon = $("<img />")
        .attr("src", KC3Meta.itemIcon(fcpMaster.api_type[3]))
        .attr("title", KC3Meta.gearName(fcpMaster.api_name))
        .attr("alt", fcontactId);
    }
    if (econtactId > 0) {
      var ecpMaster = KC3Master.slotitem(econtactId);
      eContactIcon = $("<img />")
        .attr("src", KC3Meta.itemIcon(ecpMaster.api_type[3]))
        .attr("title", KC3Meta.gearName(ecpMaster.api_name))
        .attr("alt", econtactId);
    }
    contactSpan
      .append(!!fContactIcon ? fContactIcon : fcontact)
      .append(KC3Meta.term("BattleContactVs"))
      .append(!!eContactIcon ? eContactIcon : econtact);
    return contactSpan;
  };

  Utils.prototype.prepareBattleLogsData = function () {
    // Don't pop up if a battle has not started yet
    if (!(KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP())
      || KC3SortieManager.countNodes() < 1) { return false; }
    const node = KC3SortieManager.currentNode();
    if (node.type !== "battle"
      || !(node.battleDay || node.battleNight)) { return false; }
    const isPvP = node.isPvP;
    const sortie = {
      id: KC3SortieManager.isOnSavedSortie() && KC3SortieManager.onSortie || (isPvP ? "TBD" : "???"),
      diff: KC3SortieManager.map_difficulty,
      world: isPvP ? 0 : KC3SortieManager.map_world,
      mapnum: KC3SortieManager.map_num,
      fleetnum: KC3SortieManager.fleetSent,
      combined: PlayerManager.combinedFleet,
      fleet1: PlayerManager.fleets[0].sortieJson(),
      fleet2: PlayerManager.fleets[1].sortieJson(),
      fleet3: PlayerManager.fleets[2].sortieJson(),
      fleet4: PlayerManager.fleets[3].sortieJson(),
      support1: isPvP ? 0 : KC3SortieManager.getSupportingFleet(false),
      support2: isPvP ? 0 : KC3SortieManager.getSupportingFleet(true),
      lbas: isPvP ? [] : KC3SortieManager.getWorldLandBases(KC3SortieManager.map_world, KC3SortieManager.map_num),
      battles: [node.buildBattleDBData()]
    };
    return sortie;
  };

  // #endregion Sortie & Battle Display

  // #region External Windows

  Utils.prototype.openSimulatorWindow = function (hashData, isPopup) {
    try {
      const url = "https://kc3kai.github.io/kancolle-replay/simulator.html#" + JSON.stringify(hashData);
      const ref = window.open(url, "simulator", (!isPopup ? undefined : "width=640,height=480,resizeable,scrollbars"));
      if (ref && !ref.closed) {
        // Update hash with latest battle data even if window already opened
        // this might not work for all browser versions as a vulnerability to bypass CORS
        ref.location.replace(url);
        // Switch focus to the window if possible
        if (ref.focus) ref.focus();
      }
    } catch (e) {
      console.warn("Failed to open battle simulator", e);
    }
  };

  Utils.prototype.openBattleLogsWindow = function (data, isPopup) {
    try {
      const url = "https://kc3kai.github.io/kancolle-replay/battleText.html#" + JSON.stringify(data);
      const ref = window.open(url, "battle", (!isPopup ? undefined : "width=640,height=480,resizeable,scrollbars,popup"));
      if (ref && !ref.closed) {
        ref.location.replace(url);
        if (ref.focus) ref.focus();
      }
    } catch (e) {
      console.warn("Failed to open battle logs", e);
    }
  };

  // #endregion External Windows

  // #region UI Helpers

  Utils.prototype.copyToClipboard = function (text) {
    return new Promise((resolve, reject) => {
      const copyHandler = function (e) {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData("text/plain", text);
          resolve(text, e);
        } else {
          reject(e, text);
        }
        return true;
      };
      document.addEventListener("copy", copyHandler);
      document.execCommand("copy");
      document.removeEventListener("copy", copyHandler);
    });
  };

  Utils.prototype.updateQuestActivityTab = function (isGoHome) {
    if (ConfigManager.info_quest_activity) {
      $(".activity_tabs .activity_tab").addClass("tab_count_5");
      $("#atab_quest").show();
      if (!!isGoHome && $("#atab_quest").hasClass("active")) {
        $("#atab_basic").trigger("click");
      }
    } else {
      $(".activity_tabs .activity_tab").removeClass("tab_count_5");
      $("#atab_quest").hide();
      if ($("#atab_quest").hasClass("active")) {
        $("#atab_basic").trigger("click");
      }
    }
  };

  Utils.prototype.updateHQEXPGained = function (ele, newDelta) {
    var
      maxHQ = Object.keys(KC3Meta._exp).map(function (a) { return parseInt(a); }).reduce(function (a, b) { return a > b ? a : b; }),
      hqDt = (PlayerManager.hq.level >= maxHQ ? 3 : ConfigManager.hqExpDetail),
      hqt = KC3Meta.term("HQExpAbbrev" + hqDt);
    return ele
      .attr("data-exp", hqt)
      .attr("data-exp-gain", (function (x) {
        if (newDelta !== undefined)
          return newDelta;
        else if ((ele.attr("data-exp-gain") || "").length > 0)
          return KC3SortieManager.hqExpGained;
        else
          return "";
      }()))
      .text(KC3Meta.formatNumber(PlayerManager.hq.exp[hqDt]));
  };

})();
