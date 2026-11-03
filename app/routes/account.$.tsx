import {redirect} from 'react-router';

// Fallback for any unmatched path under /account/* — account.tsx itself
// guards the real authenticated pages (redirecting to /account/login when
// there's no session), so this just sends stray paths back to the account
// index, which resolves from there.
export async function loader() {
  return redirect('/account');
}
