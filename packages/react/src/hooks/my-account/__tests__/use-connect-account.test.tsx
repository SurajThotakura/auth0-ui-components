import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useConnectAccount } from '@/hooks/my-account/use-connect-account';
import * as useCoreClientModule from '@/hooks/shared/use-core-client';
import { createMockCoreClient } from '@/tests/utils/__mocks__/core/core-client.mocks';
import { createTestQueryClient } from '@/tests/utils/test-provider';

const popup = {
  closed: false,
  close: vi.fn(),
  location: { assign: vi.fn(), href: 'http://localhost:3000/callback?connect_code=code' },
};

const createWrapper = () => {
  const client = createTestQueryClient();
  return ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useConnectAccount', () => {
  const mockCoreClient = createMockCoreClient();

  beforeEach(() => {
    vi.spyOn(useCoreClientModule, 'useCoreClient').mockReturnValue({ coreClient: mockCoreClient });
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(1),
      subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).fill(2).buffer) },
    });
    mockCoreClient.getMyAccountApiClient().connectedAccounts.create = vi.fn().mockResolvedValue({
      auth_session: 'session',
      connect_uri: 'https://tenant.auth0.com/connect',
      connect_params: { ticket: 'ticket' },
      expires_in: 300,
    });
    mockCoreClient.getMyAccountApiClient().connectedAccounts.complete = vi.fn().mockResolvedValue({
      id: 'cac_123',
      connection: 'google-oauth2',
      access_type: 'offline',
      created_at: '2026-08-07T00:00:00.000Z',
    });
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    popup.closed = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts a PKCE protected popup flow and completes on callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'https://app.example.com/callback',
          onSuccess,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.handleConnect();
    });

    expect(mockCoreClient.getMyAccountApiClient().connectedAccounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        connection: 'google-oauth2',
        redirect_uri: 'https://app.example.com/callback',
        code_challenge_method: 'S256',
      }),
    );
    expect(popup.location.assign).toHaveBeenCalledWith(
      'https://tenant.auth0.com/connect?ticket=ticket',
    );

    const pendingFlow = JSON.parse(
      window.sessionStorage.getItem('auth0-universal:connect-account:v1') || '{}',
    ) as { state: string };
    popup.location.href = `http://localhost:3000/callback?connect_code=code&state=${pendingFlow.state}`;

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
    });

    expect(mockCoreClient.getMyAccountApiClient().connectedAccounts.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        auth_session: 'session',
        connect_code: 'code',
        redirect_uri: 'https://app.example.com/callback',
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'cac_123' }));
  });

  it('resets the connecting state when the popup is closed', async () => {
    const onCancel = vi.fn();
    const { result } = renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'https://app.example.com/callback',
          onCancel,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.handleConnect();
    });
    expect(result.current.isConnecting).toBe(true);

    popup.closed = true;
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(result.current.isConnecting).toBe(false);
    expect(window.sessionStorage.getItem('auth0-universal:connect-account:v1')).toBeNull();
  });

  it('reports a popup-blocked failure', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const onError = vi.fn();
    const { result } = renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'https://app.example.com/callback',
          onError,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.handleConnect();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0]?.[0]?.message).toMatch(/blocked/i);
    expect(result.current.isConnecting).toBe(false);
  });

  it('cancels a redirect flow when browser back returns to the callback URI', async () => {
    const onCancel = vi.fn();
    window.sessionStorage.setItem(
      'auth0-universal:connect-account:v1',
      JSON.stringify({
        authSession: 'session',
        codeVerifier: 'verifier',
        connection: 'google-oauth2',
        redirectUri: 'http://localhost:3000/',
        state: 'expected-state',
        expiresAt: Date.now() + 60_000,
      }),
    );

    const { result } = renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'http://localhost:3000/',
          redirectMode: 'redirect',
          onCancel,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      window.dispatchEvent(new Event('pageshow'));
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(result.current.isConnecting).toBe(false);
    expect(
      mockCoreClient.getMyAccountApiClient().connectedAccounts.complete,
    ).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('auth0-universal:connect-account:v1')).toBeNull();
  });

  it('keeps a pending redirect flow on an unrelated route', async () => {
    const onCancel = vi.fn();
    window.sessionStorage.setItem(
      'auth0-universal:connect-account:v1',
      JSON.stringify({
        authSession: 'session',
        codeVerifier: 'verifier',
        connection: 'google-oauth2',
        redirectUri: 'http://localhost:3000/callback',
        state: 'expected-state',
        expiresAt: Date.now() + 60_000,
      }),
    );

    renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'http://localhost:3000/callback',
          redirectMode: 'redirect',
          onCancel,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      window.dispatchEvent(new Event('pageshow'));
    });

    expect(onCancel).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('auth0-universal:connect-account:v1')).toContain(
      'session',
    );
  });

  it('cancels a redirect flow when the callback returns access_denied', async () => {
    const onCancel = vi.fn();
    window.sessionStorage.setItem(
      'auth0-universal:connect-account:v1',
      JSON.stringify({
        authSession: 'session',
        codeVerifier: 'verifier',
        connection: 'google-oauth2',
        redirectUri: 'http://localhost:3000/',
        state: 'expected-state',
        expiresAt: Date.now() + 60_000,
      }),
    );
    window.history.replaceState({}, '', '/?error=access_denied&state=expected-state');

    renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'http://localhost:3000/',
          redirectMode: 'redirect',
          onCancel,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {});

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(
      mockCoreClient.getMyAccountApiClient().connectedAccounts.complete,
    ).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('auth0-universal:connect-account:v1')).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('reports a redirect callback error', async () => {
    const onError = vi.fn();
    window.sessionStorage.setItem(
      'auth0-universal:connect-account:v1',
      JSON.stringify({
        authSession: 'session',
        codeVerifier: 'verifier',
        connection: 'google-oauth2',
        redirectUri: 'http://localhost:3000/',
        state: 'expected-state',
        expiresAt: Date.now() + 60_000,
      }),
    );
    window.history.replaceState(
      {},
      '',
      '/?error=server_error&error_description=Provider%20failed&state=expected-state',
    );

    renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'http://localhost:3000/',
          redirectMode: 'redirect',
          onError,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {});

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Provider failed' }));
    expect(
      mockCoreClient.getMyAccountApiClient().connectedAccounts.complete,
    ).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('auth0-universal:connect-account:v1')).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('opens the authorization URL in the current browser flow when redirect mode is selected', async () => {
    const { result } = renderHook(
      () =>
        useConnectAccount({
          connection: 'google-oauth2',
          redirectUri: 'https://app.example.com/callback',
          redirectMode: 'redirect',
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.handleConnect();
    });

    expect(window.sessionStorage.getItem('auth0-universal:connect-account:v1')).toContain(
      'session',
    );
  });
});
