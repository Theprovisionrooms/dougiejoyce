// Cloudflare Pages Function
// POST /api/newsletter
// Body: { email, _gotcha }
// Requires env vars: RESEND_API_KEY, FROM_EMAIL, NOTIFY_EMAIL.
// If you set up a Resend Audience, add RESEND_AUDIENCE_ID and this will add the
// contact there too, so you can send campaigns straight from Resend later.

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid request body.' }, 400);
  }

  if (body._gotcha) {
    return json({ ok: true });
  }

  const email = (body.email || '').toString().trim().slice(0, 200);
  if (!email || !email.includes('@')) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.NOTIFY_EMAIL) {
    return json({ error: "Newsletter signup isn't configured yet." }, 500);
  }

  // Notify the team of the new signup.
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: env.NOTIFY_EMAIL,
      subject: 'New newsletter signup via jiwhiskey.co.uk',
      html: `<p>New signup: ${email}</p>`
    })
  }).catch(() => {});

  // Optionally add to a Resend Audience for future campaigns.
  if (env.RESEND_AUDIENCE_ID) {
    await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, unsubscribed: false })
    }).catch(() => {});
  }

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
