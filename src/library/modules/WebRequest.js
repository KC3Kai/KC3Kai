(() => {

  console.info('KC3改 WebRequest loaded');

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

    if (config.wr_sortie_ship_taiha) {
      const tmp = ships.filter((s) => s.isTaiha());
      if (tmp.length) {
        msg.push('Taiha ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    if (config.wr_sortie_ship_chuuha) {
      const tmp = ships.filter((s) => !s.isTaiha() && (s.hp[0] <= s.hp[1] / 2));
      if (tmp.length) {
        msg.push('Chuuha ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    if (config.wr_sortie_ship_unsupplied) {
      const tmp = ships.filter((s) => s.isNeedSupply());
      if (tmp.length) {
        msg.push('Unsupplied ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    if (config.wr_sortie_ship_untag && isEventWorld(api_maparea_id)) {
      const tmp = ships.filter((s) => s.sally === 0);
      if (tmp.length) {
        msg.push('Untagged ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    if (config.wr_sortie_lbas_unsupplied) {
      const tmp = PlayerManager.bases
        .filter((base) => base.map === api_maparea_id && base.action === 1 && !base.isPlanesSupplied());
      if (tmp.length) {
        msg.push('Unsupplied LBAS: #' + tmp.map((base) => base.rid).join(', #'));
      }
    }

    if (
      config.wr_sortie_fleet_strike_force_idle
      && isEventWorld(api_maparea_id)
      && api_deck_id !== 2
      && !PlayerManager.combinedFleet
      && PlayerManager.fleets[2].ships.filter(v => v > 0).length >= 7
    ) {
      msg.push('Idle Strike Force?');
    }

    if (
      config.wr_sortie_fleet_combined_idle
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

    return msg;
  }

  function verifyMissionStart(api_mission_id, api_mission, api_deck_id) {
    // console.debug('verifyMissionStart', { api_mission_id, api_mission, api_deck_id });
    const msg = [];

    const ships = getActiveShips(api_deck_id);

    if (config.wr_expe_ship_unsupplied) {
      const tmp = ships.filter((s) => s.isNeedSupply());
      if (tmp.length) {
        msg.push('Unsupplied ships: ' + tmp.map((s) => s.name()).join(', '));
      }
    }

    return msg;
  }

  function verify(api, data) {
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

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.id && msg.type === 'WEB_REQ_BLOCKING:REQ') {
      // console.debug('onMessage', msg);
      const result = {
        id: msg.id,
        type: 'WEB_REQ_BLOCKING:RES',
        data: verify(msg.data.url, msg.data.body),
        _request: msg,
      };
      sendResponse(result);
      return true;
    }
  });

  window.KC3WebRequest = {
    getActiveShips,
    verifyMapStart,
    verifyMissionStart,
  };

})();
