<script setup lang="ts">
import { cn } from '../../lib/utils';

defineProps<{
  title?: string;
  description?: string;
  class?: string;
}>();
</script>

<template>
  <div :class="cn('space-y-6', $props.class)">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-1 flex-col space-y-2">
        <h3
          v-if="title"
          :class="
            cn(
              'text-lg text-foreground text-(length:--font-size-subtitle) font-semibold mb-1 text-left',
            )
          "
        >
          {{ title }}
        </h3>
        <p
          v-if="description"
          :class="
            cn('text-sm text-muted-foreground text-left text-(length:--font-size-paragraph)')
          "
        >
          {{ description }}
        </p>
      </div>

      <div v-if="$slots.actions" class="mt-1 flex flex-shrink-0 items-start gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div class="space-y-6">
      <slot />
    </div>
  </div>
</template>
