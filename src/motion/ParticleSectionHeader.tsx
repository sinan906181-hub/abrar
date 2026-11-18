import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useIsBookSnapshot } from './BookSnapshotContext';

export type ParticleTextSize =
  | 'hero'
  | 'roles'
  | 'section'
  | 'subheading'
  | 'subheadingLg'
  | 'project'
  | 'service';

export interface ParticleTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  size?: ParticleTextSize;
  align?: 'left' | 'center';
  revealed?: boolean;
  glow?: 'subtle' | 'none';
  className?: string;
  canvasClassName?: string;
}

interface PresetMetrics {
  fontWeight: number;
  fontFamily: string;
  minFont: number;
  maxFont: number;
  ratio: number;
  lineHeightMul: number;
  padX: number;
  padY: number;
  dotBase: number;
  dotVariance: number;
  stepDesktop: number;
  maxPtsDesktop: number;
  maxPtsTablet: number;
  maxPtsMobile: number;
  scatterRadius: number;
  repulsionRadius: number;
  fallbackClass: string;
}

const PRESETS: Record<ParticleTextSize, PresetMetrics> = {
  hero: {
    fontWeight: 800,
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    minFont: 40,
    maxFont: 80,
    ratio: 0.132,
    lineHeightMul: 1.08,
    padX: 6,
    padY: 14,
    dotBase: 1.35,
    dotVariance: 0.65,
    stepDesktop: 2,
    maxPtsDesktop: 2600,
    maxPtsTablet: 1450,
    maxPtsMobile: 780,
    scatterRadius: 190,
    repulsionRadius: 84,
    fallbackClass:
      'font-display text-[clamp(2.85rem,5.5vw,5rem)] font-bold tracking-[-0.03em] leading-[1.06] text-white',
  },
  roles: {
    fontWeight: 500,
    fontFamily: '"Outfit", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    minFont: 16,
    maxFont: 23,
    ratio: 0.042,
    lineHeightMul: 1.25,
    padX: 4,
    padY: 10,
    dotBase: 1.0,
    dotVariance: 0.42,
    stepDesktop: 1,
    maxPtsDesktop: 1200,
    maxPtsTablet: 750,
    maxPtsMobile: 420,
    scatterRadius: 110,
    repulsionRadius: 56,
    fallbackClass: 'text-lg sm:text-xl md:text-2xl font-normal text-zinc-200 tracking-wide',
  },
  section: {
    fontWeight: 800,
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    minFont: 38,
    maxFont: 66,
    ratio: 0.11,
    lineHeightMul: 1.12,
    padX: 4,
    padY: 12,
    dotBase: 1.35,
    dotVariance: 0.58,
    stepDesktop: 2,
    maxPtsDesktop: 1700,
    maxPtsTablet: 950,
    maxPtsMobile: 520,
    scatterRadius: 175,
    repulsionRadius: 72,
    fallbackClass: 'font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white',
  },
  subheading: {
    fontWeight: 600,
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    minFont: 22,
    maxFont: 31,
    ratio: 0.052,
    lineHeightMul: 1.22,
    padX: 4,
    padY: 10,
    dotBase: 1.08,
    dotVariance: 0.46,
    stepDesktop: 1,
    maxPtsDesktop: 1250,
    maxPtsTablet: 760,
    maxPtsMobile: 440,
    scatterRadius: 120,
    repulsionRadius: 58,
    fallbackClass: 'font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight',
  },
  subheadingLg: {
    fontWeight: 700,
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    minFont: 27,
    maxFont: 44,
    ratio: 0.088,
    lineHeightMul: 1.14,
    padX: 4,
    padY: 12,
    dotBase: 1.18,
    dotVariance: 0.52,
    stepDesktop: 2,
    maxPtsDesktop: 1550,
    maxPtsTablet: 900,
    maxPtsMobile: 520,
    scatterRadius: 145,
    repulsionRadius: 68,
    fallbackClass:
      'font-display text-3xl sm:text-4xl md:text-[46px] font-bold tracking-tight leading-[1.08] text-white',
  },
  project: {
    fontWeight: 700,
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    minFont: 26,
    maxFont: 48,
    ratio: 0.075,
    lineHeightMul: 1.12,
    padX: 4,
    padY: 12,
    dotBase: 1.22,
    dotVariance: 0.55,
    stepDesktop: 2,
    maxPtsDesktop: 1550,
    maxPtsTablet: 880,
    maxPtsMobile: 500,
    scatterRadius: 150,
    repulsionRadius: 68,
    fallbackClass:
      'font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.06]',
  },
  service: {
    fontWeight: 600,
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    minFont: 21,
    maxFont: 30,
    ratio: 0.056,
    lineHeightMul: 1.2,
    padX: 4,
    padY: 10,
    dotBase: 1.06,
    dotVariance: 0.44,
    stepDesktop: 1,
    maxPtsDesktop: 1150,
    maxPtsTablet: 700,
    maxPtsMobile: 400,
    scatterRadius: 105,
    repulsionRadius: 56,
    fallbackClass: 'font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight',
  },
};

interface TextParticle {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  phase: number;
  driftAmp: number;
  driftSpeed: number;
  springRate: number;
  wanderBias: number;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function buildGlyphPoints(
  text: string,
  width: number,
  align: 'left' | 'center',
  preset: PresetMetrics,
  isMobile: boolean,
  isTablet: boolean
): { targets: { x: number; y: number }[]; height: number } {
  const safeW = Math.max(200, Math.round(width));
  const off = document.createElement('canvas');
  const oCtx = off.getContext('2d');
  if (!oCtx) {
    return { targets: [], height: preset.minFont + preset.padY * 2 };
  }

  let fontSize = Math.round(
    Math.max(preset.minFont, Math.min(preset.maxFont, safeW * preset.ratio))
  );
  const availW = Math.max(120, safeW - preset.padX * 2);

  oCtx.font = `${preset.fontWeight} ${fontSize}px ${preset.fontFamily}`;

  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  let longestW = 0;
  for (const w of rawWords) {
    longestW = Math.max(longestW, oCtx.measureText(w).width);
  }
  if (longestW > availW && longestW > 0) {
    fontSize = Math.max(14, Math.floor(fontSize * (availW / longestW) * 0.96));
    oCtx.font = `${preset.fontWeight} ${fontSize}px ${preset.fontFamily}`;
  }

  const lines = wrapLines(oCtx, text, availW);
  const lineHeight = Math.round(fontSize * preset.lineHeightMul);
  const height = Math.max(
    lineHeight + preset.padY * 2,
    lines.length * lineHeight + preset.padY * 2
  );

  off.width = safeW;
  off.height = height;

  // Render crisp alpha mask on offscreen canvas
  oCtx.clearRect(0, 0, safeW, height);
  oCtx.font = `${preset.fontWeight} ${fontSize}px ${preset.fontFamily}`;
  oCtx.fillStyle = '#FFFFFF';
  oCtx.textAlign = align === 'center' ? 'center' : 'left';
  oCtx.textBaseline = 'middle';

  const blockHeight = lines.length * lineHeight;
  const startY = (height - blockHeight) / 2 + lineHeight / 2;
  const drawX = align === 'center' ? safeW / 2 : preset.padX;

  for (let i = 0; i < lines.length; i++) {
    oCtx.fillText(lines[i], drawX, startY + i * lineHeight);
  }

  const img = oCtx.getImageData(0, 0, safeW, height).data;
  const step = isMobile
    ? Math.max(2, preset.stepDesktop + 1)
    : isTablet
      ? Math.max(2, preset.stepDesktop)
      : fontSize < 34
        ? 1
        : preset.stepDesktop;

  const rawPts: { x: number; y: number }[] = [];
  const alphaThresh = fontSize < 34 ? 105 : 128;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < safeW; x += step) {
      if (img[(y * safeW + x) * 4 + 3] > alphaThresh) {
        rawPts.push({ x, y });
      }
    }
  }

  const maxPts = isMobile
    ? preset.maxPtsMobile
    : isTablet
      ? preset.maxPtsTablet
      : preset.maxPtsDesktop;

  if (rawPts.length <= maxPts) {
    return { targets: rawPts, height };
  }

  // Deterministic uniform subsample so glyph strokes remain evenly populated
  const stride = rawPts.length / maxPts;
  const sampled: { x: number; y: number }[] = [];
  for (let i = 0; i < maxPts; i++) {
    sampled.push(rawPts[Math.min(rawPts.length - 1, Math.floor(i * stride))]);
  }
  return { targets: sampled, height };
}

export const ParticleText: React.FC<ParticleTextProps> = ({
  text,
  as = 'h2',
  size = 'subheading',
  align = 'left',
  revealed = true,
  glow = 'subtle',
  className = '',
  canvasClassName = '',
}) => {
  const Tag = as;
  const preset = PRESETS[size];
  const shouldReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const { cms } = useSiteConfig();

  const textParticlesEnabled =
    !isBookSnapshot && !shouldReduceMotion && cms.animations.masterEnabled && cms.animations.textAnimations;

  const hostRef = useRef<HTMLSpanElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [boxHeight, setBoxHeight] = useState<number>(
    Math.round(preset.maxFont * preset.lineHeightMul + preset.padY * 2)
  );

  // Live mutable refs so props / visibility / resize can morph seamlessly without tearing down particles
  const particlesRef = useRef<TextParticle[]>([]);
  const revealedRef = useRef(revealed);
  const visibleRef = useRef(false);
  const leftAtRef = useRef(0);
  const dimsRef = useRef({ width: 520, height: boxHeight, dpr: 1 });
  const textRef = useRef(text);
  const sizeRef = useRef(size);
  const alignRef = useRef(align);
  const glowRef = useRef(glow);
  const speedScaleRef = useRef(cms.animations.animationSpeed || 1);
  const startLoopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    speedScaleRef.current = Math.max(0.5, Math.min(2, cms.animations.animationSpeed || 1));
  }, [cms.animations.animationSpeed]);

  useEffect(() => {
    revealedRef.current = revealed;
    if (revealed && visibleRef.current) {
      startLoopRef.current?.();
    }
  }, [revealed]);

  useEffect(() => {
    if (!textParticlesEnabled) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    let rafId = 0;
    let isRunning = false;
    let time = Math.random() * 10;

    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = window.innerWidth < 768 || cores <= 2;
    const isTablet = !isMobile && window.innerWidth < 1024;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.85);

    const createParticleForTarget = (
      tx: number,
      ty: number,
      width: number,
      height: number,
      activePreset: PresetMetrics,
      index: number
    ): TextParticle => {
      const ang = Math.random() * Math.PI * 2;
      const dist = activePreset.scatterRadius * (0.45 + Math.random() * 0.85);
      const sx = Math.max(-80, Math.min(width + 80, tx + Math.cos(ang) * dist));
      const sy = Math.max(-70, Math.min(height + 70, ty + Math.sin(ang) * dist));
      return {
        tx,
        ty,
        sx,
        sy,
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: activePreset.dotBase + Math.random() * activePreset.dotVariance,
        baseAlpha: 0.78 + Math.random() * 0.22,
        alpha: 0.02,
        phase: index * 0.6180339 + Math.random() * 1.4,
        driftAmp: isMobile ? 0.28 : 0.34 + Math.random() * 0.42,
        driftSpeed: 0.85 + Math.random() * 1.05,
        springRate: 0.068 + (index % 7) * 0.0085,
        wanderBias: Math.random(),
      };
    };

    const syncTargets = (preserveExisting: boolean) => {
      if (cancelled) return;
      const width = Math.max(200, Math.round(host.clientWidth || 520));
      const activePreset = PRESETS[sizeRef.current];
      const { targets, height } = buildGlyphPoints(
        textRef.current,
        width,
        alignRef.current,
        activePreset,
        isMobile,
        isTablet
      );

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimsRef.current = { width, height, dpr };
      setBoxHeight((prev) => (Math.abs(prev - height) > 1 ? height : prev));

      const existing = particlesRef.current;
      if (!preserveExisting || existing.length === 0) {
        particlesRef.current = targets.map((t, i) =>
          createParticleForTarget(t.x, t.y, width, height, activePreset, i)
        );
      } else {
        // Smooth morph: reuse existing particles and retarget to new glyph layout
        const nextPts: TextParticle[] = [];
        for (let i = 0; i < targets.length; i++) {
          const t = targets[i];
          if (i < existing.length) {
            const p = existing[i];
            p.tx = t.x;
            p.ty = t.y;
            const ang = Math.random() * Math.PI * 2;
            const dist = activePreset.scatterRadius * (0.45 + Math.random() * 0.75);
            p.sx = t.x + Math.cos(ang) * dist;
            p.sy = t.y + Math.sin(ang) * dist;
            nextPts.push(p);
          } else {
            const seed = existing[i % existing.length];
            const created = createParticleForTarget(t.x, t.y, width, height, activePreset, i);
            created.x = seed.x + (Math.random() - 0.5) * 26;
            created.y = seed.y + (Math.random() - 0.5) * 26;
            created.alpha = seed.alpha;
            nextPts.push(created);
          }
        }
        particlesRef.current = nextPts;
      }

      if (visibleRef.current && revealedRef.current) {
        startLoop();
      }
    };

    const pointer = { x: -9999, y: -9999, active: false };
    const onGlobalPointerMove = (e: PointerEvent) => {
      if (!visibleRef.current || !revealedRef.current || e.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      const margin = 95;
      if (
        e.clientX >= rect.left - margin &&
        e.clientX <= rect.right + margin &&
        e.clientY >= rect.top - margin &&
        e.clientY <= rect.bottom + margin
      ) {
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      } else {
        pointer.active = false;
      }
    };

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      isRunning = false;
    };

    const render = () => {
      if (cancelled) {
        stopLoop();
        return;
      }
      if (document.hidden) {
        stopLoop();
        return;
      }

      const shouldForm = visibleRef.current && revealedRef.current;
      const now = performance.now();

      // Pause RAF cleanly once scrolled out of viewport and fully dispersed (~1.25s)
      if (!shouldForm && leftAtRef.current > 0 && now - leftAtRef.current > 1250) {
        ctx.clearRect(0, 0, dimsRef.current.width, dimsRef.current.height);
        stopLoop();
        return;
      }

      rafId = requestAnimationFrame(render);
      const speedMul = speedScaleRef.current;
      time += 0.016 * speedMul;

      const { width, height } = dimsRef.current;
      const pts = particlesRef.current;
      const activePreset = PRESETS[sizeRef.current];
      const repR = activePreset.repulsionRadius;

      ctx.clearRect(0, 0, width, height);

      // Subtle neutral monochrome ambient radial halo behind formed particles
      if (glowRef.current === 'subtle' && shouldForm) {
        const cx = alignRef.current === 'center' ? width * 0.5 : Math.min(width * 0.36, 280);
        const cy = height * 0.5;
        const grad = ctx.createRadialGradient(
          cx,
          cy,
          6,
          cx,
          cy,
          Math.max(width * 0.58, height * 1.4)
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.055)');
        grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.018)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        if (shouldForm) {
          // Continuous alive breathing + occasional gentle mote drift & return
          const microX = Math.cos(time * p.driftSpeed + p.phase) * p.driftAmp;
          const microY = Math.sin(time * (p.driftSpeed * 0.92) + p.phase) * p.driftAmp;

          let wanderX = 0;
          let wanderY = 0;
          if (!isMobile && p.wanderBias > 0.91) {
            const pulse = Math.sin(time * 0.65 + p.phase * 2.3);
            if (pulse > 0.72) {
              const strength = ((pulse - 0.72) / 0.28) * 6.5;
              wanderX = Math.cos(p.phase * 3.1 + time) * strength;
              wanderY = Math.sin(p.phase * 2.7 + time) * strength - 1.5;
            }
          }

          const gx = p.tx + microX + wanderX;
          const gy = p.ty + microY + wanderY;

          const spring = p.springRate * speedMul;
          p.vx += (gx - p.x) * spring;
          p.vy += (gy - p.y) * spring;

          // Subtle cursor proximity push & magnetic swirl
          if (pointer.active && !isMobile) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < repR * repR && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const factor = 1 - dist / repR;
              const push = factor * factor * 4.2;
              const nx = dx / dist;
              const ny = dy / dist;
              p.vx += nx * push - ny * factor * 0.7;
              p.vy += ny * push + nx * factor * 0.7;
            }
          }

          p.vx *= 0.8;
          p.vy *= 0.8;
          p.alpha += (p.baseAlpha - p.alpha) * 0.08;
        } else {
          // Gentle dispersion outward on viewport exit
          p.vx += (p.sx - p.x) * 0.032;
          p.vy += (p.sy - p.y) * 0.032;
          p.vx *= 0.86;
          p.vy *= 0.86;
          p.alpha += (0 - p.alpha) * 0.065;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.alpha <= 0.015) continue;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha.toFixed(3)})`;
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
    };

    const startLoop = () => {
      if (cancelled || isRunning || document.hidden) return;
      isRunning = true;
      rafId = requestAnimationFrame(render);
    };
    startLoopRef.current = startLoop;

    syncTargets(false);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const nextVisible = Boolean(entry?.isIntersecting);
        visibleRef.current = nextVisible;
        if (nextVisible) {
          leftAtRef.current = 0;
          if (revealedRef.current) {
            startLoop();
          }
        } else {
          leftAtRef.current = performance.now();
          startLoop(); // finish smooth dispersion before pausing RAF
        }
      },
      { threshold: 0.02, rootMargin: '60px 0px' }
    );
    observer.observe(host);

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => syncTargets(true), 80);
    });
    ro.observe(host);

    const onVisibilityChange = () => {
      if (!document.hidden && visibleRef.current && revealedRef.current) {
        startLoop();
      }
    };

    window.addEventListener('pointermove', onGlobalPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) syncTargets(true);
      });
    }

    return () => {
      cancelled = true;
      startLoopRef.current = null;
      stopLoop();
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onGlobalPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [textParticlesEnabled]);

  // Smoothly retarget particles when text, size, align, or glow changes after initial mount
  const mountedPropsRef = useRef(false);
  useEffect(() => {
    textRef.current = text;
    sizeRef.current = size;
    alignRef.current = align;
    glowRef.current = glow;

    if (!mountedPropsRef.current) {
      mountedPropsRef.current = true;
      return;
    }

    if (!textParticlesEnabled) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = window.innerWidth < 768 || cores <= 2;
    const isTablet = !isMobile && window.innerWidth < 1024;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.85);
    const width = Math.max(200, Math.round(host.clientWidth || 520));
    const activePreset = PRESETS[size];
    const { targets, height } = buildGlyphPoints(
      text,
      width,
      align,
      activePreset,
      isMobile,
      isTablet
    );

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dimsRef.current = { width, height, dpr };
    setBoxHeight(height);

    const existing = particlesRef.current;
    if (existing.length > 0) {
      const nextPts: TextParticle[] = [];
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        if (i < existing.length) {
          const p = existing[i];
          p.tx = t.x;
          p.ty = t.y;
          const ang = Math.random() * Math.PI * 2;
          const dist = activePreset.scatterRadius * (0.4 + Math.random() * 0.7);
          p.sx = t.x + Math.cos(ang) * dist;
          p.sy = t.y + Math.sin(ang) * dist;
          nextPts.push(p);
        } else {
          const seed = existing[i % existing.length];
          const ang = Math.random() * Math.PI * 2;
          const dist = activePreset.scatterRadius * (0.4 + Math.random() * 0.7);
          nextPts.push({
            tx: t.x,
            ty: t.y,
            sx: t.x + Math.cos(ang) * dist,
            sy: t.y + Math.sin(ang) * dist,
            x: seed.x + (Math.random() - 0.5) * 28,
            y: seed.y + (Math.random() - 0.5) * 28,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            size: activePreset.dotBase + Math.random() * activePreset.dotVariance,
            baseAlpha: 0.78 + Math.random() * 0.22,
            alpha: seed.alpha,
            phase: i * 0.6180339 + Math.random() * 1.4,
            driftAmp: isMobile ? 0.28 : 0.34 + Math.random() * 0.42,
            driftSpeed: 0.85 + Math.random() * 1.05,
            springRate: 0.068 + (i % 7) * 0.0085,
            wanderBias: Math.random(),
          });
        }
      }
      particlesRef.current = nextPts;
      if (visibleRef.current && revealedRef.current) {
        startLoopRef.current?.();
      }
    }
  }, [align, glow, size, text, textParticlesEnabled]);

  if (!textParticlesEnabled) {
    return (
      <Tag className={`${preset.fallbackClass} ${className}`}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={`relative block w-full ${className}`}>
      <span className="sr-only">{text}</span>
      <span
        ref={hostRef}
        style={{ height: `${boxHeight}px` }}
        className="relative block w-full overflow-visible"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ height: `${boxHeight}px` }}
          className={`pointer-events-none block w-full ${canvasClassName}`}
        />
      </span>
    </Tag>
  );
};

interface ParticleSectionTitleProps {
  word: string;
  align?: 'left' | 'center';
  className?: string;
}

/**
 * Monochrome Particle Section Label (ABOUT, SKILLS, PROJECTS, SERVICES, GALLERY, CONTACT)
 */
export const ParticleSectionTitle: React.FC<ParticleSectionTitleProps> = ({
  word,
  align = 'left',
  className = '',
}) => {
  return (
    <ParticleText
      as="h2"
      size="section"
      text={word}
      align={align}
      className={`max-w-[820px] ${className}`}
    />
  );
};
