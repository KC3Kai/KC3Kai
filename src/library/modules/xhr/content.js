(() => {

  console.debug('KC3XHR', 'content.js');

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.id || data.type !== 'WEB_REQ_BLOCKING:REQ') {
      return;
    }

    console.debug('WEB_REQ_BLOCKING:REQ', data);
    chrome.runtime.sendMessage(data, (response) => {
      console.debug('WEB_REQ_BLOCKING:RES', response);
      window.postMessage(response, '*');
    });
  });

})();
