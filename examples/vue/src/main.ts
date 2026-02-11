import { createAuth0 } from '@auth0/auth0-vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import { config } from './config/env';
import './style.css';
import HomePage from './views/HomePage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomePage,
    },
  ],
});

const app = createApp(App);

app.use(router);
app.use(VueQueryPlugin);

app.use(
  createAuth0({
    domain: config.auth0.domain,
    clientId: config.auth0.clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
      scope: 'openid profile email offline_access read:my_org:details update:my_org:details',
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  }),
);

app.mount('#app');
