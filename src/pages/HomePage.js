// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Shield, Zap, BookOpen, Star } from 'lucide-react';
import { useTheme, useAuth } from '../App';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';

/* ─────────────────────────────────────────
   PYTHON OFFICIAL LOGO SVG
───────────────────────────────────────── */
function PythonLogo({ size = 24, style = {} }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255"
      width={size} height={size} style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}>
      <defs>
        <linearGradient id="plBlue" x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%" gradientUnits="percentageUnits">
          <stop offset="0%" stopColor="#387EB8"/>
          <stop offset="100%" stopColor="#366994"/>
        </linearGradient>
        <linearGradient id="plYellow" x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%" gradientUnits="percentageUnits">
          <stop offset="0%" stopColor="#FFE052"/>
          <stop offset="100%" stopColor="#FFC331"/>
        </linearGradient>
      </defs>
      <path fill="#4584B6" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
      <path fill="#FFDE57" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────
   HOOKS
───────────────────────────────────────── */
function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────
   FLOATING PARTICLES BACKGROUND
───────────────────────────────────────── */
function FloatingParticles({ isDark }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.5,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.5 + 0.1,
      color: ['#6366f1','#ec4899','#22c55e','#3b82f6','#f59e0b'][Math.floor(Math.random()*5)],
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.o * 255).toString(16).padStart(2,'0');
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [isDark]);
  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0, opacity: isDark ? 0.45 : 0.22,
    }} />
  );
}

/* ─────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────── */
function ScrollProgressBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const d = document.documentElement;
      setP(d.scrollHeight - d.clientHeight > 0 ? (d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100 : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3.5px', zIndex: 9999 }}>
      <div style={{
        height: '100%', width: `${p}%`,
        background: 'linear-gradient(90deg,#22c55e,#3b82f6,#a855f7,#f97316)',
        transition: 'width 0.1s linear',
        boxShadow: '0 0 8px rgba(99,102,241,0.6)',
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────
   LIVE COUNTER — animated number
───────────────────────────────────────── */
function LiveCounter({ end, suffix = '', label, color }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useScrollReveal(0.1);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(end / 60);
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); }
      else setCount(start);
    }, 20);
    return () => clearInterval(t);
  }, [visible, end]);
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '8px 16px' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: '900', color, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'inherit', opacity: 0.6, marginTop: '3px' }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────
   STATS BAR
───────────────────────────────────────── */
function StatsBar({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const stats = [
    { end: 1200, suffix: '+', label: 'Students', color: '#6366f1' },
    { end: 98,   suffix: '%', label: 'Pass Rate', color: '#22c55e' },
    { end: 3,    suffix: '',  label: 'Test Levels', color: '#f59e0b' },
    { end: 24,   suffix: '/7',label: 'Support', color: '#ec4899' },
  ];
  return (
    <section ref={ref} style={{
      padding: isMobile ? '0 16px 28px' : '0 24px 40px',
      maxWidth: '960px', margin: '0 auto',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
        gap: isMobile ? '10px' : '14px',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.9)',
            borderRadius: '16px',
            padding: '6px 0',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(99,102,241,0.06)',
            animation: visible ? `statPop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both` : 'none',
          }}>
            <LiveCounter end={s.end} suffix={s.suffix} label={s.label} color={s.color} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   BASE CARD + SECTION LABEL
───────────────────────────────────────── */
const baseCard = (isDark, extra = {}) => ({
  background: isDark ? 'rgba(15,23,42,0.9)' : '#fff',
  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8eaf0',
  borderRadius: '20px',
  ...extra,
});

function SectionLabel({ color, text }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: '50px', padding: '4px 14px', marginBottom: '10px',
      fontSize: '0.68rem', fontWeight: '800', color, letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        display: 'inline-block', animation: 'pulse 1.4s infinite',
      }} />
      {text}
    </div>
  );
}

/* ─────────────────────────────────────────
   ACTION CARD — with ripple effect
───────────────────────────────────────── */
function ActionCard({ card, isDark, isMobile, onClick }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      onTouchStart={() => setPress(true)} onTouchEnd={() => setPress(false)}
      style={{
        background: isDark
          ? hov ? `rgba(255,255,255,0.1)` : 'rgba(255,255,255,0.06)'
          : hov ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: hov
          ? `1.5px solid ${card.c}50`
          : isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.8)',
        borderRadius: '18px',
        padding: isMobile ? '14px 6px 12px' : '20px 10px 16px',
        cursor: 'pointer', outline: 'none', width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        transform: press ? 'scale(0.91)' : hov ? 'translateY(-5px) scale(1.02)' : 'none',
        boxShadow: press
          ? `0 0 0 3px ${card.c}30`
          : hov
          ? `0 12px 32px ${card.glow}, 0 0 0 1.5px ${card.c}30`
          : isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        minHeight: isMobile ? '80px' : '96px',
        position: 'relative', overflow: 'hidden',
      }}>
      {/* ripple effects */}
      {ripples.map(rp => (
        <span key={rp.id} style={{
          position: 'absolute', left: rp.x, top: rp.y,
          width: '4px', height: '4px',
          background: card.c, borderRadius: '50%', opacity: 0.6,
          transform: 'translate(-50%,-50%)',
          animation: 'rippleOut 0.6s ease-out forwards',
          pointerEvents: 'none',
        }} />
      ))}
      {/* subtle top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
        background: `linear-gradient(90deg,transparent,${card.c}60,transparent)`,
        opacity: hov ? 1 : 0, transition: 'opacity 0.2s',
      }} />
      {/* icon */}
      <div style={{
        width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px',
        borderRadius: '14px',
        background: `linear-gradient(135deg,${card.c}25,${card.c}10)`,
        border: `1px solid ${card.c}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? '1.3rem' : '1.5rem',
        transform: hov ? 'scale(1.1) rotate(-6deg)' : 'scale(1)',
        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hov ? `0 4px 16px ${card.glow}` : 'none',
        flexShrink: 0,
      }}>{card.icon}</div>
      {/* label */}
      <span style={{
        fontSize: isMobile ? '0.63rem' : '0.71rem', fontWeight: '800',
        color: hov ? card.c : isDark ? '#e2e8f0' : '#1e293b',
        transition: 'color 0.15s', textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.01em',
      }}>{card.label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────
   MOCK TEST SECTION — with pulse on FREE badge
───────────────────────────────────────── */
function MockTestSection({ isDark, isMobile, setCurrentPage }) {
  const [ref, visible] = useScrollReveal();
  const [hovIdx, setHovIdx] = useState(null);

  const levels = [
    {
      emoji: '🌱', level: 'Basic', q: '60 Qs', t: '60 Min',
      pill: 'FREE 🆓', pillBg: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7', pillTc: '#16a34a',
      bg1: isDark ? 'rgba(34,197,94,0.12)' : '#f0fdf4', bg2: isDark ? 'rgba(34,197,94,0.06)' : '#dcfce7',
      border: isDark ? 'rgba(34,197,94,0.3)' : '#86efac', nameColor: '#16a34a',
      descColor: isDark ? '#86efac' : '#166534', barBg: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
      isFree: true,
    },
    {
      emoji: '🔥', level: 'Advanced', q: '60 Qs', t: '120 Min',
      pill: 'HOT 🔥', pillBg: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe', pillTc: '#1d4ed8',
      bg1: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff', bg2: isDark ? 'rgba(59,130,246,0.06)' : '#dbeafe',
      border: isDark ? 'rgba(59,130,246,0.3)' : '#93c5fd', nameColor: '#3b82f6',
      descColor: isDark ? '#93c5fd' : '#1e40af', barBg: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
      isFree: false,
    },
    {
      emoji: '⭐', level: 'Pro', q: '60 Qs', t: '180 Min',
      pill: 'PRO ⭐', pillBg: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7', pillTc: '#b45309',
      bg1: isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb', bg2: isDark ? 'rgba(245,158,11,0.06)' : '#fef3c7',
      border: isDark ? 'rgba(245,158,11,0.3)' : '#fcd34d', nameColor: '#f59e0b',
      descColor: isDark ? '#fcd34d' : '#92400e', barBg: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
      isFree: false,
    },
  ];

  return (
    <section ref={ref} style={{
      padding: isMobile ? '0 16px 36px' : '0 24px 52px',
      maxWidth: '960px', margin: '0 auto',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(22px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '14px' : '20px' }}>
        <span style={{ fontSize: '1rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#111827', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <PythonLogo size={22} /> Mock Tests
        </span>
        <span onClick={() => setCurrentPage('mocktests')} style={{ fontSize: '0.72rem', fontWeight: '700', color: '#22c55e', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          View All →
        </span>
      </div>

      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? '10px' : '14px',
        overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '4px' : '0',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', marginBottom: '14px',
      }}>
        {levels.map((lvl, i) => (
          <div key={i} onClick={() => setCurrentPage('mocktests')}
            onMouseEnter={() => setHovIdx(i)}
            onMouseLeave={() => setHovIdx(null)}
            style={{
              flexShrink: isMobile ? 0 : undefined, width: isMobile ? '150px' : 'auto',
              borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
              background: `linear-gradient(150deg,${lvl.bg1},${lvl.bg2})`,
              border: `1.5px solid ${hovIdx === i ? lvl.nameColor + '80' : lvl.border}`,
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: hovIdx === i
                ? `0 16px 40px ${lvl.nameColor}30, 0 0 0 1px ${lvl.nameColor}20`
                : isDark ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
              transform: hovIdx === i ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              animation: visible ? `cardSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s both` : 'none',
            }}>
            <div style={{ padding: '18px 14px 12px', position: 'relative' }}>
              {/* FREE badge pulses */}
              <div style={{
                position: 'absolute', top: '11px', right: '11px',
                fontSize: '0.52rem', fontWeight: '800', padding: '3px 8px',
                borderRadius: '50px', background: lvl.pillBg, color: lvl.pillTc,
                animation: lvl.isFree ? 'freePulse 2s ease-in-out infinite' : 'none',
                boxShadow: lvl.isFree ? `0 0 0 0 ${lvl.nameColor}40` : 'none',
              }}>{lvl.pill}</div>
              <span style={{
                fontSize: '2rem', marginBottom: '8px', display: 'block',
                animation: `wig 2.5s ease-in-out ${i * 0.8}s infinite`,
              }}>{lvl.emoji}</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '900', marginBottom: '3px', color: lvl.nameColor }}>{lvl.level}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, lineHeight: 1.5, color: lvl.descColor }}>
                {lvl.q} · {lvl.t} · {i === 0 ? 'Beginner' : i === 1 ? 'Expert' : 'Master'}
              </div>
            </div>
            <div style={{
              padding: '9px 14px', fontSize: '0.65rem', fontWeight: '800',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: lvl.barBg, color: lvl.nameColor,
            }}>
              <span>{lvl.isFree ? '🆓 Free!' : 'Start Now!'}</span>
              <span style={{ transform: hovIdx === i ? 'translateX(3px)' : 'translateX(0)', transition: 'transform 0.2s' }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* security chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
        {[{ dot: '#22c55e', label: 'Anti-Cheat' }, { dot: '#eab308', label: 'Tab Block' }, { dot: '#3b82f6', label: 'Fullscreen' }, { dot: '#a855f7', label: 'Cert 55%+' }].map((c, i) => (
          <div key={i} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
            background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0',
            borderRadius: '50px', padding: '5px 11px',
            fontSize: '0.64rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#6b7280',
            animation: `chipSlide 0.4s ease ${i * 0.07}s both`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', animation: 'ldPulse 1.5s ease-in-out infinite' }} />
            {c.label}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   TOP CARD
───────────────────────────────────────── */
function TopCard({ isDark, isMobile, medal, data, isFirst, delay, onClick }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      onTouchStart={() => setPress(true)} onTouchEnd={() => setPress(false)}
      style={{
        borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
        background: isDark ? 'rgba(15,23,42,0.95)' : '#fff',
        border: (hov || press)
          ? `1.5px solid ${medal.color}60`
          : isDark ? `1px solid ${medal.color}25` : `1px solid ${medal.color}30`,
        boxShadow: press
          ? `0 0 0 3px ${medal.glow}, 0 8px 30px ${medal.glow}`
          : hov
          ? `0 16px 48px ${medal.glow}, 0 0 0 1.5px ${medal.color}40`
          : isFirst
          ? `0 8px 32px ${medal.glow}, 0 0 0 1px ${medal.color}30`
          : isDark ? '0 4px 16px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.07)',
        transform: press ? 'scale(0.96)' : hov ? 'translateY(-6px) scale(1.02)' : isFirst ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        animation: `cardEnter 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both`,
        position: 'relative',
      }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg,${medal.color},${medal.color}60,transparent)` }} />
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: `radial-gradient(circle,${medal.glow},transparent 70%)`,
        pointerEvents: 'none', opacity: hov ? 0.8 : 0.4, transition: 'opacity 0.2s',
      }} />
      <div style={{ padding: isMobile ? '14px 12px' : '18px 16px', textAlign: 'center', position: 'relative' }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '2.6rem', lineHeight: 1, marginBottom: '6px',
          animation: isFirst ? 'medalFloat 2.5s ease-in-out infinite' : 'none',
          filter: `drop-shadow(0 4px 12px ${medal.glow})`,
        }}>{medal.emoji}</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: `${medal.color}18`, border: `1px solid ${medal.color}35`,
          borderRadius: '50px', padding: '2px 10px', marginBottom: '8px',
        }}>
          <span style={{ fontSize: '0.55rem', fontWeight: '900', color: medal.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{medal.label}</span>
        </div>
        <div style={{
          fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: '900',
          color: medal.color, lineHeight: 1, marginBottom: '6px',
          textShadow: hov ? `0 0 20px ${medal.glow}` : 'none', transition: 'text-shadow 0.2s',
          animation: 'scoreIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>{data.score}%</div>
        <div style={{ fontSize: isMobile ? '0.78rem' : '0.88rem', fontWeight: '800', color: isDark ? '#e2e8f0' : '#111827', marginBottom: '3px', animation: 'fadeSlide 0.4s ease both' }}>
          {data.name}
        </div>
        <div style={{ fontSize: isMobile ? '0.6rem' : '0.66rem', color: isDark ? '#6b7280' : '#9ca3af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
          <PythonLogo size={12} /> {data.test}
        </div>
        {data.time && (
          <div style={{ marginTop: '8px', fontSize: '0.6rem', fontWeight: '700', color: isDark ? '#475569' : '#9ca3af', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0', borderRadius: '20px', padding: '2px 8px', display: 'inline-block' }}>
            ⏱ {data.time}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TOP RANKERS
───────────────────────────────────────── */
const LB_NAMES  = [['Aryan S.','Zara K.','Mohd. F.'],['Priya R.','Ahmed N.','Sara L.'],['Rahul D.','Aisha M.','Kabir T.'],['Faizan T.','Neha G.','Raza M.']];
const LB_SCORES = [[96,91,87],[98,93,88],[94,89,84],[97,92,86]];
const LB_TESTS  = [['Python Pro','Python Basic','Advanced'],['Pro Test','Basic Test','Python Pro'],['Advanced','Pro Test','Basic Test'],['Python Pro','Advanced','Basic Test']];

function TopRankersSection({ isDark, isMobile, setCurrentPage }) {
  const [rankers, setRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lbIdx, setLbIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [ref, visible] = useScrollReveal();

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRankers(all.filter(e => (e.testLevel || '').toLowerCase().trim() !== 'neet' && e.passed)
          .sort((a, b) => b.percentage - a.percentage || a.timestamp - b.timestamp).slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (rankers.length > 0) return;
    const t = setInterval(() => {
      setLbIdx(prev => (prev + 1) % LB_NAMES.length);
      setAnimKey(prev => prev + 1);
    }, 4000);
    return () => clearInterval(t);
  }, [rankers.length]);

  const medals = [
    { emoji: '🥇', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', label: 'Champion',  rank: 1 },
    { emoji: '🥈', color: '#f97316', glow: 'rgba(249,115,22,0.5)',  label: 'Runner-up', rank: 2 },
    { emoji: '🥉', color: '#a855f7', glow: 'rgba(168,85,247,0.5)',  label: '3rd Place', rank: 3 },
  ];

  const displayData = rankers.length > 0
    ? rankers.map(r => ({ name: r.name, score: r.percentage, test: r.testTitle || 'Python Test', time: r.timeTaken || '' }))
    : LB_NAMES[lbIdx].map((name, i) => ({ name, score: LB_SCORES[lbIdx][i], test: LB_TESTS[lbIdx][i], time: '' }));

  return (
    <section ref={ref} style={{
      padding: isMobile ? '0 16px 48px' : '0 24px 64px',
      maxWidth: '960px', margin: '0 auto',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(22px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#111827', letterSpacing: '-0.02em' }}>🏆 Top Performers</div>
          <div style={{ fontSize: '0.72rem', color: isDark ? '#6b7280' : '#9ca3af', fontWeight: '600', marginTop: '2px' }}>
            {rankers.length > 0 ? 'Real students · Real scores' : 'Live cycling · Updated every 4s'}
          </div>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.62rem', fontWeight: '800', color: '#16a34a', background: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', border: '1.5px solid #86efac', padding: '5px 12px', borderRadius: '50px', cursor: 'pointer' }}
          onClick={() => setCurrentPage('leaderboard')}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'ldPulse 1s ease-in-out infinite' }} />
          LIVE
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#475569' : '#94a3b8' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(3,1fr)', gap: isMobile ? '8px' : '14px', marginBottom: '14px' }}>
          {[0, 1, 2].map(i => {
            const m = medals[i]; const d = displayData[i];
            if (!d) return null;
            return (
              <TopCard key={`${animKey}-${i}`} isDark={isDark} isMobile={isMobile}
                medal={m} data={d} isFirst={i === 0} delay={i * 0.06}
                onClick={() => setCurrentPage('leaderboard')} />
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts; const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now'; if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24); if (d < 7) return d + 'd ago';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ─────────────────────────────────────────
   REVIEW CARD
───────────────────────────────────────── */
function ReviewCard({ review, isDark, isMobile, isAdmin, user, onDeleteClick }) {
  const [comments, setComments] = useState([]);
  const [loadingCmts, setLoadingCmts] = useState(true);
  const [showCmts, setShowCmts] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [hov, setHov] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'studentReviews', review.id, 'comments'), orderBy('createdAt', 'asc')));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoadingCmts(false); }
  }, [review.id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const postComment = async () => {
    if (!commentText.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'studentReviews', review.id, 'comments'), {
        text: commentText.trim(),
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userPhoto: user.photoURL || '', userId: user.uid, createdAt: Date.now(),
      });
      setCommentText(''); await fetchComments(); setShowCmts(true);
    } catch { window.showToast?.('❌ Comment failed', 'error'); }
    finally { setPosting(false); }
  };

  const stars = review.stars || 5;
  const palettes = [
    { from: '#6366f1', to: '#8b5cf6' },
    { from: '#10b981', to: '#0ea5e9' },
    { from: '#f59e0b', to: '#ef4444' },
    { from: '#ec4899', to: '#a855f7' },
    { from: '#3b82f6', to: '#6366f1' },
    { from: '#14b8a6', to: '#6366f1' },
  ];
  const pal = palettes[(review.name?.charCodeAt(0) || 0) % palettes.length];
  const igHandle = review.instagram ? review.instagram.replace(/^@/, '') : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: '20px', overflow: 'hidden',
        background: isDark ? '#0f172a' : '#ffffff',
        border: hov
          ? `1.5px solid ${pal.from}55`
          : isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: hov
          ? `0 24px 64px ${pal.from}22, 0 0 0 1px ${pal.from}22`
          : isDark ? '0 2px 16px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
      }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${pal.from}, ${pal.to})` }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: `radial-gradient(circle at top right, ${pal.from}0d, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ padding: isMobile ? '16px 14px 12px' : '20px 20px 14px', position: 'relative' }}>
        {isAdmin && (
          <button onClick={onDeleteClick} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '3px 9px', fontSize: '0.62rem', fontWeight: '800', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
        )}

        <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`, overflow: 'hidden', boxShadow: `0 6px 20px ${pal.from}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {review.photo
                ? <img src={review.photo} alt={review.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                : <span style={{ color: '#fff', fontWeight: '900', fontSize: isMobile ? '1.2rem' : '1.4rem', fontFamily: 'system-ui' }}>{(review.name || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: '2px solid ' + (isDark ? '#0f172a' : '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(59,130,246,0.6)' }}>
              <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{review.name}</span>
            </div>
            {igHandle && (
              <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px 3px 7px', borderRadius: '20px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', textDecoration: 'none', marginBottom: '5px', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>
                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#fff', letterSpacing: '0.2px' }}>{igHandle}</span>
              </a>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginBottom: '6px' }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="13" height="13" viewBox="0 0 24 24"
                  fill={s <= stars ? '#f59e0b' : 'none'}
                  stroke={s <= stars ? '#f59e0b' : isDark ? '#1e293b' : '#e2e8f0'}
                  strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              ))}
              <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#f59e0b', marginLeft: '4px' }}>{stars}.0</span>
              <span style={{ fontSize: '0.62rem', color: isDark ? '#334155' : '#cbd5e1', margin: '0 4px' }}>·</span>
              <span style={{ fontSize: '0.65rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: '500' }}>{timeAgo(review.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {review.course && <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: isDark ? `${pal.from}20` : `${pal.from}12`, color: pal.from, border: `1px solid ${pal.from}30` }}>🎓 {review.course}</span>}
              {review.address && <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.07)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>📍 {review.address}</span>}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', background: isDark ? 'rgba(255,255,255,0.03)' : `${pal.from}08`, borderRadius: '12px', padding: '12px 14px 12px 16px', marginBottom: '12px', borderLeft: `3px solid ${pal.from}` }}>
          <span style={{ position: 'absolute', top: '-6px', left: '10px', fontSize: '2.2rem', lineHeight: 1, color: pal.from, fontFamily: 'Georgia, serif', opacity: 0.35, pointerEvents: 'none' }}>"</span>
          <p style={{ margin: 0, fontSize: isMobile ? '0.82rem' : '0.875rem', color: isDark ? '#cbd5e1' : '#374151', lineHeight: 1.72, fontWeight: '500', fontStyle: 'italic', paddingTop: '4px' }}>{review.text}</p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '8px', padding: '3px 9px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
          <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#10b981', letterSpacing: '0.4px' }}>Verified PySkill Student</span>
        </div>
      </div>

      <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)', padding: isMobile ? '10px 14px 13px' : '10px 20px 14px' }}>
        {!loadingCmts && comments.length > 0 && (
          <button onClick={() => setShowCmts(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', color: pal.from, padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.6rem' }}>{showCmts ? '▲' : '▼'}</span>
            {showCmts ? 'Hide' : 'View'} {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </button>
        )}
        {showCmts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: `${pal.from}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
                  {c.userPhoto ? <img src={c.userPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : '👤'}
                </div>
                <div style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '10px', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f0f4f8', padding: '6px 11px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isDark ? '#e2e8f0' : '#0f172a' }}>{c.userName}</span>
                    <span style={{ fontSize: '0.58rem', color: isDark ? '#334155' : '#94a3b8' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: isDark ? '#cbd5e1' : '#374151', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {user ? (
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: `${pal.from}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
              placeholder="Add a comment..."
              style={{ flex: 1, padding: '7px 13px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8edf3', borderRadius: '20px', fontSize: '0.76rem', fontWeight: '500', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#0f172a', outline: 'none' }}
            />
            <button onClick={postComment} disabled={posting || !commentText.trim()}
              style={{ padding: '7px 13px', borderRadius: '20px', background: commentText.trim() ? `linear-gradient(135deg,${pal.from},${pal.to})` : isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0', border: 'none', color: commentText.trim() ? '#fff' : isDark ? '#334155' : '#94a3b8', fontWeight: '800', fontSize: '0.7rem', cursor: commentText.trim() ? 'pointer' : 'default', transition: 'all 0.2s', boxShadow: commentText.trim() ? `0 3px 12px ${pal.from}40` : 'none' }}>
              {posting ? '...' : 'Post'}
            </button>
          </div>
        ) : <p style={{ margin: 0, fontSize: '0.68rem', color: isDark ? '#334155' : '#94a3b8' }}>🔐 Login to comment</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ADD REVIEW FORM
───────────────────────────────────────── */
function AddReviewForm({ isDark, isMobile, user, onSave, onCancel }) {
  const [form, setForm] = useState({ name: user?.displayName || '', address: '', course: '', text: '', stars: 5, instagram: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const h = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width: '100%', padding: '10px 14px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none', boxSizing: 'border-box' };
  const handleSave = async () => {
    if (!form.name.trim() || !form.text.trim()) { window.showToast?.('⚠️ Name and review required!', 'warning'); return; }
    if (!photoFile) { window.showToast?.('⚠️ Please add your photo!', 'warning'); return; }
    setSaving(true); let photoUrl = '';
    if (photoFile) {
      setUploading(true);
      try {
        const { uploadImage } = await import('../supabaseUpload');
        const r = await uploadImage(photoFile);
        if (r.success) photoUrl = r.url;
        else { window.showToast?.('❌ Upload failed', 'error'); setSaving(false); setUploading(false); return; }
      } catch { window.showToast?.('❌ Upload error', 'error'); setSaving(false); setUploading(false); return; }
      setUploading(false);
    }
    await onSave({ ...form, photo: photoUrl, userEmail: user?.email || '' }); setSaving(false);
  };
  return (
    <div style={{ marginTop: '20px', ...baseCard(isDark, { padding: isMobile ? '20px 16px' : '28px 24px', border: isDark ? '1px solid rgba(99,102,241,0.22)' : '1px solid rgba(99,102,241,0.18)' }) }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg,#6366f1,#ec4899)', borderRadius: '20px 20px 0 0', margin: isMobile ? '-20px -16px 20px' : '-28px -24px 24px' }} />
      <h3 style={{ fontSize: '0.96rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 16px' }}>✍️ Write Your Review</h3>
      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', border: isDark ? '1.5px dashed rgba(255,255,255,0.12)' : '1.5px dashed rgba(99,102,241,0.3)', marginBottom: '14px' }}>
        {photoPreview
          ? <><img src={photoPreview} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} /><span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#10b981' }}>✅ Photo selected</span></>
          : <><div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📷</div><span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#6366f1' }}>Add Your Photo *</span></>}
        <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (!f) return; setPhotoFile(f); const r = new FileReader(); r.onloadend = () => setPhotoPreview(r.result); r.readAsDataURL(f); }} style={{ display: 'none' }} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <input placeholder="Your Name *" value={form.name} onChange={h('name')} style={inp} />
        <input placeholder="City / Address" value={form.address} onChange={h('address')} style={inp} />
        <input placeholder="Course (e.g. Python Basic)" value={form.course} onChange={h('course')} style={inp} />
        <input placeholder="Instagram (e.g. @handle)" value={form.instagram} onChange={h('instagram')} style={inp} />
      </div>
      <textarea placeholder="Share your experience *" value={form.text} onChange={h('text')} rows={3} style={{ ...inp, resize: 'vertical', marginBottom: '12px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>Rating:</span>
        {[1,2,3,4,5].map(s => <button key={s} onClick={() => setForm(f => ({ ...f, stars: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }}><Star size={20} fill={s <= form.stars ? '#f59e0b' : 'none'} color={s <= form.stars ? '#f59e0b' : '#cbd5e1'} /></button>)}
        <span style={{ fontSize: '0.76rem', color: '#f59e0b', fontWeight: '700' }}>{form.stars}/5</span>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#ec4899)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {uploading ? '📤 Uploading...' : saving ? '⏳ Saving...' : '✅ Submit Review'}
        </button>
        <button onClick={onCancel} style={{ padding: '12px 20px', background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', borderRadius: '12px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   STUDENT REVIEWS
───────────────────────────────────────── */
const MAX_REVIEWS = 200;
function StudentReviews({ isDark, isMobile, isAdmin, user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ref, visible] = useScrollReveal();

  const fetchReviews = useCallback(async () => {
    try { const snap = await getDocs(collection(db, 'studentReviews')); setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, 'studentReviews', deleteTarget.id));
    window.showToast?.('✅ Deleted!', 'success'); setDeleteTarget(null); await fetchReviews();
  };

  const canAddMore = reviews.length < MAX_REVIEWS;
  if (!loading && reviews.length === 0 && !user) return null;

  return (
    <section id="student-reviews" ref={ref} style={{ padding: isMobile ? '0 16px 48px' : '0 24px 64px', maxWidth: '960px', margin: '0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(22px)', transition: 'opacity 0.55s ease, transform 0.55s ease' }}>
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ ...baseCard(isDark, { padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center' }) }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 8px' }}>Delete Review?</h3>
            <p style={{ fontSize: '0.84rem', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 20px' }}>Delete review by <strong>{deleteTarget.name}</strong>?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '11px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: 'none', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '36px' }}>
        <SectionLabel color="#10b981" text="Real Reviews" />
        <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', background: 'linear-gradient(135deg,#10b981,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '4px 0 4px', letterSpacing: '-0.02em' }}>What Students Say ⭐</h2>
        <p style={{ fontSize: '0.82rem', color: isDark ? '#64748b' : '#94a3b8', margin: 0 }}>Genuine feedback from real PySkill students{isAdmin && <span style={{ marginLeft: '8px', color: '#6366f1', fontWeight: '700' }}>({reviews.length}/{MAX_REVIEWS})</span>}</p>
      </div>
      {loading
        ? <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#475569' : '#94a3b8' }}>Loading...</div>
        : reviews.length === 0
          ? user && <div style={{ textAlign: 'center', padding: '36px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '16px', border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e2e8f0', color: isDark ? '#475569' : '#94a3b8', fontSize: '0.88rem' }}>No reviews yet. Be the first! 👇</div>
          : <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>
              {reviews.map((rev, i) => (
                <div key={rev.id} style={{ animation: visible ? `cardSlideUp 0.5s ease ${i * 0.06}s both` : 'none' }}>
                  <ReviewCard review={rev} isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} user={user} onDeleteClick={() => setDeleteTarget(rev)} />
                </div>
              ))}
            </div>
      }
      {user && canAddMore && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? 'transparent' : 'linear-gradient(135deg,#6366f1,#ec4899)', border: showForm ? isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e2e8f0' : 'none', color: showForm ? isDark ? '#94a3b8' : '#64748b' : '#fff', padding: '10px 28px', borderRadius: '50px', fontWeight: '700', fontSize: '0.86rem', cursor: 'pointer', boxShadow: showForm ? 'none' : '0 4px 16px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}>
            {showForm ? '✕ Cancel' : '✍️ Write a Review'}
          </button>
        </div>
      )}
      {isAdmin && !canAddMore && (
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '14px 20px', background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: isDark ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(34,197,94,0.25)', borderRadius: '14px', display: 'inline-block', margin: '20px auto 0' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: isDark ? '#86efac' : '#16a34a', fontWeight: '700' }}>✅ All 200 review spots are filled — Thank you everyone! 🎉</p>
        </div>
      )}
      {!user && reviews.length > 0 && <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.76rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: '600' }}>🔐 Login to write your own review</p>}
      {user && showForm && canAddMore && (
        <AddReviewForm isDark={isDark} isMobile={isMobile} user={user}
          onSave={async (data) => { await addDoc(collection(db, 'studentReviews'), { ...data, createdAt: Date.now() }); await fetchReviews(); setShowForm(false); window.showToast?.('✅ Review added!', 'success'); }}
          onCancel={() => setShowForm(false)} />
      )}
    </section>
  );
}

/* ─────────────────────────────────────────
   TIMELINE
───────────────────────────────────────── */
function Timeline({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const events = [
    { date: '1 Jan 2026',  title: 'The Idea',       desc: 'PySkill was born — a vision to give students quality Python study material at affordable prices.', icon: '💡', tag: 'ORIGIN', color: '#a78bfa' },
    { date: '10 Jan 2026', title: 'Work Begins',     desc: 'Development kicked off. Notes curated, questions filtered, platform designed from scratch.',       icon: '⚡', tag: 'BUILD',  color: '#6366f1' },
    { date: '15 Feb 2026', title: 'Website Live 🚀', desc: 'PySkill officially launched! First students enrolled, first certificates issued.',                 icon: '🚀', tag: 'LAUNCH', color: '#ec4899' },
  ];
  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 56px' : '0 24px 72px', maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
        <SectionLabel color="#6366f1" text="Our Story · 2026" />
        <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', background: 'linear-gradient(135deg,#1e40af,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '4px 0 4px', letterSpacing: '-0.02em' }}>From Idea to Reality</h2>
        <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Every milestone that brought PySkill to life</p>
      </div>
      <div style={{ position: 'relative', paddingLeft: isMobile ? '54px' : '68px' }}>
        <div style={{ position: 'absolute', left: isMobile ? '22px' : '28px', top: '14px', bottom: '14px', width: '2px', background: isDark ? 'linear-gradient(180deg,#a78bfa70,#6366f170,#ec489870)' : 'linear-gradient(180deg,#a78bfa40,#6366f140,#ec489840)', opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease 0.4s', borderRadius: '2px' }} />
        {events.map((evt, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: i < events.length - 1 ? (isMobile ? '28px' : '32px') : 0, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-18px)', transition: `opacity 0.45s ease ${0.25 + i * 0.15}s, transform 0.45s ease ${0.25 + i * 0.15}s` }}>
            <div style={{ position: 'absolute', left: isMobile ? '-40px' : '-52px', top: '12px', width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px', borderRadius: '50%', background: `linear-gradient(135deg,${evt.color},${i === 2 ? '#f472b6' : '#a78bfa'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1rem' : '1.2rem', boxShadow: `0 0 0 4px ${isDark ? '#0f172a' : '#f4f5ff'}, 0 0 0 6px ${evt.color}35`, zIndex: 2 }}>{evt.icon}</div>
            <div style={{ ...baseCard(isDark, { padding: isMobile ? '16px' : '20px 24px', overflow: 'hidden', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(99,102,241,0.07)' }) }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,${evt.color},transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: '900', color: evt.color, background: `${evt.color}18`, border: `1px solid ${evt.color}30`, borderRadius: '20px', padding: '2px 9px', letterSpacing: '0.1em' }}>{evt.tag}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8' }}>{evt.date}</span>
              </div>
              <h3 style={{ fontSize: isMobile ? '0.94rem' : '1.02rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#0f172a', margin: '0 0 5px' }}>{evt.title}</h3>
              <p style={{ fontSize: isMobile ? '0.78rem' : '0.83rem', color: isDark ? '#94a3b8' : '#475569', margin: 0, lineHeight: 1.65 }}>{evt.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FEATURES
───────────────────────────────────────── */
function FeaturesSection({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const features = [
    { icon: '📚', title: 'Quality Content',  desc: 'Expert-curated notes & filtered important questions for every topic.', color: '#6366f1' },
    { icon: '🔒', title: 'Secure & Safe',    desc: 'Razorpay-protected payments — UPI, Cards, Net Banking & more.',        color: '#10b981' },
    { icon: '⚡', title: 'Instant Download', desc: 'Get your PDFs the second your payment is confirmed.',                   color: '#ec4899' },
  ];
  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 36px' : '0 24px 52px', maxWidth: '960px', margin: '0 auto' }}>
      <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', textAlign: 'center', marginBottom: isMobile ? '20px' : '32px', color: isDark ? '#e2e8f0' : '#0f172a', letterSpacing: '-0.02em', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}>Why Students Love Us</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? '12px' : '16px' }}>
        {features.map((f, i) => (
          <div key={i} style={{ ...baseCard(isDark, { padding: isMobile ? '20px 18px' : '26px 22px', position: 'relative', overflow: 'hidden', boxShadow: isDark ? '0 3px 16px rgba(0,0,0,0.2)' : '0 3px 16px rgba(99,102,241,0.06)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transition: `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s` }) }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = isDark ? '0 12px 32px rgba(0,0,0,0.3)' : `0 12px 32px ${f.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 3px 16px rgba(0,0,0,0.2)' : '0 3px 16px rgba(99,102,241,0.06)'; }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: `linear-gradient(180deg,${f.color},${f.color}40)`, borderRadius: '20px 0 0 20px' }} />
            <div style={{ paddingLeft: '14px' }}>
              <div style={{ width: '46px', height: '46px', background: `${f.color}18`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', marginBottom: '14px', border: `1px solid ${f.color}28` }}>{f.icon}</div>
              <div style={{ fontSize: isMobile ? '0.92rem' : '0.97rem', fontWeight: '800', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: '6px' }}>{f.title}</div>
              <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   WHY PYSKILL
───────────────────────────────────────── */
function WhySection({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const items = [
    { icon: '📜', title: 'Our Policy',         desc: 'Genuine, quality-checked materials. No refund after download, but satisfaction guaranteed with preview.', color: '#6366f1' },
    { icon: '💳', title: 'Secure Payment',      desc: "Via Razorpay — India's most trusted gateway. UPI, Cards, Net Banking & Wallets. Fully encrypted.",       color: '#10b981' },
    { icon: '🎯', title: 'Why Choose Us',        desc: 'Instant access, lifetime downloads, mobile-friendly PDFs, expert content & 24/7 WhatsApp support.',       color: '#f59e0b' },
    { icon: '⭐', title: 'What Makes Us Better', desc: 'No outdated content. Every note filtered for importance. Real reviews, no hidden charges.',                color: '#8b5cf6' },
  ];
  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 36px' : '0 24px 52px', maxWidth: '960px', margin: '0 auto' }}>
      <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', textAlign: 'center', marginBottom: isMobile ? '20px' : '32px', background: 'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}>Why PySkill?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? '12px' : '16px' }}>
        {items.map((c, i) => (
          <div key={i} style={{ ...baseCard(isDark, { padding: isMobile ? '18px 16px' : '22px 22px', position: 'relative', overflow: 'hidden', boxShadow: isDark ? '0 3px 16px rgba(0,0,0,0.2)' : '0 3px 16px rgba(99,102,241,0.06)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transition: `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${i * 0.07}s` }) }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg,${c.color},${c.color}30,transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', background: `${c.color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: `1px solid ${c.color}25`, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <h3 style={{ fontSize: isMobile ? '0.9rem' : '0.96rem', fontWeight: '800', color: c.color, margin: '0 0 5px' }}>{c.title}</h3>
                <p style={{ fontSize: isMobile ? '0.77rem' : '0.82rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOUNDER
───────────────────────────────────────── */
function FounderSection({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 64px' : '0 24px 80px', maxWidth: '860px', margin: '0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '1rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#111827' }}>👨‍💻 Meet the Founder</span>
      </div>
      <div style={{ background: isDark ? 'linear-gradient(135deg,rgba(15,23,42,0.98),rgba(5,46,22,0.9))' : 'linear-gradient(135deg,#f0fdf4,#eff6ff)', border: isDark ? '1.5px solid rgba(34,197,94,0.25)' : '1.5px solid #86efac', borderRadius: '22px', padding: isMobile ? '20px 16px' : '22px 20px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(34,197,94,0.08)' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 36px rgba(34,197,94,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(34,197,94,0.08)'; }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#22c55e,#3b82f6,#a855f7)', backgroundSize: '200%', animation: 'shimmer 3s ease infinite' }} />
        <div style={{ display: 'flex', gap: isMobile ? '14px' : '18px', alignItems: 'center' }}>
          <div style={{ width: isMobile ? '68px' : '80px', height: isMobile ? '68px' : '80px', borderRadius: '50%', border: '3px solid #22c55e', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}>
            <img src="https://i.ibb.co/WWW1ttkx/Whats-App-Image-2026-01-31-at-1-57-14-PM.jpg" alt="Faizan Tariq" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '900', color: isDark ? '#f1f5f9' : '#111827', marginBottom: '2px' }}>Faizan Tariq</div>
            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: '800', marginBottom: '8px' }}>Software Engineering · ILS Srinagar</div>
            <div style={{ fontSize: isMobile ? '0.73rem' : '0.78rem', color: isDark ? '#94a3b8' : '#374151', lineHeight: 1.6, marginBottom: '12px', fontWeight: '600' }}>Built PySkill for students — because we are students too.</div>
            <a href="https://instagram.com/code_with_06" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg,#f093fb,#f5576c)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.73rem', fontWeight: '800', padding: '8px 16px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(240,147,251,0.35)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(240,147,251,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(240,147,251,0.35)'; }}>
              📸 Follow on Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────── */
export default function HomePage({ setCurrentPage }) {
  const [txt, setTxt] = useState('');
  const [idx, setIdx] = useState(0);
  const [del, setDel] = useState(false);
  const [pi, setPi] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mounted, setMounted] = useState(false);
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const isAdmin = user?.email === 'luckyfaizu3@gmail.com';

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);
  useEffect(() => {
    if (window.location.hash === '#student-reviews') {
      setTimeout(() => {
        const el = document.getElementById('student-reviews');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    }
  }, []);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h);
  }, []);

  const phrases = useRef([
    'Premium Study Notes', 'Master Python', 'Excel in Exams', 'Land Your Dream Job',
    '60 Questions Mock Tests', 'Anti-Cheat Exam System', 'Earn Your Certificate', 'Basic • Advanced • Pro'
  ]).current;

  useEffect(() => {
    const cp = phrases[pi]; const speed = del ? 22 : 65;
    const t = setTimeout(() => {
      if (!del && idx < cp.length) { setTxt(cp.substring(0, idx + 1)); setIdx(idx + 1); }
      else if (del && idx > 0) { setTxt(cp.substring(0, idx - 1)); setIdx(idx - 1); }
      else if (!del && idx === cp.length) { setTimeout(() => setDel(true), 1800); }
      else if (del && idx === 0) { setDel(false); setPi((pi + 1) % phrases.length); }
    }, speed);
    return () => clearTimeout(t);
  }, [idx, del, pi, phrases]);

  // ✅ Brain Trap REMOVED
  const actionCards = [
    { icon: '📚', label: 'Browse Notes',  page: 'products',    g: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,0.35)',  c: '#6366f1' },
    { icon: <PythonLogo size={22} />, label: 'Mock Tests', page: 'mocktests',   g: 'linear-gradient(135deg,#10b981,#34d399)', glow: 'rgba(16,185,129,0.35)',  c: '#10b981' },
    { icon: '💻', label: 'Compiler',      page: 'compiler',    g: 'linear-gradient(135deg,#0066b8,#0ea5e9)', glow: 'rgba(0,102,184,0.35)',   c: '#0066b8' },
    { icon: '🔥', label: '30-Day Streak', page: 'streak',      g: 'linear-gradient(135deg,#ff6b00,#ff3d00)', glow: 'rgba(255,107,0,0.35)',   c: '#ff6b00' },
    { icon: '📦', label: 'My Orders',     page: 'orders',      g: 'linear-gradient(135deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,0.35)',  c: '#f59e0b' },
    { icon: '🏆', label: 'Leaderboard',   page: 'leaderboard', g: 'linear-gradient(135deg,#8b5cf6,#d946ef)', glow: 'rgba(139,92,246,0.35)',  c: '#8b5cf6' },
    user
      ? { icon: '👤', label: 'Logout', page: null, g: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.35)', c: '#ef4444', action: logout }
      : { icon: '🔐', label: 'Login',  page: 'login', g: 'linear-gradient(135deg,#ec4899,#f472b6)', glow: 'rgba(236,72,153,0.35)', c: '#ec4899' },
  ];

  return (
    <main itemScope itemType="https://schema.org/WebPage"
      style={{ paddingTop: isMobile ? '62px' : '70px', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      <ScrollProgressBar />
      <FloatingParticles isDark={isDark} />

      {/* ══ HERO ══ */}
      <section style={{
        padding: isMobile ? '40px 20px 32px' : '88px 24px 68px',
        textAlign: 'center', position: 'relative',
        background: isDark
          ? 'linear-gradient(180deg,rgba(15,10,60,0.6) 0%,transparent 100%)'
          : 'linear-gradient(180deg,rgba(238,241,255,0.8) 0%,transparent 100%)',
      }}>
        {/* Animated badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.22)', borderRadius: '50px',
          padding: '6px 16px 6px 8px', marginBottom: isMobile ? '20px' : '28px',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          animation: mounted ? 'badgeFloat 3s ease-in-out infinite' : 'none',
        }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#6366f1,#ec4899)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🎓</div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6366f1' }}>PySkill</span>
          <div style={{ width: '1px', height: '12px', background: 'rgba(99,102,241,0.2)' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#a78bfa' : '#7c3aed' }}>EST. 2026</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.4s infinite' }} />
        </div>

        <h1 style={{
          fontSize: isMobile ? '2rem' : '3.8rem', fontWeight: '900', marginBottom: '12px',
          background: 'linear-gradient(135deg,#1e40af,#6366f1 45%,#ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1.12, minHeight: isMobile ? '54px' : '96px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 8px', letterSpacing: '-0.03em',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
        }}>
          {txt}
          <span style={{ borderRight: '3px solid #6366f1', animation: 'blink 0.7s infinite', marginLeft: '3px', height: isMobile ? '30px' : '56px', display: 'inline-block', verticalAlign: 'middle' }} />
        </h1>

        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.1rem', color: isDark ? '#94a3b8' : '#64748b',
          maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.7, fontWeight: '500',
          opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.28s',
        }}>
          Quality study materials for Python & Job Prep — delivered instantly after payment.
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.38s' }}>
          {[{ icon: Shield, color: '#10b981', text: 'Secure Payment' }, { icon: Zap, color: '#6366f1', text: 'Instant Access' }, { icon: BookOpen, color: '#ec4899', text: '100% Original' }].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: isDark ? `${b.color}12` : `${b.color}0d`,
              padding: '6px 14px', borderRadius: '50px',
              border: `1px solid ${b.color}${isDark ? '38' : '28'}`,
              animation: mounted ? `chipSlide 0.4s ease ${0.5 + i * 0.08}s both` : 'none',
            }}>
              <b.icon size={13} color={b.color} />
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.76rem', fontWeight: '700', color: b.color }}>{b.text}</span>
            </div>
          ))}
        </div>

        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.48s' }}>
          <button onClick={() => setCurrentPage('products')}
            style={{
              background: 'linear-gradient(135deg,#6366f1,#ec4899)', border: 'none',
              color: '#fff', padding: isMobile ? '13px 30px' : '16px 42px',
              fontSize: isMobile ? '0.94rem' : '1.05rem', borderRadius: '50px',
              cursor: 'pointer', fontWeight: '800',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 6px 28px rgba(99,102,241,0.38)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              animation: mounted ? 'heroBtnPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.6s both' : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.38)'; }}>
            <Download size={isMobile ? 17 : 19} /> Browse Notes Now
          </button>
        </div>
      </section>

      {/* ══ ACTION CARDS ══ */}
      <section style={{ padding: isMobile ? '20px 16px' : '36px 24px', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4,1fr)' : 'repeat(7,1fr)', gap: isMobile ? '9px' : '12px' }}>
          {actionCards.slice(0, isMobile ? 4 : 7).map((c, i) => (
            <div key={i} style={{ animation: `cardSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) ${0.1 + i * 0.05}s both` }}>
              <ActionCard card={c} isDark={isDark} isMobile={isMobile} onClick={() => { if (c.action) c.action(); else setCurrentPage(c.page); }} />
            </div>
          ))}
        </div>
        {isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', marginTop: '9px' }}>
            {actionCards.slice(4).map((c, i) => (
              <div key={i + 4} style={{ animation: `cardSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.05}s both` }}>
                <ActionCard card={c} isDark={isDark} isMobile={isMobile} onClick={() => { if (c.action) c.action(); else setCurrentPage(c.page); }} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <StatsBar isDark={isDark} isMobile={isMobile} />

      <MockTestSection isDark={isDark} isMobile={isMobile} setCurrentPage={setCurrentPage} />
      <TopRankersSection isDark={isDark} isMobile={isMobile} setCurrentPage={setCurrentPage} />
      <StudentReviews isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} user={user} />
      <Timeline isDark={isDark} isMobile={isMobile} />
      <FeaturesSection isDark={isDark} isMobile={isMobile} />
      <WhySection isDark={isDark} isMobile={isMobile} />
      <FounderSection isDark={isDark} isMobile={isMobile} />

      {/* ── SEO: semantic footer nav for Google ── */}
      <nav aria-label="Quick links" style={{ display: 'none' }}>
        <a href="/mocktests">Python Mock Tests</a>
        <a href="/products">Python Notes PDF</a>
        <a href="/leaderboard">Leaderboard</a>
        <a href="/compiler">Python Compiler</a>
      </nav>

      <style>{`
        @keyframes blink       { 0%,50%{opacity:1}51%,100%{opacity:0} }
        @keyframes pulse       { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.6)} }
        @keyframes shimmer     { 0%,100%{background-position:0%}50%{background-position:100%} }
        @keyframes wig         { 0%,100%{transform:rotate(0)}30%{transform:rotate(-8deg)}60%{transform:rotate(8deg)} }
        @keyframes ldPulse     { 0%,100%{transform:scale(1);opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{transform:scale(1.5);opacity:.3;box-shadow:0 0 0 6px rgba(34,197,94,0)} }
        @keyframes fadeSlide   { from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)} }
        @keyframes scoreIn     { from{opacity:0;transform:scale(0.6) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes cardEnter   { from{opacity:0;transform:translateY(20px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes medalFloat  { 0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(3deg)} }
        @keyframes cardSlideUp { from{opacity:0;transform:translateY(28px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes chipSlide   { from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)} }
        @keyframes statPop     { from{opacity:0;transform:scale(0.85) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes rippleOut   { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.6}100%{transform:translate(-50%,-50%) scale(22);opacity:0} }
        @keyframes badgeFloat  { 0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)} }
        @keyframes heroBtnPop  { from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)} }
        @keyframes freePulse   { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
      `}</style>
    </main>
  );
}