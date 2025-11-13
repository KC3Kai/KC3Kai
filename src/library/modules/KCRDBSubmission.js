(() => {

  const baseUrl = "https://kcrdb.hitomaru.dev";
  const manifest = chrome.runtime.getManifest() || {};
  const kc3version = manifest.version + ("update_url" in manifest ? "" : "_dev");

  const apis = {
    "api_get_member/questlist": [processQuestList],
    "api_req_quest/clearitemget": [processClearItemGet],
  };

  let prevQuestIdList = [];

  function processData(req) {
    const handlers = apis[req.call];
    if (!handlers) {
      return;
    }

    handlers.forEach(handler => handler(req));
  }

  function postData(path, body,
    completeCallback = (xhr) => {},
    successCallback = (data) => {},
    errorCallback = (xhr, statusText, httpError) => {}) {
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

  function hasQuestListChange(list) {
    const currentIdList = !Array.isArray(list) ? [] : list.map(q => Number(q.api_no));
    const diffList = currentIdList.diff(prevQuestIdList);
    const hasDiff = currentIdList.length !== prevQuestIdList.length || diffList.length > 0;
    if (hasDiff) prevQuestIdList = currentIdList;
    return hasDiff;
  }

  /**
   * On quest screen
   */
  function processQuestList(req) {
    // only handles 'All quests' tab for now
    if (parseInt(req.params.api_tab_id) !== 0) return;
    const list = req.response.api_data.api_list;
    if (!hasQuestListChange(list)) return;
    postData("quests", { list });
  }

  /**
   * On quest finish
   */
  function processClearItemGet(req) {
    // reversed for unlocks check?
  }

  window.KCRDBSubmission = {
    processData,
    postData,
  };

})();
