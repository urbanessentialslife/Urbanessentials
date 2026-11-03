import {useState} from 'react';
import {data, Form, Link, redirect, useActionData, useNavigation, useSearchParams} from 'react-router';
import type {Route} from './+types/account_.login';
import {getCustomerAccessToken, loginWithPassword} from '~/lib/customerAuth.server';
import {requestEmailOtp, verifyEmailOtp} from '~/lib/otp.server';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Sign In | Urban Essentials'}];
};

export async function loader({context}: Route.LoaderArgs) {
  if (getCustomerAccessToken(context.session)) {
    return redirect('/');
  }
  return {};
}

type ActionResult =
  | {intent: 'password'; error: string}
  | {intent: 'otp-request'; step: 'verify'; email: string}
  | {intent: 'otp-request'; step: 'request'; error: string}
  | {intent: 'otp-verify'; step: 'verify'; error: string};

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || 'password');
  const redirectTo = String(formData.get('redirectTo') || '/');
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/';

  if (intent === 'otp-request') {
    const email = String(formData.get('email') || '').trim();
    if (!email || !email.includes('@')) {
      return data<ActionResult>(
        {intent: 'otp-request', step: 'request', error: 'Please enter a valid email address.'},
        {status: 400},
      );
    }
    try {
      await requestEmailOtp(context.env, context.session, email);
      return data<ActionResult>({intent: 'otp-request', step: 'verify', email});
    } catch (error) {
      console.error('Email OTP request failed:', error);
      return data<ActionResult>(
        {intent: 'otp-request', step: 'request', error: "We couldn't send a code right now. Please try again shortly."},
        {status: 500},
      );
    }
  }

  if (intent === 'otp-verify') {
    const code = String(formData.get('code') || '').trim();
    if (!code) {
      return data<ActionResult>({intent: 'otp-verify', step: 'verify', error: 'Please enter the code.'}, {status: 400});
    }
    const result = await verifyEmailOtp(context.env, context.storefront, context.session, code);
    if (result.error) {
      return data<ActionResult>({intent: 'otp-verify', step: 'verify', error: result.error}, {status: 400});
    }
    return redirect(safeRedirect);
  }

  // Classic password login
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return data<ActionResult>({intent: 'password', error: 'Please enter your email and password.'}, {status: 400});
  }

  try {
    const result = await loginWithPassword(context.storefront, context.session, email, password);
    if (result.error) {
      return data<ActionResult>({intent: 'password', error: result.error}, {status: 400});
    }
    return redirect(safeRedirect);
  } catch (error) {
    console.error('Customer login failed:', error);
    return data<ActionResult>({intent: 'password', error: 'Something went wrong. Please try again.'}, {status: 500});
  }
}

const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold';
const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#c9c2b8] bg-white px-4 py-2.5 text-sm text-[#241a16] placeholder:text-[#a69686] focus:outline-none focus:ring-2 focus:ring-[#241a16]/20 focus:border-[#241a16]';
const primaryButtonClass =
  'w-full px-6 py-3 rounded-full bg-[#241a16] hover:bg-[#3a2c24] disabled:opacity-60 disabled:cursor-not-allowed text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200';

export default function Login() {
  const actionData = useActionData<ActionResult>();
  const {state} = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/account';
  const isSubmitting = state !== 'idle';

  const [mode, setMode] = useState<'password' | 'otp'>(
    actionData && actionData.intent !== 'password' ? 'otp' : 'password',
  );
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>(
    actionData?.intent === 'otp-request' && actionData.step === 'verify' ? 'verify' : 'request',
  );
  const [otpEmail, setOtpEmail] = useState(
    actionData?.intent === 'otp-request' && actionData.step === 'verify' ? actionData.email : '',
  );

  // Keep local step state in sync when a fresh action response comes back
  // (e.g. a verify attempt fails and should stay on the code-entry screen).
  if (actionData?.intent === 'otp-request' && actionData.step === 'verify' && otpStep !== 'verify') {
    setOtpStep('verify');
    setOtpEmail(actionData.email);
  }

  const passwordError = actionData?.intent === 'password' ? actionData.error : null;
  const otpRequestError = actionData?.intent === 'otp-request' && actionData.step === 'request' ? actionData.error : null;
  const otpVerifyError = actionData?.intent === 'otp-verify' ? actionData.error : null;

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-32 pb-24 px-6 md:px-12 font-sans text-[#241a16] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">Welcome Back</span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">Sign In</h1>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-full border border-[#c9c2b8] mb-5">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-full transition-all duration-200 cursor-pointer ${
              mode === 'password' ? 'bg-[#241a16] text-[#f4f0e8] font-semibold' : 'text-[#6d6560] hover:text-[#241a16]'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode('otp')}
            className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-full transition-all duration-200 cursor-pointer ${
              mode === 'otp' ? 'bg-[#241a16] text-[#f4f0e8] font-semibold' : 'text-[#6d6560] hover:text-[#241a16]'
            }`}
          >
            Email Code
          </button>
        </div>

        {mode === 'password' ? (
          <Form method="POST" className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8 space-y-4">
            <input type="hidden" name="intent" value="password" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
            </div>

            {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}

            <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <Link to="/account/recover" className="text-[#6d6560] hover:text-[#241a16] transition-colors">
                Forgot password?
              </Link>
              <Link to="/account/register" className="text-[#241a16] font-medium hover:text-[#b89b6a] transition-colors">
                Create an account →
              </Link>
            </div>
          </Form>
        ) : otpStep === 'request' ? (
          <Form method="POST" className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8 space-y-4">
            <input type="hidden" name="intent" value="otp-request" />
            <p className="text-xs text-[#6d6560]">We&apos;ll email you a 6-digit code — no password needed.</p>
            <div>
              <label htmlFor="otp-email" className={labelClass}>Email</label>
              <input
                id="otp-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={otpEmail}
                className={inputClass}
              />
            </div>

            {otpRequestError && <p className="text-xs text-red-600">{otpRequestError}</p>}

            <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
              {isSubmitting ? 'Sending Code…' : 'Send Code'}
            </button>
          </Form>
        ) : (
          <Form method="POST" className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8 space-y-4">
            <input type="hidden" name="intent" value="otp-verify" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <p className="text-xs text-[#6d6560]">
              Enter the 6-digit code sent to <span className="text-[#241a16] font-medium">{otpEmail}</span>.
            </p>
            <div>
              <label htmlFor="otp-code" className={labelClass}>Code</label>
              <input
                id="otp-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                className={`${inputClass} tracking-[0.5em] text-center text-lg`}
              />
            </div>

            {otpVerifyError && <p className="text-xs text-red-600">{otpVerifyError}</p>}

            <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
              {isSubmitting ? 'Verifying…' : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setOtpStep('request')}
              className="w-full text-center text-xs text-[#6d6560] hover:text-[#241a16] transition-colors pt-1"
            >
              Use a different email
            </button>
          </Form>
        )}
      </div>
    </div>
  );
}
