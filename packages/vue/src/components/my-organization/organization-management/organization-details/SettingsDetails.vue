<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useField } from 'vee-validate'

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

const { value: nameValue, errorMessage: nameError } = useField<string>('name')
const { value: displayNameValue, errorMessage: displayNameError } = useField<string>('display_name')
</script>

<template>
  <div :class="props.class">
    <Section :title="t('sections.settings.title')">
      <div class="space-y-4">
        <div>
          <label
            class="text-sm text-(length:--font-size-label) font-medium block mb-1.5"
            for="organization-name"
          >
            {{ t('sections.settings.fields.name.label') }}
          </label>
          <TextField
            id="organization-name"
            v-model="nameValue"
            :placeholder="t('sections.settings.fields.name.placeholder')"
            :error="Boolean(nameError)"
            :aria-invalid="Boolean(nameError)"
            :read-only="readOnly"
          />
          <p
            v-if="nameError"
            class="text-left text-sm text-(length:--font-size-paragraph) text-destructive mt-1"
            role="alert"
          >
            {{ nameError }}
          </p>
          <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground mt-1">
            {{ t('sections.settings.fields.name.helper_text') }}
          </p>
        </div>

        <div>
          <label
            class="text-sm text-(length:--font-size-label) font-medium block mb-1.5"
            for="organization-display-name"
          >
            {{ t('sections.settings.fields.display_name.label') }}
          </label>
          <TextField
            id="organization-display-name"
            v-model="displayNameValue"
            :placeholder="t('sections.settings.fields.display_name.placeholder')"
            :error="Boolean(displayNameError)"
            :aria-invalid="Boolean(displayNameError)"
            :read-only="readOnly"
          />
          <p
            v-if="displayNameError"
            class="text-left text-sm text-(length:--font-size-paragraph) text-destructive mt-1"
            role="alert"
          >
            {{ displayNameError }}
          </p>
          <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground mt-1">
            {{ t('sections.settings.fields.display_name.helper_text') }}
          </p>
        </div>
      </div>
    </Section>
  </div>
</template>
