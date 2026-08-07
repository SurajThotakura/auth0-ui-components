/**
 * Custom message type definitions for ConnectAccountButton.
 * @module connect-account-button-types
 * @internal
 */

export interface ConnectAccountButtonMessages {
  connect?: string;
  connecting?: string;
  connection_name?: string;
  status?: {
    connecting?: string;
    connected?: string;
  };
  error?: {
    generic?: string;
    popup_blocked?: string;
    cancelled?: string;
    expired?: string;
  };
}
