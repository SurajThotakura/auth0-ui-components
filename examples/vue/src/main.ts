import './style.css';

import { createAuth0 } from '@auth0/auth0-vue';
import { createApp } from 'vue';

import App from './App.vue';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

// Validate Auth0 configuration
if (!domain || !clientId) {
  console.error('Auth0 configuration missing. Please check your .env file.');
  console.error('Required environment variables:');
  console.error('- VITE_AUTH0_DOMAIN');
  console.error('- VITE_AUTH0_CLIENT_ID');
  throw new Error('Auth0 domain and client ID must be set in .env file');
}

// Validate domain format
if (
  !domain.includes('.auth0.com') &&
  !domain.includes('.us.auth0.com') &&
  !domain.includes('.eu.auth0.com') &&
  !domain.includes('.au.auth0.com')
) {
  console.warn('Auth0 domain format might be incorrect. Expected format: your-domain.auth0.com');
}

const app = createApp(App);

app.use(
  createAuth0({
    domain: domain,
    clientId: clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
    },
  }),
);

app.mount('#app');
