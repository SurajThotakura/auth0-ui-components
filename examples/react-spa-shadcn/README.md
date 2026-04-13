# Auth0 Universal Components - React SPA (shadcn) Example

A React single-page application demonstrating Auth0 Universal Components with shadcn installation. This approach gives you full source code ownership for maximum customization.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Adding Components with shadcn](#adding-components-with-shadcn)
- [Using Components](#using-components)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Node.js v20 or later**

   We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions. See [how to install nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) or [how to use nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#usage).

2. **pnpm**

   Install globally with npm:

   ```bash
   npm install -g pnpm
   ```

   Or see [pnpm.io/installation](https://pnpm.io/installation) for other installation methods.

3. **Auth0 CLI**

   Required for the bootstrap script that configures your tenant. Install from [auth0.com/docs/cli](https://auth0.com/docs/cli).

4. **A new Auth0 tenant**

   Using a new tenant for this sample ensures no conflicts with existing configuration. Sign up for a free Auth0 account at [auth0.com/signup](https://auth0.com/signup). See [Create Tenants](https://auth0.com/docs/get-started/auth0-overview/create-tenants) if you need help.

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/auth0/auth0-ui-components
cd auth0-ui-components
pnpm install
pnpm build
```

### 2. Install bootstrap script dependencies

```bash
cd examples/scripts
pnpm install
```

### 3. Authenticate with Auth0 CLI

This command opens a browser prompt to select your tenant and confirm permissions:

```bash
auth0 login --scopes "read:connection_profiles,create:connection_profiles,update:connection_profiles,read:user_attribute_profiles,create:user_attribute_profiles,update:user_attribute_profiles,read:client_grants,create:client_grants,update:client_grants,delete:client_grants,read:connections,create:connections,update:connections,create:organization_connections,create:organization_members,create:organization_member_roles,read:clients,create:clients,update:clients,read:client_keys,read:roles,create:roles,update:roles,read:resource_servers,create:resource_servers,update:resource_servers,update:tenant_settings"
```

For private-cloud tenants, authenticate with client credentials:

```bash
auth0 login --domain <tenant-domain> --client-id <client-id> --client-secret <client-secret>
```

Verify your tenant is active:

```bash
auth0 tenants list
```

### 4. Run the bootstrap script

> [!WARNING]
> This script modifies your tenant configuration. Only run against a development tenant.

```bash
pnpm run auth0:bootstrap <your-tenant-domain>
```

The script configures your tenant with the necessary APIs, applications, roles, and organization. It will prompt you to create an org admin user if needed.

### 5. Start the development server

```bash
cd ../react-spa-shadcn
pnpm install
pnpm dev
```

### 6. Access the application

Open [http://localhost:5173](http://localhost:5173) in your browser. Log in with the org admin credentials created during bootstrap.

## Adding Components with shadcn

### Initialize shadcn (if not already set up)

If your project doesn't have shadcn configured yet:

```bash
npx shadcn@latest init
```

Follow the prompts to configure your project:

- Style: Default
- Base color: Slate (or your preference)
- CSS variables: Yes
- Global CSS file: src/index.css
- Tailwind config: tailwind.config.js
- Components directory: src/components
- Utils directory: src/lib/utils

### Install Auth0 Components

Use the shadcn CLI to add components from the Auth0 registry:

```bash
npx shadcn@latest add https://ui.auth0.com/r/my-organization/organization-details-edit.json
```

This installs the component source code to your `components/auth0/` directory.

**Available components:**

```bash
# Organization Management
npx shadcn@latest add https://ui.auth0.com/r/my-organization/organization-details-edit.json

# SSO Provider Management
npx shadcn@latest add https://ui.auth0.com/r/my-organization/sso-provider-table.json
npx shadcn@latest add https://ui.auth0.com/r/my-organization/sso-provider-create.json
npx shadcn@latest add https://ui.auth0.com/r/my-organization/sso-provider-edit.json

# Domain Management
npx shadcn@latest add https://ui.auth0.com/r/my-organization/domain-table.json
```

## Using Components

### Configure the Provider

Update your main App component to include the Auth0 Component Provider:

```tsx
import { Auth0Provider } from '@auth0/auth0-react';
import { Auth0ComponentProvider } from '@/providers/spa-provider';

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{ redirect_uri: window.location.origin }}
      interactiveErrorHandler="popup"
    >
      <Auth0ComponentProvider
        i18n={{ currentLanguage: 'en' }}
        themeSettings={{ theme: 'default', mode: 'light' }}
      >
        {/* Your routes */}
      </Auth0ComponentProvider>
    </Auth0Provider>
  );
}
```

### Use a Component

Import from the local components directory:

```tsx
import { OrganizationDetailsEdit } from '@/components/auth0/my-organization/organization-details-edit';

function OrganizationSettingsPage() {
  return (
    <div>
      <h1>Organization Settings</h1>
      <OrganizationDetailsEdit />
    </div>
  );
}
```

For component-specific configuration requirements, see the [Auth0 Universal Components documentation](https://auth0.com/docs/get-started/universal-components/universal-components-overview).

## Troubleshooting

### Build errors

- Run `pnpm build` at the project root before starting the dev server
- Ensure all dependencies are installed with `pnpm install` at the root

### Auth0 configuration issues

- Verify your `.env.local` file exists and contains the correct values
- Check that Auth0 application settings include `http://localhost:5173` in Allowed Callback URLs

### Port already in use

Vite will automatically use the next available port if 5173 is in use. Check the terminal output for the actual port.

### pnpm command not found

Install pnpm globally: `npm install -g pnpm`

### Auth0 CLI not authenticated

Run `auth0 tenants list` to verify your session is active. Re-authenticate with `auth0 login` if needed.

### shadcn certificate issues

If you encounter TLS certificate errors when installing components:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add https://ui.auth0.com/r/my-organization/organization-details-edit.json
```

## License

Copyright 2026 Okta, Inc.

Distributed under the [Apache License 2.0](https://github.com/auth0/auth0-ui-components/blob/main/LICENSE).
