import {data, Form, useActionData, useNavigation, useOutletContext} from 'react-router';
import type {Route} from './+types/account.profile';
import {requireCustomerAccessToken, setCustomerSession} from '~/lib/customerAuth.server';

type AccountCustomer = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  acceptsMarketing: boolean;
};

export type ActionResponse = {
  error: string | null;
  success?: boolean;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Profile | Urban Essentials'}];
};

export async function loader({context, request}: Route.LoaderArgs) {
  requireCustomerAccessToken(context.session, request);
  return {};
}

const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation CustomerUpdateForProfile($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
    customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
` as const;

export async function action({request, context}: Route.ActionArgs) {
  const token = requireCustomerAccessToken(context.session, request);

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();
  const firstName = String(form.get('firstName') || '').trim();
  const lastName = String(form.get('lastName') || '').trim();
  const email = String(form.get('email') || '').trim();
  const phone = String(form.get('phone') || '').trim();
  const acceptsMarketing = form.get('acceptsMarketing') === 'on';
  const newPassword = String(form.get('newPassword') || '');
  const confirmPassword = String(form.get('confirmPassword') || '');

  if (newPassword && newPassword !== confirmPassword) {
    return data({error: 'New passwords do not match.'}, {status: 400});
  }
  if (newPassword && newPassword.length < 5) {
    return data({error: 'New password must be at least 5 characters.'}, {status: 400});
  }

  try {
    const result = await context.storefront.mutate(CUSTOMER_UPDATE_MUTATION, {
      variables: {
        customerAccessToken: token,
        customer: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          acceptsMarketing,
          ...(newPassword ? {password: newPassword} : {}),
        },
      },
    });

    const userError = result.customerUpdate?.customerUserErrors?.[0];
    if (result.errors?.length || userError) {
      return data({error: userError?.message || 'Could not update your profile.'}, {status: 400});
    }

    // Changing email or password rotates the access token — Shopify hands
    // back a fresh one in the same response, so the session is updated
    // in-place instead of silently signing the visitor out mid-edit.
    const newToken = result.customerUpdate?.customerAccessToken;
    if (newToken) {
      setCustomerSession(context.session, newToken.accessToken, newToken.expiresAt);
    }

    return {error: null, success: true};
  } catch (error) {
    console.error('Customer profile update failed:', error);
    return data({error: 'Something went wrong. Please try again.'}, {status: 500});
  }
}

const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold';
const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#c9c2b8] bg-white px-4 py-2.5 text-sm text-[#241a16] placeholder:text-[#a69686] focus:outline-none focus:ring-2 focus:ring-[#241a16]/20 focus:border-[#241a16]';

export default function AccountProfile() {
  const {customer} = useOutletContext<{customer: AccountCustomer}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const isSubmitting = state !== 'idle';

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8">
      <h2 className="text-xl font-serif font-light text-[#241a16] mb-6">Personal information</h2>
      <Form method="PUT" className="space-y-4">
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelClass}>First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              defaultValue={customer.firstName ?? ''}
              minLength={2}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              defaultValue={customer.lastName ?? ''}
              minLength={2}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={customer.email ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={customer.phone ?? ''}
              placeholder="+91XXXXXXXXXX"
              className={inputClass}
            />
          </div>
        </fieldset>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="acceptsMarketing"
            name="acceptsMarketing"
            type="checkbox"
            defaultChecked={customer.acceptsMarketing}
            className="h-4 w-4 rounded border-[#c9c2b8] text-[#241a16] focus:ring-[#241a16]/20"
          />
          <label htmlFor="acceptsMarketing" className="text-sm text-[#241a16]">
            Send me release invitations and gifting insights
          </label>
        </div>

        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#e8e2d6]">
          <legend className="text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold mb-1 md:col-span-2">
            Change password <span className="normal-case font-normal text-[#6d6560]">(optional)</span>
          </legend>
          <div>
            <label htmlFor="newPassword" className={labelClass}>New password</label>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={5} className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm new password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={5} className={inputClass} />
          </div>
        </fieldset>

        {action?.error && <p className="text-xs text-red-600">{action.error}</p>}
        {action?.success && !action.error && (
          <p className="text-xs text-emerald-700">Profile updated.</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-full bg-[#241a16] hover:bg-[#3a2c24] disabled:opacity-60 text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200"
        >
          {isSubmitting ? 'Updating…' : 'Update'}
        </button>
      </Form>
    </div>
  );
}
