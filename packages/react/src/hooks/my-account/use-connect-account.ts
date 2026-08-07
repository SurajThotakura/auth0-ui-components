/**
 * Connected Accounts authorization flow hook.
 * @module use-connect-account
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  clearPendingFlow,
  createConnectUrl,
  createPkceChallenge,
  createRandomValue,
  getAuthorizationError,
  getCallbackState,
  getConnectCode,
  getPendingFlow,
  isCallbackUrl,
  openConnectPopup,
  removeCallbackParameters,
  savePendingFlow,
} from '@/hooks/my-account/shared/connect-account-browser-utils';
import { useCoreClient } from '@/hooks/shared/use-core-client';
import type {
  UseConnectAccountOptions,
  UseConnectAccountReturn,
} from '@/types/my-account/connect-account-button/connect-account-button-types';

const POPUP_POLL_INTERVAL_MS = 250;

/**
 * Creates an error suitable for component callbacks and accessible rendering.
 * @param message - Human-readable error message.
 * @returns Error instance.
 */
function createError(message: string): Error {
  return new Error(message);
}

/**
 * Starts and completes a Connected Accounts OAuth flow through the My Account SDK.
 * @param options - Connection and lifecycle callback options.
 * @returns Connection state and a handler to start the flow.
 */
export function useConnectAccount({
  connection,
  redirectUri,
  scopes,
  authorizationParams,
  redirectMode = 'popup',
  onSuccess,
  onError,
  onCancel,
}: UseConnectAccountOptions): UseConnectAccountReturn {
  const { coreClient } = useCoreClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const completingRef = useRef(false);
  const popupPollRef = useRef<number | null>(null);

  const clearPopupPoll = useCallback(() => {
    if (popupPollRef.current !== null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearPopupPoll();
    };
  }, [clearPopupPoll]);

  const reportError = useCallback(
    (nextError: Error) => {
      if (isMountedRef.current) {
        setError(nextError);
        setIsConnecting(false);
      }
      onError?.(nextError);
    },
    [onError],
  );

  const cancelFlow = useCallback(() => {
    clearPopupPoll();
    clearPendingFlow();
    if (isMountedRef.current) setIsConnecting(false);
    onCancel?.();
  }, [clearPopupPoll, onCancel]);

  const completeFlow = useCallback(
    async (connectCode: string, pendingFlow = getPendingFlow()) => {
      if (!pendingFlow || completingRef.current) return;

      clearPopupPoll();
      completingRef.current = true;
      try {
        const client = coreClient?.getMyAccountApiClient();
        if (!client) throw createError('The My Account client is unavailable.');

        const account = await client.connectedAccounts.complete({
          auth_session: pendingFlow.authSession,
          connect_code: connectCode,
          redirect_uri: pendingFlow.redirectUri,
          code_verifier: pendingFlow.codeVerifier,
        });
        clearPendingFlow();
        onSuccess?.(account);
      } catch (caughtError) {
        clearPendingFlow();
        reportError(
          caughtError instanceof Error ? caughtError : createError('Unable to connect account.'),
        );
      } finally {
        completingRef.current = false;
        if (isMountedRef.current) setIsConnecting(false);
      }
    },
    [clearPopupPoll, coreClient, onSuccess, reportError],
  );

  const handleRedirectReturn = useCallback(() => {
    if (redirectMode !== 'redirect' || typeof window === 'undefined') return;

    const currentUrl = new URL(window.location.href);
    const connectCode = getConnectCode(currentUrl);
    const authorizationError = getAuthorizationError(currentUrl);
    const callbackState = getCallbackState(currentUrl);
    const pendingFlow = getPendingFlow();

    if (!pendingFlow || pendingFlow.redirectUri !== redirectUri) return;

    if (!connectCode && !authorizationError) {
      if (isCallbackUrl(currentUrl, redirectUri)) cancelFlow();
      return;
    }

    if (callbackState !== pendingFlow.state) return;

    removeCallbackParameters();
    if (authorizationError) {
      clearPendingFlow();
      if (authorizationError.code === 'access_denied') {
        cancelFlow();
      } else {
        reportError(
          createError(
            authorizationError.description ||
              `The connection request failed: ${authorizationError.code}.`,
          ),
        );
      }
      return;
    }

    if (!connectCode) return;

    setIsConnecting(true);
    void completeFlow(connectCode, pendingFlow);
  }, [cancelFlow, completeFlow, redirectMode, redirectUri, reportError]);

  useEffect(() => {
    if (redirectMode !== 'redirect' || typeof window === 'undefined') return;

    handleRedirectReturn();
    window.addEventListener('pageshow', handleRedirectReturn);
    return () => window.removeEventListener('pageshow', handleRedirectReturn);
  }, [handleRedirectReturn, redirectMode]);

  const handleConnect = useCallback(async () => {
    if (typeof window === 'undefined' || isConnecting) return;

    setError(null);
    setIsConnecting(true);

    const codeVerifier = createRandomValue();
    const state = createRandomValue();
    let popup: Window | null = null;

    try {
      if (redirectMode === 'popup') {
        popup = openConnectPopup();
        if (!popup) throw createError('The browser blocked the connection popup.');
      }

      const client = coreClient?.getMyAccountApiClient();
      if (!client) throw createError('The My Account client is unavailable.');

      const codeChallenge = await createPkceChallenge(codeVerifier);
      const start = await client.connectedAccounts.create({
        connection,
        redirect_uri: redirectUri,
        state,
        scopes,
        authorization_params: authorizationParams,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });
      const pendingFlow = {
        authSession: start.auth_session,
        codeVerifier,
        connection,
        redirectUri,
        state,
        expiresAt: Date.now() + start.expires_in * 1000,
      };

      savePendingFlow(pendingFlow);
      const connectUrl = createConnectUrl(start.connect_uri, start.connect_params.ticket);

      if (redirectMode === 'redirect') {
        window.location.assign(connectUrl);
        return;
      }

      popup!.location.assign(connectUrl);
      popupPollRef.current = window.setInterval(() => {
        if (!popup || popup.closed) {
          cancelFlow();
          return;
        }

        if (pendingFlow.expiresAt <= Date.now()) {
          clearPopupPoll();
          popup.close();
          clearPendingFlow();
          reportError(createError('The connection session expired. Please try again.'));
          return;
        }

        try {
          const callbackUrl = new URL(popup.location.href);
          const connectCode = getConnectCode(callbackUrl);
          const callbackState = getCallbackState(callbackUrl);
          if (
            !connectCode ||
            callbackState !== pendingFlow.state ||
            callbackUrl.origin !== window.location.origin
          ) {
            return;
          }

          clearPopupPoll();
          popup.close();
          void completeFlow(connectCode, pendingFlow);
        } catch {
          // The provider page is cross-origin until it returns to the registered callback URI.
        }
      }, POPUP_POLL_INTERVAL_MS);
    } catch (caughtError) {
      popup?.close();
      clearPendingFlow();
      reportError(
        caughtError instanceof Error ? caughtError : createError('Unable to connect account.'),
      );
    }
  }, [
    authorizationParams,
    cancelFlow,
    clearPopupPoll,
    completeFlow,
    connection,
    coreClient,
    isConnecting,
    redirectMode,
    redirectUri,
    reportError,
    scopes,
  ]);

  return { isConnecting, error, handleConnect };
}
