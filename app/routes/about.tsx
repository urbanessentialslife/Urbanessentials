import type {Route} from './+types/about';
import {buildMeta} from '~/lib/seo';
import {Link} from 'react-router';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';

export const meta: Route.MetaFunction = ({matches, location}) => {
  return buildMeta({
    matches,
    location,
    title: 'About Us – Our Story',
    description:
      'Urban Essentials curates premium tumblers, water bottles, mugs, home décor and gift sets for everyday rituals — designed to be used daily and gifted with pride. Shipping across India.',
  });
};

const VALUES = [
  {
    title: 'Engineered for Daily Ritual',
    description:
      'Double-wall vacuum insulation, locking lids, and sculpted grips — every piece is built to earn a permanent place on your desk or counter, not just a shelf.',
  },
  {
    title: 'Gifted as Ceremony',
    description:
      'Every order arrives in a rigid matte box with gold-foil stamping and a hand wax-sealed note — because how a gift is opened matters as much as what is inside.',
  },
  {
    title: 'A Small, Curated Catalog',
    description:
      'We would rather perfect a handful of objects than chase a thousand SKUs. Every finish and every product is chosen with intent.',
  },
];

export default function About() {
  return (
    <div className="urbanessentials-showcase bg-[#f4f0e8] min-h-screen pt-28 pb-24 px-6 md:px-12 font-sans text-[#241a16]">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'About' }]} className="max-w-3xl mx-auto mb-6" />
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
          Our Story
        </span>
        <h1 className="text-3xl md:text-5xl font-serif font-light text-[#241a16] mt-3 mb-6">
          Refined Living & Gifting
        </h1>
        <p className="text-sm md:text-base text-[#6d6560] leading-relaxed max-w-xl mx-auto">
          UrbanEssentials makes sculptural, everyday objects — tumblers, flasks, and curated
          gift ensembles — engineered with architectural precision and presented in keepsake
          unboxing rituals. Thoughtful gifts. Made memorable.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {VALUES.map((value) => (
          <div
            key={value.title}
            className="p-6 rounded-2xl bg-white border border-[#c9c2b8] shadow-sm"
          >
            <h3 className="text-base font-serif text-[#241a16] mb-2">{value.title}</h3>
            <p className="text-sm text-[#6d6560] leading-relaxed">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <Link
          to="/collections/all"
          className="inline-block px-8 py-3 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200"
        >
          Explore the Collection
        </Link>
      </div>
    </div>
  );
}
