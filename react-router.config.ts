import type {Config} from '@react-router/dev/config';
import {hydrogenPreset} from '@shopify/hydrogen/react-router-preset';
import {vercelPreset} from '@vercel/react-router/vite';

/**
 * React Router 7.9.x Configuration for Hydrogen
 *
 * Two deployment targets share this app: Shopify Oxygen (the default —
 * see server.ts) and Vercel (see server/vercel.ts), selected by whether
 * Vercel's own `VERCEL` build-time env var is set, so `npm run build` still
 * produces an Oxygen build everywhere except on Vercel's own infrastructure.
 */
export default {
  ssr: true,
  presets: [process.env.VERCEL ? vercelPreset() : hydrogenPreset()],
} satisfies Config;
