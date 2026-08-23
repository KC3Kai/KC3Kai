(() => {

  const windowOrigin = window.origin || '*';

  const msgResolvers = new Map();

  const kcsAllowApis = new Set([
    // 'api_port/port',
    'api_req_map/start',
    'api_req_mission/start',
    'api_req_kousyou/destroyship',
  ]);

  const interceptors = {
    kcs: {
      config: 'rv_enabled',
      type: 'request',
      resolveHandler: kcsResolveHandler,
    },
    // retry: {
    //   config: 'rr_enabled',
    //   type: 'response',
    //   resolveHandler: (response) => response,
    //   rejectHandler: retryRejectHandler,
    // },
  };

  let axios;

  //#region helper

  function parseApi(url) {
    const basePath = '/kcsapi/';
    const baseIndex = url.indexOf(basePath);
    const res = baseIndex > -1 ? url.substring(baseIndex + basePath.length) : "";
    return res;
  }

  function parseBody(body) {
    if (typeof body === 'string') {
      try {
        const params = new URLSearchParams(body);
        return Object.fromEntries(params.entries());
      } catch (err) {
        console.warn('Parsing search params data', err, body);
        return {};
      }
    } else if (body instanceof FormData) {
      const obj = {};
      for (const [key, value] of body.entries()) {
        obj[key] = value;
      }
      return obj;
    }
    console.warn('Unknown request payload type', body);
    return {};
  }

  //#endregion

  //#region message

  function postMsg(data) {
    return new Promise((resolve) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      msgResolvers.set(id, resolve);
      window.postMessage({
        id,
        type: 'KCS_REQ_VERIFY:REQ',
        data,
      }, windowOrigin);
    });
  }

  window.addEventListener('message', (event) => {
    const data = event.data;
    // console.debug(data);
    if (!data) {
      return;
    }

    if (data.type === 'CONFIG:CHANGE' && data.config) {
      toggleFromPayload(data.config);
      return;
    }

    if (data.type === 'KCS_REQ_VERIFY:RES' && data.id) {
      const resolver = msgResolvers.get(data.id);
      if (!resolver) {
        return;
      }

      resolver(data);
      msgResolvers.delete(data.id);
    }
  });

  //#endregion

  //#region axios

  //#region handler

  function kcsResolveHandler(config) {
    // console.debug(config);
    const method = config.method.toUpperCase();
    if (method === 'POST') {
      const api = parseApi(config.url);
      // console.debug(api);
      if (kcsAllowApis.has(api)) {
        const body = parseBody(config.data);
        // console.debug(body);
        return postMsg({ method, url: api, body })
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
  }

  //#endregion

  //#region common

  function useInterceptor(name) {
    const entry = interceptors[name];
    if (axios && entry && entry.resolveHandler && entry._activeId === undefined) {
      const args = entry.rejectHandler === undefined
        ? [entry.resolveHandler]
        : [entry.resolveHandler, entry.rejectHandler];
      entry._activeId = axios.interceptors[entry.type].use(...args);
      console.log('AXIOS interceptor use:', name);
    }
  }

  function ejectInterceptor(name) {
    const entry = interceptors[name];
    if (axios && entry && entry._activeId !== undefined) {
      axios.interceptors[entry.type].eject(entry._activeId);
      entry._activeId = undefined;
      console.log('AXIOS interceptor eject:', name);
    }
  }

  function toggleFromPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return;
    }
    Object.keys(interceptors).forEach((name) => {
      const entry = interceptors[name];
      if (entry.config in payload) {
        if (payload[entry.config]) {
          useInterceptor(name);
        } else {
          ejectInterceptor(name);
        }
      }
    });
  }

  //#endregion

  function findAxios() {
    axios = window.axios;

    if (!axios) {
      setTimeout(findAxios, 1000);
      return;
    }

    const handleMsgOnce = (event) => {
      if (event.data && event.data.type === 'RV_CONFIG:DATA') {
        window.removeEventListener('message', handleMsgOnce);
        toggleFromPayload(event.data.config);
      }
    };

    window.addEventListener('message', handleMsgOnce);
    window.postMessage({ type: 'RV_CONFIG:GET' }, windowOrigin);
  }

  findAxios();

  //#endregion

})();
