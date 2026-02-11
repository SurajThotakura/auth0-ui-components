<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ImageIcon } from 'lucide-vue-next';
import TextField from './TextField.vue';
import { cn } from '../../lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    previewPlaceholder?: string;
    previewClassName?: string;
    imgSizes?: string;
    imgWidth?: number;
    imgHeight?: number;
    error?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    class?: string;
  }>(),
  {
    placeholder: 'Enter image URL',
    previewPlaceholder: 'Paste an image URL to see a preview',
    error: false,
    disabled: false,
    readOnly: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  imageLoad: [imageUrl: string];
  imageError: [error: Error];
}>();

const imageUrl = ref(props.modelValue || '');
const imageError = ref(false);
const isValidUrl = ref(true);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined) {
      imageUrl.value = newValue;
    }
  },
);

const isValidImageUrl = (url: string): boolean => {
  if (!url.trim()) return true;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

function handleInput(value: string) {
  const isValid = isValidImageUrl(value);
  isValidUrl.value = isValid;
  imageUrl.value = value;
  imageError.value = false;
  emit('update:modelValue', value);
}

function handleImageLoad() {
  imageError.value = false;
  emit('imageLoad', imageUrl.value);
}

function handleImageError() {
  imageError.value = true;
  emit('imageError', new Error('Failed to load image'));
}

const hasError = computed(
  () => props.error || (!isValidUrl.value && imageUrl.value.trim() !== '') || imageError.value,
);
const showPreview = computed(
  () => imageUrl.value.trim() !== '' && isValidUrl.value && !imageError.value,
);
</script>

<template>
  <div class="space-y-2">
    <div
      :class="
        cn(
          'border-border/50 bg-muted/50 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border',
          showPreview && 'bg-background p-0',
          previewClassName,
        )
      "
    >
      <img
        v-if="showPreview"
        loading="lazy"
        decoding="async"
        :src="imageUrl"
        :srcset="imageUrl"
        :sizes="imgSizes"
        :width="imgWidth"
        :height="imgHeight"
        alt="Preview"
        class="animate-in fade-in-0 max-h-24 max-w-24 object-contain blur-none transition-all duration-200 ease-in-out"
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <div
        v-else
        class="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 text-sm"
      >
        <slot name="previewIcon">
          <ImageIcon :size="24" />
        </slot>
        {{ imageUrl.trim() !== '' && !isValidUrl ? 'Invalid URL' : previewPlaceholder }}
      </div>
    </div>

    <TextField
      :model-value="modelValue"
      :error="hasError"
      :placeholder="placeholder"
      :disabled="disabled"
      :read-only="readOnly"
      :class="$props.class"
      @update:model-value="handleInput"
    >
      <template v-if="$slots.startAdornment" #startAdornment>
        <slot name="startAdornment" />
      </template>
    </TextField>
  </div>
</template>
