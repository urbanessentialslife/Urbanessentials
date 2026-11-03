/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /** Admin API access token for a custom app with the write_customers,
     * read_orders, read_returns and write_returns scopes — used for
     * newsletter signups, guest order tracking and return requests (see
     * app/lib/admin.server.ts). */
    SHOPIFY_ADMIN_API_TOKEN?: string;
    /** Support inbox shown on the FAQ, returns-request, and floating help
     * widget. Leave blank to hide those contact links. */
    PUBLIC_SUPPORT_EMAIL?: string;
    /** WhatsApp Business number (digits only, with country code, e.g.
     * 919876543210) for the floating help widget's "Chat on WhatsApp"
     * option. Leave blank to hide that option. */
    PUBLIC_WHATSAPP_NUMBER?: string;
    /** Google Analytics 4 measurement ID (G-XXXXXXX). Leave blank to disable. */
    PUBLIC_GA4_MEASUREMENT_ID?: string;
    /** Meta (Facebook/Instagram) Pixel ID. Leave blank to disable. */
    PUBLIC_META_PIXEL_ID?: string;
    /** Footer social links. Each is hidden when blank. */
    PUBLIC_INSTAGRAM_URL?: string;
    PUBLIC_PINTEREST_URL?: string;
    PUBLIC_LINKEDIN_URL?: string;
    /** Shiprocket Fastrr seller domain */
    PUBLIC_SHIPROCKET_SELLER_DOMAIN?: string;
  }
}
