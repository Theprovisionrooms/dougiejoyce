// Cloudflare Pages Function
// POST /api/create-checkout-session
// Body: { "items": [ { "product": "classic" | "orange" | "box6", "quantity": 1 }, ... ] }
// Requires env var STRIPE_SECRET_KEY set in Cloudflare Pages > Settings > Environment variables.
//
// This mirrors PRODUCTS in /assets/js/cart.js on the frontend. If you add or
// reprice a product, update both places or the cart total and the Stripe
// charge will disagree.

const PRODUCTS = {
  classic: {
    name: "JIWhiskey Classic",
    description: "70cl · 40% ABV · Triple distilled, double casked",
    amount: 4999, // pence
    image: "https://www.jiwhiskey.co.uk/assets/img/classic-box-of-6.png"
  },
  orange: {
    name: "JIWhiskey Orange (Preorder)",
    description: "70cl · 40% ABV · New orange flavour release",
    amount: 5999,
    image: "https://www.jiwhiskey.co.uk/assets/img/classic-box-of-6.png"
  },
  box6: {
    name: "JIWhiskey Classic: Box of 6",
    description: "6 x 70cl bottles",
    amount: 24900,
    image: "https://www.jiwhiskey.co.uk/assets/img/classic-box-of-6.png"
  }
};

const MAX_LINE_QTY = 24;
const MAX_LINES = 10;

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return jsonError("Store isn't configured yet. Missing STRIPE_SECRET_KEY.", 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonError("Invalid request body.", 400);
  }

  const items = Array.isArray(body.items) ? body.items : null;
  if (!items || !items.length) {
    return jsonError("Your cart looks empty.", 400);
  }
  if (items.length > MAX_LINES) {
    return jsonError("Too many different items in one order.", 400);
  }

  // Validate every line against the server-side price list. Quantities and
  // product keys come from the client, so nothing about price is trusted
  // from there.
  const lines = [];
  for (const item of items) {
    const product = PRODUCTS[item && item.product];
    const quantity = Math.floor(Number(item && item.quantity));
    if (!product) {
      return jsonError("Unknown product in cart.", 400);
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_LINE_QTY) {
      return jsonError("Invalid quantity in cart.", 400);
    }
    lines.push({ key: item.product, product, quantity });
  }

  const origin = new URL(request.url).origin;

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/shop.html`);
  params.append("shipping_address_collection[allowed_countries][0]", "GB");
  params.append("phone_number_collection[enabled]", "true");
  params.append("billing_address_collection", "required");

  lines.forEach((line, i) => {
    params.append(`line_items[${i}][quantity]`, String(line.quantity));
    params.append(`line_items[${i}][price_data][currency]`, "gbp");
    params.append(`line_items[${i}][price_data][unit_amount]`, String(line.product.amount));
    params.append(`line_items[${i}][price_data][product_data][name]`, line.product.name);
    params.append(`line_items[${i}][price_data][product_data][description]`, line.product.description);
  });

  // Compact cart summary for the webhook to read back when building order
  // emails. Stripe metadata values are capped at 500 characters, which is
  // comfortably enough room for MAX_LINES items.
  const cartSummary = lines.map((l) => ({ p: l.key, n: l.product.name, q: l.quantity }));
  params.append("metadata[cart]", JSON.stringify(cartSummary));

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const session = await stripeRes.json();

  if (!stripeRes.ok) {
    return jsonError(session.error?.message || "Stripe error.", 500);
  }

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" }
  });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
