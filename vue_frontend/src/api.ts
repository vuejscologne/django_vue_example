import axios from 'axios';
import { apiUrl } from '@/env';
import jwtDecode from 'jwt-decode';

import {
  IUserProfile,
  IUserProfileUpdate,
  IUserProfileCreate,
} from '@/interfaces';

let _api: any = null;
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

let inMemoryToken;
function addTokensToLocalMemory(token) {
  inMemoryToken = {
    ...token,
    expiry: jwtDecode(token.access).exp
  };
}

function authHeaderFromLocalMemory() {
  console.log('auth header from local memory: ', inMemoryToken);
  if (!inMemoryToken) return null;
  const token = inMemoryToken.access;
  return { Authorization: `Bearer ${token}` };
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

export const _axios = axios.create(getConfig());

// Add a response interceptor
async function refreshToken(token) {
  return _axios.post('token/refresh/', { refresh: token });
}

async function retryAfterRefresh(response, originalRequest) {
  console.log('success fetching refresh token: ', response);
  _api.setToken(response.data);
  return _api._axios.request(originalRequest);
}

function okResponseInterceptor(response) {
  return response;
}

function errorResponseInterceptor(error) {
  const { response } = error;
  console.log('error response interceptor: ', error);
  console.log('error interceptor original request: ', error.config);
  if (
    response.status &&
    response.status === 403 &&
    response.data &&
    response.data.code === 'token_not_valid'
  ) {
    // try to refresh if authorization failed
    console.log('in interceptor error trying to refresh: ', error.response);
    _api
      .refreshToken('refresh-token')
      .then((refreshResponse) => {
        console.log('refreshed successfully: ', refreshResponse);
        if (!error.config) return refreshResponse;
        return _api.retryAfterRefresh(refreshResponse, error.config);
      })
      .catch((refreshError) => {
        console.log('failed refresh token -> login: ', refreshError);
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
}

function post(url, data) {
  return _axios.post(url, data);
}

function put(config) {
  return _axios.put(config);
}

// Api functions
async function logInGetToken(username: string, password: string) {
  return _api.post('token/', { username, password });
}

function logOut() {
  removeTokensFromLocalStorage();
}

async function addRefreshCheck() {
  const interval = 60;
  setInterval(async () => {
    console.log('refresh check: ', inMemoryToken, Math.round(new Date().getTime() / 1000));
    if (inMemoryToken) {
      const epoch = Math.round(new Date().getTime() / 1000);
      if (inMemoryToken.expiry <= (epoch + interval)) {
        console.log('refreshing token...');
        const token = await refreshToken(inMemoryToken.refresh);
        addTokensToLocalMemory(token);
      }
    }
  }, interval * 1000);
}

function setToken(token) {
  console.log('set token: ', token);
  console.log('decoded token: ', jwtDecode(token.access));
  // addTokensToLocalStorage(token);
  addTokensToLocalMemory(token);
  _axios.defaults.headers = {
    ..._axios.defaults.headers,
    ...authHeaderFromLocalMemory(),
    // ...authHeaderFromLocalStorage(),
  };
  addRefreshCheck();
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
    // eslint-disable-next-line
    new_password: password
  });
}

_api = {
  _axios,
  get,
  put,
  post,
  refreshToken,
  retryAfterRefresh,
  errorResponseInterceptor,
  logInGetToken,
  logOut,
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

export default _api;
