import {data} from 'react-router';
import type {Route} from './+types/api.notify-restock';
import {requestBackInStockNotification} from '~/lib/admin.server';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim();
  const productLabel = String(formData.get('productLabel') || '').trim();

  if (!email || !email.includes('@')) {
    return data({error: 'Please enter a valid email address.'}, {status: 400});
  }
  if (!productLabel) {
    return data({error: 'Missing product.'}, {status: 400});
  }

  try {
    await requestBackInStockNotification(context.env, email, productLabel);
    return data({ok: true});
  } catch (error) {
    console.error('Back-in-stock request failed:', error);
    return data(
      {error: "We couldn't save that request right now. Please try again shortly."},
      {status: 500},
    );
  }
}
