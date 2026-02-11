<script setup lang="ts">
import type { HTMLAttributes, Component } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import Button from './Button.vue'

interface BackButtonProps {
  text?: string
  icon?: Component
  onClick: (e: MouseEvent) => void
}

interface Props {
  title?: string
  description?: string
  backButton?: BackButtonProps
  isLoading?: boolean
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn('w-full mb-8', props.class)"
    role="banner"
    :aria-label="title ? `${title} header` : 'Header'"
  >
    <Button
      v-if="backButton"
      variant="link"
      size="default"
      class="flex items-center text-sm mb-3"
      :aria-label="backButton.text || 'Go back'"
      @click="backButton.onClick"
    >
      <component
        :is="backButton.icon || ArrowLeft"
        class="h-4 w-4"
        aria-hidden="true"
      />
      <span v-if="backButton.text">{{ backButton.text }}</span>
    </Button>

    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col min-w-0 flex-1">
        <h1
          v-if="title"
          :class="cn(
            'text-xl sm:text-2xl text-primary md:text-4xl font-bold leading-tight break-words text-left text-(length:--font-size-page-header) mb-0'
          )"
        >
          {{ title }}
        </h1>
        <p
          v-if="description"
          :class="cn(
            'text-base text-muted-foreground leading-relaxed break-words text-left text-(length:--font-size-page-description) mt-2'
          )"
        >
          {{ description }}
        </p>
      </div>

      <div
        v-if="$slots.actions"
        class="flex-shrink-0 flex items-start gap-2 mt-1"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
