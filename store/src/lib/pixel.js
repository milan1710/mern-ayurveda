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

  // अगर अलग ID है या पहली बार है, script लगाओ
  if (!document.getElementById('meta-pixel-script')) {
    const s = document.createElement('script');
    s.id = 'meta-pixel-script';
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }

  // ✅ हर pixel id के लिए अलग init
  window.fbq('init', pixelId);
}

export function trackPageView(extraPixelId=null) {
  if (typeof window === 'undefined' || !window.fbq) return;

  // default pixel
  window.fbq('track', 'PageView');

  // product pixel (optional)
  if (extraPixelId) {
    window.fbq('trackSingle', extraPixelId, 'PageView');
  }
}

export function trackViewContent({ id, name, price, currency = 'INR' }, extraPixelId=null) {
  if (typeof window === 'undefined' || !window.fbq) return;

  const payload = {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    value: Number(price || 0),
    currency
  };

  // default pixel
  window.fbq('track', 'ViewContent', payload);

  // product pixel
  if (extraPixelId) {
    window.fbq('trackSingle', extraPixelId, 'ViewContent', payload);
  }
}

export function trackPurchase({ items = [], value = 0, currency = 'INR' }, extraPixelId=null) {
  if (typeof window === 'undefined' || !window.fbq) return;

  const contents = items.map(it => ({
    id: String(it.product || it.id || ''),
    quantity: Number(it.qty || 1),
    item_price: Number(it.price || 0)
  }));

  const payload = {
    value: Number(value || 0),
    currency,
    contents,
    content_type: 'product'
  };

  // default pixel
  window.fbq('track', 'Purchase', payload);

  // product pixel
  if (extraPixelId) {
    window.fbq('trackSingle', extraPixelId, 'Purchase', payload);
  }
}
