import React, { useEffect, useRef } from 'react';
import { useTheme } from '../App';

const Background = () => {
  const canvasRef = useRef(null);
  const { isDark, backgroundTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = window.innerWidth < 768 ? 35 : 70;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        size: Math.random() * 1.8 + 0.6,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        speedZ: Math.random() * 0.4 + 0.15,
        color: getParticleColor(),
      }));
    };

    const getParticleColor = () => {
      const schemes = [
        // 0: Cosmic Slate — Ice Blue + Magenta
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(76,201,240,0.55)' : 'rgba(14,165,233,0.4)')
          : (isDark ? 'rgba(247,37,133,0.45)' : 'rgba(219,39,119,0.35)'),
        // 1: Electric Mint
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(0,255,135,0.5)' : 'rgba(5,150,105,0.4)')
          : (isDark ? 'rgba(96,239,255,0.45)' : 'rgba(34,211,238,0.4)'),
        // 2: Midnight Amber
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(255,214,10,0.5)' : 'rgba(217,119,6,0.4)')
          : (isDark ? 'rgba(255,159,28,0.5)' : 'rgba(251,191,36,0.4)'),
        // 3: Warm Dusk
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(191,90,242,0.5)' : 'rgba(124,58,237,0.4)')
          : (isDark ? 'rgba(255,159,10,0.5)' : 'rgba(245,158,11,0.4)'),
        // 4: Rose Gold
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(255,107,107,0.5)' : 'rgba(225,29,72,0.4)')
          : (isDark ? 'rgba(255,184,108,0.5)' : 'rgba(251,146,60,0.4)'),
        // 5: Deep Forest
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(0,255,135,0.5)' : 'rgba(5,150,105,0.4)')
          : (isDark ? 'rgba(127,255,110,0.45)' : 'rgba(110,231,183,0.4)'),
        // 6: Arctic
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(147,197,253,0.5)' : 'rgba(59,130,246,0.4)')
          : (isDark ? 'rgba(196,245,255,0.5)' : 'rgba(125,211,252,0.4)'),
        // 7: Neon Indigo
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(99,102,241,0.6)' : 'rgba(67,56,202,0.4)')
          : (isDark ? 'rgba(165,180,252,0.55)' : 'rgba(199,210,254,0.4)'),
        // 8: Ember
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(251,113,133,0.5)' : 'rgba(225,29,72,0.4)')
          : (isDark ? 'rgba(253,164,175,0.5)' : 'rgba(254,205,211,0.4)'),
        // 9: Toxic Lime
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(163,230,53,0.5)' : 'rgba(101,163,13,0.4)')
          : (isDark ? 'rgba(217,249,157,0.5)' : 'rgba(190,242,100,0.4)'),
        // 10: Fuchsia Storm
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(217,70,239,0.5)' : 'rgba(192,38,211,0.4)')
          : (isDark ? 'rgba(240,171,252,0.5)' : 'rgba(245,208,254,0.4)'),
        // 11: Sunset
        () => Math.random() > 0.5
          ? (isDark ? 'rgba(251,191,36,0.5)' : 'rgba(202,138,4,0.4)')
          : (isDark ? 'rgba(252,211,77,0.5)' : 'rgba(253,224,71,0.4)'),
      ];
      return (schemes[backgroundTheme] || schemes[0])();
    };

    const getBackgroundGradient = () => {
      const themes = [
        // 0: Cosmic Slate
        {
          dark:  ['#080b14', '#0d1528', '#080b14'],
          light: ['#f0f7ff', '#e0edff', '#d5e8ff'],
        },
        // 1: Electric Mint
        {
          dark:  ['#020f0a', '#041a10', '#020f0a'],
          light: ['#f0fdf6', '#dcfce7', '#bbf7d0'],
        },
        // 2: Midnight Amber
        {
          dark:  ['#0c0800', '#1a1100', '#0c0800'],
          light: ['#fffbeb', '#fef3c7', '#fde68a'],
        },
        // 3: Warm Dusk
        {
          dark:  ['#0f0714', '#180d24', '#0f0714'],
          light: ['#faf5ff', '#f3e8ff', '#ede9fe'],
        },
        // 4: Rose Gold
        {
          dark:  ['#120608', '#1e0a0d', '#120608'],
          light: ['#fff1f2', '#ffe4e6', '#fecdd3'],
        },
        // 5: Deep Forest
        {
          dark:  ['#020f07', '#041a0c', '#020f07'],
          light: ['#f0fdf4', '#dcfce7', '#bbf7d0'],
        },
        // 6: Arctic
        {
          dark:  ['#030c18', '#051525', '#030c18'],
          light: ['#f0f9ff', '#e0f2fe', '#bae6fd'],
        },
        // 7: Neon Indigo
        {
          dark:  ['#05050f', '#0a0a1e', '#05050f'],
          light: ['#eef2ff', '#e0e7ff', '#c7d2fe'],
        },
        // 8: Ember
        {
          dark:  ['#140508', '#200810', '#140508'],
          light: ['#fff1f2', '#ffe4e6', '#fecdd3'],
        },
        // 9: Toxic Lime
        {
          dark:  ['#050f02', '#0a1a04', '#050f02'],
          light: ['#f7fee7', '#ecfccb', '#d9f99d'],
        },
        // 10: Fuchsia Storm
        {
          dark:  ['#0f0514', '#1a0820', '#0f0514'],
          light: ['#fdf4ff', '#fae8ff', '#f5d0fe'],
        },
        // 11: Sunset
        {
          dark:  ['#0f0800', '#1a1000', '#0f0800'],
          light: ['#fefce8', '#fef9c3', '#fef08a'],
        },
      ];

      const t = themes[backgroundTheme] || themes[0];
      const stops = isDark ? t.dark : t.light;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0,   stops[0]);
      grad.addColorStop(0.5, stops[1]);
      grad.addColorStop(1,   stops[2]);
      return grad;
    };

    const draw = () => {
      ctx.fillStyle = getBackgroundGradient();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.z -= p.speedZ;

        if (p.z < 1) {
          p.z = 1000;
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.color = getParticleColor();
        }
        if (p.x < 0 || p.x > canvas.width)  p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        const scale = 1000 / p.z;
        const x2d = (p.x - canvas.width  / 2) * scale + canvas.width  / 2;
        const y2d = (p.y - canvas.height / 2) * scale + canvas.height / 2;
        const sz  = p.size * scale;

        ctx.beginPath();
        ctx.arc(x2d, y2d, sz, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur  = isDark ? 12 : 7;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        particles.slice(i + 1).forEach(o => {
          const os = 1000 / o.z;
          const ox = (o.x - canvas.width  / 2) * os + canvas.width  / 2;
          const oy = (o.y - canvas.height / 2) * os + canvas.height / 2;
          const dx = x2d - ox, dy = y2d - oy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(x2d, y2d);
            ctx.lineTo(ox, oy);
            ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${0.18 * (1 - dist / 90)})`);
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark, backgroundTheme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default Background;