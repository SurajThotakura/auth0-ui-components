import type {
  SharedComponentProps,
  OrganizationPrivate,
  OrganizationDetailsSchemas as CoreOrganizationDetailsSchemas,
  OrganizationDetailsMessages,
} from '@auth0/universal-components-core';

/* ============ Components ============ */

/**
 * Styling that can be used to override default styles.
 */
export interface OrganizationDetailsClasses {
  OrganizationDetails_Card?: string;
  OrganizationDetails_FormActions?: string;
  OrganizationDetails_SettingsDetails?: string;
  OrganizationDetails_BrandingDetails?: string;
}

/**
 * Schemas that can be used to override default schemas.
 */
export type OrganizationDetailsSchemas = CoreOrganizationDetailsSchemas;

export interface OrganizationDetailsFormActions {
  nextAction?: {
    disabled: boolean;
    onClick?: (data: OrganizationPrivate) => boolean | Promise<boolean>;
  };
  previousAction?: {
    disabled?: boolean;
    onClick?: (event: Event) => void;
  };
  showPrevious?: boolean;
  showNext?: boolean;
  showUnsavedChanges?: boolean;
  align?: 'left' | 'right';
  isLoading?: boolean;
}

export interface OrganizationDetailsProps extends SharedComponentProps<
  OrganizationDetailsMessages,
  OrganizationDetailsClasses,
  OrganizationDetailsSchemas
> {
  organization: OrganizationPrivate;
  isLoading?: boolean;
  formActions: OrganizationDetailsFormActions;
}

/* ============ Subcomponents ============ */

export interface BrandingDetailsProps extends SharedComponentProps<
  OrganizationDetailsMessages,
  OrganizationDetailsClasses
> {
  class?: string;
}

export interface SettingsDetailsProps extends SharedComponentProps<
  OrganizationDetailsMessages,
  OrganizationDetailsClasses
> {
  class?: string;
}
