import Vue from 'vue';
import _api from '@/api';

declare const window: any;
declare const Plugin: any;

Plugin.install = (vueConstructor, options) => {
  vueConstructor.api = _api;
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
