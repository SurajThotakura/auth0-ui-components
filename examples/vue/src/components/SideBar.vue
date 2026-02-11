<script setup lang="ts">
import { Building, Settings } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
</script>

<template>
  <div
    class="fixed left-0 top-0 z-40 h-full w-64 border-r border-gray-200 bg-white pt-20 shadow-lg dark:border-gray-700 dark:bg-gray-900"
  >
    <div class="space-y-6 p-4">
      <!-- My Organization Section -->
      <div>
        <div class="mb-3 flex items-center gap-2 px-2">
          <Building class="h-4 w-4 flex-shrink-0 text-gray-600 dark:text-gray-300" />
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white"
          >
            My Organization
          </h3>
        </div>
        <ul class="space-y-1">
          <li>
            <RouterLink
              to="/organization-details"
              class="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <Settings class="h-4 w-4 flex-shrink-0" />
              <span class="truncate">Organization Details</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
