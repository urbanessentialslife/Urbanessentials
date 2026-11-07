import {useState} from 'react';
import {buildMeta} from '~/lib/seo';
import {data, useFetcher} from 'react-router';
import type {Route} from './+types/track-order';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';
import {lookupOrderStatus, type OrderStatusResult} from '~/lib/admin.server';

export const meta: Route.MetaFunction = ({matches, location}) => {
  return buildMeta({
    matches,
    location,
    title: 'Track Your Order',
    description:
      'Track your Urban Essentials order status with your order number and email address.',
  });
};

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const orderNumber = String(formData.get('orderNumber') || '').trim();
  const email = String(formData.get('email') || '').trim();

  if (!orderNumber || !email || !email.includes('@')) {
    return data({error: 'Please enter both your order number and the email used at checkout.'}, {status: 400});
  }

  try {
    const order = await lookupOrderStatus(context.env, orderNumber, email);
    if (!order) {
      return data(
        {error: "We couldn't find an order matching that number and email. Double-check both and try again."},
        {status: 404},
      );
    }
    return data({order});
  } catch (error) {
    // Log the real cause server-side only — it can include internal setup
    // details (e.g. a missing Admin API token) that shouldn't reach the
    // visitor's browser.
    console.error('Order status lookup failed:', error);
    return data(
      {error: 'Order tracking is temporarily unavailable. Please try again shortly.'},
      {status: 500},
    );
  }
}

const STATUS_LABELS: Record<string, string> = {
  FULFILLED: 'Shipped',
  UNFULFILLED: 'Preparing Your Order',
  PARTIALLY_FULFILLED: 'Partially Shipped',
  PAID: 'Payment Confirmed',
  PENDING: 'Payment Pending',
  REFUNDED: 'Refunded',
};

function friendlyStatus(status: string | null): string {
  if (!status) return 'Processing';
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export default function TrackOrder() {
  const fetcher = useFetcher<{order?: OrderStatusResult; error?: string}>();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');

  const isLoading = fetcher.state !== 'idle';
  const order = fetcher.data && 'order' in fetcher.data ? fetcher.data.order : undefined;
  const error = fetcher.data && 'error' in fetcher.data ? fetcher.data.error : undefined;

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-xl mx-auto">
        <Breadcrumb items={[{label: 'Home', to: '/'}, {label: 'Track Your Order'}]} className="mb-6" />
        <div className="mb-8">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            Support
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">
            Track Your Order
          </h1>
          <p className="text-sm text-[#6d6560] mt-3 leading-relaxed">
            Enter your order number and the email you used at checkout. You&apos;ll find the order
            number in your confirmation email.
          </p>
        </div>

        <fetcher.Form method="post" className="space-y-4 bg-white border border-[#c9c2b8] rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="track-order-number" className="text-xs uppercase tracking-widest text-[#6d6560]">
                Order Number
              </label>
              <input
                id="track-order-number"
                name="orderNumber"
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="#1023"
                className="w-full text-sm bg-[#f4f0e8] border border-[#c9c2b8] rounded-lg px-3 py-2.5 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="track-order-email" className="text-xs uppercase tracking-widest text-[#6d6560]">
                Email Used at Checkout
              </label>
              <input
                id="track-order-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-sm bg-[#f4f0e8] border border-[#c9c2b8] rounded-lg px-3 py-2.5 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] font-medium text-xs uppercase tracking-widest transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Looking Up Your Order…' : 'Track Order'}
          </button>
        </fetcher.Form>

        {error && (
          <p className="mt-4 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {order && (
          <div className="mt-6 bg-white border border-[#c9c2b8] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-light text-[#241a16]">Order {order.name}</h2>
              <span className="px-3 py-1 rounded-full bg-[#f4f0e8] text-[11px] uppercase tracking-wider font-semibold text-[#241a16]">
                {friendlyStatus(order.fulfillmentStatus)}
              </span>
            </div>

            <div className="text-xs text-[#6d6560] space-y-1">
              <div className="flex justify-between">
                <span>Placed</span>
                <span className="text-[#241a16] font-medium">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className="text-[#241a16] font-medium">{friendlyStatus(order.financialStatus)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-[#241a16] font-serif font-semibold">
                  {new Intl.NumberFormat(order.currencyCode === 'INR' ? 'en-IN' : 'en-US', {style: 'currency', currency: order.currencyCode}).format(Number(order.totalPrice))}
                </span>
              </div>
            </div>

            {order.lineItems.length > 0 && (
              <div className="pt-4 border-t border-[#c9c2b8] space-y-1.5">
                {order.lineItems.map((li, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-[#241a16]">{li.title}</span>
                    <span className="text-[#6d6560] font-serif font-semibold">× {li.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {order.tracking.length > 0 && (
              <div className="pt-4 border-t border-[#c9c2b8] space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#6d6560]">Tracking</span>
                {order.tracking.map((t, idx) => (
                  <div key={idx} className="text-xs text-[#241a16]">
                    {t.company ? `${t.company} — ` : ''}
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noreferrer" className="underline hover:text-[#b89b6a]">
                        {t.number ?? 'View tracking'}
                      </a>
                    ) : (
                      t.number ?? 'Tracking number pending'
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
