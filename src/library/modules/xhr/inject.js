(() => {

  console.debug('KC3XHR', 'inject.js');

  const script = document.createElement('script');

  // Convert the extension's local file path into a URL the webpage can access
  script.src = chrome.runtime.getURL('library/modules/xhr/XMLHttpRequest.js');

  // Fire it off instantly at document_start
  (document.head || document.documentElement).appendChild(script);

  // script.remove();

})();
