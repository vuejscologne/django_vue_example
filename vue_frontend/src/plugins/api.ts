'use strict';

import Vue from 'vue';
import axios from 'axios';

const config = {};

const _axios = axios.create(config);

// Add a response interceptor
function refreshToken(token) {
  console.log('refresh called - it should not be..');
  return _axios.post('token/refresh/', { refresh: token });
}

function okResponseInterceptor(response) {
  return response;
}

function errorResponseInterceptor(error) {
  const { response } = error;
  if (
    response.status === 403 &&
    response.data &&
    response.data.code === 'token_not_valid'
  ) {
    // try to refresh if authorization failed
    const originalRequest = error.config;
    console.log('in interceptor error trying to refresh: ', error.response);
    _api
      .refreshToken('refresh-token')
      .then((response) => {
        console.log('success fetching refresh token: ', response);
        return Promise.resolve(response);
      })
      .catch((error) => {
        console.log('failed refresh token -> login: ', error);
      });
  }
  return Promise.reject(error);
}

_axios.interceptors.response.use(
  okResponseInterceptor,
  errorResponseInterceptor
);

// Wrap _axios
function get(config) {
  return _axios.get(config);
};

function post(config) {
  return _axios.post(config);
};

function put(config) {
  return _axios.put(config);
};

export const _api = {
  get,
  put,
  post,
  refreshToken,
  errorResponseInterceptor,
};

declare const window: any;
declare const Plugin: any;

Plugin.install = function(Vue, options) {
  Vue.api = _api;
  window.api = _api;
  Object.defineProperties(Vue.prototype, {
    api: {
      get() {
        return _api;
      },
    },
    $api: {
      get() {
        return _api;
      },
    },
  });
};

Vue.use(Plugin);

export default Plugin;
