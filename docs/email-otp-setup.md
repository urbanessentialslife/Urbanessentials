# Email one-time-code login — Shopify Admin setup

The code itself is generated and verified entirely in code (see
`app/lib/otp.server.ts`), on top of the site's existing classic (password)
customer accounts — logging in with a code produces the exact same session
as logging in with a password, so every account page keeps working no
matter which way someone signed in.

The one thing code alone can't do is **send** the code to the customer's
inbox — neither the Admin API nor the Storefront API has a "send this
email" primitive. Instead, the code is written to a customer metafield, and
a Shopify Flow (free, built into every plan) sends the actual email. One
one-time setup step is required before login-by-code actually delivers
anything.

## 1. Create the metafield definition (recommended, not strictly required)

Go to **Shopify Admin → Settings → Custom data → Customers → Add definition**:

| Key | Type |
|---|---|
| `login_otp_code` | Single line text |

Namespace: `custom`. The app writes this value without needing the
definition to exist first, but creating it makes the field show up in
Flow's variable picker in the next step instead of needing to type the
reference by hand.

## 2. Create the Shopify Flow

**Shopify Admin → Settings → Apps and sales channels → Shopify Flow → Create workflow**

- **Trigger**: "Customer metafield value changed" (or "Customer updated",
  filtered to this metafield if your Flow version doesn't have the more
  specific trigger) — namespace `custom`, key `login_otp_code`.
- **Action**: "Send email"
  - To: `{{customer.email}}`
  - Subject: something like `Your UrbanEssentials sign-in code`
  - Body: include `{{customer.metafields.custom.login_otp_code.value}}` —
    this is the 6-digit code. Mention it expires in 10 minutes.
- **Activate** the workflow.

That's it — every time the storefront requests a code (login page's "Email
Code" tab, or the optional "Sign in with an email code" prompt in the cart
drawer before checkout), this Flow fires and the customer gets the code by
email within a few seconds.

## Also required: the Admin API token

Like guest order tracking and back-in-stock requests, this reuses
`SHOPIFY_ADMIN_API_TOKEN` (see `.env` and `app/lib/admin.server.ts`) — make
sure the custom app behind that token has the `write_customers` scope, and
additionally the ability to write customer metafields (included under
`write_customers` by default).

## How it actually logs someone in

Shopify's classic Storefront API has no passwordless login mutation, so
after a correct code is verified, the app:
1. Generates a random throwaway password via the Admin API
   (`customerUpdate`) — this **replaces** whatever password (if any) the
   customer had set.
2. Immediately signs in with that throwaway password through the normal
   `customerAccessTokenCreate` flow, producing a real classic session.

Practical effect: a customer who has both a real password and sometimes
uses "Email Code" will find their old password stopped working the next
time they try it — they'd need "Forgot password?" or just use the code
again. This is an accepted trade-off of building passwordless login without
a dedicated OTP/session store, not a bug.
