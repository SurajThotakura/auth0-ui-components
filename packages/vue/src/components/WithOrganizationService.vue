<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useScopeManager } from '../composables/use-scope-manager'
import Spinner from './ui/Spinner.vue'

interface Props {
  scopes: string
}

const props = defineProps<Props>()

const { registerScopes, ensured } = useScopeManager()

function normalizeScopes(scopes?: string): string {
  return scopes
    ? scopes
        .split(' ')
        .map((s) => s.trim())
        .filter(Boolean)
        .sort()
        .join(' ')
    : ''
}

function scopesSatisfied(required: string, ensuredScopes: string): boolean {
  if (!required) return true
  const requiredSet = required.split(' ').filter(Boolean)
  const ensuredSet = new Set(ensuredScopes.split(' ').filter(Boolean))
  return requiredSet.every((scope) => ensuredSet.has(scope))
}

const normalizedScopes = computed(() => normalizeScopes(props.scopes))
const isReady = computed(() => scopesSatisfied(normalizedScopes.value, ensured['my-org']))

onMounted(() => {
  if (props.scopes) {
    registerScopes('my-org', props.scopes)
  }
})

watch(
  () => props.scopes,
  (newScopes) => {
    if (newScopes) {
      registerScopes('my-org', newScopes)
    }
  }
)
</script>

<template>
  <template v-if="isReady">
    <slot />
  </template>
  <div
    v-else
    class="fixed inset-0 flex items-center justify-center"
  >
    <Spinner class="h-8 w-8" />
  </div>
</template>
