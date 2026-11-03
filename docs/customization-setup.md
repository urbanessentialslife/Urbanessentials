# Product customization — Shopify Admin setup

This feature (name personalization, a surcharge, and extra shipping lead
time) is driven entirely by Shopify Admin — no code changes needed to turn
it on for a product or change its price/lead time. Two one-time setup steps
are required before it works at all.

## 1. Create the three metafield definitions

Go to **Shopify Admin → Settings → Custom data → Products → Add definition**,
and create these three, all in the namespace `custom` (Shopify's UI calls
this step "Namespace and key" — enter `custom` and the key below):

| Key | Type | Notes |
|---|---|---|
| `enable_customization` | Boolean | The on/off switch — this is the "radio"/toggle per product. |
| `customization_fee` | Decimal number | The surcharge, in your store's currency, e.g. `199.00`. |
| `customization_shipping_days` | Integer | Extra shipping lead time in days, e.g. `3`. |

**Important**: for each definition, turn on **"Storefront API"** access
(there's a checkbox for this when creating/editing the definition) — the
storefront can't read a metafield that isn't marked visible to it.

Once these three definitions exist, every product's edit page in Admin gets
a "Custom data" section with these three fields — that's the actual "radio
button" control per product.

## 2. Create the "Customization Fee" product

The storefront can't just make up a price — Shopify orders need a real
product/variant to charge a real amount. Create one product to represent
this fee, handle **must** be `customization-fee`:

1. **Products → Add product**
2. Title: "Customization Fee" (anything you like — only the handle matters)
3. Set the handle explicitly to `customization-fee` (edit it under the title
   field, or via the URL/SEO section)
4. Add one variant **for every distinct fee amount you plan to charge**
   across your catalog — e.g. variants priced ₹49, ₹99, ₹149, ₹199, ₹299.
   You can add more anytime; no code change needed.
5. **Hide this product from your storefront's own listings** (uncheck the
   Online Store sales channel for it, or set it to Draft — it's only ever
   added to a cart programmatically, never meant to be browsed/bought
   directly)

The storefront matches each product's `customization_fee` metafield to the
**closest-priced variant** on this product. If you set a fee that doesn't
exactly match an existing variant, it'll silently use the nearest one — add
a matching variant if you want an exact new price point.

## 3. Turn it on for a product

On any product's edit page, under **Custom data**:
- Toggle `enable_customization` on
- Set `customization_fee` to the surcharge amount
- Set `customization_shipping_days` to the extra lead time (optional, 0 if none)

That's it — the storefront picks it up automatically:
- The product page and quick-view show a "Personalize with a name" field
- Adding it to cart adds two line items: the product itself (with the name
  attached as an order attribute, visible in checkout/Admin/order emails)
  and a "Customization Fee" line for the surcharge
- Cart totals, checkout, and the order reflect the real charge
- Shipping lead-time messaging shows on the product page and in cart
