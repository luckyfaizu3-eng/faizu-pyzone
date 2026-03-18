// @ts-nocheck
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { db } from '../firebase';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700&family=Dancing+Script:wght@600;700&display=swap');
`;

const LEVEL_CONFIG = {
  basic: {
    label: 'BASIC',
    badgeText: 'ENTRY LEVEL PYTHON',
    leftBg: '#1a1a2e',
    leftAccent: '#16213e',
    accentColor: '#6366f1',
    accentLight: '#818cf8',
    goldDark: '#8B6914',
    goldLight: '#F0C040',
    goldMid: '#D4A017',
    ribbonTop: '#0f0f1a',
    skills: ['Python Syntax', 'Variables & Data Types', 'Control Flow', 'Functions', 'Basic I/O'],
  },
  advanced: {
    label: 'ADVANCED',
    badgeText: 'INTERMEDIATE PYTHON',
    leftBg: '#1e1b4b',
    leftAccent: '#2d2b6b',
    accentColor: '#8b5cf6',
    accentLight: '#a78bfa',
    goldDark: '#8B6914',
    goldLight: '#F0C040',
    goldMid: '#D4A017',
    ribbonTop: '#13114f',
    skills: ['OOP Concepts', 'File Handling', 'Exception Handling', 'Modules & Packages', 'List Comprehensions'],
  },
  pro: {
    label: 'PRO',
    badgeText: 'PYTHON PROFESSIONAL',
    leftBg: '#0f0f0f',
    leftAccent: '#1a1a1a',
    accentColor: '#f59e0b',
    accentLight: '#fbbf24',
    goldDark: '#8B6914',
    goldLight: '#F0C040',
    goldMid: '#D4A017',
    ribbonTop: '#000000',
    skills: ['Advanced OOP', 'Decorators & Generators', 'Concurrency', 'Design Patterns', 'Performance Optimization'],
  },
};

function QRImage({ value, x, y, size, color }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 3,
      margin: 1,
      color: { dark: color || '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(url => setDataUrl(url)).catch(console.error);
  }, [value, size, color]);
  if (!dataUrl) return null;
  return <image href={dataUrl} x={x} y={y} width={size} height={size} />;
}

function CertSVG({ cert }) {
  const level = (cert.level || 'basic').toLowerCase();
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.basic;
  const { leftBg, leftAccent, accentColor, accentLight, goldDark, goldLight, goldMid, ribbonTop, label, badgeText, skills } = cfg;
  const W = 1056, H = 748;
  const score = cert.score ?? 0;
  const studentNameUpper = (cert.userName || '').toUpperCase();
  const verifyUrl = `PYSKILL|${cert.certificateId||'N/A'}|${studentNameUpper}|${(cert.level||'BASIC').toUpperCase()}|${score}%|${cert.date||'N/A'}|faizupyzone.shop`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block' }}
      data-cert-root="true"
    >
      <defs>
        <linearGradient id={`gH_${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={goldDark} />
          <stop offset="30%" stopColor={goldLight} />
          <stop offset="50%" stopColor="#FFF4A3" />
          <stop offset="70%" stopColor={goldLight} />
          <stop offset="100%" stopColor={goldDark} />
        </linearGradient>
        <linearGradient id={`gV_${level}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={goldDark} />
          <stop offset="50%" stopColor={goldLight} />
          <stop offset="100%" stopColor={goldDark} />
        </linearGradient>
        <linearGradient id={`gD_${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={goldDark} />
          <stop offset="40%" stopColor={goldLight} />
          <stop offset="100%" stopColor={goldDark} />
        </linearGradient>
        <linearGradient id={`accentGrad_${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accentColor} />
          <stop offset="100%" stopColor={accentLight} />
        </linearGradient>
        <radialGradient id={`sealInner_${level}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2a1800" />
          <stop offset="100%" stopColor="#0a0800" />
        </radialGradient>
        <filter id="dropshadow">
          <feDropShadow dx="3" dy="5" stdDeviation="8" floodColor="#00000055" />
        </filter>
        <filter id="glowFilter">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width={W} height={H} fill="#F9F7F4" />
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h${i}`} x1="370" y1={i * 40} x2={W} y2={i * 40}
          stroke="#e8e8e8" strokeWidth="0.5" opacity="0.5" />
      ))}
      <polygon points={`0,0 ${W * 0.34},0 ${W * 0.27},${H} 0,${H}`} fill={leftBg} />
      <polygon points={`0,0 ${W * 0.20},0 ${W * 0.14},${H} 0,${H}`} fill={leftAccent} opacity="0.45" />
      <polygon points={`${W*0.19},0 ${W*0.24},0 ${W*0.18},${H} ${W*0.13},${H}`} fill="#ffffff" opacity="0.07" />
      <polygon points={`${W*0.285},0 ${W*0.305},0 ${W*0.235},${H} ${W*0.215},${H}`} fill={`url(#accentGrad_${level})`} opacity="0.8" />
      <polygon points={`${W*0.31},0 ${W*0.34},0 ${W*0.27},${H} ${W*0.24},${H}`} fill={`url(#gD_${level})`} opacity="0.9" />
      <rect x="0" y="0" width={W} height="10" fill={`url(#gH_${level})`} />
      <rect x="0" y={H - 10} width={W} height="10" fill={`url(#gH_${level})`} />
      <rect x="0" y="10" width="9" height={H - 20} fill={`url(#gV_${level})`} />
      <rect x="5" y="5" width={W - 10} height={H - 10} fill="none" stroke={`url(#gH_${level})`} strokeWidth="1.5" />
      <polygon points="88,185 100,205 112,185" fill={ribbonTop} />
      <polygon points="112,185 124,205 136,185" fill={ribbonTop} />
      <rect x="88" y="130" width="24" height="60" fill={goldMid} />
      <rect x="112" y="130" width="24" height="60" fill={goldDark} />
      {Array.from({ length: 20 }).map((_, i) => {
        const a1 = (i / 20) * Math.PI * 2;
        const a2 = a1 + Math.PI / 20;
        const r1 = 84, r2 = 74;
        const cx = 112, cy = 310;
        return (
          <polygon key={i} points={`${cx + Math.cos(a1) * r1},${cy + Math.sin(a1) * r1} ${cx + Math.cos(a2) * r2},${cy + Math.sin(a2) * r2} ${cx + Math.cos(a2 + Math.PI/20) * r1},${cy + Math.sin(a2 + Math.PI/20) * r1}`} fill={`url(#gD_${level})`} />
        );
      })}
      <circle cx={112} cy={310} r={72} fill={`url(#gD_${level})`} filter="url(#dropshadow)" />
      <circle cx={112} cy={310} r={66} fill="none" stroke={goldDark} strokeWidth="1.5" />
      <circle cx={112} cy={310} r={60} fill={`url(#sealInner_${level})`} />
      <circle cx={112} cy={310} r={54} fill="none" stroke={`url(#gD_${level})`} strokeWidth="1" />
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        return <text key={i} x={112 + Math.cos(rad) * 36} y={310 + Math.sin(rad) * 36 + 4} textAnchor="middle" fontSize="9" fill={goldMid} fontFamily="serif">★</text>;
      })}
      <text x={112} y={291} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldLight} fontFamily='"Cinzel", serif' letterSpacing="1">PYSKILL</text>
      <text x={112} y={314} textAnchor="middle" fontSize="20" fontWeight="700" fill={goldLight} fontFamily='"Cinzel", serif'>{label}</text>
      <text x={112} y={330} textAnchor="middle" fontSize="8" fontWeight="600" fill={goldMid} fontFamily='"Cinzel", serif' letterSpacing="2">CERTIFIED</text>
      <text x={112} y={345} textAnchor="middle" fontSize="11" fill={goldMid} fontFamily="serif">✦</text>
      <text x={112} y={408} textAnchor="middle" fontSize="8" fontWeight="700" fill={goldLight} fontFamily='"Cinzel", serif' letterSpacing="2.5">SKILLS COVERED</text>
      <line x1={42} y1={415} x2={182} y2={415} stroke={goldMid} strokeWidth="0.75" opacity="0.7" />
      {skills.map((s, i) => (
        <g key={i}>
          <circle cx={52} cy={430 + i * 22 - 3} r={2.5} fill={accentLight} />
          <text x={60} y={430 + i * 22} fontSize="10" fontWeight="600" fill="#f0f0f0" fontFamily='"Cormorant Garamond", Georgia, serif'>{s}</text>
        </g>
      ))}
      <text x={112} y={H - 55} textAnchor="middle" fontSize="10" fontWeight="700" fill={goldMid} fontFamily='"Cinzel", serif' letterSpacing="1.5">PYSKILL</text>
      <text x={112} y={H - 40} textAnchor="middle" fontSize="8" fill="#aaaaaa" fontFamily='"Cormorant Garamond", Georgia, serif'>pyskill.shop</text>
      <rect x={W - 196} y={18} width={172} height={24} rx="12" fill={accentColor} opacity="0.9" />
      <text x={W - 110} y={34} textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff" fontFamily='"Cinzel", serif' letterSpacing="1">{badgeText}</text>
      <text x={590} y={100} textAnchor="middle" fontSize="64" fontStyle="italic" fontWeight="400" fill={leftBg} fontFamily='"Cormorant Garamond", Georgia, serif'>Certificate</text>
      <line x1={390} y1={115} x2={790} y2={115} stroke={`url(#gH_${level})`} strokeWidth="1.5" />
      <text x={590} y={135} textAnchor="middle" fontSize="13" fontWeight="600" fill={goldDark} fontFamily='"Cinzel", serif' letterSpacing="5">OF ACHIEVEMENT</text>
      <line x1={420} y1={143} x2={760} y2={143} stroke={`url(#gH_${level})`} strokeWidth="0.75" />
      <text x={590} y={175} textAnchor="middle" fontSize="10" fontWeight="400" fill="#999" fontFamily='"Cinzel", serif' letterSpacing="2">THIS IS TO CERTIFY THAT</text>
      <text x={590} y={240} textAnchor="middle" fontSize="54" fontStyle="italic" fontWeight="600" fill="#111111" fontFamily='"Cormorant Garamond", Georgia, serif'>{studentNameUpper}</text>
      <line x1={370} y1={255} x2={810} y2={255} stroke="#222" strokeWidth="1.3" />
      <line x1={400} y1={260} x2={780} y2={260} stroke={goldMid} strokeWidth="0.75" />
      <text x={590} y={288} textAnchor="middle" fontSize="11.5" fontStyle="italic" fill="#666" fontFamily='"Cormorant Garamond", Georgia, serif'>has successfully demonstrated proficiency in</text>
      <text x={590} y={315} textAnchor="middle" fontSize="19" fontWeight="700" fill={accentColor} fontFamily='"Cinzel", serif' letterSpacing="1" filter="url(#glowFilter)">{cert.testName}</text>
      <text x={590} y={342} textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="#888" fontFamily='"Cormorant Garamond", Georgia, serif'>by completing PySkill&apos;s proctored anti-cheat assessment</text>
      <text x={590} y={370} textAnchor="middle" fontSize="10" fontStyle="italic" fill="#999" fontFamily='"Cormorant Garamond", Georgia, serif'>with an achievement score of</text>
      <text x={590} y={425} textAnchor="middle" fontSize="62" fontWeight="700" fill={accentColor} fontFamily='"Cinzel", serif'>{score}%</text>
      {score >= 90 && (
        <>
          <rect x={680} y={406} width={125} height={22} rx="11" fill={accentColor} />
          <text x={742} y={421} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#ffffff" fontFamily='"Cinzel", serif' letterSpacing="1">WITH DISTINCTION</text>
        </>
      )}
      <line x1={390} y1={445} x2={580} y2={445} stroke={goldMid} strokeWidth="0.75" opacity="0.5" />
      <rect x={585} y={440} width={10} height={10} fill={goldMid} transform="rotate(45 590 445)" />
      <line x1={600} y1={445} x2={800} y2={445} stroke={goldMid} strokeWidth="0.75" opacity="0.5" />
      <text x={590} y={460} textAnchor="middle" fontSize="8" fontWeight="700" fill={goldDark} fontFamily='"Cinzel", serif' letterSpacing="2">CERTIFICATE ID</text>
      <text x={590} y={476} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a1a2e" fontFamily='"Courier New", monospace' letterSpacing="1">{cert.certificateId || 'N/A'}</text>
      {[
        { lbl: 'LEVEL', val: (cert.level || 'BASIC').toUpperCase(), x: 430 },
        { lbl: 'DATE', val: cert.date || '', x: 590 },
        { lbl: 'LOCATION', val: cert.userAddress || 'India', x: 750 },
      ].map(({ lbl, val, x }) => (
        <g key={lbl}>
          <text x={x} y={494} textAnchor="middle" fontSize="8" fontWeight="700" fill={goldDark} fontFamily='"Cinzel", serif' letterSpacing="1.5">{lbl}</text>
          <text x={x} y={510} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a1a2e" fontFamily='"Cinzel", serif'>{val}</text>
        </g>
      ))}
      <line x1={410} y1={578} x2={560} y2={578} stroke="#444" strokeWidth="1" />
      <text x={485} y={593} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#666" fontFamily='"Cinzel", serif' letterSpacing="2">DATE</text>
      <text x={485} y={608} textAnchor="middle" fontSize="11" fill="#333" fontFamily='"Cormorant Garamond", Georgia, serif'>{cert.date}</text>
      <line x1={610} y1={578} x2={800} y2={578} stroke="#444" strokeWidth="1" />
      <text x={705} y={593} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#666" fontFamily='"Cinzel", serif' letterSpacing="2">SIGNATURE</text>
      <g transform="translate(598, 493)" opacity="0.92">
        <path d="M55,45 C48,36 36,28 26,26 C16,24 8,30 8,40 C8,50 16,60 28,64 C40,68 54,62 60,52 C66,42 62,28 52,22 C42,16 30,20 26,30" fill="none" stroke="#1a1a3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26,30 C30,24 40,20 48,26 C56,32 56,44 50,50" fill="none" stroke="#1a1a3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44,52 C46,44 48,32 52,16 C54,8 55,2 56,0" fill="none" stroke="#1a1a3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M56,0 C57,10 58,26 60,40 C62,26 65,12 68,2" fill="none" stroke="#1a1a3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M68,2 C68,16 67,36 66,56 C65,66 64,76 62,86" fill="none" stroke="#1a1a3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18,68 C34,72 52,74 72,70 C92,66 114,58 136,54 C148,52 156,53 158,57" fill="none" stroke="#1a1a3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M156,40 C157,30 161,22 165,24 C170,26 168,36 163,40 C158,44 154,40 156,34" fill="none" stroke="#1a1a3a" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={174} cy={56} r="3" fill="#1a1a3a" />
      </g>
      <text x={705} y={602} textAnchor="middle" fontSize="8" fontWeight="600" fill="#888" fontFamily='"Cinzel", serif' letterSpacing="1">FOUNDER &amp; CEO, FAIZUPYZONE</text>
      <text x={705} y={616} textAnchor="middle" fontSize="9" fontStyle="italic" fill={goldDark} fontFamily='"Cormorant Garamond", Georgia, serif'>@code_with_06</text>
      <rect x={W - 128} y={500} width={100} height={100} fill="#fff" rx="4" stroke={accentColor} strokeWidth="2.5" />
      <QRImage value={verifyUrl} x={W - 125} y={503} size={94} color={leftBg} />
      <text x={W - 78} y={612} textAnchor="middle" fontSize="7" fill={accentColor} fontFamily='"Cinzel", serif' letterSpacing="1" fontWeight="700">SCAN TO VERIFY</text>
      <text x={W - 78} y={624} textAnchor="middle" fontSize="7" fill="#666" fontFamily='"Cinzel", serif' fontWeight="600">All details inside</text>
      <rect x={370} y={H - 58} width={W - 386} height={44} rx="6" fill={accentColor} opacity="0.07" />
      <line x1={374} y1={H - 58} x2={W - 18} y2={H - 58} stroke={accentColor} strokeWidth="1.2" opacity="0.5" />
      <text x={600} y={H - 38} textAnchor="middle" fontSize="8.5" fill="#444" fontFamily='"Cinzel", serif' fontWeight="600" letterSpacing="0.3">This certificate confirms that the above-named individual has passed PySkill&apos;s proctored Python test</text>
      <text x={600} y={H - 22} textAnchor="middle" fontSize="8.5" fill="#444" fontFamily='"Cinzel", serif' letterSpacing="0.3">under strict anti-cheat monitoring. Valid for resume, LinkedIn &amp; portfolio. Verified at faizupyzone.shop</text>
    </svg>
  );
}

async function downloadAsPDF(cert) {
  const { jsPDF } = await import('jspdf');
  const level = (cert.level || 'basic').toLowerCase();
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1056px;height:748px;overflow:hidden;';
  document.body.appendChild(wrap);
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(wrap);
  root.render(<CertSVG cert={cert} />);
  await new Promise(r => setTimeout(r, 500));
  const svgEl = wrap.querySelector('svg');
  const serializer = new XMLSerializer();
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = FONT_STYLE;
  svgEl.insertBefore(styleEl, svgEl.firstChild);
  if (document.fonts) await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1200));
  const svgStr = serializer.serializeToString(svgEl);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const SCALE = 3;
  const canvas = document.createElement('canvas');
  canvas.width = 1056 * SCALE;
  canvas.height = 748 * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
    img.onerror = (e) => reject(new Error('SVG render failed'));
    img.src = url;
  });
  URL.revokeObjectURL(url);
  root.unmount();
  document.body.removeChild(wrap);
  const imgData = canvas.toDataURL('image/png', 1.0);
  const A4_W = 841.89, A4_H = 595.28;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
  pdf.addImage(imgData, 'PNG', 0, 0, A4_W, A4_H, undefined, 'FAST');
  pdf.setDisplayMode('fullpage', 'single');
  const name = (cert.userName || 'cert').replace(/\s+/g, '_');
  pdf.save(`PySkill_Certificate_${level.toUpperCase()}_${name}.pdf`);
}

export default function CertificateViewer({ certificate, onClose, user }) {
  const [downloading, setDownloading] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [hasReview, setHasReview] = useState(null); // null = checking, true/false = result

  const cert = certificate || {};
  const level = (cert.level || 'basic').toLowerCase();
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.basic;
  const previewW = Math.min(typeof window !== 'undefined' ? window.innerWidth - 60 : 860, 900);
  const scale = previewW / 1056;
  const previewH = 748 * scale;

  // Check review on mount
  useEffect(() => {
    if (!user?.email) { setHasReview(false); return; }
    const check = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        // Check if reviews are full (200)
        const allSnap = await getDocs(collection(db, 'studentReviews'));
        if (allSnap.size >= 200) { setHasReview(true); return; }
        // Check if this user has a review
        const q = query(collection(db, 'studentReviews'), where('userEmail', '==', user.email));
        const snap = await getDocs(q);
        setHasReview(!snap.empty);
      } catch (e) {
        console.error('Review check error:', e);
        setHasReview(false);
      }
    };
    check();
  }, [user?.email]);

  const canDownload = hasReview === true;
  const checking = hasReview === null;

  const handleDownload = async () => {
    if (!canDownload) return;
    setDownloading(true);
    try { await downloadAsPDF(cert); }
    catch (e) { console.error(e); alert('Download failed: ' + e.message); }
    finally { setDownloading(false); }
  };

  const handleSaveImage = async () => {
    if (!canDownload) return;
    setSavingImage(true);
    try {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1056px;height:748px;overflow:hidden;';
      document.body.appendChild(wrap);
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(wrap);
      root.render(<CertSVG cert={cert} />);
      await new Promise(r => setTimeout(r, 500));
      const svgEl = wrap.querySelector('svg');
      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = FONT_STYLE;
      svgEl.insertBefore(styleEl, svgEl.firstChild);
      if (document.fonts) await document.fonts.ready;
      await new Promise(r => setTimeout(r, 1200));
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const SCALE = 4;
      const canvas = document.createElement('canvas');
      canvas.width = 1056 * SCALE;
      canvas.height = 748 * SCALE;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
        img.onerror = reject;
        img.src = url;
      });
      URL.revokeObjectURL(url);
      root.unmount();
      document.body.removeChild(wrap);
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const name = (cert.userName || 'cert').replace(/\s+/g, '_');
        a.download = `PySkill_Certificate_${(cert.level || 'basic').toUpperCase()}_${name}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png', 1.0);
    } catch (e) {
      console.error(e);
      alert('Image save failed: ' + e.message);
    } finally {
      setSavingImage(false);
    }
  };

  if (!certificate) return null;

  return (
    <>
      <style>{FONT_STYLE}</style>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.93)',
        zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(8px)',
      }}>
        <button onClick={onClose} style={{
          position: 'fixed', top: 20, right: 20,
          background: '#ef4444', border: 'none', borderRadius: '50%',
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', zIndex: 10001, fontSize: 20,
          boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
        }}>✕</button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%', maxWidth: 920 }}>

          {/* Certificate preview */}
          <div style={{
            width: previewW, height: previewH,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 28px 90px rgba(0,0,0,0.85)',
            flexShrink: 0,
            // Blur certificate if no review
            filter: canDownload ? 'none' : 'blur(6px)',
            transition: 'filter 0.4s ease',
            pointerEvents: canDownload ? 'auto' : 'none',
          }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1056, height: 748 }}>
              <CertSVG cert={cert} />
            </div>
          </div>

          {/* Review required message — shown when no review */}
          {!checking && !canDownload && (
            <div style={{
              background: 'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.2))',
              border: '1.5px solid rgba(168,85,247,0.5)',
              borderRadius: 16, padding: '18px 28px', textAlign: 'center', maxWidth: 500,
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>✍️</div>
              <p style={{
                margin: '0 0 14px', fontSize: 13, fontWeight: 700,
                color: '#e2e8f0', fontFamily: '"Cinzel",serif', letterSpacing: 1,
              }}>REVIEW REQUIRED TO DOWNLOAD</p>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                Write a review on the Home page to unlock your certificate download.
              </p>
              <button
                onClick={() => { window.location.href = '/#student-reviews'; }}
                style={{
                  background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                  border: 'none', color: '#fff',
                  padding: '10px 24px', borderRadius: 50, fontWeight: 800,
                  fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                  boxShadow: '0 4px 16px rgba(168,85,247,0.45)',
                  fontFamily: '"Cinzel",serif',
                }}>
                ✍️ WRITE A REVIEW → UNLOCK
              </button>
            </div>
          )}

          {/* Checking state */}
          {checking && (
            <p style={{ color: '#64748b', fontSize: 12, fontFamily: '"Cinzel",serif', letterSpacing: 1 }}>
              Checking review status...
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button onClick={onClose} style={{
              padding: '13px 28px', background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 8,
              color: '#999', fontFamily: '"Cinzel",serif',
              fontSize: 11, fontWeight: 600, letterSpacing: 2, cursor: 'pointer',
            }}>← BACK</button>

            <button
              onClick={handleDownload}
              disabled={!canDownload || downloading}
              title={!canDownload ? 'Write a review first to unlock download' : ''}
              style={{
                padding: '13px 34px',
                background: !canDownload ? 'rgba(99,102,241,0.2)' : downloading ? '#333' : cfg.accentColor,
                border: !canDownload ? '1.5px solid rgba(99,102,241,0.3)' : 'none',
                borderRadius: 8, color: !canDownload ? '#64748b' : '#fff',
                fontFamily: '"Cinzel",serif', fontSize: 12, fontWeight: 700, letterSpacing: 2,
                cursor: !canDownload ? 'not-allowed' : downloading ? 'not-allowed' : 'pointer',
                boxShadow: (!canDownload || downloading) ? 'none' : `0 6px 24px ${cfg.accentColor}99`,
                opacity: (!canDownload || downloading) ? 0.5 : 1,
                filter: !canDownload ? 'blur(0.5px)' : 'none',
                transition: 'all 0.3s',
              }}>
              🔒 {checking ? 'CHECKING...' : !canDownload ? 'LOCKED' : downloading ? 'GENERATING...' : 'DOWNLOAD PDF'}
            </button>

            <button
              onClick={handleSaveImage}
              disabled={!canDownload || savingImage}
              title={!canDownload ? 'Write a review first to unlock download' : ''}
              style={{
                padding: '13px 34px',
                background: !canDownload ? 'rgba(212,160,23,0.15)' : savingImage ? '#333' : `linear-gradient(135deg, ${cfg.goldDark}, #F0C040, ${cfg.goldDark})`,
                border: !canDownload ? '1.5px solid rgba(212,160,23,0.3)' : 'none',
                borderRadius: 8, color: !canDownload ? '#64748b' : '#1a1a1a',
                fontFamily: '"Cinzel",serif', fontSize: 12, fontWeight: 700, letterSpacing: 2,
                cursor: !canDownload ? 'not-allowed' : savingImage ? 'not-allowed' : 'pointer',
                boxShadow: (!canDownload || savingImage) ? 'none' : '0 6px 24px rgba(240,192,64,0.5)',
                opacity: (!canDownload || savingImage) ? 0.5 : 1,
                filter: !canDownload ? 'blur(0.5px)' : 'none',
                transition: 'all 0.3s',
              }}>
              🔒 {checking ? 'CHECKING...' : !canDownload ? 'LOCKED' : savingImage ? 'SAVING...' : 'SAVE AS IMAGE'}
            </button>
          </div>

          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 9, color: '#3a3a3a', letterSpacing: 2 }}>
            PDF • 4K IMAGE • PRINT READY • VERIFIED BY FAIZUPYZONE
          </div>
        </div>
      </div>
    </>
  );
}