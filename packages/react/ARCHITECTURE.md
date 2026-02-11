# Architecture — @auth0/universal-components-react

> React 18+ implementation of Auth0 UI components using shadcn/ui patterns. This document serves as the **source of truth** for converting to other frameworks (Vue, Angular, Svelte).

---

## Core Stack

| Concern       | Library                                              | Purpose                        |
| ------------- | ---------------------------------------------------- | ------------------------------ |
| UI Primitives | `@radix-ui/react-*`                                  | Headless accessible components |
| Styling       | `tailwind-merge`, `clsx`, `class-variance-authority` | Utility-first CSS              |
| Forms         | `react-hook-form` + `@hookform/resolvers/zod`        | Form state + validation        |
| Data Fetching | `@tanstack/react-query`                              | Server state management        |
| Toast         | `sonner`                                             | Notifications                  |
| Icons         | `lucide-react`                                       | Icon library                   |

---

## Directory Structure

```
packages/react/src/
├── index.ts                    # Main SPA entry point
├── proxy.ts                    # Proxy/RWA entry point (no @auth0/auth0-react)
│
├── lib/
│   ├── utils.ts               # cn() utility (clsx + tailwind-merge)
│   └── theme-utils.ts         # Theme helpers
│
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   │   ├── button.tsx         # Polymorphic with CVA
│   │   ├── card.tsx
│   │   ├── card-header.tsx
│   │   ├── card-content.tsx
│   │   ├── spinner.tsx
│   │   ├── text-field.tsx     # Input with CVA variants
│   │   ├── form-actions.tsx   # Save/Cancel buttons
│   │   ├── separator.tsx
│   │   ├── section.tsx
│   │   ├── header.tsx
│   │   ├── dialog.tsx         # Dialog primitives
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   └── index.ts           # Barrel export
│   │
│   ├── my-account/
│   │   └── mfa/               # MFA feature components
│   │       ├── factors-list.tsx
│   │       ├── otp-verification-form.tsx
│   │       └── qr-code-enrollment-form.tsx
│   │
│   └── my-organization/
│       ├── domain-management/
│       ├── idp-management/
│       └── organization-management/
│           └── organization-details/
│               ├── organization-details.tsx
│               ├── settings-details.tsx
│               └── branding-details.tsx
│
├── blocks/                    # Page-level entry points
│   ├── my-account/mfa/
│   │   └── user-mfa-management.tsx
│   └── my-organization/
│       ├── domain-management/
│       ├── idp-management/
│       └── organization-management/
│           └── organization-details-edit.tsx
│
├── hooks/                     # Custom React hooks
│   ├── use-core-client.ts
│   ├── use-core-client-initialization.ts
│   ├── use-translator.ts
│   ├── use-theme.ts
│   ├── use-scope-manager.ts
│   ├── use-toast.ts
│   └── my-organization/
│       └── organization-management/
│           └── use-organization-details-edit.ts
│
├── hoc/                       # Higher-Order Components
│   └── with-services.tsx      # Scope gating HOC
│
├── providers/
│   ├── spa-provider.tsx       # Auth0ComponentProvider (SPA mode)
│   ├── proxy-provider.tsx     # Auth0ProxyComponentProvider (RWA mode)
│   ├── theme-provider.tsx     # Theme context
│   ├── query-provider.tsx     # TanStack Query setup
│   └── scope-manager-provider.tsx
│
├── types/
│   ├── auth-types.ts
│   └── my-organization/
│       └── organization-management/
│           └── organization-details-edit-types.ts
│
├── styles/                    # Shared CSS (framework-agnostic)
│   ├── globals.css
│   ├── font-sizes.css
│   ├── light-palette.css
│   ├── dark-palette.css
│   └── themes/
│       ├── default.css
│       ├── minimal.css
│       └── rounded.css
│
└── assets/
    └── icons/                 # Icon components (TSX)
```

---

## Component Patterns

### 1. UI Primitive with CVA (Polymorphic)

```tsx
// components/ui/button.tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 text-sm font-medium transition-all ...',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 ...',
        outline: 'border border-input bg-background hover:bg-muted ...',
        ghost: 'hover:bg-muted text-primary bg-transparent',
        destructive: 'bg-destructive text-destructive-foreground ...',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 rounded-2xl px-4 py-2.5',
        xs: 'h-7 rounded-md px-2 py-1.5 text-xs',
        sm: 'h-8 gap-1.5 rounded-xl px-3 py-2 text-xs',
        lg: 'h-12 rounded-3xl px-6 py-3 text-base',
        icon: 'size-7 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  as?: boolean; // Renders as Slot for composition
}

function Button({ className, variant, size, as, ...props }: ButtonProps) {
  const Comp = as ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
```

**Conversion notes:**

- `as` prop uses `@radix-ui/react-slot` for polymorphism
- Vue equivalent: `reka-ui` `Primitive` with `as`/`as-child` props
- CVA variant strings must be copied **exactly** (including `theme-default:` prefixes)

### 2. Compound Component (Card)

```tsx
// components/ui/card.tsx
function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

// components/ui/card-header.tsx
function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-header" className={cn('flex flex-col p-6', className)} {...props} />;
}
```

**Conversion notes:**

- `data-slot` attribute is required on all component roots
- Same attribute values across frameworks (CSS selectors may target these)

### 3. Form Input with TextField

```tsx
// components/ui/text-field.tsx
const textFieldVariants = cva('flex w-full items-center rounded-xl border transition-colors ...', {
  variants: {
    variant: {
      default: 'border-input bg-background hover:border-muted-foreground/30 ...',
      destructive: 'border-destructive bg-destructive/5 ...',
    },
    size: {
      default: 'h-10 text-sm',
      sm: 'h-8 text-xs',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}
```

---

## Provider Architecture

### Provider Tree (SPA Mode)

```
Auth0Provider (@auth0/auth0-react)    ← External, wraps the app
└─ Auth0ComponentProvider             ← Our provider
   ├─ ThemeProvider                   ← Theme context (isDarkMode, variables)
   ├─ CoreClientContext.Provider      ← CoreClient from core package
   ├─ QueryProvider                   ← TanStack Query setup
   ├─ ScopeManagerProvider            ← OAuth scope management
   └─ Toaster (sonner)                ← Toast notifications
```

### SPA Provider Implementation

```tsx
// providers/spa-provider.tsx
export const Auth0ComponentProvider = ({
  i18n,
  authDetails,
  themeSettings,
  toastSettings,
  cacheConfig,
  children,
}: Auth0ComponentProviderProps & { children: React.ReactNode }) => {
  const auth0ReactContext = useAuth0(); // From @auth0/auth0-react

  // Map Auth0React context to BasicAuth0ContextInterface
  const auth0ContextInterface = React.useMemo(() => {
    if (auth0ReactContext && 'isAuthenticated' in auth0ReactContext) {
      return auth0ReactContext as BasicAuth0ContextInterface;
    }
    if (authDetails?.contextInterface) {
      return authDetails.contextInterface;
    }
    throw new Error('Auth0ContextInterface is not available');
  }, [auth0ReactContext, authDetails?.contextInterface]);

  // Initialize core client
  const coreClient = useCoreClientInitialization({
    authDetails: { ...authDetails, contextInterface: auth0ContextInterface },
    i18nOptions: i18n,
  });

  return (
    <ThemeProvider themeSettings={themeSettings}>
      <Toaster position={toastSettings?.position || 'top-right'} />
      <React.Suspense fallback={<Spinner />}>
        <CoreClientContext.Provider value={{ coreClient }}>
          <QueryProvider cacheConfig={cacheConfig}>
            <ScopeManagerProvider>{children}</ScopeManagerProvider>
          </QueryProvider>
        </CoreClientContext.Provider>
      </React.Suspense>
    </ThemeProvider>
  );
};
```

**Conversion notes:**

- Vue: Use `provide()` for each context value
- Vue: No `Suspense` equivalent — use `v-if` with loading state

---

## Hook Conventions

### Core Client Hook

```tsx
// hooks/use-core-client.ts
const CoreClientContext = React.createContext<{
  coreClient: CoreClientInterface | null;
}>({ coreClient: null });

export const useCoreClient = () => {
  const context = React.useContext(CoreClientContext);
  if (!context) {
    throw new Error('useCoreClient must be used within Auth0ComponentProvider');
  }
  return context;
};
```

**Conversion notes:**

- Vue: `inject(CORE_CLIENT_KEY)` with `InjectionKey<CoreClientInterface>`

### Translator Hook

```tsx
// hooks/use-translator.ts
export function useTranslator(namespace: string, customMessages?: Record<string, unknown>) {
  const { coreClient } = useCoreClient();
  const t = React.useMemo(
    () => coreClient?.i18nService.translator(namespace, customMessages),
    [coreClient?.i18nService, namespace, customMessages],
  );
  return { t };
}
```

**Conversion notes:**

- Vue: Use `computed()` for the translator

### Data Fetching Hook (TanStack Query)

```tsx
// hooks/my-organization/organization-management/use-organization-details-edit.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryKeys = {
  details: (orgId: string) => ['organization', orgId, 'details'] as const,
};

export function useOrganizationDetailsEdit(options: UseOrganizationDetailsEditOptions) {
  const { coreClient } = useCoreClient();
  const queryClient = useQueryClient();

  // Read query
  const { data: organization, isLoading: isFetchLoading } = useQuery({
    queryKey: queryKeys.details(options.orgId),
    queryFn: () => coreClient?.getMyOrganizationApiClient().organizationDetails.get(),
    enabled: !!coreClient,
  });

  // Write mutation
  const { mutateAsync: saveOrganization, isPending: isSaveLoading } = useMutation({
    mutationFn: (payload: UpdatePayload) =>
      coreClient?.getMyOrganizationApiClient().organizationDetails.update(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.details(options.orgId), result);
    },
  });

  return {
    organization,
    isFetchLoading,
    isSaveLoading,
    saveOrganization,
  };
}
```

**Conversion notes:**

- Vue: TanStack Vue Query returns `Ref` values, use `.value` in script

---

## HOC Pattern (Service Gating)

```tsx
// hoc/with-services.tsx
export function withMyOrganizationService<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  scopes: string,
): React.ComponentType<P> {
  const WithServicesComponent = (props: P) => {
    const { loader } = useTheme();
    const { registerScopes, ensured } = useScopeManager();

    // Register required scopes on mount
    React.useEffect(() => {
      registerScopes('my-org', scopes);
    }, [scopes, registerScopes]);

    // Show loader until scopes are satisfied
    if (!scopesSatisfied(scopes, ensured['my-org'])) {
      return <>{loader || <Spinner />}</>;
    }

    return <WrappedComponent {...props} />;
  };

  return WithServicesComponent;
}
```

**Conversion notes:**

- Vue: Use a wrapper component (`<WithOrganizationService :scopes="...">`) instead of HOC
- Vue: Use `<slot v-if="isReady" />` pattern

---

## Block Component Pattern

```tsx
// blocks/my-organization/organization-management/organization-details-edit.tsx
import { withMyOrganizationService } from '../../../hoc/with-services';

function OrganizationDetailsEditComponent({
  customMessages = {},
  styling = { variables: { common: {}, light: {}, dark: {} }, classes: {} },
  readOnly = false,
  saveAction,
  cancelAction,
}: OrganizationDetailsEditProps) {
  const { t } = useTranslator('organization_management.organization_details_edit', customMessages);
  const { isDarkMode } = useTheme();

  const { organization, isFetchLoading, formActions } = useOrganizationDetailsEdit({
    saveAction,
    cancelAction,
    readOnly,
    customMessages,
  });

  const currentStyles = React.useMemo(
    () => getComponentStyles(styling, isDarkMode),
    [styling, isDarkMode],
  );

  if (isFetchLoading) {
    return (
      <div style={currentStyles.variables} className="flex items-center justify-center min-h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div style={currentStyles.variables} className="w-full">
      <OrganizationDetails
        organization={organization}
        styling={styling}
        readOnly={readOnly}
        formActions={formActions}
      />
    </div>
  );
}

// Export wrapped with service HOC
export const OrganizationDetailsEdit = withMyOrganizationService(
  OrganizationDetailsEditComponent,
  MY_ORGANIZATION_DETAILS_EDIT_SCOPES,
);
```

---

## Form Handling (react-hook-form)

```tsx
// components/my-organization/organization-details/organization-details.tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function OrganizationDetails({ organization, schema, formActions }: Props) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: organization,
  });

  const onSubmit = form.handleSubmit((values) => {
    formActions.onSave(values);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <TextField {...form.register('name')} label="Name" />
        <TextField {...form.register('display_name')} label="Display Name" />
        <FormActions isLoading={formActions.isSaveLoading} onCancel={formActions.onCancel} />
      </form>
    </FormProvider>
  );
}
```

**Conversion notes:**

- Vue: Use `vee-validate` + `@vee-validate/zod` with `toTypedSchema()`
- Vue: `useForm()` returns `handleSubmit`, `resetForm`, `values`

---

## CSS & Theme System

### Theme CSS Architecture

```css
/* globals.css */
@import 'tailwindcss';
@import './font-sizes.css';
@import './themes/default.css';
@import './themes/minimal.css';
@import './themes/rounded.css';

@layer base {
  /* Global resets */
}
@theme inline {
  /* Design token registration */
}
```

### Custom Variants for Themes

```css
/* themes/default.css */
@custom-variant theme-default {
  &:where([data-theme='default'] *) {
    @slot;
  }
}
```

**Usage in components:**

```tsx
className={cn(
  buttonVariants({ variant, size }),
  'theme-default:before:bg-gradient-to-t',
  'theme-default:active:scale-[0.99]',
)}
```

### Theme Activation

```tsx
// Apply via HTML attributes
<html data-theme="default">           <!-- default | minimal | rounded -->
<html data-theme="default" class="dark">  <!-- dark mode via .dark class -->
```

---

## Key Patterns Summary

| React Pattern                        | Vue Equivalent                               | Notes                            |
| ------------------------------------ | -------------------------------------------- | -------------------------------- |
| `useState(x)`                        | `ref(x)`                                     | State                            |
| `useMemo(() => x, [deps])`           | `computed(() => x)`                          | Derived state (auto-tracks deps) |
| `useCallback(fn, [deps])`            | Just define function                         | No wrapper needed                |
| `useEffect(() => {}, [])`            | `onMounted(() => {})`                        | Mount effect                     |
| `useEffect(() => {}, [x])`           | `watch(x, () => {})`                         | Reactive effect                  |
| `React.createContext` + `useContext` | `provide()` + `inject()` with `InjectionKey` | DI                               |
| `<Slot>` from Radix                  | `Primitive` from reka-ui                     | Polymorphism                     |
| `forwardRef`                         | `defineExpose()`                             | Ref forwarding                   |
| HOC (`withServices()`)               | Wrapper component                            | Service gating                   |
| `react-hook-form`                    | `vee-validate`                               | Form handling                    |
| `children` prop                      | `<slot />`                                   | Content projection               |
| `className`                          | `class`                                      | Class attribute                  |
| `onChange` (input)                   | `@input` / `@change`                         | Events                           |

---

## Exports

### SPA Entry (`index.ts`)

```tsx
export { Auth0ComponentProvider } from './providers/spa-provider';
export * from './blocks';
export * from './components/ui';
export * from './hooks';
```

### Proxy Entry (`proxy.ts`)

```tsx
export { Auth0ProxyComponentProvider } from './providers/proxy-provider';
export * from './blocks';
export * from './components/ui';
export * from './hooks';
```

**Note:** Proxy entry does NOT import `@auth0/auth0-react` for tree-shaking.
