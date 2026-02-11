import type {
  BlockComponentSharedProps,
  OrganizationDetailsSchemas,
  ComponentAction,
  BackButton,
  OrganizationPrivate,
  OrganizationDetailsEditMessages,
} from '@auth0/universal-components-core';
import type { Component } from 'vue';

import type {
  OrganizationDetailsClasses,
  OrganizationDetailsFormActions,
} from './organization-details-types';

export type OrganizationEditClasses = OrganizationDetailsClasses;

export type OrganizationDetailsEditSchemas = {
  details?: OrganizationDetailsSchemas;
};

export interface OrganizationEditSaveAction extends ComponentAction<OrganizationPrivate> {}

export interface OrganizationEditBackButton extends Omit<BackButton, 'onClick'> {
  icon?: Component;
  onClick: (e: MouseEvent) => void;
}

export interface OrganizationDetailsEditProps
  extends BlockComponentSharedProps<
    OrganizationDetailsEditMessages,
    OrganizationEditClasses,
    OrganizationDetailsEditSchemas
  > {
  saveAction?: ComponentAction<OrganizationPrivate>;
  cancelAction?: Omit<ComponentAction<OrganizationPrivate>, 'onBefore'>;
  hideHeader?: boolean;
  backButton?: OrganizationEditBackButton;
}

export interface UseOrganizationDetailsEditOptions {
  saveAction?: OrganizationDetailsEditProps['saveAction'];
  cancelAction?: OrganizationDetailsEditProps['cancelAction'];
  readOnly?: OrganizationDetailsEditProps['readOnly'];
  customMessages?: OrganizationDetailsEditProps['customMessages'];
}

export interface UseOrganizationDetailsEditResult {
  organization: OrganizationPrivate;
  isFetchLoading: boolean;
  isSaveLoading: boolean;
  isInitializing: boolean;
  formActions: OrganizationDetailsFormActions;
  fetchOrgDetails: () => Promise<void>;
  updateOrgDetails: (data: OrganizationPrivate) => Promise<boolean>;
}
