import {sendMetaServerEvent} from '~/lib/meta-capi.server';

export async function action({request, context}: {request: Request; context: any}) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({error: 'Method not allowed'}), {
      status: 405,
      headers: {'Content-Type': 'application/json'},
    });
  }

  const {env} = context;

  let payload: any;
  try {
    payload = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({error: 'Invalid JSON payload'}), {
      status: 400,
      headers: {'Content-Type': 'application/json'},
    });
  }

  // Extract client IP address from headers
  const clientIpAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    undefined;

  // Extract browser User-Agent
  const clientUserAgent = request.headers.get('user-agent') || undefined;

  // Extract Facebook Pixel cookies (_fbp and _fbc)
  const cookieHeader = request.headers.get('cookie') || '';
  const fbp = cookieHeader.match(/_fbp=([^;]+)/)?.[1];
  const fbc = cookieHeader.match(/_fbc=([^;]+)/)?.[1];

  const result = await sendMetaServerEvent(env, {
    eventName: payload.eventName,
    eventId: payload.eventId,
    eventSourceUrl: payload.eventSourceUrl || request.headers.get('referer') || '',
    userData: {
      clientIpAddress,
      clientUserAgent,
      fbp,
      fbc,
      ...payload.userData,
    },
    customData: payload.customData,
  });

  return new Response(JSON.stringify({success: true, result}), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  });
}
