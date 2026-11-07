import type {Route} from './+types/faq';
import {buildMeta} from '~/lib/seo';
import {Link} from 'react-router';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';

export const meta: Route.MetaFunction = ({matches, location}) => {
  return buildMeta({
    matches,
    location,
    title: 'FAQ – Shipping, Returns, Customization & Care',
    description:
      'Answers on shipping across India, free delivery, 7-day returns, personalization, product care and payments for Urban Essentials orders.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_SECTIONS.flatMap((section) =>
          section.items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {'@type': 'Answer', text: item.answer},
          })),
        ),
      },
    ],
  });
};

interface FaqSection {
  heading: string;
  items: {question: string; answer: string}[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    heading: 'Shipping',
    items: [
      {
        question: 'Where do you ship, and how long does delivery take?',
        answer:
          'We currently ship across India only. Most orders dispatch within 24 hours and arrive in 3–6 business days depending on your pincode. Customized pieces add their stated engraving time on top of that.',
      },
      {
        question: 'Is delivery really free?',
        answer:
          'Yes — white-glove courier delivery is complimentary on every order, no minimum spend required.',
      },
      {
        question: 'Can I track my order?',
        answer:
          'Every order ships with tracking shared to your email. You can also look it up anytime on our Track Your Order page using your order number and the email you checked out with.',
      },
    ],
  },
  {
    heading: 'Returns & Exchanges',
    items: [
      {
        question: "What's your return policy?",
        answer:
          'Unused items in original packaging can be returned within 7 days of delivery for a refund or exchange. Customized/engraved pieces are made to order and are final sale unless they arrive damaged or defective. Full details are on our Refund Policy page.',
      },
      {
        question: 'How do I start a return or exchange?',
        answer:
          'Use the Returns & Exchanges page to send us your order number, the item, and the reason — we\'ll get back to you with the next steps.',
      },
    ],
  },
  {
    heading: 'Customization',
    items: [
      {
        question: 'Which products can be customized?',
        answer:
          'Any product showing a "Customize with a name" field on its page supports engraving. The exact surcharge and extra dispatch time are shown there before you add it to your box.',
      },
      {
        question: 'Can I change a name after ordering?',
        answer:
          'Customization is engraved shortly after your order is placed, so changes can only be made if you contact us within a few hours of checkout — reach out as soon as possible if you need a correction.',
      },
    ],
  },
  {
    heading: 'Care',
    items: [
      {
        question: 'How do I care for stainless steel tumblers and flasks?',
        answer:
          'Hand wash with warm water and a mild detergent; avoid dishwashers, abrasive scrubbers, and bleach, which can dull the matte ceramic coat and enamel artwork over time.',
      },
      {
        question: 'Are the glass pieces dishwasher safe?',
        answer:
          'We recommend hand-washing borosilicate glass pieces to protect any gold-accented lids and keep the silicone collar seated correctly.',
      },
    ],
  },
  {
    heading: 'Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'Visa, Mastercard, RuPay, UPI, and net banking — all processed securely through Shopify\'s hosted checkout. We never see or store your card details.',
      },
      {
        question: 'Do I need an account to check out?',
        answer:
          'No — guest checkout is fully supported. Creating an account just lets you track past orders and save addresses for next time.',
      },
    ],
  },
];

export default function Faq() {
  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[{label: 'Home', to: '/'}, {label: 'FAQ'}]} className="mb-6" />
        <div className="mb-10">
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
            Support
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-[#241a16] mt-3">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[#6d6560] mt-3 max-w-xl">
            Can&apos;t find what you&apos;re looking for? Reach out from our{' '}
            <Link to="/returns" className="underline hover:text-[#241a16] transition-colors">
              Returns &amp; Exchanges
            </Link>{' '}
            page, or start a return there directly.
          </p>
        </div>

        <div className="space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="text-xs uppercase tracking-[0.25em] text-[#b89b6a] font-semibold mb-3">
                {section.heading}
              </h2>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-xl bg-white border border-[#c9c2b8] open:border-[#b89b6a] transition-colors"
                  >
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-4 py-3.5 text-sm font-medium text-[#241a16]">
                      <span>{item.question}</span>
                      <svg
                        className="w-4 h-4 shrink-0 text-[#a69686] transition-transform group-open:rotate-45"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-sm text-[#6d6560] leading-relaxed">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
