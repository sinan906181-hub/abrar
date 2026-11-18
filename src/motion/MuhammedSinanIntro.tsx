import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { experimentalBus } from './ExperimentalEngine';
import type { IntroSettings } from '../types/cms';

interface MuhammedSinanIntroProps {
  active: boolean;
  condensed?: boolean;
  settings?: IntroSettings;
  onStartReveal: () => void;
  onComplete: () => void;
}

interface SampledResult {
  points: Float32Array; // [x, y, segmentOrder] triplets
  count: number;
}

function sampleSequentialPhrasePoints(
  text: string,
  width: number,
  height: number,
  maxPoints: number,
  textScale = 1
): SampledResult {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d');
  if (!ctx) return { points: new Float32Array(0), count: 0 };

  const rawText = (text || 'Developer • Designer • Creator').trim();
  // Tokenize into sequential segments, keeping bullets '•' as discrete subtle nodes
  const tokens = rawText
    .split(/(\s*•\s*|\s+)/)
    .map((t) => t.trim())
    .filter(Boolean);

  const isNarrow = width < 680;
  const wordCount = tokens.filter((t) => t !== '•').length;

  interface SegmentBox {
    token: string;
    x: number;
    y: number;
    font: string;
    isBullet: boolean;
    order: number;
  }

  const boxes: SegmentBox[] = [];
  const baseFontSize = isNarrow
    ? Math.max(26, Math.min(44, width * 0.088)) * textScale
    : Math.max(38, Math.min(72, width * 0.044)) * textScale;

  const mainFont = `600 ${Math.round(baseFontSize)}px "Outfit", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`;
  const bulletFont = `500 ${Math.round(baseFontSize * 0.56)}px "Outfit", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`;

  // Decide single-line vs stacked narrow mobile layout
  const gapNormal = Math.round(baseFontSize * 0.36);

  const measureSingleLine = () => {
    let total = 0;
    const widths: number[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const isBullet = tok === '•';
      ctx.font = isBullet ? bulletFont : mainFont;
      const w = ctx.measureText(tok).width;
      widths.push(w);
      total += w + (i < tokens.length - 1 ? gapNormal : 0);
    }
    return { total, widths };
  };

  let { total: lineWidth, widths } = measureSingleLine();
  let useStacked = isNarrow && wordCount >= 2 && lineWidth > width * 0.88;

  // If slightly wider than desktop safe margin, scale font gently so single-line fits seamlessly
  let effectiveScale = 1;
  if (!useStacked && lineWidth > width * 0.86) {
    effectiveScale = (width * 0.86) / Math.max(lineWidth, 1);
  }

  const finalFontSize = Math.round(baseFontSize * effectiveScale);
  const finalMainFont = `600 ${finalFontSize}px "Outfit", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`;
  const finalBulletFont = `500 ${Math.round(finalFontSize * 0.54)}px "Outfit", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`;
  const finalGap = Math.round(finalFontSize * 0.42);

  if (!useStacked) {
    lineWidth = 0;
    widths = tokens.map((tok, i) => {
      const isBullet = tok === '•';
      ctx.font = isBullet ? finalBulletFont : finalMainFont;
      const w = ctx.measureText(tok).width;
      lineWidth += w + (i < tokens.length - 1 ? finalGap : 0);
      return w;
    });

    let cursorX = width * 0.5 - lineWidth * 0.5;
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const isBullet = tok === '•';
      boxes.push({
        token: tok,
        x: cursorX + widths[i] * 0.5,
        y: height * 0.5,
        font: isBullet ? finalBulletFont : finalMainFont,
        isBullet,
        order: tokens.length > 1 ? i / (tokens.length - 1) : 0,
      });
      cursorX += widths[i] + finalGap;
    }
  } else {
    // Stacked clean mobile rhythm: words centered vertically with small subtle bullets between
    const nonBulletCount = tokens.filter((t) => t !== '•').length;
    const totalLines = tokens.length;
    const stepY = finalFontSize * 0.92;
    const startY = height * 0.5 - ((totalLines - 1) * stepY) * 0.5;
    void nonBulletCount;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const isBullet = tok === '•';
      boxes.push({
        token: tok,
        x: width * 0.5,
        y: startY + i * stepY,
        font: isBullet ? finalBulletFont : finalMainFont,
        isBullet,
        order: tokens.length > 1 ? i / (tokens.length - 1) : 0,
      });
    }
  }

  const rawPoints: number[] = [];
  const step = isNarrow ? 2 : width > 1280 ? 2 : 2;

  for (const box of boxes) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = box.font;
    ctx.fillText(box.token, box.x, box.y);

    const metrics = ctx.measureText(box.token);
    const padX = Math.ceil(metrics.width * 0.65) + 12;
    const padY = Math.ceil(finalFontSize * 0.85) + 12;
    const minX = Math.max(0, Math.floor(box.x - padX));
    const maxX = Math.min(width, Math.ceil(box.x + padX));
    const minY = Math.max(0, Math.floor(box.y - padY));
    const maxY = Math.min(height, Math.ceil(box.y + padY));

    const imgData = ctx.getImageData(0, 0, width, height).data;
    const localStep = box.isBullet ? 1 : step;

    for (let y = minY; y < maxY; y += localStep) {
      for (let x = minX; x < maxX; x += localStep) {
        if (imgData[(y * width + x) * 4 + 3] > 118) {
          rawPoints.push(x, y, box.order);
        }
      }
    }
  }

  const totalRaw = rawPoints.length / 3;
  if (totalRaw === 0) return { points: new Float32Array(0), count: 0 };

  const count = Math.min(maxPoints, totalRaw);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor((i / count) * totalRaw) * 3;
    out[i * 3] = rawPoints[idx] + (Math.random() - 0.5) * 0.65;
    out[i * 3 + 1] = rawPoints[idx + 1] + (Math.random() - 0.5) * 0.65;
    out[i * 3 + 2] = rawPoints[idx + 2];
  }
  return { points: out, count };
}

export const MuhammedSinanIntro: React.FC<MuhammedSinanIntroProps> = ({
  active,
  condensed = false,
  settings,
  onStartReveal,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const skipTriggerRef = useRef<() => void>(() => {});
  const shouldReduceMotion = useReducedMotion();

  const introText = settings?.text || 'Developer • Designer • Creator';
  const durationSec = Math.max(2, Math.min(12, settings?.durationSec || 6.25));
  const density = Math.max(0.3, Math.min(2, settings?.particleDensity || 1));
  const particleSpeed = Math.max(0.3, Math.min(2.5, settings?.particleSpeed || 1));
  const textSize = Math.max(0.6, Math.min(1.5, settings?.textSize || 1));
  const glowIntensity = Math.max(0, Math.min(2, settings?.glowIntensity ?? 1));
  const bgColor = settings?.backgroundColor || '#030304';

  useEffect(() => {
    if (!active) return;
    if (shouldReduceMotion || settings?.enabled === false) {
      onStartReveal();
      onComplete();
      return;
    }

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const cores = navigator.hardwareConcurrency || 4;
    const isLowPower = cores <= 2 || width < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1.25 : 1.75);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const maxTextPts = Math.round((isLowPower ? 1150 : 2650) * density);
    const sampled = sampleSequentialPhrasePoints(introText, width, height, maxTextPts, textSize);
    const TEXT_N = sampled.count;
    const AMBIENT_N = Math.round((isLowPower ? 105 : 230) * density);
    const TOTAL = TEXT_N + AMBIENT_N;

    const px = new Float32Array(TOTAL);
    const py = new Float32Array(TOTAL);
    const vx = new Float32Array(TOTAL);
    const vy = new Float32Array(TOTAL);
    const tx = new Float32Array(TOTAL);
    const ty = new Float32Array(TOTAL);
    const ex = new Float32Array(TOTAL);
    const ey = new Float32Array(TOTAL);
    const size = new Float32Array(TOTAL);
    const baseAlpha = new Float32Array(TOTAL);
    const phase = new Float32Array(TOTAL);
    const stagger = new Float32Array(TOTAL);
    const depth = new Float32Array(TOTAL);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const maxDim = Math.hypot(width, height) * 0.65;

    for (let i = 0; i < TOTAL; i++) {
      const isText = i < TEXT_N;
      const startAngle = Math.random() * Math.PI * 2;
      const startRadius = isText ? 110 + Math.random() * maxDim * 0.68 : Math.random() * maxDim;
      px[i] = cx + Math.cos(startAngle) * startRadius;
      py[i] = cy + Math.sin(startAngle) * startRadius;

      const tangAngle = startAngle + Math.PI * 0.5;
      vx[i] = Math.cos(tangAngle) * (0.38 + Math.random() * 0.72);
      vy[i] = Math.sin(tangAngle) * (0.38 + Math.random() * 0.72);
      depth[i] = 0.65 + Math.random() * 0.55;

      if (isText) {
        tx[i] = sampled.points[i * 3];
        ty[i] = sampled.points[i * 3 + 1];
        const segOrder = sampled.points[i * 3 + 2];

        const outAng = Math.atan2(ty[i] - cy, tx[i] - cx) + (Math.random() - 0.5) * 0.85;
        const outDist = maxDim * (0.85 + Math.random() * 0.48);
        ex[i] = cx + Math.cos(outAng) * outDist;
        ey[i] = cy + Math.sin(outAng) * outDist;
        size[i] = (isLowPower ? 1.35 : 1.0 + Math.random() * 0.8) * (0.85 + depth[i] * 0.2);
        baseAlpha[i] = (0.68 + Math.random() * 0.3) * (0.8 + depth[i] * 0.2);
        // Preserve strict word-by-word sequential convergence ("Developer" -> "•" -> "Designer" -> "•" -> "Creator")
        stagger[i] = Math.min(0.98, segOrder * 0.74 + Math.random() * 0.14);
      } else {
        tx[i] = Math.random() * width;
        ty[i] = Math.random() * height;
        const outAng = Math.atan2(py[i] - cy, px[i] - cx);
        ex[i] = cx + Math.cos(outAng) * maxDim * 1.15;
        ey[i] = cy + Math.sin(outAng) * maxDim * 1.15;
        size[i] = 0.65 + Math.random() * 1.1;
        baseAlpha[i] = 0.18 + Math.random() * 0.4;
        stagger[i] = Math.random();
      }
      phase[i] = Math.random() * Math.PI * 2;
    }

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      size: number;
    }
    const sparks: Spark[] = [];

    const pointer = { x: -999, y: -999, active: false };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      pointer.x = t.clientX;
      pointer.y = t.clientY;
      pointer.active = true;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    const speedScale = (condensed ? 1.5 : 1) * (6.25 / durationSec) * particleSpeed;
    const T_VOID_END = 0.85 / speedScale;
    const T_FORM_END = 3.05 / speedScale;
    const T_HOLD_END = 4.3 / speedScale;
    const T_DISSOLVE_END = 5.4 / speedScale;
    const T_TOTAL = 6.25 / speedScale;

    let startTime = performance.now();
    let revealFired = false;
    let burstFired = false;
    let finished = false;

    const triggerSkip = () => {
      if (finished) return;
      const elapsed = (performance.now() - startTime) / 1000;
      const skipPoint = T_HOLD_END + (T_DISSOLVE_END - T_HOLD_END) * 0.28;
      if (elapsed < skipPoint) {
        startTime = performance.now() - skipPoint * 1000;
      }
    };
    skipTriggerRef.current = triggerSkip;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') triggerSkip();
    };
    window.addEventListener('keydown', onKeyDown);

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', onResize, { passive: true });

    const render = (now: number) => {
      if (finished) return;
      rafId = requestAnimationFrame(render);

      const t = (now - startTime) / 1000;

      // Hand off active particles seamlessly into ExperimentalAtmosphereCanvas as phrase disperses
      if (t >= T_DISSOLVE_END && !burstFired) {
        burstFired = true;
        const handoff = [];
        const stride = Math.max(1, Math.floor(TOTAL / 240));
        for (let i = 0; i < TOTAL; i += stride) {
          handoff.push({
            x: px[i],
            y: py[i],
            vx: vx[i],
            vy: vy[i],
            size: size[i],
            alpha: baseAlpha[i],
          });
        }
        experimentalBus.handoffParticles = handoff;
        experimentalBus.introBurstAt = performance.now();
      }
      if (t >= T_DISSOLVE_END + (T_TOTAL - T_DISSOLVE_END) * 0.14 && !revealFired) {
        revealFired = true;
        onStartReveal();
      }
      if (t >= T_TOTAL) {
        finished = true;
        cancelAnimationFrame(rafId);
        onComplete();
        return;
      }

      let bgAlpha = 1;
      if (t > T_DISSOLVE_END) {
        const clearProgress = Math.min(1, (t - T_DISSOLVE_END) / (T_TOTAL - T_DISSOLVE_END));
        bgAlpha = Math.max(0, 1 - Math.pow(clearProgress, 1.4));
      }
      wrap.style.backgroundColor = bgColor;
      wrap.style.opacity = bgAlpha.toFixed(3);

      if (t >= T_VOID_END && t < T_FORM_END) {
        ctx.fillStyle = 'rgba(3, 3, 4, 0.36)';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      const wakeRatio =
        t < T_VOID_END
          ? 0.01 + 0.99 * Math.pow(t / T_VOID_END, 2.1)
          : 1;
      const activeLimit = Math.max(14, Math.floor(TOTAL * wakeRatio));

      if (t > T_VOID_END * 1.1 && t < T_DISSOLVE_END && glowIntensity > 0.02) {
        const formStrength =
          t < T_FORM_END
            ? (t - T_VOID_END) / (T_FORM_END - T_VOID_END)
            : t > T_HOLD_END
              ? Math.max(0, 1 - (t - T_HOLD_END) / (T_DISSOLVE_END - T_HOLD_END))
              : 1;
        const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.min(width, 920) * 0.4);
        glow.addColorStop(0, `rgba(255, 255, 255, ${(0.055 * formStrength * glowIntensity).toFixed(3)})`);
        glow.addColorStop(0.6, `rgba(255, 255, 255, ${(0.014 * formStrength * glowIntensity).toFixed(3)})`);
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      const sweepStart = T_FORM_END + (T_HOLD_END - T_FORM_END) * 0.08;
      const sweepEnd = T_HOLD_END - (T_HOLD_END - T_FORM_END) * 0.08;
      const sweepActive = t >= sweepStart && t <= sweepEnd;
      const sweepNorm = sweepActive ? (t - sweepStart) / (sweepEnd - sweepStart) : -1;
      const sweepX = width * (0.08 + sweepNorm * 0.84);

      if (sweepActive) {
        const beamGrad = ctx.createLinearGradient(sweepX - 55, 0, sweepX + 55, 0);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${(0.16 * Math.max(0.25, glowIntensity)).toFixed(3)})`);
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(sweepX - 55, cy - 130, 110, 260);
      }

      const breathX =
        t >= T_FORM_END && t <= T_HOLD_END ? 1 + Math.sin(t * 2.1) * 0.006 : 1;
      const breathY =
        t >= T_FORM_END && t <= T_HOLD_END ? 1 - Math.sin(t * 2.1) * 0.005 : 1;

      for (let i = 0; i < activeLimit; i++) {
        const isText = i < TEXT_N;

        if (isText) {
          if (t < T_VOID_END) {
            const dx = cx - px[i];
            const dy = cy - py[i];
            const d = Math.max(20, Math.hypot(dx, dy));
            vx[i] += (dx / d) * 0.042 + (-dy / d) * 0.032;
            vy[i] += (dy / d) * 0.042 + (dx / d) * 0.032;
            vx[i] *= 0.96;
            vy[i] *= 0.96;
            px[i] += vx[i];
            py[i] += vy[i];
          } else if (t < T_FORM_END) {
            // Sequential formation: Developer -> • -> Designer -> • -> Creator
            const formFrac = (t - T_VOID_END) / (T_FORM_END - T_VOID_END);
            const localP = Math.max(0, Math.min(1, (formFrac - stagger[i] * 0.62) / 0.38));

            if (localP > 0.02) {
              const springK = 0.045 + localP * 0.14;
              vx[i] += (tx[i] - px[i]) * springK;
              vy[i] += (ty[i] - py[i]) * springK;
              if (localP < 0.5) {
                const dx = tx[i] - px[i];
                const dy = ty[i] - py[i];
                vx[i] += -dy * 0.012;
                vy[i] += dx * 0.012;
              }
              vx[i] *= 0.77;
              vy[i] *= 0.77;
            } else {
              // Gentle orbital holding pattern before this word's sequential cue
              const dx = cx - px[i];
              const dy = cy - py[i];
              const d = Math.max(30, Math.hypot(dx, dy));
              vx[i] += (dx / d) * 0.016 + (-dy / d) * 0.022 + Math.cos(t * 2 + phase[i]) * 0.03;
              vy[i] += (dy / d) * 0.016 + (dx / d) * 0.022 + Math.sin(t * 2 + phase[i]) * 0.03;
              vx[i] *= 0.95;
              vy[i] *= 0.95;
            }
            px[i] += vx[i];
            py[i] += vy[i];
          } else if (t <= T_HOLD_END) {
            const goalX =
              cx + (tx[i] - cx) * breathX + Math.cos(t * 2.5 + phase[i]) * 0.6 * depth[i];
            const goalY =
              cy + (ty[i] - cy) * breathY + Math.sin(t * 2.2 + phase[i]) * 0.6 * depth[i];

            vx[i] += (goalX - px[i]) * 0.16;
            vy[i] += (goalY - py[i]) * 0.16;

            if (pointer.active) {
              const dx = px[i] - pointer.x;
              const dy = py[i] - pointer.y;
              const d = Math.hypot(dx, dy);
              if (d < 88 && d > 1) {
                const f = (1 - d / 88) * 3.4;
                vx[i] += (dx / d) * f + (-dy / d) * f * 0.4;
                vy[i] += (dy / d) * f + (dx / d) * f * 0.4;
              }
            }

            vx[i] *= 0.78;
            vy[i] *= 0.78;
            px[i] += vx[i];
            py[i] += vy[i];
          } else if (t <= T_DISSOLVE_END) {
            const dProg = (t - T_HOLD_END) / (T_DISSOLVE_END - T_HOLD_END);
            const dx = px[i] - cx;
            const dy = py[i] - cy;
            const d = Math.max(12, Math.hypot(dx, dy));
            const swirl = 0.25 * (1 - dProg * 0.5);
            vx[i] += (dx / d) * 0.36 + (-dy / d) * swirl + Math.cos(phase[i]) * 0.12;
            vy[i] += (dy / d) * 0.36 + (dx / d) * swirl + Math.sin(phase[i]) * 0.12;
            vx[i] *= 0.94;
            vy[i] *= 0.94;
            px[i] += vx[i];
            py[i] += vy[i];
          } else {
            vx[i] += (ex[i] - px[i]) * 0.045;
            vy[i] += (ey[i] - py[i]) * 0.045;
            vx[i] *= 0.92;
            vy[i] *= 0.92;
            px[i] += vx[i];
            py[i] += vy[i];
          }
        } else {
          // Ambient orbiter particles drifting around the letters
          const angleOrbit = t * 0.65 + phase[i];
          vx[i] += Math.cos(angleOrbit) * 0.016;
          vy[i] += Math.sin(angleOrbit) * 0.016;
          if (pointer.active && t <= T_HOLD_END) {
            const dx = px[i] - pointer.x;
            const dy = py[i] - pointer.y;
            const d = Math.hypot(dx, dy);
            if (d < 95 && d > 2) {
              vx[i] += (dx / d) * 0.25;
              vy[i] += (dy / d) * 0.25;
            }
          }
          if (t > T_DISSOLVE_END) {
            vx[i] += (ex[i] - px[i]) * 0.025;
            vy[i] += (ey[i] - py[i]) * 0.025;
          }
          vx[i] *= 0.96;
          vy[i] *= 0.96;
          px[i] += vx[i];
          py[i] += vy[i];
        }

        let alpha = baseAlpha[i];
        let drawSize = size[i];

        if (t < T_VOID_END) {
          alpha *= Math.min(1, t / (T_VOID_END * 0.6)) * 0.45;
        } else if (t > T_DISSOLVE_END) {
          const cProg = (t - T_DISSOLVE_END) / (T_TOTAL - T_DISSOLVE_END);
          alpha *= Math.max(0, 1 - cProg * 0.95);
        } else if (t > T_HOLD_END) {
          const dProg = (t - T_HOLD_END) / (T_DISSOLVE_END - T_HOLD_END);
          alpha *= 1 - dProg * 0.24;
        }

        if (isText && sweepActive) {
          const distSweep = Math.abs(px[i] - sweepX);
          if (distSweep < 38) {
            const boost = 1 - distSweep / 38;
            alpha = Math.min(1, alpha + boost * 0.35);
            drawSize += boost * 0.75;
            if (boost > 0.75 && Math.random() < 0.02 && sparks.length < 40) {
              sparks.push({
                x: px[i],
                y: py[i],
                vx: 1.1 + Math.random() * 2,
                vy: (Math.random() - 0.5) * 1.4,
                alpha: 0.85,
                size: 1.2,
              });
            }
          }
        }

        if (alpha <= 0.01) continue;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.fillRect(px[i], py[i], drawSize, drawSize);
      }

      for (let s = sparks.length - 1; s >= 0; s--) {
        const sp = sparks[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.alpha *= 0.91;
        if (sp.alpha < 0.03) {
          sparks.splice(s, 1);
          continue;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${sp.alpha.toFixed(3)})`;
        ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [
    active,
    bgColor,
    condensed,
    density,
    durationSec,
    glowIntensity,
    introText,
    onComplete,
    onStartReveal,
    particleSpeed,
    settings?.enabled,
    shouldReduceMotion,
    textSize,
  ]);

  if (!active || shouldReduceMotion || settings?.enabled === false) return null;

  return (
    <div
      ref={wrapRef}
      aria-label={`Cinematic particle intro for ${introText}`}
      style={{ backgroundColor: bgColor }}
      className="fixed inset-0 z-[100] select-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button
        type="button"
        onClick={() => skipTriggerRef.current()}
        className="fixed bottom-6 right-6 z-[101] px-4 py-2 rounded-full border border-white/20 bg-black/60 backdrop-blur-md text-[11px] font-mono tracking-[0.16em] text-zinc-300 hover:text-black hover:bg-white hover:border-white transition-colors"
      >
        SKIP INTRO
      </button>
    </div>
  );
};
