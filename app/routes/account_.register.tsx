import {Checkbox} from '~/components/visual/Common/Checkbox';
import {data, Form, Link, redirect, useActionData, useNavigation} from 'react-router';
import type {Route} from './+types/account_.register';
import {getCustomerAccessToken, setCustomerSession} from '~/lib/customerAuth.server';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Create Account | Urban Essentials'}];
};

export async function loader({context}: Route.LoaderArgs) {
  if (getCustomerAccessToken(context.session)) {
    return redirect('/');
  }
  return {};
}

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation CustomerCreateForRegister($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
` as const;

const CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION = `#graphql
  mutation CustomerAccessTokenCreateForRegister($email: String!, $password: String!) {
    customerAccessTokenCreate(input: {email: $email, password: $password}) {
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

const CUSTOMER_ADDRESS_CREATE_MUTATION = `#graphql
  mutation CustomerAddressCreateForRegister($customerAccessToken: String!, $address: MailingAddressInput!) {
    customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
      customerAddress {
        id
      }
      customerUserErrors {
        code
        message
      }
    }
  }
` as const;

const CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION = `#graphql
  mutation CustomerDefaultAddressUpdateForRegister($customerAccessToken: String!, $addressId: ID!) {
    customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
      customerUserErrors {
        code
        message
      }
    }
  }
` as const;

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');
  const acceptsMarketing = formData.get('acceptsMarketing') === 'on';

  // Address is optional — a customer can add it later from /account/addresses —
  // but if they've started filling it in, treat every field as required so we
  // don't save a half-complete address.
  const address1 = String(formData.get('address1') || '').trim();
  const address2 = String(formData.get('address2') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const province = String(formData.get('province') || '').trim();
  const zip = String(formData.get('zip') || '').trim();
  const country = String(formData.get('country') || 'IN').trim();
  const hasAddressInput = Boolean(address1 || city || province || zip);

  if (!firstName || !lastName || !email || !password) {
    return data({error: 'Please fill in your name, email, and password.'}, {status: 400});
  }
  if (password !== confirmPassword) {
    return data({error: 'Passwords do not match.'}, {status: 400});
  }
  if (hasAddressInput && (!address1 || !city || !province || !zip)) {
    return data(
      {error: 'Please complete the address fields, or leave all of them blank to add one later.'},
      {status: 400},
    );
  }

  try {
    const createResult = await context.storefront.mutate(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {firstName, lastName, email, phone: phone || undefined, password, acceptsMarketing},
      },
    });

    const createError = createResult.customerCreate?.customerUserErrors?.[0];
    if (createResult.errors?.length || createError) {
      return data(
        {error: createError?.message || 'Could not create your account. Please try again.'},
        {status: 400},
      );
    }

    // Log the new customer straight in rather than sending them to a
    // separate sign-in step right after they just filled in a password.
    const tokenResult = await context.storefront.mutate(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION, {
      variables: {email, password},
    });

    const token = tokenResult.customerAccessTokenCreate?.customerAccessToken;
    if (tokenResult.errors?.length || !token) {
      // Account exists but auto-login failed — send them to sign in manually
      // rather than surfacing this as a registration failure.
      return redirect('/account/login');
    }

    setCustomerSession(context.session, token.accessToken, token.expiresAt);

    if (hasAddressInput) {
      const addressResult = await context.storefront.mutate(CUSTOMER_ADDRESS_CREATE_MUTATION, {
        variables: {
          customerAccessToken: token.accessToken,
          address: {firstName, lastName, address1, address2: address2 || undefined, city, province, zip, country},
        },
      });

      const addressId = addressResult.customerAddressCreate?.customerAddress?.id;
      if (addressId) {
        await context.storefront.mutate(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION, {
          variables: {customerAccessToken: token.accessToken, addressId},
        });
      }
      // A failed address save here is non-critical — the account itself
      // was created and logged in successfully; they can add it from
      // /account/addresses instead.
    }

    return redirect('/');
  } catch (error) {
    console.error('Customer registration failed:', error);
    return data({error: 'Something went wrong. Please try again.'}, {status: 500});
  }
}

const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold';
const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#c9c2b8] bg-white px-4 py-2.5 text-sm text-[#241a16] placeholder:text-[#a69686] focus:outline-none focus:ring-2 focus:ring-[#241a16]/20 focus:border-[#241a16]';
const primaryButtonClass =
  'w-full px-6 py-3 rounded-full bg-[#241a16] hover:bg-[#3a2c24] disabled:opacity-60 disabled:cursor-not-allowed text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200';

export default function Register() {
  const actionData = useActionData<typeof action>();
  const {state} = useNavigation();
  const isSubmitting = state !== 'idle';

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-32 pb-24 px-6 md:px-12 font-sans text-[#241a16] flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            Join Urban Essentials
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">Create Account</h1>
        </div>

        <Form method="POST" className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8 space-y-6">
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <legend className="text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold mb-1 md:col-span-2">
              Your details
            </legend>
            <div>
              <label htmlFor="firstName" className={labelClass}>First name*</label>
              <input id="firstName" name="firstName" type="text" autoComplete="given-name" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>Last name*</label>
              <input id="lastName" name="lastName" type="text" autoComplete="family-name" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email*</label>
              <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91XXXXXXXXXX" className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password*</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={5} className={inputClass} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirm password*</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={5} className={inputClass} />
            </div>
          </fieldset>

          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <legend className="text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold mb-1 md:col-span-2">
              Shipping address <span className="normal-case font-normal text-[#6d6560]">(optional — add later if you prefer)</span>
            </legend>
            <div className="md:col-span-2">
              <label htmlFor="address1" className={labelClass}>Address line 1</label>
              <input id="address1" name="address1" type="text" autoComplete="address-line1" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address2" className={labelClass}>Address line 2</label>
              <input id="address2" name="address2" type="text" autoComplete="address-line2" className={inputClass} />
            </div>
            <div>
              <label htmlFor="city" className={labelClass}>City</label>
              <input id="city" name="city" type="text" autoComplete="address-level2" className={inputClass} />
            </div>
            <div>
              <label htmlFor="province" className={labelClass}>State / Province</label>
              <input id="province" name="province" type="text" autoComplete="address-level1" className={inputClass} />
            </div>
            <div>
              <label htmlFor="zip" className={labelClass}>Zip / Postal Code</label>
              <input id="zip" name="zip" type="text" autoComplete="postal-code" className={inputClass} />
            </div>
            {/* Single-market storefront (India — see AGENTS.md); no reason
                to ask every customer to type their country. */}
            <input type="hidden" name="country" value="India" />
          </fieldset>

          <Checkbox id="acceptsMarketing" name="acceptsMarketing" label="Send me release invitations and gifting insights" />

          {actionData?.error && <p className="text-xs text-red-600">{actionData.error}</p>}

          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-[#6d6560]">
            Already have an account?{' '}
            <Link to="/account/login" className="text-[#241a16] font-medium hover:text-[#b89b6a] transition-colors">
              Sign in →
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
}
