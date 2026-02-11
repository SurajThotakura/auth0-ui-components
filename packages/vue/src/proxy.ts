// Providers (Proxy/RWA mode - does NOT use @auth0/auth0-vue)
export { Auth0ProxyComponentProvider } from './providers';
export type { Auth0ProxyComponentProviderProps } from './providers';

// Blocks
export * from './blocks';

// Components
export * from './components/ui';
export * from './components/my-organization/organization-management/organization-details';
export { default as WithOrganizationService } from './components/WithOrganizationService.vue';

// Composables
export * from './composables';
export { useOrganizationDetailsEdit } from './composables/my-organization/organization-management/use-organization-details-edit';

// Types
export * from './types/injection-keys';
export * from './types/my-organization/organization-management';

// Utils
export { cn } from './lib/utils';
