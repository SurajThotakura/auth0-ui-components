<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useField } from 'vee-validate'
import { Link as LinkIcon } from 'lucide-vue-next'

import { useTranslator } from '../../../../composables/use-translator'
import Section from '../../../ui/Section.vue'
import TextField from '../../../ui/TextField.vue'

interface Props {
  readOnly?: boolean
  customMessages?: Record<string, unknown>
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  customMessages: () => ({}),
})

const { t } = useTranslator('organization_management.organization_details', props.customMessages)

const { value: logoUrlValue, errorMessage: logoUrlError } = useField<string>('branding.logo_url')
const { value: primaryColorValue, errorMessage: primaryColorError } = useField<string>('branding.colors.primary')
const { value: pageBackgroundValue, errorMessage: pageBackgroundError } = useField<string>('branding.colors.page_background')
</script>

<template>
  <div :class="props.class">
    <Section :title="t('sections.branding.title')">
      <div class="space-y-4">
        <div>
          <label class="text-sm text-(length:--font-size-label) font-medium block mb-1.5">
            {{ t('sections.branding.fields.logo.label') }}
          </label>
          <TextField
            v-model="logoUrlValue"
            :read-only="readOnly"
            :error="Boolean(logoUrlError)"
          >
            <template #startAdornment>
              <div class="p-1.5">
                <LinkIcon class="h-4 w-4" />
              </div>
            </template>
          </TextField>
          <p
            v-if="logoUrlError"
            class="text-left text-sm text-(length:--font-size-paragraph) text-destructive mt-1"
            role="alert"
          >
            {{ logoUrlError }}
          </p>
          <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground mt-1">
            {{ t('sections.branding.fields.logo.helper_text') }}
          </p>
        </div>

        <div>
          <label
            class="text-sm text-(length:--font-size-label) font-medium block mb-1.5"
            for="primary-color"
          >
            {{ t('sections.branding.fields.primary_color.label') }}
          </label>
          <div class="flex items-center gap-2">
            <input
              id="primary-color"
              v-model="primaryColorValue"
              type="color"
              :disabled="readOnly"
              class="h-10 w-14 cursor-pointer rounded border border-border"
            />
            <TextField
              v-model="primaryColorValue"
              :read-only="readOnly"
              :error="Boolean(primaryColorError)"
              class="flex-1"
            />
          </div>
          <p
            v-if="primaryColorError"
            class="text-left text-sm text-(length:--font-size-paragraph) text-destructive mt-1"
            role="alert"
          >
            {{ primaryColorError }}
          </p>
          <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground mt-1">
            {{ t('sections.branding.fields.primary_color.helper_text') }}
          </p>
        </div>

        <div>
          <label
            class="text-sm text-(length:--font-size-label) font-medium block mb-1.5"
            for="page-background-color"
          >
            {{ t('sections.branding.fields.page_background_color.label') }}
          </label>
          <div class="flex items-center gap-2">
            <input
              id="page-background-color"
              v-model="pageBackgroundValue"
              type="color"
              :disabled="readOnly"
              class="h-10 w-14 cursor-pointer rounded border border-border"
            />
            <TextField
              v-model="pageBackgroundValue"
              :read-only="readOnly"
              :error="Boolean(pageBackgroundError)"
              class="flex-1"
            />
          </div>
          <p
            v-if="pageBackgroundError"
            class="text-left text-sm text-(length:--font-size-paragraph) text-destructive mt-1"
            role="alert"
          >
            {{ pageBackgroundError }}
          </p>
          <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground mt-1">
            {{ t('sections.branding.fields.page_background_color.helper_text') }}
          </p>
        </div>
      </div>
    </Section>
  </div>
</template>
