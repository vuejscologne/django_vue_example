import axios from 'axios';
import { apiUrl } from '@/env';
import router from './router';
import {
  IUserProfile,
  IUserProfileUpdate,
  IUserProfileCreate,
} from './interfaces';

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

// const instance = axios.create(getConfig());

/*
export const api = {
  async logInGetToken(username: string, password: string) {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    return axios.post(`${apiUrl}/api/token/`, params);
  },
  setToken(token) {
    console.log('set token: ', token);
    addTokensToLocalStorage(token);
    instance.defaults.headers = authHeaderFromLocalStorage();
  },
  loggedIn() {
    console.log('loggedIn? ', instance.defaults.headers);
    return 'Authorization' in instance.defaults.headers;
  },
  async getMe() {
    return axios.get<IUserProfile>('users/me/');
  },
  async updateMe(data: IUserProfileUpdate) {
    return axios.put<IUserProfile>('users/me/', data);
  },
  async getUsers() {
    return axios.get<IUserProfile[]>('users/');
  },
  async updateUser(userId: number, data: IUserProfileUpdate) {
    return axios.put('users/${userId}/', data);
  },
  async createUser(data: IUserProfileCreate) {
    return axios.post('users/', data);
  },
  async passwordRecovery(email: string) {
    return axios.post('password-recovery/${email}');
  },
  async resetPassword(password: string) {
    return axios.post('reset-password/', {
      // prettier-ignore
      new_password: password
    });
  },
};
*/

export class ApiClient {
  private instance: any;

  constructor() {
    const instance = axios.create(getConfig());
    /*
    instance.interceptors.response.use(
      function(response) {
        return response;
      },
      function(error) {
        if (error.response.status === 403) {
          console.log("in interceptor error: ", error.response);
          // try to refresh token
          const token = localStorage.getItem(REFRESH_TOKEN_KEY);
          instance
            .post("token/refresh/", { refresh: token })
            .then(function(response) {
              console.log("success fetching refresh token: ", response);
              api.setToken(response.data);
            })
            .catch(function(error) {
              console.log("failed refresh token -> login: ", error);
              removeTokensFromLocalStorage();
              // since refresh didn't work -> goto login
              console.log("goto login..");
              router.push({ name: "Login" });
            });
        }
        return Promise.reject(error);
      }
    );
    */
    this.instance = instance;
    console.log('in constructor: ');
  }

  public async logInGetToken(username: string, password: string) {
    const payload = { username, password };
    return this.instance.post('token/', payload);
  }

  public loggedIn() {
    console.log('loggedIn? ', this.instance.defaults.headers);
    return 'Authorization' in this.instance.defaults.headers;
  }

  public setToken(token) {
    console.log('set token: ', token);
    addTokensToLocalStorage(token);
    this.instance.defaults.headers = {
      ...this.instance.defaults.headers,
      ...this.authHeaderFromLocalStorage(),
    };
  }

  public logOut() {
    console.log('api logout..');
    removeTokensFromLocalStorage();
  }

  public async getMe() {
    return this.instance.get('users/me/');
  }

  public async updateMe(data: IUserProfileUpdate) {
    return this.instance.put('users/me/', data);
  }

  public async getUsers() {
    return this.instance.get('users/');
  }

  public async updateUser(userId: number, data: IUserProfileUpdate) {
    return this.instance.put('users/${userId}/', data);
  }

  public async createUser(data: IUserProfileCreate) {
    return this.instance.post('users/', data);
  }

  public async passwordRecovery(email: string) {
    return this.instance.post('password-recovery/${email}');
  }

  public async resetPassword(password: string) {
    return this.instance.post('reset-password/', {
      // prettier-ignore
      new_password: password,
    });
  }

  private authHeaderFromLocalStorage() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }
}

export const api = new ApiClient();
/*
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.status === 403) {
      console.log('in interceptor error: ', error.response);
      // try to refresh token
      const token = localStorage.getItem(REFRESH_TOKEN_KEY);
      instance
        .post('token/refresh/', { refresh: token })
        .then((response) => {
          console.log('success fetching refresh token: ', response);
          api.setToken(response.data);
        })
        .catch((refreshError) => {
          console.log('failed refresh token -> login: ', refreshError);
          removeTokensFromLocalStorage();
          // since refresh didn't work -> goto login
          console.log('goto login..');
          router.push({ name: 'Login' });
        });
    }
    return Promise.reject(error);
  },
);
*/
