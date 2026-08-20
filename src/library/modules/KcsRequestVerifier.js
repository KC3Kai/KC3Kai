(() => {

  console.debug('KcsRequestVerifier loaded');

  const config = ConfigManager;

  function isEventWorld(world) {
    return world > 20;
  }

  function getActiveShips(fleets) {
    const ships = (Array.isArray(fleets) ? fleets : [fleets])
      .map((fleet) => PlayerManager.fleets[fleet].ships)
      .flat()
      .filter((id) => id > 0)
      .map((id) => KC3ShipManager.get(id))
      .filter((ship) => ship && !ship.isDummy());
    return ships;
  }

  function verifyMapStart(api_maparea_id, api_mapinfo_no, api_deck_id) {
    // console.debug('verifyMapStart', { api_maparea_id, api_mapinfo_no, api_deck_id });
    const msg = [];

    const fleets = PlayerManager.combinedFleet
      ? [0, 1]
      : api_deck_id;
    const ships = getActiveShips(fleets);

    // console.debug('fleets', fleets);
    // console.debug('ships', ships);

    // Warn if any sortieing ship is taiha
    if (config.rv_sortie_ship_taiha) {
      const tmp = ships.filter((s) => s.isTaiha());
      if (tmp.length) {
        msg.push('Taiha ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    // Warn if any sortieing ship is chuuha
    if (config.rv_sortie_ship_chuuha) {
      const tmp = ships.filter((s) => !s.isTaiha() && (s.hp[0] <= s.hp[1] / 2));
      if (tmp.length) {
        msg.push('Chuuha ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    // Warn if any sortieing ship needs supply
    if (config.rv_sortie_ship_unsupplied) {
      const tmp = ships.filter((s) => s.isNeedSupply());
      if (tmp.length) {
        msg.push('Unsupplied ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    // Warn if any sortieing ship has no event tag
    if (config.rv_sortie_ship_untag && isEventWorld(api_maparea_id)) {
      const tmp = ships.filter((s) => s.sally === 0);
      if (tmp.length) {
        msg.push('Untagged ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    // Warn if an LBAS on this map needs planes supplied
    if (config.rv_sortie_lbas_unsupplied) {
      const tmp = PlayerManager.bases
        .filter((base) => base.map === api_maparea_id && base.action === 1 && !base.isPlanesSupplied());
      if (tmp.length) {
        msg.push('Unsupplied LBAS: #' + tmp.map((base) => base.rid).join(', #'));
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
      msg.push('Idle Strike Force?');
    }

    // Warn if sortieing fleet 1 alone while a Combined Fleet could be formed
    if (
      config.rv_sortie_fleet_combined_idle
      && isEventWorld(api_maparea_id)
      && api_deck_id === 0
      && !PlayerManager.combinedFleet
      && PlayerManager.fleets[1].mission.every(v => v === 0)
    ) {
      const escortShips = getActiveShips(1);
      const dds = escortShips.filter((s) => s.master().api_stype === 2).length;
      const cls = escortShips.filter((s) => s.master().api_stype === 3).length;
      if (cls >= 1 && dds >= 2) {
        msg.push('Idle Combined Fleet?');
      }
    }

    // Block sorties with fleet 2
    if (config.rv_sortie_fleet_2_blocked && api_deck_id === 1) {
      msg.push('Fleet 2 blocked');
    }

    // Block sorties with fleet 3 unless it is a full 7-ship Strike Force
    if (config.rv_sortie_fleet_3_blocked && api_deck_id === 2 && ships.length < 7) {
      msg.push('Fleet 3 blocked');
    }

    // Block sorties with fleet 4
    if (config.rv_sortie_fleet_4_blocked && api_deck_id === 3) {
      msg.push('Fleet 4 blocked');
    }

    return msg;
  }

  function verifyMissionStart(api_mission_id, api_mission, api_deck_id) {
    // console.debug('verifyMissionStart', { api_mission_id, api_mission, api_deck_id });
    const msg = [];

    const ships = getActiveShips(api_deck_id);

    // Warn if any expedition ship needs supply
    if (config.rv_expe_ship_unsupplied) {
      const tmp = ships.filter((s) => s.isNeedSupply());
      if (tmp.length) {
        msg.push('Unsupplied ships: ' + tmp.map((s) => s.name()).join(', '));
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
          Number(data.api_maparea_id),
          Number(data.api_mapinfo_no),
          Number(data.api_deck_id) - 1
        );
      case 'api_req_mission/start':
        return verifyMissionStart(
          Number(data.api_mission_id),
          Number(data.api_mission),
          Number(data.api_deck_id) - 1
        );
    }

    return [];
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.id && message.type === 'KCS_REQ_VERIFY:REQ') {
      const details = verify(message.data.url, message.data.body);
      let msg = '';

      if (details.length) {
        const title = 'Continue with warnings?';
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
