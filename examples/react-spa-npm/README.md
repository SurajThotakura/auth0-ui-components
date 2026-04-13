# Auth0 Universal Components - React SPA Example

A React single-page application demonstrating Auth0 Universal Components with npm package installation. This example uses `@auth0/auth0-react` for authentication and showcases delegated administration components.

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
cd ../react-spa-npm
pnpm install
pnpm dev
```

### 6. Access the application

Open [http://localhost:5173](http://localhost:5173) in your browser. Log in with the org admin credentials created during bootstrap.

## Using Components

Components are imported from `@auth0/universal-components-react/spa`. Make sure you import the styles in your app entry point:

```tsx
import '@auth0/universal-components-react/styles';
```

This example includes pre-configured routes in `src/App.tsx`.

To enable a component, edit the corresponding page file. For example, to enable the Domain Table on the domain management page, edit `src/views/domain-management-page.tsx`:

```tsx
import { DomainTable } from '@auth0/universal-components-react/spa';

const DomainManagementPage = () => {
  return (
    <div className="space-y-6">
      <DomainTable />
    </div>
  );
};

export default DomainManagementPage;
```

For component-specific configuration requirements, see the [Auth0 Universal Components documentation](https://auth0.com/docs/get-started/universal-components/universal-components-overview).

## Troubleshooting

### Build errors

- Run `pnpm build` at the project root before starting the dev server
- Ensure all dependencies are installed with `pnpm install` at the root

### Auth0 configuration issues

- Verify your `.env` file exists and contains the correct values
- Check that Auth0 application settings include `http://localhost:5173` in Allowed Callback URLs

### Port already in use

Vite will automatically use the next available port if 5173 is in use. Check the terminal output for the actual port.

### pnpm command not found

Install pnpm globally: `npm install -g pnpm`

### Auth0 CLI not authenticated

Run `auth0 tenants list` to verify your session is active. Re-authenticate with `auth0 login` if needed.

## License

Copyright 2026 Okta, Inc.

Distributed under the [Apache License 2.0](https://github.com/auth0/auth0-ui-components/blob/main/LICENSE).
