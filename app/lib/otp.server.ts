/**
 * Email one-time-code login, layered on top of the site's existing classic
 * (password) customer accounts rather than Shopify's separate OAuth-hosted
 * Customer Account API — see the top comment in customerAuth.server.ts for
 * why those two systems don't share a session, which is exactly the
 * breakage this avoids. The trick: after verifying the code, force-set the
 * customer's password to a random throwaway value via the Admin API, then
 * immediately sign in with it through the normal classic
 * `customerAccessTokenCreate` flow — the result is a real classic session,
 * so every existing account page (orders, profile, addresses) keeps working
 * completely unchanged, regardless of which way someone logged in.
 *
 * Delivery of the code itself has no Admin/Storefront API equivalent of
 * "send this email" — it's written to a customer metafield and a merchant-
 * configured Shopify Flow does the actual sending. See docs/email-otp-setup.md.
 */

import type {HydrogenSession, Storefront} from '@shopify/hydrogen';
import {
  findOrCreateCustomerByEmail,
  setCustomerLoginOtp,
  setCustomerPassword,
} from '~/lib/admin.server';
import {loginWithPassword} from '~/lib/customerAuth.server';

const OTP_SESSION_KEY = 'otpPending';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

interface OtpPendingState {
  email: string;
  customerId: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

function generateOtpCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  // 6 digits, zero-padded — % 1e6 keeps it in range without biasing toward
  // any particular digit noticeably at this sample size.
  return String(bytes[0] % 1_000_000).padStart(6, '0');
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Starts an email-code login: finds/creates the customer, generates a code,
 * writes it to their metafield (for the Flow to email), and stashes its
 * hash in the session. Always succeeds from the caller's perspective on a
 * valid email — never reveals whether the email matched an existing
 * customer, same reasoning as a password-reset flow.
 */
export async function requestEmailOtp(env: Env, session: HydrogenSession, email: string): Promise<void> {
  const customerId = await findOrCreateCustomerByEmail(env, email);
  const code = generateOtpCode();
  await setCustomerLoginOtp(env, customerId, code);

  const pending: OtpPendingState = {
    email,
    customerId,
    codeHash: await hashCode(code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  };
  session.set(OTP_SESSION_KEY, pending);
}

/**
 * Verifies a submitted code against the pending request in the session. On
 * success, signs the customer in (via the throwaway-password trick above)
 * and clears the pending state either way, so a code can't be replayed and
 * a wrong guess always counts against the attempt limit.
 */
export async function verifyEmailOtp(
  env: Env,
  storefront: Storefront,
  session: HydrogenSession,
  submittedCode: string,
): Promise<{error: string | null}> {
  const pending = session.get(OTP_SESSION_KEY) as OtpPendingState | undefined;

  if (!pending) {
    return {error: 'Your code has expired. Please request a new one.'};
  }
  if (Date.now() > pending.expiresAt) {
    session.unset(OTP_SESSION_KEY);
    return {error: 'Your code has expired. Please request a new one.'};
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    session.unset(OTP_SESSION_KEY);
    return {error: 'Too many attempts. Please request a new code.'};
  }

  const submittedHash = await hashCode(submittedCode.trim());
  if (submittedHash !== pending.codeHash) {
    session.set(OTP_SESSION_KEY, {...pending, attempts: pending.attempts + 1});
    return {error: 'Incorrect code. Please try again.'};
  }

  session.unset(OTP_SESSION_KEY);

  const throwawayPassword = randomPassword();
  await setCustomerPassword(env, pending.customerId, throwawayPassword);
  return loginWithPassword(storefront, session, pending.email, throwawayPassword);
}
