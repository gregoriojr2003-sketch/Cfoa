import React, { useEffect, useRef } from 'react';

interface ConfettiOverlayProps {
  active: boolean;
  score?: number;
  durationMs?: number;
  onComplete?: () => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'ribbon';
}

export const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({
  active,
  score = 80,
  durationMs = 4800,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Respect reduced motion preference
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Military gold, emerald, cyan, indigo, and crisp white celebration palette
    const palette =
      score >= 80
        ? ['#fbbf24', '#10b981', '#34d399', '#fde047', '#38bdf8', '#ffffff']
        : score >= 50
        ? ['#38bdf8', '#fbbf24', '#10b981', '#818cf8', '#f8fafc']
        : ['#fbbf24', '#38bdf8', '#94a3b8', '#f8fafc'];

    const particleCount = score >= 80 ? 150 : 100;
    const particles: ConfettiParticle[] = [];

    const createWave = (count: number, originYFactor: number) => {
      for (let i = 0; i < count; i++) {
        const fromLeft = i % 2 === 0;
        const startX =
          originYFactor < 0
            ? Math.random() * canvas.width
            : fromLeft
            ? canvas.width * 0.15 + (Math.random() - 0.5) * 120
            : canvas.width * 0.85 + (Math.random() - 0.5) * 120;

        const startY =
          originYFactor < 0
            ? -20 - Math.random() * 180
            : canvas.height * originYFactor;

        const spreadAngle =
          originYFactor < 0
            ? Math.PI / 2 + (Math.random() - 0.5) * 0.8
            : fromLeft
            ? -Math.PI / 3 + (Math.random() - 0.5) * 0.6
            : (-2 * Math.PI) / 3 + (Math.random() - 0.5) * 0.6;

        const speed =
          originYFactor < 0 ? 3 + Math.random() * 5 : 9 + Math.random() * 11;

        const shapes: ConfettiParticle['shape'][] = ['rect', 'circle', 'ribbon'];

        particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(spreadAngle) * speed,
          vy:
            originYFactor < 0
              ? Math.abs(Math.sin(spreadAngle) * speed)
              : Math.sin(spreadAngle) * speed,
          size: 7 + Math.random() * 7,
          aspect: 0.45 + Math.random() * 0.45,
          color: palette[Math.floor(Math.random() * palette.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.18,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05 + Math.random() * 0.08,
          opacity: 1,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
    };

    // Initial twin cannon burst + top rain wave
    createWave(Math.floor(particleCount * 0.6), 0.65);
    createWave(Math.floor(particleCount * 0.4), -0.1);

    const gravity = 0.22;
    const drag = 0.985;

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveParticles = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.4;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > durationMs * 0.65) {
          p.opacity = Math.max(
            0,
            1 - (elapsed - durationMs * 0.65) / (durationMs * 0.35)
          );
        }

        if (p.y < canvas.height + 60 && p.opacity > 0.01) {
          aliveParticles++;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'ribbon') {
            const scaleY = Math.cos(p.wobble);
            ctx.scale(1, scaleY);
            ctx.fillRect(-p.size * 0.7, -p.size * 0.22, p.size * 1.4, p.size * 0.44);
          } else {
            const scaleX = Math.sin(p.wobble);
            ctx.scale(scaleX, 1);
            ctx.fillRect(
              -p.size / 2,
              -(p.size * p.aspect) / 2,
              p.size,
              p.size * p.aspect
            );
          }

          ctx.restore();
        }
      }

      if (elapsed < durationMs && aliveParticles > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [active, score, durationMs, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 no-print"
    />
  );
};
