import { useState } from 'react';
import { useFetcher, useLocation } from 'react-router';

type OtpActionData =
  | { intent: 'otp-request'; step: 'verify'; email: string }
  | { intent: 'otp-request'; step: 'request'; error: string }
  | { intent: 'otp-verify'; step: 'verify'; error: string };

/** Opt-in, skippable email-code sign-in offered right in the cart drawer
 * before checkout — reuses the same /account/login actions as the login
 * page itself (see account_.login.tsx + otp.server.ts). Signing in here
 * doesn't block or slow down guest checkout; it's purely for a returning
 * customer who'd rather not re-enter shipping details. */
export function CheckoutSignInPrompt() {
  const fetcher = useFetcher<OtpActionData>();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  const step = fetcher.data?.step ?? 'request';
  const requestError = fetcher.data?.intent === 'otp-request' && fetcher.data.step === 'request' ? fetcher.data.error : null;
  const verifyError = fetcher.data?.intent === 'otp-verify' ? fetcher.data.error : null;
  const sentToEmail = fetcher.data?.intent === 'otp-request' && fetcher.data.step === 'verify' ? fetcher.data.email : email;
  const isSubmitting = fetcher.state !== 'idle';
  const currentPath = `${location.pathname}${location.search}`;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-center text-xs text-[#6d6560] hover:text-[#241a16] underline underline-offset-2 transition cursor-pointer"
      >
        Have an account? Sign in with an email code
      </button>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#c9c2b8] space-y-3">
      {step === 'request' ? (
        <fetcher.Form method="post" action="/account/login" className="space-y-2.5">
          <input type="hidden" name="intent" value="otp-request" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-[#6d6560] font-medium">Sign In</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#a69686] hover:text-[#241a16] transition cursor-pointer text-xs"
            >
              Cancel
            </button>
          </div>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="w-full text-sm bg-[#f4f0e8] border border-[#c9c2b8] rounded-lg px-3 py-2.5 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition"
          />
          {requestError && <p className="text-xs text-red-600 font-medium">{requestError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send Code'}
          </button>
        </fetcher.Form>
      ) : (
        <fetcher.Form method="post" action="/account/login" className="space-y-2.5">
          <input type="hidden" name="intent" value="otp-verify" />
          <input type="hidden" name="redirectTo" value={currentPath} />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-[#6d6560] font-medium">Enter Code</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#a69686] hover:text-[#241a16] transition cursor-pointer text-xs"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-[#6d6560]">
            Sent to <span className="text-[#241a16] font-medium">{sentToEmail}</span>
          </p>
          <input
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className="w-full text-sm bg-[#f4f0e8] border border-[#c9c2b8] rounded-lg px-3 py-2.5 text-[#241a16] tracking-[0.4em] text-center focus:outline-none focus:border-[#241a16] transition"
          />
          {verifyError && <p className="text-xs text-red-600 font-medium">{verifyError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'Verifying…' : 'Verify & Sign In'}
          </button>
        </fetcher.Form>
      )}
    </div>
  );
}
