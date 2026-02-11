import type {
  SharedComponentProps,
  OrganizationPrivate,
  OrganizationDetailsSchemas as CoreOrganizationDetailsSchemas,
  OrganizationDetailsFormValues,
  OrganizationDetailsMessages,
} from '@auth0/universal-components-core';

export interface OrganizationDetailsClasses {
  OrganizationDetails_Card?: string;
  OrganizationDetails_FormActions?: string;
  OrganizationDetails_SettingsDetails?: string;
  OrganizationDetails_BrandingDetails?: string;
}

export type OrganizationDetailsSchemas = CoreOrganizationDetailsSchemas;

export interface OrganizationDetailsFormActions {
  isLoading?: boolean;
  showPrevious?: boolean;
  showUnsavedChanges?: boolean;
  align?: 'left' | 'right';
  previousAction?: {
    disabled?: boolean;
    onClick?: () => void;
  };
  nextAction?: {
    disabled?: boolean;
    onClick?: (data: OrganizationPrivate) => boolean | Promise<boolean>;
  };
}

export interface OrganizationDetailsProps
  extends SharedComponentProps<
    OrganizationDetailsMessages,
    OrganizationDetailsClasses,
    OrganizationDetailsSchemas
  > {
  organization: OrganizationPrivate;
  isLoading?: boolean;
  formActions: OrganizationDetailsFormActions;
}

export interface BrandingDetailsProps
  extends SharedComponentProps<OrganizationDetailsMessages, OrganizationDetailsClasses> {
  readOnly?: boolean;
  className?: string;
}

export interface SettingsDetailsProps
  extends SharedComponentProps<OrganizationDetailsMessages, OrganizationDetailsClasses> {
  readOnly?: boolean;
  className?: string;
}

export type { OrganizationDetailsFormValues };
