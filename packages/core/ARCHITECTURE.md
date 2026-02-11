# Architecture — @auth0/universal-components-core

> Framework-agnostic foundation for Auth0 UI components. This package contains business logic, API clients, i18n, schemas, and types shared across React, Vue, Angular, and Svelte implementations.

---

## Core Principles

1. **Zero UI dependencies** — No React, Vue, or other framework code
2. **Pure TypeScript** — Business logic only
3. **Shared by all frameworks** — Never duplicate in framework packages
4. **Stateless utilities** — Framework packages manage state

---

## Directory Structure

```
packages/core/src/
├── index.ts                    # Main entry point (all exports)
│
├── api/                        # API error handling
│   ├── api-error.ts           # ApiError class for API responses
│   ├── api-types.ts           # Response type definitions
│   └── business-error.ts      # Business logic error utilities
│
├── auth/                       # Authentication management
│   ├── auth-types.ts          # Core auth interfaces
│   ├── auth-utils.ts          # Auth helper functions
│   ├── core-client.ts         # createCoreClient factory
│   └── token-manager.ts       # Token lifecycle management
│
├── i18n/                       # Internationalization
│   ├── i18n-service.ts        # createI18nService, I18nUtils
│   ├── i18n-types.ts          # Translation interfaces
│   └── translations/          # JSON translation files
│       ├── en-US.json
│       └── ja.json
│
├── schemas/                    # Zod validation schemas
│   ├── common/                # Shared schemas (email, URL, etc.)
│   ├── my-account/mfa/        # MFA-specific schemas
│   └── my-organization/       # Organization schemas
│       ├── domain-management/
│       ├── idp-management/
│       └── organization-management/
│
├── services/                   # Business logic services
│   ├── my-account/            # User account services
│   │   └── mfa/              # MFA enrollment, verification
│   └── my-organization/       # Organization services
│       ├── domain-management/
│       ├── idp-management/
│       └── organization-management/
│
├── theme/                      # Theming utilities
│   ├── theme-types.ts         # StylingVariables, MergedStyles
│   └── theme-utils.ts         # getCoreStyles, getComponentStyles, applyStyleOverrides
│
├── types/                      # Shared type definitions
│   └── index.ts               # ArbitraryObject, etc.
│
└── assets/
    └── icons/                 # SVG icon strings (exported as modules)
```

---

## Key Exports

### CoreClient Interface

The `CoreClientInterface` is the central dependency for all framework packages:

```typescript
interface CoreClientInterface {
  // Auth details
  auth: AuthDetails;

  // Services
  i18nService: I18nServiceInterface;
  myAccountApiClient: MyAccountClient | undefined;
  myOrganizationApiClient: MyOrganizationClient | undefined;

  // Methods
  getToken: (
    scope: string,
    audiencePath: string,
    ignoreCache?: boolean,
  ) => Promise<string | undefined>;
  isProxyMode: () => boolean;
  ensureScopes: (requiredScopes: string, audiencePath: string) => Promise<void>;
  getDomain: () => string | undefined;
  getMyAccountApiClient: () => MyAccountClient;
  getMyOrganizationApiClient: () => MyOrganizationClient;
}
```

### Factory Function

```typescript
import { createCoreClient } from '@auth0/universal-components-core';

const coreClient = await createCoreClient(
  authDetails, // { domain?, authProxyUrl?, contextInterface? }
  i18nOptions, // { currentLanguage, fallbackLanguage }
);
```

---

## Authentication Types

### AuthDetails

```typescript
interface AuthDetails {
  domain?: string; // Auth0 domain (SPA mode)
  authProxyUrl?: string; // Proxy URL (RWA mode)
  contextInterface?: BasicAuth0ContextInterface; // Framework auth context
}
```

### BasicAuth0ContextInterface

Framework packages must map their auth SDK to this interface:

```typescript
interface BasicAuth0ContextInterface<TUser = User> {
  user?: TUser;
  isAuthenticated: boolean;
  getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>;
  getAccessTokenWithPopup: (options?: unknown) => Promise<string | undefined>;
  loginWithRedirect: (options?: unknown) => Promise<void>;
  getConfiguration: () => Readonly<ClientConfiguration>;
}
```

---

## I18n System

### Translation Factory

```typescript
// Get translator for a namespace
const translator = i18nService.translator('organization_management.organization_details_edit');

// Basic translation
const message = translator('title');  // "Organization Details"

// With variables
const message = translator('welcome', { name: 'John' });  // "Welcome, John"

// With components (safe HTML rendering)
const elements = translator.trans('help', {
  components: {
    link: (children) => <a href="/help">{children}</a>
  }
});  // Returns array of strings and React/Vue elements
```

### Message Namespacing

Translations are namespaced by feature:

```json
{
  "common": { "save": "Save", "cancel": "Cancel" },
  "organization_management": {
    "organization_details_edit": {
      "title": "Organization Details",
      "fields": { "name": "Name", "display_name": "Display Name" }
    }
  },
  "mfa": {
    "enrollment": { "title": "Set Up MFA" }
  }
}
```

---

## Theme System

### StylingVariables

Components accept styling overrides via CSS variables:

```typescript
interface StylingVariables {
  common?: Record<string, string>; // Applied in both modes
  light?: Record<string, string>; // Light mode only
  dark?: Record<string, string>; // Dark mode only
}
```

### Theme Utilities

```typescript
import { getComponentStyles, applyStyleOverrides } from '@auth0/universal-components-core';

// Merge component-specific overrides with theme
const styles = getComponentStyles(props.styling, isDarkMode);
// Returns: { variables: {...}, classes: {...} }

// Apply theme to document (sets data-theme, .dark class, CSS vars)
applyStyleOverrides(styling, 'dark', 'default');
```

### Theme Variants

Three themes are available: `default`, `minimal`, `rounded`

```html
<!-- Controlled via data-theme attribute -->
<html data-theme="default">
  <!-- Rich shadows, standard radii -->
  <html data-theme="minimal">
    <!-- Flat design, no shadows -->
    <html data-theme="rounded">
      <!-- Pill-shaped elements -->
      <html data-theme="default" class="dark">
        <!-- Dark mode via .dark class -->
      </html>
    </html>
  </html>
</html>
```

---

## Schema Management

Zod schemas are defined in core and used by framework packages for form validation:

```typescript
import { organizationDetailsSchema } from '@auth0/universal-components-core';
import { toTypedSchema } from '@vee-validate/zod'; // Vue
import { zodResolver } from '@hookform/resolvers/zod'; // React

// Vue (vee-validate)
const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(organizationDetailsSchema),
});

// React (react-hook-form)
const form = useForm({
  resolver: zodResolver(organizationDetailsSchema),
});
```

### Available Schemas

| Schema                      | Location                                           | Purpose                          |
| --------------------------- | -------------------------------------------------- | -------------------------------- |
| `organizationDetailsSchema` | `schemas/my-organization/organization-management/` | Org name, display_name, branding |
| `domainSchema`              | `schemas/my-organization/domain-management/`       | Domain verification              |
| `ssoProviderSchema`         | `schemas/my-organization/idp-management/`          | SSO configuration                |
| `mfaEnrollmentSchema`       | `schemas/my-account/mfa/`                          | MFA factor setup                 |

---

## API Services

### Service Architecture

```
CoreClient
├── myAccountApiClient (MyAccountClient from @auth0/myaccount-js)
│   └── mfa
│       ├── enrollments.get()
│       ├── enrollments.create()
│       └── enrollments.delete()
│
└── myOrganizationApiClient (MyOrganizationClient from @auth0/myorganization-js)
    ├── organizationDetails.get()
    ├── organizationDetails.update()
    ├── domains.*
    └── ssoProviders.*
```

### Scope Management

API calls require specific OAuth scopes. Scope constants are exported from core:

```typescript
import {
  MY_ORGANIZATION_DETAILS_EDIT_SCOPES, // 'read:organization update:organization'
  MY_ORGANIZATION_DOMAIN_SCOPES,
  MY_ACCOUNT_MFA_SCOPES,
} from '@auth0/universal-components-core';
```

### Error Handling

```typescript
import { extractErrorMessage, isBusinessError } from '@auth0/universal-components-core';

try {
  await apiCall();
} catch (error) {
  if (isBusinessError(error)) {
    // Handle expected business error (validation, permissions, etc.)
    const message = extractErrorMessage(error);
  } else {
    // Handle unexpected error
    throw error;
  }
}
```

---

## What Framework Packages Must NOT Duplicate

| Concern         | Core Provides                                       | Framework Consumes Via                         |
| --------------- | --------------------------------------------------- | ---------------------------------------------- |
| API calls       | `myAccountApiClient`, `myOrganizationApiClient`     | `coreClient.getMyOrganizationApiClient()`      |
| i18n            | `createI18nService`, `I18nUtils`                    | `coreClient.i18nService.translator(namespace)` |
| Validation      | Zod schemas                                         | Direct import                                  |
| Theme merging   | `getComponentStyles`, `applyStyleOverrides`         | Direct import                                  |
| Auth types      | `AuthDetails`, `BasicAuth0ContextInterface`         | Type imports                                   |
| Scope constants | `*_SCOPES` constants                                | Direct import                                  |
| Error utilities | `extractErrorMessage`, `isBusinessError`            | Direct import                                  |
| Mappers         | `organizationFactory`, `mapOrganizationToApiFormat` | Direct import                                  |

---

## Integration Pattern

Framework packages follow this pattern:

1. **Provider component** initializes `createCoreClient()` and provides it via context/injection
2. **Composables/hooks** consume CoreClient for API calls and i18n
3. **Components** use composables for data, core schemas for validation
4. **Styles** are 100% shared (CSS files copied between packages)

```
┌─────────────────────────────────────────────────────────────┐
│                    Framework Package                         │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │    Provider     │────│   Composable    │                 │
│  │ (creates client)│    │ (uses client)   │                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                      │                           │
│  ┌────────▼──────────────────────▼────────┐                 │
│  │              Component                  │                 │
│  │  (UI, forms, events)                   │                 │
│  └─────────────────┬───────────────────────┘                │
└────────────────────│────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                @auth0/universal-components-core              │
│  CoreClient │ I18n │ Schemas │ Theme │ API │ Types          │
└─────────────────────────────────────────────────────────────┘
```
