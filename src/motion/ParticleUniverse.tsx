import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'motion/react';

const MORPH_PHRASES = [
  'CREATIVE MIND',
  'DIGITAL MAGIC',
  'DESIGN',
  'MOTION',
  'AI',
  'CREATIVE',
] as const;

type Phrase = (typeof MORPH_PHRASES)[number];

interface Wave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  alpha: number;
  isClick: boolean;
}

interface TrailDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  angle: number;
}

/**
 * Samples text pixel coordinates onto a deterministic point list.
 */
function sampleTextTargets(
  text: string,
  width: number,
  height: number,
  targetCount: number
): Float32Array {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d');
  const out = new Float32Array(targetCount * 2);
  if (!ctx) return out;

  const isMobile = width < 640;
  const baseFont =
    text.length > 9
      ? isMobile
        ? Math.max(32, width * 0.088)
        : Math.min(92, width * 0.075)
      : isMobile
        ? Math.max(44, width * 0.125)
        : Math.min(116, width * 0.095);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${Math.round(baseFont)}px "Outfit", ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const img = ctx.getImageData(0, 0, width, height).data;
  const step = width < 640 ? 3 : 3;
  const raw: number[] = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (img[(y * width + x) * 4 + 3] > 128) {
        raw.push(x, y);
      }
    }
  }

  const rawCount = raw.length / 2;
  if (rawCount === 0) return out;

  // Distribute targetCount evenly across sampled letter coordinates
  for (let i = 0; i < targetCount; i++) {
    const srcIdx = Math.floor((i / targetCount) * rawCount) * 2;
    out[i * 2] = raw[srcIdx] + (Math.random() - 0.5) * 1.4;
    out[i * 2 + 1] = raw[srcIdx + 1] + (Math.random() - 0.5) * 1.4;
  }

  return out;
}

export const ParticleUniverseStage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const [activePhraseIdx, setActivePhraseIdx] = useState(0);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const phraseIdxRef = useRef(0);

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { stiffness: 150, damping: 28 });
  const marqueeStretchX = useTransform(smoothVelocity, [-2400, 0, 2400], [1.07, 1, 1.07]);
  const marqueeBoost = useTransform(smoothVelocity, [-2400, 0, 2400], [-64, 0, 64]);
  const marqueeReverseBoost = useTransform(smoothVelocity, [-2400, 0, 2400], [52, 0, -52]);

  // Sync ref and auto-cycle phrases every 4.6 seconds
  useEffect(() => {
    phraseIdxRef.current = activePhraseIdx;
  }, [activePhraseIdx]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setInterval(() => {
      setActivePhraseIdx((prev) => (prev + 1) % MORPH_PHRASES.length);
    }, 4600);
    return () => clearInterval(timer);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let inView = true;

    const cores = navigator.hardwareConcurrency || 4;
    const isLowPower = cores <= 2 || window.innerWidth < 768;

    let width = Math.max(container.clientWidth, 320);
    let height = width < 640 ? 340 : 480;
    const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1.25 : 1.75);

    const TEXT_COUNT = isLowPower ? 620 : 1480;
    const AMBIENT_COUNT = isLowPower ? 220 : 560;
    const TOTAL = TEXT_COUNT + AMBIENT_COUNT;

    // Typed buffers for high-throughput 60fps simulation
    const px = new Float32Array(TOTAL);
    const py = new Float32Array(TOTAL);
    const vx = new Float32Array(TOTAL);
    const vy = new Float32Array(TOTAL);
    const tx = new Float32Array(TOTAL);
    const ty = new Float32Array(TOTAL);
    const scatterX = new Float32Array(TOTAL);
    const scatterY = new Float32Array(TOTAL);
    const pSize = new Float32Array(TOTAL);
    const pAlpha = new Float32Array(TOTAL);
    const pLayer = new Uint8Array(TOTAL); // 0=bg, 1=mid, 2=fg
    const pTrait = new Uint8Array(TOTAL); // 0..9 distinct particle personalities
    const pPhase = new Float32Array(TOTAL);

    let phraseTargets: Float32Array[] = [];

    const setupCanvasAndTargets = () => {
      width = Math.max(container.clientWidth, 320);
      height = width < 640 ? 340 : 480;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      phraseTargets = MORPH_PHRASES.map((phrase) =>
        sampleTextTargets(phrase, width, height, TEXT_COUNT)
      );

      const currentTargets = phraseTargets[phraseIdxRef.current];
      for (let i = 0; i < TEXT_COUNT; i++) {
        tx[i] = currentTargets[i * 2];
        ty[i] = currentTargets[i * 2 + 1];
      }
    };

    setupCanvasAndTargets();

    // Initialize particles with varied depth layers & organic personalities
    for (let i = 0; i < TOTAL; i++) {
      const isText = i < TEXT_COUNT;
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * Math.max(width, height) * 0.55;

      scatterX[i] = width / 2 + Math.cos(angle) * dist;
      scatterY[i] = height / 2 + Math.sin(angle) * dist;

      if (isText) {
        px[i] = scatterX[i];
        py[i] = scatterY[i];
        pLayer[i] = i % 7 === 0 ? 2 : 1;
        pSize[i] = pLayer[i] === 2 ? 1.85 : 1.35;
        pAlpha[i] = 0.65 + Math.random() * 0.35;
      } else {
        px[i] = Math.random() * width;
        py[i] = Math.random() * height;
        tx[i] = px[i];
        ty[i] = py[i];
        const r = Math.random();
        pLayer[i] = r < 0.45 ? 0 : r < 0.82 ? 1 : 2;
        pSize[i] = pLayer[i] === 0 ? 0.8 : pLayer[i] === 1 ? 1.25 : 1.9;
        pAlpha[i] = pLayer[i] === 0 ? 0.22 : pLayer[i] === 1 ? 0.44 : 0.72;
      }

      vx[i] = (Math.random() - 0.5) * 0.6;
      vy[i] = (Math.random() - 0.5) * 0.6;
      pTrait[i] = i % 10;
      pPhase[i] = Math.random() * Math.PI * 2;
    }

    // Invisible Orbital Gravity Points inside the Universe
    const gravityWells = [
      { rx: 0.22, ry: 0.3, dir: 1, radius: 135 },
      { rx: 0.78, ry: 0.68, dir: -1, radius: 150 },
    ];

    const pointer = {
      x: width * 0.5,
      y: height * 0.5,
      prevX: width * 0.5,
      prevY: height * 0.5,
      vx: 0,
      vy: 0,
      active: false,
      nx: 0,
      ny: 0,
    };

    const waves: Wave[] = [];
    const trail: TrailDot[] = [];
    let lastWaveTime = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      pointer.vx = Math.max(-28, Math.min(28, nx - pointer.x));
      pointer.vy = Math.max(-28, Math.min(28, ny - pointer.y));
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      pointer.active = true;
      pointer.nx = nx / Math.max(width, 1) - 0.5;
      pointer.ny = ny / Math.max(height, 1) - 0.5;

      const speed = Math.hypot(pointer.vx, pointer.vy);
      const now = performance.now();
      if (speed > 14 && now - lastWaveTime > 140) {
        lastWaveTime = now;
        waves.push({
          x: nx,
          y: ny,
          radius: 8,
          maxRadius: 190,
          strength: Math.min(speed * 0.14, 3.6),
          alpha: 0.34,
          isClick: false,
        });
      }

      if (speed > 2) {
        for (let k = 0; k < 2; k++) {
          trail.push({
            x: nx + (Math.random() - 0.5) * 6,
            y: ny + (Math.random() - 0.5) * 6,
            vx: -pointer.vx * 0.06 + (Math.random() - 0.5) * 0.6,
            vy: -pointer.vy * 0.06 + (Math.random() - 0.5) * 0.6,
            size: 0.9 + Math.random() * 1.4,
            alpha: 0.65,
            angle: Math.random() * Math.PI * 2,
          });
        }
        if (trail.length > 48) trail.splice(0, trail.length - 48);
      }
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.vx = 0;
      pointer.vy = 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      waves.push({
        x: cx,
        y: cy,
        radius: 6,
        maxRadius: 340,
        strength: 7.5,
        alpha: 0.72,
        isClick: true,
      });
    };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      setupCanvasAndTargets();
    });
    resizeObserver.observe(container);

    const viewObserver = new IntersectionObserver(
      (entries) => {
        inView = Boolean(entries[0]?.isIntersecting);
      },
      { threshold: 0.08 }
    );
    viewObserver.observe(container);

    let lastPhrase = phraseIdxRef.current;
    let time = 0;

    const render = () => {
      rafId = requestAnimationFrame(render);
      if (document.hidden) return;

      time += 0.016;
      pointer.vx *= 0.86;
      pointer.vy *= 0.86;

      // Morph targets when active phrase changes
      if (phraseIdxRef.current !== lastPhrase) {
        lastPhrase = phraseIdxRef.current;
        const nextTargets = phraseTargets[lastPhrase];
        if (nextTargets) {
          for (let i = 0; i < TEXT_COUNT; i++) {
            tx[i] = nextTargets[i * 2];
            ty[i] = nextTargets[i * 2 + 1];
            // Subtle swirl impulse during morph transition
            vx[i] += (Math.random() - 0.5) * 1.6;
            vy[i] += (Math.random() - 0.5) * 1.6;
          }
        }
      }

      ctx.fillStyle = '#030304';
      ctx.fillRect(0, 0, width, height);

      // Update & draw expanding waves / click ripples
      for (let w = waves.length - 1; w >= 0; w--) {
        const wave = waves[w];
        wave.radius += wave.isClick ? 7.5 : 5.2;
        wave.alpha *= wave.isClick ? 0.955 : 0.94;

        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${(wave.alpha * 0.42).toFixed(3)})`;
        ctx.lineWidth = wave.isClick ? 1.25 : 0.8;
        ctx.stroke();

        if (wave.radius > wave.maxRadius || wave.alpha < 0.015) {
          waves.splice(w, 1);
        }
      }

      // Soft circular cursor distortion aura inside canvas
      if (pointer.active) {
        const grad = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          4,
          pointer.x,
          pointer.y,
          120
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
        grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.025)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 52, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      const windX = pointer.vx * 0.055;
      const windY = pointer.vy * 0.055;

      // Simulate all particles
      for (let i = 0; i < TOTAL; i++) {
        const isText = i < TEXT_COUNT;
        const layer = pLayer[i];
        const trait = pTrait[i];
        const depthFactor = layer === 0 ? 0.35 : layer === 1 ? 0.85 : 1.45;

        // Parallax offset based on depth layer
        const parallaxX = pointer.active ? -pointer.nx * 24 * depthFactor : 0;
        const parallaxY = pointer.active ? -pointer.ny * 18 * depthFactor : 0;

        if (isText) {
          // Dissolve when scrolled off-screen; reconstruct smoothly when in view
          const goalX = (inView ? tx[i] : scatterX[i]) + parallaxX * 0.35;
          const goalY = (inView ? ty[i] : scatterY[i]) + parallaxY * 0.35;

          const springK = inView ? 0.068 : 0.022;
          vx[i] += (goalX - px[i]) * springK;
          vy[i] += (goalY - py[i]) * springK;

          // Subtle alive micro-motion even when formed
          vx[i] += Math.cos(time * 1.4 + pPhase[i]) * 0.028;
          vy[i] += Math.sin(time * 1.3 + pPhase[i]) * 0.028;
        } else {
          // Ambient starfield & dust personalities
          const speedMul = trait === 1 ? 1.6 : trait === 0 ? 0.55 : 1;
          vx[i] += Math.cos(time * 0.45 + pPhase[i]) * 0.015 * depthFactor * speedMul;
          vy[i] += Math.sin(time * 0.4 + pPhase[i]) * 0.014 * depthFactor * speedMul;

          // Particle wind on fast mouse motion
          vx[i] += windX * 0.18 * depthFactor;
          vy[i] += windY * 0.18 * depthFactor;

          // Orbit around invisible gravity wells for orbit-trait particles
          if (trait === 2 || trait === 3) {
            for (const gw of gravityWells) {
              const gx = gw.rx * width;
              const gy = gw.ry * height;
              const dx = gx - px[i];
              const dy = gy - py[i];
              const d = Math.hypot(dx, dy);
              if (d < gw.radius && d > 12) {
                const txv = (-dy / d) * gw.dir;
                const tyv = (dx / d) * gw.dir;
                vx[i] += txv * 0.055 + (dx / d) * 0.016;
                vy[i] += tyv * 0.055 + (dy / d) * 0.016;
              }
            }
          }
        }

        // Mouse Gravity & Magnetic Text Interaction
        if (pointer.active) {
          const dx = pointer.x - px[i];
          const dy = pointer.y - py[i];
          const d = Math.hypot(dx, dy);
          const radius = isText ? 96 : 165;

          if (d < radius && d > 1) {
            const strength = 1 - d / radius;
            if (isText) {
              // Magnetic attraction near edge, gentle parting directly through letter core
              if (d < 36) {
                vx[i] -= (dx / d) * strength * 1.45;
                vy[i] -= (dy / d) * strength * 1.45;
              } else {
                vx[i] += (dx / d) * strength * 0.48 + (-dy / d) * strength * 0.22;
                vy[i] += (dy / d) * strength * 0.48 + (dx / d) * strength * 0.22;
              }
            } else {
              if (trait === 4) {
                // Repulsion personality
                vx[i] -= (dx / d) * strength * 0.55;
                vy[i] -= (dy / d) * strength * 0.55;
              } else if (trait === 5) {
                // Orbit around cursor
                vx[i] += (-dy / d) * strength * 0.65 + (dx / d) * strength * 0.14;
                vy[i] += (dx / d) * strength * 0.65 + (dy / d) * strength * 0.14;
              } else {
                // Smooth gravity attraction
                vx[i] += (dx / d) * strength * 0.36;
                vy[i] += (dy / d) * strength * 0.36;
              }
            }
          }
        }

        // React to expanding Cursor Waves & Click Ripples
        for (let w = 0; w < waves.length; w++) {
          const wave = waves[w];
          const dx = px[i] - wave.x;
          const dy = py[i] - wave.y;
          const d = Math.hypot(dx, dy);
          const band = Math.abs(d - wave.radius);
          if (band < 26 && d > 1) {
            const f = (1 - band / 26) * wave.strength * (wave.alpha + 0.2);
            const rot = wave.isClick ? 0.35 : 0;
            vx[i] += (dx / d) * f + (-dy / d) * f * rot;
            vy[i] += (dy / d) * f + (dx / d) * f * rot;
          }
        }

        // Damping
        const damp = isText ? 0.83 : 0.945;
        vx[i] *= damp;
        vy[i] *= damp;

        px[i] += vx[i];
        py[i] += vy[i];

        // Wrap ambient stars smoothly
        if (!isText) {
          if (px[i] < -10) px[i] = width + 10;
          if (px[i] > width + 10) px[i] = -10;
          if (py[i] < -10) py[i] = height + 10;
          if (py[i] > height + 10) py[i] = -10;
        }

        // Pulse / flicker alpha variation
        let alpha = pAlpha[i];
        if (trait === 6 || trait === 7) {
          alpha *= 0.62 + 0.38 * Math.sin(time * 2.6 + pPhase[i]);
        }
        if (isText && !inView) {
          alpha *= 0.25;
        }

        const drawX = isText ? px[i] : px[i] + parallaxX * 0.45;
        const drawY = isText ? py[i] : py[i] + parallaxY * 0.45;
        const sz = pSize[i];

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        if (sz <= 1.7) {
          ctx.fillRect(drawX, drawY, sz, sz);
        } else {
          ctx.beginPath();
          ctx.arc(drawX, drawY, sz * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Subtle White Connecting Lines among sparse ambient constellation subset (never dense web)
      const connectStep = isLowPower ? 6 : 4;
      const connectDist = 66;
      ctx.lineWidth = 0.6;
      for (let i = TEXT_COUNT; i < TOTAL; i += connectStep) {
        const ax = px[i];
        const ay = py[i];
        for (let j = i + connectStep; j < TOTAL; j += connectStep) {
          const dx = ax - px[j];
          const dy = ay - py[j];
          const d2 = dx * dx + dy * dy;
          if (d2 < connectDist * connectDist) {
            const d = Math.sqrt(d2);
            const lineAlpha = (1 - d / connectDist) * 0.16;
            ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(px[j], py[j]);
            ctx.stroke();
          }
        }
      }

      // Render subtle fading cursor trail particles
      for (let t = trail.length - 1; t >= 0; t--) {
        const dot = trail[t];
        dot.angle += 0.08;
        dot.x += dot.vx + Math.cos(dot.angle) * 0.25;
        dot.y += dot.vy + Math.sin(dot.angle) * 0.25;
        dot.alpha *= 0.92;
        if (dot.alpha < 0.03) {
          trail.splice(t, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha.toFixed(3)})`;
        ctx.fill();
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [shouldReduceMotion]);

  return (
    <div className="relative z-10 w-full pt-4">
      {/* Large Rectangular Canvas Frame with Thin White Border & Animated Photon Light */}
      <div className="mx-auto max-w-[1360px] px-6 sm:px-10">
        <div
          ref={containerRef}
          className="relative w-full rounded-2xl border border-white/[0.16] bg-[#030304] overflow-hidden shadow-[0_28px_90px_-30px_rgba(0,0,0,0.95)]"
        >
          {/* Animated Tiny White Light Travelling Around the Border */}
          {!shouldReduceMotion && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full z-20"
              preserveAspectRatio="none"
            >
              <motion.rect
                x="0.5"
                y="0.5"
                width="calc(100% - 1px)"
                height="calc(100% - 1px)"
                rx="16"
                ry="16"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.25"
                strokeDasharray="65 1100"
                animate={{ strokeDashoffset: [0, -1165] }}
                transition={{ duration: 8.5, repeat: Infinity, ease: 'linear' }}
              />
            </svg>
          )}

          {shouldReduceMotion ? (
            <div className="h-[260px] flex flex-col items-center justify-center px-6 text-center">
              <p className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white">
                {MORPH_PHRASES[activePhraseIdx]}
              </p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              data-cursor="gravity"
              aria-label={`Interactive particle typography displaying ${MORPH_PHRASES[activePhraseIdx]}`}
              className="block w-full h-[340px] sm:h-[480px] cursor-crosshair"
            />
          )}

          {/* Clean Unboxed Interactive Phrase Selector Bar */}
          <div className="relative z-20 px-5 sm:px-8 py-3.5 border-t border-white/[0.08] bg-[#050506]/90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {MORPH_PHRASES.map((phrase: Phrase, idx) => {
                const active = activePhraseIdx === idx;
                return (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => setActivePhraseIdx(idx)}
                    className={`text-[11px] font-mono tracking-[0.14em] transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-sm py-0.5 ${
                      active ? 'text-white underline underline-offset-4' : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {phrase}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap shrink-0">
              Move · Click to ripple
            </span>
          </div>
        </div>
      </div>

      {/* 3-Layer Velocity-Reactive Marquee System */}
      <div
        aria-hidden="true"
        onMouseEnter={() => setMarqueePaused(true)}
        onMouseLeave={() => setMarqueePaused(false)}
        className="mt-8 border-y border-white/[0.08] bg-[#060607] py-4 overflow-hidden select-none space-y-2.5"
      >
        {/* Layer 1: Primary Left Flow */}
        <motion.div
          style={
            shouldReduceMotion
              ? undefined
              : { scaleX: marqueeStretchX, x: marqueeBoost }
          }
          className="origin-center"
        >
          <div
            className="flex whitespace-nowrap animate-marquee text-xs font-mono tracking-[0.26em] text-zinc-200 transition-colors duration-300"
            style={{ animationPlayState: marqueePaused ? 'paused' : 'running' }}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-8 pr-8">
                <span>CREATIVE</span>
                <span className="text-zinc-600">·</span>
                <span>DESIGN</span>
                <span className="text-zinc-600">·</span>
                <span>MOTION</span>
                <span className="text-zinc-600">·</span>
                <span>CODE</span>
                <span className="text-zinc-600">·</span>
                <span>AI</span>
                <span className="text-zinc-600">·</span>
                <span>DIGITAL MAGIC</span>
                <span className="text-zinc-600">·</span>
                <span>CREATIVE</span>
                <span className="text-zinc-600">·</span>
                <span>DESIGN</span>
                <span className="text-zinc-600">·</span>
                <span>MOTION</span>
                <span className="text-zinc-600">·</span>
                <span>CODE</span>
                <span className="text-zinc-600">·</span>
                <span>AI</span>
                <span className="text-zinc-600">·</span>
                <span>DIGITAL MAGIC</span>
                <span className="text-zinc-600">·</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Layer 2: Counter-Flowing Right Stream */}
        <motion.div
          style={
            shouldReduceMotion
              ? undefined
              : { scaleX: marqueeStretchX, x: marqueeReverseBoost }
          }
          className="origin-center"
        >
          <div
            className="flex whitespace-nowrap animate-marquee-reverse text-[11px] font-mono tracking-[0.22em] text-zinc-500 hover:text-zinc-300 transition-colors duration-300"
            style={{ animationPlayState: marqueePaused ? 'paused' : 'running' }}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-7 pr-7">
                <span>PARTICLE PHYSICS</span>
                <span>•</span>
                <span>WEB ARCHITECTURE</span>
                <span>•</span>
                <span>INTERFACE SYSTEMS</span>
                <span>•</span>
                <span>KINETIC TYPOGRAPHY</span>
                <span>•</span>
                <span>MONOCHROME CRAFT</span>
                <span>•</span>
                <span>GENERATIVE SYSTEMS</span>
                <span>•</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Layer 3: Subtle Deep Drift */}
        <div
          className="flex whitespace-nowrap animate-marquee-slow text-[10px] font-mono tracking-[0.34em] text-zinc-600"
          style={{ animationPlayState: marqueePaused ? 'paused' : 'running' }}
        >
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-10 pr-10">
              <span>ABRAR HASSAN STUDIO</span>
              <span>—</span>
              <span>CREATIVE · DESIGN · MOTION · CODE · AI · DIGITAL MAGIC</span>
              <span>—</span>
              <span>PURE MONOCHROME EXPERIENCE</span>
              <span>—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
