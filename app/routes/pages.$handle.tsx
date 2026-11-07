import {useLoaderData} from 'react-router';
import {buildMeta, stripHtml} from '~/lib/seo';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';


export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const page = data?.page;
  return buildMeta({
    matches,
    location,
    title: page?.seo?.title || page?.title || 'Urban Essentials',
    exactTitle: Boolean(page?.seo?.title),
    description: page?.seo?.description || stripHtml(page?.body ?? ''),
  });
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: page.title }]} className="mb-6" />
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16]">{page.title}</h1>
        </header>
        <main
          className="prose prose-sm max-w-none text-sm text-[#6d6560] leading-relaxed [&_a]:text-[#241a16] [&_h2]:text-[#241a16] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3"
          dangerouslySetInnerHTML={{__html: page.body}}
        />
      </div>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
