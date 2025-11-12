(() => {

  const baseUrl = "https://kcrdb.hitomaru.dev"
  const manifest = chrome.runtime.getManifest() || {};
  const kc3version = manifest.version + ("update_url" in manifest ? "" : "_dev");

  const apis = {
    "api_get_member/questlist": [processQuestList],
    "api_req_quest/clearitemget": [processClearItemGet],
  };

  let forcePostQuestList = false

  function processData(req) {
    const handlers = apis[req.call];
    if (!handlers) {
      return;
    }

    handlers.forEach(handler => handler(req));
  }

  function postData(path, body) {
    const url = new URL(path, baseUrl)
    return $.ajax({
      async: true,
      method: "POST",
      url: url.href,
      headers: {
        "content-type": "application/json",
        "x-origin": "KC3",
        "x-version": kc3version,
      },
      data: JSON.stringify(body),
    })
      .done(() => {
        console.log("KCRDBSubmission", path, "ok");
      })
      .fail((xhr, status, error) => {
        console.warn("KCRDBSubmission", path, error);
      })
  }

  /**
   * On quest screen
   */
  function processQuestList(req) {
    if (!forcePostQuestList && req.params.api_tab_id !== "0") {
      return;
    }

    const list = req.response.api_data.api_list;
    postData("quests", { list });
    forcePostQuestList = false
  }

  /**
   * On quest finish
   */
  function processClearItemGet(req) {
    forcePostQuestList = true
  }

  window.KCRDBSubmission = {
    processData,
    postData,
  };

})()
