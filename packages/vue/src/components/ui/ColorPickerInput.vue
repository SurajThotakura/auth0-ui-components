<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import TextField from './TextField.vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    class?: string;
  }>(),
  {
    modelValue: '#000000',
    placeholder: 'Enter color value',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const textValue = ref(props.modelValue || '#000000');
const isValidColor = ref(true);
const colorInputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined) {
      textValue.value = newValue;
    }
  },
);

const validateColor = (colorValue: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue);
};

/**
 * Formats hex color input with smart expansion rules:
 * - Single letter: repeat 6 times (e.g., 'a' -> '#aaaaaa')
 * - Two letters: repeat 3 times (e.g., 'ab' -> '#ababab')
 * - Three letters: expand each to 2 (e.g., 'abc' -> '#aabbcc')
 * - Automatically adds # prefix and filters invalid characters
 */
const formatHexInput = (input: string): string => {
  let cleanInput = input.replace(/^#+/, '').toLowerCase();
  cleanInput = cleanInput.replace(/[^0-9a-f]/g, '');

  if (cleanInput.length === 0) return '';

  if (cleanInput.length === 1) {
    cleanInput = cleanInput.repeat(6);
  } else if (cleanInput.length === 2) {
    cleanInput = cleanInput.repeat(3);
  } else if (cleanInput.length === 3) {
    cleanInput = cleanInput
      .split('')
      .map((char) => char + char)
      .join('');
  } else if (cleanInput.length > 6) {
    cleanInput = cleanInput.substring(0, 6);
  }

  return `#${cleanInput}`;
};

function handleInput(value: string) {
  textValue.value = value;
  isValidColor.value = true;
}

function handleBlur() {
  const formattedValue = formatHexInput(textValue.value);
  textValue.value = formattedValue;

  const isValid = validateColor(formattedValue);
  isValidColor.value = isValid;

  if (isValid) {
    emit('update:modelValue', formattedValue);
  } else if (textValue.value) {
    textValue.value = props.modelValue || '#000000';
    isValidColor.value = true;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleBlur();
  }
}

function handleColorSwatchClick() {
  colorInputRef.value?.click();
}

function handleNativeColorChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const newColor = target.value;
  textValue.value = newColor;
  isValidColor.value = true;
  emit('update:modelValue', newColor);
}

const currentColor = computed(() => (isValidColor.value ? textValue.value : '#ccc'));
</script>

<template>
  <div :class="$props.class">
    <!-- Hidden native color picker for fallback -->
    <input
      ref="colorInputRef"
      type="color"
      :value="currentColor"
      :disabled="disabled"
      class="sr-only"
      @input="handleNativeColorChange"
    />
    <TextField
      :model-value="textValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :error="!isValidColor && textValue !== ''"
      @update:model-value="handleInput"
      @blur="handleBlur"
      @keydown="handleKeyDown"
    >
      <template #startAdornment>
        <div class="mx-1 flex h-6 w-6 items-center justify-center">
          <button
            type="button"
            class="hover:ring-primary/20 border-primary/10 h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition-all hover:ring-2"
            :style="{ backgroundColor: currentColor }"
            :disabled="disabled"
            @click="handleColorSwatchClick"
          />
        </div>
      </template>
    </TextField>
  </div>
</template>
