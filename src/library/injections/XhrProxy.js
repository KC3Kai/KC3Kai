(() => {

  const filterApis = [
    'api_port/port',
    'api_req_map/start',
    'api_req_mission/start',
  ];

  const msgResolvers = new Map();

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.id || data.type !== 'KCS_REQ_VERIFY:RES') {
      return;
    }

    const resolver = msgResolvers.get(data.id);
    if (!resolver) {
      return;
    }

    resolver(data);
    msgResolvers.delete(data.id);
  });

  //#region helper

  function parseApi(url) {
    const basePath = '/kcsapi/';
    const res = url.substring(url.indexOf(basePath) + basePath.length);
    return res;
  }

  function parseBody(body) {
    if (body instanceof FormData) {
      const obj = {};
      for (const [key, value] of body.entries()) {
        obj[key] = value;
      }
      return obj;
    }

    if (typeof body === 'string') {
      try {
        const params = new URLSearchParams(body);
        return Object.fromEntries(params.entries());
      } catch (err) {
        console.warn(err);
      }
    }

    return body;
  }

  //#endregion

  //#region XHR

  const OriginalXHR = window.XMLHttpRequest;

  function ProxiedXHR() {
    const xhr = new OriginalXHR();

    let _method;
    let _url;
    let _body;
    let _state = 'PENDING';
    let _args;

    const originalOpen = xhr.open;
    xhr.open = function (method, url, ...args) {
      _method = String(method).toUpperCase();
      _url = String(url);
      // console.debug('XHR', 'open', { method, url });
      return originalOpen.apply(this, [method, url, ...args]);
    };

    const originalSend = xhr.send;
    xhr.send = function (body) {
      if (_state === 'BLOCKED') {
        throw new Error('Request blocked by user');
      }

      if (_state === 'APPROVED') {
        return originalSend.apply(this, _args);
      }

      if (body && _method === 'POST' && _url.includes('/kcsapi/')) {
        _body = parseBody(body);
        console.debug('XHR', 'send', { method: _method, url: _url, body: _body });

        if (filterApis.includes(parseApi(_url))) {
          _args = arguments;

          // Generate high-precision transaction key
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          new Promise((resolve) => {
            msgResolvers.set(id, resolve);
            window.postMessage({
              id,
              type: 'KCS_REQ_VERIFY:REQ',
              data: {
                method: _method,
                url: parseApi(_url),
                body: _body
              }
            }, '*');
          })
            .then((result) => {
              if (result && result.data && result.data.shouldConfirm) {
                if (!confirm(result.data.message)) {
                  setTimeout(() => {
                    if (typeof xhr.onerror === 'function') xhr.onerror(new ProgressEvent('error'));
                    if (typeof xhr.onloadend === 'function') xhr.onloadend(new ProgressEvent('loadend'));
                  }, 0);

                  _state = 'BLOCKED';
                  xhr.send(body);
                  return;
                }
              }

              _state = 'APPROVED';
              xhr.send(body);
            });

          return;
        }
      }

      return originalSend.apply(this, arguments);
    };

    return xhr;
  }

  ProxiedXHR.prototype = OriginalXHR.prototype;
  Object.keys(OriginalXHR).forEach(key => {
    ProxiedXHR[key] = OriginalXHR[key];
  });

  window.XMLHttpRequest = ProxiedXHR;

  //#endregion

})();
