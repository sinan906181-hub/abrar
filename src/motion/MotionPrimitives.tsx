import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { ArrowUp } from 'lucide-react';
import {
  DURATION,
  EASE_CINEMATIC,
  EASE_CURTAIN,
  SPRING_CURSOR,
  SPRING_MAGNETIC,
  SPRING_TILT,
  VIEWPORT_CONFIG,
} from './motionSystem';
import { BrandMark } from '../components/Icons';

/**
 * 1. Cinematic Opening Curtain
 * Rapid, non-blocking luxury monochrome intro with SVG monogram draw,
 * percentage counter, blur settle, and hairline curtain wipe.
 */
export const CinematicIntroCurtain: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(() => !shouldReduceMotion);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisible(false);
      return;
    }

    let rafId = 0;
    const start = performance.now();
    const duration = 680;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPercent(Math.round(eased * 100));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setVisible(false), 180);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
          exit={{
            clipPath: 'inset(0% 0% 100% 0%)',
            transition: { duration: 0.65, ease: EASE_CURTAIN },
          }}
          onClick={() => setVisible(false)}
          aria-hidden="true"
          className="fixed inset-0 z-[100] bg-[#030303] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden"
        >
          {/* Subtle rotating HUD ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute w-56 h-56 rounded-full border border-white/[0.08]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute w-72 h-72 rounded-full border border-dashed border-white/[0.06]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: EASE_CINEMATIC }}
            className="relative flex flex-col items-center gap-6"
          >
            <BrandMark className="w-10 h-10 text-white" />
            <div className="w-40 h-px bg-white/15 overflow-hidden">
              <motion.div
                className="h-full bg-white"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="font-mono text-xs tracking-[0.28em] text-zinc-400 tabular-nums">
              {String(percent).padStart(3, '0')}%
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 2. Atmospheric Particle & Light Field
 * High-performance grayscale starfield, orbital dust, mouse attraction/repulsion,
 * and subtle volumetric light sweep. Automatically pauses when hidden or reduced-motion.
 */
export const AtmosphericParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const pointer = { x: width * 0.5, y: height * 0.4, active: false };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    const count = width < 768 ? 32 : 64;
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22 - 0.05,
      radius: Math.random() * 1.4 + 0.4,
      baseAlpha: Math.random() * 0.35 + 0.08,
      phase: (i * 0.7) % (Math.PI * 2),
      depth: 0.4 + Math.random() * 0.8,
    }));

    let time = 0;
    const render = () => {
      if (document.hidden) {
        rafId = requestAnimationFrame(render);
        return;
      }

      time += 0.014;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx * p.depth;
        p.y += p.vy * p.depth;

        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 170 && dist > 1) {
            const force = ((170 - dist) / 170) * 0.028;
            p.x -= (dx / dist) * force * 8;
            p.y -= (dy / dist) * force * 8;
          }
        }

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const twinkle = 0.65 + 0.35 * Math.sin(time * 1.6 + p.phase);
        const alpha = p.baseAlpha * twinkle;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] w-full h-full opacity-75"
    />
  );
};

/**
 * 3. Precision Luxury Cursor
 * Dot + lagging ring + interactive label morph + click ripples.
 * Disabled on touch/coarse pointers and prefers-reduced-motion.
 */
export const CinematicCursor: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [cursorMode, setCursorMode] = useState<'default' | 'pointer' | 'view'>('default');
  const [cursorLabel, setCursorLabel] = useState<string>('');
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const dotX = useSpring(rawX, { stiffness: 900, damping: 45 });
  const dotY = useSpring(rawY, { stiffness: 900, damping: 45 });
  const ringX = useSpring(rawX, SPRING_CURSOR);
  const ringY = useSpring(rawY, SPRING_CURSOR);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const cursorEl = target.closest('[data-cursor]') as HTMLElement | null;
      const interactiveEl = target.closest('a, button, input, select, textarea, [role="button"]');

      if (cursorEl) {
        const type = cursorEl.getAttribute('data-cursor') || 'view';
        setCursorMode('view');
        setCursorLabel(type.toUpperCase());
      } else if (interactiveEl) {
        setCursorMode('pointer');
        setCursorLabel('');
      } else {
        setCursorMode('default');
        setCursorLabel('');
      }
    };

    const onDown = (e: PointerEvent) => {
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 650);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [rawX, rawY, shouldReduceMotion]);

  if (!enabled || shouldReduceMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {/* Click Ripple Waves */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ opacity: 0.55, scale: 0.2 }}
          animate={{ opacity: 0, scale: 2.8 }}
          transition={{ duration: 0.6, ease: EASE_CINEMATIC }}
          style={{ left: r.x - 20, top: r.y - 20 }}
          className="fixed w-10 h-10 rounded-full border border-white/50"
        />
      ))}

      {/* Lagging Outer Ring */}
      <motion.div
        style={{ x: ringX, y: ringY }}
        animate={{
          width: cursorMode === 'view' ? 68 : cursorMode === 'pointer' ? 44 : 30,
          height: cursorMode === 'view' ? 68 : cursorMode === 'pointer' ? 44 : 30,
          marginLeft: cursorMode === 'view' ? -34 : cursorMode === 'pointer' ? -22 : -15,
          marginTop: cursorMode === 'view' ? -34 : cursorMode === 'pointer' ? -22 : -15,
          backgroundColor:
            cursorMode === 'view' ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.03)',
          borderColor:
            cursorMode === 'pointer' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.32)',
        }}
        transition={{ duration: 0.18, ease: EASE_CINEMATIC }}
        className="fixed top-0 left-0 rounded-full border backdrop-blur-[1px] flex items-center justify-center"
      >
        {cursorMode === 'view' && cursorLabel && (
          <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-black">
            {cursorLabel}
          </span>
        )}
      </motion.div>

      {/* Precision Inner Dot */}
      <motion.div
        style={{ x: dotX, y: dotY }}
        animate={{
          scale: cursorMode === 'view' ? 0 : cursorMode === 'pointer' ? 0.5 : 1,
          opacity: cursorMode === 'view' ? 0 : 1,
        }}
        transition={{ duration: 0.14 }}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-white mix-blend-difference"
      />
    </div>
  );
};

/**
 * 4. Scroll Progress Line + Circular Back-to-Top HUD
 */
export const ScrollProgressHUD: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 28 });
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const strokeDashoffset = useTransform(smoothProgress, [0, 1], [125.6, 0]);

  return (
    <>
      {/* Top Hairline Progress Bar */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: smoothProgress, transformOrigin: '0% 50%' }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-zinc-500 via-white to-zinc-300 z-[60]"
      />

      {/* Circular Scroll Progress + Back-to-Top Button */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.22, ease: EASE_CINEMATIC }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll back to top"
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#0A0A0C]/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.8)] hover:border-white/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1.5"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="125.6"
                style={{ strokeDashoffset }}
              />
            </svg>
            <ArrowUp className="w-4 h-4 relative z-10" strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * 5. Magnetic Wrapper
 * Gently attracts element toward pointer with smooth spring release.
 */
export const MagneticWrapper: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
}> = ({ children, strength = 0.26, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING_MAGNETIC);
  const springY = useSpring(y, SPRING_MAGNETIC);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={shouldReduceMotion ? undefined : { x: springX, y: springY }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * 6. Spotlight 3D Tilt Card
 * Combines 3D perspective tilt, cursor-tracked white radial spotlight sheen,
 * and click ripple wave in pure grayscale.
 */
export const SpotlightTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  cursorTag?: string;
}> = ({ children, className = '', onClick, cursorTag }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(0, SPRING_TILT);
  const rotateY = useSpring(0, SPRING_TILT);
  const [hovered, setHovered] = useState(false);

  const spotlight = useMotionTemplate`radial-gradient(380px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.11), transparent 72%)`;

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    mouseX.set(px);
    mouseY.set(py);

    const nx = (px / rect.width - 0.5) * 2;
    const ny = (py / rect.height - 0.5) * 2;
    rotateX.set(-ny * 4.5);
    rotateY.set(nx * 4.5);
  };

  const handleLeave = () => {
    setHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      data-cursor={cursorTag}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={
        shouldReduceMotion
          ? undefined
          : {
              transformPerspective: 1000,
              rotateX,
              rotateY,
            }
      }
      className={`relative overflow-hidden ${className}`}
    >
      {/* Cursor Spotlight Layer */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            background: spotlight,
            opacity: hovered ? 1 : 0,
          }}
        />
      )}
      {children}
    </motion.div>
  );
};

/**
 * 7. Split Word / Mask Reveal Headline
 * Reveals each word upward out of a clean overflow mask with blur-to-sharp settle.
 */
export const SplitHeadlineReveal: React.FC<{
  text: string;
  className?: string;
  delayOffset?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p';
}> = ({ text, className = '', delayOffset = 0, as = 'h2' }) => {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');
  const Tag = as;

  if (shouldReduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden align-bottom mr-[0.26em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: '105%', opacity: 0, filter: 'blur(6px)' }}
            whileInView={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
            viewport={VIEWPORT_CONFIG}
            transition={{
              duration: DURATION.slow,
              delay: delayOffset + idx * 0.055,
              ease: EASE_CINEMATIC,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
};

/**
 * 8. Animated Metric Count-Up
 * Counts smoothly from 0 to target integer when entering viewport, preserving suffix (e.g. "+").
 */
export const AnimatedCounter: React.FC<{ value: string; className?: string }> = ({
  value,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';

  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(shouldReduceMotion || target === null ? value : `0${suffix}`);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion || target === null) {
      setDisplay(value);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const duration = 1100;
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(`${Math.round(eased * target)}${suffix}`);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldReduceMotion, suffix, target, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {display}
    </span>
  );
};

/**
 * 9. Section Hairline Draw Divider
 * Draws a crisp 1px monochrome rule across the viewport as the user scrolls.
 */
export const HairlineDraw: React.FC<{ className?: string }> = ({ className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={VIEWPORT_CONFIG}
      transition={{ duration: 0.9, ease: EASE_CURTAIN }}
      style={{ transformOrigin: 'left center' }}
      className={`h-px bg-gradient-to-r from-white/25 via-white/10 to-transparent ${className}`}
    />
  );
};
