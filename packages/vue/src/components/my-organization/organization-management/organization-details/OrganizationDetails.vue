<script setup lang="ts">
import type {
  OrganizationDetailsFormValues,
  OrganizationPrivate,
  OrganizationDetailsSchemas,
} from '@auth0/universal-components-core';
import {
  getComponentStyles,
  createOrganizationDetailSchema,
} from '@auth0/universal-components-core';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { computed, watch, provide } from 'vue';

import { useTheme } from '../../../../composables/use-theme';
import { useTranslator } from '../../../../composables/use-translator';
import { cn } from '../../../../lib/utils';
import type { OrganizationDetailsFormActions } from '../../../../types/my-organization/organization-management/organization-details-types';
import { ORGANIZATION_FORM_KEY } from '../../../../types/my-organization/organization-management/organization-form-context';
import Card from '../../../ui/Card.vue';
import FormActions from '../../../ui/FormActions.vue';
import Separator from '../../../ui/Separator.vue';
import Spinner from '../../../ui/Spinner.vue';
import BrandingDetails from './BrandingDetails.vue';
import SettingsDetails from './SettingsDetails.vue';

const props = withDefaults(
  defineProps<{
    organization: OrganizationPrivate;
    isLoading?: boolean;
    schema?: OrganizationDetailsSchemas;
    customMessages?: Record<string, unknown>;
    styling?: {
      variables?: { common?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> };
      classes?: Record<string, string>;
    };
    readOnly?: boolean;
    formActions: OrganizationDetailsFormActions;
  }>(),
  {
    isLoading: false,
    customMessages: () => ({}),
    styling: () => ({
      variables: { common: {}, light: {}, dark: {} },
      classes: {},
    }),
    readOnly: false,
  },
);

const { t } = useTranslator('organization_management.organization_details', props.customMessages);
const { isDarkMode } = useTheme();

const currentStyles = computed(() => getComponentStyles(props.styling, isDarkMode.value));

const organizationDetailSchema = computed(() => {
  const mergeFieldConfig = (field: keyof OrganizationDetailsSchemas, defaultError: string) => {
    const fieldConfig = props.schema?.[field];
    return fieldConfig
      ? {
          ...fieldConfig,
          errorMessage: fieldConfig.errorMessage || defaultError,
        }
      : {
          errorMessage: defaultError,
        };
  };

  return createOrganizationDetailSchema({
    name: mergeFieldConfig('name', t.value('sections.settings.fields.name.error')),
    displayName: mergeFieldConfig(
      'displayName',
      t.value('sections.settings.fields.display_name.error'),
    ),
    primaryColor: mergeFieldConfig(
      'primaryColor',
      t.value('sections.branding.fields.primary_color.error'),
    ),
    logoURL: mergeFieldConfig('logoURL', t.value('sections.branding.fields.logo.error')),
    backgroundColor: mergeFieldConfig(
      'backgroundColor',
      t.value('sections.branding.fields.page_background_color.error'),
    ),
  });
});

const formValues = computed(
  (): OrganizationDetailsFormValues => ({
    name: props.organization.name,
    display_name: props.organization.display_name,
    branding: {
      logo_url: props.organization.branding.logo_url,
      colors: {
        primary: props.organization.branding.colors.primary,
        page_background: props.organization.branding.colors.page_background,
      },
    },
  }),
);

const { handleSubmit, resetForm, meta, defineField, errors } = useForm<OrganizationDetailsFormValues>({
  validationSchema: computed(() => toTypedSchema(organizationDetailSchema.value)),
  initialValues: formValues.value,
});

// Watch for changes to organization and update form values
watch(
  () => props.organization,
  () => {
    resetForm({ values: formValues.value });
  },
  { deep: true },
);

const hasUnsavedChanges = computed(() => meta.value.dirty);

// Provide form context to child components
provide(ORGANIZATION_FORM_KEY, { defineField, errors });

const onValid = handleSubmit(async (values) => {
  if (props.formActions?.nextAction?.onClick) {
    const payload: OrganizationPrivate = {
      ...values,
      id: props.organization.id,
    };

    const success = await props.formActions.nextAction.onClick(payload);

    if (success) {
      resetForm({ values });
    }
  }
});

function handlePreviousAction() {
  resetForm();
  props.formActions?.previousAction?.onClick?.(new Event('click'));
}
</script>

<template>
  <Spinner v-if="isLoading" />
  <div v-else :style="currentStyles.variables" class="w-full space-y-6">
    <form @submit.prevent="onValid" class="space-y-6">
      <Card
        data-testid="organization-details-card"
        :class="cn('p-6', currentStyles.classes?.OrganizationDetails_Card)"
      >
        <div class="space-y-6">
          <SettingsDetails
            :read-only="readOnly"
            :custom-messages="customMessages"
            :class="currentStyles.classes?.OrganizationDetails_SettingsDetails"
          />

          <Separator />

          <BrandingDetails
            :read-only="readOnly"
            :custom-messages="customMessages"
            :class="currentStyles.classes?.OrganizationDetails_BrandingDetails"
          />

          <FormActions
            :has-unsaved-changes="hasUnsavedChanges"
            :is-loading="formActions.isLoading"
            :next-action="{
              label: t('submit_button_label'),
              disabled:
                formActions?.nextAction?.disabled ||
                !hasUnsavedChanges ||
                formActions.isLoading ||
                readOnly,
              type: 'submit',
            }"
            :show-previous="formActions?.showPrevious"
            :unsaved-changes-text="t('unsaved_changes_text')"
            :show-unsaved-changes="formActions?.showUnsavedChanges"
            :align="formActions?.align"
            :class="currentStyles.classes?.OrganizationDetails_FormActions"
            @previous="handlePreviousAction"
          />
        </div>
      </Card>
    </form>
  </div>
</template>
