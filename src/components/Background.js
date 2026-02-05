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
      const count = window.innerWidth < 768 ? 40 : 80;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        speedZ: Math.random() * 0.5 + 0.2,
        color: getParticleColor(),
        hue: Math.random() * 360
      }));
    };

    const getParticleColor = () => {
      // Different color schemes based on theme
      const colorSchemes = [
        // Theme 0: Original (Purple/Pink)
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(99, 102, 241, 0.4)') 
          : (isDark ? 'rgba(236, 72, 153, 0.5)' : 'rgba(236, 72, 153, 0.4)'),
        
        // Theme 1: Blue/Cyan
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(14, 165, 233, 0.4)') 
          : (isDark ? 'rgba(6, 182, 212, 0.5)' : 'rgba(34, 211, 238, 0.4)'),
        
        // Theme 2: Green/Emerald
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(16, 185, 129, 0.5)' : 'rgba(5, 150, 105, 0.4)') 
          : (isDark ? 'rgba(52, 211, 153, 0.5)' : 'rgba(110, 231, 183, 0.4)'),
        
        // Theme 3: Orange/Amber
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(217, 119, 6, 0.4)') 
          : (isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(252, 211, 77, 0.4)'),
        
        // Theme 4: Red/Rose
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(244, 63, 94, 0.5)' : 'rgba(225, 29, 72, 0.4)') 
          : (isDark ? 'rgba(251, 113, 133, 0.5)' : 'rgba(251, 207, 232, 0.4)'),
        
        // Theme 5: Violet/Purple
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(124, 58, 237, 0.4)') 
          : (isDark ? 'rgba(167, 139, 250, 0.5)' : 'rgba(196, 181, 253, 0.4)'),
        
        // Theme 6: Teal/Cyan
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(20, 184, 166, 0.5)' : 'rgba(13, 148, 136, 0.4)') 
          : (isDark ? 'rgba(45, 212, 191, 0.5)' : 'rgba(94, 234, 212, 0.4)'),
        
        // Theme 7: Indigo/Blue
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(79, 70, 229, 0.5)' : 'rgba(67, 56, 202, 0.4)') 
          : (isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(165, 180, 252, 0.4)'),
        
        // Theme 8: Lime/Green
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(132, 204, 22, 0.5)' : 'rgba(101, 163, 13, 0.4)') 
          : (isDark ? 'rgba(163, 230, 53, 0.5)' : 'rgba(190, 242, 100, 0.4)'),
        
        // Theme 9: Fuchsia/Pink
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(217, 70, 239, 0.5)' : 'rgba(192, 38, 211, 0.4)') 
          : (isDark ? 'rgba(240, 171, 252, 0.5)' : 'rgba(245, 208, 254, 0.4)'),
        
        // Theme 10: Sky/Blue
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(14, 165, 233, 0.5)' : 'rgba(2, 132, 199, 0.4)') 
          : (isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(125, 211, 252, 0.4)'),
        
        // Theme 11: Yellow/Amber
        () => Math.random() > 0.5 
          ? (isDark ? 'rgba(234, 179, 8, 0.5)' : 'rgba(202, 138, 4, 0.4)') 
          : (isDark ? 'rgba(250, 204, 21, 0.5)' : 'rgba(253, 224, 71, 0.4)')
      ];

      const scheme = colorSchemes[backgroundTheme] || colorSchemes[0];
      return scheme();
    };

    const getBackgroundGradient = () => {
      const gradients = [
        // Theme 0: Original Purple
        { start: '#0f172a', mid: '#1e1b4b', end: '#0f172a', light: { start: '#f8fafc', mid: '#f1f5f9', end: '#e2e8f0' } },
        
        // Theme 1: Blue
        { start: '#0c4a6e', mid: '#075985', end: '#0c4a6e', light: { start: '#f0f9ff', mid: '#e0f2fe', end: '#bae6fd' } },
        
        // Theme 2: Green
        { start: '#064e3b', mid: '#065f46', end: '#064e3b', light: { start: '#f0fdf4', mid: '#dcfce7', end: '#bbf7d0' } },
        
        // Theme 3: Orange
        { start: '#7c2d12', mid: '#9a3412', end: '#7c2d12', light: { start: '#fffbeb', mid: '#fef3c7', end: '#fde68a' } },
        
        // Theme 4: Red
        { start: '#881337', mid: '#9f1239', end: '#881337', light: { start: '#fff1f2', mid: '#ffe4e6', end: '#fecdd3' } },
        
        // Theme 5: Violet
        { start: '#4c1d95', mid: '#5b21b6', end: '#4c1d95', light: { start: '#faf5ff', mid: '#f3e8ff', end: '#e9d5ff' } },
        
        // Theme 6: Teal
        { start: '#134e4a', mid: '#115e59', end: '#134e4a', light: { start: '#f0fdfa', mid: '#ccfbf1', end: '#99f6e4' } },
        
        // Theme 7: Indigo
        { start: '#1e1b4b', mid: '#312e81', end: '#1e1b4b', light: { start: '#eef2ff', mid: '#e0e7ff', end: '#c7d2fe' } },
        
        // Theme 8: Lime
        { start: '#365314', mid: '#3f6212', end: '#365314', light: { start: '#f7fee7', mid: '#ecfccb', end: '#d9f99d' } },
        
        // Theme 9: Fuchsia
        { start: '#701a75', mid: '#86198f', end: '#701a75', light: { start: '#fdf4ff', mid: '#fae8ff', end: '#f5d0fe' } },
        
        // Theme 10: Sky
        { start: '#0c4a6e', mid: '#0369a1', end: '#0c4a6e', light: { start: '#f0f9ff', mid: '#e0f2fe', end: '#bae6fd' } },
        
        // Theme 11: Yellow
        { start: '#713f12', mid: '#854d0e', end: '#713f12', light: { start: '#fefce8', mid: '#fef9c3', end: '#fef08a' } }
      ];

      const gradient = gradients[backgroundTheme] || gradients[0];
      
      if (isDark) {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, gradient.start);
        grad.addColorStop(0.5, gradient.mid);
        grad.addColorStop(1, gradient.end);
        return grad;
      } else {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, gradient.light.start);
        grad.addColorStop(0.5, gradient.light.mid);
        grad.addColorStop(1, gradient.light.end);
        return grad;
      }
    };

    const draw = () => {
      // Background gradient based on theme
      ctx.fillStyle = getBackgroundGradient();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles (3D effect) - SAME AS ORIGINAL
      particles.forEach((particle, i) => {
        // Update 3D position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.z -= particle.speedZ;

        // Reset if too close or out of bounds
        if (particle.z < 1) {
          particle.z = 1000;
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.color = getParticleColor(); // Update color on reset
        }
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // 3D projection
        const scale = 1000 / particle.z;
        const x2d = (particle.x - canvas.width / 2) * scale + canvas.width / 2;
        const y2d = (particle.y - canvas.height / 2) * scale + canvas.height / 2;
        const size = particle.size * scale;

        // Draw particle with subtle glow
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = isDark ? 10 : 8;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles (same as original)
        particles.slice(i + 1).forEach(other => {
          const otherScale = 1000 / other.z;
          const otherX = (other.x - canvas.width / 2) * otherScale + canvas.width / 2;
          const otherY = (other.y - canvas.height / 2) * otherScale + canvas.height / 2;
          
          const dx = x2d - otherX;
          const dy = y2d - otherY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(x2d, y2d);
            ctx.lineTo(otherX, otherY);
            ctx.strokeStyle = particle.color.replace(/[\d.]+\)$/, `${0.2 * (1 - distance / 100)})`);
            ctx.lineWidth = 0.5;
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
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default Background;