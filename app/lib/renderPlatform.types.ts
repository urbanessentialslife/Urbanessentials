import type {ComponentType, ReactNode} from 'react';
import type {EntryContext} from 'react-router';

export interface RenderPlatformArgs {
  request: Request;
  responseStatusCode: number;
  responseHeaders: Headers;
  reactRouterContext: EntryContext;
  nonce: string;
  NonceProvider: ComponentType<{children: ReactNode}>;
  isBot: boolean;
}
