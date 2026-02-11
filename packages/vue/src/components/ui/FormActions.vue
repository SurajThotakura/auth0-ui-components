<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import Button from './Button.vue'
import Spinner from './Spinner.vue'

interface ActionButton {
  label?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon'
}

interface Props {
  hasUnsavedChanges?: boolean
  isLoading?: boolean
  nextAction?: ActionButton
  previousAction?: ActionButton
  showPrevious?: boolean
  showNext?: boolean
  showUnsavedChanges?: boolean
  align?: 'left' | 'right'
  class?: HTMLAttributes['class']
  unsavedChangesText?: string
}

const props = withDefaults(defineProps<Props>(), {
  hasUnsavedChanges: false,
  isLoading: false,
  showPrevious: true,
  showNext: true,
  showUnsavedChanges: true,
  align: 'right',
  unsavedChangesText: 'Unsaved changes',
})

const emit = defineEmits<{
  previous: []
  next: []
}>()

const DEFAULT_NEXT_ACTION: ActionButton = {
  type: 'submit',
  label: 'Save',
  variant: 'primary',
}

const DEFAULT_PREVIOUS_ACTION: ActionButton = {
  label: 'Cancel',
  variant: 'outline',
}

const nextButtonProps = computed(() => ({
  ...DEFAULT_NEXT_ACTION,
  ...props.nextAction,
}))

const previousButtonProps = computed(() => ({
  ...DEFAULT_PREVIOUS_ACTION,
  ...props.previousAction,
}))

const showUnsavedIndicator = computed(() => props.showUnsavedChanges && props.hasUnsavedChanges)
const isPreviousVisible = computed(() =>
  props.showUnsavedChanges ? props.showPrevious && props.hasUnsavedChanges : props.showPrevious
)

const handlePreviousClick = () => {
  emit('previous')
}

const handleNextClick = () => {
  emit('next')
}
</script>

<template>
  <div
    :class="cn(
      'flex flex-row items-center gap-2 p-2',
      align === 'right' ? 'justify-end' : 'justify-start',
      props.class
    )"
  >
    <span
      v-if="showUnsavedIndicator"
      class="text-sm text-muted-foreground"
    >
      {{ unsavedChangesText }}
    </span>

    <Button
      v-if="showPrevious"
      type="button"
      :variant="previousButtonProps.variant"
      :size="previousButtonProps.size"
      :disabled="previousButtonProps.disabled || isLoading || (showUnsavedChanges && !hasUnsavedChanges)"
      :class="cn(
        'FormActions-previous',
        showUnsavedChanges && !isPreviousVisible && 'invisible'
      )"
      :aria-hidden="showUnsavedChanges && !isPreviousVisible"
      :tabindex="isPreviousVisible ? 0 : -1"
      @click="handlePreviousClick"
    >
      {{ previousButtonProps.label }}
    </Button>

    <Button
      v-if="showNext"
      :type="nextButtonProps.type"
      :variant="nextButtonProps.variant"
      :size="nextButtonProps.size"
      :disabled="nextButtonProps.disabled || isLoading"
      class="FormActions-next min-w-17.5"
      @click="nextButtonProps.type !== 'submit' ? handleNextClick() : undefined"
    >
      <Spinner
        v-if="isLoading"
        :color-scheme="nextButtonProps.variant === 'destructive' ? 'primary' : 'foreground'"
        size="sm"
        aria-hidden="true"
      />
      <template v-else>
        {{ nextButtonProps.label }}
      </template>
    </Button>
  </div>
</template>
