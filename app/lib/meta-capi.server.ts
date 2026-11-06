interface UserData {
  email?: string;
  phone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

interface MetaEventPayload {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  userData: UserData;
  customData?: Record<string, any>;
}

// Web-standard SHA-256 hashing compatible with Shopify Oxygen / Cloudflare Workers
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sendMetaServerEvent(
  env: any,
  { eventName, eventId, eventSourceUrl, userData, customData = {} }: MetaEventPayload,
) {
  const pixelId = env?.PUBLIC_META_PIXEL_ID || '2581550922313854';
  const token = env?.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !token) {
    console.warn('Meta CAPI: Missing credentials in environment variables.');
    return null;
  }

  const normalizedUserData: Record<string, any> = {};
  if (userData.email) normalizedUserData.em = [await hashValue(userData.email)];
  if (userData.phone) normalizedUserData.ph = [await hashValue(userData.phone)];
  if (userData.clientIpAddress) normalizedUserData.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent) normalizedUserData.client_user_agent = userData.clientUserAgent;
  if (userData.fbp) normalizedUserData.fbp = userData.fbp;
  if (userData.fbc) normalizedUserData.fbc = userData.fbc;

  const body: Record<string, any> = {
    test_event_code: 'TEST53925', // Streams events live into your Meta Events Manager test tab
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: 'website',
        user_data: normalizedUserData,
        custom_data: customData,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    return await res.json();
  } catch (err) {
    console.error('Meta CAPI transmission error:', err);
    return null;
  }
}
