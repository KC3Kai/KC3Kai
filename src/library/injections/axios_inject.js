(() => {

  const filterApis = new Set([
    // 'api_port/port',
    'api_req_map/start',
    'api_req_mission/start',
  ]);

  const msgResolvers = new Map();

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
        console.warn('parseBody', err);
      }
    }

    return body;
  }

  //#endregion

  //#region message

  function _postMsg(data) {
    return new Promise((resolve) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      msgResolvers.set(id, resolve);
      window.postMessage({
        id,
        type: 'KCS_REQ_VERIFY:REQ',
        data,
      }, '*');
    });
  }

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

  //#endregion

  const axios = window.axios;
  if (!axios) {
    return;
  }

  axios.interceptors.request.use((config) => {
    // console.debug(config);
    const method = config.method.toUpperCase();
    if (method === 'POST') {
      const api = parseApi(config.url);
      // console.debug(api);
      if (filterApis.has(api)) {
        const body = parseBody(config.data);
        // console.debug(body);
        return _postMsg({ method, url: api, body })
          .then((result) => {
            if (result && result.data && result.data.shouldConfirm) {
              if (!confirm(result.data.message)) {
                throw new axios.Cancel('Request blocked by user');
              }
            }
            return config;
          })
          .catch((error) => {
            if (axios.isCancel(error)) {
              throw error;
            }
            console.error(error);
            return config;
          });
      }
    }
    return config;
  });

})();
