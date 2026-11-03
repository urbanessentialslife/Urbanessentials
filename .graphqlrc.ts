import type {IGraphQLConfig} from 'graphql-config';
import {getSchema} from '@shopify/hydrogen-codegen';

/**
 * GraphQL Config
 * @see https://the-guild.dev/graphql/config/docs/user/usage
 * @type {IGraphQLConfig}
 */
const graphqlConfig: IGraphQLConfig = {
  projects: {
    // Every account/auth query in this storefront runs through the
    // Storefront API's classic `customer`/`customerCreate`/etc. (see
    // app/lib/customerAuth.server.ts) rather than the OAuth-hosted Customer
    // Account API — there's no `customer-account` project here on purpose,
    // and no app/graphql/customer-account/ directory to point it at.
    default: {
      schema: getSchema('storefront'),
      documents: [
        './*.{ts,tsx,js,jsx}',
        './app/**/*.{ts,tsx,js,jsx}',
      ],
    },

    // Add your own GraphQL projects here for CMS, Shopify Admin API, etc.
  },
};

export default graphqlConfig;
