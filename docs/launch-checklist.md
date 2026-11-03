# Launch checklist

Everything the code can't do on its own. Work top to bottom; items marked
**blocker** break something customer-facing if skipped.

## 1. Environment variables (Oxygen / Vercel project settings)

| Variable | Needed for | Notes |
|---|---|---|
| `SESSION_SECRET` | **blocker** — sessions, login, country choice | Long random string. |
| `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `PUBLIC_STOREFRONT_ID`, `PUBLIC_CHECKOUT_DOMAIN` | **blocker** — catalog, cart, checkout, analytics | Set automatically on Oxygen; copy them by hand on Vercel. |
| `SHOPIFY_ADMIN_API_TOKEN` | **blocker** — newsletter, back-in-stock, order tracking, **returns**, email sign-in codes | Custom app scopes: `write_customers`, `read_orders`, `read_returns`, `write_returns`. Re-install the app after adding scopes. |
| `PUBLIC_SUPPORT_EMAIL` | Help widget, FAQ, returns page contact link | |
| `PUBLIC_WHATSAPP_NUMBER` | Help widget "Chat on WhatsApp" | Digits with country code, e.g. `919876543210`. |
| `PUBLIC_GA4_MEASUREMENT_ID` | Google Analytics 4 | `G-XXXXXXX`. Leave blank to disable. |
| `PUBLIC_META_PIXEL_ID` | Meta (Facebook/Instagram) Pixel | Leave blank to disable. |
| `PUBLIC_INSTAGRAM_URL`, `PUBLIC_PINTEREST_URL`, `PUBLIC_LINKEDIN_URL` | Footer social links | Each hidden when blank. |

## 2. Product videos are in Git LFS — **blocker if your host doesn't fetch LFS**

`public/videos/products/*.mp4` are Git LFS files. If the deploy checks the
repo out without LFS, the site serves 132-byte pointer files and the videos
won't play.

- **Vercel:** Project → Settings → Git → enable **Git LFS**, then redeploy.
- **Oxygen via GitHub Actions:** in the generated
  `.github/workflows/oxygen-deployment-*.yml`, set `lfs: true` on the
  `actions/checkout` step.
- **`shopify hydrogen deploy` from your machine:** run `git lfs pull` first.

## 3. Returns

Customers request returns at `/returns` (or from **Account → Order → Request
a return**). Each request appears in **Shopify Admin → Orders → (order)** as a
*Return requested*. Approve or decline it there; Shopify emails the customer.

- Scopes: `read_returns` + `write_returns` on the Admin API token (above).
- The return window is `RETURN_WINDOW_DAYS` (7) in `app/lib/admin.server.ts`.
  Keep it in sync with the Refund Policy and FAQ copy.
- Personalised items are flagged to the customer as "only if damaged or
  defective". The final call is yours when you approve.

## 4. Policies (pending)

Paste the final Terms of Service, Privacy Policy and Refund Policy into
**Settings → Policies**. The pages at `/policies/...` pick them up
automatically.

## 5. Selling internationally (optional)

The storefront supports multiple countries now, but it stays India/INR-only
until you enable more countries in Shopify:

1. **Settings → Markets → Add market** (e.g. "International", or one per
   region). Add countries and pick the currency (local or INR).
2. **Shipping and delivery:** add a shipping zone + rates for those countries.
   Without one, checkout can't ship there.
3. **Payments:** confirm your payment provider accepts the foreign currencies
   or cards.
4. **Duties & taxes:** decide whether prices include duties (Markets →
   the market → Duties and import taxes).
5. **Customer privacy:** Settings → Customer privacy → turn on the cookie
   banner for regions that need consent (EU/UK). The storefront already
   renders Shopify's banner where it's required.
6. Optional: **Settings → Languages** for translations (the storefront is
   English-only today).

Once a second country is active, a **country / currency selector** appears
in the footer. Prices, the saved cart and checkout follow the visitor's
choice. Nothing else needs a deploy.

## 6. Analytics

- **Shopify Analytics** (built in): page, product, collection and search
  views are already sent. Purchases are tracked by Shopify's checkout.
- **GA4 / Meta Pixel on the storefront:** set the env vars above. Page views,
  product views, searches, add-to-cart and begin-checkout are sent, but only
  after the visitor's consent allows it.
- **Purchases in GA4 / Meta:** install Shopify's *Google & YouTube* and
  *Facebook & Instagram* apps (or add a custom pixel under **Settings →
  Customer events**). Checkout runs on Shopify, so the storefront can't see
  purchases.

## 7. Imagery

- **Collection photos:** upload an image on each collection (Products →
  Collections). It replaces the stand-in tile in the mega-menu and on
  `/collections`. Stand-ins are listed in `app/lib/navMenus.ts`
  (`CATEGORY_TILE_IMAGES`); *Kids Tiffin* and *Kids Name Plates* have none
  yet.
- **3D models:** see `docs/variant-3d-models.md`. Upload each variant's
  `.glb` to its `custom.model_glb` metafield; no deploy needed. Optimise to
  under ~2 MB first.

## 8. Other one-time Admin setup

- `docs/customization-setup.md`: "Customization Fee" product (personalisation surcharge).
- `docs/email-otp-setup.md`: Shopify Flow that emails sign-in codes.
- **Online Store → Navigation → main-menu:** nested items drive the header mega-menu.
