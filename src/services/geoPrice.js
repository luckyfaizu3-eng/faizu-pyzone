// ==========================================
// 🌍 GEO PRICE SERVICE
// IP detect karke country & currency show karo
// ==========================================

const CURRENCY_CONFIG = {
  IN:      { currency: 'INR', symbol: '₹',   price: 49,   basic: 49,   advanced: 99,   pro: 149,  flag: '🇮🇳', name: 'India',         payment: 'razorpay' },
  US:      { currency: 'USD', symbol: '$',   price: 2.99, basic: 2.99, advanced: 5.99, pro: 8.99, flag: '🇺🇸', name: 'USA',           payment: 'paypal'   },
  GB:      { currency: 'GBP', symbol: '£',   price: 2.49, basic: 2.49, advanced: 4.99, pro: 7.49, flag: '🇬🇧', name: 'UK',            payment: 'paypal'   },
  CA:      { currency: 'CAD', symbol: 'CA$', price: 3.99, basic: 3.99, advanced: 7.99, pro: 11.99,flag: '🇨🇦', name: 'Canada',        payment: 'paypal'   },
  AU:      { currency: 'AUD', symbol: 'A$',  price: 4.49, basic: 4.49, advanced: 8.99, pro: 12.99,flag: '🇦🇺', name: 'Australia',     payment: 'paypal'   },
  DE:      { currency: 'EUR', symbol: '€',   price: 2.49, basic: 2.49, advanced: 4.99, pro: 7.49, flag: '🇩🇪', name: 'Germany',       payment: 'paypal'   },
  FR:      { currency: 'EUR', symbol: '€',   price: 2.49, basic: 2.49, advanced: 4.99, pro: 7.49, flag: '🇫🇷', name: 'France',        payment: 'paypal'   },
  PK:      { currency: 'PKR', symbol: '₨',   price: 170,  basic: 170,  advanced: 350,  pro: 499,  flag: '🇵🇰', name: 'Pakistan',      payment: 'paypal'   },
  BD:      { currency: 'BDT', symbol: '৳',   price: 65,   basic: 65,   advanced: 130,  pro: 195,  flag: '🇧🇩', name: 'Bangladesh',    payment: 'paypal'   },
  NP:      { currency: 'NPR', symbol: 'Rs',  price: 80,   basic: 80,   advanced: 160,  pro: 240,  flag: '🇳🇵', name: 'Nepal',         payment: 'paypal'   },
  SA:      { currency: 'SAR', symbol: '﷼',   price: 10,   basic: 10,   advanced: 20,   pro: 30,   flag: '🇸🇦', name: 'Saudi',         payment: 'paypal'   },
  AE:      { currency: 'AED', symbol: 'د.إ', price: 10,   basic: 10,   advanced: 20,   pro: 30,   flag: '🇦🇪', name: 'UAE',           payment: 'paypal'   },
  DEFAULT: { currency: 'USD', symbol: '$',   price: 2.99, basic: 2.99, advanced: 5.99, pro: 8.99, flag: '🌍', name: 'International', payment: 'paypal'   },
};

// In-memory cache — ek baar detect karo, baar baar nahi
let cachedGeoData = null;

export async function detectGeoPrice() {
  // 1. In-memory cache
  if (cachedGeoData) return cachedGeoData;

  // 2. localStorage cache (1 hour)
  try {
    const cached = localStorage.getItem('geo_data');
    if (cached) {
      const parsed = JSON.parse(cached);
      const oneHour = 60 * 60 * 1000;
      if (parsed.timestamp && Date.now() - parsed.timestamp < oneHour) {
        cachedGeoData = parsed;
        return parsed;
      }
    }
  } catch (e) { /* ignore parse errors */ }

  try {
    // ✅ Step 1: Get IP from ipify (lightweight, no rate limit issues)
    let ip = '';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(3000)
      });
      const ipJson = await ipRes.json();
      ip = ipJson.ip || '';
    } catch (e) {
      console.warn('Geo: ipify failed, trying ipapi directly');
    }

    // ✅ Step 2: Get location — use ip-specific endpoint if we have IP,
    //            else fallback to /json/ (single call either way)
    const endpoint = ip
      ? `https://ipapi.co/${ip}/json/`
      : 'https://ipapi.co/json/';

    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(4000)
    });
    const data = await res.json();

    if (data.error || data.reason === 'RateLimited') {
      throw new Error('ipapi rate limited: ' + (data.reason || data.error));
    }

    const countryCode = data.country_code || 'DEFAULT';
    const config = CURRENCY_CONFIG[countryCode] || CURRENCY_CONFIG.DEFAULT;

    const geoData = {
      country:     countryCode,
      countryName: data.country_name || config.name,
      city:        data.city         || '',
      region:      data.region       || '',
      // ✅ ip saved so AnalyticsTracker can reuse — no second ipapi call needed
      ip:          data.ip || ip || '',
      ...config,
      timestamp: Date.now(),
    };

    localStorage.setItem('geo_data', JSON.stringify(geoData));
    cachedGeoData = geoData;
    return geoData;

  } catch (err) {
    console.warn('Geo detection failed, using India default:', err.message);

    // Fallback — India default
    const fallback = {
      country:     'IN',
      countryName: 'India',
      city:        '',
      region:      '',
      ip:          '',
      ...CURRENCY_CONFIG.IN,
      timestamp: Date.now(),
    };
    // ✅ Still cache fallback so AnalyticsTracker doesn't retry
    localStorage.setItem('geo_data', JSON.stringify(fallback));
    cachedGeoData = fallback;
    return fallback;
  }
}

// Format price with currency
export function formatPrice(geoData, level = 'basic') {
  if (!geoData) return '₹49';
  const price = geoData[level] || geoData.price;
  return `${geoData.symbol}${price}`;
}

// Check if Indian user
export function isIndianUser(geoData) {
  return geoData?.country === 'IN';
}

export { CURRENCY_CONFIG };