// @ts-nocheck
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { db } from '../firebase';

const PythonLogo = ({ size = 24, style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255" width={size} height={size} style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}>
    <defs>
      <linearGradient id="plBlue" x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%">
        <stop offset="0%" stopColor="#387EB8"/><stop offset="100%" stopColor="#366994"/>
      </linearGradient>
      <linearGradient id="plYellow" x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%">
        <stop offset="0%" stopColor="#FFE052"/><stop offset="100%" stopColor="#FFC331"/>
      </linearGradient>
    </defs>
    <path fill="url(#plBlue)" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
    <path fill="url(#plYellow)" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
  </svg>
);

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
`;

const LEVEL_CONFIG = {
  basic: {
    label: 'BASIC', badgeText: 'ENTRY LEVEL PYTHON',
    leftBg: '#1a1a2e', leftAccent: '#16213e',
    accentColor: '#6366f1', accentLight: '#818cf8',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    skills: ['Python Syntax', 'Variables & Data Types', 'Control Flow', 'Functions', 'Basic I/O'],
  },
  advanced: {
    label: 'ADVANCED', badgeText: 'INTERMEDIATE PYTHON',
    leftBg: '#1e1b4b', leftAccent: '#2d2b6b',
    accentColor: '#8b5cf6', accentLight: '#a78bfa',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    skills: ['OOP Concepts', 'File Handling', 'Exception Handling', 'Modules & Packages', 'List Comprehensions'],
  },
  pro: {
    label: 'PRO', badgeText: 'PYTHON PROFESSIONAL',
    leftBg: '#0f0f0f', leftAccent: '#1a1a1a',
    accentColor: '#f59e0b', accentLight: '#fbbf24',
    goldDark: '#8B6914', goldLight: '#F0C040', goldMid: '#D4A017',
    skills: ['Advanced OOP', 'Decorators & Generators', 'Concurrency', 'Design Patterns', 'Performance Optimization'],
  },
};

const SIG_URL = 'https://i.ibb.co/C3xKVcFm/Whats-App-Image-2026-03-19-at-12-47-02-AM.jpg';

function QRImage({ value, x, y, size, color }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 3, margin: 1,
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
  const { leftBg, leftAccent, accentColor, accentLight, goldDark, goldLight, goldMid, label, badgeText, skills } = cfg;
  const W = 1056, H = 748;
  const score = cert.score ?? 0;
  const verifyUrl = `https://faizupyzone.shop/#verify/${cert.certificateId || 'N/A'}`;
  const SX = 112, SY = 310;
  const nameUpper = (cert.userName || '').toUpperCase();
  const addressText = (cert.userAddress || 'India').trim();

  const nameFontSize = nameUpper.length > 28 ? '26' : nameUpper.length > 25 ? '32' : nameUpper.length > 20 ? '40' : nameUpper.length > 15 ? '46' : '54';
  const nameY = nameUpper.length > 25 ? 234 : nameUpper.length > 20 ? 237 : nameUpper.length > 15 ? 239 : 240;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`gH_${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={goldDark}/><stop offset="30%" stopColor={goldLight}/>
          <stop offset="50%" stopColor="#FFF4A3"/><stop offset="70%" stopColor={goldLight}/>
          <stop offset="100%" stopColor={goldDark}/>
        </linearGradient>
        <linearGradient id={`gV_${level}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={goldDark}/><stop offset="50%" stopColor={goldLight}/><stop offset="100%" stopColor={goldDark}/>
        </linearGradient>
        <linearGradient id={`gD_${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={goldDark}/><stop offset="40%" stopColor={goldLight}/><stop offset="100%" stopColor={goldDark}/>
        </linearGradient>
        <linearGradient id={`accentGrad_${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accentColor}/><stop offset="100%" stopColor={accentLight}/>
        </linearGradient>
        <radialGradient id={`sealInner_${level}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2a1800"/><stop offset="100%" stopColor="#0a0800"/>
        </radialGradient>
        <filter id="dropshadow"><feDropShadow dx="3" dy="5" stdDeviation="8" floodColor="#00000055"/></filter>
        <filter id="glowFilter">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="plBlue_cert" x1="12%" y1="12%" x2="80%" y2="78%">
          <stop offset="0%" stopColor="#387EB8"/><stop offset="100%" stopColor="#366994"/>
        </linearGradient>
        <linearGradient id="plYellow_cert" x1="19%" y1="21%" x2="91%" y2="88%">
          <stop offset="0%" stopColor="#FFE052"/><stop offset="100%" stopColor="#FFC331"/>
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="#F9F7F4"/>
      <g opacity="0.042" transform="translate(570,160) scale(1.6)">
        <path fill="#387EB8" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
        <path fill="#FFC331" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
      </g>
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={i} x1="370" y1={i*40} x2={W} y2={i*40} stroke="#e8e8e8" strokeWidth="0.5" opacity="0.5"/>
      ))}
      <polygon points={`0,0 ${W*0.34},0 ${W*0.27},${H} 0,${H}`} fill={leftBg}/>
      <polygon points={`0,0 ${W*0.20},0 ${W*0.14},${H} 0,${H}`} fill={leftAccent} opacity="0.45"/>
      <polygon points={`${W*0.19},0 ${W*0.24},0 ${W*0.18},${H} ${W*0.13},${H}`} fill="#ffffff" opacity="0.07"/>
      <polygon points={`${W*0.285},0 ${W*0.305},0 ${W*0.235},${H} ${W*0.215},${H}`} fill={`url(#accentGrad_${level})`} opacity="0.8"/>
      <polygon points={`${W*0.31},0 ${W*0.34},0 ${W*0.27},${H} ${W*0.24},${H}`} fill={`url(#gD_${level})`} opacity="0.9"/>
      <rect x="0" y="0" width={W} height="10" fill={`url(#gH_${level})`}/>
      <rect x="0" y={H-10} width={W} height="10" fill={`url(#gH_${level})`}/>
      <rect x="0" y="10" width="9" height={H-20} fill={`url(#gV_${level})`}/>
      <rect x="5" y="5" width={W-10} height={H-10} fill="none" stroke={`url(#gH_${level})`} strokeWidth="1.5"/>

      {Array.from({ length: 20 }).map((_, i) => {
        const a1=(i/20)*Math.PI*2, a2=a1+Math.PI/20, r1=84, r2=74;
        return <polygon key={i} points={`${SX+Math.cos(a1)*r1},${SY+Math.sin(a1)*r1} ${SX+Math.cos(a2)*r2},${SY+Math.sin(a2)*r2} ${SX+Math.cos(a2+Math.PI/20)*r1},${SY+Math.sin(a2+Math.PI/20)*r1}`} fill={`url(#gD_${level})`}/>;
      })}
      <circle cx={SX} cy={SY} r={72} fill={`url(#gD_${level})`} filter="url(#dropshadow)"/>
      <circle cx={SX} cy={SY} r={66} fill="none" stroke={goldDark} strokeWidth="1.5"/>
      <circle cx={SX} cy={SY} r={60} fill={`url(#sealInner_${level})`}/>
      <circle cx={SX} cy={SY} r={54} fill="none" stroke={`url(#gD_${level})`} strokeWidth="1"/>
      {[0,60,120,180,240,300].map((deg,i) => {
        const rad=(deg-90)*Math.PI/180;
        return <text key={i} x={SX+Math.cos(rad)*70} y={SY+Math.sin(rad)*70+4} textAnchor="middle" fontSize="8" fill={goldMid} fontFamily="serif">★</text>;
      })}
      <path id={`arcTop_${level}`} d={`M ${SX-50},${SY} A 50,50 0 0,1 ${SX+50},${SY}`} fill="none"/>
      <text fontSize="9" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="5">
        <textPath href={`#arcTop_${level}`} startOffset="50%" textAnchor="middle">PYTHON</textPath>
      </text>
      <text x={SX} y={SY-4} textAnchor="middle" fontSize="17" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="1.5">PYSKILL</text>
      <text x={SX} y={SY+18} textAnchor="middle" fontSize="13" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="2">{label}</text>
      <path id={`arcBot_${level}`} d={`M ${SX-50},${SY} A 50,50 0 0,0 ${SX+50},${SY}`} fill="none"/>
      <text fontSize="8" fontWeight="600" fill={goldMid} fontFamily="Cinzel,serif" letterSpacing="3">
        <textPath href={`#arcBot_${level}`} startOffset="50%" textAnchor="middle">CERTIFIED</textPath>
      </text>

      <text x={SX} y={408} textAnchor="middle" fontSize="8" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="2.5">SKILLS COVERED</text>
      <line x1={42} y1={415} x2={182} y2={415} stroke={goldMid} strokeWidth="0.75" opacity="0.7"/>
      {skills.map((s,i) => (
        <g key={i}>
          <circle cx={52} cy={430+i*22-3} r={2.5} fill={accentLight}/>
          <text x={60} y={430+i*22} fontSize="10" fontWeight="600" fill="#f0f0f0" fontFamily="Cormorant Garamond,Georgia,serif">{s}</text>
        </g>
      ))}

      <g transform="translate(26, 22) scale(0.095)">
        <path fill="url(#plBlue_cert)" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
        <path fill="url(#plYellow_cert)" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
      </g>
      <text x={56} y={38} fontSize="15" fontWeight="700" fill={goldLight} fontFamily="Cinzel,serif" letterSpacing="2">PYSKILL</text>
      <text x={56} y={50} fontSize="6.5" fill={accentLight} fontFamily="Cinzel,serif" letterSpacing="2.5">PYTHON CERTIFICATION</text>
      <line x1={22} y1={60} x2={200} y2={60} stroke={goldMid} strokeWidth="0.5" opacity="0.45"/>
      <text x={SX} y={H-55} textAnchor="middle" fontSize="10" fontWeight="700" fill={goldMid} fontFamily="Cinzel,serif" letterSpacing="1.5">PYSKILL</text>
      <text x={SX} y={H-40} textAnchor="middle" fontSize="8" fill="#aaaaaa" fontFamily="Cormorant Garamond,Georgia,serif">faizupyzone.shop</text>
      <rect x={W-196} y={18} width={172} height={24} rx="12" fill={accentColor} opacity="0.9"/>
      <text x={W-110} y={34} textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff" fontFamily="Cinzel,serif" letterSpacing="1">{badgeText}</text>

      <text x={590} y={100} textAnchor="middle" fontSize="64" fontStyle="italic" fontWeight="400" fill={leftBg} fontFamily="Cormorant Garamond,Georgia,serif">Certificate</text>
      <line x1={390} y1={115} x2={790} y2={115} stroke={`url(#gH_${level})`} strokeWidth="1.5"/>
      <text x={590} y={135} textAnchor="middle" fontSize="13" fontWeight="600" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="5">OF ACHIEVEMENT</text>
      <line x1={420} y1={143} x2={760} y2={143} stroke={`url(#gH_${level})`} strokeWidth="0.75"/>
      <text x={590} y={175} textAnchor="middle" fontSize="10" fill="#999" fontFamily="Cinzel,serif" letterSpacing="2">THIS IS TO CERTIFY THAT</text>

      {/* ✅ Name — responsive font size + dynamic y position */}
      <text
        x={590} y={nameY}
        textAnchor="middle"
        fontSize={nameFontSize}
        fontStyle="italic"
        fontWeight="600"
        fill="#111111"
        fontFamily="Cormorant Garamond,Georgia,serif"
      >{nameUpper}</text>
      <line x1={370} y1={255} x2={810} y2={255} stroke="#222" strokeWidth="1.3"/>
      <line x1={400} y1={260} x2={780} y2={260} stroke={goldMid} strokeWidth="0.75"/>

      <text x={590} y={288} textAnchor="middle" fontSize="11.5" fontStyle="italic" fill="#666" fontFamily="Cormorant Garamond,Georgia,serif">has successfully demonstrated proficiency in</text>
      <text x={590} y={315} textAnchor="middle" fontSize="19" fontWeight="700" fill={accentColor} fontFamily="Cinzel,serif" letterSpacing="1" filter="url(#glowFilter)">{cert.testName}</text>
      <text x={590} y={342} textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="#888" fontFamily="Cormorant Garamond,Georgia,serif">by completing PySkill&apos;s proctored anti-cheat assessment</text>
      <text x={590} y={368} textAnchor="middle" fontSize="10" fontStyle="italic" fill="#999" fontFamily="Cormorant Garamond,Georgia,serif">with an achievement score of</text>

      <text x={590} y={425} textAnchor="middle" fontSize="62" fontWeight="700" fill={accentColor} fontFamily="Cinzel,serif">{score}%</text>
      {score >= 90 && (
        <>
          <rect x={680} y={406} width={125} height={22} rx="11" fill={accentColor}/>
          <text x={742} y={421} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#ffffff" fontFamily="Cinzel,serif" letterSpacing="1">WITH DISTINCTION</text>
        </>
      )}

      <line x1={390} y1={445} x2={580} y2={445} stroke={goldMid} strokeWidth="0.75" opacity="0.5"/>
      <rect x={585} y={440} width={10} height={10} fill={goldMid} transform="rotate(45 590 445)"/>
      <line x1={600} y1={445} x2={800} y2={445} stroke={goldMid} strokeWidth="0.75" opacity="0.5"/>

      <rect x={415} y={453} width={350} height={42} rx="8" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.45"/>
      <text x={590} y={468} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="2">CERTIFICATE ID</text>
      <text x={590} y={485} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1a1a2e" fontFamily="Courier New,monospace" letterSpacing="0.8">{cert.certificateId || 'N/A'}</text>

      {/* ✅ Level + Date + Address — same row, address force fit */}
      <text x={460} y={513} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="1.5">LEVEL</text>
      <text x={460} y={528} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a1a2e" fontFamily="Cinzel,serif">{(cert.level||'BASIC').toUpperCase()}</text>

      <text x={600} y={513} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="1.5">DATE</text>
      <text x={600} y={528} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a1a2e" fontFamily="Cinzel,serif">{cert.date || ''}</text>

      {/* ✅ ADDRESS — textLength force fit, never overlaps QR */}
      <text x={780} y={513} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={goldDark} fontFamily="Cinzel,serif" letterSpacing="1.5">ADDRESS</text>
      <text x={780} y={528} textAnchor="middle" textLength="220" lengthAdjust="spacingAndGlyphs" fontSize="10" fontWeight="700" fill="#1a1a2e" fontFamily="Cinzel,serif">{addressText}</text>

      {/* Signature — untouched */}
      <image href={SIG_URL} x={500} y={554} width={220} height={60} preserveAspectRatio="xMidYMax meet" style={{ mixBlendMode: 'multiply' }}/>
      <line x1={560} y1={590} x2={650} y2={590} stroke="#999" strokeWidth="0.7"/>
      <text x={600} y={602} textAnchor="middle" fontSize="8" fontWeight="600" fill="#777" fontFamily="Cinzel,serif" letterSpacing="2.5">SIGNATURE</text>
      <text x={600} y={614} textAnchor="middle" fontSize="6.5" fill="#aaa" fontFamily="Cinzel,serif" letterSpacing="0.8">FOUNDER &amp; CEO, PYSKILL · @code_with_06</text>

      {/* QR — untouched */}
      <rect x={W-138} y={510} width={116} height={116} fill="#fff" rx="6" stroke={accentColor} strokeWidth="2"/>
      <QRImage value={verifyUrl} x={W-135} y={513} size={110} color={leftBg}/>
      <text x={W-80} y={638} textAnchor="middle" fontSize="7" fill={accentColor} fontFamily="Cinzel,serif" letterSpacing="1" fontWeight="700">SCAN TO VERIFY</text>
      <text x={W-80} y={649} textAnchor="middle" fontSize="6.5" fill="#888" fontFamily="Cinzel,serif">All details inside</text>

      <rect x={374} y={660} width={W-390} height={46} rx="4" fill={accentColor} opacity="0.05"/>
      <line x1={378} y1={660} x2={W-20} y2={660} stroke={accentColor} strokeWidth="0.8" opacity="0.35"/>
      <text x={590} y={678} textAnchor="middle" fontSize="7.5" fill="#666" fontFamily="Cinzel,serif" letterSpacing="0.2">This certificate confirms that the above-named individual has passed PySkill&apos;s proctored Python test</text>
      <text x={590} y={694} textAnchor="middle" fontSize="7.5" fill="#666" fontFamily="Cinzel,serif" letterSpacing="0.2">under strict anti-cheat monitoring. Valid for resume, LinkedIn &amp; portfolio. Verified at faizupyzone.shop</text>
    </svg>
  );
}

function DetailCard({ icon, label, value, accent, delay = 0 }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '18px 22px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      border: '1px solid #f0f0f0',
      animation: `slideUp 0.5s ease ${delay}s both`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"Cinzel", serif', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1.3, wordBreak: 'break-word' }}>{value || '—'}</div>
      </div>
    </div>
  );
}

function SkillBadge({ skill, accent, index }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      background: '#fff',
      border: `1.5px solid ${accent}30`,
      borderRadius: 100,
      fontSize: 13, fontWeight: 600,
      color: '#333',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      animation: `slideUp 0.4s ease ${0.05 * index}s both`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, display: 'inline-block', flexShrink: 0 }}/>
      {skill}
    </div>
  );
}

function ScoreRing({ score, accent }) {
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={70} cy={70} r={r} fill="none" stroke="#f0f0f0" strokeWidth={10}/>
      <circle cx={70} cy={70} r={r} fill="none" stroke={accent} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round"/>
      <text x={70} y={66} textAnchor="middle" fontSize={28} fontWeight={700} fill={accent} fontFamily="Cinzel, serif">{score}%</text>
      <text x={70} y={84} textAnchor="middle" fontSize={10} fill="#999" fontFamily="Plus Jakarta Sans, sans-serif">Score</text>
    </svg>
  );
}

export default function VerifyCertificate({ certificateId, onBack }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!certificateId) return;
    const fetchCert = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'certificatesPublic'), where('certificateId', '==', certificateId));
        const snap = await getDocs(q);
        if (snap.empty) { setNotFound(true); setLoading(false); return; }
        setCert({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [certificateId]);

  const level = (cert?.level || 'basic').toLowerCase();
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.basic;
  const { accentColor, accentLight, goldMid, skills, leftBg, leftAccent } = cfg;

  const previewScale = Math.min((typeof window !== 'undefined' ? window.innerWidth - 48 : 800) / 1056, 0.85);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `PySkill Certificate — ${cert?.userName}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`Just earned my PySkill Python Certificate! 🐍🏆\nVerify it here:`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const keyframes = `
    @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 ${accentColor}40; } 50% { box-shadow:0 0 0 10px ${accentColor}00; } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  `;

  /* ── LOADING ── */
  if (loading) return (
    <>
      <style>{FONT_STYLE}{keyframes}</style>
      <div style={{ minHeight:'100vh', background:'#fafaf9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
        <div style={{ width:48, height:48, border:`3px solid #eee`, borderTopColor: '#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <p style={{ fontFamily:'"Cinzel",serif', fontSize:13, color:'#999', letterSpacing:2 }}>VERIFYING CERTIFICATE...</p>
      </div>
    </>
  );

  /* ── NOT FOUND ── */
  if (notFound || !cert) return (
    <>
      <style>{FONT_STYLE}{keyframes}</style>
      <div style={{ minHeight:'100vh', background:'#fafaf9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>🔍</div>
        <h1 style={{ fontFamily:'"Cinzel",serif', fontSize:22, color:'#111', margin:0, letterSpacing:1 }}>Certificate Not Found</h1>
        <p style={{ fontFamily:'"Plus Jakarta Sans",sans-serif', fontSize:14, color:'#888', textAlign:'center', maxWidth:380, lineHeight:1.7 }}>
          The certificate ID <strong style={{ color:'#333', fontFamily:'monospace' }}>{certificateId}</strong> does not exist in our records. Please check the QR code and try again.
        </p>
        <button onClick={onBack} style={{ marginTop:8, padding:'12px 28px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:10, fontFamily:'"Cinzel",serif', fontSize:12, fontWeight:600, letterSpacing:1.5, cursor:'pointer' }}>
          ← BACK TO PYSKILL
        </button>
      </div>
    </>
  );

  /* ── MAIN ── */
  return (
    <>
      <style>{FONT_STYLE}{keyframes}</style>
      <div style={{ minHeight:'100vh', background:'#f4f4f0', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>

        {/* ── TOP NAV ── */}
        <div style={{
          position:'sticky', top:0, zIndex:100,
          background:'rgba(255,255,255,0.92)',
          backdropFilter:'blur(20px)',
          borderBottom:'1px solid #ececec',
          padding:'14px 28px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <PythonLogo size={26}/>
            <span style={{ fontFamily:'"Cinzel",serif', fontSize:16, fontWeight:700, color:'#111', letterSpacing:1 }}>PYSKILL</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            {/* Trust badge */}
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#6b7280', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Blockchain-verified
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              background:'#ecfdf5', border:'1px solid #6ee7b7',
              borderRadius:100, padding:'6px 14px',
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 2s infinite' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#065f46', letterSpacing:1, fontFamily:'"Cinzel",serif' }}>VERIFIED</span>
            </div>
          </div>
        </div>

        {/* ── HERO BANNER ── */}
        <div style={{
          background: `linear-gradient(135deg, ${leftBg} 0%, ${leftAccent} 60%, ${leftBg} 100%)`,
          padding:'60px 24px 80px',
          textAlign:'center',
          position:'relative',
          overflow:'hidden',
        }}>
          {/* Subtle grid pattern */}
          <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(${goldMid}22 1px, transparent 1px)`, backgroundSize:'32px 32px', pointerEvents:'none' }}/>

          {/* Verified checkmark */}
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:'linear-gradient(135deg, #10b981, #059669)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 24px',
            boxShadow:'0 12px 40px rgba(16,185,129,0.45)',
            animation:'slideUp 0.5s ease both',
            position:'relative', zIndex:1,
          }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8, animation:'slideUp 0.5s ease 0.08s both', position:'relative', zIndex:1 }}>
            <PythonLogo size={24}/>
            <span style={{ fontFamily:'"Cinzel",serif', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:3 }}>PYSKILL</span>
          </div>

          <p style={{ fontFamily:'"Cinzel",serif', fontSize:11, color: cfg.goldMid, letterSpacing:3, margin:'0 0 12px', animation:'slideUp 0.5s ease 0.1s both', position:'relative', zIndex:1 }}>
            CERTIFICATE OF ACHIEVEMENT
          </p>

          <h1 style={{
            fontFamily:'"Cormorant Garamond",serif',
            fontSize:'clamp(28px, 6vw, 54px)',
            fontWeight:600, fontStyle:'italic',
            color:'#fff',
            margin:'0 0 10px',
            animation:'slideUp 0.5s ease 0.15s both',
            position:'relative', zIndex:1,
            lineHeight:1.1,
          }}>
            {cert.userName}
          </h1>

          <p style={{ fontFamily:'"Cinzel",serif', fontSize:12, color:accentLight, letterSpacing:2, margin:'0 0 20px', animation:'slideUp 0.5s ease 0.2s both', position:'relative', zIndex:1 }}>
            {cert.testName}
          </p>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap', position:'relative', zIndex:1 }}>
            <div style={{
              padding:'8px 22px',
              background:accentColor,
              borderRadius:100,
              fontFamily:'"Cinzel",serif',
              fontSize:10, fontWeight:700, color:'#fff', letterSpacing:2,
              animation:'slideUp 0.5s ease 0.25s both',
              boxShadow:`0 4px 16px ${accentColor}60`,
            }}>
              {cfg.badgeText}
            </div>
            <div style={{
              padding:'8px 22px',
              background:'rgba(255,255,255,0.12)',
              border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:100,
              fontFamily:'"Cinzel",serif',
              fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.8)', letterSpacing:2,
              animation:'slideUp 0.5s ease 0.3s both',
            }}>
              🏆 {cert.score ?? 0}% SCORE
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ maxWidth:880, margin:'0 auto', padding:'0 20px 60px' }}>

          {/* Score + cert ID card */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'auto 1fr',
            gap:24,
            background:'#fff',
            borderRadius:24,
            padding:'28px 32px',
            marginTop:-32,
            boxShadow:'0 8px 40px rgba(0,0,0,0.1)',
            border:'1px solid #f0f0f0',
            animation:'slideUp 0.5s ease 0.3s both',
          }}>
            <ScoreRing score={cert.score ?? 0} accent={accentColor}/>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:12 }}>
              {cert.score >= 90 && (
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  background:'#fef3c7', border:'1px solid #fbbf24',
                  borderRadius:100, padding:'4px 14px',
                  fontSize:10, fontWeight:700, color:'#92400e',
                  fontFamily:'"Cinzel",serif', letterSpacing:1,
                  width:'fit-content',
                }}>⭐ WITH DISTINCTION</div>
              )}
              <div>
                <div style={{ fontSize:10, color:'#aaa', fontFamily:'"Cinzel",serif', letterSpacing:1.5, marginBottom:4 }}>CERTIFICATE ID</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#111', fontFamily:'Courier New,monospace', letterSpacing:0.5, wordBreak:'break-all' }}>{cert.certificateId}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#ecfdf5', borderRadius:100, width:'fit-content' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                <span style={{ fontSize:12, color:'#059669', fontWeight:700, fontFamily:'"Cinzel",serif', letterSpacing:0.5 }}>Authentic &amp; Verified by PySkill</span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:14 }}>
            <DetailCard icon="👤" label="Student Name"  value={cert.userName}                          accent={accentColor} delay={0.35}/>
            <DetailCard icon="📅" label="Issue Date"    value={cert.date}                             accent={accentColor} delay={0.4}/>
            <DetailCard icon="📝" label="Test Name"     value={cert.testName}                         accent={accentColor} delay={0.45}/>
            <DetailCard icon="🏆" label="Level"         value={(cert.level||'Basic').toUpperCase()}   accent={accentColor} delay={0.5}/>
            <DetailCard icon="📊" label="Score"         value={`${cert.score ?? 0}%`}                accent={accentColor} delay={0.55}/>
            <DetailCard icon="📍" label="Address"       value={cert.userAddress || 'India'}           accent={accentColor} delay={0.6}/>
          </div>

          {/* Trust indicators */}
          <div style={{
            marginTop:20,
            background:'#fff',
            borderRadius:20,
            padding:'22px 28px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            border:'1px solid #f0f0f0',
            animation:'slideUp 0.5s ease 0.65s both',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:22, background:accentColor, borderRadius:2 }}/>
              <h2 style={{ margin:0, fontFamily:'"Cinzel",serif', fontSize:13, fontWeight:700, color:'#111', letterSpacing:1.5 }}>CERTIFICATE AUTHENTICITY</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
              {[
                { icon:'🔒', text:'Anti-cheat monitored', color:'#6366f1' },
                { icon:'✅', text:'PySkill certified', color:'#10b981' },
                { icon:'📋', text:'Resume & LinkedIn valid', color:'#f59e0b' },
                { icon:'🔗', text:'Permanently verifiable', color:'#8b5cf6' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#fafaf9', borderRadius:10, border:'1px solid #f0f0f0' }}>
                  <span style={{ fontSize:18 }}>{item.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'#444', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills covered */}
          <div style={{
            marginTop:20,
            background:'#fff',
            borderRadius:20,
            padding:'22px 28px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            border:'1px solid #f0f0f0',
            animation:'slideUp 0.5s ease 0.7s both',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:22, background:accentColor, borderRadius:2 }}/>
              <h2 style={{ margin:0, fontFamily:'"Cinzel",serif', fontSize:13, fontWeight:700, color:'#111', letterSpacing:1.5 }}>SKILLS COVERED</h2>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
              {skills.map((s, i) => <SkillBadge key={i} skill={s} accent={accentColor} index={i}/>)}
            </div>
          </div>

          {/* Certificate preview */}
          <div style={{
            marginTop:20,
            background:'#fff',
            borderRadius:20,
            overflow:'hidden',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            border:'1px solid #f0f0f0',
            animation:'slideUp 0.5s ease 0.75s both',
          }}>
            <button onClick={() => setShowPreview(p => !p)} style={{
              width:'100%', padding:'20px 28px',
              background:'none', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:3, height:22, background:accentColor, borderRadius:2 }}/>
                <span style={{ fontFamily:'"Cinzel",serif', fontSize:13, fontWeight:700, color:'#111', letterSpacing:1.5 }}>CERTIFICATE PREVIEW</span>
              </div>
              <span style={{ fontSize:20, color:'#aaa', transform:showPreview ? 'rotate(180deg)' : 'none', transition:'transform 0.3s' }}>⌄</span>
            </button>
            {showPreview && (
              <div style={{ padding:'0 20px 24px', overflowX:'auto' }}>
                <div style={{
                  transform:`scale(${previewScale})`,
                  transformOrigin:'top left',
                  width:1056, height:748,
                  borderRadius:12, overflow:'hidden',
                  boxShadow:'0 8px 40px rgba(0,0,0,0.12)',
                }}>
                  <CertSVG cert={cert}/>
                </div>
                <div style={{ height:748 * previewScale }}/>
              </div>
            )}
          </div>

          {/* Share buttons */}
          <div style={{
            marginTop:20,
            background:'#fff',
            borderRadius:20,
            padding:'22px 28px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            border:'1px solid #f0f0f0',
            animation:'slideUp 0.5s ease 0.8s both',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:22, background:accentColor, borderRadius:2 }}/>
              <h2 style={{ margin:0, fontFamily:'"Cinzel",serif', fontSize:13, fontWeight:700, color:'#111', letterSpacing:1.5 }}>SHARE THIS CERTIFICATE</h2>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button onClick={handleShare} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'12px 22px',
                background:accentColor, border:'none', borderRadius:12,
                color:'#fff', fontSize:13, fontWeight:700,
                fontFamily:'"Cinzel",serif', letterSpacing:1,
                cursor:'pointer',
                boxShadow:`0 4px 16px ${accentColor}50`,
              }}>
                {copied ? '✅ COPIED!' : '🔗 COPY LINK'}
              </button>
              <button onClick={handleLinkedIn} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'12px 22px',
                background:'#0a66c2', border:'none', borderRadius:12,
                color:'#fff', fontSize:13, fontWeight:700,
                fontFamily:'"Cinzel",serif', letterSpacing:1,
                cursor:'pointer',
                boxShadow:'0 4px 16px rgba(10,102,194,0.35)',
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LINKEDIN
              </button>
              <button onClick={handleTwitter} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'12px 22px',
                background:'#111', border:'none', borderRadius:12,
                color:'#fff', fontSize:13, fontWeight:700,
                fontFamily:'"Cinzel",serif', letterSpacing:1,
                cursor:'pointer',
                boxShadow:'0 4px 16px rgba(0,0,0,0.25)',
              }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                POST ON X
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop:36, textAlign:'center', animation:'slideUp 0.5s ease 0.85s both' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8 }}>
              <PythonLogo size={18}/>
              <p style={{ margin:0, fontSize:12, color:'#bbb', fontFamily:'"Cinzel",serif', letterSpacing:1 }}>ISSUED BY PYSKILL · FAIZUPYZONE.SHOP</p>
            </div>
            <p style={{ fontSize:11, color:'#ccc', fontFamily:'"Plus Jakarta Sans",sans-serif', marginTop:4, lineHeight:1.6 }}>
              This certificate is digitally verified and permanently stored.<br/>Scan the QR code on the certificate to re-verify at any time.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}