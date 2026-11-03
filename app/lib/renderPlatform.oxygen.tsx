import {renderToReadableStream} from 'react-dom/server';
import {ServerRouter} from 'react-router';
import type {RenderPlatformArgs} from './renderPlatform.types';

/** Oxygen's Workers runtime resolves the edge/browser build of
 * react-dom/server, which is the one that exports renderToReadableStream. */
export async function renderPlatform({
  request,
  responseStatusCode,
  responseHeaders,
  reactRouterContext,
  nonce,
  NonceProvider,
  isBot,
}: RenderPlatformArgs): Promise<Response> {
  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isBot) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
