import {data} from 'react-router';
import type {Route} from './+types/api.newsletter';
import {subscribeToNewsletter} from '~/lib/admin.server';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const formData = await request.formData();

  // Honeypot: a real visitor never sees or fills this field (see the hidden
  // input in ShowcaseFooter.tsx). Report success without actually
  // subscribing anything, so the bot has no signal to adapt to.
  if (String(formData.get('company') || '').trim()) {
    return data({ok: true});
  }

  const email = String(formData.get('email') || '').trim();

  if (!email || !email.includes('@')) {
    return data({error: 'Please enter a valid email address.'}, {status: 400});
  }

  try {
    await subscribeToNewsletter(context.env, email);
    return data({ok: true});
  } catch (error) {
    // Log the real cause server-side only — it can include internal setup
    // details (e.g. a missing Admin API token) that shouldn't reach the
    // visitor's browser.
    console.error('Newsletter subscription failed:', error);
    return data(
      {error: 'We could not subscribe you right now. Please try again shortly.'},
      {status: 500},
    );
  }
}
