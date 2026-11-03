import {useRef, useState} from 'react';
import {data, Link, useFetcher, useLoaderData} from 'react-router';
import type {Route} from './+types/returns';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';
import {Select} from '~/components/visual/Common/Select';
import {
  RETURN_REASONS,
  RETURN_WINDOW_DAYS,
  getReturnableOrder,
  submitReturnRequest,
  type ReturnableOrder,
  type ReturnReasonKey,
  type ReturnRequestLine,
} from '~/lib/admin.server';
import {getCustomerAccessToken} from '~/lib/customerAuth.server';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Returns & Exchanges | UrbanEssentials'},
    {
      name: 'description',
      content: 'Start a return or exchange request for your UrbanEssentials order.',
    },
  ];
};

const CUSTOMER_EMAIL_QUERY = `#graphql
  query ReturnsCustomerEmail($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      email
    }
  }
` as const;

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('order') ?? '';

  // Signed-in customers arriving from their order page get their email
  // prefilled; guests just type it.
  let email = '';
  const token = getCustomerAccessToken(context.session);
  if (token) {
    const result = await context.storefront
      .query(CUSTOMER_EMAIL_QUERY, {variables: {customerAccessToken: token}, cache: context.storefront.CacheNone()})
      .catch(() => null);
    email = result?.customer?.email ?? '';
  }

  return {
    orderNumber,
    email,
    windowDays: RETURN_WINDOW_DAYS,
    reasons: RETURN_REASONS.map(({key, label}) => ({value: key as string, label})),
    supportEmail: context.env.PUBLIC_SUPPORT_EMAIL ?? null,
  };
}

type ActionResult =
  | {step: 'select'; order: Omit<ReturnableOrder, 'orderId'>}
  | {step: 'done'; returnName: string; orderName: string}
  | {error: string};

const REASON_KEYS = new Set<string>(RETURN_REASONS.map((r) => r.key));

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || 'lookup');
  const orderNumber = String(formData.get('orderNumber') || '').trim();
  const email = String(formData.get('email') || '').trim();

  if (!orderNumber || !email.includes('@')) {
    return data<ActionResult>(
      {error: 'Please enter both your order number and the email used at checkout.'},
      {status: 400},
    );
  }

  try {
    if (intent === 'submit') {
      const lines: ReturnRequestLine[] = [];
      for (const id of formData.getAll('item').map(String)) {
        const quantity = parseInt(String(formData.get(`qty:${id}`) || '0'), 10);
        const reason = String(formData.get(`reason:${id}`) || 'other');
        if (!Number.isFinite(quantity) || quantity < 1) continue;
        lines.push({
          fulfillmentLineItemId: id,
          quantity,
          reason: (REASON_KEYS.has(reason) ? reason : 'other') as ReturnReasonKey,
        });
      }
      if (lines.length === 0) {
        return data<ActionResult>({error: 'Select at least one item to return.'}, {status: 400});
      }

      const note = String(formData.get('note') || '').slice(0, 250);
      const result = await submitReturnRequest(context.env, orderNumber, email, lines, note);
      if (!result.ok) return data<ActionResult>({error: result.error}, {status: 400});
      return data<ActionResult>({step: 'done', returnName: result.returnName, orderName: orderNumber});
    }

    const order = await getReturnableOrder(context.env, orderNumber, email);
    if (!order) {
      return data<ActionResult>(
        {error: "We couldn't find an order matching that number and email. Double-check both and try again."},
        {status: 404},
      );
    }
    // The Admin order GID never needs to reach the browser — submit re-looks
    // the order up from number + email.
    const {orderId: _orderId, ...publicOrder} = order;
    return data<ActionResult>({step: 'select', order: publicOrder});
  } catch (error) {
    // Real cause stays server-side: it can include internal setup details
    // (e.g. a missing Admin API token or scope).
    console.error('Returns flow failed:', error);
    return data<ActionResult>(
      {error: 'Returns are temporarily unavailable. Please try again shortly or contact us.'},
      {status: 500},
    );
  }
}

const inputClass =
  'w-full text-sm bg-[#f4f0e8] border border-[#c9c2b8] rounded-lg px-3 py-2.5 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition';
const primaryButtonClass =
  'inline-flex w-full items-center justify-center py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest font-medium transition-all duration-300 shadow-sm bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] cursor-pointer disabled:bg-[#c9c2b8] disabled:text-[#6d6560] disabled:cursor-not-allowed';

const RETURN_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Awaiting review',
  OPEN: 'Approved',
  CLOSED: 'Completed',
  DECLINED: 'Declined',
  CANCELED: 'Cancelled',
};

export default function Returns() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionResult>();
  const [orderNumber, setOrderNumber] = useState(loaderData.orderNumber);
  const [email, setEmail] = useState(loaderData.email);
  // "Different order" hides the current lookup result without a round trip.
  const [dismissed, setDismissed] = useState<ActionResult | null>(null);
  const lastIntent = useRef<'lookup' | 'submit'>('lookup');

  const isBusy = fetcher.state !== 'idle';
  const result = fetcher.data && fetcher.data !== dismissed ? fetcher.data : undefined;
  const error = result && 'error' in result ? result.error : null;
  // Keep the item list on screen when a submit fails, so the customer's
  // selection survives and the error shows next to it.
  const lastOrder = useRef<Omit<ReturnableOrder, 'orderId'> | null>(null);
  const selectResult = result && 'step' in result && result.step === 'select' ? result.order : null;
  if (selectResult) lastOrder.current = selectResult;
  const submitFailed = !!error && fetcher.formData === undefined && lastOrder.current !== null && lastIntent.current === 'submit';
  const order = selectResult ?? (submitFailed ? lastOrder.current : null);
  const done = result && 'step' in result && result.step === 'done' ? result : null;

  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-xl mx-auto">
        <Breadcrumb items={[{label: 'Home', to: '/'}, {label: 'Returns & Exchanges'}]} className="mb-6" />
        <div className="mb-8">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            Support
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">
            Returns &amp; Exchanges
          </h1>
          <p className="text-sm text-[#6d6560] mt-3 leading-relaxed">
            Unused items in original packaging can be returned within {loaderData.windowDays} days of
            delivery. Personalised pieces are final sale unless they arrive damaged or defective. See
            our{' '}
            <a href="/policies/refund-policy" className="underline hover:text-[#241a16] transition-colors">
              Refund Policy
            </a>{' '}
            for the full terms.
          </p>
        </div>

        {done ? (
          <div className="bg-white border border-[#c9c2b8] rounded-2xl p-6 space-y-3" role="status">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#b89b6a] font-semibold">Request received</p>
            <h2 className="text-xl font-serif text-[#241a16]">Return {done.returnName} submitted</h2>
            <p className="text-sm text-[#6d6560] leading-relaxed">
              We&apos;ll review your request for order {done.orderName} and email you within 1–2 business
              days with next steps, including how to send the items back. Please keep them unused and in
              their original packaging until then.
            </p>
            <Link
              to="/"
              className="inline-block mt-2 text-xs uppercase tracking-widest underline hover:text-[#b89b6a] transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        ) : order ? (
          <ItemSelection
            order={order}
            orderNumber={orderNumber}
            email={email}
            reasons={loaderData.reasons}
            fetcher={fetcher}
            isBusy={isBusy}
            error={error}
            onSubmit={() => (lastIntent.current = 'submit')}
            onBack={() => {
              lastOrder.current = null;
              setDismissed(fetcher.data ?? null);
            }}
          />
        ) : (
          <fetcher.Form
            method="post"
            onSubmit={() => (lastIntent.current = 'lookup')}
            className="space-y-4 bg-white border border-[#c9c2b8] rounded-2xl p-6"
          >
            <input type="hidden" name="intent" value="lookup" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="return-order" className="text-xs uppercase tracking-widest text-[#6d6560]">
                  Order Number
                </label>
                <input
                  id="return-order"
                  name="orderNumber"
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="#1023"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="return-email" className="text-xs uppercase tracking-widest text-[#6d6560]">
                  Email Used at Checkout
                </label>
                <input
                  id="return-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={isBusy} className={primaryButtonClass}>
              {isBusy ? 'Finding your order…' : 'Find My Order'}
            </button>
            {loaderData.supportEmail && (
              <p className="text-[11px] text-center text-[#a69686]">
                Need help instead?{' '}
                <a href={`mailto:${loaderData.supportEmail}`} className="underline hover:text-[#241a16]">
                  Email our support team
                </a>
                .
              </p>
            )}
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}

function ItemSelection({
  order,
  orderNumber,
  email,
  reasons,
  fetcher,
  isBusy,
  error,
  onSubmit,
  onBack,
}: {
  order: Omit<ReturnableOrder, 'orderId'>;
  orderNumber: string;
  email: string;
  reasons: {value: string; label: string}[];
  fetcher: ReturnType<typeof useFetcher<ActionResult>>;
  isBusy: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, {qty: number; reason: string}>>({});
  const eligible = order.items.filter((item) => !item.ineligibleReason);
  const selectedCount = Object.keys(selected).length;

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = {...prev};
      if (on) next[id] = {qty: 1, reason: reasons[0]?.value ?? 'other'};
      else delete next[id];
      return next;
    });

  return (
    <fetcher.Form method="post" onSubmit={onSubmit} className="space-y-5 bg-white border border-[#c9c2b8] rounded-2xl p-6">
      <input type="hidden" name="intent" value="submit" />
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <input type="hidden" name="email" value={email} />

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-serif text-[#241a16]">Order {order.name}</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] uppercase tracking-widest text-[#6d6560] underline hover:text-[#241a16] cursor-pointer"
        >
          Different order
        </button>
      </div>

      {order.existingReturns.length > 0 && (
        <ul className="text-xs text-[#6d6560] space-y-1">
          {order.existingReturns.map((r) => (
            <li key={r.name}>
              Return {r.name}: <span className="text-[#241a16]">{RETURN_STATUS_LABELS[r.status] ?? r.status}</span>
            </li>
          ))}
        </ul>
      )}

      {order.items.length === 0 ? (
        <p className="text-sm text-[#6d6560]">
          Nothing on this order has shipped yet. Once it&apos;s delivered you can start a return here —
          or contact us if you&apos;d like to change or cancel it.
        </p>
      ) : (
        <ul className="divide-y divide-[#e8e2d6] border-y border-[#e8e2d6]">
          {order.items.map((item) => {
            const id = item.fulfillmentLineItemId;
            const choice = selected[id];
            const disabled = !!item.ineligibleReason;
            return (
              <li key={id} className={`py-4 ${disabled ? 'opacity-60' : ''}`}>
                <label className={`flex items-start gap-3 ${disabled ? '' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    name="item"
                    value={id}
                    disabled={disabled}
                    checked={!!choice}
                    onChange={(e) => toggle(id, e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#241a16]"
                  />
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-lg border border-[#e8e2d6] object-cover"
                    />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-[#241a16]">{item.title}</span>
                    {item.variantTitle && (
                      <span className="block text-xs text-[#6d6560]">{item.variantTitle}</span>
                    )}
                    {item.personalized && !disabled && (
                      <span className="block text-xs text-[#b89b6a] mt-1">
                        Personalised — returnable only if damaged or defective.
                      </span>
                    )}
                    {item.ineligibleReason && (
                      <span className="block text-xs text-[#6d6560] mt-1">{item.ineligibleReason}</span>
                    )}
                  </span>
                </label>

                {choice && (
                  <div className="mt-3 ml-7 grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-3">
                    <div className="space-y-1">
                      <label htmlFor={`qty-${id}`} className="text-[11px] uppercase tracking-widest text-[#6d6560]">
                        Qty
                      </label>
                      <input
                        id={`qty-${id}`}
                        name={`qty:${id}`}
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={choice.qty}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [id]: {...choice, qty: Math.min(item.quantity, Math.max(1, Number(e.target.value) || 1))},
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[11px] uppercase tracking-widest text-[#6d6560]">Reason</span>
                      <Select
                        id={`reason-${id}`}
                        name={`reason:${id}`}
                        label="Reason"
                        variant="field"
                        align="left"
                        value={choice.reason}
                        onChange={(reason) => setSelected((prev) => ({...prev, [id]: {...choice, reason}}))}
                        options={reasons}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {eligible.length > 0 && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="return-note" className="text-xs uppercase tracking-widest text-[#6d6560]">
              Anything we should know? <span className="normal-case text-[#a69686]">(optional)</span>
            </label>
            <textarea
              id="return-note"
              name="note"
              maxLength={250}
              placeholder="e.g. the lid arrived cracked — happy to send photos."
              className={`${inputClass} rounded-xl h-24 resize-none`}
            />
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={isBusy || selectedCount === 0} className={primaryButtonClass}>
            {isBusy
              ? 'Submitting…'
              : selectedCount === 0
                ? 'Select items to return'
                : `Request Return (${selectedCount} item${selectedCount === 1 ? '' : 's'})`}
          </button>
          <p className="text-[11px] text-center text-[#a69686]">
            We review every request and email you return instructions once it&apos;s approved.
          </p>
        </>
      )}
    </fetcher.Form>
  );
}
