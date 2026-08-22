(() => {

  const filterApis = new Set([
    // 'api_port/port',
    'api_req_map/start',
    'api_req_mission/start',
  ]);

  const msgResolvers = new Map();

  let axios;
  /**
   * Use `null` as id can be `0`
   */
  let kcsInterceptorId = null;

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
    // console.debug(data);
    if (!data) {
      return;
    }

    if (data.type === 'CONFIG:CHANGE' && data.config && axios) {
      if (data.config.rv_enabled) {
        useKcsInterceptor();
      } else {
        ejectKcsInterceptor();
      }
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

  function kcsRequestHandler(config) {
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
  }

  function useKcsInterceptor() {
    if (axios && kcsInterceptorId === null) {
      console.log('KCSAPI interceptor active');
      kcsInterceptorId = axios.interceptors.request.use(kcsRequestHandler);
    }
  }

  function ejectKcsInterceptor() {
    if (axios && kcsInterceptorId !== null) {
      console.log('KCSAPI interceptor inactive');
      axios.interceptors.request.eject(kcsInterceptorId);
      kcsInterceptorId = null;
    }
  }

  function findAxios() {
    axios = window.axios;

    if (!axios) {
      setTimeout(() => findAxios(), 1000);
      return;
    }

    new Promise((resolve) => {
      const onMsg = (event) => {
        if (event.data && event.data.type === 'RV_CONFIG:DATA') {
          resolve(event.data.rv_enabled);
          window.removeEventListener('message', onMsg);
        }
      };
      window.addEventListener('message', onMsg);
      window.postMessage({ type: 'RV_CONFIG:GET' });
    })
      .then((rv_enabled) => {
        if (rv_enabled) {
          useKcsInterceptor();
        }
      });
  }

  findAxios();

  //#endregion

})();
