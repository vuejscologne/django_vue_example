'use strict';

import Vue from 'vue';
import axios from 'axios';
import { apiUrl } from '@/env';

import {
  IUserProfile,
  IUserProfileUpdate,
  IUserProfileCreate,
} from '../interfaces';

const TOKEN_PREFIX = 'test_api';
const ACCESS_TOKEN_KEY = `${TOKEN_PREFIX}_access_token`;
const REFRESH_TOKEN_KEY = `${TOKEN_PREFIX}_refresh_token`;

function authHeaderFromLocalStorage() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function removeTokensFromLocalStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function addTokensToLocalStorage(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, token.refresh);
}

function getConfig() {
  const config = {
    baseURL: apiUrl,
  };
  const headers = authHeaderFromLocalStorage();
  if (headers) {
    config['headers'] = headers;
  }
  return config;
}

const _axios = axios.create(getConfig());

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

// Api functions
async function logInGetToken(username: string, password: string) {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  return axios.post(`${apiUrl}/api/token/`, params);
}

function setToken(token) {
  console.log('set token: ', token);
  addTokensToLocalStorage(token);
  _axios.defaults.headers = {
    ..._axios.defaults.headers,
    ...authHeaderFromLocalStorage(),
  }
}

function loggedIn() {
  console.log('loggedIn? ', _axios.defaults.headers);
  return 'Authorization' in _axios.defaults.headers;
}

async function getMe() {
  return _axios.get<IUserProfile>('users/me/');
}

async function updateMe(data: IUserProfileUpdate) {
  return _axios.put<IUserProfile>('users/me/', data);
}

async function getUsers() {
  return _axios.get<IUserProfile[]>('users/');
}

async function updateUser(userId: number, data: IUserProfileUpdate) {
  return _axios.put('users/${userId}/', data);
}

async function createUser(data: IUserProfileCreate) {
  return _axios.post('users/', data);
}

async function passwordRecovery(email: string) {
  return _axios.post('password-recovery/${email}');
}

async function resetPassword(password: string) {
  return _axios.post('reset-password/', {
    // prettier-ignore
    new_password: password
  });
}

export const _api = {
  get,
  put,
  post,
  refreshToken,
  errorResponseInterceptor,
  logInGetToken,
  setToken,
  loggedIn,
  getMe,
  updateMe,
  getUsers,
  updateUser,
  createUser,
  passwordRecovery,
  resetPassword,
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
