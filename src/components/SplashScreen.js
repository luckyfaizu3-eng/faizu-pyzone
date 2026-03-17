import React, { useEffect, useRef, useState } from 'react';

// ─── PYTHON OFFICIAL LOGO ────────────────────────────────────────────────────
function PythonLogo({ size = 60, style = {} }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255"
      width={size} height={size}
      style={{ display: 'block', flexShrink: 0, ...style }}>
      <path fill="#4584B6" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
      <path fill="#FFDE57" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
    </svg>
  );
}

const FEATURES = [
  { icon: '🐍', label: 'Python Practice',  sub: '100+ Questions',    color: '#10b981' },
  { icon: '📝', label: 'Mock Tests',        sub: 'Timed & Graded',    color: '#6366f1' },
  { icon: '🏆', label: 'Certificates',      sub: 'Verified Badge',    color: '#f59e0b' },
  { icon: '🥇', label: 'Leaderboard',       sub: 'Compete & Win',     color: '#ef4444' },
  { icon: '📚', label: 'Study Notes',       sub: 'Beginner Friendly', color: '#8b5cf6' },
  { icon: '🧬', label: 'NEET Mock Test',    sub: '720 Marks',         color: '#06b6d4' },
  { icon: '🔒', label: 'Anti-Cheat System', sub: 'Real Exam Feel',    color: '#f97316' },
  { icon: '✨', label: '& Much More',       sub: 'Growing Daily',     color: '#ec4899' },
];

// ─── FLOATING PARTICLES ───────────────────────────────────────────────────────
function BgCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let W, H, raf;
    const particles = [];

    class P {
      constructor() { this.reset(true); }
      reset(random) {
        this.x     = Math.random() * W;
        this.y     = random ? Math.random() * H : (Math.random() < 0.5 ? -4 : H + 4);
        this.r     = Math.random() * 2.5 + 0.5;
        this.vx    = (Math.random() - 0.5) * 0.3;
        this.vy    = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.4 + 0.05;
        this.phase = Math.random() * Math.PI * 2;
        this.color = Math.random() > 0.7 ? '#fde68a' : '#ffffff';
      }
      step() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += 0.015;
        if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) this.reset(false);
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha * (0.6 + 0.4 * Math.sin(this.phase));
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.r * 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = canvas.width  = rect.width  || 500;
      H = canvas.height = rect.height || 600;
      particles.length = 0;
      for (let i = 0; i < 80; i++) particles.push(new P());
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.save();
            ctx.globalAlpha = 0.06 * (1 - dist / 80);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      particles.forEach(p => { p.step(); p.draw(); });
      raf = requestAnimationFrame(loop);
    }

    resize();
    loop();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  );
}

// ─── SCREEN 1 — LOGO + BRAND ──────────────────────────────────────────────────
function Screen1({ visible }) {
  const [logoIn,  setLogoIn]  = useState(false);
  const [textIn,  setTextIn]  = useState(false);
  const [tagIn,   setTagIn]   = useState(false);
  const [badgeIn, setBadgeIn] = useState(false);
  const [pulse,   setPulse]   = useState(false);

  useEffect(() => {
    if (!visible) return;
    const t0 = setTimeout(() => setLogoIn(true),  200);
    const t1 = setTimeout(() => setTextIn(true),  900);
    const t2 = setTimeout(() => setTagIn(true),  1400);
    const t3 = setTimeout(() => setBadgeIn(true), 1900);
    const t4 = setTimeout(() => setPulse(true),   2200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [visible]);

  return (
    <div style={{
      position: 'absolute',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '0 2rem',
      opacity:    visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
      pointerEvents: 'none',
    }}>
      {/* Python Logo box — same position as 🎓 was */}
      <div style={{
        width:  'clamp(90px,18vw,120px)',
        height: 'clamp(90px,18vw,120px)',
        borderRadius: '28px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
        opacity:    logoIn ? 1 : 0,
        transform:  logoIn ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        animation:  pulse ? 'logoPulse 3s ease-in-out infinite' : 'none',
      }}>
        <PythonLogo size="clamp(52px,11vw,72px)" />
      </div>

      {/* Brand name */}
      <div style={{
        fontSize: 'clamp(2.5rem,10vw,3.8rem)',
        fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 10,
        opacity:    textIn ? 1 : 0,
        transform:  textIn ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <span style={{ color: '#ffffff' }}>Py</span>
        <span style={{ color: '#fde68a', textShadow: '0 0 30px rgba(253,230,138,0.6)' }}>Skill</span>
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 'clamp(0.75rem,2.5vw,0.9rem)',
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 22,
        opacity:    tagIn ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        Premium Study Platform
      </div>

      {/* Badges */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        opacity:    badgeIn ? 1 : 0,
        transform:  badgeIn ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s ease',
      }}>
        {['🐍 Python', '📜 Certified', '🏆 Compete'].map((b, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 50, padding: '5px 14px',
            fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
          }}>{b}</div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN 2 — FEATURES ─────────────────────────────────────────────────────
function Screen2({ visible }) {
  const [shown,   setShown]   = useState([]);
  const [titleIn, setTitleIn] = useState(false);

  useEffect(() => {
    if (!visible) { setShown([]); setTitleIn(false); return; }
    setTimeout(() => setTitleIn(true), 100);
    FEATURES.forEach((_, i) => {
      setTimeout(() => setShown(prev => [...prev, i]), 300 + i * 120);
    });
  }, [visible]);

  return (
    <div style={{
      position: 'absolute',
      width: '90%', maxWidth: 440,
      opacity:    visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      <div style={{
        textAlign: 'center', marginBottom: 18,
        opacity:    titleIn ? 1 : 0,
        transform:  titleIn ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'all 0.6s ease',
      }}>
        <div style={{ fontSize: 'clamp(1.1rem,3.5vw,1.4rem)', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Everything in One Place 🚀
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          Your complete Python learning companion
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 14, padding: '11px 13px',
            display: 'flex', alignItems: 'center', gap: 10,
            backdropFilter: 'blur(12px)',
            opacity:    shown.includes(i) ? 1 : 0,
            transform:  shown.includes(i) ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.92)',
            transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow:  shown.includes(i) ? `0 4px 20px ${f.color}20` : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${f.color}25`, border: `1px solid ${f.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
            }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{f.label}</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN 3 — LAUNCH ───────────────────────────────────────────────────────
function Screen3({ visible, onComplete }) {
  const [progress,   setProgress]   = useState(0);
  const [statusIdx,  setStatusIdx]  = useState(0);
  const rafRef = useRef(null);

  const statuses = [
    { text: 'Initializing PySkill...', emoji: '⚡' },
    { text: 'Loading Questions...',    emoji: '📚' },
    { text: 'Setting Up Tests...',     emoji: '📝' },
    { text: 'Almost There...',         emoji: '🏆' },
    { text: 'Launching! 🚀',           emoji: '🎓' },
  ];

  useEffect(() => {
    if (!visible) return;
    let p = 0;
    const tick = () => {
      p = Math.min(p + 0.85, 100);
      setProgress(p);
      setStatusIdx(Math.floor((p / 100) * (statuses.length - 1)));
      if (p < 100) rafRef.current = requestAnimationFrame(tick);
      else setTimeout(() => onComplete(), 400);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pct = Math.round(progress);
  const currentStatus = statuses[statusIdx] || statuses[0];

  return (
    <div style={{
      position: 'absolute',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '0 2.5rem', width: '85%', maxWidth: 340,
      opacity:    visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      {/* Python Logo box — same style/position as Screen1 logo box */}
      <div style={{
        width: 76, height: 76, borderRadius: 20,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
        animation: 'logoPulse 2s ease-in-out infinite',
      }}>
        <PythonLogo size={46} />
      </div>

      {/* Brand */}
      <div style={{
        fontSize: 'clamp(2rem,7vw,2.8rem)',
        fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 6,
      }}>
        <span style={{ color: '#fff' }}>Py</span>
        <span style={{ color: '#fde68a', textShadow: '0 0 20px rgba(253,230,138,0.5)' }}>Skill</span>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginBottom: 32, fontWeight: 500 }}>
        Your complete learning companion
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', marginBottom: 14 }}>
        <div style={{
          height: 4, background: 'rgba(255,255,255,0.15)',
          borderRadius: 10, overflow: 'hidden', marginBottom: 12, position: 'relative',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #818cf8, #fde68a)',
            borderRadius: 10,
            boxShadow: '0 0 12px rgba(253,230,138,0.6)',
            transition: 'width 0.016s linear',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', right: -2, top: '50%',
              transform: 'translateY(-50%)',
              width: 10, height: 10, borderRadius: '50%',
              background: '#fde68a', boxShadow: '0 0 10px #fde68a',
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>{currentStatus.emoji}</span>
            <span>{currentStatus.text}</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#fde68a', fontFamily: 'monospace', fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {statuses.map((_, i) => (
          <div key={i} style={{
            width: i === statusIdx ? 20 : 6,
            height: 6, borderRadius: 3,
            background: i <= statusIdx ? '#fde68a' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── ANIMATED MESH GRADIENT ──────────────────────────────────────────────────
function MeshGradient() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let W, H, raf, t = 0;

    const orbs = [
      { x: 0.2, y: 0.3, r: 0.45, color: '#6366f1', vx: 0.0003, vy: 0.0002 },
      { x: 0.8, y: 0.2, r: 0.40, color: '#8b5cf6', vx: -0.0002, vy: 0.0003 },
      { x: 0.5, y: 0.8, r: 0.50, color: '#ec4899', vx: 0.0002, vy: -0.0002 },
      { x: 0.1, y: 0.7, r: 0.35, color: '#3b82f6', vx: 0.0003, vy: -0.0003 },
      { x: 0.9, y: 0.6, r: 0.38, color: '#a855f7', vx: -0.0003, vy: 0.0002 },
      { x: 0.5, y: 0.1, r: 0.42, color: '#06b6d4', vx: -0.0002, vy: 0.0003 },
    ];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return `${r},${g},${b}`;
    }

    function draw() {
      t += 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0812';
      ctx.fillRect(0, 0, W, H);
      orbs.forEach(orb => {
        orb.x += orb.vx * Math.sin(t * 0.01);
        orb.y += orb.vy * Math.cos(t * 0.01);
        if (orb.x < 0 || orb.x > 1) orb.vx *= -1;
        if (orb.y < 0 || orb.y > 1) orb.vy *= -1;
        const x = orb.x * W; const y = orb.y * H;
        const r = orb.r * Math.min(W, H);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0,   `rgba(${hexToRgb(orb.color)}, 0.35)`);
        grad.addColorStop(0.5, `rgba(${hexToRgb(orb.color)}, 0.12)`);
        grad.addColorStop(1,   `rgba(${hexToRgb(orb.color)}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, W, H);
      raf = requestAnimationFrame(draw);
    }

    resize(); draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  );
}

// ─── MAIN SPLASH ─────────────────────────────────────────────────────────────
function SplashScreen({ onComplete }) {
  const [screen, setScreen] = useState(1);

  useEffect(() => {
    // Screen1: 3.5s — Logo + brand animates in nicely
    // Screen2: 4.5s — Features grid
    // Screen3: loading bar starts immediately
    const t1 = setTimeout(() => setScreen(2), 3500);
    const t2 = setTimeout(() => setScreen(3), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0f0c29',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <MeshGradient />

      {/* Blobs */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 380, height: 380, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', filter: 'blur(60px)', pointerEvents: 'none', animation: 'blobFloat1 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: -140, left: -80, width: 420, height: 420, borderRadius: '50%', background: 'rgba(236,72,153,0.2)', filter: 'blur(70px)', pointerEvents: 'none', animation: 'blobFloat2 10s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '40%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(253,230,138,0.08)', filter: 'blur(50px)', pointerEvents: 'none', animation: 'blobFloat3 12s ease-in-out infinite' }} />

      <BgCanvas />

      <Screen1 visible={screen === 1} />
      <Screen2 visible={screen === 2} />
      <Screen3 visible={screen === 3} onComplete={onComplete} />

      <style>{`
        @keyframes logoPulse {
          0%,100% { box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 0 rgba(69,132,182,0); }
          50%      { box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 14px rgba(69,132,182,0.15); }
        }
        @keyframes blobFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-30px,20px) scale(1.08); }
        }
        @keyframes blobFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-30px) scale(1.05); }
        }
        @keyframes blobFloat3 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(15px,15px); }
        }
      `}</style>
    </div>
  );
}

export default SplashScreen;