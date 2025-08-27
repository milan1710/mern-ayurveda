// store/src/lib/pixel.js
let loaded = false;
let currentId = null;

// fbq shim (अगर script लोड नहीं भी हुई तो calls queue हो जाएँ)
(function() {
  if (typeof window === 'undefined') return;
  if (window.fbq) return;
  const n = function(){ n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  n.queue = []; n.loaded = false; n.version = '2.0';
  window.fbq = n;
})();

export function initPixel(pixelId) {
  if (typeof window === 'undefined' || !pixelId) return;
  if (loaded && currentId === pixelId) return;

  // अगर अलग ID है या पहली बार है, script लगाओ
  if (!document.getElementById('meta-pixel-script')) {
    const s = document.createElement('script');
    s.id = 'meta-pixel-script';
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }

  window.fbq('init', pixelId);
  loaded = true;
  currentId = pixelId;
}

export function trackPageView() {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

export function trackViewContent({ id, name, price, currency = 'INR' }) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    value: Number(price || 0),
    currency
  });
}

export function trackPurchase({ items = [], value = 0, currency = 'INR' }) {
  if (typeof window === 'undefined' || !window.fbq) return;
  // contents array (optional but nice)
  const contents = items.map(it => ({
    id: String(it.product || it.id || ''),
    quantity: Number(it.qty || 1),
    item_price: Number(it.price || 0)
  }));
  window.fbq('track', 'Purchase', {
    value: Number(value || 0),
    currency,
    contents,
    content_type: 'product'
  });
}
