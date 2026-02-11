<script setup lang="ts">
import { inject } from 'vue';

import { useTranslator } from '../../../../composables/use-translator';
import { ORGANIZATION_FORM_KEY } from '../../../../types/my-organization/organization-management/organization-form-context';
import Section from '../../../ui/Section.vue';
import TextField from '../../../ui/TextField.vue';

const props = withDefaults(
  defineProps<{
    readOnly?: boolean;
    customMessages?: Record<string, unknown>;
    class?: string;
  }>(),
  {
    readOnly: false,
    customMessages: () => ({}),
  },
);

const { t } = useTranslator('organization_management.organization_details', props.customMessages);

// Inject form context from parent
const formContext = inject(ORGANIZATION_FORM_KEY);
if (!formContext) {
  throw new Error('SettingsDetails must be used within OrganizationDetails');
}

const { defineField, errors } = formContext;

// Define form fields
const [name, nameAttrs] = defineField('name');
const [displayName, displayNameAttrs] = defineField('display_name');
</script>

<template>
  <div :class="$props.class">
    <Section :title="t('sections.settings.title')">
      <!-- Organization Name Field -->
      <div class="grid gap-2">
        <label
          for="organization-name"
          class="text-sm text-(length:--font-size-label) font-medium"
        >
          {{ t('sections.settings.fields.name.label') }}
        </label>
        <TextField
          id="organization-name"
          v-model="name"
          v-bind="nameAttrs"
          :placeholder="t('sections.settings.fields.name.placeholder')"
          :error="Boolean(errors.name)"
          :aria-invalid="Boolean(errors.name)"
          :read-only="readOnly"
        />
        <p
          v-if="errors.name"
          class="text-left text-sm text-(length:--font-size-paragraph) text-destructive-foreground"
          role="alert"
        >
          {{ errors.name }}
        </p>
        <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground">
          {{ t('sections.settings.fields.name.helper_text') }}
        </p>
      </div>

      <!-- Display Name Field -->
      <div class="grid gap-2">
        <label
          for="organization-display-name"
          class="text-sm text-(length:--font-size-label) font-medium"
        >
          {{ t('sections.settings.fields.display_name.label') }}
        </label>
        <TextField
          id="organization-display-name"
          v-model="displayName"
          v-bind="displayNameAttrs"
          :placeholder="t('sections.settings.fields.display_name.placeholder')"
          :error="Boolean(errors.display_name)"
          :aria-invalid="Boolean(errors.display_name)"
          :read-only="readOnly"
        />
        <p
          v-if="errors.display_name"
          class="text-left text-sm text-(length:--font-size-paragraph) text-destructive-foreground"
          role="alert"
        >
          {{ errors.display_name }}
        </p>
        <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground">
          {{ t('sections.settings.fields.display_name.helper_text') }}
        </p>
      </div>
    </Section>
  </div>
</template>
