import CodeBlock from '../components/CodeBlock';

export default function ConnectAccountButtonDocs() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-medium text-blue-700">My Account · Token Vault</p>
        <h1 className="text-4xl font-bold text-gray-900">ConnectAccountButton</h1>
        <p className="text-xl text-gray-600">
          A responsive provider row that securely connects an external account for actions on a
          user&apos;s behalf.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Requirements</h2>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-blue-900">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Configure Token Vault and enable Connected Accounts on the Auth0 connection.</li>
            <li>
              Grant the application <code>create:me:connected_accounts</code> for the My Account
              API.
            </li>
            <li>
              Register a same-origin callback URI in the Auth0 application. The component receives
              the short-lived <code>connect_code</code> there and completes the SDK flow.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Usage</h2>
        <CodeBlock
          language="tsx"
          title="Connect Google Calendar"
          code={`import { ConnectAccountButton } from '@auth0/universal-components-react';
import GoogleLogo from '@/assets/google-logo.svg';

export function CalendarConnection() {
  return (
    <ConnectAccountButton
      connection="google-oauth2"
      redirectUri={
        typeof window === 'undefined'
          ? 'https://app.example.com/settings/integrations'
          : window.location.origin + '/settings/integrations'
      }
      title="Google Calendar"
      description="Read and write calendar events · popup mode"
      icon={<img src={GoogleLogo} alt="" />}
      scopes={[
        'openid',
        'profile',
        'https://www.googleapis.com/auth/calendar.events',
      ]}
      onSuccess={(account) => console.log('Connected:', account.id)}
      onError={(error) => console.error('Connection failed:', error)}
    />
  );
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Redirect behavior</h2>
        <p className="text-gray-700">
          The default <code>redirectMode="popup"</code> opens a centered popup, preserving the
          current application state. The row stacks its action below provider details on narrow
          screens. For environments where a popup is unsuitable, pass{' '}
          <code>redirectMode="redirect"</code>, which navigates the current tab through the
          full-page authorization flow. The component stores only short-lived PKCE/session state in
          session storage, resumes on the configured callback, then removes callback parameters from
          the URL. A returned OAuth <code>access_denied</code> result invokes <code>onCancel</code>;
          using browser Back to return to the callback route also resolves the pending flow as
          cancelled. Closing the entire tab/window still cannot be observed because no application
          document is running.
        </p>
        <CodeBlock
          language="tsx"
          title="Full-page redirect"
          code={`<ConnectAccountButton
  connection="google-oauth2"
  redirectUri={window.location.origin + '/settings/integrations'}
  redirectMode="redirect"
  title="Google Calendar"
/>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Props</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Prop</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
              <tr>
                <td className="px-4 py-3 font-medium">connection</td>
                <td className="px-4 py-3">string</td>
                <td className="px-4 py-3">Required Auth0 connection name.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">redirectUri</td>
                <td className="px-4 py-3">string</td>
                <td className="px-4 py-3">Required registered callback URI.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">redirectMode</td>
                <td className="px-4 py-3">&apos;popup&apos; | &apos;redirect&apos;</td>
                <td className="px-4 py-3">Flow behavior; defaults to popup.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">scopes</td>
                <td className="px-4 py-3">string[]</td>
                <td className="px-4 py-3">Optional external-provider permissions.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">authorizationParams</td>
                <td className="px-4 py-3">AuthorizationParams</td>
                <td className="px-4 py-3">Optional fine-grained IdP parameters.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">title / description / icon</td>
                <td className="px-4 py-3">display props</td>
                <td className="px-4 py-3">
                  Provider row content; use an empty alt icon when title supplies its name.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">onSuccess / onError / onCancel</td>
                <td className="px-4 py-3">callbacks</td>
                <td className="px-4 py-3">
                  Lifecycle handlers for result, failure, and popup or returned redirect
                  cancellation.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
