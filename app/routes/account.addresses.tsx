import {Checkbox} from '~/components/visual/Common/Checkbox';
import {data, Form, useActionData, useNavigation, useOutletContext, type Fetcher} from 'react-router';
import type {Route} from './+types/account.addresses';
import {requireCustomerAccessToken} from '~/lib/customerAuth.server';

interface AccountAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
}

interface AccountCustomer {
  defaultAddress: {id: string} | null;
  addresses: {nodes: AccountAddress[]};
}

export type ActionResponse = {
  addressId?: string | null;
  error: Record<string, string> | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Addresses | Urban Essentials'}];
};

export async function loader({context, request}: Route.LoaderArgs) {
  requireCustomerAccessToken(context.session, request);
  return {};
}

const ADDRESS_USER_ERROR_FRAGMENT = `#graphql
  fragment AddressUserErrorFields on CustomerUserError {
    code
    field
    message
  }
` as const;

const CUSTOMER_ADDRESS_CREATE_MUTATION = `#graphql
  mutation CustomerAddressCreateForAccount($customerAccessToken: String!, $address: MailingAddressInput!) {
    customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
      customerAddress {
        id
      }
      customerUserErrors {
        ...AddressUserErrorFields
      }
    }
  }
  ${ADDRESS_USER_ERROR_FRAGMENT}
` as const;

const CUSTOMER_ADDRESS_UPDATE_MUTATION = `#graphql
  mutation CustomerAddressUpdateForAccount($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
    customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
      customerAddress {
        id
      }
      customerUserErrors {
        ...AddressUserErrorFields
      }
    }
  }
  ${ADDRESS_USER_ERROR_FRAGMENT}
` as const;

const CUSTOMER_ADDRESS_DELETE_MUTATION = `#graphql
  mutation CustomerAddressDeleteForAccount($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      deletedCustomerAddressId
      customerUserErrors {
        ...AddressUserErrorFields
      }
    }
  }
  ${ADDRESS_USER_ERROR_FRAGMENT}
` as const;

const CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION = `#graphql
  mutation CustomerDefaultAddressUpdateForAccount($customerAccessToken: String!, $addressId: ID!) {
    customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
      customerUserErrors {
        ...AddressUserErrorFields
      }
    }
  }
  ${ADDRESS_USER_ERROR_FRAGMENT}
` as const;

export async function action({request, context}: Route.ActionArgs) {
  const token = requireCustomerAccessToken(context.session, request);
  const form = await request.formData();
  const addressId = form.has('addressId') ? String(form.get('addressId')) : null;

  if (!addressId) {
    return data({error: {form: 'You must provide an address id.'}}, {status: 400});
  }

  const defaultAddress = form.has('defaultAddress') ? String(form.get('defaultAddress')) === 'on' : false;
  const address = {
    firstName: String(form.get('firstName') || ''),
    lastName: String(form.get('lastName') || ''),
    company: String(form.get('company') || ''),
    address1: String(form.get('address1') || ''),
    address2: String(form.get('address2') || ''),
    city: String(form.get('city') || ''),
    province: String(form.get('province') || ''),
    zip: String(form.get('zip') || ''),
    country: String(form.get('country') || 'India'),
    phone: String(form.get('phone') || ''),
  };

  try {
    switch (request.method) {
      case 'POST': {
        const result = await context.storefront.mutate(CUSTOMER_ADDRESS_CREATE_MUTATION, {
          variables: {customerAccessToken: token, address},
        });

        const userError = result.customerAddressCreate?.customerUserErrors?.[0];
        if (result.errors?.length || userError) {
          return data({error: {[addressId]: userError?.message || 'Could not create address.'}}, {status: 400});
        }

        const newId = result.customerAddressCreate?.customerAddress?.id;
        if (defaultAddress && newId) {
          await context.storefront.mutate(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION, {
            variables: {customerAccessToken: token, addressId: newId},
          });
        }

        return {error: null, addressId: newId};
      }

      case 'PUT': {
        const result = await context.storefront.mutate(CUSTOMER_ADDRESS_UPDATE_MUTATION, {
          variables: {customerAccessToken: token, id: addressId, address},
        });

        const userError = result.customerAddressUpdate?.customerUserErrors?.[0];
        if (result.errors?.length || userError) {
          return data({error: {[addressId]: userError?.message || 'Could not update address.'}}, {status: 400});
        }

        if (defaultAddress) {
          await context.storefront.mutate(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION, {
            variables: {customerAccessToken: token, addressId},
          });
        }

        return {error: null, addressId};
      }

      case 'DELETE': {
        const result = await context.storefront.mutate(CUSTOMER_ADDRESS_DELETE_MUTATION, {
          variables: {customerAccessToken: token, id: addressId},
        });

        const userError = result.customerAddressDelete?.customerUserErrors?.[0];
        if (result.errors?.length || userError) {
          return data({error: {[addressId]: userError?.message || 'Could not delete address.'}}, {status: 400});
        }

        return {error: null, addressId};
      }

      default:
        return data({error: {[addressId]: 'Method not allowed'}}, {status: 405});
    }
  } catch (error) {
    console.error('Customer address mutation failed:', error);
    return data({error: {[addressId]: 'Something went wrong. Please try again.'}}, {status: 500});
  }
}

const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-[#6d6560] font-semibold';
const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#c9c2b8] bg-white px-4 py-2.5 text-sm text-[#241a16] placeholder:text-[#a69686] focus:outline-none focus:ring-2 focus:ring-[#241a16]/20 focus:border-[#241a16]';

export default function Addresses() {
  const {customer} = useOutletContext<{customer: AccountCustomer}>();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8">
        <h2 className="text-xl font-serif font-light text-[#241a16] mb-1">Add a new address</h2>
        <p className="text-xs text-[#6d6560] mb-6">
          Used for shipping — including custom-order deliveries, which may ship on a longer
          timeline (see each product for details).
        </p>
        <NewAddressForm key={addresses.nodes.length} />
      </div>

      <div>
        <h2 className="text-xl font-serif font-light text-[#241a16] mb-4">Saved addresses</h2>
        {!addresses.nodes.length ? (
          <p className="text-sm text-[#6d6560]">You have no addresses saved.</p>
        ) : (
          <ExistingAddresses addresses={addresses} defaultAddress={defaultAddress} />
        )}
      </div>
    </div>
  );
}

const primaryButtonClass =
  'px-6 py-2.5 rounded-full bg-[#241a16] hover:bg-[#3a2c24] disabled:opacity-60 text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200';
const secondaryButtonClass =
  'px-6 py-2.5 rounded-full border border-[#c9c2b8] hover:border-[#241a16] disabled:opacity-60 text-[#6d6560] hover:text-[#241a16] text-xs uppercase tracking-widest font-medium transition-all duration-200';

function NewAddressForm() {
  const newAddress: Partial<AccountAddress> = {
    id: 'NEW_ADDRESS_ID',
    address1: '',
    address2: '',
    city: '',
    company: '',
    country: 'India',
    firstName: '',
    lastName: '',
    phone: '',
    province: '',
    zip: '',
  };

  return (
    <AddressForm addressId="NEW_ADDRESS_ID" address={newAddress} defaultAddress={null}>
      {({stateForMethod}) => (
        <div>
          <button disabled={stateForMethod('POST') !== 'idle'} formMethod="POST" type="submit" className={primaryButtonClass}>
            {stateForMethod('POST') !== 'idle' ? 'Creating…' : 'Create address'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: {
  addresses: AccountCustomer['addresses'];
  defaultAddress: AccountCustomer['defaultAddress'];
}) {
  return (
    <div className="space-y-4">
      {addresses.nodes.map((address) => (
        <div key={address.id} className="bg-white rounded-2xl border border-[#c9c2b8] p-6 md:p-8">
          <AddressForm addressId={address.id} address={address} defaultAddress={defaultAddress}>
            {({stateForMethod}) => (
              <div className="flex flex-wrap gap-3">
                <button disabled={stateForMethod('PUT') !== 'idle'} formMethod="PUT" type="submit" className={primaryButtonClass}>
                  {stateForMethod('PUT') !== 'idle' ? 'Saving…' : 'Save changes'}
                </button>
                <button disabled={stateForMethod('DELETE') !== 'idle'} formMethod="DELETE" type="submit" className={secondaryButtonClass}>
                  {stateForMethod('DELETE') !== 'idle' ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      ))}
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: string;
  address: Partial<AccountAddress>;
  defaultAddress: AccountCustomer['defaultAddress'];
  children: (props: {stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state']}) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;

  return (
    <Form id={addressId}>
      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" name="addressId" defaultValue={addressId} />
        <div>
          <label htmlFor="firstName" className={labelClass}>First name*</label>
          <input aria-label="First name" autoComplete="given-name" defaultValue={address?.firstName ?? ''} id="firstName" name="firstName" placeholder="First name" required type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Last name*</label>
          <input aria-label="Last name" autoComplete="family-name" defaultValue={address?.lastName ?? ''} id="lastName" name="lastName" placeholder="Last name" required type="text" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="company" className={labelClass}>Company</label>
          <input aria-label="Company" autoComplete="organization" defaultValue={address?.company ?? ''} id="company" name="company" placeholder="Company" type="text" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="address1" className={labelClass}>Address line 1*</label>
          <input aria-label="Address line 1" autoComplete="address-line1" defaultValue={address?.address1 ?? ''} id="address1" name="address1" placeholder="Address line 1" required type="text" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="address2" className={labelClass}>Address line 2</label>
          <input aria-label="Address line 2" autoComplete="address-line2" defaultValue={address?.address2 ?? ''} id="address2" name="address2" placeholder="Address line 2" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>City*</label>
          <input aria-label="City" autoComplete="address-level2" defaultValue={address?.city ?? ''} id="city" name="city" placeholder="City" required type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="province" className={labelClass}>State / Province*</label>
          <input aria-label="State/Province" autoComplete="address-level1" defaultValue={address?.province ?? ''} id="province" name="province" placeholder="State / Province" required type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="zip" className={labelClass}>Zip / Postal Code*</label>
          <input aria-label="Zip" autoComplete="postal-code" defaultValue={address?.zip ?? ''} id="zip" name="zip" placeholder="Zip / Postal Code" required type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>Country*</label>
          <input aria-label="Country" autoComplete="country-name" defaultValue={address?.country || 'India'} id="country" name="country" placeholder="Country" required type="text" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input aria-label="Phone Number" autoComplete="tel" defaultValue={address?.phone ?? ''} id="phone" name="phone" placeholder="+16135551111" pattern="^\+?[1-9]\d{3,14}$" type="tel" className={inputClass} />
        </div>
        <Checkbox className="md:col-span-2 mt-1" id="defaultAddress" name="defaultAddress" defaultChecked={isDefaultAddress} label="Set as default address" />
        {error && <p className="md:col-span-2 text-xs text-red-600">{error}</p>}
        <div className="md:col-span-2 flex flex-wrap gap-3 mt-2">
          {children({stateForMethod: (method) => (formMethod === method ? state : 'idle')})}
        </div>
      </fieldset>
    </Form>
  );
}
