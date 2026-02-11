<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'
import { OrganizationDetails } from '@auth0/universal-components-vue'
import { ref } from 'vue'

const { isAuthenticated, loginWithRedirect } = useAuth0()

const handleLogin = () => {
  loginWithRedirect()
}

const mockOrganization = ref({
  id: 'org_a11y123456789',
  name: 'a11y-corp',
  display_name: 'A11y Corporation',
  branding: {
    logo_url: 'https://cdn.auth0.com/avatars/au.png',
    colors: {
      primary: '#EB5424',
      page_background: '#000000',
    },
  },
})

const formActions = {
  isLoading: false,
  showPrevious: true,
  showUnsavedChanges: true,
  align: 'right' as const,
  previousAction: {
    disabled: false,
    onClick: () => {
      console.log('Cancel clicked')
    },
  },
  nextAction: {
    disabled: false,
    onClick: async (data: typeof mockOrganization.value) => {
      console.log('Save clicked', data)
      mockOrganization.value = { ...mockOrganization.value, ...data }
      return true
    },
  },
}
</script>

<template>
  <div class="bg-white">
    <!-- Hero Section for unauthenticated users -->
    <div v-if="!isAuthenticated" class="relative isolate px-6 pt-14 lg:px-8">
      <div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div class="text-center">
          <h1
            class="text-3xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Auth0 Universal Components
          </h1>
          <p class="mt-6 text-lg leading-8 text-gray-600">
            A collection of pre-built UI components for building Auth0 powered applications with
            Vue.js.
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <button
              class="px-5 py-2 mt-6 text-sm font-medium leading-5 text-center text-white capitalize bg-slate-900 rounded-lg hover:bg-slate-700 lg:mx-0 lg:w-auto focus:outline-none"
              @click="handleLogin"
            >
              Get Started
            </button>
            <a
              href="https://auth0.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              class="px-5 py-2 mt-6 text-sm font-semibold leading-6 text-gray-900"
            >
              Learn more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Organization Details for authenticated users -->
    <div v-else class="px-6 py-8 lg:px-8">
      <div class="mx-auto max-w-4xl">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          Organization Details
        </h2>
        <OrganizationDetails
          :organization="mockOrganization"
          :form-actions="formActions"
          :read-only="false"
        />
      </div>
    </div>
  </div>
</template>
