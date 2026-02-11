<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'

const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0()

const handleLogin = () => {
  loginWithRedirect()
}

const handleLogout = () => {
  logout({ logoutParams: { returnTo: window.location.origin } })
}
</script>

<template>
  <header class="absolute inset-x-0 top-0 z-50">
    <nav
      class="bg-white border-b border-gray-200 px-4 py-3 shadow-sm"
    >
      <div class="mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-4">
          <router-link to="/" class="-m-1.5 p-1.5">
            <img
              class="h-8 w-auto"
              src="https://cdn.auth0.com/quantum-assets/dist/2.0.2/logos/auth0/auth0-lockup-en-onlight.svg"
              alt="auth0 logo"
            />
          </router-link>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="isAuthenticated">
            <div class="flex items-center gap-3">
              <img
                v-if="user?.picture"
                :src="user.picture"
                :alt="user?.name || 'User'"
                class="h-8 w-8 rounded-full"
              />
              <span class="text-sm font-medium text-gray-700">
                {{ user?.name }}
              </span>
              <button
                class="px-4 py-2 text-sm font-medium leading-5 text-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none"
                @click="handleLogout"
              >
                Sign Out
              </button>
            </div>
          </template>
          <template v-else>
            <button
              class="px-4 py-2 text-sm font-medium leading-5 text-center text-white capitalize bg-slate-900 rounded-lg hover:bg-slate-700 lg:mx-0 lg:w-auto focus:outline-none"
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
