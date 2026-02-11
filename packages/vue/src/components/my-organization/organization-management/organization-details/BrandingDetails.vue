<script setup lang="ts">
import { inject } from 'vue';
import { Link as LinkIcon } from 'lucide-vue-next';

import { useTranslator } from '../../../../composables/use-translator';
import { ORGANIZATION_FORM_KEY } from '../../../../types/my-organization/organization-management/organization-form-context';
import Section from '../../../ui/Section.vue';
import ColorPickerInput from '../../../ui/ColorPickerInput.vue';
import ImagePreviewField from '../../../ui/ImagePreviewField.vue';

const props = withDefaults(
  defineProps<{
    customMessages?: Record<string, unknown>;
    class?: string;
    readOnly?: boolean;
  }>(),
  {
    customMessages: () => ({}),
    readOnly: false,
  },
);

const { t } = useTranslator('organization_management.organization_details', props.customMessages);

// Inject form context from parent
const formContext = inject(ORGANIZATION_FORM_KEY);
if (!formContext) {
  throw new Error('BrandingDetails must be used within OrganizationDetails');
}

const { defineField, errors } = formContext;

// Define form fields
const [logoUrl, logoUrlAttrs] = defineField('branding.logo_url');
const [primaryColor, primaryColorAttrs] = defineField('branding.colors.primary');
const [backgroundColor, backgroundColorAttrs] = defineField('branding.colors.page_background');
</script>

<template>
  <div :class="$props.class">
    <Section :title="t('sections.branding.title')">
      <!-- Logo URL Field -->
      <div class="grid gap-2">
        <label class="text-sm text-(length:--font-size-label) font-medium">
          {{ t('sections.branding.fields.logo.label') }}
        </label>
        <ImagePreviewField
          v-model="logoUrl"
          v-bind="logoUrlAttrs"
          :read-only="readOnly"
          :error="Boolean(errors['branding.logo_url'])"
        >
          <template #startAdornment>
            <div class="p-1.5">
              <LinkIcon :size="16" />
            </div>
          </template>
        </ImagePreviewField>
        <p
          v-if="errors['branding.logo_url']"
          class="text-left text-sm text-(length:--font-size-paragraph) text-destructive-foreground"
          role="alert"
        >
          {{ errors['branding.logo_url'] }}
        </p>
        <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground">
          {{ t('sections.branding.fields.logo.helper_text') }}
        </p>
      </div>

      <!-- Primary Color Field -->
      <div class="grid gap-2">
        <label
          for="primary-color"
          class="text-sm text-(length:--font-size-label) font-medium"
        >
          {{ t('sections.branding.fields.primary_color.label') }}
        </label>
        <ColorPickerInput
          v-model="primaryColor"
          v-bind="primaryColorAttrs"
          :disabled="readOnly"
        />
        <p
          v-if="errors['branding.colors.primary']"
          class="text-left text-sm text-(length:--font-size-paragraph) text-destructive-foreground"
          role="alert"
        >
          {{ errors['branding.colors.primary'] }}
        </p>
        <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground">
          {{ t('sections.branding.fields.primary_color.helper_text') }}
        </p>
      </div>

      <!-- Page Background Color Field -->
      <div class="grid gap-2">
        <label
          for="page-background-color"
          class="text-sm text-(length:--font-size-label) font-medium"
        >
          {{ t('sections.branding.fields.page_background_color.label') }}
        </label>
        <ColorPickerInput
          v-model="backgroundColor"
          v-bind="backgroundColorAttrs"
          :disabled="readOnly"
        />
        <p
          v-if="errors['branding.colors.page_background']"
          class="text-left text-sm text-(length:--font-size-paragraph) text-destructive-foreground"
          role="alert"
        >
          {{ errors['branding.colors.page_background'] }}
        </p>
        <p class="text-sm text-(length:--font-size-paragraph) font-normal text-left text-muted-foreground">
          {{ t('sections.branding.fields.page_background_color.helper_text') }}
        </p>
      </div>
    </Section>
  </div>
</template>
