// Shared header + footer for JIWhiskey site
// Edit nav links, footer content, and socials here once - every page picks it up.

// Product prices mirrored from functions/api/create-checkout-session.js so the
// cart can total up client-side. The Cloudflare Function is the source of
// truth for what Stripe actually charges, if you reprice something update
// both places or the cart total shown here will disagree with checkout.
const JIW_PRODUCTS = {
  classic: { name: 'JIWhiskey Classic', amount: 4999 },
  orange: { name: 'JIWhiskey Orange (Preorder)', amount: 5999 },
  box6: { name: 'JIWhiskey Classic: Box of 6', amount: 24900 }
};

const SITE_HEADER = `
<header>
  <nav class="wrap">
    <a href="/" class="brand">JIWHISKEY</a>
    <div class="navlinks">
      <a href="/story.html">Story</a>
      <a href="/founder.html">Founder</a>
      <a href="/shop.html">Shop</a>
      <!-- Videos link pulled from nav until footage is live, re-add: <a href="/videos.html">Videos</a> -->
      <a href="/faq.html">FAQ</a>
      <a href="/contact.html">Contact</a>
      <button class="cart-toggle" id="cartToggle" aria-label="Open cart">Cart <span class="cart-count" id="cartCount" data-empty="true">0</span></button>
    </div>
    <a href="/shop.html" class="btn nav-cta" style="padding:10px 22px;font-size:0.78rem;">Shop the range</a>
    <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" id="navToggle">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="nav-mobile" id="navMobile">
    <a href="/story.html">Story</a>
    <a href="/founder.html">Founder</a>
    <a href="/shop.html">Shop</a>
    <!-- Videos link pulled from nav until footage is live, re-add: <a href="/videos.html">Videos</a> -->
    <a href="/faq.html">FAQ</a>
    <a href="/contact.html">Contact</a>
    <button class="cart-toggle" id="cartToggleMobile" aria-label="Open cart">Cart <span class="cart-count" id="cartCountMobile" data-empty="true">0</span></button>
    <a href="/shop.html" class="btn" style="margin-top:10px;text-align:center;">Shop the range</a>
  </div>
</header>
<div class="cart-overlay" id="cartOverlay"></div>
<div class="cart-drawer" id="cartDrawer">
  <div class="cart-head">
    <h3>Your cart</h3>
    <button class="cart-close" id="cartClose" aria-label="Close cart">&times;</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-foot">
    <div class="cart-subtotal"><span>Subtotal</span><span id="cartSubtotal">£0.00</span></div>
    <button class="btn" id="cartCheckout">Checkout</button>
    <p class="cart-status" id="cartStatus"></p>
  </div>
</div>
`;

const SITE_FOOTER = `
<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-col">
        <h4>JIWHISKEY</h4>
        <p style="max-width:32ch;">Death before dishonour. Premium Irish whiskey from the house of Joyce.</p>
        <p class="age-note">This site and its products are intended for those aged 18 and over.</p>
      </div>
      <div class="foot-col">
        <h4>SHOP</h4>
        <a href="/shop.html">The range</a>
        <!-- Videos link pulled from footer until footage is live, re-add: <a href="/videos.html">Videos</a> -->
        <a href="/faq.html">FAQ</a>
        <a href="/delivery-returns.html">Delivery &amp; returns</a>
      </div>
      <div class="foot-col">
        <h4>SOCIALS</h4>
        <a href="/socials.html">All socials</a>
        <a href="https://www.instagram.com/dougiejoyce_iam_manchester2023/" target="_blank" rel="noopener">Instagram</a>
        <a href="https://www.facebook.com/DougieJoyceOfficial/" target="_blank" rel="noopener">Facebook</a>
        <a href="https://www.youtube.com/c/DougieJoyceOfficial" target="_blank" rel="noopener">YouTube</a>
      </div>
      <div class="foot-col">
        <h4>CONTACT</h4>
        <a href="tel:01613998731">0161 399 8731</a>
        <a href="/contact.html">Enquire</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 JIWhiskey. Intellectual property of Sidedoor Digital.</span>
      <span>Please drink responsibly.</span>
    </div>
    <div class="foot-bottom" style="border-top:none;padding-top:0;">
      <span>Built by <a href="https://www.getsidedoor.co.uk" target="_blank" rel="noopener" style="color:rgba(239,231,214,0.55);text-decoration:underline;">Sidedoor Digital</a></span>
    </div>
  </div>
</footer>
`;

// Simple 18+ age gate, shown once per browser session via sessionStorage.
const AGE_GATE = `
<div id="age-gate" class="age-gate">
  <div class="age-gate-box">
    <div class="brand" style="margin-bottom:18px;">JIWHISKEY</div>
    <p>You must be 18 or over to enter this site.</p>
    <div class="age-gate-actions">
      <button id="age-yes" class="btn">I am 18 or older</button>
      <a href="https://www.drinkaware.co.uk/" class="btn btn-ghost">Exit</a>
    </div>
  </div>
</div>
`;

document.addEventListener('DOMContentLoaded', () => {
  const headerSlot = document.getElementById('site-header');
  const footerSlot = document.getElementById('site-footer');
  if (headerSlot) headerSlot.outerHTML = SITE_HEADER;
  if (footerSlot) footerSlot.outerHTML = SITE_FOOTER;

  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const open = navMobile.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMobile.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navMobile.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  if (!sessionStorage.getItem('jiw_age_verified')) {
    document.body.insertAdjacentHTML('afterbegin', AGE_GATE);
    document.getElementById('age-yes').addEventListener('click', () => {
      sessionStorage.setItem('jiw_age_verified', 'true');
      document.getElementById('age-gate').remove();
    });
  }

  initCart();
});

// --- Cart ---------------------------------------------------------------
// Cart lives in localStorage as { productKey: quantity }, so it survives
// page loads and closing the tab. Nothing here talks to Stripe until
// checkout time, the server (create-checkout-session.js) is what actually
// prices the order.

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('jiw_cart')) || {};
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem('jiw_cart', JSON.stringify(cart));
  renderCartBadge();
}

function formatGBP(pence) {
  return '£' + (pence / 100).toFixed(2);
}

window.JIWCart = {
  add(productKey, quantity) {
    const cart = getCart();
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    cart[productKey] = (cart[productKey] || 0) + qty;
    saveCart(cart);
  },
  clear() {
    localStorage.removeItem('jiw_cart');
    renderCartBadge();
  }
};

function renderCartBadge() {
  const cart = getCart();
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  ['cartCount', 'cartCountMobile'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(count);
    el.dataset.empty = count === 0 ? 'true' : 'false';
  });
}

function renderCartDrawer() {
  const cart = getCart();
  const itemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('cartSubtotal');
  if (!itemsEl || !subtotalEl) return;

  const keys = Object.keys(cart).filter((k) => cart[k] > 0 && JIW_PRODUCTS[k]);
  if (!keys.length) {
    itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    subtotalEl.textContent = formatGBP(0);
    return;
  }

  let subtotal = 0;
  itemsEl.innerHTML = keys.map((key) => {
    const product = JIW_PRODUCTS[key];
    const qty = cart[key];
    subtotal += product.amount * qty;
    return `
      <div class="cart-line" data-key="${key}">
        <div style="flex:1;">
          <div class="cart-line-name">${product.name}</div>
          <div class="cart-line-price">${formatGBP(product.amount)} each</div>
          <div class="cart-line-controls">
            <button class="cart-qty-btn" data-action="dec" data-key="${key}">-</button>
            <span class="cart-qty-val">${qty}</span>
            <button class="cart-qty-btn" data-action="inc" data-key="${key}">+</button>
            <button class="cart-remove" data-action="remove" data-key="${key}">Remove</button>
          </div>
        </div>
      </div>`;
  }).join('');

  subtotalEl.textContent = formatGBP(subtotal);
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function initCart() {
  renderCartBadge();

  ['cartToggle', 'cartToggleMobile'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openCart);
  });
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);

  document.getElementById('cartItems').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const cart = getCart();
    const key = btn.dataset.key;
    if (btn.dataset.action === 'inc') {
      cart[key] = (cart[key] || 0) + 1;
    } else if (btn.dataset.action === 'dec') {
      cart[key] = Math.max(0, (cart[key] || 0) - 1);
      if (cart[key] === 0) delete cart[key];
    } else if (btn.dataset.action === 'remove') {
      delete cart[key];
    }
    saveCart(cart);
    renderCartDrawer();
  });

  document.getElementById('cartCheckout').addEventListener('click', async () => {
    const cart = getCart();
    const items = Object.keys(cart)
      .filter((k) => cart[k] > 0 && JIW_PRODUCTS[k])
      .map((k) => ({ product: k, quantity: cart[k] }));

    const status = document.getElementById('cartStatus');
    const checkoutBtn = document.getElementById('cartCheckout');
    status.style.display = 'none';

    if (!items.length) {
      status.textContent = 'Add something to your cart first.';
      status.style.color = '#c96a5c';
      status.style.display = 'block';
      return;
    }

    checkoutBtn.disabled = true;
    const original = checkoutBtn.textContent;
    checkoutBtn.textContent = 'Loading...';

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (err) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = original;
      status.textContent = "Sorry, checkout isn't available right now. Please try again shortly.";
      status.style.color = '#c96a5c';
      status.style.display = 'block';
    }
  });
}
