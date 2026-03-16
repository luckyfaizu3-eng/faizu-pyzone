import React, { useState, useEffect } from 'react';
import { detectGeoPrice, formatPrice, isIndianUser } from '../services/geoPrice';

// ==========================================
// 🌍 GEO PRICE BADGE — Show anywhere
// ==========================================
export function GeoPriceBadge({ level = 'basic' }) {
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    detectGeoPrice().then(setGeo);
  }, []);

  if (!geo) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: isIndianUser(geo) 
        ? 'rgba(99,102,241,0.1)' 
        : 'rgba(16,185,129,0.1)',
      border: `1px solid ${isIndianUser(geo) ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
      borderRadius: '50px', padding: '4px 12px',
      fontSize: '0.8rem', fontWeight: '800',
    }}>
      <span>{geo.flag}</span>
      <span style={{ color: isIndianUser(geo) ? '#6366f1' : '#10b981' }}>
        {formatPrice(geo, level)}
      </span>
      {!isIndianUser(geo) && (
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>
          PayPal
        </span>
      )}
    </div>
  );
}

// ==========================================
// 🌍 GEO PRICE HOOK — Use in any component
// ==========================================
export function useGeoPrice() {
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectGeoPrice().then(data => {
      setGeo(data);
      setLoading(false);
    });
  }, []);

  return { geo, loading, isIndia: geo?.country === 'IN' };
}

// ==========================================
// 🌍 GEO AWARE BUY BUTTON
// ==========================================
export function GeoBuyButton({ level = 'basic', onRazorpay, onPayPal, style = {} }) {
  const { geo, loading } = useGeoPrice();

  if (loading) return (
    <button style={{ 
      padding: '1rem 2rem', borderRadius: '12px', 
      background: '#e2e8f0', border: 'none', 
      color: '#94a3b8', fontWeight: '700', cursor: 'wait',
      ...style 
    }}>
      ⏳ Loading price...
    </button>
  );

  const price = formatPrice(geo, level);
  const isIndia = isIndianUser(geo);

  const handleClick = () => {
    if (isIndia) {
      onRazorpay && onRazorpay(geo);
    } else {
      onPayPal && onPayPal(geo);
    }
  };

  return (
    <button onClick={handleClick} style={{
      padding: '1rem 2rem',
      background: isIndia 
        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
        : 'linear-gradient(135deg, #0070ba, #003087)',
      border: 'none', borderRadius: '12px',
      color: '#fff', fontWeight: '800',
      fontSize: '1rem', cursor: 'pointer',
      display: 'flex', alignItems: 'center',
      gap: '8px', justifyContent: 'center',
      boxShadow: isIndia 
        ? '0 6px 20px rgba(99,102,241,0.4)'
        : '0 6px 20px rgba(0,112,186,0.4)',
      transition: 'all 0.2s ease',
      ...style
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {isIndia ? '⚡' : '🅿️'}
      {isIndia ? `Buy Now — ${price}` : `Pay with PayPal — ${price}`}
    </button>
  );
}

// ==========================================
// 🌍 COUNTRY BANNER — Top of page
// ==========================================
export function CountryBanner() {
  const { geo, loading } = useGeoPrice();
  const [show, setShow] = useState(true);

  if (loading || !show || !geo || geo.country === 'IN') return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2rem' }}>{geo.flag}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e2e8f0' }}>
          Visiting from <strong style={{ color: '#fbbf24' }}>{geo.countryName}</strong>?
          Prices shown in <strong style={{ color: '#fbbf24' }}>{geo.currency}</strong>
        </span>
        <span style={{ 
          background: 'rgba(16,185,129,0.2)', 
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: '20px', padding: '2px 10px',
          fontSize: '0.72rem', fontWeight: '700', color: '#34d399'
        }}>
          🅿️ PayPal accepted
        </span>
      </div>
      <button onClick={() => setShow(false)} style={{
        background: 'transparent', border: 'none',
        color: '#64748b', cursor: 'pointer', fontSize: '1rem'
      }}>✕</button>
    </div>
  );
}