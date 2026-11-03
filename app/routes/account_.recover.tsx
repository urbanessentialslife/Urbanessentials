import {data, Form, Link, useActionData, useNavigation} from 'react-router';
import type {Route} from './+types/account_.recover';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Reset Password | Urban Essentials'}];
};

const CUSTOMER_RECOVER_MUTATION = `#graphql
  mutation CustomerRecoverForAccount($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
        message
      }
    }
  }
` as const;

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim();

  if (!email) {
    return data({error: 'Please enter your email address.', sent: false}, {status: 400});
  }

  try {
    await context.storefront.mutate(CUSTOMER_RECOVER_MUTATION, {variables: {email}});
  } catch (error) {
    console.error('Customer password recovery failed:', error);
    // Deliberately still shows the generic "check your inbox" success state
    // below — never reveal whether an email address has an account.
  }

  return {error: null, sent: true};
}

const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold';
const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#c9c2b8] bg-white px-4 py-2.5 text-sm text-[#241a16] placeholder:text-[#a69686] focus:outline-none focus:ring-2 focus:ring-[#241a16]/20 focus:border-[#241a16]';
const primaryButtonClass =
  'w-full px-6 py-3 rounded-full bg-[#241a16] hover:bg-[#3a2c24] disabled:opacity-60 disabled:cursor-not-allowed text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200';

export default function Recover() {
  const actionData = useActionData<typeof action>();
  const {state} = useNavigation();
  const isSubmitting = state !== 'idle';

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-32 pb-24 px-6 md:px-12 font-sans text-[#241a16] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">Account Recovery</span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">Reset Password</h1>
        </div>

        <div className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8 space-y-4">
          {actionData?.sent ? (
            <>
              <p className="text-sm text-[#241a16]">
                If an account exists for that email, we&apos;ve sent a link to reset the password.
              </p>
              <Link to="/account/login" className="block text-center text-xs text-[#241a16] font-medium hover:text-[#b89b6a] transition-colors">
                ← Back to sign in
              </Link>
            </>
          ) : (
            <Form method="POST" className="space-y-4">
              <p className="text-sm text-[#6d6560]">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
              </div>
              {actionData?.error && <p className="text-xs text-red-600">{actionData.error}</p>}
              <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </button>
              <Link to="/account/login" className="block text-center text-xs text-[#6d6560] hover:text-[#241a16] transition-colors">
                ← Back to sign in
              </Link>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
