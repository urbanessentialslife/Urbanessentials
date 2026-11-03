import {data, Form, redirect, useActionData, useNavigation} from 'react-router';
import type {Route} from './+types/account_.reset.$id.$resetToken';
import {setCustomerSession} from '~/lib/customerAuth.server';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Set New Password | Urban Essentials'}];
};

const CUSTOMER_RESET_MUTATION = `#graphql
  mutation CustomerResetForAccount($id: ID!, $input: CustomerResetInput!) {
    customerReset(id: $id, input: $input) {
      customer {
        id
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        message
      }
    }
  }
` as const;

export async function action({request, context, params}: Route.ActionArgs) {
  const {id, resetToken} = params;
  if (!id || !resetToken) {
    return data({error: 'This reset link is invalid.'}, {status: 400});
  }

  const formData = await request.formData();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (!password) {
    return data({error: 'Please enter a new password.'}, {status: 400});
  }
  if (password !== confirmPassword) {
    return data({error: 'Passwords do not match.'}, {status: 400});
  }

  try {
    const result = await context.storefront.mutate(CUSTOMER_RESET_MUTATION, {
      variables: {
        id: `gid://shopify/Customer/${id}`,
        input: {password, resetToken},
      },
    });

    const userError = result.customerReset?.customerUserErrors?.[0];
    const token = result.customerReset?.customerAccessToken;
    if (result.errors?.length || userError || !token) {
      return data(
        {error: userError?.message || 'This reset link may have expired. Please request a new one.'},
        {status: 400},
      );
    }

    setCustomerSession(context.session, token.accessToken, token.expiresAt);
    return redirect('/account');
  } catch (error) {
    console.error('Customer password reset failed:', error);
    return data({error: 'Something went wrong. Please try again.'}, {status: 500});
  }
}

const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold';
const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#c9c2b8] bg-white px-4 py-2.5 text-sm text-[#241a16] placeholder:text-[#a69686] focus:outline-none focus:ring-2 focus:ring-[#241a16]/20 focus:border-[#241a16]';
const primaryButtonClass =
  'w-full px-6 py-3 rounded-full bg-[#241a16] hover:bg-[#3a2c24] disabled:opacity-60 disabled:cursor-not-allowed text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200';

export default function Reset() {
  const actionData = useActionData<typeof action>();
  const {state} = useNavigation();
  const isSubmitting = state !== 'idle';

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-32 pb-24 px-6 md:px-12 font-sans text-[#241a16] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">Account Recovery</span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">Set New Password</h1>
        </div>

        <Form method="POST" className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8 space-y-4">
          <div>
            <label htmlFor="password" className={labelClass}>New password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={5} className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm new password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={5} className={inputClass} />
          </div>
          {actionData?.error && <p className="text-xs text-red-600">{actionData.error}</p>}
          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? 'Saving…' : 'Set Password'}
          </button>
        </Form>
      </div>
    </div>
  );
}
