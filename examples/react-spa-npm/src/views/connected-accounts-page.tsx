import { ConnectAccountButton } from '@auth0/universal-components-react';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/button';

const GOOGLE_CALENDAR_SCOPES = [
  'openid',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
];

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.7 2.9-4.2 2.9-7.29Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.62 0 4.82-.87 6.43-2.23L15.28 17c-.89.6-2.02.96-3.28.96-2.52 0-4.65-1.7-5.41-4H3.34v2.6A9.72 9.72 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.59 13.96A5.84 5.84 0 0 1 6.29 12c0-.68.12-1.33.3-1.96v-2.6H3.34a9.77 9.77 0 0 0 0 9.12l3.25-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.04c1.43 0 2.7.49 3.7 1.44l2.77-2.77C16.81 3.17 14.62 2.25 12 2.25a9.72 9.72 0 0 0-8.66 5.19l3.25 2.6c.76-2.3 2.89-4 5.41-4Z"
      />
    </svg>
  );
}

const ConnectedAccountsPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'success' | 'cancelled' | null>(null);

  const redirectUri = `${window.location.origin}/connected-accounts`;
  const handleSuccess = () => setStatus('success');

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pt-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {t('connected-accounts.eyebrow')}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">{t('connected-accounts.title')}</h1>
        <p className="max-w-2xl text-muted-foreground">{t('connected-accounts.description')}</p>
      </div>

      {status && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-card-foreground"
        >
          {status === 'success' ? (
            <CheckCircle2 className="size-5 text-green-600" aria-hidden="true" />
          ) : (
            <XCircle className="size-5 text-muted-foreground" aria-hidden="true" />
          )}
          {t(`connected-accounts.status.${status}`)}
        </div>
      )}

      <ConnectAccountButton
        connection="google-oauth2"
        redirectUri={redirectUri}
        title={t('connected-accounts.google.title')}
        description={t('connected-accounts.google.description')}
        icon={<GoogleLogo />}
        scopes={GOOGLE_CALENDAR_SCOPES}
        connectLabel={t('connected-accounts.google.connect')}
        connectingLabel={t('connected-accounts.google.connecting')}
        onSuccess={handleSuccess}
        onCancel={() => setStatus('cancelled')}
      />

      <div className="rounded-2xl border border-border bg-card p-5 mt-8">
        <h2 className="text-lg font-semibold text-card-foreground">
          {t('connected-accounts.redirect.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('connected-accounts.redirect.description')}
        </p>
        <div className="mt-4">
          <ConnectAccountButton
            connection="google-oauth2"
            redirectUri={redirectUri}
            redirectMode="redirect"
            title={t('connected-accounts.google.title')}
            description={t('connected-accounts.redirect.provider-description')}
            icon={<GoogleLogo />}
            scopes={GOOGLE_CALENDAR_SCOPES}
            connectLabel={t('connected-accounts.redirect.connect')}
            connectingLabel={t('connected-accounts.google.connecting')}
            onSuccess={handleSuccess}
            onCancel={() => setStatus('cancelled')}
          />
        </div>
      </div>

      <Button as variant="link" className="h-auto p-0 mt-32 text-sm">
        <a
          href="https://auth0.com/docs/secure/call-apis-on-users-behalf/token-vault/connected-accounts-for-token-vault"
          target="_blank"
          rel="noreferrer"
        >
          {t('connected-accounts.learn-more')}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    </div>
  );
};

export default ConnectedAccountsPage;
