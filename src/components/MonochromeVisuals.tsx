import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import type { ProjectVisualVariant } from '../types/cms';
import { EASE_CINEMATIC, EASE_CURTAIN, SPRING_TILT, VIEWPORT_CONFIG } from '../motion/motionSystem';

function createGrainCanvas(size = 160, opacity = 22): HTMLCanvasElement {
  const grain = document.createElement('canvas');
  grain.width = size;
  grain.height = size;
  const gCtx = grain.getContext('2d');
  if (!gCtx) return grain;

  const img = gCtx.createImageData(size, size);
  const data = img.data;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = opacity;
  }
  gCtx.putImageData(img, 0, 0);
  return grain;
}

/**
 * Broken Physics Image (Hero Portrait)
 * Top portion, silhouette body, reflection sweep, orbital ring, and shadow move
 * at distinct depths and delays, bending slightly like liquid space.
 */
export const HeroPortraitVisual: React.FC<{ photoUrl?: string; altName?: string }> = ({
  photoUrl,
  altName = 'ABRAR HASSAN',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const tiltX = useSpring(0, SPRING_TILT);
  const tiltY = useSpring(0, SPRING_TILT);
  const topShiftX = useSpring(0, { stiffness: 180, damping: 20 });
  const bottomShiftX = useSpring(0, { stiffness: 120, damping: 22 });
  const bgShiftX = useSpring(0, { stiffness: 90, damping: 24 });
  const bgShiftY = useSpring(0, { stiffness: 90, damping: 24 });
  const shadowX = useSpring(0, { stiffness: 320, damping: 22 });
  const shadowY = useSpring(18, { stiffness: 320, damping: 22 });
  const liquidSkew = useSpring(0, { stiffness: 200, damping: 24 });

  const { scrollY } = useScroll();
  const scrollVel = useVelocity(scrollY);
  const smoothVel = useSpring(scrollVel, { stiffness: 160, damping: 26 });
  // Circular rings subtly deform into ellipses during fast scroll
  const ringScaleX = useTransform(smoothVel, [-2400, 0, 2400], [0.92, 1, 0.92]);
  const ringScaleY = useTransform(smoothVel, [-2400, 0, 2400], [1.09, 1, 1.09]);

  const pointerRef = useRef({ x: 0.56, y: 0.36, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 680;
    const height = 760;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Pre-render the studio portrait architectural base into an offscreen buffer for 60fps compositing
    const off = document.createElement('canvas');
    off.width = width * dpr;
    off.height = height * dpr;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!photoUrl) {
      octx.fillStyle = '#060607';
      octx.fillRect(0, 0, width, height);

      const backGlow = octx.createRadialGradient(
        width * 0.56,
        height * 0.34,
        18,
        width * 0.54,
        height * 0.38,
        width * 0.62
      );
      backGlow.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      backGlow.addColorStop(0.35, 'rgba(212, 212, 216, 0.09)');
      backGlow.addColorStop(0.7, 'rgba(39, 39, 42, 0.04)');
      backGlow.addColorStop(1, 'rgba(5, 5, 5, 0)');
      octx.fillStyle = backGlow;
      octx.fillRect(0, 0, width, height);

      octx.save();
      octx.beginPath();
      octx.arc(width * 0.72, height * 0.72, 430, Math.PI * 0.96, Math.PI * 1.72);
      const arcFill = octx.createLinearGradient(width * 0.2, height * 0.2, width * 0.9, height * 0.9);
      arcFill.addColorStop(0, 'rgba(255,255,255,0.065)');
      arcFill.addColorStop(0.5, 'rgba(255,255,255,0.015)');
      arcFill.addColorStop(1, 'rgba(0,0,0,0)');
      octx.fillStyle = arcFill;
      octx.fill();

      octx.beginPath();
      octx.arc(width * 0.72, height * 0.72, 430, Math.PI * 0.95, Math.PI * 1.78);
      octx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      octx.lineWidth = 1.2;
      octx.stroke();

      octx.beginPath();
      octx.arc(width * 0.32, height * 0.85, 520, Math.PI * 1.25, Math.PI * 1.9);
      octx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      octx.lineWidth = 1;
      octx.stroke();
      octx.restore();

      octx.save();
      octx.beginPath();
      octx.moveTo(width * 0.14, height);
      octx.bezierCurveTo(
        width * 0.19,
        height * 0.67,
        width * 0.29,
        height * 0.56,
        width * 0.43,
        height * 0.52
      );
      octx.lineTo(width * 0.62, height * 0.51);
      octx.bezierCurveTo(
        width * 0.78,
        height * 0.55,
        width * 0.86,
        height * 0.71,
        width * 0.9,
        height
      );
      octx.closePath();

      const torsoGrad = octx.createLinearGradient(width * 0.2, height * 0.5, width * 0.82, height);
      torsoGrad.addColorStop(0, '#27272a');
      torsoGrad.addColorStop(0.28, '#141416');
      torsoGrad.addColorStop(0.7, '#09090b');
      torsoGrad.addColorStop(1, '#050505');
      octx.fillStyle = torsoGrad;
      octx.fill();

      octx.beginPath();
      octx.moveTo(width * 0.19, height * 0.88);
      octx.bezierCurveTo(
        width * 0.22,
        height * 0.66,
        width * 0.31,
        height * 0.56,
        width * 0.44,
        height * 0.52
      );
      octx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      octx.lineWidth = 1.6;
      octx.stroke();

      octx.beginPath();
      octx.moveTo(width * 0.45, height * 0.52);
      octx.lineTo(width * 0.51, height * 0.71);
      octx.lineTo(width * 0.58, height * 0.52);
      octx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      octx.lineWidth = 1.2;
      octx.stroke();

      octx.beginPath();
      octx.moveTo(width * 0.45, height * 0.54);
      octx.lineTo(width * 0.45, height * 0.46);
      octx.bezierCurveTo(
        width * 0.4,
        height * 0.45,
        width * 0.36,
        height * 0.41,
        width * 0.365,
        height * 0.355
      );
      octx.lineTo(width * 0.345, height * 0.33);
      octx.lineTo(width * 0.368, height * 0.295);
      octx.bezierCurveTo(
        width * 0.36,
        height * 0.21,
        width * 0.42,
        height * 0.15,
        width * 0.52,
        height * 0.155
      );
      octx.bezierCurveTo(
        width * 0.64,
        height * 0.16,
        width * 0.68,
        height * 0.27,
        width * 0.645,
        height * 0.39
      );
      octx.bezierCurveTo(
        width * 0.62,
        height * 0.45,
        width * 0.59,
        height * 0.48,
        width * 0.59,
        height * 0.53
      );
      octx.closePath();

      const headGrad = octx.createLinearGradient(width * 0.34, height * 0.18, width * 0.66, height * 0.48);
      headGrad.addColorStop(0, '#f4f4f5');
      headGrad.addColorStop(0.18, '#71717a');
      headGrad.addColorStop(0.45, '#1c1c1f');
      headGrad.addColorStop(0.85, '#09090b');
      headGrad.addColorStop(1, '#18181b');
      octx.fillStyle = headGrad;
      octx.fill();

      octx.beginPath();
      octx.moveTo(width * 0.435, height * 0.175);
      octx.bezierCurveTo(
        width * 0.375,
        height * 0.21,
        width * 0.368,
        height * 0.27,
        width * 0.368,
        height * 0.295
      );
      octx.lineTo(width * 0.345, height * 0.33);
      octx.lineTo(width * 0.365, height * 0.355);
      octx.bezierCurveTo(
        width * 0.365,
        height * 0.4,
        width * 0.39,
        height * 0.435,
        width * 0.43,
        height * 0.45
      );
      octx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
      octx.lineWidth = 1.9;
      octx.stroke();

      octx.beginPath();
      octx.moveTo(width * 0.54, height * 0.16);
      octx.bezierCurveTo(
        width * 0.64,
        height * 0.17,
        width * 0.675,
        height * 0.26,
        width * 0.65,
        height * 0.365
      );
      octx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
      octx.lineWidth = 1.3;
      octx.stroke();

      octx.beginPath();
      octx.arc(width * 0.48, height * 0.73, 24, 0, Math.PI * 2);
      octx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      octx.lineWidth = 1.1;
      octx.stroke();
      octx.beginPath();
      octx.arc(width * 0.48, height * 0.73, 18, 0, Math.PI * 2);
      octx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      octx.lineWidth = 0.8;
      octx.stroke();
      octx.restore();

      const bottomFade = octx.createLinearGradient(0, height * 0.68, 0, height);
      bottomFade.addColorStop(0, 'rgba(5, 5, 5, 0)');
      bottomFade.addColorStop(0.75, 'rgba(5, 5, 5, 0.78)');
      bottomFade.addColorStop(1, 'rgba(5, 5, 5, 1)');
      octx.fillStyle = bottomFade;
      octx.fillRect(0, height * 0.68, width, height * 0.32);

      const grain = createGrainCanvas(140, 18);
      const pattern = octx.createPattern(grain, 'repeat');
      if (pattern) {
        octx.fillStyle = pattern;
        octx.fillRect(0, 0, width, height);
      }
    }

    // Live silhouette rim & orbital aura particles rendered inside canvas
    const contourPts = Array.from({ length: 84 }, (_, i) => {
      const isHeadOrbit = i < 48;
      const angle = (i / (isHeadOrbit ? 48 : 36)) * Math.PI * 2;
      const baseRx = isHeadOrbit ? 128 + (i % 5) * 14 : 230 + (i % 4) * 18;
      const baseRy = isHeadOrbit ? 148 + (i % 4) * 14 : 265 + (i % 5) * 16;
      const cx = isHeadOrbit ? width * 0.51 : width * 0.5;
      const cy = isHeadOrbit ? height * 0.33 : height * 0.56;
      const homeX = cx + Math.cos(angle) * baseRx;
      const homeY = cy + Math.sin(angle) * baseRy;
      return {
        x: homeX,
        y: homeY,
        vx: 0,
        vy: 0,
        cx,
        cy,
        rx: baseRx,
        ry: baseRy,
        angle,
        speed: (isHeadOrbit ? 0.22 : -0.14) * (0.75 + (i % 3) * 0.2),
        size: 0.9 + (i % 4) * 0.42,
        alpha: 0.25 + (i % 5) * 0.12,
        phase: i * 0.73,
      };
    });

    if (shouldReduceMotion) {
      ctx.clearRect(0, 0, width, height);
      if (!photoUrl) ctx.drawImage(off, 0, 0, width, height);
      return;
    }

    let rafId = 0;
    let time = 0;
    let smoothPx = width * 0.56;
    let smoothPy = height * 0.36;

    const renderLoop = () => {
      rafId = requestAnimationFrame(renderLoop);
      if (document.hidden) return;
      time += 0.016;

      ctx.clearRect(0, 0, width, height);
      if (!photoUrl) {
        ctx.drawImage(off, 0, 0, width, height);
      }

      const targetX = (pointerRef.current.active ? pointerRef.current.x : 0.56) * width;
      const targetY = (pointerRef.current.active ? pointerRef.current.y : 0.36) * height;
      smoothPx += (targetX - smoothPx) * 0.09;
      smoothPy += (targetY - smoothPy) * 0.09;

      // Cursor-reactive volumetric rim spotlight inside the portrait canvas
      const dynGlow = ctx.createRadialGradient(smoothPx, smoothPy, 8, smoothPx, smoothPy, 260);
      dynGlow.addColorStop(
        0,
        pointerRef.current.active ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.09)'
      );
      dynGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
      dynGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = dynGlow;
      ctx.fillRect(0, 0, width, height);

      // Subtle animated volumetric light sweep across contour
      const sweepPos = ((time * 0.18) % 1.8) - 0.4;
      const sx = width * sweepPos;
      const sweepGrad = ctx.createLinearGradient(sx - 90, 0, sx + 90, height * 0.4);
      sweepGrad.addColorStop(0, 'rgba(255,255,255,0)');
      sweepGrad.addColorStop(0.5, 'rgba(255,255,255,0.065)');
      sweepGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, 0, width, height);

      // Animated orbital wireframe halo inside canvas
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.ellipse(
        width * 0.51,
        height * 0.34,
        155 + Math.sin(time * 0.8) * 6,
        178 + Math.cos(time * 0.8) * 6,
        time * 0.12,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();

      // Animate & connect contour particles
      for (let i = 0; i < contourPts.length; i++) {
        const pt = contourPts[i];
        const a = pt.angle + time * pt.speed;
        const gx = pt.cx + Math.cos(a) * pt.rx;
        const gy = pt.cy + Math.sin(a) * pt.ry;

        pt.vx += (gx - pt.x) * 0.055;
        pt.vy += (gy - pt.y) * 0.055;

        if (pointerRef.current.active) {
          const dx = pt.x - smoothPx;
          const dy = pt.y - smoothPy;
          const dist = Math.hypot(dx, dy);
          if (dist < 130 && dist > 2) {
            const push = (1 - dist / 130) * 1.9;
            pt.vx += (dx / dist) * push + (-dy / dist) * 0.45;
            pt.vy += (dy / dist) * push + (dx / dist) * 0.45;
          }
        }

        pt.vx *= 0.82;
        pt.vy *= 0.82;
        pt.x += pt.vx;
        pt.y += pt.vy;

        const twinkle = 0.55 + 0.45 * Math.sin(time * 2.1 + pt.phase);
        const alpha = pt.alpha * twinkle * (pointerRef.current.active ? 1.25 : 1);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.95, alpha).toFixed(3)})`;
        ctx.fill();

        if (i < contourPts.length - 1) {
          const next = contourPts[i + 1];
          const d = Math.hypot(pt.x - next.x, pt.y - next.y);
          if (d < 56) {
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - d / 56) * 0.16).toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [photoUrl, shouldReduceMotion]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / Math.max(rect.width, 1);
    const ry = (e.clientY - rect.top) / Math.max(rect.height, 1);
    pointerRef.current = { x: rx, y: ry, active: true };

    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const nx = rx - 0.5;
    const ny = ry - 0.5;

    tiltX.set(-ny * 6);
    tiltY.set(nx * 6);
    // Top & bottom portions react in opposing liquid directions
    topShiftX.set(nx * 14);
    bottomShiftX.set(-nx * 12);
    bgShiftX.set(nx * 24);
    bgShiftY.set(ny * 18);
    // Shadow moves opposite to virtual light source
    shadowX.set(-nx * 28);
    shadowY.set(18 - ny * 22);
    liquidSkew.set(nx * 2.2);
  };

  const handlePointerLeave = () => {
    pointerRef.current.active = false;
    tiltX.set(0);
    tiltY.set(0);
    topShiftX.set(0);
    bottomShiftX.set(0);
    bgShiftX.set(0);
    bgShiftY.set(0);
    shadowX.set(0);
    shadowY.set(18);
    liquidSkew.set(0);
  };

  return (
    <div className="relative w-full h-full">
      {/* Independent Living Shadow */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          style={{ x: shadowX, y: shadowY }}
          className="pointer-events-none absolute inset-4 rounded-3xl bg-white/[0.08] blur-3xl opacity-60"
        />
      )}

      <motion.div
        data-gravity="gather"
        data-cursor="portal"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        initial={shouldReduceMotion ? undefined : { clipPath: 'inset(12% 0% 12% 0% round 24px)', opacity: 0 }}
        animate={{ clipPath: 'inset(0% 0% 0% 0% round 24px)', opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE_CURTAIN }}
        style={
          shouldReduceMotion
            ? undefined
            : {
                transformPerspective: 1100,
                rotateX: tiltX,
                rotateY: tiltY,
                skewX: liquidSkew,
              }
        }
        className="group relative w-full h-full min-h-[420px] lg:min-h-[560px] rounded-3xl overflow-hidden border border-white/[0.12] hover:border-white/[0.28] bg-[#070708] transition-colors duration-300"
      >
        {/* Background Volumetric Studio Light */}
        <motion.div
          aria-hidden="true"
          style={shouldReduceMotion ? undefined : { x: bgShiftX, y: bgShiftY }}
          animate={shouldReduceMotion ? undefined : { opacity: [0.45, 0.74, 0.45], scale: [1, 1.05, 1] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -inset-12"
        >
          <div
            className="w-full h-full"
            style={{
              background:
                'radial-gradient(circle at 60% 34%, rgba(255,255,255,0.18), rgba(255,255,255,0.03) 42%, transparent 72%)',
            }}
          />
        </motion.div>

        {/* Broken-Physics Split Layering of Portrait Photo + Live Particle Aura Canvas */}
        <motion.div
          style={shouldReduceMotion ? undefined : { x: topShiftX }}
          className="relative w-full h-full"
        >
          {photoUrl && (
            <>
              <img
                src={photoUrl}
                alt={`${altName} portrait`}
                className="w-full h-full object-cover object-center grayscale contrast-115 brightness-95 scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 44%, transparent 38%, rgba(5,5,5,0.58) 78%, rgba(5,5,5,0.94) 100%)',
                }}
              />
            </>
          )}
          <canvas
            ref={canvasRef}
            aria-label="Monochrome studio portrait study with interactive particle aura and cursor lighting"
            role="img"
            className={`w-full h-full object-cover scale-[1.04] ${
              photoUrl ? 'pointer-events-none absolute inset-0 z-10' : 'relative'
            }`}
          />
        </motion.div>

        {/* Orbital Rotating Rings that Deform Elliptically on Scroll */}
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            style={{ scaleX: ringScaleX, scaleY: ringScaleY, x: bottomShiftX }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
              className="w-[78%] aspect-square rounded-full border border-white/[0.08]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 52, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[92%] aspect-square rounded-full border border-dashed border-white/[0.06]"
            />
          </motion.div>
        )}

        {/* Sweeping Delayed Reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent rotate-12 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000 delay-75 ease-out"
        />

        {/* Curved Highlight Arc */}
        <svg
          viewBox="0 0 680 760"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          <circle cx="520" cy="520" r="380" stroke="url(#heroArcGrad)" strokeWidth="1" strokeOpacity="0.52" />
          <defs>
            <linearGradient id="heroArcGrad" x1="140" y1="180" x2="640" y2="700" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" stopOpacity="0.65" />
              <stop offset="0.55" stopColor="#A1A1AA" stopOpacity="0.2" />
              <stop offset="1" stopColor="#09090B" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30"
        />
      </motion.div>
    </div>
  );
};

/**
 * Infinite Mirror Architectural Study (About Section)
 * Concentric nested recursive frames create an infinite monochrome mirror tunnel
 * that expands on hover and slowly collapses on mouse leave.
 */
export const AboutArchitectureVisual: React.FC<{ photoUrl?: string }> = ({ photoUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [dissolved, setDissolved] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');
  const dissolvedRef = useRef(false);

  useEffect(() => {
    dissolvedRef.current = dissolved;
  }, [dissolved]);

  const tiltX = useSpring(0, SPRING_TILT);
  const tiltY = useSpring(0, SPRING_TILT);
  const mirrorShiftX = useSpring(0, { stiffness: 130, damping: 22 });
  const mirrorShiftY = useSpring(0, { stiffness: 130, damping: 22 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 720;
    const height = 560;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const sky = ctx.createLinearGradient(0, 0, width, height * 0.65);
    sky.addColorStop(0, '#18181b');
    sky.addColorStop(0.45, '#3f3f46');
    sky.addColorStop(1, '#09090b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 6; i++) {
      const cx = 120 + i * 115;
      const cy = 95 + (i % 2) * 45;
      const cloud = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180);
      cloud.addColorStop(0, 'rgba(244, 244, 245, 0.24)');
      cloud.addColorStop(0.5, 'rgba(161, 161, 170, 0.08)');
      cloud.addColorStop(1, 'rgba(24, 24, 27, 0)');
      ctx.fillStyle = cloud;
      ctx.fillRect(0, 0, width, height * 0.7);
    }

    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.42);
    ctx.lineTo(width * 0.44, height * 0.14);
    ctx.lineTo(width * 0.44, height);
    ctx.closePath();
    const concreteLit = ctx.createLinearGradient(0, height * 0.15, width * 0.44, height);
    concreteLit.addColorStop(0, '#e4e4e7');
    concreteLit.addColorStop(0.4, '#71717a');
    concreteLit.addColorStop(1, '#18181b');
    ctx.fillStyle = concreteLit;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width * 0.44, height * 0.14);
    ctx.lineTo(width * 0.76, height * 0.34);
    ctx.lineTo(width * 0.76, height);
    ctx.lineTo(width * 0.44, height);
    ctx.closePath();
    const concreteDark = ctx.createLinearGradient(width * 0.44, height * 0.14, width * 0.76, height);
    concreteDark.addColorStop(0, '#27272a');
    concreteDark.addColorStop(0.6, '#121214');
    concreteDark.addColorStop(1, '#070708');
    ctx.fillStyle = concreteDark;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width * 0.3, height * 0.56);
    ctx.lineTo(width, height * 0.22);
    ctx.lineTo(width, height);
    ctx.lineTo(width * 0.3, height);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(width * 0.3, height * 0.25, width, height);
    wingGrad.addColorStop(0, '#52525b');
    wingGrad.addColorStop(0.18, '#1f1f23');
    wingGrad.addColorStop(1, '#050505');
    ctx.fillStyle = wingGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.44, height * 0.14);
    ctx.lineTo(width * 0.44, height);
    ctx.moveTo(width * 0.3, height * 0.56);
    ctx.lineTo(width, height * 0.22);
    ctx.stroke();

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = width * 0.52 + col * 118;
        const wy = height * 0.54 + row * 68 - col * 36;
        if (wy > height * 0.42 && wx < width - 48) {
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.fillRect(wx, wy, 72, 42);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.strokeRect(wx, wy, 72, 42);
        }
      }
    }

    const vignette = ctx.createRadialGradient(
      width * 0.45,
      height * 0.42,
      width * 0.2,
      width * 0.5,
      height * 0.5,
      width * 0.72
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(5,5,5,0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    const grain = createGrainCanvas(140, 20);
    const pattern = ctx.createPattern(grain, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }

    try {
      setDataUrl(canvas.toDataURL('image/png'));
    } catch {
      // Fallback ignored
    }

    // Build particle breakup field from sampled grayscale luminance of the architectural study
    if (shouldReduceMotion) return;
    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;

    pCanvas.width = width;
    pCanvas.height = height;

    const sampleImg = ctx.getImageData(0, 0, width * dpr, height * dpr).data;
    const step = 12 * dpr;
    interface StudyParticle {
      hx: number;
      hy: number;
      dx: number;
      dy: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      lum: number;
      phase: number;
    }
    const pts: StudyParticle[] = [];

    for (let y = 0; y < height * dpr; y += step) {
      for (let x = 0; x < width * dpr; x += step) {
        const idx = (y * width * dpr + x) * 4;
        const lum = sampleImg[idx];
        if (lum > 38) {
          const hx = x / dpr;
          const hy = y / dpr;
          const angle = Math.atan2(hy - height * 0.5, hx - width * 0.5) + (Math.random() - 0.5) * 1.4;
          const dist = 48 + Math.random() * 145;
          pts.push({
            hx,
            hy,
            dx: hx + Math.cos(angle) * dist,
            dy: hy + Math.sin(angle) * dist,
            x: hx,
            y: hy,
            vx: 0,
            vy: 0,
            lum: Math.min(255, lum + 55),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    const pointer = { x: -999, y: -999, active: false };
    const wrap = wrapperRef.current;
    const onMove = (e: PointerEvent) => {
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / Math.max(r.width, 1)) * width;
      pointer.y = ((e.clientY - r.top) / Math.max(r.height, 1)) * height;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    wrap?.addEventListener('pointermove', onMove, { passive: true });
    wrap?.addEventListener('pointerleave', onLeave, { passive: true });

    let rafId = 0;
    let time = 0;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (document.hidden) return;
      time += 0.025;
      pCtx.clearRect(0, 0, width, height);

      const isDissolved = dissolvedRef.current;
      for (const p of pts) {
        const targetX = isDissolved ? p.dx + Math.cos(time + p.phase) * 16 : p.hx;
        const targetY = isDissolved ? p.dy + Math.sin(time + p.phase) * 16 : p.hy;
        const stiffness = isDissolved ? 0.035 : 0.085;

        p.vx += (targetX - p.x) * stiffness;
        p.vy += (targetY - p.y) * stiffness;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 88 && d > 1) {
            const f = (1 - d / 88) * (isDissolved ? 2.4 : 1.3);
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }

        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        const alpha = isDissolved ? 0.85 : pointer.active ? 0.36 : 0.14;
        pCtx.fillStyle = `rgba(${p.lum}, ${p.lum}, ${p.lum}, ${alpha})`;
        pCtx.fillRect(p.x, p.y, isDissolved ? 2.1 : 1.4, isDissolved ? 2.1 : 1.4);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      wrap?.removeEventListener('pointermove', onMove);
      wrap?.removeEventListener('pointerleave', onLeave);
    };
  }, [shouldReduceMotion]);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(-ny * 4.5);
    tiltY.set(nx * 4.5);
    mirrorShiftX.set(nx * 14);
    mirrorShiftY.set(ny * 14);
  };

  return (
    <motion.div
      ref={wrapperRef}
      data-gravity="gather"
      data-cursor="mirror"
      onPointerEnter={() => setHovered(true)}
      onPointerMove={handleMove}
      onPointerLeave={() => {
        setHovered(false);
        tiltX.set(0);
        tiltY.set(0);
        mirrorShiftX.set(0);
        mirrorShiftY.set(0);
      }}
      initial={shouldReduceMotion ? undefined : { clipPath: 'inset(100% 0% 0% 0% round 16px)', opacity: 0.4 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 16px)', opacity: 1 }}
      viewport={VIEWPORT_CONFIG}
      transition={{ duration: 0.85, ease: EASE_CURTAIN }}
      style={
        shouldReduceMotion
          ? undefined
          : {
              transformPerspective: 1000,
              rotateX: tiltX,
              rotateY: tiltY,
            }
      }
      className="group relative w-full h-full min-h-[340px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-white/[0.1] hover:border-white/[0.28] bg-[#0A0A0B] transition-colors duration-300"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Studio architecture & portrait study"
          className={`w-full h-full object-cover grayscale contrast-125 transition-all duration-700 ease-out group-hover:scale-[1.04] ${
            dissolved ? 'opacity-15 blur-[2px] scale-105' : 'opacity-100'
          }`}
        />
      ) : (
        <canvas
          ref={canvasRef}
          aria-label="Monochrome brutalist architecture photography study with infinite mirror tunnel"
          role="img"
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04] ${
            dissolved ? 'opacity-15 blur-[2px] scale-105' : 'opacity-100'
          }`}
        />
      )}

      {/* Interactive Particle Breakup & Reconstruction Layer */}
      {!shouldReduceMotion && (
        <canvas
          ref={particleCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full object-cover z-10"
        />
      )}

      {/* Infinite Mirror Recursive Nested Frames */}
      {dataUrl && !shouldReduceMotion && !dissolved && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {[0.62, 0.42, 0.26, 0.14].map((baseScale, depthIdx) => (
            <motion.div
              key={baseScale}
              style={{ x: mirrorShiftX, y: mirrorShiftY }}
              animate={{
                scale: hovered ? baseScale * 1.18 : baseScale * 0.94,
                opacity: hovered ? 0.82 - depthIdx * 0.14 : 0.42 - depthIdx * 0.08,
                rotate: hovered ? (depthIdx % 2 === 0 ? 1.5 : -1.5) : 0,
              }}
              transition={{
                duration: 0.65,
                delay: depthIdx * 0.045,
                ease: EASE_CINEMATIC,
              }}
              className="absolute w-full h-full rounded-xl overflow-hidden border border-white/25 shadow-[0_0_40px_rgba(0,0,0,0.9)]"
            >
              <img
                src={dataUrl}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover opacity-90"
              />
            </motion.div>
          ))}
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent rotate-12 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000 ease-out"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/15 z-10"
      />
      <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="pointer-events-none flex items-center gap-3">
          <span>Infinite Mirror Study</span>
          <span className="font-mono tabular-nums text-zinc-500">35mm · f/2.8</span>
        </div>
        {!shouldReduceMotion && (
          <button
            type="button"
            onClick={() => setDissolved((d) => !d)}
            className="px-3 py-1.5 rounded-full border border-white/20 bg-black/70 text-[11px] font-mono text-zinc-200 hover:bg-white hover:text-black transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {dissolved ? 'Reconstruct' : 'Dissolve Form'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const ProjectArtwork: React.FC<{
  variant: ProjectVisualVariant;
  title: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}> = ({ variant, title, thumbnailUrl, videoUrl }) => {
  const shouldReduceMotion = useReducedMotion();

  if (videoUrl) {
    return (
      <div className="relative w-full h-full bg-[#070709] overflow-hidden">
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-105 transition-transform duration-700"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent rotate-12 translate-x-[-130%] group-hover:translate-x-[130%] transition-transform duration-1000 ease-out"
        />
      </div>
    );
  }

  if (thumbnailUrl) {
    return (
      <div className="relative w-full h-full bg-[#070709] overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={`${title} preview`}
          className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-105 transition-transform duration-700"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent rotate-12 translate-x-[-130%] group-hover:translate-x-[130%] transition-transform duration-1000 ease-out"
        />
      </div>
    );
  }

  const lightSweep = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent rotate-12 translate-x-[-130%] group-hover:translate-x-[130%] transition-transform duration-1000 ease-out"
    />
  );

  switch (variant) {
    case 'monolith':
      return (
        <div
          aria-label={`${title} architectural interface preview`}
          className="relative w-full h-full bg-[#09090B] overflow-hidden flex items-center justify-center"
        >
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(circle at 72% 28%, rgba(255,255,255,0.16), transparent 56%)',
            }}
          />
          <svg viewBox="0 0 640 380" className="w-full h-full" aria-hidden="true">
            <defs>
              <linearGradient id="monoSlab" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E4E4E7" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#18181B" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
              <line x1="80" y1="0" x2="80" y2="380" />
              <line x1="220" y1="0" x2="220" y2="380" />
              <line x1="420" y1="0" x2="420" y2="380" />
              <line x1="560" y1="0" x2="560" y2="380" />
              <line x1="0" y1="95" x2="640" y2="95" />
              <line x1="0" y1="285" x2="640" y2="285" />
            </g>
            <polygon points="150,340 150,115 310,60 310,340" fill="url(#monoSlab)" stroke="rgba(255,255,255,0.22)" />
            <polygon points="310,60 470,130 470,340 310,340" fill="#0F0F12" stroke="rgba(255,255,255,0.14)" />
            <rect x="342" y="155" width="96" height="44" fill="#050505" stroke="rgba(255,255,255,0.18)" />
            <rect x="342" y="218" width="96" height="44" fill="#050505" stroke="rgba(255,255,255,0.12)" />
            <circle cx="485" cy="84" r="46" fill="none" stroke="rgba(255,255,255,0.2)" />
          </svg>
          {lightSweep}
        </div>
      );

    case 'vespera':
      return (
        <div
          aria-label={`${title} typography specimen preview`}
          className="relative w-full h-full bg-[#0A0A0C] overflow-hidden flex flex-col justify-between p-6"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>VARIABLE SPECIMEN</span>
            <span>WGHT 300 — 800</span>
          </div>
          <div className="my-auto py-4 border-y border-white/[0.08]">
            <div className="font-serif italic text-5xl sm:text-6xl tracking-tight text-zinc-100 leading-none group-hover:tracking-normal transition-all duration-500">
              Aa Bb Gg
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span>Optical Size 72pt</span>
              <span className="font-mono text-zinc-500">Tracking -0.03em</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
            <span className="h-1 flex-1 bg-white/15 rounded-full overflow-hidden">
              <span className="block h-full w-2/3 bg-white/75 group-hover:w-5/6 transition-all duration-500" />
            </span>
            <span>600 SEMIBOLD</span>
          </div>
          {lightSweep}
        </div>
      );

    case 'kinetix':
      return (
        <div
          aria-label={`${title} motion timeline preview`}
          className="relative w-full h-full bg-[#08080A] overflow-hidden flex flex-col justify-between p-6"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.12), transparent 60%)',
            }}
          />
          <div className="relative flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>REEL_2026.MOV</span>
            <span className="tabular-nums">00:01:24:18</span>
          </div>
          <div className="relative my-auto flex items-center justify-center gap-1.5 h-24">
            {[28, 54, 82, 46, 94, 68, 36, 76, 88, 50, 62, 34, 70, 44].map((bar, i) => (
              <motion.div
                key={i}
                animate={shouldReduceMotion ? undefined : { scaleY: [0.85, 1.15, 0.85] }}
                transition={{
                  duration: 2.2 + (i % 4) * 0.35,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.08,
                }}
                className="w-1.5 rounded-full bg-gradient-to-t from-zinc-700 via-zinc-300 to-white origin-center"
                style={{ height: `${bar}%`, opacity: 0.4 + (i % 3) * 0.22 }}
              />
            ))}
          </div>
          <div className="relative border-t border-white/[0.08] pt-3 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>24 FPS · ANAMORPHIC</span>
            <span>CUBIC-BEZIER(0.16, 1, 0.3, 1)</span>
          </div>
          {lightSweep}
        </div>
      );

    case 'aether':
      return (
        <div
          aria-label={`${title} neural workflow preview`}
          className="relative w-full h-full bg-[#08080A] overflow-hidden flex items-center justify-center"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 32% 40%, rgba(255,255,255,0.14), transparent 58%)',
            }}
          />
          <svg viewBox="0 0 640 380" className="w-full h-full" aria-hidden="true">
            <g stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" fill="none">
              <path d="M120 190 C 210 190, 210 110, 310 110" />
              <path d="M120 190 C 210 190, 210 270, 310 270" />
              <path d="M310 110 C 410 110, 420 190, 520 190" />
              <path d="M310 270 C 410 270, 420 190, 520 190" />
              <circle cx="310" cy="190" r="115" strokeDasharray="4 6" strokeOpacity="0.28" />
            </g>
            {[
              { x: 120, y: 190, r: 22, label: 'IN' },
              { x: 310, y: 110, r: 18, label: 'LLM' },
              { x: 310, y: 270, r: 18, label: 'VIS' },
              { x: 520, y: 190, r: 24, label: 'OUT' },
            ].map((node, idx) => (
              <g key={idx}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill="#111113"
                  stroke="rgba(255,255,255,0.48)"
                  strokeWidth="1.2"
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#E4E4E7"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
          {lightSweep}
        </div>
      );

    case 'nocturne':
      return (
        <div
          aria-label={`${title} acoustic harmonics preview`}
          className="relative w-full h-full bg-[#09090B] overflow-hidden flex items-center justify-center p-6"
        >
          <svg viewBox="0 0 420 240" className="w-full h-full" aria-hidden="true">
            <circle cx="210" cy="120" r="88" fill="none" stroke="rgba(255,255,255,0.12)" />
            <circle cx="210" cy="120" r="62" fill="none" stroke="rgba(255,255,255,0.22)" />
            <circle cx="210" cy="120" r="34" fill="none" stroke="rgba(255,255,255,0.45)" />
            <path
              d="M20 120 Q 75 55, 130 120 T 240 120 T 350 120 T 400 120"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.5"
            />
            <path
              d="M20 120 Q 75 165, 130 120 T 240 120 T 350 120 T 400 120"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />
          </svg>
          {lightSweep}
        </div>
      );

    case 'forma':
      return (
        <div
          aria-label={`${title} design token grid preview`}
          className="relative w-full h-full bg-[#09090B] overflow-hidden p-6 flex flex-col justify-between"
        >
          <div className="grid grid-cols-3 gap-2.5">
            {['#050505', '#141416', '#27272A', '#52525B', '#A1A1AA', '#F4F4F5'].map((hex) => (
              <div
                key={hex}
                className="h-14 rounded-lg border border-white/[0.1] flex items-end p-2 transition-transform duration-300 group-hover:scale-[1.03]"
                style={{ backgroundColor: hex }}
              >
                <span
                  className={`text-[10px] font-mono ${
                    hex === '#F4F4F5' || hex === '#A1A1AA' ? 'text-black' : 'text-zinc-400'
                  }`}
                >
                  {hex}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>48 TOKENS</span>
            <span>WCAG AA VERIFIED</span>
          </div>
          {lightSweep}
        </div>
      );
  }
};
