import { createAuth0 } from '@auth0/auth0-vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';

import App from './App.vue';
import { config } from './config/env';
import { router } from './router';

import './style.css';

const app = createApp(App);

// 1. Router FIRST (required for Auth0)
app.use(router);

// 2. Auth0 plugin
app.use(
  createAuth0({
    domain: config.auth0.domain,
    clientId: config.auth0.clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  }),
);

// 3. Vue Query
app.use(VueQueryPlugin);

app.mount('#app');
