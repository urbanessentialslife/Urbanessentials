import {isbot} from 'isbot';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';
// Resolves to renderPlatform.oxygen.tsx or renderPlatform.vercel.tsx via a
// Vite alias (see vite.config.ts) chosen per deployment target — not a
// runtime branch. Each target's build only ever resolves, parses, and
// bundles its own file, so the other platform's imports (e.g. Vercel's
// Node-only @react-router/node / node:stream) never reach Oxygen's Worker
// bundle, which inlines everything reachable and has no Node built-ins.
import {renderPlatform} from '~/lib/renderPlatform';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  // Third-party analytics hosts are only allowed when that vendor is
  // configured — see app/components/ThirdPartyAnalytics.tsx.
  const ga4 = Boolean(context.env.PUBLIC_GA4_MEASUREMENT_ID);
  const meta = Boolean(context.env.PUBLIC_META_PIXEL_ID);
  const analyticsScriptSrc = [
    ...(ga4 ? ['https://www.googletagmanager.com'] : []),
    ...(meta ? ['https://connect.facebook.net'] : []),
  ];
  const analyticsConnectSrc = [
    ...(ga4
      ? ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com']
      : []),
    ...(meta ? ['https://www.facebook.com', 'https://connect.facebook.net'] : []),
  ];
  const analyticsImgSrc = [
    ...(ga4 ? ['https://*.google-analytics.com', 'https://www.googletagmanager.com'] : []),
    ...(meta ? ['https://www.facebook.com'] : []),
  ];

  // Shiprocket Fastrr Headless Checkout hosts and payment gateways
  const shiprocketScriptSrc = [
    'https://fastrr-boost-ui.pickrr.com',
    'https://*.pickrr.com',
    'https://*.fastrr.com',
    'https://sr-cdn.shiprocket.in',
    'https://*.shiprocket.in',
    'https://*.billdesk.com',
    'https://*.razorpay.com',
    'https://*.cashfree.com',
    'https://*.otpless.com',
    'https://*.wigzo.com',
    'https://*.phonepe.com',
    'https://*.paytm.com',
    'https://*.juspay.in',
  ];
  const shiprocketConnectSrc = [
    'https://fastrr-boost-ui.pickrr.com',
    'https://*.pickrr.com',
    'https://*.fastrr.com',
    'https://*.shiprocket.in',
    'https://events.pickrr.com',
    'https://uptime2.fastrr.com',
    'https://*.razorpay.com',
    'https://*.billdesk.com',
    'https://*.cashfree.com',
    'https://*.phonepe.com',
    'https://*.paytm.com',
    'https://*.juspay.in',
  ];
  const shiprocketImgSrc = [
    'https://fastrr-boost-ui.pickrr.com',
    'https://*.pickrr.com',
    'https://*.fastrr.com',
    'https://*.shiprocket.in',
    'https://*.cloudfront.net',
  ];
  const shiprocketStyleSrc = [
    'https://fastrr-boost-ui.pickrr.com',
    'https://*.pickrr.com',
    'https://*.fastrr.com',
    'https://pay.billdesk.com',
  ];
  const shiprocketFrameSrc = [
    'https://fastrr-boost-ui.pickrr.com',
    'https://*.pickrr.com',
    'https://*.fastrr.com',
    'https://*.shiprocket.in',
    'https://api.razorpay.com',
    'https://*.razorpay.com',
    'https://*.billdesk.com',
    'https://*.cashfree.com',
    'https://*.phonepe.com',
    'https://*.paytm.com',
    'https://*.juspay.in',
  ];

  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    // Without an explicit img-src, images fall back to default-src, which
    // doesn't allow the Unsplash-hosted showcase product photography.
    // 'data:' is needed for the sitewide grain-texture overlay (an inline
    // SVG data URI, not a fetched image — see .grain-overlay in app.css).
    // 'blob:' is for the PDP's <model-viewer>, which decodes GLB textures
    // into object URLs and then fetch()es/loads them back.
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://cdn.shopify.com',
      'https://images.unsplash.com',
      ...analyticsImgSrc,
      ...shiprocketImgSrc,
    ],
    connectSrc: [
      "'self'",
      'blob:',
      'data:',
      ...analyticsConnectSrc,
      ...shiprocketConnectSrc,
    ],
    // <model-viewer> compiles small WebAssembly decoders. 'wasm-unsafe-eval'
    // permits only WebAssembly, not JS eval() — much narrower than 'unsafe-eval'.
    scriptSrc: [
      "'self'",
      "'wasm-unsafe-eval'",
      'https://cdn.shopify.com',
      ...analyticsScriptSrc,
      ...shiprocketScriptSrc,
    ],
    // root.tsx loads the brand's Google Fonts stylesheet and its font files;
    // both need explicit allowances or they're silently blocked.
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      ...shiprocketStyleSrc,
    ],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'],
    frameSrc: ["'self'", ...shiprocketFrameSrc],
  });
  responseHeaders.set('Content-Security-Policy', header);
  // Defense-in-depth alongside CSP: block clickjacking (older browsers that
  // don't honor CSP's frame-ancestors), stop MIME-sniffing away from a
  // declared content-type, and avoid leaking full URLs (which can carry
  // search terms or other path/query detail) to third-party origins.
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return renderPlatform({
    request,
    responseStatusCode,
    responseHeaders,
    reactRouterContext,
    nonce,
    NonceProvider,
    isBot: isbot(request.headers.get('user-agent')),
  });
}
