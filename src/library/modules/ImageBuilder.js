/**
 * Exactly, this module is a data builder of online website Image Builder,
 * which generates the fleets composition image on a canvas, instead of building an image by itself.
 *
 * Currently, supports to export data to the web Image Builder hosted by:
 *   https://github.com/HitomaruKonpaku/KanColleImgBuilder
 * which depends on GKCOI (Generate KanColle Organization Image) originally created by:
 *   https://github.com/Nishisonic/gkcoi
 * which supports data format originally created by DeckBuilder:
 *   http://www.kancolle-calc.net/deckbuilder.html
 */
(function () {
  'use strict';

  const exportBaseUrl = 'https://kancolleimgbuilder.web.app/builder#';
  const defaultLang = 'en';
  const supportedLangs = {
    'jp': 'jp',
    'kr': 'kr',
    'scn': 'scn',
    // gkcoi does not support tcn, map them to jp
    'tcn': 'jp',
    'tcn-yue': 'jp',
  };
  const defaultTheme = 'dark';
  const supportedThemes = {
    'dark': 'dark',
    // gkcoi does not show LBAS for other theme, so map all to dark
    'legacy': 'dark',
  };

  window.KC3ImageBuilder = {
    openWebsite,
    exportCurrentFleets,
    exportSortie,
    createDeckBuilderHeader,
    createFleetsFromSortie,
    convertSortiedFleet,
    createKC3FleetObject,
  };

  function openWebsite(deckBuilderData) {
    const json = JSON.stringify(deckBuilderData);
    const url = exportBaseUrl + encodeURI(json);
    //console.log("JSON to be exported", json);
    //console.debug("Site to be exported", url);
    window.open(url);
  }

  function exportCurrentFleets(lbWorldId) {
    // Not reload storage here to keep WYSIWYG in Strategy Room Fleet Manager,
    // and not necessary to refresh for devtools panel page.
    //PlayerManager.loadFleets();
    //PlayerManager.loadBases();
    const fleets = PlayerManager.fleets;
    const lbas = PlayerManager.bases;
    const deckBuilder = createDeckBuilderHeader(true);
    buildFleets(deckBuilder, fleets);
    const availWorlds = lbas.map(lb => lb.map).sort();
    buildLbasFromPlayerManager(deckBuilder, lbas,
      lbWorldId > 0 ? lbWorldId : availWorlds[0]);
    openWebsite(deckBuilder);
  }

  function exportSortie(sortieId) {
    KC3Database.get_sortie(sortieId, sortie => {
      const fleets = createFleetsFromSortie(sortie);
      const lbas = sortie.lbas;
      const deckBuilder = createDeckBuilderHeader(true);
      buildFleets(deckBuilder, fleets);
      buildLbasFromSortie(deckBuilder, lbas);
      openWebsite(deckBuilder);
    });
  }

  function createFleetsFromSortie(sortie) {
    const fleets = [];
    fleets.push(convertSortiedFleet(sortie.fleet1, 1));
    fleets.push(convertSortiedFleet(sortie.fleet2, 2));
    fleets.push(convertSortiedFleet(sortie.fleet3, 3));
    fleets.push(convertSortiedFleet(sortie.fleet4, 4));
    return fleets.map(v => createKC3FleetObject(v));
  }

  function createDeckBuilderHeader(forImgBuilder = false) {
    const obj = {
      hqlv: PlayerManager.hq.level,
    };
    if (forImgBuilder) {
      obj.lang = supportedLangs[ConfigManager.language] || defaultLang;
      obj.theme = supportedThemes[ConfigManager.sr_theme] || defaultTheme;
    } else {
      obj.version = 4;
    }
    return obj;
  }

  function buildFleets(deckBuilder, fleets) {
    fleets.forEach((v, i) => {
      deckBuilder['f' + (i + 1)] = v.deckbuilder(true);
    });
  }

  function buildLbasFromPlayerManager(deckBuilder, lbas, mapId) {
    if (!checkLbasBuilderInput(deckBuilder, lbas)) {
      return;
    }
    lbas.filter(lb => !mapId || lb.map === mapId).forEach((lb, i) => {
      deckBuilder['a' + (i + 1)] = lb.deckbuilder();
    });
  }

  function buildLbasFromSortie(deckBuilder, lbas) {
    if (!checkLbasBuilderInput(deckBuilder, lbas)) {
      return;
    }
    lbas.forEach((lb, i) => {
      const lbasObj = {
        mode: lb.action,
        items: {},
      };
      lb.planes.forEach((plane, i) => {
        const planeObj = {
          id: plane.mst_id,
          rf: plane.stars,
          mas: plane.ace,
        };
        lbasObj.items['i' + (i + 1)] = planeObj;
      });
      deckBuilder['a' + (i + 1)] = lbasObj;
    });
  }

  function checkLbasBuilderInput(deckBuilder, lbas) {
    const isValid = deckBuilder && typeof deckBuilder === 'object' && Array.isArray(lbas);
    return isValid;
  }

  function convertShip(shipData) {
    if (!shipData || shipData.mst_id <= 0) return null;
    var shipObj = {};
    var masterData = KC3Master.ship(shipData.mst_id);
    var slotnum = masterData.api_slot_num;
    shipObj.id = shipData.mst_id;
    shipObj.level = shipData.level;
    shipObj.morale = shipData.morale;
    shipObj.mod = shipData.kyouka;
    shipObj.stats = shipData.stats;
    shipObj.equipments = [];

    $.each(shipData.equip, function (i, gearId) {
      if (gearId <= 0) {
        shipObj.equipments.push(null);
        return;
      }
      shipObj.equipments.push({
        id: gearId,
        improve: shipData.stars && shipData.stars[i] > 0 ? shipData.stars[i] : 0,
        ace: shipData.ace ? shipData.ace[i] || 0 : 0
      });
    });
    while (shipObj.equipments.length < Math.max(slotnum + 1, 5))
      shipObj.equipments.push(null);

    return shipObj;
  }

  function convertSortiedFleet(fleetData, fleetNum) {
    var fleetObj = {};
    fleetObj.name = 'Fleet #' + fleetNum;
    fleetObj.ships = [];
    $.each(fleetData, function (ind, ship) {
      fleetObj.ships.push(convertShip(ship));
    });
    return fleetObj;
  }

  function createKC3FleetObject(fleetObj) {
    var fleet = new KC3Fleet();
    if (!fleetObj) return fleet;
    fleet.name = fleetObj.name;
    fleet.ships = [-1, -1, -1, -1, -1, -1];
    if (!fleetObj) return;
    fleet.active = true;
    var shipObjArr = [];

    // simulate ShipManager
    fleet.ShipManager = {
      get: function (ind) {
        return shipObjArr[ind - 1] || new KC3Ship();
      }
    };

    // fill in instance of Ships
    $.each(fleetObj.ships, function (ind, shipObj) {
      if (!shipObj) return;
      var ship = new KC3Ship();
      shipObjArr.push(ship);
      fleet.ships[ind] = shipObjArr.length;

      var equipmentObjectArr = [];
      var masterData = KC3Master.ship(shipObj.id);
      var slotnum = masterData.api_slot_num;
      ship.rosterId = shipObj.rid || fleet.ships[ind];
      ship.masterId = shipObj.id;
      ship.level = shipObj.level;
      ship.morale = shipObj.morale;

      ship.items = [-1, -1, -1, -1, -1];
      // slot sizes are not saved for now, use the copy of master data
      ship.slots = masterData.api_maxeq.slice(0);
      ship.ex_item = 0;
      ship.slotnum = slotnum;
      ship.GearManager = {
        get: function (ind) {
          return equipmentObjectArr[ind - 1] || new KC3Gear();
        }
      };

      $.each(shipObj.equipments, function (ind, equipment) {
        if (!equipment) return;
        var gear = new KC3Gear();
        equipmentObjectArr.push(gear);
        if (ind >= 4 && ind >= ship.slotnum) {
          ship.ex_item = equipmentObjectArr.length;
          gear.itemId = ship.ex_item;
        } else {
          ship.items[ind] = equipmentObjectArr.length;
          gear.itemId = ship.items[ind];
        }
        gear.masterId = equipment.id;
        // fix slot size from max to 1 if Large Flying Boat equipped
        // for now, it only affects Nisshin, all slot sizes are 1 on other ships can equip LFB
        if (gear.masterId > 0 && KC3Master.slotitem(gear.masterId).api_type[2] == 41) {
          ship.slots[ind] = 1;
        }
        gear.stars = Number(equipment.improve) || 0;
        gear.ace = Number(equipment.ace) || 0;
      });

      // estimate ship's stats from known facts as possible as we can
      var mod = shipObj.mod || [];
      var nonMasterStats = shipObj.stats || {};
      ship.hp[0] = ship.hp[1] = ship.maxHp() + (mod[5] || 0);

      // read saved values first, then fall back to calculate master + mod + equip total
      ship.fp[0] = shipObj.fp || (masterData.api_houg[0] + (mod[0] || 0) + ship.equipmentTotalStats('houg'));
      ship.tp[0] = shipObj.tp || (masterData.api_raig[0] + (mod[1] || 0) + ship.equipmentTotalStats('raig'));
      ship.aa[0] = shipObj.aa || (masterData.api_tyku[0] + (mod[2] || 0) + ship.equipmentTotalStats('tyku'));
      ship.ar[0] = shipObj.ar || (masterData.api_souk[0] + (mod[3] || 0) + ship.equipmentTotalStats('souk'));
      ship.lk[0] = shipObj.luck || (masterData.api_luck[0] + (mod[4] || 0));

      // no value in master data, fall back to calculated naked + equip total
      ship.ls[0] = shipObj.ls || ((nonMasterStats.ls || ship.estimateNakedLoS()) + ship.equipmentTotalLoS());
      ship.ev[0] = shipObj.ev || ((nonMasterStats.ev || ship.estimateNakedEvasion()) + ship.equipmentTotalStats('houk'));
      ship.as[0] = shipObj.as || ((nonMasterStats.as || ship.estimateNakedAsw()) + ship.equipmentTotalStats('tais') + (mod[6] || 0));

      // fall back to master data + equip synergy bonus
      ship.speed = shipObj.sp || (nonMasterStats.sp || masterData.api_soku + ship.equipmentTotalStats('soku'));
    });

    return fleet;
  }

})();
