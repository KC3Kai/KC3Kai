/**
 * KC3改 KCS game API request verifier, and warning messages generator for http request blocker, running under devtools panel context, accepting verification requests from runtime messages.
 * Messaging flowchart: axios_injectable.js (window message) -> kcs.js (runtime msg request) -> this verifier (runtime msg response) -> kcs.js (window message) -> axios_injectable.js
 *
 * @see injections/axios_injectable.js - game window document script for intercepting game http post requests, and warning and blocking specific ones checked by this verifier.
 * @see injections/kcs.js - extension content script for injecting script above into game window document, and adapting between its window messages and runtime messages for this verifier.
 */
(() => {

  console.debug('KcsRequestVerifier loaded');

  const config = ConfigManager;
  // In order to notify content script, config reloading itself already handled by theme script
  config.registerChangeNotifier();

  function getActiveShips(indexes) {
    const ships = (Array.isArray(indexes) ? indexes : [indexes])
      .map((fleet) => PlayerManager.fleets[fleet].ship())
      .flat()
      .filter((ship) => ship && !ship.isDummy());
    return ships;
  }

  function filterCheckShips(ships) {
    // Ignore unlocked ships for warnings
    return config.rv_ship_unlock_ignore
      ? ships.filter((s) => s.lock === 1)
      : ships;
  }

  /**
   * Fleet not on expedition
   */
  function isFleetIdle(index) {
    return !PlayerManager.fleets[index].isOnExped();
  }

  /**
   * Count ships whose type id (api_stype) is one of the given stypes.
   * Ship type ids map by index in [stype.json](../../data/lang/data/en/stype.json)
   */
  function countStype(ships, ...stypes) {
    return ships.filter((s) => stypes.includes(s.master().api_stype)).length;
  }

  /**
   * Check if main + escort fleet composition can form a combined fleet.
   * Ship type ids (api_stype) map by index in [stype.json](../../data/lang/data/en/stype.json)
   * 
   * @see https://en.kancollewiki.net/Combined_Fleet
   */
  function canFormCombined(mainShips, escortShips) {
    // CTF (1): main 2 CV/CVB/CVL, escort 1 CL + 2 DD
    if (
      true
      && countStype(mainShips, 7, 11, 18) >= 2
      && countStype(escortShips, 3) >= 1
      && countStype(escortShips, 2) >= 2
    ) {
      return true;
    }

    // STF (2): main 2 FBB/BB/BBV/CA/CAV/CL/CLT, escort 1 CL + 2 DD
    if (
      true
      && countStype(mainShips, 3, 4, 5, 6, 8, 9, 10) >= 2
      && countStype(escortShips, 3) >= 1
      && countStype(escortShips, 2) >= 2
    ) {
      return true;
    }

    // TCF (3): main 4 DD/DE, escort 1 CL/CT + 3 DD/DE
    if (
      true
      && countStype(mainShips, 1, 2) >= 4
      && countStype(escortShips, 3, 21) >= 1
      && countStype(escortShips, 1, 2) >= 3
    ) {
      return true;
    }

    return false;
  }

  /**
   * @see https://en.kancollewiki.net/Support_Expedition
   */
  function canFormSupport(ships) {
    if (countStype(ships, 2) < 2) {
      return false;
    }

    // Shelling: 2 DD + 3 (F)BB(V) + 1 CV(B)
    if (countStype(ships, 8, 9, 10) >= 3 && countStype(ships, 11, 18) >= 1) {
      return true;
    }

    // Shelling: 2 DD + 4 CA(V)
    if (countStype(ships, 5, 6) >= 4) {
      return true;
    }

    // Airstrike: 2 DD + 4 CV(B/L)
    if (countStype(ships, 7, 11, 18) >= 4) {
      return true;
    }

    // ASW: 2 DD + 2 CVL + 2 CV(B)
    if (countStype(ships, 7) >= 2 && countStype(ships, 11, 18) >= 2) {
      return true;
    }

    return false;
  }

  function verifyMapStart(api_deck_idx, api_maparea_id, api_mapinfo_no) {
    const msg = [];
    const fleetIdx = PlayerManager.combinedFleet
      ? [0, 1]
      : api_deck_idx;
    const ships = getActiveShips(fleetIdx);
    // Keep full list for fleet checks, filtered one for warnings
    const checkShips = filterCheckShips(ships);

    // console.debug('fleets', fleets);
    // console.debug('ships', ships);

    // Warn if any sortieing ship is at or below the HP threshold (25% per level)
    if (config.rv_sortie_ship_hp_threshold > 0) {
      const ratio = config.rv_sortie_ship_hp_threshold * 0.25;
      const tmp = checkShips.filter((s) => s.hp[0] / s.hp[1] <= ratio);
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieShipHpThresholdMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if any sortieing ship is below the morale threshold
    if (config.rv_sortie_ship_morale_threshold > 0) {
      const tmp = checkShips.filter((s) => s.morale < config.rv_sortie_ship_morale_threshold);
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieShipMoraleMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if any sortieing ship is not fully supplied
    if (config.rv_sortie_ship_unsupplied) {
      const tmp = checkShips.filter((s) => !s.isSupplied());
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieShipUnsuppliedMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if any sortieing ship has no event tag
    if (config.rv_sortie_ship_untag && KC3Meta.isEventWorld(api_maparea_id)) {
      const tmp = checkShips.filter((s) => s.sally === 0);
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieShipUntagMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if an LBAS on this map needs planes supplied (sortie: action 1, defense: action 2)
    if (config.rv_sortie_lbas_unsupplied_sortie || config.rv_sortie_lbas_unsupplied_defense) {
      const lbasActions = [];
      if (config.rv_sortie_lbas_unsupplied_sortie) {
        lbasActions.push(1);
      }
      if (config.rv_sortie_lbas_unsupplied_defense) {
        lbasActions.push(2);
      }
      const tmp = PlayerManager.bases
        .filter((base) => base.map === api_maparea_id && lbasActions.includes(base.action) && !base.isPlanesSupplied());
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieLbasUnsuppliedMsg').format(tmp.map((base) => '#' + base.rid).join(', ')));
      }
    }

    // Warn if sortieing a different fleet while the Striking Force (fleet 3) is ready but idle
    if (
      config.rv_sortie_fleet_strike_force_idle
      && KC3Meta.isEventWorld(api_maparea_id)
      && api_deck_idx !== 2
      && !PlayerManager.combinedFleet
      && PlayerManager.fleets[2].isStrikingForce()
    ) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleetStrikeForceIdleMsg'));
    }

    // Warn if sortieing fleet 1 alone while a Combined Fleet could be formed
    if (
      config.rv_sortie_fleet_combined_idle
      && KC3Meta.isEventWorld(api_maparea_id)
      && api_deck_idx === 0
      && !PlayerManager.combinedFleet
      && ships.length >= 2
      && canFormCombined(ships, getActiveShips(1))
      && isFleetIdle(1)
    ) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleetCombinedIdleMsg'));
    }

    // Block sorties with fleet 2
    if (config.rv_sortie_fleet_2_blocked && api_deck_idx === 1) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleet2BlockedMsg'));
    }

    // Block sorties with fleet 3 unless it is a full 7-ship Striking Force
    if (config.rv_sortie_fleet_3_blocked && api_deck_idx === 2 && ships.length < 7) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleet3BlockedMsg'));
    }

    // Block sorties with fleet 4
    if (config.rv_sortie_fleet_4_blocked && api_deck_idx === 3) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleet4BlockedMsg'));
    }

    return msg;
  }

  function verifyMissionStart(api_deck_idx, api_mission_id, api_mission) {
    const msg = [];
    const ships = getActiveShips(api_deck_idx);

    // Warn if any expedition ship is not fully supplied
    if (config.rv_exped_ship_unsupplied) {
      const tmp = ships.filter((s) => !s.isSupplied());
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierExpedShipUnsuppliedMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if sending fleet 2 to expedition while a Combined Fleet could be formed
    if (
      config.rv_exped_fleet_combined_idle
      && api_deck_idx === 1
      && canFormCombined(getActiveShips(0), ships)
    ) {
      msg.push(KC3Meta.term('RequestVerifierExpedFleetCombinedIdleMsg'));
    }

    // Warn if sending a fleet to expedition while it could form a Support Fleet
    if (
      config.rv_exped_fleet_support_idle
      && canFormSupport(ships)
    ) {
      msg.push(KC3Meta.term('RequestVerifierExpedFleetSupportIdleMsg'));
    }

    return msg;
  }

  function verifyShipDestroy(api_ship_id) {
    const msg = [];

    // Warn if destroying the last copy of a ship class (api_ship_id can be "id" or "id1,id2,...")
    if (config.rv_ship_destroy) {
      const lastCopies = String(api_ship_id).split(',')
        .map((id) => KC3ShipManager.get(Number(id)))
        .filter((ship) => {
          const origin = RemodelDb.originOf(ship.masterId) || ship.masterId;
          const copies = KC3ShipManager
            .find((s) => (RemodelDb.originOf(s.masterId) || s.masterId) === origin)
            .length;
          return copies < 2;
        });
      if (lastCopies.length) {
        msg.push(KC3Meta.term('RequestVerifierShipDestroyMsg').format(lastCopies.map((s) => s.name()).join(', ')));
      }
    }

    return msg;
  }

  function verify(api, data) {
    // Master switch for request verification
    if (!config.rv_enabled) {
      return [];
    }

    switch (api) {
      case 'api_req_map/start':
        return verifyMapStart(
          Number(data.api_deck_id) - 1,
          Number(data.api_maparea_id),
          Number(data.api_mapinfo_no)
        );
      case 'api_req_mission/start':
        return verifyMissionStart(
          Number(data.api_deck_id) - 1,
          Number(data.api_mission_id),
          Number(data.api_mission)
        );
      case 'api_req_kousyou/destroyship':
        return verifyShipDestroy(data.api_ship_id);
    }

    return [];
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.identifier === 'kc3_kcsRequestVerifier'
      && message.action === 'KCS_REQ_VERIFY:REQ'
      && message.id
      && message.data
    ) {
      const api = message.data.url;
      const data = message.data.body;
      // Do not log privacy
      if (data.api_token) {
        delete data.api_token;
        delete data.api_verno;
      }
      const details = verify(api, data);
      let msg = '';

      if (details.length) {
        const title = KC3Meta.term('RequestVerifierConfirmTitle');
        msg = [
          title,
          details.join('\n'),
        ].join('\n').trim();
        console.info('Request verified', api, data, details);
      }

      const result = {
        id: message.id,
        type: 'KCS_REQ_VERIFY:RES',
        data: {
          shouldConfirm: !!details.length,
          message: msg,
          details,
        },
      };
      sendResponse(result);
    }
    return true;
  });

  window.KcsRequestVerifier = {
    verifyMapStart,
    verifyMissionStart,
    verifyShipDestroy,
  };

})();
