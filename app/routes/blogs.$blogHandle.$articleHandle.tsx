import {useLoaderData} from 'react-router';
import {buildMeta, stripHtml} from '~/lib/seo';
import type {Route} from './+types/blogs.$blogHandle.$articleHandle';
import {Image, useNonce} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';


export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const article = data?.article;
  return buildMeta({
    matches,
    location,
    title: article?.seo?.title || article?.title || 'Journal',
    exactTitle: Boolean(article?.seo?.title),
    description: article?.seo?.description || stripHtml(article?.contentHtml ?? ''),
    image: article?.image?.url,
    imageAlt: article?.image?.altText,
    type: 'article',
    extra: article?.publishedAt
      ? [{property: 'article:published_time', content: article.publishedAt}]
      : [],
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
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {article};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article} = useLoaderData<typeof loader>();
  const {title, image, contentHtml, author} = article;
  const nonce = useNonce();

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb
          items={[{ label: 'Home', to: '/' }, { label: 'Journal', to: '/blogs' }, { label: title }]}
          className="mb-6"
        />
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16]">{title}</h1>
          <div className="text-xs uppercase tracking-widest text-[#6d6560] mt-3">
            <time dateTime={article.publishedAt}>{publishedDate}</time>
            {author?.name ? <> &middot; <address className="inline not-italic">{author.name}</address></> : null}
          </div>
        </header>

        {image && (
          <div className="rounded-2xl overflow-hidden mb-8">
            <Image data={image} sizes="90vw" loading="eager" />
          </div>
        )}
        <div
          dangerouslySetInnerHTML={{__html: contentHtml}}
          className="prose prose-sm max-w-none text-sm text-[#6d6560] leading-relaxed [&_a]:text-[#241a16] [&_h2]:text-[#241a16] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3"
        />
      </div>

      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            image: image?.url ? [image.url] : undefined,
            datePublished: article.publishedAt,
            author: author?.name ? {'@type': 'Person', name: author.name} : undefined,
            publisher: {'@type': 'Organization', name: 'Urban Essentials'},
          }).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
