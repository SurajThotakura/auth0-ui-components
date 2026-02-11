<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '../../lib/utils';
import Button from './Button.vue';
import Spinner from './Spinner.vue';

interface ActionButton {
  label?: string;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: Event) => void;
}

const props = withDefaults(
  defineProps<{
    hasUnsavedChanges?: boolean;
    isLoading?: boolean;
    nextAction?: ActionButton;
    previousAction?: ActionButton;
    showPrevious?: boolean;
    showNext?: boolean;
    showUnsavedChanges?: boolean;
    align?: 'left' | 'right';
    class?: string;
    unsavedChangesText?: string;
  }>(),
  {
    hasUnsavedChanges: false,
    isLoading: false,
    showPrevious: true,
    showNext: true,
    showUnsavedChanges: true,
    align: 'right',
    unsavedChangesText: 'Unsaved changes',
  },
);

const emit = defineEmits<{
  previous: [];
}>();

const nextButtonProps = computed(() => ({
  type: 'submit' as const,
  label: 'Save',
  variant: 'primary' as const,
  ...props.nextAction,
}));

const previousButtonProps = computed(() => ({
  label: 'Cancel',
  variant: 'outline' as const,
  ...props.previousAction,
}));

const showUnsavedIndicator = computed(() => props.showUnsavedChanges && props.hasUnsavedChanges);
const isPreviousVisible = computed(() =>
  props.showUnsavedChanges ? props.showPrevious && props.hasUnsavedChanges : props.showPrevious,
);
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-row items-center gap-2 p-2',
        align === 'right' ? 'justify-end' : 'justify-start',
        $props.class,
      )
    "
  >
    <span v-if="showUnsavedIndicator" class="text-sm text-muted-foreground">
      {{ unsavedChangesText }}
    </span>

    <Button
      v-if="showPrevious"
      type="button"
      :variant="previousButtonProps.variant"
      :size="previousButtonProps.size"
      :disabled="previousButtonProps.disabled || isLoading || (showUnsavedChanges && !hasUnsavedChanges)"
      :class="cn('FormActions-previous', showUnsavedChanges && !isPreviousVisible && 'invisible')"
      :aria-hidden="showUnsavedChanges && !isPreviousVisible"
      :tabindex="isPreviousVisible ? 0 : -1"
      @click="emit('previous')"
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
      @click="nextButtonProps.type !== 'submit' && nextButtonProps.onClick?.($event)"
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
