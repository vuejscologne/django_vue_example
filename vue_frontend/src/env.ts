const env = process.env.VUE_APP_ENV;

let envApiUrl = '';

console.log('env is set to: ', env);
if (env === 'production') {
  envApiUrl = `https://${process.env.VUE_APP_DOMAIN_PROD}`;
} else if (env === 'staging') {
  envApiUrl = `https://${process.env.VUE_APP_DOMAIN_STAG}`;
} else {
  envApiUrl = `http://${process.env.VUE_APP_DOMAIN_DEV}:8000/api/`;
}

export const apiUrl = envApiUrl;
export const appName = process.env.VUE_APP_NAME;
