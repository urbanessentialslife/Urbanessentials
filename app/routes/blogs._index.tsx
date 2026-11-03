import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import type {BlogsQuery} from 'storefrontapi.generated';

type BlogNode = BlogsQuery['blogs']['nodes'][0];

export const meta: Route.MetaFunction = () => {
  return [
    {title: `Journal | Urban Essentials`},
    {
      name: 'description',
      content: 'Stories, care guides, and behind-the-scenes notes from Urban Essentials.',
    },
  ];
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
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 10,
  });

  const [{blogs}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {blogs};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blogs() {
  const {blogs} = useLoaderData<typeof loader>();

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-32 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            The Journal
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">Journal</h1>
        </div>
        <PaginatedResourceSection<BlogNode>
          connection={blogs}
          resourcesClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {({node: blog}) => (
            <Link
              key={blog.handle}
              prefetch="intent"
              to={`/blogs/${blog.handle}`}
              className="p-5 rounded-xl bg-white border border-[#c9c2b8] hover:border-[#b89b6a] transition-colors"
            >
              <h2 className="text-base font-medium text-[#241a16]">{blog.title}</h2>
            </Link>
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
      }
    }
  }
` as const;
