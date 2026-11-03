/**
 * Minimal Shopify Admin API client for the things the storefront's own
 * Customer Account / Storefront APIs can't do:
 *   - subscribe an email to marketing without creating a password-based
 *     customer login (Storefront API's `customerCreate` requires a
 *     password, which doesn't fit a shop using passwordless new Customer
 *     Accounts)
 *   - look up an order by number + email for guest order tracking, which
 *     the classic Storefront API has no anonymous query for at all (only a
 *     logged-in customer's own `customer.orders` is reachable there)
 *   - let a customer (guest or signed in) request a return against that
 *     order, which neither storefront-facing API exposes for classic accounts
 *
 * Requires a custom app Admin API access token with the `write_customers`,
 * `read_orders`, `read_returns` and `write_returns` scopes, set as SHOPIFY_ADMIN_API_TOKEN — create one at
 * Shopify Admin → Settings → Apps and sales channels → Develop apps.
 */

// Shopify supports each version for ~12 months (see
// https://shopify.dev/docs/api/usage/versioning) — bump this roughly once a
// year. 2026-10 is accessible until October 2027.
const ADMIN_API_VERSION = '2026-10';

interface UserError {
  field?: string[] | null;
  message: string;
}

async function adminGraphQL<T>(
  env: Env,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  if (!env.SHOPIFY_ADMIN_API_TOKEN) {
    throw new Error(
      'SHOPIFY_ADMIN_API_TOKEN is not set. Create a custom app in Shopify Admin (Settings → Apps and sales channels → Develop apps) with the write_customers scope and set its Admin API access token.',
    );
  }

  const response = await fetch(
    `https://${env.PUBLIC_STORE_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({query, variables}),
    },
  );

  const json = (await response.json()) as {data?: T; errors?: {message: string}[]};
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data as T;
}

const EMAIL_MARKETING_CONSENT = {
  marketingState: 'SUBSCRIBED',
  marketingOptInLevel: 'SINGLE_OPT_IN',
};

export async function subscribeToNewsletter(env: Env, email: string): Promise<void> {
  const createResult = await adminGraphQL<{
    customerCreate: {customer: {id: string} | null; userErrors: UserError[]};
  }>(
    env,
    // Not tagged #graphql: this targets the Admin API schema, and
    // Hydrogen's codegen only knows the Storefront API schema — tagging it
    // would make `npm run build`/codegen try (and fail) to validate this
    // against the wrong schema.
    `
      mutation SubscribeCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { id }
          userErrors { field message }
        }
      }
    `,
    {input: {email, emailMarketingConsent: EMAIL_MARKETING_CONSENT}},
  );

  const {customer, userErrors} = createResult.customerCreate;
  if (customer) return;

  const alreadyExists = userErrors.some((e) => e.message.toLowerCase().includes('taken'));
  if (!alreadyExists) {
    throw new Error(userErrors.map((e) => e.message).join('; ') || 'Could not subscribe email.');
  }

  // A customer with this email already exists — look them up and update
  // their marketing consent instead of creating a duplicate.
  const lookup = await adminGraphQL<{customers: {nodes: {id: string}[]}}>(
    env,
    `
      query FindCustomerByEmail($query: String!) {
        customers(first: 1, query: $query) {
          nodes { id }
        }
      }
    `,
    {query: `email:${email}`},
  );

  const existingId = lookup.customers.nodes[0]?.id;
  if (!existingId) {
    throw new Error('Could not find or create a customer for this email.');
  }

  const updateResult = await adminGraphQL<{
    customerUpdate: {userErrors: UserError[]};
  }>(
    env,
    `
      mutation UpdateCustomerConsent($input: CustomerInput!) {
        customerUpdate(input: $input) {
          userErrors { field message }
        }
      }
    `,
    {input: {id: existingId, emailMarketingConsent: EMAIL_MARKETING_CONSENT}},
  );

  if (updateResult.customerUpdate.userErrors.length) {
    throw new Error(updateResult.customerUpdate.userErrors.map((e) => e.message).join('; '));
  }
}

/**
 * Captures a "notify me when back in stock" request by tagging the
 * customer `restock-request` and appending a note naming the product/
 * variant — there's no Storefront API or Admin API primitive that actually
 * sends an email on restock, so this only captures the request in a place
 * the merchant can act on it: filter Admin → Customers by the
 * `restock-request` tag, or point a Shopify Flow at that tag plus a
 * "Product back in stock" trigger to automate the follow-up email.
 */
export async function requestBackInStockNotification(
  env: Env,
  email: string,
  productLabel: string,
): Promise<void> {
  const RESTOCK_TAG = 'restock-request';
  const noteLine = `Wants to be notified when back in stock: ${productLabel}`;

  const createResult = await adminGraphQL<{
    customerCreate: {customer: {id: string} | null; userErrors: UserError[]};
  }>(
    env,
    `
      mutation CreateRestockCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { id }
          userErrors { field message }
        }
      }
    `,
    {input: {email, tags: [RESTOCK_TAG], note: noteLine}},
  );

  const {customer, userErrors} = createResult.customerCreate;
  if (customer) return;

  const alreadyExists = userErrors.some((e) => e.message.toLowerCase().includes('taken'));
  if (!alreadyExists) {
    throw new Error(userErrors.map((e) => e.message).join('; ') || 'Could not register this request.');
  }

  // A customer with this email already exists — append the tag/note rather
  // than overwriting whatever is already on their record.
  const lookup = await adminGraphQL<{
    customers: {nodes: {id: string; tags: string[]; note: string | null}[]};
  }>(
    env,
    `
      query FindCustomerByEmail($query: String!) {
        customers(first: 1, query: $query) {
          nodes { id tags note }
        }
      }
    `,
    {query: `email:${email}`},
  );

  const existing = lookup.customers.nodes[0];
  if (!existing) {
    throw new Error('Could not find or create a customer for this email.');
  }

  const nextTags = Array.from(new Set([...existing.tags, RESTOCK_TAG]));
  const nextNote = [existing.note, noteLine].filter(Boolean).join('\n');

  const updateResult = await adminGraphQL<{
    customerUpdate: {userErrors: UserError[]};
  }>(
    env,
    `
      mutation UpdateRestockCustomer($input: CustomerInput!) {
        customerUpdate(input: $input) {
          userErrors { field message }
        }
      }
    `,
    {input: {id: existing.id, tags: nextTags, note: nextNote}},
  );

  if (updateResult.customerUpdate.userErrors.length) {
    throw new Error(updateResult.customerUpdate.userErrors.map((e) => e.message).join('; '));
  }
}

export interface OrderStatusResult {
  name: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  createdAt: string;
  totalPrice: string;
  currencyCode: string;
  lineItems: {title: string; quantity: number}[];
  tracking: {number: string | null; url: string | null; company: string | null}[];
}

// Admin search query syntax only tokenizes on whitespace/colons; anything
// else (quotes, parens) could otherwise let a crafted order number or email
// escape the `name:... AND email:...` query shape.
function sanitizeOrderLookupValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9@._\-+#]/g, '');
}

/**
 * Looks up a single order by order number + the email it was placed under —
 * the standard "guest order tracking" shape. Returns null for no match
 * (never distinguishes "wrong order number" from "wrong email" in the
 * response, so this can't be used to enumerate valid emails against an
 * order number).
 */
export async function lookupOrderStatus(
  env: Env,
  orderNumber: string,
  email: string,
): Promise<OrderStatusResult | null> {
  const cleanName = sanitizeOrderLookupValue(orderNumber.replace(/^#/, '').trim());
  const cleanEmail = sanitizeOrderLookupValue(email.trim().toLowerCase());
  if (!cleanName || !cleanEmail) {
    throw new Error('Order number and email are required.');
  }

  const result = await adminGraphQL<{
    orders: {
      nodes: {
        name: string;
        displayFinancialStatus: string | null;
        displayFulfillmentStatus: string | null;
        createdAt: string;
        email: string | null;
        totalPriceSet: {shopMoney: {amount: string; currencyCode: string}};
        lineItems: {nodes: {title: string; quantity: number}[]};
        fulfillments: {trackingInfo: {number: string | null; url: string | null; company: string | null}[]}[];
      }[];
    };
  }>(
    env,
    `
      query OrderStatusLookup($query: String!) {
        orders(first: 1, query: $query) {
          nodes {
            name
            displayFinancialStatus
            displayFulfillmentStatus
            createdAt
            email
            totalPriceSet { shopMoney { amount currencyCode } }
            lineItems(first: 20) { nodes { title quantity } }
            fulfillments(first: 5) {
              trackingInfo { number url company }
            }
          }
        }
      }
    `,
    {query: `name:#${cleanName} AND email:${cleanEmail}`},
  );

  const order = result.orders.nodes[0];
  if (!order || order.email?.toLowerCase() !== cleanEmail) {
    return null;
  }

  return {
    name: order.name,
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus,
    createdAt: order.createdAt,
    totalPrice: order.totalPriceSet.shopMoney.amount,
    currencyCode: order.totalPriceSet.shopMoney.currencyCode,
    lineItems: order.lineItems.nodes,
    tracking: order.fulfillments.flatMap((f) => f.trackingInfo),
  };
}

/**
 * Finds the customer with this email, or creates one with no password set —
 * the Admin API is the only one of Shopify's customer-creation mutations
 * that allows that (Storefront's classic `customerCreate` always requires a
 * password). Used as the first step of email-code login: see
 * app/lib/otp.server.ts.
 */
export async function findOrCreateCustomerByEmail(env: Env, email: string): Promise<string> {
  const createResult = await adminGraphQL<{
    customerCreate: {customer: {id: string} | null; userErrors: UserError[]};
  }>(
    env,
    `
      mutation CreateOtpCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { id }
          userErrors { field message }
        }
      }
    `,
    {input: {email}},
  );

  const {customer, userErrors} = createResult.customerCreate;
  if (customer) return customer.id;

  const alreadyExists = userErrors.some((e) => e.message.toLowerCase().includes('taken'));
  if (!alreadyExists) {
    throw new Error(userErrors.map((e) => e.message).join('; ') || 'Could not find or create this customer.');
  }

  const lookup = await adminGraphQL<{customers: {nodes: {id: string}[]}}>(
    env,
    `
      query FindCustomerByEmail($query: String!) {
        customers(first: 1, query: $query) {
          nodes { id }
        }
      }
    `,
    {query: `email:${email}`},
  );

  const existingId = lookup.customers.nodes[0]?.id;
  if (!existingId) {
    throw new Error('Could not find or create a customer for this email.');
  }
  return existingId;
}

/**
 * Writes a one-time login code onto the customer's `custom.login_otp_code`
 * metafield — the actual "sending" of that code to the customer's inbox is
 * handled by a Shopify Flow the merchant sets up once (trigger: "Customer
 * metafield value changed" on this key; action: send email templated with
 * `{{customer.metafields.custom.login_otp_code.value}}`). There's no Admin
 * or Storefront API primitive that sends an arbitrary email directly, so
 * this is the mechanism — see docs/email-otp-setup.md.
 */
export async function setCustomerLoginOtp(env: Env, customerId: string, code: string): Promise<void> {
  const result = await adminGraphQL<{
    metafieldsSet: {userErrors: UserError[]};
  }>(
    env,
    `
      mutation SetLoginOtpMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
        }
      }
    `,
    {
      metafields: [
        {
          ownerId: customerId,
          namespace: 'custom',
          key: 'login_otp_code',
          type: 'single_line_text_field',
          value: code,
        },
      ],
    },
  );

  if (result.metafieldsSet.userErrors.length) {
    throw new Error(result.metafieldsSet.userErrors.map((e) => e.message).join('; '));
  }
}

/**
 * Force-sets a customer's password via the Admin API (no existing password
 * needed — merchant-level privilege). Used to mint a real classic
 * `customerAccessToken` for an OTP-verified login: generate a random
 * throwaway password here, then call the Storefront API's
 * `customerAccessTokenCreate` with it immediately after, exactly like a
 * normal password login. See app/lib/otp.server.ts — this intentionally
 * replaces whatever password (if any) the customer had set.
 */
export async function setCustomerPassword(env: Env, customerId: string, password: string): Promise<void> {
  const result = await adminGraphQL<{
    customerUpdate: {userErrors: UserError[]};
  }>(
    env,
    `
      mutation SetCustomerPassword($input: CustomerInput!) {
        customerUpdate(input: $input) {
          userErrors { field message }
        }
      }
    `,
    {input: {id: customerId, password, passwordConfirmation: password}},
  );

  if (result.customerUpdate.userErrors.length) {
    throw new Error(result.customerUpdate.userErrors.map((e) => e.message).join('; '));
  }
}

export interface NewProductVariant {
  /** Omit for a single-variant product — it gets Shopify's default "Title"/"Default Title" option. */
  optionValue?: string;
  price: number;
  compareAtPrice?: number;
}

export interface NewProductInput {
  title: string;
  /** Forces the Shopify handle to match a local showcaseProducts.ts entry so mapShowcaseCatalog merges curated images/copy onto it. */
  handle: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  /** Named option (e.g. "Finish") — set even for a single variant so it's matched by name instead of defaulting to Shopify's "Title"/"Default Title". */
  optionName: string;
  variants: NewProductVariant[];
}

/**
 * Creates a product as a Shopify Admin "Draft" — never auto-published, so it
 * never appears on the live Storefront API catalog (mapShowcaseCatalog only
 * ever sees published products) until a merchant reviews it, adds photos,
 * and publishes it from Shopify Admin. Requires the custom app's Admin API
 * token to carry the `write_products` scope (not needed by anything else in
 * this file) — add it at Shopify Admin → Settings → Apps and sales channels
 * → Develop apps → this app → Configuration, if product creation fails with
 * an access/scope error.
 */
export async function createDraftProduct(
  env: Env,
  input: NewProductInput,
): Promise<{productId: string; variantIds: string[]}> {
  const createResult = await adminGraphQL<{
    productCreate: {
      product: {
        id: string;
        variants: {nodes: {id: string; selectedOptions: {name: string; value: string}[]}[]};
      } | null;
      userErrors: UserError[];
    };
  }>(
    env,
    `
      mutation CreateDraftProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            variants(first: 10) {
              nodes { id selectedOptions { name value } }
            }
          }
          userErrors { field message }
        }
      }
    `,
    {
      product: {
        title: input.title,
        handle: input.handle,
        descriptionHtml: input.descriptionHtml,
        productType: input.productType,
        tags: input.tags,
        status: 'DRAFT',
        productOptions: [
          {
            name: input.optionName,
            values: input.variants.map((v) => ({name: v.optionValue ?? 'Default'})),
          },
        ],
      },
    },
  );

  const {product, userErrors} = createResult.productCreate;
  if (!product) {
    throw new Error(userErrors.map((e) => e.message).join('; ') || 'Could not create product.');
  }

  // productCreate auto-generates one variant per option value (price 0) —
  // price them individually by matching back on the option value, since
  // there's no way to set price at creation time with productOptions.
  const variantUpdates = product.variants.nodes.map((variantNode) => {
    const matchingInput = input.variants.find(
      (v) => (v.optionValue ?? 'Default') === variantNode.selectedOptions[0]?.value,
    );
    return {
      id: variantNode.id,
      price: String(matchingInput?.price ?? 0),
      compareAtPrice: matchingInput?.compareAtPrice ? String(matchingInput.compareAtPrice) : null,
    };
  });

  const updateResult = await adminGraphQL<{
    productVariantsBulkUpdate: {userErrors: UserError[]};
  }>(
    env,
    `
      mutation PriceVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { field message }
        }
      }
    `,
    {productId: product.id, variants: variantUpdates},
  );

  if (updateResult.productVariantsBulkUpdate.userErrors.length) {
    throw new Error(
      updateResult.productVariantsBulkUpdate.userErrors.map((e) => e.message).join('; '),
    );
  }

  return {productId: product.id, variantIds: product.variants.nodes.map((v) => v.id)};
}

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

/** Days after delivery during which an item can still be returned. Keep in sync with the Refund Policy and FAQ copy. */
export const RETURN_WINDOW_DAYS = 7;

/**
 * Customer-facing reasons. Each resolves at request time to one of Shopify's
 * standardized `ReturnReasonDefinition`s by name, falling back to the
 * (deprecated but still accepted in this pinned API version) `ReturnReason`
 * enum if the shop's reason library has no close match.
 */
export const RETURN_REASONS = [
  {key: 'changed_mind', label: 'Changed my mind', match: /changed.*mind|no longer (want|need)|unwanted/i, fallback: 'UNWANTED'},
  {key: 'damaged', label: 'Arrived damaged or defective', match: /damaged|defective/i, fallback: 'DEFECTIVE'},
  {key: 'wrong_item', label: 'Received the wrong item', match: /wrong item/i, fallback: 'WRONG_ITEM'},
  {key: 'not_as_described', label: "Doesn't match the description", match: /not as described/i, fallback: 'NOT_AS_DESCRIBED'},
  {key: 'other', label: 'Other', match: /^other$/i, fallback: 'OTHER'},
] as const;

export type ReturnReasonKey = (typeof RETURN_REASONS)[number]['key'];

export interface ReturnableItem {
  fulfillmentLineItemId: string;
  title: string;
  variantTitle: string | null;
  imageUrl: string | null;
  /** Units still available to return (fulfilled minus already requested/returned). */
  quantity: number;
  personalized: boolean;
  /** Null when eligible; otherwise a customer-facing explanation. */
  ineligibleReason: string | null;
}

export interface ReturnableOrder {
  orderId: string;
  name: string;
  items: ReturnableItem[];
  existingReturns: {name: string; status: string}[];
}

// Matches the attribute the cart writes for personalised items (see
// ShowcaseCartContext.tsx) and the hidden internal fee product handle (see
// INTERNAL_PRODUCT_HANDLES in showcaseCommerce.ts).
const PERSONALIZATION_ATTRIBUTE = 'Customization';
const INTERNAL_HANDLES = new Set(['customization-fee']);

interface ReturnOrderNode {
  id: string;
  name: string;
  email: string | null;
  fulfillments: {
    createdAt: string;
    deliveredAt: string | null;
    fulfillmentLineItems: {
      nodes: {
        id: string;
        quantity: number | null;
        lineItem: {
          title: string;
          variantTitle: string | null;
          customAttributes: {key: string; value: string | null}[];
          image: {url: string} | null;
          product: {handle: string} | null;
        };
      }[];
    };
  }[];
  returns: {
    nodes: {
      name: string;
      status: string;
      returnLineItems: {
        nodes: {quantity?: number; fulfillmentLineItem?: {id: string}}[];
      };
    }[];
  };
}

/**
 * Looks up an order by number + checkout email (same verification as guest
 * order tracking) and works out which shipped items can still be returned.
 * Returns null when no order matches — never says which of the two was wrong.
 */
export async function getReturnableOrder(
  env: Env,
  orderNumber: string,
  email: string,
): Promise<ReturnableOrder | null> {
  const cleanName = sanitizeOrderLookupValue(orderNumber.replace(/^#/, '').trim());
  const cleanEmail = sanitizeOrderLookupValue(email.trim().toLowerCase());
  if (!cleanName || !cleanEmail) return null;

  const result = await adminGraphQL<{orders: {nodes: ReturnOrderNode[]}}>(
    env,
    `
      query ReturnableOrderLookup($query: String!) {
        orders(first: 1, query: $query) {
          nodes {
            id
            name
            email
            fulfillments(first: 10) {
              createdAt
              deliveredAt
              fulfillmentLineItems(first: 50) {
                nodes {
                  id
                  quantity
                  lineItem {
                    title
                    variantTitle
                    customAttributes { key value }
                    image { url(transform: {maxWidth: 160, maxHeight: 160}) }
                    product { handle }
                  }
                }
              }
            }
            returns(first: 20) {
              nodes {
                name
                status
                returnLineItems(first: 50) {
                  nodes {
                    ... on ReturnLineItem {
                      quantity
                      fulfillmentLineItem { id }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    {query: `name:#${cleanName} AND email:${cleanEmail}`},
  );

  const order = result.orders.nodes[0];
  if (
    !order ||
    order.email?.toLowerCase() !== cleanEmail ||
    order.name.replace(/^#/, '').toLowerCase() !== cleanName.toLowerCase()
  ) {
    return null;
  }

  // Units already tied up in a live (not declined/cancelled) return.
  const alreadyReturned = new Map<string, number>();
  for (const ret of order.returns.nodes) {
    if (ret.status === 'DECLINED' || ret.status === 'CANCELED') continue;
    for (const line of ret.returnLineItems.nodes) {
      const id = line.fulfillmentLineItem?.id;
      if (!id) continue;
      alreadyReturned.set(id, (alreadyReturned.get(id) ?? 0) + (line.quantity ?? 0));
    }
  }

  const now = Date.now();
  const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const items: ReturnableItem[] = [];

  for (const fulfillment of order.fulfillments) {
    const deliveredAt = fulfillment.deliveredAt ? Date.parse(fulfillment.deliveredAt) : null;
    const windowClosed = deliveredAt !== null && now - deliveredAt > windowMs;

    for (const fli of fulfillment.fulfillmentLineItems.nodes) {
      if (fli.lineItem.product && INTERNAL_HANDLES.has(fli.lineItem.product.handle)) continue;

      const remaining = (fli.quantity ?? 0) - (alreadyReturned.get(fli.id) ?? 0);
      const personalized = fli.lineItem.customAttributes.some(
        (attr) => attr.key === PERSONALIZATION_ATTRIBUTE && attr.value,
      );

      let ineligibleReason: string | null = null;
      if (remaining <= 0) ineligibleReason = 'A return has already been requested for this item.';
      else if (windowClosed) ineligibleReason = `The ${RETURN_WINDOW_DAYS}-day return window for this item has closed.`;

      items.push({
        fulfillmentLineItemId: fli.id,
        title: fli.lineItem.title,
        variantTitle: fli.lineItem.variantTitle,
        imageUrl: fli.lineItem.image?.url ?? null,
        quantity: Math.max(remaining, 0),
        personalized,
        ineligibleReason,
      });
    }
  }

  return {
    orderId: order.id,
    name: order.name,
    items,
    existingReturns: order.returns.nodes.map((r) => ({name: r.name, status: r.status})),
  };
}

async function resolveReturnReasonIds(env: Env): Promise<Map<ReturnReasonKey, string>> {
  const resolved = new Map<ReturnReasonKey, string>();
  try {
    const result = await adminGraphQL<{
      returnReasonDefinitions: {nodes: {id: string; name: string}[]};
    }>(
      env,
      `
        query ReturnReasonLibrary {
          returnReasonDefinitions(first: 250, query: "deleted:false") {
            nodes { id name }
          }
        }
      `,
      {},
    );
    for (const reason of RETURN_REASONS) {
      const match = result.returnReasonDefinitions.nodes.find((def) => reason.match.test(def.name));
      if (match) resolved.set(reason.key, match.id);
    }
  } catch (error) {
    // Fall back to the enum for every reason rather than failing the request.
    console.error('Could not load return reason definitions:', error);
  }
  return resolved;
}

export interface ReturnRequestLine {
  fulfillmentLineItemId: string;
  quantity: number;
  reason: ReturnReasonKey;
}

export type ReturnRequestResult =
  | {ok: true; returnName: string}
  | {ok: false; error: string};

/**
 * Re-verifies the order (never trusts item IDs/quantities from the browser),
 * then files a Shopify return request in REQUESTED status — it shows up in
 * Shopify Admin → Orders → (order) for the merchant to approve or decline.
 */
export async function submitReturnRequest(
  env: Env,
  orderNumber: string,
  email: string,
  lines: ReturnRequestLine[],
  note: string,
): Promise<ReturnRequestResult> {
  const order = await getReturnableOrder(env, orderNumber, email);
  if (!order) {
    return {ok: false, error: "We couldn't find an order matching that number and email."};
  }

  const byId = new Map(order.items.map((item) => [item.fulfillmentLineItemId, item]));
  const valid = lines.filter((line) => {
    const item = byId.get(line.fulfillmentLineItemId);
    return item && !item.ineligibleReason && line.quantity >= 1 && line.quantity <= item.quantity;
  });
  if (valid.length === 0 || valid.length !== lines.length) {
    return {ok: false, error: 'Some of the selected items can no longer be returned. Please refresh and try again.'};
  }

  const reasonIds = await resolveReturnReasonIds(env);
  const trimmedNote = note.trim();

  const returnLineItems = valid.map((line) => {
    const reason = RETURN_REASONS.find((r) => r.key === line.reason) ?? RETURN_REASONS[RETURN_REASONS.length - 1];
    const definitionId = reasonIds.get(reason.key);
    // customerNote is capped at 300 characters by Shopify.
    const customerNote = [reason.label, trimmedNote].filter(Boolean).join(' — ').slice(0, 300);
    return {
      fulfillmentLineItemId: line.fulfillmentLineItemId,
      quantity: line.quantity,
      customerNote,
      ...(definitionId ? {returnReasonDefinitionId: definitionId} : {returnReason: reason.fallback}),
    };
  });

  const result = await adminGraphQL<{
    returnRequest: {
      return: {name: string} | null;
      userErrors: UserError[];
    };
  }>(
    env,
    `
      mutation RequestReturn($input: ReturnRequestInput!) {
        returnRequest(input: $input) {
          return { name }
          userErrors { field message }
        }
      }
    `,
    {input: {orderId: order.orderId, returnLineItems}},
  );

  const {userErrors} = result.returnRequest;
  if (userErrors.length || !result.returnRequest.return) {
    console.error('returnRequest userErrors:', userErrors);
    return {ok: false, error: "We couldn't submit this return. Please contact us and we'll sort it out."};
  }
  return {ok: true, returnName: result.returnRequest.return.name};
}
