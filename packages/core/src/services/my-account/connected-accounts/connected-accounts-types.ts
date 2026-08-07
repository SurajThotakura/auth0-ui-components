/**
 * Connected Accounts SDK type aliases.
 * @module connected-accounts-types
 */

import type { MyAccount } from '@auth0/myaccount-js';

/** Request to start a Connected Accounts authorization flow. */
export type ConnectAccountRequest = MyAccount.CreateConnectedAccountsRequestContent;

/** Response returned after starting a Connected Accounts authorization flow. */
export type ConnectAccountStartResponse = MyAccount.CreateConnectedAccountsResponseContent;

/** Response returned after a Connected Accounts authorization flow completes. */
export type ConnectedAccount = MyAccount.CompleteConnectedAccountsResponseContent;

/** Optional authorization parameters forwarded to the external provider. */
export type ConnectAccountAuthorizationParams = MyAccount.AuthorizationParams;
