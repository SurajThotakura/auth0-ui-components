/** @module connect-account-button */

'use client';

import { getComponentStyles } from '@auth0/universal-components-core';
import * as React from 'react';

import { StyledScope } from '@/components/auth0/shared/styled-scope';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useConnectAccount } from '@/hooks/my-account/use-connect-account';
import { useTelemetry } from '@/hooks/shared/use-telemetry';
import { useTheme } from '@/hooks/shared/use-theme';
import { useTranslator } from '@/hooks/shared/use-translator';
import { cn } from '@/lib/utils';
import type {
  ConnectAccountButtonProps,
  ConnectAccountButtonViewProps,
} from '@/types/my-account/connect-account-button/connect-account-button-types';

const DEFAULT_STYLING: ConnectAccountButtonProps['styling'] = {
  variables: { common: {}, light: {}, dark: {} },
  classes: {},
};

/**
 * Responsive provider row that starts a Connected Accounts authorization flow.
 *
 * @param props - {@link ConnectAccountButtonProps}
 * @returns Connected Accounts action component.
 */
function ConnectAccountButton({
  connection,
  redirectUri,
  scopes,
  authorizationParams,
  redirectMode = 'popup',
  title,
  description,
  icon,
  connectLabel,
  connectingLabel,
  disabled = false,
  onSuccess,
  onError,
  onCancel,
  styling = DEFAULT_STYLING,
  customMessages = {},
}: ConnectAccountButtonProps) {
  useTelemetry('connect-account-button');
  const { t } = useTranslator('connect_account_button', customMessages);
  const { isConnecting, error, handleConnect } = useConnectAccount({
    connection,
    redirectUri,
    scopes,
    authorizationParams,
    redirectMode,
    onSuccess,
    onError,
    onCancel,
  });

  return (
    <ConnectAccountButtonView
      title={title || t('connection_name', { connection })}
      description={description}
      icon={icon}
      connectLabel={connectLabel || t('connect')}
      connectingLabel={connectingLabel || t('connecting')}
      disabled={disabled}
      isConnecting={isConnecting}
      error={error}
      styling={styling}
      customMessages={customMessages}
      onConnect={handleConnect}
    />
  );
}

/**
 * Presentational responsive provider row for Connected Accounts.
 * @param props - {@link ConnectAccountButtonViewProps}
 * @returns Connected Accounts view component.
 * @internal
 */
function ConnectAccountButtonView({
  title,
  description,
  icon,
  connectLabel,
  connectingLabel,
  disabled,
  isConnecting,
  error,
  styling,
  customMessages,
  onConnect,
}: ConnectAccountButtonViewProps) {
  const { isDarkMode } = useTheme();
  const { t } = useTranslator('connect_account_button', customMessages);
  const currentStyles = React.useMemo(
    () => getComponentStyles(styling, isDarkMode),
    [styling, isDarkMode],
  );

  return (
    <StyledScope style={currentStyles.variables}>
      <div
        className={cn(
          'flex min-w-0 flex-col gap-4 rounded-4xl border border-border bg-card p-5 text-card-foreground shadow-bevel-2xl sm:flex-row sm:items-center sm:justify-between',
          currentStyles.classes?.['ConnectAccountButton-root'],
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background p-2',
                currentStyles.classes?.['ConnectAccountButton-icon'],
              )}
            >
              {icon}
            </span>
          )}
          <div
            className={cn(
              'min-w-0 flex-1',
              currentStyles.classes?.['ConnectAccountButton-content'],
            )}
          >
            <p className="break-words text-body font-semibold text-card-foreground">{title}</p>
            {description && (
              <p className="mt-0.5 break-words text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="default"
          className={cn(
            'w-full shrink-0 sm:w-auto',
            currentStyles.classes?.['ConnectAccountButton-action'],
          )}
          disabled={disabled || isConnecting}
          aria-busy={isConnecting}
          onClick={() => void onConnect()}
        >
          {isConnecting && <Spinner size="sm" colorScheme="primary" aria-hidden="true" />}
          {isConnecting ? connectingLabel : connectLabel}
        </Button>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {isConnecting && <span className="sr-only">{t('status.connecting', { title })}</span>}
        {error && (
          <p
            role="alert"
            className={cn(
              'mt-2 text-sm text-destructive-foreground',
              currentStyles.classes?.['ConnectAccountButton-error'],
            )}
          >
            {error.message || t('error.generic')}
          </p>
        )}
      </div>
    </StyledScope>
  );
}

export { ConnectAccountButton, ConnectAccountButtonView };
