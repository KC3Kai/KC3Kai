(() => {

  const windowOrigin = window.origin || '*';

  const msgResolvers = new Map();

  const kcsApisToVerify = new Set([
    // 'api_port/port',
    'api_req_map/start',
    'api_req_mission/start',
    'api_req_kousyou/destroyship',
    'api_req_kaisou/powerup',
  ]);

  const interceptors = {
    kcsverify: {
      config: 'rv_enabled',
      type: 'request',
      resolveHandler: kcsResolveHandler,
    },
    // apiretry: {
    //   config: 'apiretry_enhancer',
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

    if (data.type === 'AXIOS_INT_CONFIG:CHANGE' && data.config) {
      toggleInterceptorBy(data.config);
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
      if (kcsApisToVerify.has(api)) {
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
    if (axios && entry && entry.resolveHandler && entry.activeId === undefined) {
      const args = entry.rejectHandler === undefined
        ? [entry.resolveHandler]
        : [entry.resolveHandler, entry.rejectHandler];
      entry.activeId = axios.interceptors[entry.type].use(...args);
      console.log('Axios interceptor use:', name);
    }
  }

  function ejectInterceptor(name) {
    const entry = interceptors[name];
    if (axios && entry && entry.activeId !== undefined) {
      axios.interceptors[entry.type].eject(entry.activeId);
      entry.activeId = undefined;
      console.log('Axios interceptor eject:', name);
    }
  }

  function toggleInterceptorBy(config) {
    if (config == null || typeof config !== 'object') {
      return;
    }
    Object.keys(interceptors).forEach((name) => {
      const entry = interceptors[name];
      if (entry.config in config) {
        if (config[entry.config]) {
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
      if (event.data && event.data.type === 'AXIOS_INT_CONFIG:DATA') {
        window.removeEventListener('message', handleMsgOnce);
        toggleInterceptorBy(event.data.config);
      }
    };

    window.addEventListener('message', handleMsgOnce);
    window.postMessage({ type: 'AXIOS_INT_CONFIG:GET' }, windowOrigin);
  }

  findAxios();

  //#endregion

})();
