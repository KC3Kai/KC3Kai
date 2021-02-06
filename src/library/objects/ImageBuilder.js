(function () {
  'use strict';

  window.KC3ImageBuilder = function () {
    this.exportUrl = 'https://kancolleimgbuilder.web.app/builder?deck=';
    // this.exportUrl = 'http://localhost:4200/builder?deck=';
  };

  KC3ImageBuilder.prototype.exportCurrentFleets = function () {
    PlayerManager.loadFleets();
    PlayerManager.loadBases();
    const fleets = PlayerManager.fleets;
    const lbas = PlayerManager.bases;
    const url = this.exportUrl + encodeURI(JSON.stringify(genDeckBuilder(fleets, lbas)));
    console.debug(url);
  }

  KC3ImageBuilder.prototype.exportSortie = function (sortieId) {
    KC3Database.get_sortie(sortieId, sortie => {
      console.debug(sortie)
      const fleets = [];
      fleets.push(convertFleet(sortie.fleet1, 1));
      fleets.push(convertFleet(sortie.fleet2, 2));
      fleets.push(convertFleet(sortie.fleet3, 3));
      fleets.push(convertFleet(sortie.fleet4, 4));
      const deck = genDeckBuilder(fleets.map(v => createKCFleetObject(v)));
      if (sortie.lbas) {
        sortie.lbas.forEach((lb, i) => {
          const result = {
            mode: lb.action,
            items: {},
          };
          lb.planes.forEach((v, i) => {
            const item = {
              id: v.mst_id,
              rf: v.stars,
              mas: v.ace,
            };
            result.items['i' + (i + 1)] = item;
          });
          deck['a' + (i + 1)] = result
        })
      }
      console.debug(deck)
      const url = this.exportUrl + encodeURI(JSON.stringify(deck));
      console.debug(url);
    });
  }

  /**
   * Gen DeckBuilder
   * @param {*} fleets Array of KC3Fleet
   * @param {*} lbas Array of KC3LandBase
   * @see https://github.com/Nishisonic/gkcoi#deckbuilder
   */
  function genDeckBuilder(fleets, lbas) {
    const deckBuilder = {
      version: 4,
      hqlv: PlayerManager.hq.level
    };

    deckBuilder.lang = ['jp', 'kr', 'scn', 'tcn'].includes(ConfigManager.language)
      ? ConfigManager.language
      : 'en';

    deckBuilder.theme = {
      'dark': 'dark',
      'legacy': 'official',
    }[ConfigManager.sr_theme] || 'dark';

    fleets.forEach((v, i) => {
      deckBuilder['f' + (i + 1)] = v.deckbuilder(true);
    });

    if (lbas) {
      lbas.forEach((v, i) => {
        deckBuilder['a' + (i + 1)] = v.deckbuilder();
      });
    }

    return deckBuilder;
  }

  function convertFleet(fleetData, fleetNum) {
    var fleetObj = {};
    fleetObj.name = 'Fleet #' + fleetNum;
    fleetObj.ships = [];
    $.each(fleetData, function (ind, ship) {
      fleetObj.ships.push(convertShip(ship));
    });
    return fleetObj;
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

  function createKCFleetObject(fleetObj) {
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
      ship.slots = masterData.api_maxeq;
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
        gear.stars = Number(equipment.improve) || 0;
        gear.ace = Number(equipment.ace) || 0;
      });

      // estimate ship's stats from known facts as possible as we can
      var mod = shipObj.mod || [];
      var noMasterStats = shipObj.stats || {};
      ship.hp[0] = ship.hp[1] = ship.maxHp() + (mod[5] || 0);

      // read saved values first, then fall back to calculate master + mod + equip total
      ship.fp[0] = shipObj.fp || (masterData.api_houg[0] + (mod[0] || 0) + ship.equipmentTotalStats('houg'));
      ship.tp[0] = shipObj.tp || (masterData.api_raig[0] + (mod[1] || 0) + ship.equipmentTotalStats('raig'));
      ship.aa[0] = shipObj.aa || (masterData.api_tyku[0] + (mod[2] || 0) + ship.equipmentTotalStats('tyku'));
      ship.ar[0] = shipObj.ar || (masterData.api_souk[0] + (mod[3] || 0) + ship.equipmentTotalStats('souk'));
      ship.lk[0] = shipObj.luck || (masterData.api_luck[0] + (mod[4] || 0));

      // no value in master data, fall back to calculated naked + equip total
      ship.ls[0] = shipObj.ls || ((noMasterStats.ls || ship.estimateNakedLoS()) + ship.equipmentTotalLoS());
      ship.ev[0] = shipObj.ev || ((noMasterStats.ev || ship.estimateNakedEvasion()) + ship.equipmentTotalStats('houk'));
      ship.as[0] = shipObj.as || ((noMasterStats.as || ship.estimateNakedAsw()) + ship.equipmentTotalStats('tais') + (mod[6] || 0));

      // just fall back to master data, to avoid recompute ship speed by updating a table about speed up ship classes
      ship.speed = shipObj.sp || noMasterStats.sp || masterData.api_soku;
    });

    return fleet;
  }

})();
