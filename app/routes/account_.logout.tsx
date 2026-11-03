import {redirect} from 'react-router';
import type {Route} from './+types/account_.logout';
import {clearCustomerSession, getCustomerAccessToken} from '~/lib/customerAuth.server';

// A GET here (e.g. a bookmark or accidental link) shouldn't log anyone
// out — only the POST from the real sign-out button does.
export async function loader() {
  return redirect('/');
}

const CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION = `#graphql
  mutation CustomerAccessTokenDeleteForLogout($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
    }
  }
` as const;

export async function action({context}: Route.ActionArgs) {
  const token = getCustomerAccessToken(context.session);

  if (token) {
    await context.storefront
      .mutate(CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION, {variables: {customerAccessToken: token}})
      .catch((error: Error) => {
        // Non-critical — the session is cleared below regardless, so the
        // visitor is signed out of this storefront either way even if
        // revoking the token itself failed.
        console.error('Customer token revocation failed:', error);
      });
  }

  clearCustomerSession(context.session);
  return redirect('/');
}
