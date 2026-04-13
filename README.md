![Auth0 Universal Components](https://cdn.auth0.com/website/sdks/banners/universal-components-banner.png)

Drop-in React components for Auth0 organization management, SSO configuration, and MFA enrollment.

[![npm version](https://img.shields.io/npm/v/@auth0/universal-components-react.svg?style=flat-square)](https://www.npmjs.com/package/@auth0/universal-components-react)
[![license](https://img.shields.io/npm/l/@auth0/universal-components-react.svg?style=flat-square)](https://github.com/auth0/auth0-ui-components/blob/main/LICENSE)
[![downloads](https://img.shields.io/npm/dm/@auth0/universal-components-react.svg?style=flat-square)](https://www.npmjs.com/package/@auth0/universal-components-react)

> [!IMPORTANT]
> **Early Access**: This feature is currently in Early Access. To learn more, see [Product Release Stages](https://auth0.com/docs/troubleshoot/product-lifecycle/product-release-stages).

<p align="center">
  <img src="docs/images/AddProviderComponent.png" alt="SSO Provider Configuration" width="700">
</p>

## Quick Start

```bash
npm install @auth0/universal-components-react @auth0/auth0-react react-hook-form
```

### 1. Wrap Your App with Providers

```tsx
import { Auth0Provider } from '@auth0/auth0-react';
import { Auth0ComponentProvider } from '@auth0/universal-components-react/spa';
import '@auth0/universal-components-react/styles';

function App() {
  return (
    <Auth0Provider
      domain="your-tenant.auth0.com"
      clientId="your-client-id"
      authorizationParams={{ redirect_uri: window.location.origin }}
      interactiveErrorHandler="popup"
    >
      <Auth0ComponentProvider themeSettings={{ theme: 'default', mode: 'light' }}>
        {/* Your app */}
      </Auth0ComponentProvider>
    </Auth0Provider>
  );
}
```

### 2. Use a Component

```tsx
import { SsoProviderCreate } from '@auth0/universal-components-react/spa';

function SettingsPage() {
  return <SsoProviderCreate />;
}
```

[Read the full documentation →](https://auth0.com/docs/get-started/universal-components/universal-components-overview)

## Features

- **SSO Configuration** - SAML and OIDC identity provider setup with guided wizards
- **Organization Management** - Edit profiles, branding, and metadata
- **Domain Verification** - Custom domain management and DNS validation
- **MFA Enrollment** - TOTP, SMS, email, and recovery code management

## Theming

Built on Tailwind CSS with full customization via CSS variables, theme presets (`default`, `minimal`, `rounded`), and dark mode support. [View styling guide →](https://auth0.com/docs/get-started/universal-components/universal-components-style)

## Packages

| Package                                                | Description                                           |
| ------------------------------------------------------ | ----------------------------------------------------- |
| [@auth0/universal-components-react](./packages/react/) | React components with `/spa` and `/rwa` entry points  |
| [@auth0/universal-components-core](./packages/core/)   | Framework-agnostic core utilities, services, and i18n |

## Feedback

- [Raise an issue](https://github.com/auth0/auth0-ui-components/issues) - Report bugs or request features
- [Contributing Guide](./CONTRIBUTING.md) - Local development setup
- [Vulnerability Reporting](https://auth0.com/responsible-disclosure-policy) - Security issues

## License

Copyright 2026 Okta, Inc. Licensed under [Apache License 2.0](LICENSE).

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://cdn.auth0.com/website/sdks/logos/auth0_light_mode.png" width="150">
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.auth0.com/website/sdks/logos/auth0_dark_mode.png" width="150">
    <img alt="Auth0 Logo" src="https://cdn.auth0.com/website/sdks/logos/auth0_light_mode.png" width="150">
  </picture>
</p>
<p align="center">Auth0 is an easy to implement, adaptable authentication and authorization platform. To learn more checkout <a href="https://auth0.com/why-auth0">Why Auth0?</a></p>
