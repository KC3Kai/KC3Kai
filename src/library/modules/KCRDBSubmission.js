(() => {

  const baseUrl = "https://kcrdb.hitomaru.dev";
  const manifest = chrome.runtime.getManifest() || {};
  const kc3version = manifest.version + ("update_url" in manifest ? "" : "_dev");

  const apis = {
    "api_get_member/questlist": [processQuestList],
    "api_req_quest/clearitemget": [processClearItemGet],
  };

  const questIds = new Set();

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

  /**
   * On quest screen
   */
  function processQuestList(req) {
    const curQuests = req.response.api_data.api_list;
    const newQuests = curQuests.filter((q) => !questIds.has(q.api_no));
    if (!newQuests.length) return;

    postData("quests", { list: newQuests });
    newQuests.forEach((q) => {
      questIds.add(q.api_no);
    });
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
