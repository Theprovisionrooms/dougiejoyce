// Cloudflare Pages Function
// POST /api/create-checkout-session
// Body: { "product": "classic" | "orange" | "box6" }
// Requires env var STRIPE_SECRET_KEY set in Cloudflare Pages > Settings > Environment variables.

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

  const productKey = body.product;
  const product = PRODUCTS[productKey];
  if (!product) {
    return jsonError("Unknown product.", 400);
  }

  const origin = new URL(request.url).origin;

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/shop.html`);
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "gbp");
  params.append("line_items[0][price_data][unit_amount]", String(product.amount));
  params.append("line_items[0][price_data][product_data][name]", product.name);
  params.append("line_items[0][price_data][product_data][description]", product.description);
  params.append("shipping_address_collection[allowed_countries][0]", "GB");
  params.append("phone_number_collection[enabled]", "true");
  params.append("billing_address_collection", "required");
  params.append("metadata[product]", productKey);

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
