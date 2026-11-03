/**
 * Vercel server entry — mirrors server.ts (the Oxygen/Workers entry), but
 * built for Vercel's custom server entrypoint signature: a plain
 * `(request: Request) => Response`, with env vars read from `process.env`
 * instead of an injected Workers `env` binding, and no real
 * `ExecutionContext` (waitUntil just fires the promise without blocking).
 * See app/lib/context.ts for the `caches` guard this relies on.
 */
import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';

export default async function handler(request: Request): Promise<Response> {
  try {
    const env = process.env as unknown as Env;
    const executionContext = {
      waitUntil(promise: Promise<unknown>) {
        promise.catch((error) => console.error(error));
      },
    } as ExecutionContext;

    const hydrogenContext = await createHydrogenRouterContext(
      request,
      env,
      executionContext,
    );

    // Hydrogen's own createRequestHandler auto-intercepts any request whose
    // URL matches the Storefront API's shape (e.g. the browser-side cookie
    // consent check at /api/unstable/graphql.json — see
    // @shopify/hydrogen-react's useShopifyCookies, used by Analytics.Provider
    // in root.tsx) and forwards it via storefront.forward(request) *before*
    // any of our own routes run. That forward() passes the request's raw
    // streaming body straight into fetch() without `duplex: 'half'`, which
    // Node requires but Workers doesn't — it throws on every Vercel request
    // that hits this path. Handle it ourselves first, with a plain string
    // body (which doesn't need `duplex`), so Hydrogen's handler never sees it.
    if (hydrogenContext.storefront.isStorefrontApiUrl(request)) {
      const target = new URL(request.url);
      target.protocol = 'https:';
      target.host = env.PUBLIC_STORE_DOMAIN;

      const upstream = await fetch(target, {
        method: request.method,
        headers: request.headers,
        body: request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.text(),
      });

      return new Response(upstream.body, upstream);
    }

    const handleRequest = createRequestHandler({
      build: serverBuild,
      mode: process.env.NODE_ENV,
      getLoadContext: () => hydrogenContext,
    });

    const response = await handleRequest(request);

    if (hydrogenContext.session.isPending) {
      response.headers.append(
        'Set-Cookie',
        await hydrogenContext.session.commit(),
      );
    }

    if (response.status === 404) {
      return storefrontRedirect({
        request,
        response,
        storefront: hydrogenContext.storefront,
      });
    }

    return response;
  } catch (error) {
    console.error(error);
    return new Response('An unexpected error occurred', {status: 500});
  }
}
