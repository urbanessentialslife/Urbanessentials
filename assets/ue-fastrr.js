/*
  Urban Essentials — Shiprocket Fastrr 1-Click Checkout (same flow as the old Hydrogen site)
  - "Buy it now" on product pages  -> Fastrr popup with that product
  - "Check out" in cart drawer/page -> Fastrr popup with the whole cart
  If Fastrr cannot load, it falls back to Shopify's normal checkout so no order is lost.
*/
(function () {
  var SELLER_DOMAIN = 'urban-essentials-jcqspwgr.myshopify.com';

  function ensureSellerDomain() {
    var el = document.getElementById('sellerDomain');
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.id = 'sellerDomain';
      document.body.appendChild(el);
    }
    el.value = SELLER_DOMAIN;
  }

  // Remove leftover Fastrr popups that could block a second checkout (same as old code)
  function cleanupStaleFastrr() {
    ['fastrr-main-container', 'fastrr-pre-loader', 'fastrr-prefetch-container'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    document.body.style.overflow = '';
  }

  function fastrrReady() {
    return !!(window.shiprocketCheckoutEvents && typeof window.shiprocketCheckoutEvents.buyDirect === 'function');
  }

  function waitForFastrr(maxMs) {
    return new Promise(function (resolve) {
      var waited = 0;
      (function poll() {
        if (fastrrReady()) return resolve(true);
        waited += 100;
        if (waited > maxMs) return resolve(false);
        setTimeout(poll, 100);
      })();
    });
  }

  function launchFastrr(params) {
    return waitForFastrr(4000).then(function (ok) {
      if (!ok) return false;
      try {
        cleanupStaleFastrr();
        ensureSellerDomain();
        params.fallbackUrl = params.fallbackUrl || window.location.href;
        window.shiprocketCheckoutEvents.buyDirect(params);
        return true;
      } catch (err) {
        console.warn('[Fastrr] buyDirect failed', err);
        return false;
      }
    });
  }

  function setBusy(button, busy) {
    if (!button) return;
    if (busy) {
      button.setAttribute('aria-busy', 'true');
      button.classList.add('loading');
    } else {
      button.removeAttribute('aria-busy');
      button.classList.remove('loading');
    }
  }

  // ---- Buy it now (product page) ----
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-ue-buy-now]');
    if (!button) return;
    event.preventDefault();
    if (button.getAttribute('aria-busy') === 'true') return;

    var formId = button.getAttribute('data-form');
    var form = document.getElementById(formId);
    var idInput = form && form.querySelector('[name="id"]');
    var addButton = form && form.querySelector('[name="add"]');
    if (!idInput || !idInput.value || (addButton && addButton.disabled)) return;

    var qtyInput = document.querySelector('input[name="quantity"][form="' + formId + '"]');
    var quantity = Math.max(1, parseInt((qtyInput && qtyInput.value) || '1', 10) || 1);
    var variantId = String(idInput.value);

    setBusy(button, true);
    launchFastrr({ type: 'product', products: [{ variantId: variantId, quantity: quantity }] }).then(function (opened) {
      setBusy(button, false);
      if (opened) return;
      // Fallback: Shopify checkout with this product
      window.location.href = '/cart/' + variantId + ':' + quantity;
    });
  });

  // ---- Check out (cart drawer + cart page) ----
  document.addEventListener(
    'click',
    function (event) {
      var button = event.target.closest('button[name="checkout"]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.getAttribute('aria-busy') === 'true') return;
      setBusy(button, true);

      fetch('/cart.js', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          if (!cart.items || !cart.items.length) { setBusy(button, false); return; }
          var products = cart.items.map(function (item) {
            return { variantId: String(item.variant_id), quantity: item.quantity };
          });
          return launchFastrr({ type: 'cart', products: products }).then(function (opened) {
            setBusy(button, false);
            if (!opened) window.location.href = '/checkout';
          });
        })
        .catch(function () {
          setBusy(button, false);
          window.location.href = '/checkout';
        });
    },
    true
  );

  document.addEventListener('DOMContentLoaded', ensureSellerDomain);
})();
