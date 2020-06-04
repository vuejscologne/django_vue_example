import axios from 'axios';
import { ApiClient } from '@/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create = jest.fn(() => mockedAxios);

describe('login', () => {
  let api;

  beforeAll(() => {
    api = new ApiClient();
  });

  it('fetches successfully token by posting username/password to an API', async () => {
    const data: any = {
      data: {
        access: 'access_token',
        refresh: 'refresh_token',
      },
    };
    mockedAxios.post.mockImplementationOnce(() => Promise.resolve(data));
    const payload = {
      username: 'foobar',
      password: 'password',
    };
    await expect(api.logInGetToken(payload.username, payload.password)).resolves.toEqual(data);
    expect(axios.post).toHaveBeenCalledWith('token/', payload);
  });

  it('setToken writes token to localStorage and sets authorization header', () => {
    const accessToken = 'access_token';
    const token = {access: accessToken, refresh: 'refresh_token'};
    api.setToken(token);
    expect(api.instance.defaults.headers['Authorization']).toEqual(`Bearer ${accessToken}`);
  });

  /*
  it('refreshes access token on expire', async () => {
    const data: any = {
      status: 403,
      response: {
        message: 'Request failed with status code 403',
      }
    }
    //mockedAxios.get.mockImplementationOnce(() => Promise.resolve(data));
    const errorMessage = 'Request failed with status code 403';
    // mockedAxios.get.mockImplementationOnce(() => Promise.reject(data));
    mockedAxios.get.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));
    await expect(api.getMe()).rejects.toThrow(errorMessage);
    // mockedAxios.get.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));
    //const foo = await api.getMe();
    //console.log('foo: ', foo);
  });
  */
});
