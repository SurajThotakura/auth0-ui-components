<script setup lang="ts">
import type { OrganizationPrivate } from '@auth0/universal-components-core';
import { OrganizationDetails } from '@auth0/universal-components-vue';
import { ref } from 'vue';

const mockOrganization = ref<OrganizationPrivate>({
  id: 'org_123456789',
  name: 'acme-corp',
  display_name: 'Acme Corporation',
  branding: {
    logo_url: 'https://cdn.auth0.com/avatars/au.png',
    colors: {
      primary: '#EB5424',
      page_background: '#000000',
    },
  },
});

const formActions = ref({
  isLoading: false,
  showUnsavedChanges: true,
  align: 'right' as const,
  nextAction: {
    disabled: false,
    onClick: async (data: OrganizationPrivate) => {
      console.log('Save organization:', data);
      return true;
    },
  },
});
</script>

<template>
  <div class="p-6">
    <div class="mx-auto max-w-3xl">
      <h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Organization Details
      </h1>
      <OrganizationDetails
        :organization="mockOrganization"
        :form-actions="formActions"
        :read-only="false"
      />
    </div>
  </div>
</template>
