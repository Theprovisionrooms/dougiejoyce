// Shared header + footer for Joyce's Irish Whiskey site
// Edit nav links, footer content, and socials here once — every page picks it up.

const SITE_HEADER = `
<header>
  <nav class="wrap">
    <a href="/" class="brand">JOYCE'S</a>
    <div class="navlinks">
      <a href="/story.html">Story</a>
      <a href="/founder.html">Founder</a>
      <a href="/shop.html">Shop</a>
      <a href="/faq.html">FAQ</a>
      <a href="/contact.html">Contact</a>
    </div>
    <a href="/shop.html" class="btn" style="padding:10px 22px;font-size:0.78rem;">Shop the range</a>
  </nav>
</header>
`;

const SITE_FOOTER = `
<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-col">
        <h4>JOYCE'S IRISH WHISKEY</h4>
        <p style="max-width:32ch;">Death before dishonour. Premium Irish whiskey from the house of Joyce.</p>
        <p class="age-note">This site and its products are intended for those aged 18 and over.</p>
      </div>
      <div class="foot-col">
        <h4>SHOP</h4>
        <a href="/shop.html">The range</a>
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
        <a href="https://www.comfortandco.uk/" target="_blank" rel="noopener" style="opacity:0.55;">Comfort &amp; Co</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 Joyce's Irish Whiskey. Intellectual property of Sidedoor Digital.</span>
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
    <div class="brand" style="margin-bottom:18px;">JOYCE'S</div>
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

  if (!sessionStorage.getItem('jiw_age_verified')) {
    document.body.insertAdjacentHTML('afterbegin', AGE_GATE);
    document.getElementById('age-yes').addEventListener('click', () => {
      sessionStorage.setItem('jiw_age_verified', 'true');
      document.getElementById('age-gate').remove();
    });
  }
});
