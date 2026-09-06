// Cloudflare Pages Function
// POST /api/stripe-webhook
// Point a Stripe webhook at https://www.jiwhiskey.co.uk/api/stripe-webhook
// listening for "checkout.session.completed".
//
// Requires env vars:
//   STRIPE_WEBHOOK_SECRET - the signing secret Stripe gives you for this endpoint
//   RESEND_API_KEY, FROM_EMAIL, NOTIFY_EMAIL - for confirmation/notification emails
//
// Verifies the Stripe-Signature header manually with Web Crypto (no Node crypto
// available in Pages Functions), following Stripe's documented scheme.

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook not configured.', { status: 500 });
  }

  const signatureHeader = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  if (!signatureHeader || !(await isValidSignature(rawBody, signatureHeader, env.STRIPE_WEBHOOK_SECRET))) {
    return new Response('Invalid signature.', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return new Response('Invalid payload.', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await sendOrderEmails(session, env).catch(() => {});
  }

  return new Response('ok', { status: 200 });
}

async function isValidSignature(payload, header, secret) {
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function sendOrderEmails(session, env) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) return;

  const customerEmail = session.customer_details?.email;
  const amount = ((session.amount_total || 0) / 100).toFixed(2);
  const currency = (session.currency || 'gbp').toUpperCase();
  const cart = parseCart(session.metadata?.cart);
  const itemsList = cart.length
    ? `<ul>${cart.map((l) => `<li>${escapeHtml(l.n || l.p)} x ${l.q}</li>`).join('')}</ul>`
    : '<p>(Item details unavailable. Check the Stripe dashboard for this session.)</p>';

  const sendEmail = (to, subject, html) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: env.FROM_EMAIL, to, subject, html })
    });

  if (customerEmail) {
    await sendEmail(
      customerEmail,
      'Your JIWhiskey order is confirmed',
      `<p>Death before dishonour.</p>
       <p>Thanks for your order. Here's your confirmation.</p>
       ${itemsList}
       <p><strong>Total:</strong> ${currency} ${amount}</p>
       <p>We'll be in touch with dispatch details shortly.</p>`
    );
  }

  if (env.NOTIFY_EMAIL) {
    const summary = cart.length ? cart.map((l) => `${l.n || l.p} x${l.q}`).join(', ') : 'order';
    await sendEmail(
      env.NOTIFY_EMAIL,
      `New order - ${summary} (${currency} ${amount})`,
      `<p>New checkout completed.</p>
       ${itemsList}
       <p><strong>Total:</strong> ${currency} ${amount}</p>
       <p><strong>Customer email:</strong> ${customerEmail || 'n/a'}</p>
       <p><strong>Stripe session:</strong> ${session.id}</p>`
    );
  }
}

function parseCart(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
