import api from './api';

describe('api', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('fetches successfully token by posting username/password to an API', async () => {
    const data: any = {
      data: {
        access: 'access_token',
        refresh: 'refresh_token',
      },
    };
    api.post = jest.fn().mockImplementationOnce(() => Promise.resolve(data));
    const payload = {
      username: 'foobar',
      password: 'password',
    };
    await expect(
      api.logInGetToken(payload.username, payload.password)
    ).resolves.toEqual(data);
    expect(api.post).toHaveBeenCalledWith('token/', payload);
  });

  it('setToken writes token to localStorage and sets authorization header', () => {
    const accessToken = 'access_token';
    const token = { access: accessToken, refresh: 'refresh_token' };
    api.setToken(token);
    expect(api._axios.defaults.headers['Authorization']).toEqual(
      `Bearer ${accessToken}`
    );
  });

  it('expired token triggers refresh logic', () => {
    const refreshedResponse = {
      data: { access: 'new-access-token', refresh: 'new-refresh-token' },
      status: 200,
    };
    api.refreshToken = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(refreshedResponse));

    const expiredResponse = {
      data: {
        code: 'token_not_valid',
        detail: 'Given token not valid for any token type',
        messages: [
          {
            message: 'Token is invalid or expired',
            token_class: 'AccessToken',
            token_type: 'access',
          },
        ],
      },
      status: 403,
    };
    const error = { response: expiredResponse, config: null };
    expect(api.errorResponseInterceptor(error)).resolves.toEqual(
      refreshedResponse
    );
    expect(api.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('retries request after refreshing access token', async () => {
    const originalRequest = {
      url: 'users/me/',
      method: 'get',
    };
    const meResponse = {
      username: 'foobar',
      email: 'foo@bar.com',
      name: 'Full Name',
      url: 'users/foobar/',
    };
    const refreshedResponse = {
      data: { access: 'new-access-token', refresh: 'new-refresh-token' },
      status: 200,
    };
    api._axios.request = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(meResponse));
    expect(
      api.retryAfterRefresh(refreshedResponse, originalRequest)
    ).resolves.toEqual(meResponse);
    expect(api._axios.request).toHaveBeenCalledWith(originalRequest);
  });

  it('wrong 403 does not trigger refresh', () => {
    const error = { response: { status: 403 } };
    expect(api.errorResponseInterceptor(error)).rejects.toEqual(error);
  });
});
