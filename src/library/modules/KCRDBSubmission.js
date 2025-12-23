(() => {

  const baseUrl = "https://kcrdb.hitomaru.dev";
  const manifest = chrome.runtime.getManifest() || {};
  const kc3version = (manifest.version || "unk")
    + ("update_url" in manifest ? "_webstore" : "")
    + ((manifest.name || "").includes("Development") ? "_dev" : "");
  /** Assuming following texts not changed in kc game API, if changed, have to update them */
  const questTitleToVerify = {
    "261": "海上輸送路の安全確保に努めよ！",
    "256": "「潜水艦隊」出撃せよ！",
    "888": "新編成「三川艦隊」、鉄底海峡に突入せよ！",
    "303": "「演習」で練度向上！",
    "402": "「遠征」を３回成功させよう！",
    "503": "艦隊大整備！",
    "605": "新装備「開発」指令",
    "637": "「熟練搭乗員」養成",
    "1123": "改良三座水上偵察機の増備",
  };
  const questDetailToVerify = {
    "261": "鎮守府正面の対潜哨戒を反復実施し、安全な海上輸送路を確保せよ！",
    "256": "潜水艦戦力を中核とした艦隊で中部海域哨戒線へ反復出撃、敵戦力を漸減せよ！",
    "888": "鉄底海峡戦果拡張：「鳥海」「青葉」「衣笠」「加古」「古鷹」「天龍」「夕張」の中から4隻を含む突入<br>艦隊を編成。南方海域前面及びサブ島沖海域、サーモン海域に突入、敵艦隊を撃滅せよ！",
    "637": "勲章x2消費：「鳳翔」秘書艦に練度max及び改修max「九六式艦戦」を搭載、熟練搭乗員を養成せよ！<br>(任務達成後、部隊は消滅します)",
    "1123": "旗艦「利根改二」または「由良改二」第一スロに最大改修「零式水上偵察機」。「九七式艦攻(九三一空)」<br>x2廃棄、ボーキ950、新型航空兵装資材x2、開発資材x35、熟練搭乗員x2を準備！",
  };
  const akashiRecipesToIgnore = [101, 201, 301];

  const apis = {
    "api_get_member/questlist": [processQuestList],
    "api_req_quest/clearitemget": [processClearItemGet],

    "api_req_kousyou/remodel_slotlist": [processRemodelSlotList],
    "api_req_kousyou/remodel_slotlist_detail": [processRemodelSlotListDetail],
    "api_req_kousyou/remodel_slot": [processRemodelSlot],
  };

  let prevQuestIdList = [], prevAllQuestsHash = false, alterQuestDetected = false;

  function processData(har) {
    const handlers = apis[har.call];
    if (!handlers) {
      return;
    }

    handlers.forEach(handler => handler(har));
  }

  function postData(path, body,
    completeCallback = (xhr) => { },
    successCallback = (data) => { },
    errorCallback = (xhr, statusText, httpError) => { }) {
    const url = new URL(path, baseUrl);
    return $.ajax({
      async: true,
      method: "POST",
      url: url.href,
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "x-origin": "KC3",
        "x-version": kc3version,
      },
      data: JSON.stringify(body),
      complete: completeCallback,
      success: successCallback,
      error: errorCallback,
    }).done(() => {
      console.log("KCRDBSubmission", path, "done");
    }).fail((xhr, statusText, httpError) => {
      const errMsg = httpError || [statusText, xhr.status].filter(v => !!v).join(" ") || "Error";
      console.log("KCRDBSubmission", path, errMsg);
    });
  }

  function verifyIfQuestAltered(list) {
    alterQuestDetected = !!(Array.isArray(list) && list.find(q => {
      if (q == -1) return false;
      const id = (q || {}).api_no;
      if (questTitleToVerify[id] && q.api_title !== questTitleToVerify[id]) return true;
      if (questDetailToVerify[id] && q.api_detail !== questDetailToVerify[id]) return true;
      return false;
    }));
  }

  function hasQuestListChange(list, isSubList = false) {
    const currentIdList = !Array.isArray(list) ? []
      : list.map(q => ((q != -1 && q) || {}).api_no || -1).filter(v => v !== -1);
    const diffList = currentIdList.diff(prevQuestIdList);
    let hasDiff = diffList.length > 0;

    if (!isSubList) {
      const fullListHash = Array.isArray(list) && JSON.stringify(list).hashCode();
      hasDiff = fullListHash !== prevAllQuestsHash;
      prevQuestIdList = currentIdList;
      prevAllQuestsHash = fullListHash;
    } else if (hasDiff) prevQuestIdList.push(...diffList);

    return hasDiff;
  }

  /**
   * On quest screen
   */
  function processQuestList(har) {
    if (alterQuestDetected) return;
    const tabId = parseInt(har.params.api_tab_id);
    const list = har.response.api_data.api_list;
    if (tabId === 0) verifyIfQuestAltered(list);
    if (alterQuestDetected) return;
    if (!hasQuestListChange(list, tabId > 0)) return;

    postData("quests", { list });
  }

  /**
   * On quest finish
   */
  function processClearItemGet(har) {
    if (alterQuestDetected) return;
    const api_quest_id = Number(har.params.api_quest_id);
    const data = har.response.api_data;
    const items = { api_quest_id, data };

    const selectNoKey = "api_select_no";
    const selectNoParams = Object.keys(har.params).filter(key => key.startsWith(selectNoKey));
    if (selectNoParams.length > 0) {
      const pos = selectNoKey.length;
      selectNoParams.sort((a, b) => Number(a.substring(pos)) - Number(b.substring(pos)));
      items.api_select_no = selectNoParams.map(k => Number(har.params[k]));
    }

    postData("quest-items", items);
  }

  function prepareRemodelBasicInfo(har) {
    const fleet1 = PlayerManager.fleets[0];
    return {
      flag_ship_id: fleet1.ship(0).masterId || 0,
      helper_ship_id: fleet1.ship(1).masterId || 0,
      day: Date.getJstDate(har.headers.Date).getDay()
    };
  }

  /**
   * On akashi improvement items listed
   */
  function processRemodelSlotList(har) {
    const list = prepareRemodelBasicInfo(har);
    list.data = har.response.api_data;
    if (list.flag_ship_id && list.data) {
      postData("remodel_slotlist", list);
    }
  }

  /**
   * On akashi improvement an item selected
   */
  function processRemodelSlotListDetail(har) {
    const item = prepareRemodelBasicInfo(har);
    item.api_id = Number(har.params.api_id);
    const gearObj = KC3GearManager.get(har.params.api_slot_id);
    item.api_slot_id = gearObj.masterId;
    item.api_slot_level = gearObj.stars || 0;
    item.data = har.response.api_data;

    // Skip submission on invalid states, default recipes
    if (item.flag_ship_id && item.data && gearObj.exists()
      && !akashiRecipesToIgnore.includes(item.api_id)) {
      postData("remodel_slotlist_detail", item);
    }
  }

  /**
   * On akashi improvement previously selected procceeded
   */
  function processRemodelSlot(har) {
    const item = prepareRemodelBasicInfo(har);
    item.api_id = Number(har.params.api_id);
    const gearObj = KC3GearManager.get(har.params.api_slot_id);
    item.api_slot_id = gearObj.masterId;
    item.api_slot_level = gearObj.stars || 0;
    item.api_certain_flag = Number(har.params.api_certain_flag);

    // Deep clone api data to avoid modifying original
    item.data = $.extend(true, {}, har.response.api_data);
    // Remove player's stock resources post-improvement
    delete item.data.api_after_material;
    const isSuccess = !!item.data.api_remodel_flag;
    if (isSuccess) {
      const [idBefore, idAfter] = item.data.api_remodel_id;
      // Fix item id and stars pre-improvement, since submission run after KC3GearManager's update
      item.api_slot_id = idBefore;
      item.api_slot_level = idBefore !== idAfter ? 10 : item.data.api_after_slot.api_level - 1;
      // Remove item member IDs and lock state
      delete item.data.api_after_slot.api_id;
      delete item.data.api_after_slot.api_locked;
      if (Array.isArray(item.data.api_use_slot_id)) {
        item.data.api_use_slot_num = item.data.api_use_slot_id.length;
        delete item.data.api_use_slot_id;
      }
    }

    // Skip submission on invalid states, default recipes, and failed improvement
    if (item.flag_ship_id && har.response.api_data && gearObj.exists()
      && !akashiRecipesToIgnore.includes(item.api_id) && isSuccess) {
      postData("remodel_slot", item);
    }
  }

  window.KCRDBSubmission = {
    processData,
    postData,
  };

})();
