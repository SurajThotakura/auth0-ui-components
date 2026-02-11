<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';
import { computed, useSlots } from 'vue';
import { cn } from '../../lib/utils';

const textFieldVariants = cva(
  "bg-input aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative box-border inline-flex w-full shrink-0 cursor-text items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm transition-[color,box-shadow] duration-150 ease-in-out outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border-border/50 text-input-foreground shadow-input-resting hover:shadow-input-hover hover:border-primary/25 focus-within:border-border focus-within:ring-primary/15 focus-within:ring-4',
        error:
          'border-destructive-border/50 text-destructive-foreground shadow-input-destructive-resting hover:shadow-input-destructive-hover hover:border-destructive-border/25 focus-within:ring-destructive-border/15 focus-within:ring-4',
      },
      size: {
        default: 'h-10',
        sm: 'h-9',
        lg: 'h-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type TextFieldVariants = VariantProps<typeof textFieldVariants>;

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    error?: boolean;
    helperText?: string;
    size?: TextFieldVariants['size'];
    variant?: TextFieldVariants['variant'];
    class?: string;
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    id?: string;
    type?: string;
  }>(),
  {
    size: 'default',
    variant: 'default',
    disabled: false,
    readOnly: false,
    type: 'text',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [event: Event];
  input: [event: Event];
  blur: [event: FocusEvent];
}>();

// Use slots to detect adornments
const slots = useSlots();
const hasStartAdornment = computed(() => !!slots.startAdornment);
const hasEndAdornment = computed(() => !!slots.endAdornment);

const wrapperClasses = computed(() =>
  cn(
    textFieldVariants({ variant: props.error ? 'error' : props.variant, size: props.size }),
    'group items-center gap-0.5',
    props.disabled && 'bg-input-muted text-input-muted-foreground cursor-not-allowed opacity-50',
    props.disabled && props.variant === 'default' && 'bg-input-muted',
    hasStartAdornment.value && 'pl-[5px]',
    hasEndAdornment.value && 'pr-[5px]',
    props.class,
  ),
);

const inputClasses = computed(() =>
  cn(
    'w-full flex-1 bg-transparent px-3 py-2 outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium',
    props.disabled && 'bg-input-muted text-input-muted-foreground cursor-not-allowed opacity-50',
    hasStartAdornment.value && 'pl-0',
    hasEndAdornment.value && 'pr-0',
    props.size === 'default' && 'h-10',
    props.size === 'sm' && 'h-9',
    props.size === 'lg' && 'h-11',
  ),
);

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
  emit('input', event);
}
</script>

<template>
  <div class="flex w-full flex-col">
    <component :is="id ? 'div' : 'label'" :class="wrapperClasses">
      <div
        v-if="$slots.startAdornment"
        class="[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <slot name="startAdornment" />
      </div>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :class="inputClasses"
        :disabled="disabled"
        :readonly="readOnly"
        :placeholder="placeholder"
        :aria-invalid="error"
        @input="handleInput"
        @change="emit('change', $event)"
        @blur="emit('blur', $event)"
      />
      <div
        v-if="$slots.endAdornment"
        class="[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <slot name="endAdornment" />
      </div>
    </component>
    <p
      v-if="helperText"
      :class="cn('mt-1.5 px-2 text-xs', error ? 'text-destructive-foreground' : 'text-muted-foreground')"
    >
      {{ helperText }}
    </p>
  </div>
</template>
