<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { RouterLink } from 'vue-router';

const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

const handleLogin = () => {
  loginWithRedirect();
};

const handleLogout = () => {
  logout({ logoutParams: { returnTo: window.location.origin } });
};
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50">
    <nav
      class="border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-4">
          <RouterLink to="/" class="-m-1.5 p-1.5">
            <img
              class="h-8 w-auto"
              src="https://cdn.auth0.com/quantum-assets/dist/2.0.2/logos/auth0/auth0-lockup-en-onlight.svg"
              alt="auth0 logo"
            />
          </RouterLink>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="isAuthenticated">
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{ user?.name || user?.email }}
            </span>
            <button
              class="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium capitalize leading-5 text-white hover:bg-slate-700 focus:outline-none lg:mx-0 lg:w-auto"
              @click="handleLogout"
            >
              Sign Out
            </button>
          </template>
          <template v-else>
            <button
              class="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium capitalize leading-5 text-white hover:bg-slate-700 focus:outline-none lg:mx-0 lg:w-auto"
              @click="handleLogin"
            >
              Sign In
            </button>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>
