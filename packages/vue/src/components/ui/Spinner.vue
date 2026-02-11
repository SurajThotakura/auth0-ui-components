<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';
import { computed } from 'vue';
import { cn } from '../../lib/utils';

const spinnerVariants = cva(
  'inline-block h-8 w-8 animate-spin rounded-full border-2 border-transparent',
  {
    variants: {
      variant: {
        solid: '!border-t-current',
        dots: 'animate-[spin_5s_linear_infinite] border-6 border-dotted border-current',
        pulse: 'animate-pulse bg-current',
      },
      size: {
        sm: 'size-4',
        md: 'size-8',
        lg: 'size-12',
      },
      colorScheme: {
        primary: 'text-primary',
        foreground: 'text-primary-foreground',
        muted: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
      colorScheme: 'primary',
    },
  },
);

type SpinnerVariants = VariantProps<typeof spinnerVariants>;

const props = withDefaults(
  defineProps<{
    variant?: SpinnerVariants['variant'];
    size?: SpinnerVariants['size'];
    colorScheme?: SpinnerVariants['colorScheme'];
    class?: string;
  }>(),
  {
    variant: 'solid',
    size: 'md',
    colorScheme: 'primary',
  },
);

const classes = computed(() =>
  cn(spinnerVariants({ variant: props.variant, size: props.size, colorScheme: props.colorScheme }), props.class),
);
</script>

<template>
  <div :class="classes">
    <span class="sr-only">Loading...</span>
  </div>
</template>
