(() => {

  console.debug('KcsRequestVerifier loaded');

  const config = ConfigManager;

  function isEventWorld(world) {
    return world > 20;
  }

  function getActiveShips(indexes) {
    const ships = (Array.isArray(indexes) ? indexes : [indexes])
      .map((fleet) => PlayerManager.fleets[fleet].ships)
      .flat()
      .filter((id) => id > 0)
      .map((id) => KC3ShipManager.get(id))
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
    return PlayerManager.fleets[index].mission.every(v => v === 0);
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

  function verifyMapStart(api_deck_id, api_maparea_id, api_mapinfo_no) {
    const msg = [];
    const decks = PlayerManager.combinedFleet
      ? [0, 1]
      : api_deck_id;
    const ships = getActiveShips(decks);
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

    // Warn if any sortieing ship is not fully supplied
    if (config.rv_sortie_ship_unsupplied) {
      const tmp = checkShips.filter((s) => !s.isSupplied());
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieShipUnsuppliedMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if any sortieing ship has no event tag
    if (config.rv_sortie_ship_untag && isEventWorld(api_maparea_id)) {
      const tmp = checkShips.filter((s) => s.sally === 0);
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieShipUntagMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if an LBAS on this map needs planes supplied
    if (config.rv_sortie_lbas_unsupplied) {
      const tmp = PlayerManager.bases
        .filter((base) => base.map === api_maparea_id && base.action === 1 && !base.isPlanesSupplied());
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierSortieLbasUnsuppliedMsg').format(tmp.map((base) => '#' + base.rid).join(', ')));
      }
    }

    // Warn if sortieing a different fleet while the Strike Force (fleet 3) is ready but idle
    if (
      config.rv_sortie_fleet_strike_force_idle
      && isEventWorld(api_maparea_id)
      && api_deck_id !== 2
      && !PlayerManager.combinedFleet
      && PlayerManager.fleets[2].ships.filter(v => v > 0).length >= 7
    ) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleetStrikeForceIdleMsg'));
    }

    // Warn if sortieing fleet 1 alone while a Combined Fleet could be formed
    if (
      config.rv_sortie_fleet_combined_idle
      && isEventWorld(api_maparea_id)
      && api_deck_id === 0
      && !PlayerManager.combinedFleet
      && ships.length >= 2
      && canFormCombined(ships, getActiveShips(1))
      && isFleetIdle(1)
    ) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleetCombinedIdleMsg'));
    }

    // Block sorties with fleet 2
    if (config.rv_sortie_fleet_2_blocked && api_deck_id === 1) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleet2BlockedMsg'));
    }

    // Block sorties with fleet 3 unless it is a full 7-ship Strike Force
    if (config.rv_sortie_fleet_3_blocked && api_deck_id === 2 && ships.length < 7) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleet3BlockedMsg'));
    }

    // Block sorties with fleet 4
    if (config.rv_sortie_fleet_4_blocked && api_deck_id === 3) {
      msg.push(KC3Meta.term('RequestVerifierSortieFleet4BlockedMsg'));
    }

    return msg;
  }

  function verifyMissionStart(api_deck_id, api_mission_id, api_mission) {
    const msg = [];
    const ships = getActiveShips(api_deck_id);

    // Warn if any expedition ship is not fully supplied
    if (config.rv_expe_ship_unsupplied) {
      const tmp = ships.filter((s) => !s.isSupplied());
      if (tmp.length) {
        msg.push(KC3Meta.term('RequestVerifierExpeShipUnsuppliedMsg').format(tmp.map((s) => s.name()).join(', ')));
      }
    }

    // Warn if sending fleet 2 to expedition while a Combined Fleet could be formed
    if (
      config.rv_expe_fleet_combined_idle
      && api_deck_id === 1
      && canFormCombined(getActiveShips(0), ships)
    ) {
      msg.push(KC3Meta.term('RequestVerifierExpeFleetCombinedIdleMsg'));
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
    }

    return [];
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.id && message.type === 'KCS_REQ_VERIFY:REQ') {
      const details = verify(message.data.url, message.data.body);
      let msg = '';

      if (details.length) {
        const title = KC3Meta.term('RequestVerifierConfirmTitle');
        msg = [
          title,
          details.join('\n'),
        ].join('\n').trim();
      }

      const result = {
        id: message.id,
        type: 'KCS_REQ_VERIFY:RES',
        data: {
          shouldConfirm: !!details.length,
          message: msg,
          details,
        },
        _request: message,
      };
      sendResponse(result);
      return true;
    }
  });

  window.KcsRequestVerifier = {
    getActiveShips,
    verifyMapStart,
    verifyMissionStart,
  };

})();
