import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';

const isVercel = Boolean(process.env.VERCEL);

export default defineConfig(({isSsrBuild}) => ({
  plugins: [
    tailwindcss(),
    hydrogen(),
    // MiniOxygen (Workers runtime emulation) only applies to the Oxygen target.
    ...(isVercel ? [] : [oxygen()]),
    reactRouter(),
  ],
  resolve: {
    alias: {
      // Swaps in the Node-safe (Vercel) or Workers-safe (Oxygen) SSR render
      // implementation per target — this is a build-time resolution swap,
      // not a runtime branch, so the target NOT selected is never resolved,
      // parsed, or bundled at all. Must come before the general '~' alias
      // below, since alias entries are matched in order and '~' would
      // otherwise shadow this more specific one. See app/entry.server.tsx.
      '~/lib/renderPlatform': fileURLToPath(
        new URL(
          isVercel
            ? './app/lib/renderPlatform.vercel.tsx'
            : './app/lib/renderPlatform.oxygen.tsx',
          import.meta.url,
        ),
      ),
      // Vite's native tsconfig path resolver does not cover JavaScript
      // projects that use jsconfig.json, so define Hydrogen's app alias here.
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
    tsconfigPaths: true,
  },
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
    // On Vercel, the SSR build uses server/vercel.ts (a plain Request ->
    // Response entry) instead of Oxygen's Workers-module server.ts.
    rollupOptions:
      isVercel && isSsrBuild ? {input: './server/vercel.ts'} : undefined,
  },
  ssr: {
    // On Vercel's Node.js Functions, Vite leaves most node_modules deps as
    // external `import`s resolved by Node's own (stricter) CJS interop at
    // runtime, instead of bundling them like Oxygen's Worker build always
    // does (Workers can't resolve node_modules at runtime, so it has no
    // choice). gsap's CJS build doesn't expose named exports the way Node's
    // interop expects, so force it to be bundled in on every target too.
    noExternal: ['gsap'],
    optimizeDeps: {
      /**
       * Include dependencies here if they throw CJS<>ESM errors.
       * For example, for the following error:
       *
       * > ReferenceError: module is not defined
       * >   at /Users/.../node_modules/example-dep/index.js:1:1
       *
       * Include 'example-dep' in the array below.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: [
        'react-router > set-cookie-parser',
        'react-router > cookie',
        'react-router',
      ],
    },
  },
  server: {
    allowedHosts: ['.tryhydrogen.dev', '.trycloudflare.com'],
  },
}));
