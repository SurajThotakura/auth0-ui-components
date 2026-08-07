/**
 * Browser utilities for the Connected Accounts authorization flow.
 * @module connect-account-browser-utils
 * @internal
 */

const PENDING_FLOW_STORAGE_KEY = 'auth0-universal:connect-account:v1';

export interface PendingConnectAccountFlow {
  authSession: string;
  codeVerifier: string;
  connection: string;
  redirectUri: string;
  state: string;
  expiresAt: number;
}

export interface ConnectedAccountAuthorizationError {
  code: string;
  description: string | null;
}

/**
 * Encodes bytes as an unpadded base64url string.
 * @param bytes - Bytes to encode.
 * @returns URL-safe base64 representation.
 */
function base64UrlEncode(bytes: Uint8Array): string {
  let value = '';
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });

  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Returns the browser cryptography API or throws outside a secure context.
 * @returns Browser crypto implementation.
 */
function getCrypto(): Crypto {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Connected Accounts requires a secure browser context.');
  }

  return window.crypto;
}

/**
 * Creates a cryptographically secure, URL-safe random value.
 * @param length - Number of random bytes to generate.
 * @returns URL-safe random string.
 */
export function createRandomValue(length = 32): string {
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/**
 * Derives a PKCE S256 challenge from a verifier.
 * @param codeVerifier - Original high-entropy verifier.
 * @returns PKCE S256 challenge.
 */
export async function createPkceChallenge(codeVerifier: string): Promise<string> {
  const hash = await getCrypto().subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Adds the SDK-issued authorization ticket to the connect URI.
 * @param connectUri - URI returned by the My Account SDK.
 * @param ticket - Temporary authorization ticket.
 * @returns Complete external authorization URL.
 */
export function createConnectUrl(connectUri: string, ticket: string): string {
  const url = new URL(connectUri);
  url.searchParams.set('ticket', ticket);
  return url.toString();
}

/**
 * Opens a centered popup that hosts the external authorization flow.
 * @returns Popup window or null if the browser blocks it.
 */
export function openConnectPopup(): Window | null {
  if (typeof window === 'undefined') return null;

  const width = 560;
  const height = 720;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

  return window.open(
    '',
    'auth0-connected-account',
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

/**
 * Persists short-lived state required to complete a redirect flow.
 * @param flow - Pending PKCE and authorization-session state.
 * @returns Nothing.
 */
export function savePendingFlow(flow: PendingConnectAccountFlow): void {
  window.sessionStorage.setItem(PENDING_FLOW_STORAGE_KEY, JSON.stringify(flow));
}

/**
 * Retrieves a valid pending flow and clears malformed or expired entries.
 * @returns Pending flow or null when none is valid.
 */
export function getPendingFlow(): PendingConnectAccountFlow | null {
  const serializedFlow = window.sessionStorage.getItem(PENDING_FLOW_STORAGE_KEY);
  if (!serializedFlow) return null;

  try {
    const flow = JSON.parse(serializedFlow) as PendingConnectAccountFlow;
    if (
      !flow.authSession ||
      !flow.codeVerifier ||
      !flow.redirectUri ||
      flow.expiresAt <= Date.now()
    ) {
      clearPendingFlow();
      return null;
    }

    return flow;
  } catch {
    clearPendingFlow();
    return null;
  }
}

/**
 * Removes the pending flow after completion, cancellation, or failure.
 * @returns Nothing.
 */
export function clearPendingFlow(): void {
  window.sessionStorage.removeItem(PENDING_FLOW_STORAGE_KEY);
}

/**
 * Extracts the one-time connect code from callback search or hash parameters.
 * @param url - Callback URL to inspect.
 * @returns Connect code or null.
 */
export function getConnectCode(url: URL): string | null {
  return (
    url.searchParams.get('connect_code') ??
    new URLSearchParams(url.hash.slice(1)).get('connect_code')
  );
}

/**
 * Extracts the anti-forgery state value from callback search or hash parameters.
 * @param url - Callback URL to inspect.
 * @returns State value or null.
 */
export function getCallbackState(url: URL): string | null {
  return url.searchParams.get('state') ?? new URLSearchParams(url.hash.slice(1)).get('state');
}

/**
 * Extracts an OAuth error from callback search or hash parameters.
 * @param url - Callback URL to inspect.
 * @returns Authorization error or null when no error was returned.
 */
export function getAuthorizationError(url: URL): ConnectedAccountAuthorizationError | null {
  const hashParameters = new URLSearchParams(url.hash.slice(1));
  const code = url.searchParams.get('error') ?? hashParameters.get('error');
  if (!code) return null;

  return {
    code,
    description:
      url.searchParams.get('error_description') ?? hashParameters.get('error_description'),
  };
}

/**
 * Checks whether a URL resolves to a configured callback URI.
 * @param url - URL currently displayed in the browser.
 * @param redirectUri - Registered callback URI for the pending flow.
 * @returns Whether the URL matches the callback origin, path, and configured query parameters.
 */
export function isCallbackUrl(url: URL, redirectUri: string): boolean {
  const configuredUrl = new URL(redirectUri);
  if (url.origin !== configuredUrl.origin || url.pathname !== configuredUrl.pathname) return false;

  return [...configuredUrl.searchParams].every(
    ([key, value]) => url.searchParams.get(key) === value,
  );
}

/**
 * Removes sensitive callback parameters from the current address bar.
 * @returns Nothing.
 */
export function removeCallbackParameters(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('connect_code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  const hashParameters = new URLSearchParams(url.hash.slice(1));
  hashParameters.delete('connect_code');
  hashParameters.delete('state');
  hashParameters.delete('error');
  hashParameters.delete('error_description');
  url.hash = hashParameters.toString();
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
