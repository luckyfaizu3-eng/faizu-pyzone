// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Download, Shield, Zap, BookOpen } from 'lucide-react';
import { useTheme, useAuth } from '../App';
import { db } from '../firebase';
import {
  collection, getDocs, query, orderBy,
  limit
} from 'firebase/firestore';

/* ─────────────────────────────────────────
   GLOBAL CSS — Clean, No Blur, No Overlays
───────────────────────────────────────── */
const PREMIUM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  :root {
    --font-display: 'Bricolage Grotesque', sans-serif;
    --font-serif: 'Instrument Serif', serif;
    --font-body: 'DM Sans', sans-serif;

    --indigo: #5b5bd6;
    --indigo-light: #7c7ce8;
    --emerald: #10b981;
    --rose: #f43f5e;
    --amber: #f59e0b;
    --violet: #8b5cf6;
  }

  * { font-family: var(--font-body); }

  .ps-heading {
    font-family: var(--font-display);
    letter-spacing: -0.03em;
  }

  .ps-serif {
    font-family: var(--font-serif);
  }

  /* Cards — transparent so particles show through, no blur */
  .ps-card {
    transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.24s ease;
    will-change: transform;
  }
  .ps-card:hover {
    transform: translateY(-3px);
  }

  .ps-card-light {
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .ps-card-dark {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  /* Action Cards */
  .action-card {
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
    will-change: transform;
    cursor: pointer;
    border: none;
    outline: none;
  }
  .action-card:hover { transform: translateY(-3px) scale(1.02); }
  .action-card:active { transform: translateY(0) scale(0.97); }

  /* Buttons */
  .ps-btn-primary {
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s ease;
    will-change: transform;
  }
  .ps-btn-primary:hover { transform: translateY(-2px); filter: brightness(1.05); }
  .ps-btn-primary:active { transform: translateY(0) scale(0.98); }

  .ps-btn-ghost {
    transition: transform 0.2s ease, background 0.18s ease;
  }
  .ps-btn-ghost:hover { transform: translateY(-2px); }

  /* Chips */
  .ps-chip {
    transition: transform 0.16s ease;
    cursor: default;
  }
  .ps-chip:hover { transform: translateY(-1px); }

  .ps-live-badge { cursor: pointer; }

  /* Animations */
  @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes shimmer { 0%{opacity:1} 50%{opacity:0.5} 100%{opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulseGlow { 0%,100%{opacity:1} 50%{opacity:0.5} }

  /* Scroll progress */
  #ps-scroll-bar { position:fixed; top:0; left:0; right:0; height:2px; z-index:9999; pointer-events:none; }
  #ps-scroll-fill { height:100%; width:100%; transform-origin:left; transform:scaleX(0); background:linear-gradient(90deg,#5b5bd6,#10b981,#f43f5e); transition:none; }
`;

if (typeof document !== 'undefined' && !document.getElementById('ps-premium-css')) {
  const s = document.createElement('style');
  s.id = 'ps-premium-css';
  s.textContent = PREMIUM_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   PYTHON LOGO
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
   SCROLL PROGRESS BAR
───────────────────────────────────────── */
const ScrollProgressBar = memo(function ScrollProgressBar() {
  const fillRef = useRef(null);
  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    let raf = null;
    const fn = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const d = document.documentElement;
        const total = d.scrollHeight - d.clientHeight;
        fill.style.transform = `scaleX(${total > 0 ? d.scrollTop / total : 0})`;
        raf = null;
      });
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <div id="ps-scroll-bar">
      <div id="ps-scroll-fill" ref={fillRef} />
    </div>
  );
});

/* ─────────────────────────────────────────
   LIVE COUNTER
───────────────────────────────────────── */
const LiveCounter = memo(function LiveCounter({ baseEnd, suffix = '', label, color }) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current || baseEnd === 0) { setCount(baseEnd); return; }
    hasRun.current = true;
    let cur = 0; const step = Math.max(1, Math.ceil(baseEnd / 55));
    let raf, last = 0;
    const tick = (ts) => {
      if (ts - last >= 18) { cur += step; if (cur >= baseEnd) { setCount(baseEnd); return; } setCount(cur); last = ts; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [baseEnd]);

  return (
    <div style={{ textAlign: 'center', padding: '16px 12px' }}>
      <div style={{
        fontSize: '1.9rem', fontWeight: '800', color, lineHeight: 1,
        fontFamily: 'var(--font-display)', letterSpacing: '-0.04em'
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontSize: '0.62rem', fontWeight: '600', color: 'inherit',
        opacity: 0.55, marginTop: '6px', letterSpacing: '0.1em',
        textTransform: 'uppercase', fontFamily: 'var(--font-body)'
      }}>{label}</div>
    </div>
  );
});

/* ─────────────────────────────────────────
   STATS BAR
───────────────────────────────────────── */
const StatsBar = memo(function StatsBar({ isDark, isMobile }) {
  const [stats, setStats] = useState([
    { baseEnd: 0, suffix: '+', label: 'Students Tested', color: '#5b5bd6' },
    { baseEnd: 0, suffix: '%', label: 'Pass Rate', color: '#10b981' },
    { baseEnd: 3, suffix: '', label: 'Test Levels', color: '#f59e0b' },
    { baseEnd: 0, suffix: '+', label: 'Certificates 🏅', color: '#f43f5e' },
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
          { baseEnd: total, suffix: '+', label: 'Students Tested', color: '#5b5bd6' },
          { baseEnd: passRate, suffix: '%', label: 'Pass Rate', color: '#10b981' },
          { baseEnd: 3, suffix: '', label: 'Test Levels', color: '#f59e0b' },
          { baseEnd: passed, suffix: '+', label: 'Certificates 🏅', color: '#f43f5e' },
        ]);
      } catch (e) { console.error(e); }
    })();
  }, []);

  return (
    <section style={{ padding: isMobile ? '0 16px 32px' : '0 24px 44px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
        gap: isMobile ? '10px' : '14px'
      }}>
        {stats.map((s, i) => (
          <div key={i}
            style={{
              borderRadius: '16px',
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.25)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
              transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
            <LiveCounter baseEnd={s.baseEnd} suffix={s.suffix} label={s.label} color={s.color} />
          </div>
        ))}
      </div>
      <p style={{
        textAlign: 'center', marginTop: '10px', fontSize: '0.6rem', fontWeight: '600',
        color: isDark ? '#4a5568' : '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase'
      }}>
        ✅ Live data from PySkill Leaderboard
      </p>
    </section>
  );
});

/* ─────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────── */
const SectionLabel = memo(function SectionLabel({ color, text }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      background: `${color}18`, border: `1px solid ${color}35`,
      borderRadius: '50px', padding: '5px 14px', marginBottom: '10px',
      fontSize: '0.62rem', fontWeight: '700', color, letterSpacing: '0.14em',
      textTransform: 'uppercase', fontFamily: 'var(--font-body)',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: color,
        display: 'inline-block'
      }} />
      {text}
    </div>
  );
});

/* ─────────────────────────────────────────
   ACTION CARD
───────────────────────────────────────── */
const ActionCard = memo(function ActionCard({ card, isDark, isMobile, onClick }) {
  return (
    <button onClick={onClick} className="action-card"
      style={{
        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.22)',
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.5)',
        borderRadius: '18px',
        padding: isMobile ? '14px 6px 12px' : '22px 10px 18px',
        width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px',
        boxShadow: 'none',
        minHeight: isMobile ? '80px' : '100px',
      }}>
      <div style={{
        width: isMobile ? '38px' : '46px', height: isMobile ? '38px' : '46px',
        borderRadius: '13px',
        background: isDark ? `${card.c}18` : `${card.c}18`,
        border: `1px solid ${card.c}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? '1.2rem' : '1.35rem', flexShrink: 0,
      }}>{card.icon}</div>
      <span style={{
        fontSize: isMobile ? '0.58rem' : '0.66rem', fontWeight: '600',
        color: isDark ? '#c8d4e0' : '#1f2937',
        textAlign: 'center', lineHeight: 1.3,
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.01em',
      }}>{card.label}</span>
    </button>
  );
});

/* ─────────────────────────────────────────
   MOCK TEST SECTION
───────────────────────────────────────── */
const MockTestSection = memo(function MockTestSection({ isDark, isMobile, setCurrentPage }) {
  const levels = useMemo(() => [
    {
      emoji: '🌱', level: 'Basic', q: '60 Qs', t: '60 Min',
      pill: 'FREE', pillColor: '#10b981',
      accent: '#10b981', sub: 'Beginner', isFree: true,
    },
    {
      emoji: '🔥', level: 'Advanced', q: '60 Qs', t: '120 Min',
      pill: 'HOT', pillColor: '#5b5bd6',
      accent: '#5b5bd6', sub: 'Expert', isFree: false,
    },
    {
      emoji: '⭐', level: 'Pro', q: '60 Qs', t: '180 Min',
      pill: 'PRO', pillColor: '#f59e0b',
      accent: '#f59e0b', sub: 'Master', isFree: false,
    },
  ], []);

  return (
    <section style={{ padding: isMobile ? '0 16px 40px' : '0 24px 56px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '16px' : '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <PythonLogo size={22} />
          <span className="ps-heading" style={{
            fontSize: '1.05rem', fontWeight: '700',
            color: isDark ? '#e8eef5' : '#111827'
          }}>Mock Tests</span>
        </div>
        <button onClick={() => setCurrentPage('mocktests')} style={{
          background: 'none', border: 'none', fontSize: '0.72rem', fontWeight: '700',
          color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: '4px', fontFamily: 'var(--font-body)'
        }}>
          View All <span>→</span>
        </button>
      </div>

      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? '10px' : '14px',
        overflowX: isMobile ? 'auto' : 'visible',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        paddingBottom: isMobile ? '6px' : '0', marginBottom: '16px',
      }}>
        {levels.map((lvl, i) => (
          <div key={i} onClick={() => setCurrentPage('mocktests')}
            style={{
              flexShrink: isMobile ? 0 : undefined, width: isMobile ? '155px' : 'auto',
              borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.22)',
              border: `1.5px solid ${isDark ? lvl.accent + '30' : lvl.accent + '35'}`,
              transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ padding: '18px 16px 12px', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                fontSize: '0.5rem', fontWeight: '800', padding: '3px 9px',
                borderRadius: '50px',
                background: `${lvl.pillColor}22`,
                color: lvl.pillColor,
                border: `1px solid ${lvl.pillColor}40`,
                letterSpacing: '0.1em', fontFamily: 'var(--font-body)',
              }}>{lvl.pill}</div>
              <span style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', marginBottom: '12px', display: 'block' }}>{lvl.emoji}</span>
              <div className="ps-heading" style={{
                fontSize: '1rem', fontWeight: '700', marginBottom: '5px', color: lvl.accent
              }}>{lvl.level}</div>
              <div style={{
                fontSize: '0.66rem', lineHeight: 1.7,
                color: isDark ? 'rgba(200,212,224,0.85)' : 'rgba(31,41,55,0.8)',
                fontFamily: 'var(--font-body)'
              }}>
                {lvl.q} · {lvl.t}<br/>
                <span style={{ fontWeight: '700', color: lvl.accent }}>{lvl.sub}</span>
              </div>
            </div>
            <div style={{
              padding: '9px 16px', fontSize: '0.63rem', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: `${lvl.accent}12`,
              color: lvl.accent,
              borderTop: `1px solid ${lvl.accent}22`,
              fontFamily: 'var(--font-body)',
            }}>
              <span>{lvl.isFree ? '🆓 Free!' : 'Start Now!'}</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
        {[
          { dot: '#10b981', label: 'Anti-Cheat' },
          { dot: '#f59e0b', label: 'Tab Block' },
          { dot: '#5b5bd6', label: 'Fullscreen' },
          { dot: '#f43f5e', label: 'Cert 55%+' },
        ].map((c, i) => (
          <div key={i} className="ps-chip" style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.28)',
            border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.55)',
            borderRadius: '50px', padding: '5px 13px',
            fontSize: '0.62rem', fontWeight: '600',
            color: isDark ? '#94a3b8' : '#374151',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
            {c.label}
          </div>
        ))}
      </div>
    </section>
  );
});

/* ─────────────────────────────────────────
   TOP CARD
───────────────────────────────────────── */
const TopCard = memo(function TopCard({ isDark, isMobile, medal, data, isFirst, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.22)',
        border: `1px solid ${medal.color}30`,
        boxShadow: isFirst ? `0 4px 20px ${medal.color}25` : 'none',
        transform: isFirst ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = isFirst ? 'scale(1.02) translateY(-3px)' : 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = isFirst ? 'scale(1.02)' : 'scale(1)'}
    >
      <div style={{ height: '3px', background: `linear-gradient(90deg,${medal.color},${medal.color}50,transparent)` }} />
      <div style={{ padding: isMobile ? '16px 12px' : '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: isMobile ? '2rem' : '2.4rem', lineHeight: 1, marginBottom: '8px' }}>{medal.emoji}</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: `${medal.color}18`,
          border: `1px solid ${medal.color}30`,
          borderRadius: '50px', padding: '3px 10px', marginBottom: '10px'
        }}>
          <span style={{
            fontSize: '0.52rem', fontWeight: '800', color: medal.color,
            letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)'
          }}>{medal.label}</span>
        </div>
        <div className="ps-heading" style={{
          fontSize: isMobile ? '1.7rem' : '2rem', fontWeight: '800',
          color: medal.color, lineHeight: 1, marginBottom: '8px', letterSpacing: '-0.04em'
        }}>{data.score}%</div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: '700',
          color: isDark ? '#e2e8f0' : '#111827', marginBottom: '4px',
          fontFamily: 'var(--font-display)'
        }}>{data.name}</div>
        <div style={{
          fontSize: '0.62rem', color: isDark ? '#64748b' : '#6b7280', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center',
          fontFamily: 'var(--font-body)'
        }}>
          <PythonLogo size={11} /> {data.test}
        </div>
        {data.time && (
          <div style={{
            marginTop: '10px', fontSize: '0.58rem', fontWeight: '600',
            color: isDark ? '#4a5568' : '#6b7280',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: '20px', padding: '3px 10px', display: 'inline-block',
            fontFamily: 'var(--font-body)'
          }}>
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
      borderRadius: '20px', overflow: 'hidden',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.15)',
      border: `1px solid ${medal.color}18`,
    }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg,${medal.color}30,transparent)` }} />
      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem', lineHeight: 1, marginBottom: '8px', opacity: 0.2 }}>{medal.emoji}</div>
        <div style={{
          display: 'inline-flex', gap: '4px',
          background: `${medal.color}0a`, border: `1px solid ${medal.color}18`,
          borderRadius: '50px', padding: '3px 10px', marginBottom: '14px'
        }}>
          <span style={{ fontSize: '0.52rem', fontWeight: '800', color: `${medal.color}55`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{medal.label}</span>
        </div>
        {[70, 50, 40].map((w, i) => (
          <div key={i} style={{
            height: i === 0 ? '22px' : '10px', width: `${w}%`, margin: '0 auto 10px',
            borderRadius: '6px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            animation: 'shimmer 1.6s infinite'
          }} />
        ))}
        <div style={{ fontSize: '0.62rem', color: isDark ? '#334155' : '#9ca3af', fontWeight: '500' }}>No data yet</div>
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

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'leaderboard'), orderBy('percentage', 'desc'), limit(20));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const seen = new Set();
        const top = all
          .filter(e => (e.testLevel || '').toLowerCase().trim() !== 'neet')
          .filter(e => { const key = (e.name || '').toLowerCase().trim(); if (seen.has(key)) return false; seen.add(key); return true; })
          .slice(0, 3);
        setRankers(top);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const medals = useMemo(() => [
    { emoji: '🥇', color: '#f59e0b', label: 'Champion', rank: 1 },
    { emoji: '🥈', color: '#5b5bd6', label: 'Runner-up', rank: 2 },
    { emoji: '🥉', color: '#8b5cf6', label: '3rd Place', rank: 3 },
  ], []);

  const displayData = rankers.map(r => ({
    name: r.name, score: r.percentage,
    test: r.testTitle || r.testLevel || 'Python Test',
    time: r.timeTaken || '', isReal: true
  }));
  const hasAnyReal = displayData.length > 0;

  return (
    <section style={{ padding: isMobile ? '0 16px 52px' : '0 24px 68px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <div className="ps-heading" style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '700',
            color: isDark ? '#e8eef5' : '#111827'
          }}>🏆 Top Performers</div>
          <div style={{
            fontSize: '0.7rem', color: isDark ? '#64748b' : '#6b7280',
            fontWeight: '500', marginTop: '3px', fontFamily: 'var(--font-body)'
          }}>
            {hasAnyReal ? 'Real students · Real scores · Live data' : 'Be the first to top the leaderboard! 🚀'}
          </div>
        </div>
        <div className="ps-live-badge"
          onClick={() => setCurrentPage('leaderboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.6rem', fontWeight: '700', color: '#10b981',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.28)',
            padding: '6px 14px', borderRadius: '50px',
            letterSpacing: '0.08em', cursor: 'pointer',
          }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulseGlow 2s infinite' }} />
          LIVE
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '44px', color: isDark ? '#475569' : '#6b7280' }}>
          <div style={{ fontSize: '1.4rem' }}>⏳</div>
          <div style={{ marginTop: '8px', fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>Loading top performers...</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? '8px' : '14px', marginBottom: '14px' }}>
            {[0,1,2].map(i => {
              const m = medals[i]; const d = displayData[i];
              return d
                ? <TopCard key={i} isDark={isDark} isMobile={isMobile} medal={m} data={d} isFirst={i===0} onClick={() => setCurrentPage('leaderboard')} />
                : <SkeletonRankerCard key={i} isDark={isDark} medal={m} />;
            })}
          </div>
          {!hasAnyReal && (
            <div style={{
              textAlign: 'center', padding: '18px 24px',
              background: isDark ? 'rgba(91,91,214,0.06)' : 'rgba(255,255,255,0.2)',
              border: '1px dashed rgba(91,91,214,0.25)',
              borderRadius: '16px'
            }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: isDark ? '#94a3b8' : '#4b5563', fontFamily: 'var(--font-body)' }}>
                No one has topped the leaderboard yet. Take a test and claim your spot! 🏆
              </p>
              <button onClick={() => setCurrentPage('mocktests')} className="ps-btn-primary"
                style={{ background: 'linear-gradient(135deg,#5b5bd6,#f43f5e)', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '50px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
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
   REVIEW CARD
───────────────────────────────────────── */
const ReviewPreviewCard = memo(function ReviewPreviewCard({ review, isDark, isMobile }) {
  const stars = review.stars || 5;
  const palettes = [
    { from: '#5b5bd6', to: '#8b5cf6' }, { from: '#10b981', to: '#0ea5e9' },
    { from: '#f59e0b', to: '#f43f5e' }, { from: '#f43f5e', to: '#8b5cf6' },
    { from: '#3b82f6', to: '#5b5bd6' }, { from: '#14b8a6', to: '#5b5bd6' },
  ];
  const pal = palettes[(review.name?.charCodeAt(0) || 0) % palettes.length];

  return (
    <div style={{
      borderRadius: '20px', overflow: 'hidden',
      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.25)',
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.55)',
      transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${pal.from}, ${pal.to})` }} />
      <div style={{ padding: isMobile ? '18px 16px' : '22px 22px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {review.photo
                ? <img src={review.photo} alt={review.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                : <span style={{ color: '#fff', fontWeight: '800', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>{(review.name || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <div style={{
              position: 'absolute', bottom: '-3px', right: '-3px',
              width: '17px', height: '17px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#5b5bd6,#10b981)',
              border: '2px solid ' + (isDark ? '#0f172a' : '#fff'),
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.94rem', fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a',
              marginBottom: '5px', fontFamily: 'var(--font-display)'
            }}>{review.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginBottom: '5px' }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= stars ? '#f59e0b' : 'none'} stroke={s <= stars ? '#f59e0b' : isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
              ))}
              <span style={{ fontSize: '0.64rem', fontWeight: '700', color: '#f59e0b', marginLeft: '4px' }}>{stars}.0</span>
              <span style={{ fontSize: '0.6rem', color: isDark ? '#334155' : '#cbd5e1', margin: '0 4px' }}>·</span>
              <span style={{ fontSize: '0.62rem', color: isDark ? '#475569' : '#6b7280', fontWeight: '500', fontFamily: 'var(--font-body)' }}>{timeAgo(review.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {review.course && (
                <span style={{
                  fontSize: '0.58rem', fontWeight: '700', padding: '2px 9px', borderRadius: '6px',
                  background: `${pal.from}18`, color: pal.from,
                  border: `1px solid ${pal.from}28`, fontFamily: 'var(--font-body)'
                }}>🎓 {review.course}</span>
              )}
              {review.address && (
                <span style={{
                  fontSize: '0.58rem', fontWeight: '700', padding: '2px 9px', borderRadius: '6px',
                  background: 'rgba(16,185,129,0.1)', color: '#059669',
                  border: '1px solid rgba(16,185,129,0.22)', fontFamily: 'var(--font-body)'
                }}>📍 {review.address}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{
          position: 'relative',
          background: isDark ? 'rgba(255,255,255,0.04)' : `${pal.from}0a`,
          borderRadius: '12px', padding: '12px 14px 12px 16px',
          marginBottom: '12px', borderLeft: `3px solid ${pal.from}60`
        }}>
          <p style={{
            margin: 0, fontSize: isMobile ? '0.82rem' : '0.875rem',
            color: isDark ? '#cbd5e1' : '#374151',
            lineHeight: 1.75, fontWeight: '400', fontStyle: 'italic',
            fontFamily: 'var(--font-body)'
          }}>{review.text}</p>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
          borderRadius: '8px', padding: '3px 10px'
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
          <span style={{ fontSize: '0.58rem', fontWeight: '700', color: '#059669', letterSpacing: '0.04em', fontFamily: 'var(--font-body)' }}>Verified PySkill Student</span>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   STUDENT REVIEWS PREVIEW
───────────────────────────────────────── */
function StudentReviewsPreview({ isDark, isMobile, setCurrentPage }) {
  const [review, setReview] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'studentReviews'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) setReview({ id: snap.docs[0].id, ...snap.docs[0].data() });
        const countSnap = await getDocs(collection(db, 'studentReviews'));
        setTotalCount(countSnap.size);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  if (!loading && !review) return null;

  return (
    <section id="student-reviews" style={{ padding: isMobile ? '0 16px 52px' : '0 24px 68px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '18px' : '26px' }}>
        <div>
          <SectionLabel color="#10b981" text="Real Reviews" />
          <h2 className="ps-heading" style={{
            fontSize: isMobile ? '1.25rem' : '1.6rem', fontWeight: '700',
            background: 'linear-gradient(135deg,#059669,#5b5bd6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '4px 0 5px', letterSpacing: '-0.03em'
          }}>What Students Say ⭐</h2>
          {totalCount > 0 && (
            <p style={{ fontSize: '0.76rem', color: isDark ? '#64748b' : '#6b7280', margin: 0, fontFamily: 'var(--font-body)', fontWeight: '400' }}>
              {totalCount}+ genuine reviews from real students
            </p>
          )}
        </div>
        <button onClick={() => setCurrentPage('reviews')} className="ps-btn-primary"
          style={{
            flexShrink: 0,
            background: 'linear-gradient(135deg,#10b981,#5b5bd6)',
            border: 'none', color: '#fff', padding: isMobile ? '9px 16px' : '10px 22px',
            borderRadius: '50px', fontWeight: '700', fontSize: isMobile ? '0.7rem' : '0.76rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 14px rgba(16,185,129,0.25)', fontFamily: 'var(--font-body)'
          }}>
          View All <span>→</span>
        </button>
      </div>

      {loading ? (
        <div style={{
          height: '160px', borderRadius: '20px',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.2)',
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.5)',
          animation: 'shimmer 1.6s infinite'
        }} />
      ) : review ? (
        <ReviewPreviewCard review={review} isDark={isDark} isMobile={isMobile} />
      ) : null}

      {!loading && review && (
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button onClick={() => setCurrentPage('reviews')} className="ps-btn-ghost"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: `1px solid rgba(16,185,129,0.25)`,
              color: '#059669', padding: '11px 28px', borderRadius: '50px',
              fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              fontFamily: 'var(--font-body)'
            }}>
            <span>⭐</span> Read All {totalCount > 1 ? `${totalCount} Reviews` : 'Reviews'} <span>→</span>
          </button>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────
   TIMELINE
───────────────────────────────────────── */
const Timeline = memo(function Timeline({ isDark, isMobile }) {
  const events = [
    { date: '1 Jan 2026', title: 'The Idea', desc: 'PySkill was born — a vision to give students quality Python study material at affordable prices.', icon: '💡', tag: 'ORIGIN', color: '#8b5cf6' },
    { date: '10 Jan 2026', title: 'Work Begins', desc: 'Development kicked off. Notes curated, questions filtered, platform designed from scratch.', icon: '⚡', tag: 'BUILD', color: '#5b5bd6' },
    { date: '15 Feb 2026', title: 'Website Live 🚀', desc: 'PySkill officially launched! First students enrolled, first certificates issued.', icon: '🚀', tag: 'LAUNCH', color: '#f43f5e' },
  ];

  return (
    <section style={{ padding: isMobile ? '0 16px 60px' : '0 24px 76px', maxWidth: '680px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '36px' : '48px' }}>
        <SectionLabel color="#5b5bd6" text="Our Story · 2026" />
        <h2 className="ps-heading" style={{
          fontSize: isMobile ? '1.35rem' : '1.9rem', fontWeight: '700',
          background: 'linear-gradient(135deg,#1e40af,#5b5bd6,#f43f5e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: '4px 0 6px', letterSpacing: '-0.03em'
        }}>From Idea to Reality</h2>
        <p style={{ color: isDark ? '#64748b' : '#6b7280', fontSize: '0.82rem', margin: 0, fontFamily: 'var(--font-body)', fontWeight: '400' }}>
          Every milestone that brought PySkill to life
        </p>
      </div>

      <div style={{ position: 'relative', paddingLeft: isMobile ? '54px' : '68px' }}>
        <div style={{
          position: 'absolute', left: isMobile ? '22px' : '28px',
          top: '14px', bottom: '14px', width: '2px',
          background: isDark
            ? 'linear-gradient(180deg,rgba(139,92,246,0.4),rgba(91,91,214,0.4),rgba(244,63,94,0.4))'
            : 'linear-gradient(180deg,rgba(139,92,246,0.3),rgba(91,91,214,0.3),rgba(244,63,94,0.3))',
          borderRadius: '2px'
        }} />
        {events.map((evt, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: i < events.length - 1 ? (isMobile ? '28px' : '32px') : 0 }}>
            <div style={{
              position: 'absolute', left: isMobile ? '-40px' : '-52px', top: '12px',
              width: isMobile ? '34px' : '42px', height: isMobile ? '34px' : '42px',
              borderRadius: '50%',
              background: isDark ? `${evt.color}22` : `${evt.color}18`,
              border: `2px solid ${evt.color}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? '0.95rem' : '1.1rem', zIndex: 2
            }}>{evt.icon}</div>
            <div style={{
              borderRadius: '18px', overflow: 'hidden',
              padding: isMobile ? '16px' : '18px 22px',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.22)',
              border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.5)',
              position: 'relative',
              transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,${evt.color},transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.58rem', fontWeight: '800', color: evt.color,
                  background: `${evt.color}18`,
                  border: `1px solid ${evt.color}28`,
                  borderRadius: '20px', padding: '2px 10px', letterSpacing: '0.1em',
                  fontFamily: 'var(--font-body)'
                }}>{evt.tag}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: '500', color: isDark ? '#64748b' : '#6b7280', fontFamily: 'var(--font-body)' }}>{evt.date}</span>
              </div>
              <h3 className="ps-heading" style={{
                fontSize: isMobile ? '0.94rem' : '1rem', fontWeight: '700',
                color: isDark ? '#e2e8f0' : '#0f172a', margin: '0 0 5px'
              }}>{evt.title}</h3>
              <p style={{
                fontSize: isMobile ? '0.78rem' : '0.82rem',
                color: isDark ? '#94a3b8' : '#374151',
                margin: 0, lineHeight: 1.7,
                fontFamily: 'var(--font-body)', fontWeight: '400'
              }}>{evt.desc}</p>
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
  const features = [
    { icon: '📚', title: 'Quality Content', desc: 'Expert-curated notes & filtered important questions for every topic.', color: '#5b5bd6' },
    { icon: '🔒', title: 'Secure & Safe', desc: 'Razorpay-protected payments — UPI, Cards, Net Banking & more.', color: '#10b981' },
    { icon: '⚡', title: 'Instant Download', desc: 'Get your PDFs the second your payment is confirmed.', color: '#f43f5e' },
  ];
  return (
    <section style={{ padding: isMobile ? '0 16px 40px' : '0 24px 56px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <h2 className="ps-heading" style={{
        fontSize: isMobile ? '1.35rem' : '1.9rem', fontWeight: '700',
        textAlign: 'center', marginBottom: isMobile ? '22px' : '34px',
        color: isDark ? '#e8eef5' : '#0f172a', letterSpacing: '-0.03em'
      }}>Why Students Love Us</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? '12px' : '14px' }}>
        {features.map((f, i) => (
          <div key={i}
            style={{
              borderRadius: '20px', padding: isMobile ? '22px 20px' : '26px 22px',
              position: 'relative', overflow: 'hidden',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.22)',
              border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.5)',
              transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
              background: `linear-gradient(180deg,${f.color},${f.color}40)`,
              borderRadius: '20px 0 0 20px'
            }} />
            <div style={{ paddingLeft: '16px' }}>
              <div style={{
                width: '46px', height: '46px',
                background: `${f.color}18`,
                borderRadius: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.3rem', marginBottom: '14px',
                border: `1px solid ${f.color}28`
              }}>{f.icon}</div>
              <div className="ps-heading" style={{
                fontSize: isMobile ? '0.92rem' : '0.98rem', fontWeight: '700',
                color: isDark ? '#e8eef5' : '#0f172a', marginBottom: '7px'
              }}>{f.title}</div>
              <div style={{
                fontSize: isMobile ? '0.78rem' : '0.82rem',
                color: isDark ? '#94a3b8' : '#4b5563',
                lineHeight: 1.75, fontFamily: 'var(--font-body)', fontWeight: '400'
              }}>{f.desc}</div>
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
  const items = [
    { icon: '📜', title: 'Our Policy', desc: 'Genuine, quality-checked materials. No refund after download, but satisfaction guaranteed with preview.', color: '#5b5bd6' },
    { icon: '💳', title: 'Secure Payment', desc: "Via Razorpay — India's most trusted gateway. UPI, Cards, Net Banking & Wallets. Fully encrypted.", color: '#10b981' },
    { icon: '🎯', title: 'Why Choose Us', desc: 'Instant access, lifetime downloads, mobile-friendly PDFs, expert content & 24/7 WhatsApp support.', color: '#f59e0b' },
    { icon: '⭐', title: 'What Makes Us Better', desc: 'No outdated content. Every note filtered for importance. Real reviews, no hidden charges.', color: '#8b5cf6' },
  ];
  return (
    <section style={{ padding: isMobile ? '0 16px 40px' : '0 24px 56px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <h2 className="ps-heading" style={{
        fontSize: isMobile ? '1.35rem' : '1.9rem', fontWeight: '700',
        textAlign: 'center', marginBottom: isMobile ? '22px' : '34px',
        background: 'linear-gradient(135deg,#5b5bd6,#f43f5e)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.03em'
      }}>Why PySkill?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? '12px' : '14px' }}>
        {items.map((c, i) => (
          <div key={i}
            style={{
              borderRadius: '20px', padding: isMobile ? '18px 16px' : '22px 20px',
              position: 'relative', overflow: 'hidden',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.22)',
              border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.5)',
              transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,${c.color},${c.color}25,transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px',
                background: `${c.color}18`,
                borderRadius: '13px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.15rem',
                border: `1px solid ${c.color}25`, flexShrink: 0
              }}>{c.icon}</div>
              <div>
                <h3 className="ps-heading" style={{
                  fontSize: isMobile ? '0.9rem' : '0.96rem', fontWeight: '700',
                  color: c.color, margin: '0 0 5px'
                }}>{c.title}</h3>
                <p style={{
                  fontSize: isMobile ? '0.77rem' : '0.81rem',
                  color: isDark ? '#94a3b8' : '#4b5563',
                  lineHeight: 1.7, margin: 0,
                  fontFamily: 'var(--font-body)', fontWeight: '400'
                }}>{c.desc}</p>
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
  const skills = useMemo(() => [
    { label: 'React.js', color: '#38bdf8' }, { label: 'Python', color: '#f59e0b' },
    { label: 'Firebase', color: '#fb923c' }, { label: 'Node.js', color: '#22c55e' },
    { label: 'UI/UX', color: '#a78bfa' }, { label: 'MongoDB', color: '#34d399' },
  ], []);

  const founderStats = useMemo(() => [
    { val: '6mo', label: 'Into Coding' }, { val: '10K+', label: 'Students Reached' },
    { val: '3', label: 'Exam Levels' }, { val: '∞', label: 'Coffee Cups ☕' },
  ], []);

  return (
    <section style={{ padding: isMobile ? '0 16px 80px' : '0 24px 100px', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <SectionLabel color="#5b5bd6" text="The Man Behind PySkill" />
        <h2 className="ps-heading" style={{
          fontSize: isMobile ? '1.45rem' : '2rem', fontWeight: '700',
          background: 'linear-gradient(135deg,#5b5bd6,#10b981)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: '6px 0 0', letterSpacing: '-0.03em'
        }}>Meet the Founder 👨‍💻</h2>
      </div>

      <div style={{
        borderRadius: '24px', overflow: 'hidden',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.55)',
        transition: 'transform 0.24s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg,#5b5bd6,#10b981,#f59e0b,#f43f5e)' }} />
        <div style={{ padding: isMobile ? '26px 18px' : '36px 40px' }}>
          <div style={{ display: 'flex', gap: isMobile ? '18px' : '32px', alignItems: 'flex-start', marginBottom: '28px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: isMobile ? '78px' : '96px', height: isMobile ? '78px' : '96px',
                borderRadius: '50%', overflow: 'hidden',
                border: '3px solid rgba(91,91,214,0.35)',
                boxShadow: '0 0 0 6px rgba(91,91,214,0.08)'
              }}>
                <img src="https://i.ibb.co/WWW1ttkx/Whats-App-Image-2026-01-31-at-1-57-14-PM.jpg"
                  alt="Faizan Tariq — Founder PySkill" loading="lazy" crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '7px' }}>
                <h3 className="ps-heading" style={{
                  fontSize: isMobile ? '1.35rem' : '1.65rem', fontWeight: '700',
                  color: isDark ? '#f1f5f9' : '#0f172a', margin: 0, letterSpacing: '-0.03em'
                }}>Faizan Tariq</h3>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(91,91,214,0.12)',
                  border: '1px solid rgba(91,91,214,0.28)', borderRadius: '20px', padding: '3px 10px'
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#5b5bd6" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                  <span style={{ fontSize: '0.58rem', fontWeight: '800', color: '#5b5bd6', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>VERIFIED FOUNDER</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '14px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.7rem', fontWeight: '600', color: isDark ? '#a78bfa' : '#6d28d9',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.22)', borderRadius: '20px', padding: '4px 12px',
                  fontFamily: 'var(--font-body)'
                }}>🎓 Software Engineering — ILS Srinagar</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.7rem', fontWeight: '600', color: isDark ? '#6ee7b7' : '#065f46',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.22)', borderRadius: '20px', padding: '4px 12px',
                  fontFamily: 'var(--font-body)'
                }}>📍 Anantnag, Kashmir</span>
              </div>
              <p style={{
                fontSize: isMobile ? '0.82rem' : '0.88rem',
                color: isDark ? '#94a3b8' : '#374151',
                lineHeight: 1.8, margin: '0 0 16px',
                fontFamily: 'var(--font-body)', fontWeight: '400'
              }}>
                Just 6 months into coding, I am a first-year Software Engineering student from <strong style={{ color: isDark ? '#e2e8f0' : '#0f172a', fontWeight: '700' }}>Anantnag, Kashmir</strong>, studying at <strong style={{ color: isDark ? '#e2e8f0' : '#0f172a', fontWeight: '700' }}>ILS Srinagar</strong>. Still a beginner — but driven enough to build PySkill entirely from scratch. Late nights, countless bugs, and a real passion for helping students learn Python. This is just the beginning. 🚀
              </p>
              <a href="https://instagram.com/code_with_06" target="_blank" rel="noopener noreferrer" className="ps-btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
                  borderRadius: '12px', color: '#fff', fontSize: '0.77rem', fontWeight: '700',
                  padding: '10px 18px', textDecoration: 'none', fontFamily: 'var(--font-body)',
                  boxShadow: '0 4px 16px rgba(253,29,29,0.25)'
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="#fff"/></svg>
                @code_with_06
              </a>
            </div>
          </div>

          <div style={{
            height: '1px',
            background: isDark
              ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)'
              : 'linear-gradient(90deg,transparent,rgba(0,0,0,0.07),transparent)',
            marginBottom: '24px'
          }} />

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4},1fr)`, gap: '10px', marginBottom: '24px' }}>
            {founderStats.map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '14px 8px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(91,91,214,0.06)',
                border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(91,91,214,0.14)',
                borderRadius: '14px'
              }}>
                <div className="ps-heading" style={{
                  fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '700',
                  background: 'linear-gradient(135deg,#5b5bd6,#10b981)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1
                }}>{s.val}</div>
                <div style={{
                  fontSize: '0.58rem', fontWeight: '600',
                  color: isDark ? '#64748b' : '#6b7280',
                  marginTop: '5px', letterSpacing: '0.06em',
                  textTransform: 'uppercase', fontFamily: 'var(--font-body)'
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{
              fontSize: '0.64rem', fontWeight: '700',
              color: isDark ? '#4a5568' : '#9ca3af',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: '10px', fontFamily: 'var(--font-body)'
            }}>Tech Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {skills.map((sk, i) => (
                <span key={i} className="ps-chip" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 13px', borderRadius: '20px',
                  background: `${sk.color}12`,
                  border: `1px solid ${sk.color}30`,
                  fontSize: '0.7rem', fontWeight: '600', color: sk.color,
                  fontFamily: 'var(--font-body)'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sk.color, display: 'inline-block' }} />
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
   SEO HEAD
───────────────────────────────────────── */
function SEOHead() {
  useEffect(() => {
    const SITE = 'https://pyskill.in';
    const TITLE = 'PySkill — Free Python Mock Tests, Notes & Certification 2026';
    const DESC = 'PySkill offers free & premium Python mock tests (Basic, Advanced, Pro), instant PDF notes, anti-cheat certification exams, and a live leaderboard. Join 10,000+ students in India.';
    const IMAGE = 'https://pyskill.in/og-image.png';
    const KEYWORDS = 'python mock test 2026, python certification india, python notes pdf, python basic test free, python advanced test, pyskill, python exam online, python questions answers, python leaderboard, python study material';
    document.title = TITLE;
    const setMeta = (sel, attr, val) => { let el = document.querySelector(sel); if (!el) { el = document.createElement('meta'); document.head.appendChild(el); } el.setAttribute(attr, val); };
    setMeta('meta[name="description"]','name','description'); setMeta('meta[name="description"]','content',DESC);
    setMeta('meta[name="keywords"]','name','keywords'); setMeta('meta[name="keywords"]','content',KEYWORDS);
    setMeta('meta[name="author"]','name','author'); setMeta('meta[name="author"]','content','Faizan Tariq');
    setMeta('meta[name="robots"]','name','robots'); setMeta('meta[name="robots"]','content','index, follow, max-image-preview:large');
    setMeta('meta[property="og:type"]','property','og:type'); setMeta('meta[property="og:type"]','content','website');
    setMeta('meta[property="og:url"]','property','og:url'); setMeta('meta[property="og:url"]','content',SITE);
    setMeta('meta[property="og:title"]','property','og:title'); setMeta('meta[property="og:title"]','content',TITLE);
    setMeta('meta[property="og:description"]','property','og:description'); setMeta('meta[property="og:description"]','content',DESC);
    setMeta('meta[property="og:image"]','property','og:image'); setMeta('meta[property="og:image"]','content',IMAGE);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); document.head.appendChild(canonical); }
    canonical.setAttribute('rel','canonical'); canonical.setAttribute('href',SITE);
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
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [mounted, setMounted] = useState(false);
  const { isDark } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);
  useEffect(() => {
    if (window.location.hash === '#student-reviews') {
      setTimeout(() => { document.getElementById('student-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 600);
    }
  }, []);
  useEffect(() => {
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => setIsMobile(window.innerWidth <= 768), 200); };
    window.addEventListener('resize', h, { passive: true });
    return () => { window.removeEventListener('resize', h); clearTimeout(t); };
  }, []);

  const phrases = useRef(['Premium Study Notes', 'Master Python', 'Excel in Exams', 'Land Your Dream Job', '60 Questions Mock Tests', 'Anti-Cheat Exam System', 'Earn Your Certificate', 'Basic • Advanced • Pro']).current;

  useEffect(() => {
    const cp = phrases[pi]; const speed = del ? 22 : 65;
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
      { icon: '📚', label: 'Browse Notes', page: 'products', c: '#5b5bd6' },
      { icon: <PythonLogo size={22} />, label: 'Mock Tests', page: 'mocktests', c: '#10b981' },
      { icon: '💻', label: 'Compiler', page: 'compiler', c: '#0ea5e9' },
      { icon: '🔥', label: '30-Day Streak', page: 'streak', c: '#f97316' },
      { icon: '📦', label: 'My Orders', page: 'orders', c: '#f59e0b' },
      { icon: '🏆', label: 'Leaderboard', page: 'leaderboard', c: '#8b5cf6' },
    ];
    const auth = user
      ? { icon: '👤', label: 'Logout', page: null, c: '#f43f5e', action: logout }
      : { icon: '🔐', label: 'Login', page: 'login', c: '#f43f5e' };
    return [...base, auth];
  }, [user, logout]);

  return (
    <main itemScope itemType="https://schema.org/WebPage"
      style={{
        paddingTop: isMobile ? '62px' : '70px',
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
        fontFamily: 'var(--font-body)',
        background: 'transparent', /* Let canvas Background show through */
      }}>

      <SEOHead />
      <ScrollProgressBar />

      {/* ══ HERO ══ */}
      <section style={{
        padding: isMobile ? '44px 20px 38px' : '88px 24px 72px',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: isDark ? 'rgba(91,91,214,0.12)' : 'rgba(255,255,255,0.35)',
          border: '1px solid rgba(91,91,214,0.25)', borderRadius: '50px',
          padding: '6px 16px 6px 8px', marginBottom: isMobile ? '24px' : '30px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-14px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg,#5b5bd6,#f43f5e)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🎓</div>
          <span style={{ fontSize: '0.77rem', fontWeight: '700', color: '#5b5bd6', fontFamily: 'var(--font-display)' }}>PySkill</span>
          <div style={{ width: '1px', height: '12px', background: 'rgba(91,91,214,0.25)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: '600', color: isDark ? '#a78bfa' : '#7c3aed', fontFamily: 'var(--font-body)' }}>EST. 2026</span>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: isMobile ? 'clamp(1.7rem, 6.5vw, 2.1rem)' : '3.7rem',
          fontWeight: '700', marginBottom: '16px',
          background: 'linear-gradient(135deg,#1e40af,#5b5bd6 45%,#f43f5e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1.1, fontFamily: 'var(--font-display)',
          minHeight: isMobile ? 'auto' : '96px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 8px', letterSpacing: '-0.04em',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(22px)',
          transition: 'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s',
        }}>
          {txt}
          <span style={{
            borderRight: '3px solid #5b5bd6', marginLeft: '4px',
            height: isMobile ? '26px' : '56px', display: 'inline-block',
            verticalAlign: 'middle', animation: 'blink 0.7s infinite'
          }} />
        </h1>

        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.05rem', color: isDark ? '#94a3b8' : '#374151',
          maxWidth: '500px', margin: '0 auto 26px', lineHeight: 1.75,
          fontFamily: 'var(--font-body)', fontWeight: '400',
          opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.28s',
        }}>
          Quality study materials for Python & Job Prep — delivered instantly after payment.
        </p>

        {/* Chips */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px', opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.38s' }}>
          {[
            { icon: Shield, color: '#10b981', text: 'Secure Payment' },
            { icon: Zap, color: '#5b5bd6', text: 'Instant Access' },
            { icon: BookOpen, color: '#f43f5e', text: '100% Original' },
          ].map((b, i) => (
            <div key={i} className="ps-chip" style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: isDark ? `${b.color}12` : 'rgba(255,255,255,0.3)',
              padding: '7px 16px', borderRadius: '50px',
              border: `1px solid ${b.color}${isDark ? '30' : '35'}`,
            }}>
              <b.icon size={13} color={b.color} />
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.74rem', fontWeight: '600', color: b.color, fontFamily: 'var(--font-body)' }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.48s', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage('mocktests')} className="ps-btn-primary"
            style={{
              background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff',
              padding: isMobile ? '13px 26px' : '15px 36px',
              fontSize: isMobile ? '0.92rem' : '1rem', borderRadius: '50px', cursor: 'pointer',
              fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)', fontFamily: 'var(--font-display)'
            }}>
            <PythonLogo size={isMobile ? 17 : 19} />
            Take Test Free
          </button>
          <button onClick={() => setCurrentPage('products')} className="ps-btn-ghost"
            style={{
              background: isDark ? 'rgba(91,91,214,0.12)' : 'rgba(255,255,255,0.35)',
              border: `1px solid rgba(91,91,214,${isDark ? '0.35' : '0.28'})`,
              color: '#5b5bd6', padding: isMobile ? '13px 26px' : '15px 36px',
              fontSize: isMobile ? '0.92rem' : '1rem', borderRadius: '50px', cursor: 'pointer',
              fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontFamily: 'var(--font-display)',
            }}>
            <Download size={isMobile ? 17 : 19} />
            Browse Notes
          </button>
        </div>
      </section>

      {/* ══ ACTION CARDS ══ */}
      <section style={{ padding: isMobile ? '16px 16px' : '28px 24px', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {isMobile ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '9px' }}>
              {actionCards.slice(0,4).map((c, i) => (
                <ActionCard key={i} card={c} isDark={isDark} isMobile={isMobile} onClick={() => { if (c.action) c.action(); else setCurrentPage(c.page); }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', marginTop: '9px' }}>
              {actionCards.slice(4).map((c, i) => (
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
      <StudentReviewsPreview isDark={isDark} isMobile={isMobile} setCurrentPage={setCurrentPage} />
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