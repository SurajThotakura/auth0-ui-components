<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'
import { Auth0ComponentProvider } from '@auth0/universal-components-vue'

import NavBar from './components/NavBar.vue'

const { isAuthenticated, isLoading } = useAuth0()
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
    <div class="min-h-screen bg-white">
      <NavBar />
      <main class="pt-16">
        <div v-if="isLoading" class="flex items-center justify-center min-h-96">
          <div class="text-gray-600">Loading...</div>
        </div>
        <router-view v-else />
      </main>
    </div>
  </Auth0ComponentProvider>
</template>
