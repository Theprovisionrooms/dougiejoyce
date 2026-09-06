// Cloudflare Pages Function
// POST /api/contact
// Body: { name, email, message, _gotcha }
// Requires env vars: RESEND_API_KEY, FROM_EMAIL (verified sender, e.g. "JIWhiskey <hello@jiwhiskey.co.uk>"),
// NOTIFY_EMAIL (where enquiries land, e.g. hello@jiwhiskey.co.uk or Dougie's inbox).

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid request body.' }, 400);
  }

  // Honeypot — bots fill every field, humans never see this one.
  if (body._gotcha) {
    return json({ ok: true });
  }

  const name = (body.name || '').toString().trim().slice(0, 200);
  const email = (body.email || '').toString().trim().slice(0, 200);
  const message = (body.message || '').toString().trim().slice(0, 4000);

  if (!name || !email || !message || !email.includes('@')) {
    return json({ error: 'Please fill in every field with a valid email.' }, 400);
  }

  if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.NOTIFY_EMAIL) {
    return json({ error: "Contact form isn't configured yet." }, 500);
  }

  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: env.NOTIFY_EMAIL,
      reply_to: email,
      subject: `New enquiry via jiwhiskey.co.uk — ${name}`,
      html: `
        <p><strong>Name:</strong> ${escape(name)}</p>
        <p><strong>Email:</strong> ${escape(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escape(message).replace(/\n/g, '<br>')}</p>
      `
    })
  });

  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    return json({ error: err.message || 'Could not send your message. Please try again.' }, 500);
  }

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
