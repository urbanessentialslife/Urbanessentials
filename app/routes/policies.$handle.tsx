import {Link, useLoaderData} from 'react-router';
import {buildMeta} from '~/lib/seo';
import type {Route} from './+types/policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const policy = data?.policy;
  return buildMeta({
    matches,
    location,
    title: policy?.title ?? 'Policy',
    description: `${policy?.title ?? 'Store policy'} for Urban Essentials — read our terms for orders, shipping, returns and privacy.`,
  });
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-32 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/policies"
          className="text-xs uppercase tracking-widest text-[#6d6560] hover:text-[#241a16] transition-colors"
        >
          ← Back to Policies
        </Link>
        <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-4 mb-6">
          {policy.title}
        </h1>
        <div
          className="prose prose-sm max-w-none text-sm text-[#6d6560] leading-relaxed [&_a]:text-[#241a16] [&_h2]:text-[#241a16] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3"
          dangerouslySetInnerHTML={{__html: policy.body}}
        />
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
