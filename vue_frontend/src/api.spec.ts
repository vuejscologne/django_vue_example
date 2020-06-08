import api from './api';

describe('apiPlugin', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('expire error triggers refresh logic bsdf', () => {
    const refreshedResponse = {
      data: { access: 'new-access-token' },
      status: 200,
    };
    api.refreshToken = jest
      .fn()
      .mockReturnValue(Promise.resolve(refreshedResponse));

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
    const error = { response: expiredResponse };
    expect(api.errorResponseInterceptor(error)).resolves.toEqual(
      refreshedResponse,
    );
    expect(api.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('wrong 403 does not trigger refresh bsdf', () => {
    const error = { response: { status: 403 } };
    expect(api.errorResponseInterceptor(error)).rejects.toEqual(error);
  });
});
