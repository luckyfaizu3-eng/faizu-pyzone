// @ts-nocheck
// CertificateViewer.jsx — ENHANCED
// ✅ 10-second free preview → then blur + lock
// ✅ Anti-screenshot: CSS + overlay + key blocks
// ✅ getDisplayMedia blocked (screen recording)
// ✅ Beautiful 24hr countdown FOMO timer
// ✅ 24hr auto-delete from Firestore (unpaid only)
// ✅ Payment → LIFETIME access, never deleted
// ✅ Loss Aversion + Social Proof messaging

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { db } from '../firebase';
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, query, where, getDocs,
  increment, updateDoc
} from 'firebase/firestore';
import { RAZORPAY_KEY_ID } from '../App';
import { hasPaidForCertificate, saveCertificatePayment } from '../services/mockTestService';

// ─────────────────────────────────────────────
// FONTS
// ─────────────────────────────────────────────
const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700&family=Dancing+Script:wght@600;700&display=swap');
`;

const SIG_URL = 'https://i.ibb.co/C3xKVcFm/Whats-App-Image-2026-03-19-at-12-47-02-AM.jpg';

// ─────────────────────────────────────────────
// LEVEL CONFIG
// ─────────────────────────────────────────────
const LEVEL_CONFIG = {
  basic: {
    label: 'BASIC', badgeText: 'ENTRY LEVEL PYTHON',
    leftBg: '#1a1a2e', leftAccent: '#16213e', accentColor: '#6366f1', accentLight: '#818cf8',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    skills: ['Python Syntax', 'Variables & Data Types', 'Control Flow', 'Functions', 'Basic I/O'],
  },
  advanced: {
    label: 'ADVANCED', badgeText: 'INTERMEDIATE PYTHON',
    leftBg: '#1e1b4b', leftAccent: '#2d2b6b', accentColor: '#8b5cf6', accentLight: '#a78bfa',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    skills: ['OOP Concepts', 'File Handling', 'Exception Handling', 'Modules & Packages', 'List Comprehensions'],
  },
  pro: {
    label: 'PRO', badgeText: 'PYTHON PROFESSIONAL',
    leftBg: '#0f0f0f', leftAccent: '#1a1a1a', accentColor: '#f59e0b', accentLight: '#fbbf24',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    skills: ['Advanced OOP', 'Decorators & Generators', 'Concurrency', 'Design Patterns', 'Performance Optimization'],
  },
};

const isAdmin = (email) => email === 'luckyfaizu3@gmail.com';

// ─────────────────────────────────────────────
// SCREEN RECORD BLOCKER
// ─────────────────────────────────────────────
class ScreenRecordBlocker {
  static _original = null;
  static enable() {
    if (navigator.mediaDevices?.getDisplayMedia) {
      this._original = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async () => {
        throw new DOMException('Screen recording is disabled.', 'NotAllowedError');
      };
    }
  }
  static disable() {
    if (this._original && navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia = this._original;
      this._original = null;
    }
  }
}

// ─────────────────────────────────────────────
// ANTI SCREENSHOT HOOK
// ─────────────────────────────────────────────
function useAntiScreenshot(active) {
  useEffect(() => {
    if (!active) return;
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key  = e.key?.toLowerCase();
      const blocked =
        e.key === 'PrintScreen' ||
        (ctrl && key === 'p') ||
        (ctrl && key === 's') ||
        (e.metaKey && e.shiftKey && ['3','4','s'].includes(key)) ||
        (ctrl && e.shiftKey && key === 's');
      if (blocked) { e.preventDefault(); e.stopPropagation(); }
    };
    const blockContext = (e) => e.preventDefault();
    const blockPrint   = (e) => e.preventDefault();
    document.addEventListener('keydown',     handler,     { capture: true });
    document.addEventListener('contextmenu', blockContext, { capture: true });
    window.addEventListener('beforeprint',   blockPrint);
    ScreenRecordBlocker.enable();
    return () => {
      document.removeEventListener('keydown',     handler,     true);
      document.removeEventListener('contextmenu', blockContext, true);
      window.removeEventListener('beforeprint',   blockPrint);
      ScreenRecordBlocker.disable();
    };
  }, [active]);
}

// ─────────────────────────────────────────────
// 24HR TIMER UTILS
// ─────────────────────────────────────────────
function getTimeRemaining(issuedAt) {
  if (!issuedAt) return null;
  const expireTime = new Date(issuedAt).getTime() + 24 * 60 * 60 * 1000;
  const remaining  = expireTime - Date.now();
  if (remaining <= 0) return null;
  return {
    h: Math.floor(remaining / 3600000),
    m: Math.floor((remaining % 3600000) / 60000),
    s: Math.floor((remaining % 60000) / 1000),
    total: remaining,
  };
}

async function checkAndAutoDelete(userId, certId, issuedAt, hasPaid) {
  if (hasPaid || !issuedAt) return false;
  const elapsed = Date.now() - new Date(issuedAt).getTime();
  if (elapsed >= 24 * 60 * 60 * 1000) {
    try { await deleteDoc(doc(db, 'users', userId, 'certificates', certId)); } catch {}
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────
// FOMO COUNTDOWN TIMER
// ─────────────────────────────────────────────
function FomoTimer({ issuedAt, onExpired }) {
  const [time, setTime] = useState(() => getTimeRemaining(issuedAt));

  useEffect(() => {
    const iv = setInterval(() => {
      const t = getTimeRemaining(issuedAt);
      setTime(t);
      if (!t) { clearInterval(iv); onExpired?.(); }
    }, 1000);
    return () => clearInterval(iv);
  }, [issuedAt, onExpired]);

  if (!time) return null;

  const pct     = (time.total / (24 * 3600 * 1000)) * 100;
  const urgent  = pct < 10;
  const warning = pct < 25;
  const color   = urgent ? '#ef4444' : warning ? '#f59e0b' : '#6366f1';
  const pad     = (n) => String(n).padStart(2, '0');

  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      border: `2px solid ${color}55`,
      borderRadius: 20,
      padding: '1.25rem 1.75rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      animation: urgent ? 'urgentPulse 0.8s infinite' : warning ? 'warnPulse 1.4s infinite' : 'none',
    }}>
      <style>{`
        @keyframes urgentPulse { 0%,100%{box-shadow:0 0 0 0 ${color}55} 50%{box-shadow:0 0 24px 6px ${color}33} }
        @keyframes warnPulse   { 0%,100%{box-shadow:0 0 0 0 ${color}33} 50%{box-shadow:0 0 16px 4px ${color}22} }
        @keyframes shimmer     { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes blink       { 0%,49%,100%{opacity:1} 50%,99%{opacity:0.2} }
        @keyframes livePulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
      `}</style>

      {/* Top shimmer bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, transparent, ${color}, transparent)`, animation:'shimmer 2.5s infinite' }} />
      </div>

      {/* Label */}
      <div style={{ fontSize:'0.68rem', fontWeight:800, letterSpacing:'0.18em', color, marginBottom:'0.75rem', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
        <span style={{ animation: urgent ? 'blink 0.5s infinite' : 'none' }}>⚠️</span>
        Certificate expires in
      </div>

      {/* Digit blocks */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
        {[
          { val: pad(time.h), label: 'HRS' },
          { val: pad(time.m), label: 'MIN' },
          { val: pad(time.s), label: 'SEC' },
        ].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span style={{ fontSize:'1.6rem', fontWeight:900, color, animation:'blink 1s infinite', marginBottom:14, lineHeight:1 }}>:</span>
            )}
            <div style={{ textAlign:'center' }}>
              <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', border:`2px solid ${color}44`, borderRadius:12, padding:'0.5rem 0.75rem', minWidth:52, fontFamily:'Courier New,monospace', fontSize:'1.9rem', fontWeight:900, color:'#fff', lineHeight:1, boxShadow:`0 4px 20px ${color}33` }}>
                {item.val}
              </div>
              <div style={{ fontSize:'0.55rem', fontWeight:800, color:`${color}cc`, letterSpacing:'0.15em', marginTop:'0.3rem' }}>
                {item.label}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop:'1rem', height:5, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:99, transition:'width 1s linear' }} />
      </div>

      {/* Warning message */}
      <div style={{ marginTop:'0.65rem', fontSize:'0.72rem', color: urgent ? '#fca5a5' : warning ? '#fcd34d' : '#94a3b8', fontWeight:600 }}>
        {urgent
          ? '🔴 Last chance! Certificate deletes very soon!'
          : warning
          ? '🟡 Less than 6 hours left — secure it now!'
          : '🔵 Certificate will be permanently deleted after 24 hours'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SOCIAL PROOF
// ─────────────────────────────────────────────
function SocialProof() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    getDoc(doc(db, 'settings', 'certStats'))
      .then(snap => setCount(snap.exists() ? (snap.data().totalDownloads || 0) : Math.floor(Math.random() * 40) + 60))
      .catch(() => setCount(Math.floor(Math.random() * 40) + 60));
  }, []);
  if (count === null) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', fontSize:'0.78rem', color:'#10b981', fontWeight:700 }}>
      <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', animation:'livePulse 1.5s infinite', display:'inline-block', flexShrink:0 }} />
      {count} students already secured their certificate
    </div>
  );
}

// ─────────────────────────────────────────────
// COUPON VALIDATOR
// ─────────────────────────────────────────────
const validateCertCoupon = async (code, originalPrice) => {
  if (!code?.trim()) return { valid: false, error: 'Please enter a coupon code' };
  const upperCode = code.trim().toUpperCase();
  try {
    let couponData = null, couponId = null;
    const directSnap = await getDoc(doc(db, 'coupons', upperCode));
    if (directSnap.exists()) { couponData = directSnap.data(); couponId = directSnap.id; }
    else {
      const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', upperCode)));
      if (!snap.empty) { couponData = snap.docs[0].data(); couponId = snap.docs[0].id; }
    }
    if (!couponData)        return { valid: false, error: '❌ Invalid coupon code' };
    if (!couponData.active) return { valid: false, error: '❌ This coupon is not active' };
    const scope   = couponData.scope || couponData.subject || 'global';
    const allowed = ['global', 'all', 'certificate', 'cert', 'basic'];
    if (!allowed.includes(scope)) return { valid: false, error: '❌ This coupon is not valid for certificates' };
    if (couponData.expiry && new Date() > new Date(couponData.expiry))
      return { valid: false, error: '❌ This coupon has expired' };
    if (couponData.usageLimit && (couponData.usedCount || 0) >= couponData.usageLimit)
      return { valid: false, error: '❌ This coupon has reached its usage limit' };
    const discountAmount = couponData.type === 'flat'
      ? Math.min(couponData.discount, originalPrice)
      : Math.round((originalPrice * couponData.discount) / 100);
    const finalPrice = Math.max(0, originalPrice - discountAmount);
    return {
      valid: true, couponId, couponData, discountAmount, finalPrice, isFree: finalPrice === 0,
      discountText: couponData.type === 'flat' ? `₹${discountAmount} off` : `${couponData.discount}% off`,
      message: finalPrice === 0 ? '🎉 100% off! Certificate is FREE!' : `✅ ${couponData.type === 'flat' ? `₹${discountAmount}` : `${couponData.discount}%`} discount applied!`,
    };
  } catch { return { valid: false, error: '❌ Error checking coupon. Please try again.' }; }
};

const markCouponUsed = async (couponId) => {
  try {
    const { updateDoc: upd, increment: inc } = await import('firebase/firestore');
    await upd(doc(db, 'coupons', couponId), { usedCount: inc(1) });
  } catch {}
};

// ─────────────────────────────────────────────
// QR IMAGE
// ─────────────────────────────────────────────
function QRImage({ value, x, y, size, color }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    QRCode.toDataURL(value, { width: size * 3, margin: 1, color: { dark: color || '#000000', light: '#ffffff' }, errorCorrectionLevel: 'H' })
      .then(url => setDataUrl(url)).catch(console.error);
  }, [value, size, color]);
  if (!dataUrl) return null;
  return <image href={dataUrl} x={x} y={y} width={size} height={size} />;
}

// ─────────────────────────────────────────────
// FETCH SIGNATURE
// ─────────────────────────────────────────────
async function fetchSignatureBase64() {
  try {
    const res = await fetch(SIG_URL);
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror  = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return SIG_URL; }
}

// ─────────────────────────────────────────────
// CERTIFICATE SVG
// ─────────────────────────────────────────────
function CertSVG({ cert, sigBase64 }) {
  const level = (cert.level || 'basic').toLowerCase();
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.basic;
  const { leftBg, leftAccent, accentColor, accentLight, goldDark, goldLight, goldMid, label, badgeText, skills } = cfg;
  const W = 1056, H = 748, score = cert.score ?? 0;
  const studentNameUpper = (cert.userName || '').toUpperCase();
  const locationText     = (cert.userAddress || 'India').trim();
  const verifyUrl        = `https://faizupyzone.shop/#verify/${cert.certificateId || 'N/A'}`;
  const SX = 112, SY = 310;
  const sigHref          = sigBase64 || SIG_URL;
  const nameFontSize     = studentNameUpper.length > 28 ? '28' : studentNameUpper.length > 25 ? '32' : studentNameUpper.length > 20 ? '40' : studentNameUpper.length > 15 ? '46' : '54';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }} data-cert-root="true">
      <defs>
        <linearGradient id={`gH_${level}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={goldDark}/><stop offset="30%" stopColor={goldLight}/><stop offset="50%" stopColor="#FFF4A3"/><stop offset="70%" stopColor={goldLight}/><stop offset="100%" stopColor={goldDark}/></linearGradient>
        <linearGradient id={`gV_${level}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={goldDark}/><stop offset="50%" stopColor={goldLight}/><stop offset="100%" stopColor={goldDark}/></linearGradient>
        <linearGradient id={`gD_${level}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={goldDark}/><stop offset="40%" stopColor={goldLight}/><stop offset="100%" stopColor={goldDark}/></linearGradient>
        <linearGradient id={`accentGrad_${level}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={accentColor}/><stop offset="100%" stopColor={accentLight}/></linearGradient>
        <radialGradient id={`sealInner_${level}`} cx="50%" cy="30%" r="70%"><stop offset="0%" stopColor="#2a1800"/><stop offset="100%" stopColor="#0a0800"/></radialGradient>
        <filter id="dropshadow"><feDropShadow dx="3" dy="5" stdDeviation="8" floodColor="#00000055"/></filter>
        <filter id="glowFilter"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="plBlue_basic" x1="12%" y1="12%" x2="80%" y2="78%"><stop offset="0%" stopColor="#387EB8"/><stop offset="100%" stopColor="#366994"/></linearGradient>
        <linearGradient id="plYellow_basic" x1="19%" y1="21%" x2="91%" y2="88%"><stop offset="0%" stopColor="#FFE052"/><stop offset="100%" stopColor="#FFC331"/></linearGradient>
      </defs>
      <rect width={W} height={H} fill="#F9F7F4"/>
      <g opacity="0.042" transform="translate(570,160) scale(1.6)">
        <path fill="#387EB8" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
        <path fill="#FFC331" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
      </g>
      {Array.from({length:20}).map((_,i)=><line key={i} x1="370" y1={i*40} x2={W} y2={i*40} stroke="#e8e8e8" strokeWidth="0.5" opacity="0.5"/>)}
      <polygon points={`0,0 ${W*.34},0 ${W*.27},${H} 0,${H}`} fill={leftBg}/>
      <polygon points={`0,0 ${W*.20},0 ${W*.14},${H} 0,${H}`} fill={leftAccent} opacity="0.45"/>
      <polygon points={`${W*.19},0 ${W*.24},0 ${W*.18},${H} ${W*.13},${H}`} fill="#ffffff" opacity="0.07"/>
      <polygon points={`${W*.285},0 ${W*.305},0 ${W*.235},${H} ${W*.215},${H}`} fill={`url(#accentGrad_${level})`} opacity="0.8"/>
      <polygon points={`${W*.31},0 ${W*.34},0 ${W*.27},${H} ${W*.24},${H}`} fill={`url(#gD_${level})`} opacity="0.9"/>
      <rect x="0" y="0" width={W} height="10" fill={`url(#gH_${level})`}/><rect x="0" y={H-10} width={W} height="10" fill={`url(#gH_${level})`}/>
      <rect x="0" y="10" width="9" height={H-20} fill={`url(#gV_${level})`}/>
      <rect x="5" y="5" width={W-10} height={H-10} fill="none" stroke={`url(#gH_${level})`} strokeWidth="1.5"/>
      {Array.from({length:20}).map((_,i)=>{const a1=(i/20)*Math.PI*2,a2=a1+Math.PI/20,r1=84,r2=74;return<polygon key={i} points={`${SX+Math.cos(a1)*r1},${SY+Math.sin(a1)*r1} ${SX+Math.cos(a2)*r2},${SY+Math.sin(a2)*r2} ${SX+Math.cos(a2+Math.PI/20)*r1},${SY+Math.sin(a2+Math.PI/20)*r1}`} fill={`url(#gD_${level})`}/>;})}
      <circle cx={SX} cy={SY} r={72} fill={`url(#gD_${level})`} filter="url(#dropshadow)"/>
      <circle cx={SX} cy={SY} r={66} fill="none" stroke={goldDark} strokeWidth="1.5"/>
      <circle cx={SX} cy={SY} r={60} fill={`url(#sealInner_${level})`}/>
      <circle cx={SX} cy={SY} r={54} fill="none" stroke={`url(#gD_${level})`} strokeWidth="1"/>
      {[0,60,120,180,240,300].map((deg,i)=>{const rad=(deg-90)*Math.PI/180;return<text key={i} x={SX+Math.cos(rad)*70} y={SY+Math.sin(rad)*70+4} textAnchor="middle" fontSize="8" fill={goldMid} fontFamily="serif">★</text>;})}
      <path id={`arcTop_${level}`} d={`M ${SX-50},${SY} A 50,50 0 0,1 ${SX+50},${SY}`} fill="none"/>
      <text fontSize="9" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="5"><textPath href={`#arcTop_${level}`} startOffset="50%" textAnchor="middle">PYTHON</textPath></text>
      <text x={SX} y={SY-4}  textAnchor="middle" fontSize="17" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="1.5">PYSKILL</text>
      <text x={SX} y={SY+18} textAnchor="middle" fontSize="13" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="2">{label}</text>
      <path id={`arcBot_${level}`} d={`M ${SX-50},${SY} A 50,50 0 0,0 ${SX+50},${SY}`} fill="none"/>
      <text fontSize="8" fontWeight="600" fill={goldMid} fontFamily="Cinzel,serif" letterSpacing="3"><textPath href={`#arcBot_${level}`} startOffset="50%" textAnchor="middle">CERTIFIED</textPath></text>
      <text x={SX} y={408} textAnchor="middle" fontSize="8"  fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="2.5">SKILLS COVERED</text>
      <line x1={42} y1={415} x2={182} y2={415} stroke={goldMid} strokeWidth="0.75" opacity="0.7"/>
      {skills.map((s,i)=>(<g key={i}><circle cx={52} cy={430+i*22-3} r={2.5} fill={accentLight}/><text x={60} y={430+i*22} fontSize="10" fontWeight="600" fill="#f0f0f0" fontFamily="Cormorant Garamond,Georgia,serif">{s}</text></g>))}
      <g transform="translate(26,22) scale(0.095)">
        <path fill="url(#plBlue_basic)"   d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
        <path fill="url(#plYellow_basic)" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
      </g>
      <text x={56} y={38} fontSize="15" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="2">PYSKILL</text>
      <text x={56} y={50} fontSize="6.5" fill={accentLight} fontFamily="Cinzel,serif" letterSpacing="2.5">PYTHON CERTIFICATION</text>
      <line x1={22} y1={60} x2={200} y2={60} stroke={goldMid} strokeWidth="0.5" opacity="0.45"/>
      <text x={SX} y={H-55} textAnchor="middle" fontSize="10" fontWeight="700" fill={goldMid} fontFamily="Cinzel,serif" letterSpacing="1.5">PYSKILL</text>
      <text x={SX} y={H-40} textAnchor="middle" fontSize="8"  fill="#aaaaaa" fontFamily="Cormorant Garamond,Georgia,serif">faizupyzone.shop</text>
      <rect x={W-196} y={18} width={172} height={24} rx="12" fill={accentColor} opacity="0.9"/>
      <text x={W-110} y={34} textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff" fontFamily="Cinzel,serif" letterSpacing="1">{badgeText}</text>
      <text x={590} y={100} textAnchor="middle" fontSize="64" fontStyle="italic" fontWeight="400" fill={leftBg} fontFamily="Cormorant Garamond,Georgia,serif">Certificate</text>
      <line x1={390} y1={115} x2={790} y2={115} stroke={`url(#gH_${level})`} strokeWidth="1.5"/>
      <text x={590} y={135} textAnchor="middle" fontSize="13" fontWeight="600" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="5">OF ACHIEVEMENT</text>
      <line x1={420} y1={143} x2={760} y2={143} stroke={`url(#gH_${level})`} strokeWidth="0.75"/>
      <text x={590} y={175} textAnchor="middle" fontSize="10" fill="#999" fontFamily="Cinzel,serif" letterSpacing="2">THIS IS TO CERTIFY THAT</text>
      <text x={590} y={studentNameUpper.length>25?234:studentNameUpper.length>20?237:studentNameUpper.length>15?239:240} textAnchor="middle" fontSize={nameFontSize} fontStyle="italic" fontWeight="600" fill="#111111" fontFamily="Cormorant Garamond,Georgia,serif">{studentNameUpper}</text>
      <line x1={370} y1={255} x2={810} y2={255} stroke="#222" strokeWidth="1.3"/>
      <line x1={400} y1={260} x2={780} y2={260} stroke={goldMid} strokeWidth="0.75"/>
      <text x={590} y={288} textAnchor="middle" fontSize="11.5" fontStyle="italic" fill="#666" fontFamily="Cormorant Garamond,Georgia,serif">has successfully demonstrated proficiency in</text>
      <text x={590} y={315} textAnchor="middle" fontSize="19" fontWeight="700" fill={accentColor} fontFamily="Cinzel,serif" letterSpacing="1" filter="url(#glowFilter)">{cert.testName}</text>
      <text x={590} y={342} textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="#888" fontFamily="Cormorant Garamond,Georgia,serif">by completing PySkill&apos;s proctored anti-cheat assessment</text>
      <text x={590} y={368} textAnchor="middle" fontSize="10" fontStyle="italic" fill="#999" fontFamily="Cormorant Garamond,Georgia,serif">with an achievement score of</text>
      <text x={590} y={425} textAnchor="middle" fontSize="62" fontWeight="700" fill={accentColor} fontFamily="Cinzel,serif">{score}%</text>
      {score>=90&&(<><rect x={680} y={406} width={125} height={22} rx="11" fill={accentColor}/><text x={742} y={421} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#ffffff" fontFamily="Cinzel,serif" letterSpacing="1">WITH DISTINCTION</text></>)}
      <line x1={390} y1={445} x2={580} y2={445} stroke={goldMid} strokeWidth="0.75" opacity="0.5"/>
      <rect x={585} y={440} width={10} height={10} fill={goldMid} transform="rotate(45 590 445)"/>
      <line x1={600} y1={445} x2={800} y2={445} stroke={goldMid} strokeWidth="0.75" opacity="0.5"/>
      <rect x={415} y={453} width={350} height={42} rx="8" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.45"/>
      <text x={590} y={468} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="2">CERTIFICATE ID</text>
      <text x={590} y={485} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1a1a2e" fontFamily="Courier New,monospace" letterSpacing="0.8">{cert.certificateId||'N/A'}</text>
      <text x={460} y={513} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="1.5">LEVEL</text>
      <text x={460} y={528} textAnchor="middle" fontSize="11"  fontWeight="700" fill="#1a1a2e" fontFamily="Cinzel,serif">{(cert.level||'BASIC').toUpperCase()}</text>
      <text x={600} y={513} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="1.5">DATE</text>
      <text x={600} y={528} textAnchor="middle" fontSize="11"  fontWeight="700" fill="#1a1a2e" fontFamily="Cinzel,serif">{cert.date||''}</text>
      <text x={780} y={513} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="1.5">ADDRESS</text>
      <text x={780} y={528} textAnchor="middle" {...(locationText.length>20?{textLength:"220",lengthAdjust:"spacingAndGlyphs"}:{})} fontSize={locationText.length>30?'7':locationText.length>20?'8.5':'10'} fontWeight="700" fill="#1a1a2e" fontFamily="Cinzel,serif">{locationText}</text>
      <image href={sigHref} x={500} y={554} width={220} height={60} preserveAspectRatio="xMidYMax meet" style={{mixBlendMode:'multiply'}}/>
      <line x1={560} y1={590} x2={650} y2={590} stroke="#999" strokeWidth="0.7"/>
      <text x={600} y={602} textAnchor="middle" fontSize="8"   fontWeight="600" fill="#777" fontFamily="Cinzel,serif" letterSpacing="2.5">SIGNATURE</text>
      <text x={600} y={614} textAnchor="middle" fontSize="6.5" fill="#aaa" fontFamily="Cinzel,serif" letterSpacing="0.8">FOUNDER &amp; CEO, PYSKILL · @code_with_06</text>
      <rect x={W-138} y={510} width={116} height={116} fill="#fff" rx="6" stroke={accentColor} strokeWidth="2"/>
      <QRImage value={verifyUrl} x={W-135} y={513} size={110} color={leftBg}/>
      <text x={W-80} y={638} textAnchor="middle" fontSize="7"   fill={accentColor} fontFamily="Cinzel,serif" letterSpacing="1" fontWeight="700">SCAN TO VERIFY</text>
      <text x={W-80} y={649} textAnchor="middle" fontSize="6.5" fill="#888" fontFamily="Cinzel,serif">All details inside</text>
      <rect x={374} y={660} width={W-390} height={46} rx="4" fill={accentColor} opacity="0.05"/>
      <line x1={378} y1={660} x2={W-20} y2={660} stroke={accentColor} strokeWidth="0.8" opacity="0.35"/>
      <text x={590} y={678} textAnchor="middle" fontSize="7.5" fill="#666" fontFamily="Cinzel,serif" letterSpacing="0.2">This certificate confirms that the above-named individual has passed PySkill&apos;s proctored Python test</text>
      <text x={590} y={694} textAnchor="middle" fontSize="7.5" fill="#666" fontFamily="Cinzel,serif" letterSpacing="0.2">under strict anti-cheat monitoring. Valid for resume, LinkedIn &amp; portfolio. Verified at faizupyzone.shop</text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// DOWNLOAD HELPERS
// ─────────────────────────────────────────────
async function downloadAsPDF(cert) {
  const { jsPDF }  = await import('jspdf');
  const sigBase64  = await fetchSignatureBase64();
  const wrap       = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1056px;height:748px;overflow:hidden;';
  document.body.appendChild(wrap);
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(wrap);
  root.render(<CertSVG cert={cert} sigBase64={sigBase64} />);
  await new Promise(r => setTimeout(r, 500));
  const svgEl   = wrap.querySelector('svg');
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = FONT_STYLE;
  svgEl.insertBefore(styleEl, svgEl.firstChild);
  if (document.fonts) await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1200));
  const svgStr = new XMLSerializer().serializeToString(svgEl);
  const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url    = URL.createObjectURL(blob);
  const SCALE  = 3;
  const canvas = document.createElement('canvas');
  canvas.width = 1056 * SCALE; canvas.height = 748 * SCALE;
  const ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  await new Promise((resolve, reject) => {
    const img  = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
    img.onerror = e => reject(new Error('SVG render failed'));
    img.src = url;
  });
  URL.revokeObjectURL(url); root.unmount(); document.body.removeChild(wrap);
  const pdf = new jsPDF({ orientation:'landscape', unit:'pt', format:'a4', compress:true });
  pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 841.89, 595.28, undefined, 'FAST');
  pdf.setDisplayMode('fullpage', 'single');
  pdf.save(`PySkill_Certificate_${(cert.level||'basic').toUpperCase()}_${(cert.userName||'cert').replace(/\s+/g,'_')}.pdf`);
  try { await updateDoc(doc(db, 'settings', 'certStats'), { totalDownloads: increment(1) }); } catch {}
}

async function saveAsImage(cert) {
  const sigBase64 = await fetchSignatureBase64();
  const wrap      = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1056px;height:748px;overflow:hidden;';
  document.body.appendChild(wrap);
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(wrap);
  root.render(<CertSVG cert={cert} sigBase64={sigBase64} />);
  await new Promise(r => setTimeout(r, 500));
  const svgEl   = wrap.querySelector('svg');
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = FONT_STYLE;
  svgEl.insertBefore(styleEl, svgEl.firstChild);
  if (document.fonts) await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1200));
  const svgStr = new XMLSerializer().serializeToString(svgEl);
  const blob   = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url    = URL.createObjectURL(blob);
  const SCALE  = 4;
  const canvas = document.createElement('canvas');
  canvas.width = 1056 * SCALE; canvas.height = 748 * SCALE;
  const ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  await new Promise((resolve, reject) => {
    const img  = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
    img.onerror = reject; img.src = url;
  });
  URL.revokeObjectURL(url); root.unmount(); document.body.removeChild(wrap);
  canvas.toBlob(blob => {
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `PySkill_Certificate_${(cert.level||'basic').toUpperCase()}_${(cert.userName||'cert').replace(/\s+/g,'_')}.png`;
    a.click(); URL.revokeObjectURL(a.href);
  }, 'image/png', 1.0);
}

// ─────────────────────────────────────────────
// ADMIN PRICE PANEL
// ─────────────────────────────────────────────
function AdminPricePanel({ currentPrice, onClose, onSaved }) {
  const [newPrice, setNewPrice] = useState(currentPrice);
  const [saving,   setSaving]   = useState(false);
  const handleSave = async () => {
    const parsed = parseInt(newPrice);
    if (isNaN(parsed) || parsed < 0) { window.showToast?.('❌ Please enter a valid price', 'error'); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'certPrices'), { basic: parsed }, { merge: true });
      window.showToast?.(`✅ Price updated to ₹${parsed}`, 'success');
      onSaved(parsed); onClose();
    } catch { window.showToast?.('❌ Price update failed', 'error'); }
    setSaving(false);
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, backdropFilter:'blur(8px)', padding:'1rem' }}>
      <div style={{ background:'#1e293b', borderRadius:20, padding:'2rem', maxWidth:400, width:'100%', border:'2px solid rgba(99,102,241,0.4)', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin:'0 0 0.5rem', color:'#e2e8f0', fontFamily:'"Cinzel",serif', fontSize:'1.1rem' }}>⚙️ Update Certificate Price</h3>
        <p  style={{ margin:'0 0 1.5rem', color:'#64748b', fontSize:'0.85rem' }}>Update the basic certificate download price</p>
        <label style={{ display:'block', marginBottom:'0.4rem', color:'#94a3b8', fontSize:'0.8rem', fontWeight:700 }}>NEW PRICE (₹)</label>
        <input type="number" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)}
          style={{ width:'100%', padding:'0.85rem 1rem', background:'rgba(255,255,255,0.05)', border:'2px solid rgba(99,102,241,0.3)', borderRadius:12, color:'#e2e8f0', fontSize:'1.2rem', fontWeight:700, outline:'none', boxSizing:'border-box', marginBottom:'1.5rem' }}/>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={onClose}   style={{ flex:1, padding:'0.85rem', background:'transparent', border:'2px solid rgba(255,255,255,0.15)', borderRadius:12, color:'#94a3b8', fontWeight:700, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'0.85rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:12, color:'#fff', fontWeight:800, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
            {saving ? '⏳ Saving...' : '✅ Save Price'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CERT PAYMENT + COUPON PANEL
// ─────────────────────────────────────────────
function CertPaymentPanel({ certPrice, userId, level, onPaid, onClose, issuedAt }) {
  const [couponCode,   setCouponCode]   = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [checking,     setChecking]     = useState(false);
  const [finalPrice,   setFinalPrice]   = useState(certPrice);

  const handleCheckCoupon = async () => {
    if (!couponCode.trim()) return;
    setChecking(true); setCouponResult(null);
    const result = await validateCertCoupon(couponCode, certPrice);
    setCouponResult(result);
    setFinalPrice(result.valid ? result.finalPrice : certPrice);
    setChecking(false);
  };

  const handleFreeUnlock = async (coupon) => {
    if (coupon?.couponId) await markCouponUsed(coupon.couponId);
    const result = await saveCertificatePayment(userId, level, {
      paymentId: 'FREE_COUPON', amount: 0,
      couponCode: coupon?.couponData?.code || couponCode,
      couponDiscount: coupon?.discountAmount || certPrice,
      lifetime: true,
    });
    if (result.success) { window.showToast?.('🎉 Certificate unlocked for FREE!', 'success'); onPaid(); }
    else { window.showToast?.('❌ Unlock failed, please try again', 'error'); }
  };

  const handlePayNow = async () => {
    if (finalPrice === 0) { await handleFreeUnlock(couponResult?.valid ? couponResult : null); return; }
    if (!window.Razorpay) { window.showToast?.('⚠️ Payment system loading...', 'warning'); return; }
    if (couponResult?.valid && couponResult.couponId) await markCouponUsed(couponResult.couponId);
    const options = {
      key: RAZORPAY_KEY_ID, amount: finalPrice * 100, currency: 'INR',
      name: 'PySkill', description: 'Basic Python Certificate — Lifetime Access',
      handler: async function(response) {
        const result = await saveCertificatePayment(userId, level, {
          paymentId: response.razorpay_payment_id, amount: finalPrice, originalAmount: certPrice,
          couponCode: couponResult?.couponData?.code || null,
          couponDiscount: couponResult?.discountAmount || 0,
          lifetime: true,
        });
        if (result.success) { window.showToast?.('✅ Certificate unlocked! Lifetime access granted.', 'success'); onPaid(); }
        else { window.showToast?.('❌ Unlock failed, please contact support', 'error'); }
      },
      prefill: {},
      theme: { color: '#6366f1' },
      modal: { ondismiss: () => window.showToast?.('❌ Payment cancelled', 'info') },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => window.showToast?.('❌ Payment Failed!', 'error'));
      rzp.open();
    } catch { window.showToast?.('❌ Payment could not be opened', 'error'); }
  };

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(236,72,153,0.1))', border:'1.5px solid rgba(99,102,241,0.4)', borderRadius:20, padding:'1.5rem 2rem', textAlign:'center', maxWidth:500, width:'100%' }}>

      {/* FOMO Timer */}
      {issuedAt && <div style={{ marginBottom:'1.25rem' }}><FomoTimer issuedAt={issuedAt} onExpired={onClose} /></div>}

      <div style={{ fontSize:'2rem', marginBottom:8 }}>🏆</div>
      <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:800, color:'#e2e8f0', fontFamily:'"Cinzel",serif', letterSpacing:1 }}>
        SECURE YOUR CERTIFICATE NOW
      </p>
      <p style={{ margin:'0 0 6px', fontSize:12, color:'#94a3b8', lineHeight:1.7 }}>
        You passed the test! Pay once to unlock your certificate download.
      </p>
      <p style={{ margin:'0 0 18px', fontSize:11, color:'#a78bfa', fontWeight:700 }}>
        ✅ Lifetime access — pay once, download anytime forever!
      </p>

      {/* Social proof */}
      <div style={{ marginBottom:'1.25rem' }}><SocialProof /></div>

      {/* Loss aversion */}
      <div style={{ padding:'0.65rem 1rem', background:'rgba(239,68,68,0.1)', border:'1.5px solid rgba(239,68,68,0.35)', borderRadius:12, marginBottom:'1.25rem', fontSize:'0.78rem', color:'#fca5a5', fontWeight:700, lineHeight:1.6 }}>
        ⚠️ You worked hard to pass — don&apos;t let it disappear!<br/>
        <span style={{ color:'#f87171' }}>Certificate is permanently deleted after 24 hours if not secured.</span>
      </div>

      {/* Coupon input */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.85rem' }}>
        <input type="text" placeholder="🎟️ Coupon code (optional)" value={couponCode}
          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setFinalPrice(certPrice); }}
          onKeyDown={e => e.key === 'Enter' && handleCheckCoupon()}
          autoComplete="off" autoCapitalize="characters" spellCheck={false}
          style={{ flex:1, padding:'0.75rem 1rem', border:`2px solid ${couponResult?.valid?'#10b981':couponResult?.valid===false?'#ef4444':'rgba(99,102,241,0.3)'}`, borderRadius:12, fontSize:'0.9rem', fontWeight:700, fontFamily:'monospace', letterSpacing:'1px', background:'rgba(255,255,255,0.06)', color:'#e2e8f0', outline:'none' }}
        />
        <button onClick={handleCheckCoupon} disabled={checking || !couponCode.trim()}
          style={{ padding:'0.75rem 1rem', background:checking||!couponCode.trim()?'#334155':'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:12, color:checking||!couponCode.trim()?'#64748b':'#fff', fontWeight:700, cursor:checking||!couponCode.trim()?'not-allowed':'pointer', fontSize:'0.82rem', whiteSpace:'nowrap' }}>
          {checking ? '⏳' : 'Apply'}
        </button>
      </div>

      {/* Coupon result */}
      {couponResult && (
        <div style={{ padding:'0.85rem 1rem', borderRadius:12, marginBottom:'0.85rem', background:couponResult.valid?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', border:`2px solid ${couponResult.valid?'#10b981':'#ef4444'}`, textAlign:'left' }}>
          {couponResult.valid ? (
            <>
              <div style={{ fontWeight:800, color:'#10b981', marginBottom:6, fontSize:'0.9rem' }}>{couponResult.message}</div>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ color:'#64748b', fontSize:'0.85rem', textDecoration:'line-through' }}>₹{certPrice}</span>
                <span style={{ fontSize:'1.3rem', fontWeight:900, color:couponResult.isFree?'#8b5cf6':'#10b981' }}>{couponResult.isFree?'🆓 FREE':`₹${couponResult.finalPrice}`}</span>
                <span style={{ background:'#10b981', color:'#fff', padding:'0.15rem 0.5rem', borderRadius:20, fontSize:'0.7rem', fontWeight:700 }}>{couponResult.discountText}</span>
              </div>
            </>
          ) : (
            <div style={{ fontWeight:700, color:'#ef4444', fontSize:'0.88rem' }}>{couponResult.error}</div>
          )}
        </div>
      )}

      {/* Price summary */}
      <div style={{ padding:'0.75rem 1rem', background:'rgba(99,102,241,0.08)', borderRadius:12, marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color:'#94a3b8', fontSize:'0.85rem', fontWeight:600 }}>Amount to Pay</span>
        <div style={{ textAlign:'right' }}>
          {couponResult?.valid && <div style={{ fontSize:'0.75rem', color:'#64748b', textDecoration:'line-through' }}>₹{certPrice}</div>}
          <span style={{ fontSize:'1.4rem', fontWeight:900, color:finalPrice===0?'#10b981':'#6366f1' }}>{finalPrice===0?'🆓 FREE':`₹${finalPrice}`}</span>
        </div>
      </div>

      {/* Pay button */}
      <button onClick={handlePayNow}
        style={{ width:'100%', background:finalPrice===0?'linear-gradient(135deg,#8b5cf6,#6366f1)':'linear-gradient(135deg,#6366f1,#ec4899)', border:'none', color:'#fff', padding:'13px 28px', borderRadius:50, fontWeight:800, fontSize:14, cursor:'pointer', letterSpacing:1, boxShadow:'0 4px 20px rgba(99,102,241,0.5)', fontFamily:'"Cinzel",serif', marginBottom:'0.65rem' }}>
        {finalPrice===0 ? '🆓 UNLOCK FREE — DOWNLOAD NOW' : `💳 PAY ₹${finalPrice} → LIFETIME ACCESS`}
      </button>

      <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
        Cancel
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN CertificateViewer
// ─────────────────────────────────────────────
export default function CertificateViewer({ certificate, onClose, user }) {
  const [downloading,         setDownloading]         = useState(false);
  const [savingImage,         setSavingImage]         = useState(false);
  const [certPaymentStatus,   setCertPaymentStatus]   = useState(null);
  const [certPrice,           setCertPrice]           = useState(29);
  const [showAdminPricePanel, setShowAdminPricePanel] = useState(false);
  const [previewPhase,        setPreviewPhase]        = useState('counting'); // 'counting' | 'locked'
  const [previewSecsLeft,     setPreviewSecsLeft]     = useState(10);
  const [isExpired,           setIsExpired]           = useState(false);

  const cert        = certificate || {};
  const level       = (cert.level || 'basic').toLowerCase();
  const cfg         = LEVEL_CONFIG[level] || LEVEL_CONFIG.basic;
  const userIsAdmin = isAdmin(user?.email);
  const needsPayment = level === 'basic';
  const previewW    = Math.min(typeof window !== 'undefined' ? window.innerWidth - 60 : 860, 900);
  const scale       = previewW / 1056;
  const previewH    = 748 * scale;

  // Anti-screenshot active for unpaid basic
  useAntiScreenshot(!userIsAdmin && needsPayment);

  // ── Init ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const priceSnap = await getDoc(doc(db, 'settings', 'certPrices'));
        if (priceSnap.exists() && priceSnap.data().basic !== undefined) setCertPrice(priceSnap.data().basic);
      } catch {}

      if (userIsAdmin || !needsPayment) { setCertPaymentStatus({ hasPaid: true }); return; }

      const result = await hasPaidForCertificate(user.uid, level);

      if (!result?.hasPaid && cert.id && cert.issuedAt) {
        const deleted = await checkAndAutoDelete(user.uid, cert.id, cert.issuedAt, false);
        if (deleted) { setIsExpired(true); return; }
      }

      setCertPaymentStatus(result);
    };
    init();
  }, [user?.uid, level, userIsAdmin, needsPayment, cert.id, cert.issuedAt]);

  // ── 10-second preview countdown ──────────
  useEffect(() => {
    if (userIsAdmin) return;
    if (certPaymentStatus?.hasPaid) return;
    if (previewPhase !== 'counting') return;
    const iv = setInterval(() => {
      setPreviewSecsLeft(prev => {
        if (prev <= 1) { clearInterval(iv); setPreviewPhase('locked'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [previewPhase, userIsAdmin, certPaymentStatus]);

  const checking    = certPaymentStatus === null && !isExpired;
  const canDownload = certPaymentStatus?.hasPaid === true;
  const isLocked    = !canDownload && previewPhase === 'locked' && !userIsAdmin;

  const handleDownload = async () => {
    if (!canDownload) return;
    setDownloading(true);
    try { await downloadAsPDF(cert); } catch (e) { alert('Download failed: ' + e.message); }
    finally { setDownloading(false); }
  };

  const handleSaveImage = async () => {
    if (!canDownload) return;
    setSavingImage(true);
    try { await saveAsImage(cert); } catch (e) { alert('Image save failed: ' + e.message); }
    finally { setSavingImage(false); }
  };

  if (!certificate) return null;

  // ── Expired state ──────────────────────────
  if (isExpired) {
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)' }}>
        <div style={{ textAlign:'center', maxWidth:440 }}>
          <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>💀</div>
          <h2 style={{ color:'#ef4444', fontFamily:'"Cinzel",serif', fontSize:'1.5rem', marginBottom:'0.75rem' }}>Certificate Expired</h2>
          <p style={{ color:'#94a3b8', fontSize:'0.95rem', lineHeight:1.7, marginBottom:'1.5rem' }}>
            This certificate was not secured within 24 hours and has been permanently deleted.<br/>
            <span style={{ color:'#f87171', fontWeight:700 }}>Retake the test to earn a new certificate.</span>
          </p>
          <button onClick={onClose} style={{ padding:'0.85rem 2rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:12, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:'"Cinzel",serif', letterSpacing:1 }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{FONT_STYLE}</style>
      <style>{`
        @media print {
          body * { visibility: hidden !important; display: none !important; }
          body::after { content: 'PySkill — Screenshots & Printing Disabled'; visibility: visible !important; display: block !important; position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 2rem; font-weight: 900; color: #000; }
        }
      `}</style>

      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.93)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(8px)', overflowY:'auto' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position:'fixed', top:20, right:20, background:'#ef4444', border:'none', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', zIndex:10001, fontSize:20, boxShadow:'0 4px 14px rgba(239,68,68,0.4)' }}>✕</button>

        {/* Admin price button */}
        {userIsAdmin && (
          <button onClick={() => setShowAdminPricePanel(true)} style={{ position:'fixed', top:20, right:76, background:'linear-gradient(135deg,#f59e0b,#d97706)', border:'none', borderRadius:12, padding:'0.6rem 1rem', cursor:'pointer', color:'#fff', zIndex:10001, fontSize:'0.75rem', fontWeight:800, letterSpacing:1, boxShadow:'0 4px 14px rgba(245,158,11,0.4)', whiteSpace:'nowrap' }}>
            ⚙️ UPDATE PRICE
          </button>
        )}

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22, width:'100%', maxWidth:920, paddingTop:20 }}>

          {/* Certificate preview */}
          <div style={{ position:'relative', width:previewW, flexShrink:0 }}>

            {/* Cert box */}
            <div style={{ width:previewW, height:previewH, borderRadius:16, overflow:'hidden', boxShadow:'0 28px 90px rgba(0,0,0,0.85)', transition:'filter 0.5s ease', filter: isLocked ? 'blur(14px) brightness(0.4)' : 'none', pointerEvents: isLocked ? 'none' : 'auto', userSelect:'none', WebkitUserSelect:'none' }}>
              <div style={{ transform:`scale(${scale})`, transformOrigin:'top left', width:1056, height:748 }}>
                <CertSVG cert={cert} />
              </div>
            </div>

            {/* Transparent overlay blocks right-click + drag on unpaid cert */}
            {!canDownload && (
              <div
                style={{ position:'absolute', inset:0, zIndex:10, cursor:'not-allowed' }}
                onContextMenu={e => e.preventDefault()}
                onDragStart={e => e.preventDefault()}
              />
            )}

            {/* 10-second preview countdown badge */}
            {!canDownload && !userIsAdmin && previewPhase === 'counting' && (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'flex-end', justifyContent:'flex-start', padding:'1rem', zIndex:20, pointerEvents:'none' }}>
                <div style={{ background:'rgba(0,0,0,0.75)', border:'2px solid rgba(255,255,255,0.25)', borderRadius:14, padding:'0.5rem 1rem', backdropFilter:'blur(6px)' }}>
                  <div style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.5)', fontWeight:700, letterSpacing:'0.15em', marginBottom:2, textTransform:'uppercase' }}>Free Preview</div>
                  <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#fff', fontFamily:'Courier New,monospace', lineHeight:1 }}>{previewSecsLeft}s</div>
                </div>
              </div>
            )}

            {/* Locked overlay */}
            {isLocked && (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:20, gap:'0.75rem' }}>
                <div style={{ fontSize:'3rem' }}>🔒</div>
                <div style={{ color:'#fff', fontWeight:800, fontSize:'1.2rem', fontFamily:'"Cinzel",serif', textAlign:'center', textShadow:'0 2px 8px rgba(0,0,0,0.8)' }}>
                  Preview Ended
                </div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.82rem' }}>
                  Unlock to download your certificate
                </div>
              </div>
            )}
          </div>

          {/* Payment panel */}
          {!checking && !canDownload && needsPayment && !isExpired && (
            <CertPaymentPanel
              certPrice={certPrice}
              userId={user.uid}
              level={level}
              issuedAt={cert.issuedAt || cert.createdAt}
              onPaid={() => { setCertPaymentStatus({ hasPaid: true }); setPreviewPhase('counting'); }}
              onClose={onClose}
            />
          )}

          {checking && (
            <p style={{ color:'#64748b', fontSize:12, fontFamily:'"Cinzel",serif', letterSpacing:1 }}>
              ⏳ Checking payment status...
            </p>
          )}

          {/* Download buttons */}
          <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
            <button onClick={onClose} style={{ padding:'13px 28px', background:'transparent', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#999', fontFamily:'"Cinzel",serif', fontSize:11, fontWeight:600, letterSpacing:2, cursor:'pointer' }}>← BACK</button>
            <button onClick={handleDownload} disabled={!canDownload || downloading}
              style={{ padding:'13px 34px', background:!canDownload?'rgba(99,102,241,0.2)':downloading?'#333':cfg.accentColor, border:!canDownload?'1.5px solid rgba(99,102,241,0.3)':'none', borderRadius:8, color:!canDownload?'#64748b':'#fff', fontFamily:'"Cinzel",serif', fontSize:12, fontWeight:700, letterSpacing:2, cursor:(!canDownload||downloading)?'not-allowed':'pointer', boxShadow:(!canDownload||downloading)?'none':`0 6px 24px ${cfg.accentColor}99`, opacity:(!canDownload||downloading)?0.5:1, transition:'all 0.3s' }}>
              {checking ? '⏳ CHECKING...' : !canDownload ? '🔒 LOCKED' : downloading ? '⏳ GENERATING...' : '⬇️ DOWNLOAD PDF'}
            </button>
            <button onClick={handleSaveImage} disabled={!canDownload || savingImage}
              style={{ padding:'13px 34px', background:!canDownload?'rgba(212,160,23,0.15)':savingImage?'#333':`linear-gradient(135deg,${cfg.goldDark},#F0C040,${cfg.goldDark})`, border:!canDownload?'1.5px solid rgba(212,160,23,0.3)':'none', borderRadius:8, color:!canDownload?'#64748b':'#1a1a1a', fontFamily:'"Cinzel",serif', fontSize:12, fontWeight:700, letterSpacing:2, cursor:(!canDownload||savingImage)?'not-allowed':'pointer', boxShadow:(!canDownload||savingImage)?'none':'0 6px 24px rgba(240,192,64,0.5)', opacity:(!canDownload||savingImage)?0.5:1, transition:'all 0.3s' }}>
              {checking ? '⏳ CHECKING...' : !canDownload ? '🔒 LOCKED' : savingImage ? '⏳ SAVING...' : '🖼️ SAVE AS IMAGE'}
            </button>
          </div>

          {userIsAdmin && (
            <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'0.75rem 1.5rem', color:'#10b981', fontSize:'0.8rem', fontWeight:700, fontFamily:'"Cinzel",serif', letterSpacing:1 }}>
              🔓 ADMIN — FREE DOWNLOAD · Current Basic Price: ₹{certPrice}
            </div>
          )}

          <div style={{ fontFamily:'"Cinzel",serif', fontSize:9, color:'#3a3a3a', letterSpacing:2 }}>
            PDF • 4K IMAGE • PRINT READY • VERIFIED BY PYSKILL
          </div>
        </div>
      </div>

      {showAdminPricePanel && (
        <AdminPricePanel currentPrice={certPrice} onClose={() => setShowAdminPricePanel(false)} onSaved={p => setCertPrice(p)} />
      )}
    </>
  );
}