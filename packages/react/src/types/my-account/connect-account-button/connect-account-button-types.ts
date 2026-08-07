/**
 * Connect Account Button type definitions.
 * @module connect-account-button-types
 */

import type {
  ConnectedAccount,
  ConnectAccountAuthorizationParams,
  ConnectAccountButtonMessages,
  SharedComponentProps,
} from '@auth0/universal-components-core';
import type * as React from 'react';

export type ConnectAccountRedirectMode = 'popup' | 'redirect';

export interface ConnectAccountButtonClasses {
  'ConnectAccountButton-root'?: string;
  'ConnectAccountButton-icon'?: string;
  'ConnectAccountButton-content'?: string;
  'ConnectAccountButton-action'?: string;
  'ConnectAccountButton-error'?: string;
}

export interface ConnectAccountButtonProps
  extends SharedComponentProps<ConnectAccountButtonMessages, ConnectAccountButtonClasses> {
  /** The configured Auth0 connection to authorize. */
  connection: string;
  /** Registered application callback URI for the Connected Accounts flow. */
  redirectUri: string;
  /** Provider name displayed in the responsive connection row. */
  title?: string;
  /** Optional provider capability summary displayed below the title. */
  description?: string;
  /** Optional provider icon displayed at the start of the connection row. */
  icon?: React.ReactNode;
  /** Scopes to request from the external provider. */
  scopes?: string[];
  /** Fine-grained parameters forwarded to the external provider. */
  authorizationParams?: ConnectAccountAuthorizationParams;
  /** Opens a popup by default; redirect navigates the current tab through the full-page flow. */
  redirectMode?: ConnectAccountRedirectMode;
  /** Overrides the default Connect action label. */
  connectLabel?: string;
  /** Overrides the default Connecting action label. */
  connectingLabel?: string;
  /** Disables starting a new connection flow. */
  disabled?: boolean;
  /** Called when the SDK successfully creates the connected account. */
  onSuccess?: (account: ConnectedAccount) => void;
  /** Called when the flow fails. */
  onError?: (error: Error) => void;
  /** Called when a popup closes or the redirect callback returns OAuth access_denied. */
  onCancel?: () => void;
}

export interface ConnectAccountButtonViewProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  connectLabel: string;
  connectingLabel: string;
  disabled: boolean;
  isConnecting: boolean;
  error: Error | null;
  styling: ConnectAccountButtonProps['styling'];
  customMessages: ConnectAccountButtonProps['customMessages'];
  onConnect: () => Promise<void>;
}

export interface UseConnectAccountOptions
  extends Pick<
    ConnectAccountButtonProps,
    | 'connection'
    | 'redirectUri'
    | 'scopes'
    | 'authorizationParams'
    | 'redirectMode'
    | 'onSuccess'
    | 'onError'
    | 'onCancel'
  > {}

export interface UseConnectAccountReturn {
  isConnecting: boolean;
  error: Error | null;
  handleConnect: () => Promise<void>;
}
