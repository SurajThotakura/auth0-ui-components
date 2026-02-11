<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { Auth0ComponentProvider } from '@auth0/universal-components-vue';

import NavBar from './components/NavBar.vue';
import SideBar from './components/SideBar.vue';

const { isLoading, isAuthenticated } = useAuth0();
</script>

<template>
  <Auth0ComponentProvider
    :auth-details="{
      domain: 'devex.ca.auth0.com'
    }"
    :i18n="{ currentLanguage: 'en' }"
    :theme-settings="{
      theme: 'default',
      mode: 'light',
    }"
  >
    <div class="min-h-screen" data-theme="default">
      <NavBar />
      <SideBar v-if="isAuthenticated" />
      <main :class="['pt-16', isAuthenticated ? 'ml-64' : '']">
        <div v-if="isLoading" class="flex min-h-screen items-center justify-center">
          <div class="text-gray-600">Loading...</div>
        </div>
        <RouterView v-else />
      </main>
    </div>
  </Auth0ComponentProvider>
</template>
