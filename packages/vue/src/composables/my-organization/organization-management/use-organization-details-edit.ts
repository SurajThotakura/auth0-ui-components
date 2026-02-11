import {
  OrganizationDetailsFactory,
  OrganizationDetailsMappers,
  type OrganizationPrivate,
} from '@auth0/universal-components-core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, watch } from 'vue';

import type {
  OrganizationDetailsFormActions,
  UseOrganizationDetailsEditOptions,
  UseOrganizationDetailsEditResult,
} from '../../../types/my-organization/organization-management';
import { useCoreClient } from '../../use-core-client';
import { showToast } from '../../use-toast';
import { useTranslator } from '../../use-translator';

const organizationDetailsQueryKeys = {
  all: ['organization-details'] as const,
  details: () => [...organizationDetailsQueryKeys.all, 'details'] as const,
};

const EMPTY_ORGANIZATION = OrganizationDetailsFactory.create();

export function useOrganizationDetailsEdit({
  saveAction,
  cancelAction,
  readOnly = false,
  customMessages = {},
}: UseOrganizationDetailsEditOptions): UseOrganizationDetailsEditResult {
  const { t } = useTranslator('organization_management.organization_details_edit', customMessages);
  const { coreClient } = useCoreClient();
  const queryClient = useQueryClient();

  const isInitializing = !coreClient;

  const getErrorMessage = (error: unknown): string =>
    error instanceof Error
      ? t('organization_changes_error_message', { message: error.message })
      : t('organization_changes_error_message_generic');

  const organizationQuery = useQuery({
    queryKey: organizationDetailsQueryKeys.details(),
    queryFn: async () => {
      const response = await coreClient!.getMyOrganizationApiClient().organizationDetails.get();
      return OrganizationDetailsMappers.fromAPI(response);
    },
    enabled: computed(() => !!coreClient),
  });

  watch(
    () => organizationQuery.error.value,
    (error) => {
      if (error) {
        showToast({
          type: 'error',
          message: getErrorMessage(error),
        });
      }
    },
  );

  const organization = computed(() => organizationQuery.data.value ?? EMPTY_ORGANIZATION);

  const updateMutation = useMutation({
    mutationFn: async (data: OrganizationPrivate) => {
      const updateData = OrganizationDetailsMappers.toAPI(data);
      const response = await coreClient!
        .getMyOrganizationApiClient()
        .organizationDetails.update(updateData);

      return OrganizationDetailsMappers.fromAPI(response);
    },
    onSuccess: (updatedOrg, variables) => {
      queryClient.setQueryData(organizationDetailsQueryKeys.details(), updatedOrg);

      showToast({
        type: 'success',
        message: t('save_organization_changes_message', {
          organizationName: variables.display_name || variables.name,
        }),
      });

      saveAction?.onAfter?.(variables);
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const hasData = computed(() => !!organizationQuery.data.value);
  const isActionDisabled = computed(() => updateMutation.isPending.value || isInitializing);

  const fetchOrgDetails = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: organizationDetailsQueryKeys.details() });
  };

  const updateOrgDetails = async (data: OrganizationPrivate): Promise<boolean> => {
    if (saveAction?.onBefore && !saveAction.onBefore(data)) {
      return false;
    }

    try {
      await updateMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  const formActions = computed(
    (): OrganizationDetailsFormActions => ({
      isLoading: updateMutation.isPending.value,
      previousAction: {
        disabled: cancelAction?.disabled || readOnly || !hasData.value || isActionDisabled.value,
        onClick: () => cancelAction?.onAfter?.(organization.value),
      },
      nextAction: {
        disabled: saveAction?.disabled || readOnly || !hasData.value || isActionDisabled.value,
        onClick: updateOrgDetails,
      },
    }),
  );

  return {
    organization: organization.value,
    isFetchLoading: organizationQuery.isFetching.value,
    isSaveLoading: updateMutation.isPending.value,
    isInitializing,
    formActions: formActions.value,
    fetchOrgDetails,
    updateOrgDetails,
  };
}
