<script setup lang="ts">
import {
  getComponentStyles,
  MY_ORGANIZATION_DETAILS_EDIT_SCOPES,
} from '@auth0/universal-components-core'
import { computed } from 'vue'

import { OrganizationDetails } from '../../../components/my-organization/organization-management/organization-details'
import Header from '../../../components/ui/Header.vue'
import Spinner from '../../../components/ui/Spinner.vue'
import WithOrganizationService from '../../../components/WithOrganizationService.vue'
import { useOrganizationDetailsEdit } from '../../../composables/my-organization/organization-management/use-organization-details-edit'
import { useTheme } from '../../../composables/use-theme'
import { useTranslator } from '../../../composables/use-translator'
import type { OrganizationDetailsEditProps } from '../../../types/my-organization/organization-management/organization-details-edit-types'

const props = withDefaults(defineProps<OrganizationDetailsEditProps>(), {
  customMessages: () => ({}),
  styling: () => ({
    variables: { common: {}, light: {}, dark: {} },
    classes: {},
  }),
  readOnly: false,
  hideHeader: false,
})

const { t } = useTranslator('organization_management.organization_details_edit', props.customMessages)
const { isDarkMode } = useTheme()

const {
  organization,
  isFetchLoading,
  formActions: enhancedFormActions,
} = useOrganizationDetailsEdit({
  saveAction: props.saveAction,
  cancelAction: props.cancelAction,
  readOnly: props.readOnly,
  customMessages: props.customMessages,
})

const currentStyles = computed(() => getComponentStyles(props.styling, isDarkMode.value))

const headerTitle = computed(() =>
  t('header.title', {
    organizationName: organization.display_name || organization.name || '',
  })
)

const backButtonConfig = computed(() =>
  props.backButton
    ? {
        ...props.backButton,
        text: t('header.back_button_text'),
      }
    : undefined
)

const detailsCustomMessages = computed(() => {
  const messages = props.customMessages as { details?: Record<string, unknown> } | undefined
  return messages?.details
})
</script>

<template>
  <WithOrganizationService :scopes="MY_ORGANIZATION_DETAILS_EDIT_SCOPES">
    <div
      v-if="isFetchLoading"
      :style="currentStyles.variables"
      class="flex items-center justify-center min-h-96 w-full"
    >
      <Spinner />
    </div>

    <div
      v-else
      :style="currentStyles.variables"
      class="w-full"
    >
      <div
        v-if="!props.hideHeader"
        class="mb-8"
      >
        <Header
          :title="headerTitle"
          :back-button="backButtonConfig"
        />
      </div>

      <div class="mb-8">
        <OrganizationDetails
          :organization="organization"
          :schema="props.schema?.details"
          :custom-messages="detailsCustomMessages"
          :styling="props.styling"
          :read-only="props.readOnly"
          :form-actions="enhancedFormActions"
        />
      </div>
    </div>
  </WithOrganizationService>
</template>
