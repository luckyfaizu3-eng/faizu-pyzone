import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700&family=Dancing+Script:wght@600;700&display=swap');
`;

const LEVEL_CONFIG = {
  basic: {
    label: 'BASIC', badgeText: 'ENTRY LEVEL PYTHON',
    leftBg: '#8B1A1A', leftAccent: '#C0392B',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    ribbonTop: '#6B0F0F',
    skills: ['Python Syntax', 'Variables & Data Types', 'Control Flow', 'Functions', 'Basic I/O'],
  },
  advanced: {
    label: 'ADVANCED', badgeText: 'INTERMEDIATE PYTHON',
    leftBg: '#1A3A5C', leftAccent: '#2471A3',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    ribbonTop: '#0F2744',
    skills: ['OOP Concepts', 'File Handling', 'Exception Handling', 'Modules & Packages', 'List Comprehensions'],
  },
  pro: {
    label: 'PRO', badgeText: 'PYTHON PROFESSIONAL',
    leftBg: '#1B1B2F', leftAccent: '#2C2C54',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    ribbonTop: '#0D0D1F',
    skills: ['Advanced OOP', 'Decorators & Generators', 'Concurrency', 'Design Patterns', 'Performance Optimization'],
  },
};

/* ── Real QR using qrcode npm package ── */

function QRImage({ value, x, y, size, color, borderColor }) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 3,
      margin: 1,
      color: {
        dark: color || '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    }).then(url => setDataUrl(url)).catch(console.error);
  }, [value, size, color]);

  if (!dataUrl) return null;
  return (
    <image
      href={dataUrl}
      x={x} y={y}
      width={size} height={size}
    />
  );
}

/* ══════════════════════════════════════════
   CERTIFICATE SVG — red/gold vectorstock style
══════════════════════════════════════════ */
function CertSVG({ cert }) {
  const level = (cert.level || 'basic').toLowerCase();
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.basic;
  const { leftBg, leftAccent, goldDark, goldLight, goldMid, ribbonTop, label, badgeText, skills } = cfg;
  const W = 1056, H = 748;
  const score = cert.score ?? 0;

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
        <radialGradient id={`sealInner_${level}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2a1800" />
          <stop offset="100%" stopColor="#0a0800" />
        </radialGradient>
        <filter id="dropshadow">
          <feDropShadow dx="3" dy="5" stdDeviation="8" floodColor="#00000055" />
        </filter>
      </defs>

      {/* ── White background ── */}
      <rect width={W} height={H} fill="#F9F7F4" />

      {/* ══ LEFT RED PANEL — diagonal ══ */}
      {/* Main red block */}
      <polygon points={`0,0 ${W * 0.34},0 ${W * 0.27},${H} 0,${H}`} fill={leftBg} />
      {/* Darker inner strip */}
      <polygon points={`0,0 ${W * 0.20},0 ${W * 0.14},${H} 0,${H}`} fill={leftAccent} opacity="0.45" />
      {/* Subtle light strip */}
      <polygon points={`${W*0.19},0 ${W*0.24},0 ${W*0.18},${H} ${W*0.13},${H}`} fill="#ffffff" opacity="0.07" />

      {/* ── GOLD diagonal stripe at panel edge ── */}
      <polygon
        points={`${W*0.29},0 ${W*0.34},0 ${W*0.27},${H} ${W*0.22},${H}`}
        fill={`url(#gD_${level})`} opacity="0.9"
      />

      {/* ── GOLD top/bottom bars ── */}
      <rect x="0" y="0" width={W} height="10" fill={`url(#gH_${level})`} />
      <rect x="0" y={H - 10} width={W} height="10" fill={`url(#gH_${level})`} />

      {/* ── GOLD left bar ── */}
      <rect x="0" y="10" width="9" height={H - 20} fill={`url(#gV_${level})`} />

      {/* ── GOLD outer border ── */}
      <rect x="5" y="5" width={W - 10} height={H - 10}
        fill="none" stroke={`url(#gH_${level})`} strokeWidth="1.5" />

      {/* ══ MEDAL / SEAL ══ */}
      {/* Ribbon */}
      <polygon points="88,185 100,205 112,185" fill={ribbonTop} />
      <polygon points="112,185 124,205 136,185" fill={ribbonTop} />
      <rect x="88" y="130" width="24" height="60" fill={goldMid} />
      <rect x="112" y="130" width="24" height="60" fill={goldDark} />

      {/* Outer starburst ring */}
      {Array.from({ length: 20 }).map((_, i) => {
        const a1 = (i / 20) * Math.PI * 2;
        const a2 = a1 + Math.PI / 20;
        const r1 = 84, r2 = 74;
        const cx = 112, cy = 310;
        return (
          <polygon key={i}
            points={`
              ${cx + Math.cos(a1) * r1},${cy + Math.sin(a1) * r1}
              ${cx + Math.cos(a2) * r2},${cy + Math.sin(a2) * r2}
              ${cx + Math.cos(a2 + Math.PI/20) * r1},${cy + Math.sin(a2 + Math.PI/20) * r1}
            `}
            fill={`url(#gD_${level})`} />
        );
      })}

      {/* Main medal circle */}
      <circle cx={112} cy={310} r={72} fill={`url(#gD_${level})`} filter="url(#dropshadow)" />
      <circle cx={112} cy={310} r={66} fill="none" stroke={goldDark} strokeWidth="1.5" />
      <circle cx={112} cy={310} r={60} fill={`url(#sealInner_${level})`} />
      <circle cx={112} cy={310} r={54} fill="none" stroke={`url(#gD_${level})`} strokeWidth="1" />

      {/* Stars in seal */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        return (
          <text key={i} x={112 + Math.cos(rad) * 36} y={310 + Math.sin(rad) * 36 + 4}
            textAnchor="middle" fontSize="9" fill={goldMid} fontFamily="serif">★</text>
        );
      })}

      <text x={112} y={291} textAnchor="middle" fontSize="7.5" fontWeight="700"
        fill={goldLight} fontFamily='"Cinzel", serif' letterSpacing="1">FAIZUPYZONE</text>
      <text x={112} y={314} textAnchor="middle" fontSize="20" fontWeight="700"
        fill={goldLight} fontFamily='"Cinzel", serif'>{label}</text>
      <text x={112} y={330} textAnchor="middle" fontSize="8" fontWeight="600"
        fill={goldMid} fontFamily='"Cinzel", serif' letterSpacing="2">CERTIFIED</text>
      <text x={112} y={345} textAnchor="middle" fontSize="11"
        fill={goldMid} fontFamily="serif">✦</text>

      {/* ── LEFT skills ── */}
      <text x={112} y={408} textAnchor="middle" fontSize="8" fontWeight="700"
        fill={goldLight} fontFamily='"Cinzel", serif' letterSpacing="2.5">SKILLS COVERED</text>
      <line x1={42} y1={415} x2={182} y2={415} stroke={goldMid} strokeWidth="0.75" opacity="0.7" />

      {skills.map((s, i) => (
        <g key={i}>
          <circle cx={52} cy={430 + i * 22 - 3} r={2.5} fill={goldLight} />
          <text x={60} y={430 + i * 22} fontSize="10" fontWeight="600"
            fill="#f0f0f0" fontFamily='"Cormorant Garamond", Georgia, serif'>{s}</text>
        </g>
      ))}

      {/* FAIZUPYZONE branding bottom left */}
      <text x={112} y={H - 55} textAnchor="middle" fontSize="10" fontWeight="700"
        fill={goldMid} fontFamily='"Cinzel", serif' letterSpacing="1.5">FAIZUPYZONE</text>
      <text x={112} y={H - 40} textAnchor="middle" fontSize="8"
        fill="#aaaaaa" fontFamily='"Cormorant Garamond", Georgia, serif'>faizupyzone.shop</text>

      {/* ══════════════════════════
          RIGHT CONTENT  x=370..W
      ══════════════════════════ */}
      {/* Level badge top right */}
      <rect x={W - 196} y={18} width={172} height={24} rx="12" fill={leftBg} />
      <text x={W - 110} y={34} textAnchor="middle" fontSize="8" fontWeight="700"
        fill={goldLight} fontFamily='"Cinzel", serif' letterSpacing="1">{badgeText}</text>

      {/* "Certificate" title */}
      <text x={590} y={100} textAnchor="middle"
        fontSize="64" fontStyle="italic" fontWeight="400"
        fill={leftBg} fontFamily='"Cormorant Garamond", Georgia, serif'>Certificate</text>

      {/* gold line + OF COMPLETION */}
      <line x1={390} y1={115} x2={790} y2={115} stroke={`url(#gH_${level})`} strokeWidth="1.5" />
      <text x={590} y={135} textAnchor="middle" fontSize="13" fontWeight="600"
        fill={goldDark} fontFamily='"Cinzel", serif' letterSpacing="5">OF COMPLETION</text>
      <line x1={420} y1={143} x2={760} y2={143} stroke={`url(#gH_${level})`} strokeWidth="0.75" />

      {/* THIS CERTIFICATE IS PRESENTED TO */}
      <text x={590} y={178} textAnchor="middle" fontSize="10.5" fontWeight="400"
        fill="#999" fontFamily='"Cinzel", serif' letterSpacing="3">THIS CERTIFICATE IS PRESENTED TO</text>

      {/* NAME */}
      <text x={590} y={246} textAnchor="middle"
        fontSize="54" fontStyle="italic" fontWeight="600"
        fill="#111111" fontFamily='"Cormorant Garamond", Georgia, serif'>{cert.userName}</text>

      {/* name underlines */}
      <line x1={370} y1={260} x2={810} y2={260} stroke="#222" strokeWidth="1.3" />
      <line x1={400} y1={265} x2={780} y2={265} stroke={goldMid} strokeWidth="0.75" />

      {/* has successfully completed */}
      <text x={590} y={293} textAnchor="middle" fontSize="13" fontStyle="italic"
        fill="#888" fontFamily='"Cormorant Garamond", Georgia, serif'>has successfully completed</text>

      {/* Course */}
      <text x={590} y={320} textAnchor="middle" fontSize="18" fontWeight="700"
        fill="#1a1a2e" fontFamily='"Cinzel", serif' letterSpacing="1">{cert.testName}</text>

      {/* with an achievement score of */}
      <text x={590} y={356} textAnchor="middle" fontSize="13" fontStyle="italic"
        fill="#888" fontFamily='"Cormorant Garamond", Georgia, serif'>with an achievement score of</text>

      {/* SCORE */}
      <text x={590} y={415} textAnchor="middle" fontSize="62" fontWeight="700"
        fill={leftBg} fontFamily='"Cinzel", serif'>{score}%</text>

      {score >= 90 && (
        <>
          <rect x={680} y={396} width={125} height={22} rx="11" fill={leftBg} />
          <text x={742} y={411} textAnchor="middle" fontSize="7.5" fontWeight="700"
            fill={goldLight} fontFamily='"Cinzel", serif' letterSpacing="1">WITH DISTINCTION</text>
        </>
      )}

      {/* divider with diamond */}
      <line x1={390} y1={438} x2={580} y2={438} stroke={goldMid} strokeWidth="0.75" opacity="0.5" />
      <rect x={585} y={433} width={10} height={10} fill={goldMid}
        transform="rotate(45 590 438)" />
      <line x1={600} y1={438} x2={800} y2={438} stroke={goldMid} strokeWidth="0.75" opacity="0.5" />

      {/* META */}
      {[
        { lbl: 'CERT ID', val: cert.certificateId || '', x: 415 },
        { lbl: 'LEVEL', val: (cert.level || 'BASIC').toUpperCase(), x: 555 },
        { lbl: 'DATE', val: cert.date || '', x: 660 },
        { lbl: 'LOCATION', val: cert.userAddress || 'N/A', x: 770 },
      ].map(({ lbl, val, x }) => (
        <g key={lbl}>
          <text x={x} y={460} textAnchor="middle" fontSize="7" fontWeight="700"
            fill={goldDark} fontFamily='"Cinzel", serif' letterSpacing="1">{lbl}</text>
          <text x={x} y={476} textAnchor="middle" fontSize="10.5" fontWeight="600"
            fill="#1a1a2e" fontFamily='"Cormorant Garamond", Georgia, serif'>{val}</text>
        </g>
      ))}

      {/* ── DATE | SIGNATURE lines ── */}
      <line x1={410} y1={580} x2={560} y2={580} stroke="#444" strokeWidth="1" />
      <text x={485} y={595} textAnchor="middle" fontSize="9.5" fontWeight="600"
        fill="#666" fontFamily='"Cinzel", serif' letterSpacing="2">DATE</text>
      <text x={485} y={610} textAnchor="middle" fontSize="11"
        fill="#333" fontFamily='"Cormorant Garamond", Georgia, serif'>{cert.date}</text>

      <line x1={610} y1={580} x2={800} y2={580} stroke="#444" strokeWidth="1" />
      <text x={705} y={595} textAnchor="middle" fontSize="9.5" fontWeight="600"
        fill="#666" fontFamily='"Cinzel", serif' letterSpacing="2">SIGNATURE</text>

      {/* ── Real signature traced from uploaded image ── */}
      <g transform="translate(598, 495)" opacity="0.92">
        {/* Big outer oval/circular loop — the dominant swirl */}
        <path
          d="M55,45 C48,36 36,28 26,26 C16,24 8,30 8,40 C8,50 16,60 28,64 C40,68 54,62 60,52 C66,42 62,28 52,22 C42,16 30,20 26,30"
          fill="none" stroke="#1a1a3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Left inner loop reinforcement */}
        <path
          d="M26,30 C30,24 40,20 48,26 C56,32 56,44 50,50"
          fill="none" stroke="#1a1a3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* First tall diagonal peak going up-right from center */}
        <path
          d="M44,52 C46,44 48,32 52,16 C54,8 55,2 56,0"
          fill="none" stroke="#1a1a3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Down from first peak, then up to second peak */}
        <path
          d="M56,0 C57,10 58,26 60,40 C62,26 65,12 68,2"
          fill="none" stroke="#1a1a3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Long downstroke from second peak to bottom */}
        <path
          d="M68,2 C68,16 67,36 66,56 C65,66 64,76 62,86"
          fill="none" stroke="#1a1a3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Long sweeping underline from left to right */}
        <path
          d="M18,68 C34,72 52,74 72,70 C92,66 114,58 136,54 C148,52 156,53 158,57"
          fill="none" stroke="#1a1a3a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Small upward P-stroke on right side */}
        <path
          d="M156,40 C157,30 161,22 165,24 C170,26 168,36 163,40 C158,44 154,40 156,34"
          fill="none" stroke="#1a1a3a" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dot after the P */}
        <circle cx={174} cy={56} r="3" fill="#1a1a3a" />
      </g>

      <text x={705} y={604} textAnchor="middle" fontSize="8" fontWeight="600"
        fill="#888" fontFamily='"Cinzel", serif' letterSpacing="1">FOUNDER &amp; CEO, FAIZUPYZONE</text>
      <text x={705} y={618} textAnchor="middle" fontSize="9" fontStyle="italic"
        fill={goldDark} fontFamily='"Cormorant Garamond", Georgia, serif'>@code_with_06</text>

      {/* ── QR ── */}
      <rect x={W - 118} y={508} width={88} height={88} fill="#fff" rx="3"
        stroke={goldDark} strokeWidth="2" />
      <QRImage value="https://faizupyzone.shop" x={W - 115} y={511} size={82} color={goldDark} />
      <text x={W - 74} y={608} textAnchor="middle" fontSize="7"
        fill={goldDark} fontFamily='"Cinzel", serif' letterSpacing="1">SCAN TO VERIFY</text>

      {/* ── DISCLAIMER — visible, above bottom bar ── */}
      <rect x={370} y={H - 42} width={W - 386} height={24} rx="4" fill="#f5f5f5" opacity="0.85" />
      <line x1={374} y1={H - 42} x2={W - 18} y2={H - 42} stroke={goldMid} strokeWidth="0.75" opacity="0.6" />
      <text x={600} y={H - 25} textAnchor="middle" fontSize="8.5" fill="#666"
        fontFamily='"Cinzel", serif' letterSpacing="0.5">
        This certificate is issued for practice &amp; self-assessment only. Not affiliated with any accredited institution.
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════
   DOWNLOAD: SVG Blob → offscreen Canvas → PDF
   Uses foreignObject-free SVG — no CORS, no taint
══════════════════════════════════════════ */
async function downloadAsPDF(cert) {
  const { jsPDF } = await import('jspdf');
  const level = (cert.level || 'basic').toLowerCase();

  // Render SVG to DOM temporarily
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1056px;height:748px;overflow:hidden;';
  document.body.appendChild(wrap);
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(wrap);
  root.render(<CertSVG cert={cert} />);
  await new Promise(r => setTimeout(r, 500));

  const svgEl = wrap.querySelector('svg');
  const serializer = new XMLSerializer();

  // Inject font embed style into SVG
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700&family=Dancing+Script:wght@600;700&display=swap');
  `;
  svgEl.insertBefore(styleEl, svgEl.firstChild);

  // Wait for fonts
  if (document.fonts) await document.fonts.ready;
  await new Promise(r => setTimeout(r, 1200));

  const svgStr = serializer.serializeToString(svgEl);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Draw to canvas at 3x
  const SCALE = 3;
  const canvas = document.createElement('canvas');
  canvas.width = 1056 * SCALE;
  canvas.height = 748 * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve();
    };
    img.onerror = (e) => reject(new Error('SVG render failed'));
    img.src = url;
  });

  URL.revokeObjectURL(url);
  root.unmount();
  document.body.removeChild(wrap);

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Use standard A4 landscape — mobile viewers auto-fit this correctly
  const A4_W = 841.89, A4_H = 595.28; // pts
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  // Fill entire A4 page with certificate image
  pdf.addImage(imgData, 'PNG', 0, 0, A4_W, A4_H, undefined, 'FAST');

  // Tell PDF viewer to fit the page on open — works on mobile too
  pdf.setDisplayMode('fullpage', 'single');

  const name = (cert.userName || 'cert').replace(/\s+/g, '_');
  pdf.save(`Certificate_${level.toUpperCase()}_${name}.pdf`);
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function CertificateViewer({ certificate, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const cert = certificate || {};
  const level = (cert.level || 'basic').toLowerCase();
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.basic;

  const previewW = Math.min(typeof window !== 'undefined' ? window.innerWidth - 60 : 860, 900);
  const scale = previewW / 1056;
  const previewH = 748 * scale;

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadAsPDF(cert); }
    catch (e) { console.error(e); alert('Download failed: ' + e.message); }
    finally { setDownloading(false); }
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
          {/* Preview */}
          <div style={{
            width: previewW, height: previewH,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 28px 90px rgba(0,0,0,0.85)',
            flexShrink: 0,
          }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1056, height: 748 }}>
              <CertSVG cert={cert} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button onClick={onClose} style={{
              padding: '13px 28px', background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 8,
              color: '#999', fontFamily: '"Cinzel",serif',
              fontSize: 11, fontWeight: 600, letterSpacing: 2, cursor: 'pointer',
            }}>← BACK</button>

            <button onClick={handleDownload} disabled={downloading} style={{
              padding: '13px 44px',
              background: downloading ? '#333' : cfg.leftBg,
              border: 'none', borderRadius: 8, color: '#fff',
              fontFamily: '"Cinzel",serif', fontSize: 12, fontWeight: 700, letterSpacing: 2,
              cursor: downloading ? 'not-allowed' : 'pointer',
              boxShadow: downloading ? 'none' : `0 6px 24px ${cfg.leftBg}99`,
              opacity: downloading ? 0.7 : 1,
            }}>
              ↓ {downloading ? 'GENERATING...' : 'DOWNLOAD PDF'}
            </button>
          </div>

          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 9, color: '#3a3a3a', letterSpacing: 2 }}>
            HIGH RESOLUTION • PRINT READY • SHARP PDF
          </div>
        </div>
      </div>
    </>
  );
}