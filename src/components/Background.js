import React, { useEffect, useRef } from 'react';
import { useTheme } from '../App';

const Background = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

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
        color: Math.random() > 0.5 
          ? (isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(99, 102, 241, 0.4)') 
          : (isDark ? 'rgba(236, 72, 153, 0.5)' : 'rgba(236, 72, 153, 0.4)')
      }));
    };

    const draw = () => {
      // Background gradient based on theme
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      if (isDark) {
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e1b4b');
        gradient.addColorStop(1, '#0f172a');
      } else {
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(0.5, '#f1f5f9');
        gradient.addColorStop(1, '#e2e8f0');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles (3D effect)
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

        // Connect nearby particles
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
            ctx.strokeStyle = isDark 
              ? `rgba(139, 92, 246, ${0.2 * (1 - distance / 100)})`
              : `rgba(99, 102, 241, ${0.15 * (1 - distance / 100)})`;
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
  }, [isDark]);

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