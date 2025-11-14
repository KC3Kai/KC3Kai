(() => {

  const baseUrl = "https://kcrdb.hitomaru.dev";
  const manifest = chrome.runtime.getManifest() || {};
  const kc3version = manifest.version + ("update_url" in manifest ? "" : "_dev");

  const apis = {
    "api_get_member/questlist": [processQuestList],
    "api_req_quest/clearitemget": [processClearItemGet],
  };

  let prevQuestIdList = [], prevAllQuestsHash = false;

  function processData(req) {
    const handlers = apis[req.call];
    if (!handlers) {
      return;
    }

    handlers.forEach(handler => handler(req));
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
    })
      .fail((xhr, statusText, httpError) => {
        const errMsg = httpError || [statusText, xhr.status].filter(v => !!v).join(" ") || "Error";
        console.log("KCRDBSubmission", path, errMsg);
      });
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
  function processQuestList(req) {
    const tabId = parseInt(req.params.api_tab_id);
    const list = req.response.api_data.api_list;
    if (!hasQuestListChange(list, tabId > 0)) return;
    postData("quests", { list });
  }

  /**
   * On quest finish
   */
  function processClearItemGet(req) {
    const api_quest_id = Number(req.params.api_quest_id);
    const data = req.response.api_data;
    postData("quest-items", { api_quest_id, data });
  }

  window.KCRDBSubmission = {
    processData,
    postData,
  };

})();
