<script setup lang="ts">
import type {
  OrganizationDetailsFormValues,
  OrganizationPrivate,
  OrganizationDetailsSchemas,
} from '@auth0/universal-components-core'
import {
  getComponentStyles,
  createOrganizationDetailSchema,
} from '@auth0/universal-components-core'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, watch } from 'vue'

import { useTheme } from '../../../../composables/use-theme'
import { useTranslator } from '../../../../composables/use-translator'
import { cn } from '../../../../lib/utils'
import type { OrganizationDetailsProps } from '../../../../types/my-organization/organization-management/organization-details-types'
import Card from '../../../ui/Card.vue'
import FormActions from '../../../ui/FormActions.vue'
import Separator from '../../../ui/Separator.vue'
import Spinner from '../../../ui/Spinner.vue'

import SettingsDetails from './SettingsDetails.vue'
import BrandingDetails from './BrandingDetails.vue'

const props = withDefaults(defineProps<OrganizationDetailsProps>(), {
  isLoading: false,
  customMessages: () => ({}),
  styling: () => ({
    variables: { common: {}, light: {}, dark: {} },
    classes: {},
  }),
  readOnly: false,
})

const emit = defineEmits<{
  save: [payload: OrganizationPrivate]
  cancel: []
}>()

const { t } = useTranslator('organization_management.organization_details', props.customMessages)
const { isDarkMode } = useTheme()

const currentStyles = computed(() => getComponentStyles(props.styling, isDarkMode.value))

const organizationDetailSchema = computed(() => {
  const mergeFieldConfig = (field: keyof OrganizationDetailsSchemas, defaultError: string) => {
    const fieldConfig = props.schema?.[field]
    return fieldConfig
      ? {
          ...fieldConfig,
          errorMessage: fieldConfig.errorMessage || defaultError,
        }
      : {
          errorMessage: defaultError,
        }
  }

  return createOrganizationDetailSchema({
    name: mergeFieldConfig('name', t('sections.settings.fields.name.error')),
    displayName: mergeFieldConfig(
      'displayName',
      t('sections.settings.fields.display_name.error')
    ),
    primaryColor: mergeFieldConfig(
      'primaryColor',
      t('sections.branding.fields.primary_color.error')
    ),
    logoURL: mergeFieldConfig('logoURL', t('sections.branding.fields.logo.error')),
    backgroundColor: mergeFieldConfig(
      'backgroundColor',
      t('sections.branding.fields.page_background_color.error')
    ),
  })
})

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
  })
)

const { handleSubmit, resetForm, meta, setValues } = useForm<OrganizationDetailsFormValues>({
  validationSchema: computed(() => toTypedSchema(organizationDetailSchema.value)),
  initialValues: formValues.value,
})

watch(formValues, (newValues) => {
  setValues(newValues)
}, { deep: true })

const hasUnsavedChanges = computed(() => meta.value.dirty)

const onSubmit = handleSubmit(async (formData) => {
  if (props.formActions?.nextAction?.onClick) {
    const payload: OrganizationPrivate = {
      ...formData,
      id: props.organization.id,
    }

    const success = await props.formActions.nextAction.onClick(payload)

    if (success) {
      resetForm({ values: formData })
    }
  }
})

const handlePreviousAction = () => {
  resetForm()
  props.formActions?.previousAction?.onClick?.()
  emit('cancel')
}
</script>

<template>
  <Spinner v-if="props.isLoading" />
  <div
    v-else
    :style="currentStyles.variables"
    class="w-full space-y-6"
  >
    <form
      @submit.prevent="onSubmit"
      class="space-y-6"
    >
      <Card
        data-testid="organization-details-card"
        :class="cn('p-6', currentStyles.classes?.OrganizationDetails_Card)"
      >
        <div class="space-y-6">
          <SettingsDetails
            :read-only="props.readOnly"
            :custom-messages="props.customMessages"
            :class="currentStyles.classes?.OrganizationDetails_SettingsDetails"
          />

          <Separator />

          <BrandingDetails
            :read-only="props.readOnly"
            :custom-messages="props.customMessages"
            :class="currentStyles.classes?.OrganizationDetails_BrandingDetails"
          />

          <FormActions
            :has-unsaved-changes="hasUnsavedChanges"
            :is-loading="props.formActions.isLoading"
            :next-action="{
              label: t('submit_button_label'),
              disabled:
                props.formActions?.nextAction?.disabled ||
                !hasUnsavedChanges ||
                props.formActions.isLoading ||
                props.readOnly,
              type: 'submit',
            }"
            :previous-action="{
              label: t('cancel_button_label'),
              disabled:
                props.formActions?.previousAction?.disabled || props.formActions.isLoading || props.readOnly,
            }"
            :show-previous="props.formActions?.showPrevious"
            :unsaved-changes-text="t('unsaved_changes_text')"
            :show-unsaved-changes="props.formActions?.showUnsavedChanges"
            :align="props.formActions?.align"
            :class="currentStyles.classes?.OrganizationDetails_FormActions"
            @previous="handlePreviousAction"
          />
        </div>
      </Card>
    </form>
  </div>
</template>
