import {useEffect} from 'react';
import {buildMeta} from '~/lib/seo';
import {Link, data, useLoaderData, type HeadersFunction} from 'react-router';
import type {Route} from './+types/cart';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {Breadcrumb} from '~/components/visual/Common/Breadcrumb';
import {useShowcaseCart} from '~/context/ShowcaseCartContext';

export const meta: Route.MetaFunction = ({matches, location}) => {
  return buildMeta({
    matches,
    location,
    title: 'Your Gifting Box',
    noindex: true,
  });
};

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result: CartQueryDataReturn;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    case CartForm.ACTIONS.NoteUpdate:
      result = await cart.updateNote(inputs.note as string);
      break;
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart} = context;
  return await cart.get();
}

export default function Cart() {
  const cartData = useLoaderData<typeof loader>();
  const {openDrawer, items, totalQuantity} = useShowcaseCart();

  // Automatically open the bespoke cart drawer when landing on /cart
  useEffect(() => {
    openDrawer();
  }, [openDrawer]);

  return (
    <div className="urbanessentials-showcase min-h-[75vh] bg-white flex flex-col items-center justify-center text-center px-6 pt-28 pb-16 font-sans">
      <Breadcrumb items={[{label: 'Home', to: '/'}, {label: 'Gifting Box'}]} className="mb-6" />
      <span className="text-[11px] uppercase tracking-[0.3em] text-[#6d6560] font-semibold">
        Your Gifting Box
      </span>
      <h1 className="text-3xl md:text-5xl font-serif font-light text-[#241a16] mt-3 mb-4">
        {totalQuantity > 0 ? `${totalQuantity} item${totalQuantity > 1 ? 's' : ''} in your box` : 'Your Gifting Box is ready'}
      </h1>
      <p className="text-sm text-[#6d6560] max-w-md mb-8">
        Review your bespoke pieces, personalize with custom engraving or a handwritten wax-sealed note, and check out securely with Fastrr.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={openDrawer}
          className="px-8 py-3.5 rounded-full bg-[#241a16] hover:bg-[#3a2c24] text-[#f4f0e8] text-xs uppercase tracking-widest font-medium transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>Open Gifting Box Drawer</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
        <Link
          to="/collections/all"
          className="px-8 py-3.5 rounded-full border border-[#241a16] hover:bg-[#241a16]/5 text-[#241a16] text-xs uppercase tracking-widest font-medium transition-all duration-200"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
