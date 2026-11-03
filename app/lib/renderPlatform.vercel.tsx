import {PassThrough} from 'node:stream';
import {renderToPipeableStream} from 'react-dom/server';
import {createReadableStreamFromReadable} from '@react-router/node';
import {ServerRouter} from 'react-router';
import type {RenderPlatformArgs} from './renderPlatform.types';

/** Vercel's Node.js Functions resolve react-dom/server's CommonJS build,
 * which only exports renderToPipeableStream (Node streams), not
 * renderToReadableStream (Web Streams, edge/browser-only). This file is
 * swapped in for app/lib/renderPlatform at the Vite alias level (see
 * vite.config.ts) — it's never resolved, parsed, or bundled by the Oxygen
 * build, so its Node-only imports can't leak into that Worker bundle. */
export async function renderPlatform({
  request,
  responseStatusCode,
  responseHeaders,
  reactRouterContext,
  nonce,
  NonceProvider,
  isBot,
}: RenderPlatformArgs): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;
    const readyOption =
      isBot || reactRouterContext.isSpaMode ? 'onAllReady' : 'onShellReady';

    const {pipe, abort} = renderToPipeableStream(
      <NonceProvider>
        <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />
      </NonceProvider>,
      {
        nonce,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set('Content-Type', 'text/html');
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) console.error(error);
        },
      },
    );

    setTimeout(abort, 5000 + 1000);
  });
}
