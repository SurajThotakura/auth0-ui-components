# Auth0 Universal Components - Next.js Example

A Next.js application demonstrating Auth0 Universal Components with proxy-based authentication (RWA mode). This approach keeps tokens server-side and uses `@auth0/nextjs-auth0` for secure authentication.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
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
cd ../next-rwa
pnpm install
pnpm dev
```

### 6. Access the application

Open [http://localhost:5173](http://localhost:5173) in your browser. Log in with the org admin credentials created during bootstrap.

## Using Components

Components are imported from `@auth0/universal-components-react/rwa` for Next.js applications. The `/rwa` entry point uses proxy-based authentication.

### Provider Setup

The Auth0ComponentProvider is configured in `src/providers/client-provider.tsx` with proxy mode:

```tsx
'use client';

import { Auth0ComponentProvider } from '@auth0/universal-components-react/rwa';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <Auth0ComponentProvider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      mode="proxy"
      proxyConfig={{ baseUrl: '/' }}
      themeSettings={{ theme: 'default', mode: 'light' }}
    >
      {children}
    </Auth0ComponentProvider>
  );
}
```

### Using a Component

To enable a component, edit the corresponding page file. For example, to enable the Domain Table, edit `src/app/domain-management/page.tsx`:

```tsx
'use client';

import { DomainTable } from '@auth0/universal-components-react/rwa';

export default function DomainManagementPage() {
  return (
    <div className="p-6 pt-8 space-y-6">
      <DomainTable />
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

- Verify your `.env.local` file exists and contains all required variables:
  - `AUTH0_SECRET`
  - `AUTH0_ISSUER_BASE_URL`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET`
  - `NEXT_PUBLIC_AUTH0_DOMAIN`
- Check that Auth0 application settings include `http://localhost:5173/api/auth/callback` in Allowed Callback URLs

### Port already in use

Next.js will automatically use the next available port if 5173 is in use. Check the terminal output for the actual port.

### pnpm command not found

Install pnpm globally: `npm install -g pnpm`

### Auth0 CLI not authenticated

Run `auth0 tenants list` to verify your session is active. Re-authenticate with `auth0 login` if needed.

### Proxy authentication errors

Ensure your Auth0 application is configured as a "Regular Web Application" (not SPA) for the RWA mode to work correctly.

## License

Copyright 2026 Okta, Inc.

Distributed under the [Apache License 2.0](https://github.com/auth0/auth0-ui-components/blob/main/LICENSE).
