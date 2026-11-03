/**
 * Classic (password-based) Shopify customer accounts, via the Storefront
 * API's `customerCreate` / `customerAccessTokenCreate` family — deliberately
 * separate from `context.customerAccount`, the new OAuth-hosted Customer
 * Account API Hydrogen wires up by default (still configured, but unused by
 * the storefront's own account pages). The resulting access token is stored
 * in this app's own session cookie (see app/lib/session.ts); every account
 * route reads its logged-in customer through the helpers here, not through
 * `context.customerAccount`.
 */
import {redirect} from 'react-router';
import type {HydrogenSession, Storefront} from '@shopify/hydrogen';

const SESSION_TOKEN_KEY = 'customerAccessToken';
const SESSION_TOKEN_EXPIRES_KEY = 'customerAccessTokenExpiresAt';

/** Shared fields every account page needs about the signed-in customer. */
export const ACCOUNT_CUSTOMER_FRAGMENT = `#graphql
  fragment AccountCustomer on Customer {
    id
    firstName
    lastName
    email
    phone
    acceptsMarketing
    defaultAddress {
      id
    }
    addresses(first: 20) {
      nodes {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        provinceCode
        zip
        country
        countryCodeV2
        phone
        formatted(withName: true)
        formattedArea
      }
    }
  }
` as const;

export function setCustomerSession(session: HydrogenSession, accessToken: string, expiresAt: string) {
  session.set(SESSION_TOKEN_KEY, accessToken);
  session.set(SESSION_TOKEN_EXPIRES_KEY, expiresAt);
}

export function clearCustomerSession(session: HydrogenSession) {
  session.unset(SESSION_TOKEN_KEY);
  session.unset(SESSION_TOKEN_EXPIRES_KEY);
}

/** The session's access token, or null if missing/expired (clearing it if expired). */
export function getCustomerAccessToken(session: HydrogenSession): string | null {
  const token = session.get(SESSION_TOKEN_KEY);
  const expiresAt = session.get(SESSION_TOKEN_EXPIRES_KEY);
  if (!token) return null;
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    clearCustomerSession(session);
    return null;
  }
  return token as string;
}

/** Redirects to sign-in (preserving where to return to) unless a live session exists. */
export function requireCustomerAccessToken(session: HydrogenSession, request: Request): string {
  const token = getCustomerAccessToken(session);
  if (!token) {
    const returnTo = new URL(request.url).pathname;
    throw redirect(`/account/login?redirectTo=${encodeURIComponent(returnTo)}`);
  }
  return token;
}

const CUSTOMER_USER_ERROR_FRAGMENT = `#graphql
  fragment CustomerUserErrorFields on CustomerUserError {
    code
    field
    message
  }
` as const;

const CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION = `#graphql
  mutation CustomerAccessTokenCreateForLogin($email: String!, $password: String!) {
    customerAccessTokenCreate(input: {email: $email, password: $password}) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        ...CustomerUserErrorFields
      }
    }
  }
  ${CUSTOMER_USER_ERROR_FRAGMENT}
` as const;

/**
 * Verifies email+password against Shopify and, on success, writes the
 * resulting access token into the session. Returns a customer-facing error
 * message on failure instead of throwing — every caller has its own form to
 * redisplay that on.
 */
export async function loginWithPassword(
  storefront: Storefront,
  session: HydrogenSession,
  email: string,
  password: string,
): Promise<{error: string} | {error: null}> {
  const result = await storefront.mutate(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION, {
    variables: {email, password},
  });

  const userError = result.customerAccessTokenCreate?.customerUserErrors?.[0];
  const token = result.customerAccessTokenCreate?.customerAccessToken;
  const errors = result.errors;

  if (errors?.length || userError || !token) {
    return {error: userError?.message || 'Incorrect email or password.'};
  }

  setCustomerSession(session, token.accessToken, token.expiresAt);
  return {error: null};
}
