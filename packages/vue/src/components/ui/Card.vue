<script setup lang="ts">
import { cn } from '../../lib/utils';

defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground shadow-bevel-2xl flex flex-col gap-6 rounded-4xl py-6',
        $props.class,
      )
    "
  >
    <slot />
  </div>
</template>
