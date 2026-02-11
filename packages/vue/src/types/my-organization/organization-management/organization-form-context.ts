import type { useForm } from 'vee-validate';
import type { InjectionKey } from 'vue';

// Form context injection key for OrganizationDetails
export interface OrganizationDetailsFormContext {
  defineField: ReturnType<typeof useForm>['defineField'];
  errors: ReturnType<typeof useForm>['errors'];
}

export const ORGANIZATION_FORM_KEY: InjectionKey<OrganizationDetailsFormContext> =
  Symbol('OrganizationForm');
