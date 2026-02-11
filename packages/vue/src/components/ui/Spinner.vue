<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

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
  }
)

type SpinnerVariants = VariantProps<typeof spinnerVariants>

interface Props {
  variant?: SpinnerVariants['variant']
  size?: SpinnerVariants['size']
  colorScheme?: SpinnerVariants['colorScheme']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'solid',
  size: 'md',
  colorScheme: 'primary',
})
</script>

<template>
  <div
    data-slot="spinner"
    :class="cn(spinnerVariants({ variant, size, colorScheme }), props.class)"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>
