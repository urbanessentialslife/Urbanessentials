import { useState } from 'react';
import { useFetcher } from 'react-router';

interface NotifyWhenAvailableProps {
  productLabel: string;
}

/** Small "notify me" email capture shown in place of Add to Cart when the
 * selected variant is out of stock. Saves the request server-side (see
 * api.notify-restock.tsx) — there's no automatic restock email behind this,
 * just a record the merchant can act on (see admin.server.ts). */
export function NotifyWhenAvailable({ productLabel }: NotifyWhenAvailableProps) {
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const [email, setEmail] = useState('');
  const isSubmitting = fetcher.state !== 'idle';
  const submitted = fetcher.data?.ok;
  const error = fetcher.data?.error;

  if (submitted) {
    return (
      <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs uppercase tracking-widest font-semibold text-center">
        We&apos;ll email you when it&apos;s back
      </div>
    );
  }

  return (
    <fetcher.Form method="post" action="/api/notify-restock" className="flex flex-col gap-2">
      <input type="hidden" name="productLabel" value={productLabel} />
      <div className="flex items-stretch gap-2">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email for a restock alert"
          className="flex-1 min-w-0 text-sm bg-white border border-[#c9c2b8] rounded-xl px-3.5 py-3 text-[#241a16] placeholder-[#a69686] focus:outline-none focus:border-[#241a16] transition"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 px-5 py-3 rounded-xl bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Notify Me'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </fetcher.Form>
  );
}
