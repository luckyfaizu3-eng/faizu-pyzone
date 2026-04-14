// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Download, Shield, Zap, BookOpen, Star } from 'lucide-react';
import { useTheme, useAuth } from '../App';
import { db } from '../firebase';
import {
  collection, getDocs, query, orderBy, addDoc, deleteDoc,
  doc, limit, startAfter
} from 'firebase/firestore';

/* ─────────────────────────────────────────
   GLOBAL PERF CSS — injected once
   Replaces all inline onMouseEnter/Leave style mutations
   with GPU-composited CSS transitions (no layout thrash)
───────────────────────────────────────── */
const PERF_CSS = `
  .ps-card {
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.22s ease,
                border-color 0.18s ease;
    will-change: transform;
  }
  .ps-card:hover { transform: translateY(-4px); }
  .ps-card-lift:hover { transform: translateY(-6px) scale(1.02); }
  .ps-card-slide:hover { transform: translateX(4px); }

  .ps-btn {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease;
    will-change: transform;
  }
  .ps-btn:hover { transform: translateY(-2px) scale(1.02); }
  .ps-btn:active { transform: translateY(0) scale(0.98); }

  .ps-chip {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    cursor: default;
  }
  .ps-chip:hover { transform: translateY(-2px); }

  .ps-stat {
    transition: transform 0.2s ease;
    cursor: default;
  }
  .ps-stat:hover { transform: translateY(-2px); }

  .ps-ig-btn {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .ps-ig-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(240,100,60,0.4); }

  .ps-live-badge {
    transition: background 0.2s ease, color 0.2s ease;
    cursor: pointer;
  }

  .ps-action-btn {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.15s ease;
    will-change: transform;
    cursor: pointer;
    border: none;
    outline: none;
  }

  /* Reduce blur on mobile — biggest GPU win */
  @media (max-width: 768px) {
    .ps-blur { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
  }

  @keyframes blink { 0%,50%{opacity:1}51%,100%{opacity:0} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes shimmer { 0%{opacity:1} 50%{opacity:0.5} 100%{opacity:1} }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
`;

// Inject once at module level
if (typeof document !== 'undefined' && !document.getElementById('ps-perf-css')) {
  const s = document.createElement('style');
  s.id = 'ps-perf-css';
  s.textContent = PERF_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   PYTHON OFFICIAL LOGO SVG — memoized
───────────────────────────────────────── */
const PythonLogo = memo(function PythonLogo({ size = 24, style = {} }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255"
      width={size} height={size}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}>
      <defs>
        <linearGradient id="plBlue" x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%">
          <stop offset="0%" stopColor="#387EB8"/>
          <stop offset="100%" stopColor="#366994"/>
        </linearGradient>
        <linearGradient id="plYellow" x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%">
          <stop offset="0%" stopColor="#FFE052"/>
          <stop offset="100%" stopColor="#FFC331"/>
        </linearGradient>
      </defs>
      <path fill="#4584B6" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
      <path fill="#FFDE57" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
    </svg>
  );
});

/* ─────────────────────────────────────────
   SCROLL REVEAL HOOK
   Uses IntersectionObserver — zero JS on scroll
───────────────────────────────────────── */
function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────
   SCROLL PROGRESS BAR
   rAF-throttled, transform-only (compositor)
───────────────────────────────────────── */
const ScrollProgressBar = memo(function ScrollProgressBar() {
  const barRef = useRef(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let rafId = null;
    const fn = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const d = document.documentElement;
        const total = d.scrollHeight - d.clientHeight;
        const pct = total > 0 ? d.scrollTop / total : 0;
        bar.style.transform = `scaleX(${pct})`;
        rafId = null;
      });
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); if (rafId) cancelAnimationFrame(rafId); };
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 9999, pointerEvents: 'none' }}>
      <div ref={barRef} style={{
        height: '100%', width: '100%',
        background: 'linear-gradient(90deg,#22c55e,#3b82f6,#a855f7,#f97316)',
        transformOrigin: 'left center',
        transform: 'scaleX(0)',
      }} />
    </div>
  );
});

/* ─────────────────────────────────────────
   LIVE COUNTER — rAF-based, not setInterval
───────────────────────────────────────── */
const LiveCounter = memo(function LiveCounter({ baseEnd, suffix = '', label, color }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useScrollReveal(0.1);

  useEffect(() => {
    if (!visible || baseEnd === 0) { setCount(0); return; }
    let cur = 0;
    const step = Math.max(1, Math.ceil(baseEnd / 55));
    let rafId;
    let last = 0;
    const tick = (ts) => {
      if (ts - last >= 18) {
        cur += step;
        if (cur >= baseEnd) { setCount(baseEnd); return; }
        setCount(cur);
        last = ts;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible, baseEnd]);

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '10px 16px' }}>
      <div style={{ fontSize: '2rem', fontWeight: '900', color, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'inherit', opacity: 0.55, marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
});

/* ─────────────────────────────────────────
   STATS BAR
───────────────────────────────────────── */
const StatsBar = memo(function StatsBar({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const [stats, setStats] = useState([
    { baseEnd: 0, suffix: '+', label: 'Students Tested', color: '#6366f1' },
    { baseEnd: 0, suffix: '%', label: 'Pass Rate', color: '#22c55e' },
    { baseEnd: 3, suffix: '', label: 'Test Levels', color: '#f59e0b' },
    { baseEnd: 0, suffix: '+', label: 'Certificates 🏅', color: '#ec4899' },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'leaderboard'), limit(300)));
        const all = snap.docs.map(d => d.data());
        const total = all.length;
        const passed = all.filter(e => (e.percentage || 0) >= 55).length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        setStats([
          { baseEnd: total, suffix: '+', label: 'Students Tested', color: '#6366f1' },
          { baseEnd: passRate, suffix: '%', label: 'Pass Rate', color: '#22c55e' },
          { baseEnd: 3, suffix: '', label: 'Test Levels', color: '#f59e0b' },
          { baseEnd: passed, suffix: '+', label: 'Certificates 🏅', color: '#ec4899' },
        ]);
      } catch (e) { console.error('StatsBar fetch error:', e); }
    })();
  }, []);

  return (
    <section ref={ref} style={{
      padding: isMobile ? '0 16px 28px' : '0 24px 40px',
      maxWidth: '960px', margin: '0 auto',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      contentVisibility: 'auto',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
        gap: isMobile ? '10px' : '14px',
      }}>
        {stats.map((s, i) => (
          <div key={i} className="ps-stat" style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.95)',
            borderRadius: '18px',
            padding: '4px 0',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : `0 4px 24px ${s.color}10`,
          }}>
            <LiveCounter baseEnd={s.baseEnd} suffix={s.suffix} label={s.label} color={s.color} />
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.58rem', fontWeight: '700', color: isDark ? '#334155' : '#cbd5e1', letterSpacing: '0.05em' }}>
        ✅ LIVE DATA FROM PYSKILL LEADERBOARD
      </p>
    </section>
  );
});

/* ─────────────────────────────────────────
   BASE CARD + SECTION LABEL
───────────────────────────────────────── */
const baseCard = (isDark, extra = {}) => ({
  background: isDark ? 'rgba(15,23,42,0.9)' : '#fff',
  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8eaf0',
  borderRadius: '20px',
  ...extra,
});

const SectionLabel = memo(function SectionLabel({ color, text }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: '50px', padding: '5px 14px', marginBottom: '10px',
      fontSize: '0.66rem', fontWeight: '800', color, letterSpacing: '0.14em', textTransform: 'uppercase',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {text}
    </div>
  );
});

/* ─────────────────────────────────────────
   ACTION CARD — CSS hover, no useState
───────────────────────────────────────── */
const ActionCard = memo(function ActionCard({ card, isDark, isMobile, onClick }) {
  return (
    <button
      onClick={onClick}
      className="ps-action-btn"
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.85)',
        borderRadius: '20px',
        padding: isMobile ? '14px 6px 12px' : '22px 10px 18px',
        width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px',
        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 16px rgba(0,0,0,0.05)',
        minHeight: isMobile ? '80px' : '100px',
      }}>
      <div style={{
        width: isMobile ? '38px' : '46px', height: isMobile ? '38px' : '46px',
        borderRadius: '14px',
        background: `linear-gradient(135deg,${card.c}20,${card.c}08)`,
        border: `1px solid ${card.c}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? '1.2rem' : '1.4rem',
        flexShrink: 0,
      }}>{card.icon}</div>
      <span style={{
        fontSize: isMobile ? '0.6rem' : '0.69rem', fontWeight: '800',
        color: isDark ? '#cbd5e1' : '#334155',
        textAlign: 'center', lineHeight: 1.3,
      }}>{card.label}</span>
    </button>
  );
});

/* ─────────────────────────────────────────
   MOCK TEST SECTION
───────────────────────────────────────── */
const MockTestSection = memo(function MockTestSection({ isDark, isMobile, setCurrentPage }) {
  const [ref, visible] = useScrollReveal();

  const levels = useMemo(() => [
    {
      emoji: '🌱', level: 'Basic', q: '60 Qs', t: '60 Min',
      pill: 'FREE 🆓', pillBg: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7', pillTc: '#16a34a',
      bg1: isDark ? 'rgba(34,197,94,0.12)' : '#f0fdf4', bg2: isDark ? 'rgba(34,197,94,0.05)' : '#dcfce7',
      border: isDark ? 'rgba(34,197,94,0.3)' : '#86efac', nameColor: '#16a34a',
      descColor: isDark ? '#86efac' : '#166534', barBg: isDark ? 'rgba(34,197,94,0.12)' : '#dcfce7',
      glow: 'rgba(34,197,94,0.25)', isFree: true,
    },
    {
      emoji: '🔥', level: 'Advanced', q: '60 Qs', t: '120 Min',
      pill: 'HOT 🔥', pillBg: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe', pillTc: '#1d4ed8',
      bg1: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff', bg2: isDark ? 'rgba(59,130,246,0.05)' : '#dbeafe',
      border: isDark ? 'rgba(59,130,246,0.3)' : '#93c5fd', nameColor: '#3b82f6',
      descColor: isDark ? '#93c5fd' : '#1e40af', barBg: isDark ? 'rgba(59,130,246,0.12)' : '#dbeafe',
      glow: 'rgba(59,130,246,0.25)', isFree: false,
    },
    {
      emoji: '⭐', level: 'Pro', q: '60 Qs', t: '180 Min',
      pill: 'PRO ⭐', pillBg: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7', pillTc: '#b45309',
      bg1: isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb', bg2: isDark ? 'rgba(245,158,11,0.05)' : '#fef3c7',
      border: isDark ? 'rgba(245,158,11,0.3)' : '#fcd34d', nameColor: '#f59e0b',
      descColor: isDark ? '#fcd34d' : '#92400e', barBg: isDark ? 'rgba(245,158,11,0.12)' : '#fef3c7',
      glow: 'rgba(245,158,11,0.25)', isFree: false,
    },
  ], [isDark]);

  return (
    <section ref={ref} style={{
      padding: isMobile ? '0 16px 36px' : '0 24px 52px',
      maxWidth: '960px', margin: '0 auto',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      contentVisibility: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '14px' : '20px' }}>
        <span style={{ fontSize: '1rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PythonLogo size={22} /> Mock Tests
        </span>
        <span onClick={() => setCurrentPage('mocktests')} style={{ fontSize: '0.72rem', fontWeight: '700', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View All <span>→</span>
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
            className="ps-card ps-card-lift"
            style={{
              flexShrink: isMobile ? 0 : undefined, width: isMobile ? '155px' : 'auto',
              borderRadius: '22px', overflow: 'hidden', cursor: 'pointer',
              background: `linear-gradient(160deg,${lvl.bg1},${lvl.bg2})`,
              border: `1.5px solid ${lvl.border}`,
              boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)',
            }}>
            <div style={{ padding: '20px 16px 12px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.52rem', fontWeight: '800', padding: '3px 9px', borderRadius: '50px', background: lvl.pillBg, color: lvl.pillTc }}>{lvl.pill}</div>
              <span style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', marginBottom: '10px', display: 'block' }}>{lvl.emoji}</span>
              <div style={{ fontSize: '1rem', fontWeight: '900', marginBottom: '4px', color: lvl.nameColor }}>{lvl.level}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, lineHeight: 1.6, color: lvl.descColor }}>
                {lvl.q} · {lvl.t}<br/>
                <span style={{ fontWeight: '700' }}>{i === 0 ? 'Beginner' : i === 1 ? 'Expert' : 'Master'}</span>
              </div>
            </div>
            <div style={{ padding: '9px 16px', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: lvl.barBg, color: lvl.nameColor }}>
              <span>{lvl.isFree ? '🆓 Free!' : 'Start Now!'}</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
        {[
          { dot: '#22c55e', label: 'Anti-Cheat' },
          { dot: '#eab308', label: 'Tab Block' },
          { dot: '#3b82f6', label: 'Fullscreen' },
          { dot: '#a855f7', label: 'Cert 55%+' },
        ].map((c, i) => (
          <div key={i} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px',
            background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0',
            borderRadius: '50px', padding: '5px 12px',
            fontSize: '0.63rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#6b7280',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', boxShadow: `0 0 6px ${c.dot}80` }} />
            {c.label}
          </div>
        ))}
      </div>
    </section>
  );
});

/* ─────────────────────────────────────────
   TOP CARD — CSS hover
───────────────────────────────────────── */
const TopCard = memo(function TopCard({ isDark, isMobile, medal, data, isFirst, onClick }) {
  return (
    <div
      onClick={onClick}
      className="ps-card ps-card-lift"
      style={{
        borderRadius: '22px', overflow: 'hidden', cursor: 'pointer',
        background: isDark ? 'rgba(15,23,42,0.95)' : '#fff',
        border: isDark ? `1px solid ${medal.color}25` : `1px solid ${medal.color}30`,
        boxShadow: isFirst ? `0 8px 28px ${medal.glow}` : isDark ? '0 4px 16px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.07)',
        transform: isFirst ? 'scale(1.02)' : 'scale(1)',
      }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg,${medal.color},${medal.color}50,transparent)` }} />
      <div style={{ padding: isMobile ? '16px 12px' : '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: isMobile ? '2.2rem' : '2.8rem', lineHeight: 1, marginBottom: '8px' }}>{medal.emoji}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${medal.color}18`, border: `1px solid ${medal.color}35`, borderRadius: '50px', padding: '3px 10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: '900', color: medal.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{medal.label}</span>
        </div>
        <div style={{ fontSize: isMobile ? '1.9rem' : '2.3rem', fontWeight: '900', color: medal.color, lineHeight: 1, marginBottom: '7px', letterSpacing: '-0.03em' }}>{data.score}%</div>
        <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '800', color: isDark ? '#e2e8f0' : '#111827', marginBottom: '4px' }}>{data.name}</div>
        <div style={{ fontSize: isMobile ? '0.6rem' : '0.66rem', color: isDark ? '#6b7280' : '#9ca3af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
          <PythonLogo size={12} /> {data.test}
        </div>
        {data.time && (
          <div style={{ marginTop: '9px', fontSize: '0.6rem', fontWeight: '700', color: isDark ? '#475569' : '#9ca3af', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0', borderRadius: '20px', padding: '3px 9px', display: 'inline-block' }}>
            ⏱ {data.time}
          </div>
        )}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────── */
const SkeletonRankerCard = memo(function SkeletonRankerCard({ isDark, medal }) {
  return (
    <div style={{
      borderRadius: '22px', overflow: 'hidden',
      background: isDark ? 'rgba(15,23,42,0.6)' : '#f8fafc',
      border: isDark ? `1px solid ${medal.color}15` : `1px solid ${medal.color}20`,
    }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg,${medal.color}40,transparent)` }} />
      <div style={{ padding: '18px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', lineHeight: 1, marginBottom: '8px', opacity: 0.25 }}>{medal.emoji}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${medal.color}10`, border: `1px solid ${medal.color}20`, borderRadius: '50px', padding: '3px 10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: '900', color: `${medal.color}70`, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{medal.label}</span>
        </div>
        {[70, 50, 40].map((w, i) => (
          <div key={i} style={{
            height: i === 0 ? '26px' : '12px', width: `${w}%`, margin: '0 auto 10px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            animation: 'shimmer 1.5s infinite',
          }} />
        ))}
        <div style={{ marginTop: '4px', fontSize: '0.65rem', color: isDark ? '#334155' : '#cbd5e1', fontWeight: '600' }}>No data yet</div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   TOP RANKERS
───────────────────────────────────────── */
const TopRankersSection = memo(function TopRankersSection({ isDark, isMobile, setCurrentPage }) {
  const [rankers, setRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ref, visible] = useScrollReveal();

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'leaderboard'), orderBy('percentage', 'desc'), limit(20));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const seen = new Set();
        const top = all
          .filter(e => (e.testLevel || '').toLowerCase().trim() !== 'neet')
          .filter(e => {
            const key = (e.name || '').toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key); return true;
          })
          .slice(0, 3);
        setRankers(top);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const medals = useMemo(() => [
    { emoji: '🥇', color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', label: 'Champion', rank: 1 },
    { emoji: '🥈', color: '#f97316', glow: 'rgba(249,115,22,0.35)', label: 'Runner-up', rank: 2 },
    { emoji: '🥉', color: '#a855f7', glow: 'rgba(168,85,247,0.35)', label: '3rd Place', rank: 3 },
  ], []);

  const displayData = rankers.map(r => ({
    name: r.name, score: r.percentage,
    test: r.testTitle || r.testLevel || 'Python Test',
    time: r.timeTaken || '', isReal: true,
  }));
  const hasAnyReal = displayData.length > 0;

  return (
    <section ref={ref} style={{
      padding: isMobile ? '0 16px 48px' : '0 24px 64px',
      maxWidth: '960px', margin: '0 auto',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      contentVisibility: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <div style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#111827', letterSpacing: '-0.02em' }}>🏆 Top Performers</div>
          <div style={{ fontSize: '0.72rem', color: isDark ? '#6b7280' : '#9ca3af', fontWeight: '600', marginTop: '3px' }}>
            {hasAnyReal ? 'Real students · Real scores · Live data' : 'Be the first to top the leaderboard! 🚀'}
          </div>
        </div>
        <div
          className="ps-live-badge"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.62rem', fontWeight: '800', color: '#16a34a', background: isDark ? 'rgba(34,197,94,0.08)' : '#f0fdf4', border: '1.5px solid #86efac', padding: '5px 12px', borderRadius: '50px' }}
          onClick={() => setCurrentPage('leaderboard')}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
          LIVE
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#475569' : '#94a3b8' }}>
          <div style={{ fontSize: '1.5rem' }}>⏳</div>
          <div style={{ marginTop: '8px', fontSize: '0.82rem' }}>Loading top performers...</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? '8px' : '14px', marginBottom: '14px' }}>
            {[0, 1, 2].map(i => {
              const m = medals[i]; const d = displayData[i];
              return d
                ? <TopCard key={i} isDark={isDark} isMobile={isMobile} medal={m} data={d} isFirst={i === 0} onClick={() => setCurrentPage('leaderboard')} />
                : <SkeletonRankerCard key={i} isDark={isDark} medal={m} />;
            })}
          </div>
          {!hasAnyReal && (
            <div style={{ textAlign: 'center', padding: '16px 20px', background: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)', border: isDark ? '1px dashed rgba(99,102,241,0.2)' : '1px dashed rgba(99,102,241,0.25)', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.84rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                No one has topped the leaderboard yet. Take a test and claim your spot! 🏆
              </p>
              <button onClick={() => setCurrentPage('mocktests')} style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)', border: 'none', color: '#fff', padding: '9px 22px', borderRadius: '50px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>
                Take Test Now →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
});

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
   REVIEW CARD — lazy comments, CSS hover
───────────────────────────────────────── */
const ReviewCard = memo(function ReviewCard({ review, isDark, isMobile, isAdmin, user, onDeleteClick, preloadedComments }) {
  const [comments, setComments] = useState(preloadedComments || []);
  const [showCmts, setShowCmts] = useState(false);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const cmtsFetched = useRef(preloadedComments ? true : false);

  const handleToggleComments = useCallback(async () => {
    if (!showCmts && !cmtsFetched.current) {
      setCmtLoading(true);
      try {
        const snap = await getDocs(query(
          collection(db, 'studentReviews', review.id, 'comments'),
          orderBy('createdAt', 'asc')
        ));
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        cmtsFetched.current = true;
      } catch { }
      finally { setCmtLoading(false); }
    }
    setShowCmts(s => !s);
  }, [showCmts, review.id]);

  const postComment = useCallback(async () => {
    if (!commentText.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'studentReviews', review.id, 'comments'), {
        text: commentText.trim(),
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userPhoto: user.photoURL || '', userId: user.uid, createdAt: Date.now(),
      });
      setCommentText('');
      const snap = await getDocs(query(collection(db, 'studentReviews', review.id, 'comments'), orderBy('createdAt', 'asc')));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setShowCmts(true);
    } catch { window.showToast?.('❌ Comment failed', 'error'); }
    finally { setPosting(false); }
  }, [commentText, user, review.id]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
      e.preventDefault(); postComment();
    }
  }, [postComment]);

  const stars = review.stars || 5;
  const palettes = [
    { from: '#6366f1', to: '#8b5cf6' }, { from: '#10b981', to: '#0ea5e9' },
    { from: '#f59e0b', to: '#ef4444' }, { from: '#ec4899', to: '#a855f7' },
    { from: '#3b82f6', to: '#6366f1' }, { from: '#14b8a6', to: '#6366f1' },
  ];
  const pal = palettes[(review.name?.charCodeAt(0) || 0) % palettes.length];
  const igHandle = review.instagram ? review.instagram.replace(/^@/, '') : null;

  return (
    <div
      className="ps-card"
      style={{
        position: 'relative', borderRadius: '22px', overflow: 'hidden',
        background: isDark ? '#0f172a' : '#ffffff',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.05)',
      }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${pal.from}, ${pal.to})` }} />

      <div style={{ padding: isMobile ? '16px 14px 12px' : '20px 20px 14px', position: 'relative' }}>
        {isAdmin && (
          <button onClick={onDeleteClick} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '3px 9px', fontSize: '0.62rem', fontWeight: '800', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
        )}

        <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {review.photo
                ? <img src={review.photo} alt={review.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                : <span style={{ color: '#fff', fontWeight: '900', fontSize: isMobile ? '1.2rem' : '1.4rem' }}>{(review.name || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: '2px solid ' + (isDark ? '#0f172a' : '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{review.name}</span>
            </div>
            {igHandle && (
              <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                className="ps-ig-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px 3px 7px', borderRadius: '20px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', textDecoration: 'none', marginBottom: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>
                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#fff' }}>{igHandle}</span>
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
          <p style={{ margin: 0, fontSize: isMobile ? '0.82rem' : '0.875rem', color: isDark ? '#cbd5e1' : '#374151', lineHeight: 1.72, fontWeight: '500', fontStyle: 'italic' }}>{review.text}</p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '8px', padding: '3px 9px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
          <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#10b981', letterSpacing: '0.4px' }}>Verified PySkill Student</span>
        </div>
      </div>

      <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)', padding: isMobile ? '10px 14px 13px' : '10px 20px 14px' }}>
        {(comments.length > 0 || !cmtsFetched.current) && review.commentCount > 0 && (
          <button onClick={handleToggleComments} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', color: pal.from, padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {cmtLoading ? <span>⏳</span> : <span style={{ fontSize: '0.6rem' }}>{showCmts ? '▲' : '▼'}</span>}
            {showCmts ? 'Hide' : 'View'} {review.commentCount || comments.length} comment{(review.commentCount || comments.length) !== 1 ? 's' : ''}
          </button>
        )}
        {comments.length > 0 && !review.commentCount && (
          <button onClick={handleToggleComments} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', color: pal.from, padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.6rem' }}>{showCmts ? '▲' : '▼'}</span>
            {showCmts ? 'Hide' : 'View'} {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </button>
        )}
        {showCmts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: `${pal.from}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
                  {c.userPhoto ? <img src={c.userPhoto} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : '👤'}
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
              {user.photoURL ? <img src={user.photoURL} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isMobile ? "Comment..." : "Add a comment..."}
              style={{ flex: 1, padding: '7px 13px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8edf3', borderRadius: '20px', fontSize: '0.76rem', fontWeight: '500', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#0f172a', outline: 'none' }}
            />
            <button
              onClick={postComment}
              disabled={posting || !commentText.trim()}
              style={{ padding: '7px 13px', borderRadius: '20px', background: commentText.trim() ? `linear-gradient(135deg,${pal.from},${pal.to})` : isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0', border: 'none', color: commentText.trim() ? '#fff' : isDark ? '#334155' : '#94a3b8', fontWeight: '800', fontSize: '0.7rem', cursor: commentText.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {posting ? '...' : 'Post'}
            </button>
          </div>
        ) : <p style={{ margin: 0, fontSize: '0.68rem', color: isDark ? '#334155' : '#94a3b8' }}>🔐 Login to comment</p>}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   ADD REVIEW FORM
───────────────────────────────────────── */
const REVIEW_MAX_CHARS = 500;

function AddReviewForm({ isDark, isMobile, user, onSave, onCancel, existingUserIds }) {
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
    if (user?.uid && existingUserIds?.includes(user.uid)) { window.showToast?.('⚠️ You have already submitted a review!', 'warning'); return; }
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
    await onSave({ ...form, photo: photoUrl, userEmail: user?.email || '', userId: user?.uid || '' });
    setSaving(false);
  };

  const charsLeft = REVIEW_MAX_CHARS - form.text.length;

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
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <textarea
          placeholder="Share your experience * (max 500 chars)"
          value={form.text}
          onChange={e => { if (e.target.value.length <= REVIEW_MAX_CHARS) h('text')(e); }}
          rows={3}
          style={{ ...inp, resize: 'vertical', width: '100%', boxSizing: 'border-box', paddingBottom: '24px' }}
        />
        <span style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '0.62rem', fontWeight: '700', color: charsLeft < 50 ? '#ef4444' : isDark ? '#475569' : '#94a3b8' }}>
          {charsLeft} left
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>Rating:</span>
        {[1,2,3,4,5].map(s => <button key={s} onClick={() => setForm(f => ({ ...f, stars: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', transition: 'transform 0.15s ease', transform: s <= form.stars ? 'scale(1.1)' : 'scale(1)' }}><Star size={20} fill={s <= form.stars ? '#f59e0b' : 'none'} color={s <= form.stars ? '#f59e0b' : '#cbd5e1'} /></button>)}
        <span style={{ fontSize: '0.76rem', color: '#f59e0b', fontWeight: '700' }}>{form.stars}/5</span>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#ec4899)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
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
const REVIEWS_PER_PAGE = 10;
const MAX_REVIEWS = 200;

function StudentReviews({ isDark, isMobile, isAdmin, user }) {
  const reviewsRef = useRef([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [ref, visible] = useScrollReveal();

  // FIX: removed unused allSnap variable; count fetched directly
  const fetchReviews = useCallback(async (reset = true) => {
    try {
      if (reset) setLoading(true); else setLoadingMore(true);

      if (reset) {
        const countSnap = await getDocs(collection(db, 'studentReviews'));
        setTotalCount(countSnap.size);
      }

      let q = query(collection(db, 'studentReviews'), orderBy('createdAt', 'desc'), limit(REVIEWS_PER_PAGE));
      if (!reset && lastDocRef.current) {
        q = query(collection(db, 'studentReviews'), orderBy('createdAt', 'desc'), startAfter(lastDocRef.current), limit(REVIEWS_PER_PAGE));
      }

      const snap = await getDocs(q);
      const newReviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === REVIEWS_PER_PAGE);

      if (reset) {
        reviewsRef.current = newReviews;
        setReviews(newReviews);
      } else {
        reviewsRef.current = [...reviewsRef.current, ...newReviews];
        setReviews([...reviewsRef.current]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchReviews(true); }, [fetchReviews]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, 'studentReviews', deleteTarget.id));
    window.showToast?.('✅ Deleted!', 'success');
    setDeleteTarget(null);
    fetchReviews(true);
  };

  const existingUserIds = useMemo(() => reviews.map(r => r.userId).filter(Boolean), [reviews]);
  const canAddMore = totalCount < MAX_REVIEWS;
  const userAlreadyReviewed = user?.uid && existingUserIds.includes(user.uid);

  if (!loading && reviews.length === 0 && !user) return null;

  return (
    <section id="student-reviews" ref={ref} style={{ padding: isMobile ? '0 16px 48px' : '0 24px 64px', maxWidth: '960px', margin: '0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.5s ease, transform 0.5s ease', contentVisibility: 'auto' }}>
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
        <p style={{ fontSize: '0.82rem', color: isDark ? '#64748b' : '#94a3b8', margin: 0 }}>
          Genuine feedback from real PySkill students
          {isAdmin && <span style={{ marginLeft: '8px', color: '#6366f1', fontWeight: '700' }}>({totalCount}/{MAX_REVIEWS})</span>}
        </p>
      </div>

      {loading
        ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: '200px', borderRadius: '22px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f0f0f0', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        )
        : reviews.length === 0
          ? user && <div style={{ textAlign: 'center', padding: '36px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '16px', border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e2e8f0', color: isDark ? '#475569' : '#94a3b8', fontSize: '0.88rem' }}>No reviews yet. Be the first! 👇</div>
          : <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>
              {reviews.map(rev => (
                <ReviewCard key={rev.id} review={rev} isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} user={user} onDeleteClick={() => setDeleteTarget(rev)} preloadedComments={[]} />
              ))}
            </div>
      }

      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => fetchReviews(false)} disabled={loadingMore} style={{ padding: '10px 28px', borderRadius: '50px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', fontSize: '0.84rem', cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
            {loadingMore ? '⏳ Loading...' : '↓ Load More Reviews'}
          </button>
        </div>
      )}

      {user && canAddMore && !userAlreadyReviewed && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? 'transparent' : 'linear-gradient(135deg,#6366f1,#ec4899)', border: showForm ? isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e2e8f0' : 'none', color: showForm ? isDark ? '#94a3b8' : '#64748b' : '#fff', padding: '10px 28px', borderRadius: '50px', fontWeight: '700', fontSize: '0.86rem', cursor: 'pointer' }}>
            {showForm ? '✕ Cancel' : '✍️ Write a Review'}
          </button>
        </div>
      )}
      {user && userAlreadyReviewed && (
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#10b981', fontWeight: '700' }}>
          ✅ You have already submitted a review. Thank you!
        </div>
      )}
      {!user && reviews.length > 0 && <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.76rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: '600' }}>🔐 Login to write your own review</p>}
      {user && showForm && canAddMore && !userAlreadyReviewed && (
        <AddReviewForm isDark={isDark} isMobile={isMobile} user={user} existingUserIds={existingUserIds}
          onSave={async (data) => {
            await addDoc(collection(db, 'studentReviews'), { ...data, createdAt: Date.now() });
            fetchReviews(true); setShowForm(false); window.showToast?.('✅ Review added!', 'success');
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </section>
  );
}

/* ─────────────────────────────────────────
   TIMELINE
───────────────────────────────────────── */
const Timeline = memo(function Timeline({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const events = [
    { date: '1 Jan 2026', title: 'The Idea', desc: 'PySkill was born — a vision to give students quality Python study material at affordable prices.', icon: '💡', tag: 'ORIGIN', color: '#a78bfa' },
    { date: '10 Jan 2026', title: 'Work Begins', desc: 'Development kicked off. Notes curated, questions filtered, platform designed from scratch.', icon: '⚡', tag: 'BUILD', color: '#6366f1' },
    { date: '15 Feb 2026', title: 'Website Live 🚀', desc: 'PySkill officially launched! First students enrolled, first certificates issued.', icon: '🚀', tag: 'LAUNCH', color: '#ec4899' },
  ];
  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 56px' : '0 24px 72px', maxWidth: '680px', margin: '0 auto', contentVisibility: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
        <SectionLabel color="#6366f1" text="Our Story · 2026" />
        <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', background: 'linear-gradient(135deg,#1e40af,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '4px 0 4px', letterSpacing: '-0.02em' }}>From Idea to Reality</h2>
        <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Every milestone that brought PySkill to life</p>
      </div>
      <div style={{ position: 'relative', paddingLeft: isMobile ? '54px' : '68px' }}>
        <div style={{ position: 'absolute', left: isMobile ? '22px' : '28px', top: '14px', bottom: '14px', width: '2px', background: isDark ? 'linear-gradient(180deg,#a78bfa70,#6366f170,#ec489870)' : 'linear-gradient(180deg,#a78bfa40,#6366f140,#ec489840)', opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.3s', borderRadius: '2px' }} />
        {events.map((evt, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: i < events.length - 1 ? (isMobile ? '28px' : '32px') : 0, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-16px)', transition: `opacity 0.4s ease ${0.2 + i * 0.12}s, transform 0.4s ease ${0.2 + i * 0.12}s` }}>
            <div style={{ position: 'absolute', left: isMobile ? '-40px' : '-52px', top: '12px', width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px', borderRadius: '50%', background: `linear-gradient(135deg,${evt.color},${i === 2 ? '#f472b6' : '#a78bfa'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1rem' : '1.2rem', boxShadow: `0 0 0 4px ${isDark ? '#0f172a' : '#f4f5ff'}, 0 0 0 6px ${evt.color}35`, zIndex: 2 }}>{evt.icon}</div>
            <div
              className="ps-card ps-card-slide"
              style={{ ...baseCard(isDark, { padding: isMobile ? '16px' : '20px 24px', overflow: 'hidden', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(99,102,241,0.07)' }) }}>
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
});

/* ─────────────────────────────────────────
   FEATURES
───────────────────────────────────────── */
const FeaturesSection = memo(function FeaturesSection({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const features = [
    { icon: '📚', title: 'Quality Content', desc: 'Expert-curated notes & filtered important questions for every topic.', color: '#6366f1' },
    { icon: '🔒', title: 'Secure & Safe', desc: 'Razorpay-protected payments — UPI, Cards, Net Banking & more.', color: '#10b981' },
    { icon: '⚡', title: 'Instant Download', desc: 'Get your PDFs the second your payment is confirmed.', color: '#ec4899' },
  ];
  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 36px' : '0 24px 52px', maxWidth: '960px', margin: '0 auto', contentVisibility: 'auto' }}>
      <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', textAlign: 'center', marginBottom: isMobile ? '20px' : '32px', color: isDark ? '#e2e8f0' : '#0f172a', letterSpacing: '-0.02em', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}>Why Students Love Us</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? '12px' : '16px' }}>
        {features.map((f, i) => (
          <div key={i}
            className="ps-card"
            style={{ ...baseCard(isDark, { padding: isMobile ? '20px 18px' : '26px 22px', position: 'relative', overflow: 'hidden', boxShadow: isDark ? '0 3px 16px rgba(0,0,0,0.2)' : '0 3px 16px rgba(99,102,241,0.06)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s` }) }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: `linear-gradient(180deg,${f.color},${f.color}40)`, borderRadius: '20px 0 0 20px' }} />
            <div style={{ paddingLeft: '14px' }}>
              <div style={{ width: '48px', height: '48px', background: `${f.color}18`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '14px', border: `1px solid ${f.color}28` }}>{f.icon}</div>
              <div style={{ fontSize: isMobile ? '0.92rem' : '0.97rem', fontWeight: '800', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: '7px' }}>{f.title}</div>
              <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

/* ─────────────────────────────────────────
   WHY PYSKILL
───────────────────────────────────────── */
const WhySection = memo(function WhySection({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const items = [
    { icon: '📜', title: 'Our Policy', desc: 'Genuine, quality-checked materials. No refund after download, but satisfaction guaranteed with preview.', color: '#6366f1' },
    { icon: '💳', title: 'Secure Payment', desc: "Via Razorpay — India's most trusted gateway. UPI, Cards, Net Banking & Wallets. Fully encrypted.", color: '#10b981' },
    { icon: '🎯', title: 'Why Choose Us', desc: 'Instant access, lifetime downloads, mobile-friendly PDFs, expert content & 24/7 WhatsApp support.', color: '#f59e0b' },
    { icon: '⭐', title: 'What Makes Us Better', desc: 'No outdated content. Every note filtered for importance. Real reviews, no hidden charges.', color: '#8b5cf6' },
  ];
  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 36px' : '0 24px 52px', maxWidth: '960px', margin: '0 auto', contentVisibility: 'auto' }}>
      <h2 style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: '900', textAlign: 'center', marginBottom: isMobile ? '20px' : '32px', background: 'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}>Why PySkill?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? '12px' : '16px' }}>
        {items.map((c, i) => (
          <div key={i}
            className="ps-card"
            style={{ ...baseCard(isDark, { padding: isMobile ? '18px 16px' : '22px 22px', position: 'relative', overflow: 'hidden', boxShadow: isDark ? '0 3px 16px rgba(0,0,0,0.2)' : '0 3px 16px rgba(99,102,241,0.06)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transition: `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s` }) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg,${c.color},${c.color}30,transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px', background: `${c.color}18`, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', border: `1px solid ${c.color}25`, flexShrink: 0 }}>{c.icon}</div>
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
});

/* ─────────────────────────────────────────
   FOUNDER
───────────────────────────────────────── */
const FounderSection = memo(function FounderSection({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();

  const skills = useMemo(() => [
    { label: 'React.js', color: '#61dafb' }, { label: 'Python', color: '#f59e0b' },
    { label: 'Firebase', color: '#f97316' }, { label: 'Node.js', color: '#22c55e' },
    { label: 'UI/UX', color: '#a855f7' }, { label: 'MongoDB', color: '#10b981' },
  ], []);

  const founderStats = useMemo(() => [
    { val: '6mo', label: 'Into Coding' }, { val: '10K+', label: 'Students Reached' },
    { val: '3', label: 'Exam Levels Built' }, { val: '∞', label: 'Coffee Cups ☕' },
  ], []);

  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 80px' : '0 24px 100px', maxWidth: '900px', margin: '0 auto', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease', contentVisibility: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <SectionLabel color="#6366f1" text="The Man Behind PySkill" />
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '2.1rem', fontWeight: '900', background: 'linear-gradient(135deg,#6366f1,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '6px 0 0', letterSpacing: '-0.02em' }}>
          Meet the Founder 👨‍💻
        </h2>
      </div>

      <div
        className="ps-card"
        style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', background: isDark ? 'linear-gradient(145deg,rgba(10,10,35,0.97),rgba(5,30,15,0.95))' : 'linear-gradient(145deg,#f8f7ff,#f0fdf4)', border: isDark ? '1.5px solid rgba(99,102,241,0.2)' : '1.5px solid rgba(99,102,241,0.15)', boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.5)' : '0 24px 64px rgba(99,102,241,0.1)' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg,#6366f1,#22c55e,#f59e0b,#ec4899)' }} />

        <div style={{ padding: isMobile ? '28px 20px' : '40px 44px' }}>
          <div style={{ display: 'flex', gap: isMobile ? '20px' : '36px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: isMobile ? '82px' : '100px', height: isMobile ? '82px' : '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(99,102,241,0.4)', boxShadow: '0 0 0 6px rgba(99,102,241,0.1)' }}>
                <img src="https://i.ibb.co/WWW1ttkx/Whats-App-Image-2026-01-31-at-1-57-14-PM.jpg" alt="Faizan Tariq — Founder PySkill" loading="lazy" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h3 style={{ fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: '900', color: isDark ? '#f1f5f9' : '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Faizan Tariq</h3>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '3px 10px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#6366f1', letterSpacing: '0.05em' }}>VERIFIED FOUNDER</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#a78bfa' : '#7c3aed', background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '20px', padding: '4px 12px' }}>🎓 Software Engineering — ILS Srinagar</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#6ee7b7' : '#065f46', background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '20px', padding: '4px 12px' }}>📍 Anantnag, Kashmir</span>
              </div>
              <p style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', color: isDark ? '#94a3b8' : '#374151', lineHeight: 1.8, margin: '0 0 16px', fontWeight: '500' }}>
                Just 6 months into coding, I am a first-year Software Engineering student from <strong style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Anantnag, Kashmir</strong>, studying at <strong style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>ILS Srinagar</strong>. Still a beginner — but driven enough to build PySkill entirely from scratch. Late nights, countless bugs, and a real passion for helping students learn Python. This is just the beginning. 🚀
              </p>
              <a href="https://instagram.com/code_with_06" target="_blank" rel="noopener noreferrer"
                className="ps-ig-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', borderRadius: '12px', color: '#fff', fontSize: '0.78rem', fontWeight: '800', padding: '10px 20px', textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="#fff"/></svg>
                @code_with_06
              </a>
            </div>
          </div>

          <div style={{ height: '1px', background: isDark ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' : 'linear-gradient(90deg,transparent,rgba(99,102,241,0.15),transparent)', marginBottom: '24px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4},1fr)`, gap: '12px', marginBottom: '28px' }}>
            {founderStats.map((s, i) => (
              <div key={i} className="ps-stat" style={{ textAlign: 'center', padding: '14px 8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.1)', borderRadius: '14px' }}>
                <div style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: '900', background: 'linear-gradient(135deg,#6366f1,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', marginTop: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', color: isDark ? '#475569' : '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>Tech Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map((sk, i) => (
                <span key={i} className="ps-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: isDark ? `${sk.color}12` : `${sk.color}0e`, border: `1px solid ${sk.color}35`, fontSize: '0.72rem', fontWeight: '800', color: sk.color }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sk.color, display: 'inline-block', boxShadow: `0 0 4px ${sk.color}80` }} />
                  {sk.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

/* ─────────────────────────────────────────
   SEO HEAD INJECTOR
───────────────────────────────────────── */
function SEOHead() {
  useEffect(() => {
    const SITE = 'https://pyskill.in';
    const TITLE = 'PySkill — Free Python Mock Tests, Notes & Certification 2026';
    const DESC = 'PySkill offers free & premium Python mock tests (Basic, Advanced, Pro), instant PDF notes, anti-cheat certification exams, and a live leaderboard. Join 10,000+ students in India.';
    const IMAGE = 'https://pyskill.in/og-image.png';
    const KEYWORDS = 'python mock test 2026, python certification india, python notes pdf, python basic test free, python advanced test, pyskill, python exam online, python questions answers, python leaderboard, python study material';

    document.title = TITLE;
    const setMeta = (sel, attr, val) => {
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    setMeta('meta[name="description"]', 'name', 'description'); setMeta('meta[name="description"]', 'content', DESC);
    setMeta('meta[name="keywords"]', 'name', 'keywords'); setMeta('meta[name="keywords"]', 'content', KEYWORDS);
    setMeta('meta[name="author"]', 'name', 'author'); setMeta('meta[name="author"]', 'content', 'Faizan Tariq');
    setMeta('meta[name="robots"]', 'name', 'robots'); setMeta('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large');
    setMeta('meta[name="theme-color"]', 'name', 'theme-color'); setMeta('meta[name="theme-color"]', 'content', '#6366f1');
    setMeta('meta[property="og:type"]', 'property', 'og:type'); setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[property="og:url"]', 'property', 'og:url'); setMeta('meta[property="og:url"]', 'content', SITE);
    setMeta('meta[property="og:title"]', 'property', 'og:title'); setMeta('meta[property="og:title"]', 'content', TITLE);
    setMeta('meta[property="og:description"]', 'property', 'og:description'); setMeta('meta[property="og:description"]', 'content', DESC);
    setMeta('meta[property="og:image"]', 'property', 'og:image'); setMeta('meta[property="og:image"]', 'content', IMAGE);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); document.head.appendChild(canonical); }
    canonical.setAttribute('rel', 'canonical'); canonical.setAttribute('href', SITE);
  }, []);
  return null;
}

/* ─────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────── */
export default function HomePage({ setCurrentPage }) {
  const [txt, setTxt] = useState('');
  const [idx, setIdx] = useState(0);
  const [del, setDel] = useState(false);
  const [pi, setPi] = useState(0);
  // Use matchMedia for SSR-safe initial value
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [mounted, setMounted] = useState(false);
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const isAdmin = user?.email === 'luckyfaizu3@gmail.com';

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useEffect(() => {
    if (window.location.hash === '#student-reviews') {
      setTimeout(() => {
        document.getElementById('student-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    }
  }, []);

  // Debounced resize — 200ms, passive
  useEffect(() => {
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => setIsMobile(window.innerWidth <= 768), 200); };
    window.addEventListener('resize', h, { passive: true });
    return () => { window.removeEventListener('resize', h); clearTimeout(t); };
  }, []);

  const phrases = useRef([
    'Premium Study Notes', 'Master Python', 'Excel in Exams', 'Land Your Dream Job',
    '60 Questions Mock Tests', 'Anti-Cheat Exam System', 'Earn Your Certificate', 'Basic • Advanced • Pro'
  ]).current;

  // Typewriter — rAF for smooth timing, no setInterval
  useEffect(() => {
    const cp = phrases[pi];
    const speed = del ? 22 : 65;
    let rafId;
    const t = setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        if (!del && idx < cp.length) { setTxt(cp.substring(0, idx + 1)); setIdx(idx + 1); }
        else if (del && idx > 0) { setTxt(cp.substring(0, idx - 1)); setIdx(idx - 1); }
        else if (!del && idx === cp.length) { setTimeout(() => setDel(true), 1800); }
        else if (del && idx === 0) { setDel(false); setPi((pi + 1) % phrases.length); }
      });
    }, speed);
    return () => { clearTimeout(t); if (rafId) cancelAnimationFrame(rafId); };
  }, [idx, del, pi, phrases]);

  const actionCards = useMemo(() => {
    const base = [
      { icon: '📚', label: 'Browse Notes', page: 'products', glow: 'rgba(99,102,241,0.3)', c: '#6366f1' },
      { icon: <PythonLogo size={22} />, label: 'Mock Tests', page: 'mocktests', glow: 'rgba(16,185,129,0.3)', c: '#10b981' },
      { icon: '💻', label: 'Compiler', page: 'compiler', glow: 'rgba(0,102,184,0.3)', c: '#0066b8' },
      { icon: '🔥', label: '30-Day Streak', page: 'streak', glow: 'rgba(255,107,0,0.3)', c: '#ff6b00' },
      { icon: '📦', label: 'My Orders', page: 'orders', glow: 'rgba(245,158,11,0.3)', c: '#f59e0b' },
      { icon: '🏆', label: 'Leaderboard', page: 'leaderboard', glow: 'rgba(139,92,246,0.3)', c: '#8b5cf6' },
    ];
    const auth = user
      ? { icon: '👤', label: 'Logout', page: null, glow: 'rgba(239,68,68,0.3)', c: '#ef4444', action: logout }
      : { icon: '🔐', label: 'Login', page: 'login', glow: 'rgba(236,72,153,0.3)', c: '#ec4899' };
    return [...base, auth];
  }, [user, logout]);

  const mobileRow1 = actionCards.slice(0, 4);
  const mobileRow2 = actionCards.slice(4);

  return (
    <main itemScope itemType="https://schema.org/WebPage"
      style={{ paddingTop: isMobile ? '62px' : '70px', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      <SEOHead />
      <ScrollProgressBar />

      {/* ══ HERO ══ */}
      <section style={{
        padding: isMobile ? '44px 20px 36px' : '92px 24px 72px',
        textAlign: 'center', position: 'relative',
        background: isDark
          ? 'linear-gradient(180deg,rgba(15,10,60,0.7) 0%,transparent 100%)'
          : 'linear-gradient(180deg,rgba(238,241,255,0.9) 0%,transparent 100%)',
      }}>
        {/* Decorative dots — CSS animation only */}
        <div style={{ position: 'absolute', top: '20px', left: '10%', width: '6px', height: '6px', borderRadius: '50%', background: '#6366f140', animation: 'float 3s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40px', right: '15%', width: '4px', height: '4px', borderRadius: '50%', background: '#ec4899', animation: 'float 4s ease-in-out infinite 1s', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '30px', left: '20%', width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e50', animation: 'float 3.5s ease-in-out infinite 0.5s', pointerEvents: 'none' }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.25)', borderRadius: '50px',
          padding: '6px 16px 6px 8px', marginBottom: isMobile ? '22px' : '30px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#6366f1,#ec4899)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🎓</div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6366f1' }}>PySkill</span>
          <div style={{ width: '1px', height: '12px', background: 'rgba(99,102,241,0.25)' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#a78bfa' : '#7c3aed' }}>EST. 2026</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #22c55e' }} />
        </div>

        <h1 style={{
          fontSize: isMobile ? 'clamp(1.7rem, 6.5vw, 2.1rem)' : '4rem',
          fontWeight: '900', marginBottom: '14px',
          background: 'linear-gradient(135deg,#1e40af,#6366f1 45%,#ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
          minHeight: isMobile ? 'auto' : '100px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 8px', letterSpacing: '-0.035em',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
        }}>
          {txt}
          <span style={{ borderRight: '3px solid #6366f1', marginLeft: '3px', height: isMobile ? '28px' : '60px', display: 'inline-block', verticalAlign: 'middle', animation: 'blink 0.7s infinite' }} />
        </h1>

        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.1rem', color: isDark ? '#94a3b8' : '#64748b',
          maxWidth: '520px', margin: '0 auto 26px', lineHeight: 1.75, fontWeight: '500',
          opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.28s',
        }}>
          Quality study materials for Python & Job Prep — delivered instantly after payment.
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.38s' }}>
          {[
            { icon: Shield, color: '#10b981', text: 'Secure Payment' },
            { icon: Zap, color: '#6366f1', text: 'Instant Access' },
            { icon: BookOpen, color: '#ec4899', text: '100% Original' },
          ].map((b, i) => (
            <div key={i} className="ps-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isDark ? `${b.color}12` : `${b.color}0d`, padding: '7px 16px', borderRadius: '50px', border: `1px solid ${b.color}${isDark ? '38' : '28'}` }}>
              <b.icon size={13} color={b.color} />
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.76rem', fontWeight: '700', color: b.color }}>{b.text}</span>
            </div>
          ))}
        </div>

        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.48s', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage('mocktests')}
            className="ps-btn"
            style={{ background: 'linear-gradient(135deg,#10b981,#22c55e)', border: 'none', color: '#fff', padding: isMobile ? '14px 26px' : '16px 38px', fontSize: isMobile ? '0.94rem' : '1.05rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 28px rgba(16,185,129,0.35)' }}>
            <PythonLogo size={isMobile ? 17 : 19} />
            Take Test Free
          </button>

          <button onClick={() => setCurrentPage('products')}
            className="ps-btn"
            style={{ background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)', border: `1.5px solid rgba(99,102,241,${isDark ? '0.4' : '0.25'})`, color: '#6366f1', padding: isMobile ? '14px 26px' : '16px 38px', fontSize: isMobile ? '0.94rem' : '1.05rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Download size={isMobile ? 17 : 19} />
            Browse Notes
          </button>
        </div>
      </section>

      {/* ══ ACTION CARDS ══ */}
      <section style={{ padding: isMobile ? '16px 16px' : '32px 24px', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {isMobile ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '9px' }}>
              {mobileRow1.map((c, i) => (
                <ActionCard key={i} card={c} isDark={isDark} isMobile={isMobile} onClick={() => { if (c.action) c.action(); else setCurrentPage(c.page); }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', marginTop: '9px' }}>
              {mobileRow2.map((c, i) => (
                <ActionCard key={i} card={c} isDark={isDark} isMobile={isMobile} onClick={() => { if (c.action) c.action(); else setCurrentPage(c.page); }} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '12px' }}>
            {actionCards.map((c, i) => (
              <ActionCard key={i} card={c} isDark={isDark} isMobile={isMobile} onClick={() => { if (c.action) c.action(); else setCurrentPage(c.page); }} />
            ))}
          </div>
        )}
      </section>

      <StatsBar isDark={isDark} isMobile={isMobile} />
      <MockTestSection isDark={isDark} isMobile={isMobile} setCurrentPage={setCurrentPage} />
      <TopRankersSection isDark={isDark} isMobile={isMobile} setCurrentPage={setCurrentPage} />
      <StudentReviews isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} user={user} />
      <Timeline isDark={isDark} isMobile={isMobile} />
      <FeaturesSection isDark={isDark} isMobile={isMobile} />
      <WhySection isDark={isDark} isMobile={isMobile} />
      <FounderSection isDark={isDark} isMobile={isMobile} />

      <nav aria-label="Quick links" style={{ display: 'none' }}>
        <a href="/mocktests">Python Mock Tests</a>
        <a href="/products">Python Notes PDF</a>
        <a href="/leaderboard">Leaderboard</a>
        <a href="/compiler">Python Compiler</a>
      </nav>
    </main>
  );
}