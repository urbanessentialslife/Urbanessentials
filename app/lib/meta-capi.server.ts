import crypto from 'crypto';

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

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function sendMetaServerEvent(
  env: Env,
  { eventName, eventId, eventSourceUrl, userData, customData = {} }: MetaEventPayload,
) {
  const pixelId = env.PUBLIC_META_PIXEL_ID;
  const token = env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !token) {
    console.warn('Meta CAPI: Missing credentials in environment variables.');
    return null;
  }

  const normalizedUserData: Record<string, any> = {};
  if (userData.email) normalizedUserData.em = [hashValue(userData.email)];
  if (userData.phone) normalizedUserData.ph = [hashValue(userData.phone)];
  if (userData.clientIpAddress) normalizedUserData.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent) normalizedUserData.client_user_agent = userData.clientUserAgent;
  if (userData.fbp) normalizedUserData.fbp = userData.fbp;
  if (userData.fbc) normalizedUserData.fbc = userData.fbc;

  const body = {
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
