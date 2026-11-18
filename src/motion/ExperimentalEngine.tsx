import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import { EASE_CINEMATIC, SPRING_CURSOR } from './motionSystem';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useIsBookSnapshot } from './BookSnapshotContext';

/**
 * Global Context Signals for Silence Moment & Anti-Gravity Zone
 */
export interface HandoffParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export const experimentalBus = {
  antiGravity: false,
  silenceFactor: 1, // 1 = normal, 0.08 = silence moment
  activeSection: 'home',
  introBurstAt: 0,
  handoffParticles: [] as HandoffParticle[],
  transitionAt: 0,
  transitionTarget: '',
  transitionDir: 1 as 1 | -1,
  transitionDurationMs: 1100,
  hoveredCardRect: null as { left: number; top: number; width: number; height: number } | null,
  triggerNavTransition(targetId: string, direction: 1 | -1 = 1, durationMs = 1100) {
    this.transitionTarget = targetId;
    this.transitionDir = direction;
    this.transitionDurationMs = durationMs;
    this.transitionAt = performance.now();
  },
};

/**
 * 1. Full-Screen Interactive Particle Network + Virtual Light Source + Digital Fabric Grid
 *    + Invisible 3D Objects + Gravity Field (persists seamlessly across all sections & devices)
 */
export const ExperimentalAtmosphereCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { cms } = useSiteConfig();
  const anim = cms.animations;
  const part = cms.particles;

  const liveSettingsRef = useRef({ anim, part });
  useEffect(() => {
    liveSettingsRef.current = { anim, part };
  }, [anim, part]);

  const canvasActive =
    !shouldReduceMotion && anim.masterEnabled && anim.particleBackground;

  useEffect(() => {
    if (!canvasActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const isLowPower = width < 768 || cores <= 2;
    const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1.25 : 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const pointer = {
      x: width * 0.5,
      y: height * 0.4,
      targetX: width * 0.5,
      targetY: height * 0.4,
      active: false,
      lastTapAt: 0,
    };

    interface RippleWave {
      x: number;
      y: number;
      r: number;
      maxR: number;
      alpha: number;
    }
    const rippleWaves: RippleWave[] = [];

    let lastScrollY = window.scrollY;
    let scrollVel = 0;

    const createParticle = (i: number) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      radius: Math.random() * 0.9 + 0.55,
      alpha: Math.random() * 0.38 + 0.16,
      phase: (i * 0.618) % (Math.PI * 2),
      orbitDir: i % 2 === 0 ? 1 : -1,
      depth: 0.55 + Math.random() * 0.75,
    });

    const targetCount = isLowPower
      ? Math.max(28, Math.min(110, Math.round(part.count * 0.5)))
      : Math.max(24, Math.min(340, Math.round(part.count)));
    const particleCount = targetCount;
    const particles = Array.from({ length: particleCount }, (_, i) => createParticle(i));

    const spawnRipple = (x: number, y: number, strength = 1) => {
      if (liveSettingsRef.current.anim.particleWaves === false) return;
      rippleWaves.push({
        x,
        y,
        r: 8,
        maxR: 165 * strength,
        alpha: 0.42,
      });
      if (rippleWaves.length > 6) rippleWaves.shift();
      for (const p of particles) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy);
        if (d < 170 * strength && d > 1) {
          const f = (1 - d / (170 * strength)) * 2.1 * strength;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const { anim: curAnim } = liveSettingsRef.current;
      if (e.pointerType !== 'mouse' && curAnim.touchInteraction === false) return;
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      const { anim: curAnim } = liveSettingsRef.current;
      if (e.pointerType !== 'mouse' && curAnim.touchInteraction === false) return;
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
      pointer.lastTapAt = performance.now();
      spawnRipple(e.clientX, e.clientY, isLowPower ? 0.8 : 1);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (liveSettingsRef.current.anim.touchInteraction === false) return;
      const t = e.touches[0];
      if (!t) return;
      pointer.targetX = t.clientX;
      pointer.targetY = t.clientY;
      pointer.active = true;
      pointer.lastTapAt = performance.now();
      spawnRipple(t.clientX, t.clientY, 0.9);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (liveSettingsRef.current.anim.touchInteraction === false) return;
      const t = e.touches[0];
      if (!t) return;
      pointer.targetX = t.clientX;
      pointer.targetY = t.clientY;
      pointer.active = true;
      pointer.lastTapAt = performance.now();
    };
    const onScroll = () => {
      const nextY = window.scrollY;
      scrollVel = Math.max(-48, Math.min(48, nextY - lastScrollY));
      lastScrollY = nextY;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const invisibleObjects = [
      { x: width * 0.24, y: height * 0.34, vx: 0.2, vy: 0.13, r: 90 },
      { x: width * 0.74, y: height * 0.62, vx: -0.17, vy: 0.15, r: 105 },
    ];

    const teleporter = {
      x: width * 0.82,
      y: height * 0.24,
      state: 'visible' as 'visible' | 'dissolving' | 'reconstructing',
      timer: 0,
      progress: 1,
    };

    interface GravityNode {
      cx: number;
      cy: number;
      r: number;
      type: 'well' | 'avoid' | 'gather';
    }
    let gravityNodes: GravityNode[] = [];
    let frameCount = 0;
    let lastBurstHandled = 0;
    let lastTransitionHandled = 0;

    const refreshGravityNodes = () => {
      const els = document.querySelectorAll<HTMLElement>('[data-gravity]');
      const nodes: GravityNode[] = [];
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -60 || rect.top > height + 60) return;
        const type = el.getAttribute('data-gravity') as 'well' | 'avoid' | 'gather';
        nodes.push({
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          r: Math.max(rect.width, rect.height) * 0.55,
          type,
        });
      });
      gravityNodes = nodes;
    };

    let time = 0;

    const render = () => {
      if (document.hidden) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const { anim: curAnim, part: curPart } = liveSettingsRef.current;
      const speedMult = curPart.speed * curAnim.animationSpeed;
      frameCount++;
      time += 0.015 * experimentalBus.silenceFactor * speedMult;
      scrollVel *= 0.88;

      if (!isFinePointer && pointer.active && performance.now() - pointer.lastTapAt > 2400) {
        pointer.active = false;
      }

      // Seamless handoff from Intro -> Background Particle Universe
      if (experimentalBus.introBurstAt > lastBurstHandled) {
        lastBurstHandled = experimentalBus.introBurstAt;
        const handoff = experimentalBus.handoffParticles;
        const cx = width * 0.5;
        const cy = height * 0.5;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (handoff.length > 0) {
            const src = handoff[i % handoff.length];
            p.x = src.x + (Math.random() - 0.5) * 6;
            p.y = src.y + (Math.random() - 0.5) * 6;
            p.vx = src.vx * 0.85;
            p.vy = src.vy * 0.85;
          } else {
            const ang = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 0.5;
            p.vx += Math.cos(ang) * 2.4;
            p.vy += Math.sin(ang) * 2.4;
          }
        }
        experimentalBus.handoffParticles = [];
      }

      // Book page-turn particle air draft & gentle scatter reaction
      let turnEnvelope = 0;
      const turnDir = experimentalBus.transitionDir;
      if (experimentalBus.transitionAt > 0) {
        const turnAge = performance.now() - experimentalBus.transitionAt;
        const turnDur = Math.max(400, experimentalBus.transitionDurationMs || 1100);
        if (turnAge >= 0 && turnAge < turnDur && curAnim.sectionTransitions !== false) {
          turnEnvelope = Math.sin((turnAge / turnDur) * Math.PI);
        }
      }
      if (experimentalBus.transitionAt > lastTransitionHandled) {
        lastTransitionHandled = experimentalBus.transitionAt;
        if (curAnim.sectionTransitions !== false) {
          spawnRipple(turnDir > 0 ? width * 0.72 : width * 0.28, height * 0.48, 1.15);
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (i % 4 === 0) {
              p.vx += -turnDir * (1.2 + p.depth * 0.9);
              p.vy += Math.sin(p.phase * 2.1) * 0.65;
            }
          }
        }
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.14;
      pointer.y += (pointer.targetY - pointer.y) * 0.14;
      document.documentElement.style.setProperty('--light-x', `${pointer.x.toFixed(1)}px`);
      document.documentElement.style.setProperty('--light-y', `${pointer.y.toFixed(1)}px`);
      document.documentElement.style.setProperty(
        '--light-nx',
        `${((pointer.x / Math.max(width, 1)) - 0.5).toFixed(3)}`
      );
      document.documentElement.style.setProperty(
        '--light-ny',
        `${((pointer.y / Math.max(height, 1)) - 0.5).toFixed(3)}`
      );

      if (!isLowPower && frameCount % 14 === 1) {
        refreshGravityNodes();
      }

      const trailsAllowed = curAnim.particleTrails !== false;
      if (trailsAllowed && curPart.trail > 0.04) {
        ctx.fillStyle = `rgba(5, 5, 5, ${Math.max(0.18, 1 - curPart.trail).toFixed(2)})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      const isContactSection = experimentalBus.activeSection === 'contact';
      const sectionGlowBoost = (isContactSection ? 1.28 : 1) * (0.55 + curAnim.glowStrength * 0.45);
      const scrollMult = curAnim.scrollDistortion ? curAnim.scrollStrength : 0.25;
      const wavesEnabled = curAnim.particleWaves !== false;
      const connectionsEnabled = curAnim.particleConnections !== false;

      // A. Digital Fabric Grid
      const gridSpacing = width < 768 ? 78 : 68;
      const cols = Math.ceil(width / gridSpacing) + 1;
      const rows = Math.ceil(height / gridSpacing) + 1;
      const scrollWaveAmp = wavesEnabled ? Math.min(Math.abs(scrollVel) * 0.55 * scrollMult, 16) : 0;
      const fabricFade = Math.max(0, 1 - window.scrollY / (height * 1.6));

      if (!isLowPower && fabricFade > 0.03) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.034 * fabricFade).toFixed(4)})`;
        ctx.lineWidth = 0.8;

        const deform = (gx: number, gy: number) => {
          let dx = 0;
          let dy = wavesEnabled ? Math.sin(gx * 0.012 + time * 1.4) * scrollWaveAmp : 0;
          if (pointer.active) {
            const distX = gx - pointer.x;
            const distY = gy - pointer.y;
            const d = Math.hypot(distX, distY);
            if (d < 210 && d > 1) {
              const pull = (1 - d / 210) * 16 * curAnim.cursorStrength;
              dx -= (distX / d) * pull;
              dy -= (distY / d) * pull;
            }
          }
          return [gx + dx, gy + dy] as const;
        };

        for (let r = 0; r < rows; r++) {
          ctx.beginPath();
          for (let c = 0; c < cols; c++) {
            const [gx, gy] = deform(c * gridSpacing, r * gridSpacing);
            if (c === 0) ctx.moveTo(gx, gy);
            else ctx.lineTo(gx, gy);
          }
          ctx.stroke();
        }
        for (let c = 0; c < cols; c++) {
          ctx.beginPath();
          for (let r = 0; r < rows; r++) {
            const [gx, gy] = deform(c * gridSpacing, r * gridSpacing);
            if (r === 0) ctx.moveTo(gx, gy);
            else ctx.lineTo(gx, gy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // B. Ripple Waves from click / tap / transition
      if (wavesEnabled && rippleWaves.length > 0) {
        for (let i = rippleWaves.length - 1; i >= 0; i--) {
          const rw = rippleWaves[i];
          rw.r += (rw.maxR - rw.r) * 0.1 + 1.8;
          rw.alpha *= 0.92;
          if (rw.alpha < 0.02 || rw.r >= rw.maxR) {
            rippleWaves.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(rw.x, rw.y, rw.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${rw.alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // C. Invisible 3D Objects illuminated by pointer
      for (const obj of invisibleObjects) {
        obj.x += obj.vx * experimentalBus.silenceFactor;
        obj.y += obj.vy * experimentalBus.silenceFactor;
        if (obj.x < 80 || obj.x > width - 80) obj.vx *= -1;
        if (obj.y < 80 || obj.y > height - 80) obj.vy *= -1;

        if (!isLowPower && pointer.active) {
          const d = Math.hypot(pointer.x - obj.x, pointer.y - obj.y);
          if (d < obj.r * 2.1) {
            const intensity = 1 - d / (obj.r * 2.1);
            ctx.beginPath();
            ctx.ellipse(
              obj.x,
              obj.y,
              obj.r * (0.85 + intensity * 0.2),
              obj.r * (0.85 - intensity * 0.12),
              time * 0.5,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `rgba(255, 255, 255, ${(intensity * 0.18).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // D. Simulate Particle Network
      const sf = experimentalBus.silenceFactor;
      const antiGrav = experimentalBus.antiGravity;
      const mousePhysicsOn = curAnim.mouseParticles;
      const cursorForce = Math.max(0.1, curAnim.cursorStrength || 1);
      const hoveredCard = experimentalBus.hoveredCardRect;
      const waveFactor = wavesEnabled ? curPart.waveStrength : 0;

      // Continuous Home -> About scroll transition envelope (peaks mid-seam, settles cleanly)
      const seamStart = height * 0.18;
      const seamSpan = Math.max(height * 0.95, 1);
      const rawSeam = Math.max(0, Math.min(1, (window.scrollY - seamStart) / seamSpan));
      const homeAboutSeam = curAnim.sectionTransitions !== false ? Math.sin(rawSeam * Math.PI) : 0;

      for (const p of particles) {
        const depthScale = 0.35 + p.depth * curPart.depth;
        p.y -= scrollVel * (0.14 + homeAboutSeam * 0.08) * depthScale * scrollMult;
        p.vy += curPart.gravity * 0.012 * sf;
        if (antiGrav) {
          p.vy -= 0.01 * sf;
          if (p.vy < -0.85) p.vy = -0.85;
        } else {
          p.vy *= 0.992;
        }

        if (homeAboutSeam > 0.02) {
          p.vx += homeAboutSeam * 0.012 * p.depth * sf;
          p.vy -= homeAboutSeam * 0.016 * depthScale * sf;
        }

        if (turnEnvelope > 0.01) {
          p.vx += -turnDir * turnEnvelope * (0.045 + p.depth * 0.035);
          p.vy += Math.sin(time * 2.2 + p.phase) * turnEnvelope * 0.025;
        }

        // Contact section subtle gathering gravity toward center destination
        if (isContactSection && !pointer.active) {
          const gdx = width * 0.5 - p.x;
          const gdy = height * 0.52 - p.y;
          const gd = Math.max(80, Math.hypot(gdx, gdy));
          p.vx += ((gdx / gd) * 0.008 + (-gdy / gd) * 0.006 * p.orbitDir) * sf;
          p.vy += ((gdy / gd) * 0.008 + (gdx / gd) * 0.006 * p.orbitDir) * sf;
        }

        if (!isLowPower) {
          for (const node of gravityNodes) {
            const dx = node.cx - p.x;
            const dy = node.cy - p.y;
            const d = Math.hypot(dx, dy);
            if (d < node.r + 85 && d > 8) {
              if (node.type === 'well') {
                const tx = (-dy / d) * p.orbitDir;
                const ty = (dx / d) * p.orbitDir;
                p.vx += (tx * 0.028 + (dx / d) * 0.007) * sf;
                p.vy += (ty * 0.028 + (dy / d) * 0.007) * sf;
              } else if (node.type === 'avoid') {
                p.vx -= (dx / d) * 0.04 * sf;
                p.vy -= (dy / d) * 0.04 * sf;
              } else if (node.type === 'gather') {
                p.vx += (dx / d) * 0.012 * sf;
                p.vy += (dy / d) * 0.012 * sf;
              }
            }
          }

          // Orbit gently around hovered project/skill card perimeter
          if (hoveredCard) {
            const cx = hoveredCard.left + hoveredCard.width * 0.5;
            const cy = hoveredCard.top + hoveredCard.height * 0.5;
            const dx = cx - p.x;
            const dy = cy - p.y;
            const d = Math.hypot(dx, dy);
            const targetR = Math.max(hoveredCard.width, hoveredCard.height) * 0.56;
            if (d < targetR + 120 && d > 20) {
              const radialError = (d - targetR) * 0.0008;
              const tx = (-dy / d) * p.orbitDir;
              const ty = (dx / d) * p.orbitDir;
              p.vx += (tx * 0.036 + (dx / d) * radialError) * sf;
              p.vy += (ty * 0.036 + (dy / d) * radialError) * sf;
            }
          }
        }

        if (pointer.active && mousePhysicsOn) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 185 && d > 14) {
            const tx = -dy / d;
            const ty = dx / d;
            const attractForce = (dx / d) * 0.018 * curPart.mouseAttraction * cursorForce;
            const repelForce =
              d < 64 ? -(dx / d) * 0.036 * curPart.mouseRepulsion * cursorForce : 0;
            const repelForceY =
              d < 64 ? -(dy / d) * 0.036 * curPart.mouseRepulsion * cursorForce : 0;
            p.vx += (tx * 0.028 * curPart.mouseAttraction * cursorForce + attractForce + repelForce) * sf;
            p.vy +=
              (ty * 0.028 * curPart.mouseAttraction * cursorForce +
                (dy / d) * 0.018 * curPart.mouseAttraction * cursorForce +
                repelForceY) *
              sf;
          }
        }

        p.vx *= 0.975;
        p.vy *= 0.975;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 2.6) {
          p.vx = (p.vx / speed) * 2.6;
          p.vy = (p.vy / speed) * 2.6;
        }

        p.x += (p.vx * speedMult + Math.cos(time + p.phase) * 0.16 * waveFactor * depthScale) * sf;
        p.y +=
          (p.vy * speedMult +
            (antiGrav ? -0.34 : Math.sin(time + p.phase) * 0.14 * waveFactor * depthScale)) *
          sf;

        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;
        if (p.y < -12) p.y = height + 12;
        if (p.y > height + 12) p.y = -12;

        let cursorGlow = 0;
        if (!isLowPower && pointer.active && mousePhysicsOn) {
          const distCursor = Math.hypot(pointer.x - p.x, pointer.y - p.y);
          if (distCursor < 155) {
            cursorGlow = (1 - distCursor / 155) * 0.42 * curPart.glow;
            if (connectionsEnabled && distCursor < curPart.connectionDistance + 14) {
              ctx.beginPath();
              ctx.moveTo(pointer.x, pointer.y);
              ctx.lineTo(p.x, p.y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - distCursor / Math.max(curPart.connectionDistance + 14, 1)) * 0.18).toFixed(3)})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }

        const twinkle = 0.65 + 0.35 * Math.sin(time * 1.8 + p.phase);
        const finalAlpha = Math.min(
          0.98,
          (p.alpha * twinkle * (curPart.opacity / 0.45) + cursorGlow) * sectionGlowBoost
        );
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.45, p.radius * (curPart.size / 1.5)) + cursorGlow * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha.toFixed(3)})`;
        ctx.fill();
      }

      // E. Dynamic Particle Network Connection Lines (stretching subtly on page turns & scroll seam)
      const baseConnectMax = isLowPower
        ? Math.min(92, curPart.connectionDistance * 0.78)
        : curPart.connectionDistance;
      const connectMaxDist = baseConnectMax * (1 + turnEnvelope * 0.28 + homeAboutSeam * 0.14);
      const connectMaxDistSq = connectMaxDist * connectMaxDist;
      const lineBaseOpacity = isLowPower
        ? curPart.connectionOpacity * 0.75
        : curPart.connectionOpacity * (isContactSection ? 1.28 : 1 + homeAboutSeam * 0.18);
      ctx.lineWidth = 0.65;

      if (connectionsEnabled && connectMaxDist > 8 && lineBaseOpacity > 0.005) {
        for (let i = 0; i < particleCount; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particleCount; j++) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < connectMaxDistSq) {
              const d = Math.sqrt(dSq);
              const alpha = (1 - d / connectMaxDist) * lineBaseOpacity;
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      // F. Object Teleportation Accent
      teleporter.timer += 1;
      if (teleporter.state === 'visible' && teleporter.timer > 360) {
        teleporter.state = 'dissolving';
        teleporter.timer = 0;
      } else if (teleporter.state === 'dissolving') {
        teleporter.progress = Math.max(0, 1 - teleporter.timer / 40);
        if (teleporter.timer >= 40) {
          teleporter.x = width * (0.14 + Math.random() * 0.72);
          teleporter.y = height * (0.18 + Math.random() * 0.64);
          teleporter.state = 'reconstructing';
          teleporter.timer = 0;
        }
      } else if (teleporter.state === 'reconstructing') {
        teleporter.progress = Math.min(1, teleporter.timer / 45);
        if (teleporter.timer >= 45) {
          teleporter.state = 'visible';
          teleporter.timer = 0;
          teleporter.progress = 1;
        }
      }

      const tpAlpha = teleporter.progress * 0.22;
      if (!isLowPower && tpAlpha > 0.01) {
        ctx.save();
        ctx.translate(teleporter.x, teleporter.y);
        ctx.rotate(time * 0.4);
        const s = 10 + (1 - teleporter.progress) * 14;
        ctx.strokeStyle = `rgba(255, 255, 255, ${tpAlpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }

      // G. Silence Moment Center Focus Point
      if (experimentalBus.silenceFactor < 0.3) {
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, [canvasActive, part.count]);

  if (!canvasActive) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[2] w-full h-full"
    />
  );
};

/**
 * 1B. Monochrome Particle Section Transition Curtain
 *     Plays a fluid non-blocking particle stream + veil flash when clicking Navbar items.
 */
export const ParticleTransitionCurtain: React.FC<{ transitionKey: number; label: string }> = ({
  transitionKey,
  label,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { cms } = useSiteConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      transitionKey === 0 ||
      shouldReduceMotion ||
      !cms.animations.masterEnabled ||
      cms.animations.sectionTransitions === false
    ) {
      return;
    }

    setVisible(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      const fallback = setTimeout(() => setVisible(false), 380);
      return () => clearTimeout(fallback);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pts = Array.from({ length: 140 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 4,
      vy: -(6 + Math.random() * 14),
      size: 1 + Math.random() * 1.8,
      alpha: 0.4 + Math.random() * 0.55,
    }));

    const duration = Math.max(260, 480 / Math.max(0.5, cms.animations.transitionSpeed || 1));
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const envelope = Math.sin(p * Math.PI);
      ctx.clearRect(0, 0, w, h);

      // Soft dark atmospheric veil
      ctx.fillStyle = `rgba(5, 5, 7, ${(envelope * 0.36).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);

      // Sweeping monochrome horizon beam
      const sweepY = h * (1 - p);
      const beam = ctx.createLinearGradient(0, sweepY - 60, 0, sweepY + 60);
      beam.addColorStop(0, 'rgba(255,255,255,0)');
      beam.addColorStop(0.5, `rgba(255,255,255,${(envelope * 0.14).toFixed(3)})`);
      beam.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(0, sweepY - 60, w, 120);

      for (const pt of pts) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.y < -10) pt.y = h + 10;
        ctx.fillStyle = `rgba(255,255,255,${(pt.alpha * envelope).toFixed(3)})`;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size + 4 * envelope);
      }

      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setVisible(false);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    cms.animations.masterEnabled,
    cms.animations.sectionTransitions,
    cms.animations.transitionSpeed,
    shouldReduceMotion,
    transitionKey,
  ]);

  if (!visible || shouldReduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-end p-6 sm:p-10"
    >
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />
      {label && (
        <span className="relative z-10 font-mono text-[11px] tracking-[0.24em] text-white/75 uppercase">
          → {label}
        </span>
      )}
    </div>
  );
};

/**
 * 2. Cursor Portal + Mirror Cursor + Time-Lag Objects + Text/Gravity/Preview Hover Morph
 */
export const ExperimentalCursorPortal: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { cms } = useSiteConfig();
  const cursorEnabled = cms.animations.masterEnabled && cms.animations.magneticCursor;
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<
    'default' | 'pointer' | 'text' | 'view' | 'blackhole' | 'gravity'
  >('default');
  const [label, setLabel] = useState('');
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const rawX = useMotionValue(-120);
  const rawY = useMotionValue(-120);

  const dotX = useSpring(rawX, { stiffness: 950, damping: 48 });
  const dotY = useSpring(rawY, { stiffness: 950, damping: 48 });

  const lagGlowX = useSpring(rawX, { stiffness: 360, damping: 30 });
  const lagGlowY = useSpring(rawY, { stiffness: 360, damping: 30 });

  const portalX = useSpring(rawX, SPRING_CURSOR);
  const portalY = useSpring(rawY, SPRING_CURSOR);

  const trailRingX = useSpring(rawX, { stiffness: 120, damping: 24 });
  const trailRingY = useSpring(rawY, { stiffness: 120, damping: 24 });

  const haloX = useSpring(rawX, { stiffness: 55, damping: 20 });
  const haloY = useSpring(rawY, { stiffness: 55, damping: 20 });

  const mirrorX = useTransform(trailRingX, (v) =>
    typeof window !== 'undefined' ? window.innerWidth - v : v
  );
  const mirrorY = useTransform(trailRingY, (v) => v + 22);

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const customEl = target.closest('[data-cursor]') as HTMLElement | null;
      const interactive = target.closest('a, button, input, select, textarea, [role="button"]');
      const textEl = target.closest('h1, h2, h3, p');

      if (customEl) {
        const type = customEl.getAttribute('data-cursor') || 'view';
        if (type === 'blackhole') {
          setMode('blackhole');
          setLabel('');
        } else if (type === 'gravity') {
          setMode('gravity');
          setLabel('');
        } else {
          setMode('view');
          setLabel(type.toUpperCase());
        }
      } else if (interactive) {
        setMode('pointer');
        setLabel('');
      } else if (textEl) {
        setMode('text');
        setLabel('');
      } else {
        setMode('default');
        setLabel('');
      }
    };

    const onDown = (e: PointerEvent) => {
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 680);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [rawX, rawY, shouldReduceMotion]);

  if (!enabled || shouldReduceMotion || !cursorEnabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95] overflow-hidden">
      {/* Click Ripple Waves */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ opacity: 0.65, scale: 0.25 }}
          animate={{ opacity: 0, scale: 3.1 }}
          transition={{ duration: 0.62, ease: EASE_CINEMATIC }}
          style={{ left: r.x - 20, top: r.y - 20 }}
          className="fixed w-10 h-10 rounded-full border border-white/55"
        />
      ))}

      {/* 0.6s Slow Ambient Halo */}
      <motion.div
        style={{ x: haloX, y: haloY }}
        className="fixed top-0 left-0 -ml-28 -mt-28 w-56 h-56 rounded-full bg-white/[0.025] blur-2xl"
      />

      {/* Mirror Cursor (Faint Inverted Reflection) */}
      <motion.div
        style={{ x: mirrorX, y: mirrorY }}
        className="fixed top-0 left-0 -ml-3 -mt-3 w-6 h-6 rounded-full border border-white/15 opacity-55"
      />

      {/* 0.3s Lagged Outer Ring */}
      <motion.div
        style={{ x: trailRingX, y: trailRingY }}
        className="fixed top-0 left-0 -ml-6 -mt-6 w-12 h-12 rounded-full border border-white/[0.12]"
      />

      {/* 0.15s Portal Aperture + Orbiting White Micro-Particles */}
      <motion.div
        style={{ x: portalX, y: portalY }}
        animate={{
          width:
            mode === 'view'
              ? 74
              : mode === 'gravity'
                ? 62
                : mode === 'blackhole'
                  ? 56
                  : mode === 'text'
                    ? 50
                    : mode === 'pointer'
                      ? 44
                      : 34,
          height:
            mode === 'view'
              ? 74
              : mode === 'gravity'
                ? 62
                : mode === 'blackhole'
                  ? 56
                  : mode === 'text'
                    ? 50
                    : mode === 'pointer'
                      ? 44
                      : 34,
          marginLeft:
            mode === 'view'
              ? -37
              : mode === 'gravity'
                ? -31
                : mode === 'blackhole'
                  ? -28
                  : mode === 'text'
                    ? -25
                    : mode === 'pointer'
                      ? -22
                      : -17,
          marginTop:
            mode === 'view'
              ? -37
              : mode === 'gravity'
                ? -31
                : mode === 'blackhole'
                  ? -28
                  : mode === 'text'
                    ? -25
                    : mode === 'pointer'
                      ? -22
                      : -17,
          backgroundColor:
            mode === 'view'
              ? 'rgba(255,255,255,0.94)'
              : mode === 'blackhole'
                ? 'rgba(5,5,5,0.55)'
                : mode === 'gravity'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.03)',
          borderColor:
            mode === 'pointer' || mode === 'blackhole' || mode === 'gravity'
              ? 'rgba(255,255,255,0.85)'
              : mode === 'text'
                ? 'rgba(255,255,255,0.48)'
                : 'rgba(255,255,255,0.34)',
        }}
        transition={{ duration: 0.2, ease: EASE_CINEMATIC }}
        className="fixed top-0 left-0 rounded-full border backdrop-blur-[2px] flex items-center justify-center"
      >
        {/* Orbiting tiny white satellite particles around portal */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: mode === 'gravity' ? 2.2 : 3.6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <span className="absolute -top-0.5 left-1/2 w-1 h-1 rounded-full bg-white/85" />
          <span className="absolute -bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-white/45" />
        </motion.span>

        {mode === 'gravity' && (
          <span className="pointer-events-none relative w-3.5 h-3.5 flex items-center justify-center">
            <span className="absolute w-full h-px bg-white/75" />
            <span className="absolute h-full w-px bg-white/75" />
          </span>
        )}

        {mode === 'view' && label && (
          <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-black">
            {label}
          </span>
        )}
      </motion.div>

      {/* 0.05s Glow Satellite */}
      <motion.div
        style={{ x: lagGlowX, y: lagGlowY }}
        className="fixed top-0 left-0 -ml-2 -mt-2 w-4 h-4 rounded-full bg-white/15 blur-[3px]"
      />

      {/* Precision Center Dot */}
      <motion.div
        style={{ x: dotX, y: dotY }}
        animate={{
          scale: mode === 'view' || mode === 'gravity' ? 0 : mode === 'pointer' ? 0.55 : 1,
          opacity: mode === 'view' || mode === 'gravity' ? 0 : 1,
        }}
        transition={{ duration: 0.14 }}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-white mix-blend-difference"
      />
    </div>
  );
};

/**
 * 3. Reality Distortion + Dimension Shift Section Wrapper
 *    Bends typography/geometry lightly with scroll velocity & shifts depth between dimensions.
 */
export const RealityDimensionSection: React.FC<{
  children: React.ReactNode;
  id: string;
  className?: string;
  antiGravity?: boolean;
  portalEntrance?: boolean;
  silenceOnFirstEnter?: boolean;
  preserveSticky?: boolean;
}> = ({
  children,
  id,
  className = '',
  antiGravity = false,
  portalEntrance = false,
  silenceOnFirstEnter = false,
  preserveSticky = false,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const { cms } = useSiteConfig();
  const silenceTriggered = useRef(false);
  const distortionEnabled =
    !isBookSnapshot && !shouldReduceMotion && cms.animations.masterEnabled && cms.animations.scrollDistortion;
  const maxSkew = 1.35 * cms.animations.scrollStrength;

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { stiffness: 160, damping: 28 });

  const skewY = useTransform(smoothVelocity, [-2400, 0, 2400], [-maxSkew, 0, maxSkew]);
  const velocityScaleY = useTransform(smoothVelocity, [-2400, 0, 2400], [1.015, 1, 1.015]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Dimension shift: incoming scale/opacity/depth & outgoing recede
  const dimensionScale = useTransform(scrollYProgress, [0, 0.14, 0.86, 1], [0.97, 1, 1, 0.975]);
  const dimensionOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.88, 1, 1, 0.9]);
  const portalClip = useTransform(
    scrollYProgress,
    [0, 0.16],
    ['circle(34% at 50% 45%)', 'circle(140% at 50% 50%)']
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || shouldReduceMotion || isBookSnapshot) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting;
        if (antiGravity) {
          experimentalBus.antiGravity = Boolean(isVisible);
        }
        if (silenceOnFirstEnter && isVisible && !silenceTriggered.current) {
          silenceTriggered.current = true;
          experimentalBus.silenceFactor = 0.08;
          setTimeout(() => {
            experimentalBus.silenceFactor = 1;
          }, 1450);
        }
      },
      { threshold: 0.28 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (antiGravity) experimentalBus.antiGravity = false;
    };
  }, [antiGravity, isBookSnapshot, shouldReduceMotion, silenceOnFirstEnter]);

  return (
    <motion.section
      ref={ref}
      id={isBookSnapshot ? undefined : id}
      style={
        !distortionEnabled
          ? undefined
          : preserveSticky
            ? {
                opacity: dimensionOpacity,
              }
            : {
                skewY,
                scaleY: velocityScaleY,
                scale: dimensionScale,
                opacity: dimensionOpacity,
                clipPath: portalEntrance ? portalClip : undefined,
              }
      }
      className={`relative ${preserveSticky || isBookSnapshot ? '' : 'will-change-transform'} ${className}`}
    >
      {children}
    </motion.section>
  );
};

/**
 * 4. Text Melting + Magnetic Typography Heading
 *    Letters react magnetically at individual weights and subtly "melt" downward
 *    with luminous pixel drip filaments on hover, reconstructing seamlessly on leave.
 */
export const MeltingMagneticText: React.FC<{
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}> = ({ text, className = '', as = 'h1' }) => {
  const shouldReduceMotion = useReducedMotion();
  const { cms } = useSiteConfig();
  const [hovered, setHovered] = useState(false);
  const Tag = as;

  const words = text.split(' ');
  const textAnimOn =
    !shouldReduceMotion && cms.animations.masterEnabled && cms.animations.textAnimations;

  if (!textAnimOn) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag
      data-gravity="well"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-block cursor-default select-none ${className}`}
    >
      {words.map((word, wIdx) => (
        <span key={`${word}-${wIdx}`} className="inline-block whitespace-nowrap mr-[0.28em] last:mr-0">
          {word.split('').map((char, cIdx) => {
            const globalIdx = wIdx * 7 + cIdx;
            const dripHeight = 6 + ((globalIdx * 5) % 14);
            const delay = (globalIdx % 6) * 0.028;
            const meltDrop = 3 + ((globalIdx * 3) % 7);

            return (
              <motion.span
                key={`${char}-${cIdx}`}
                className="relative inline-block will-change-transform"
                initial={{ y: '60%', opacity: 0, filter: 'blur(6px)' }}
                animate={{
                  y: hovered ? meltDrop : 0,
                  opacity: 1,
                  filter: hovered ? 'blur(0.45px)' : 'blur(0px)',
                  scaleY: hovered ? 1.07 : 1,
                }}
                transition={{
                  duration: hovered ? 0.52 : 0.45,
                  delay: hovered ? delay : cIdx * 0.015,
                  ease: EASE_CINEMATIC,
                }}
              >
                {char}
                {/* Digital molten white pixel filament dripping cleanly below active letters */}
                <motion.span
                  aria-hidden="true"
                  animate={{
                    scaleY: hovered ? 1 : 0,
                    opacity: hovered ? 0.55 : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: delay * 1.4,
                    ease: EASE_CINEMATIC,
                  }}
                  style={{ height: dripHeight, transformOrigin: 'top center' }}
                  className="pointer-events-none absolute left-1/2 top-[88%] w-[1.5px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent"
                />
              </motion.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
};

/**
 * 5. Particle Text Reconstruction ("CREATIVE MIND" / "DIGITAL MAGIC")
 *    Hundreds of monochrome particles fly from scattered directions to assemble sharp typography
 *    when scrolled into view, and dissolve back into particles when scrolled away.
 */
export const ParticleTextReconstruction: React.FC<{
  phrases?: [string, string];
  className?: string;
}> = ({ phrases = ['CREATIVE MIND', 'DIGITAL MAGIC'], className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setPhraseIdx((p) => (p + 1) % phrases.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [phrases.length, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let isVisible = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.min(container.clientWidth || 720, 920);
    const height = 128;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Sample target pixel coordinates for the active phrase
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    oCtx.fillStyle = '#FFFFFF';
    const fontSize = width < 520 ? 34 : 56;
    oCtx.font = `700 ${fontSize}px "Outfit", sans-serif`;
    oCtx.textAlign = 'center';
    oCtx.textBaseline = 'middle';
    oCtx.fillText(phrases[phraseIdx], width / 2, height / 2);

    const imgData = oCtx.getImageData(0, 0, width, height).data;
    const step = width < 520 ? 4 : 5;
    const targets: { tx: number; ty: number }[] = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (imgData[(y * width + x) * 4 + 3] > 140) {
          targets.push({ tx: x, ty: y });
        }
      }
    }

    const particles = targets.map((t) => {
      const angle = Math.random() * Math.PI * 2;
      const spread = 140 + Math.random() * 240;
      return {
        tx: t.tx,
        ty: t.ty,
        sx: t.tx + Math.cos(angle) * spread,
        sy: t.ty + Math.sin(angle) * spread,
        x: t.tx + Math.cos(angle) * spread,
        y: t.ty + Math.sin(angle) * spread,
        size: Math.random() * 1.3 + 0.9,
      };
    });

    const pointer = { x: -999, y: -999 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = -999;
      pointer.y = -999;
    };
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = Boolean(entries[0]?.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(container);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const destX = isVisible ? p.tx : p.sx;
        const destY = isVisible ? p.ty : p.sy;

        let pushX = 0;
        let pushY = 0;
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 64 && dist > 1) {
          const f = (1 - dist / 64) * 26;
          pushX = (dx / dist) * f;
          pushY = (dy / dist) * f;
        }

        p.x += (destX + pushX - p.x) * (isVisible ? 0.11 : 0.055);
        p.y += (destY + pushY - p.y) * (isVisible ? 0.11 : 0.055);

        ctx.fillStyle = isVisible ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [phraseIdx, phrases, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <div className={`py-8 text-center font-display text-3xl font-bold tracking-[0.12em] text-white ${className}`}>
        {phrases[0]}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        aria-label={phrases[phraseIdx]}
        className="w-full max-w-[920px] h-[128px] cursor-crosshair"
      />
    </div>
  );
};

/**
 * 6. Living Border + Shadow That Has a Life + Impossible 3D Card
 *    - Independent leading shadow responding to cursor & virtual light source
 *    - Living traveling white photon edge border
 *    - Separate multi-layer 3D depth parallax
 */
export const ImpossibleLivingCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  cursorTag?: string;
  gravityMode?: 'well' | 'avoid' | 'gather';
  floatDelay?: number;
  antiGravityFloat?: boolean;
}> = ({
  children,
  className = '',
  onClick,
  cursorTag,
  gravityMode,
  floatDelay = 0,
  antiGravityFloat = false,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { cms } = useSiteConfig();
  const [hovered, setHovered] = useState(false);
  const hoverMotionOn =
    !shouldReduceMotion && cms.animations.masterEnabled && cms.animations.liquidHover;

  const rotateX = useSpring(0, { stiffness: 210, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 210, damping: 22 });

  // Shadow leads card slightly with higher stiffness & inverted angle
  const shadowX = useSpring(0, { stiffness: 360, damping: 24 });
  const shadowY = useSpring(18, { stiffness: 360, damping: 24 });
  const shadowScale = useSpring(0.95, { stiffness: 300, damping: 24 });

  const mouseX = useMotionValue(180);
  const mouseY = useMotionValue(140);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hoverMotionOn || e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    experimentalBus.hoveredCardRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    mouseX.set(px);
    mouseY.set(py);

    const nx = (px / rect.width - 0.5) * 2;
    const ny = (py / rect.height - 0.5) * 2;
    const intensity = Math.max(0.2, cms.animations.hoverIntensity || 1);
    rotateX.set(-ny * 6 * intensity);
    rotateY.set(nx * 6 * intensity);

    // Living shadow stretches opposite to virtual cursor light source
    shadowX.set(-nx * 24 * intensity);
    shadowY.set(16 - ny * 20 * intensity);
    shadowScale.set(1.04);
  };

  const handleLeave = () => {
    setHovered(false);
    experimentalBus.hoveredCardRect = null;
    rotateX.set(0);
    rotateY.set(0);
    shadowX.set(0);
    shadowY.set(18);
    shadowScale.set(0.95);
  };

  return (
    <motion.div
      animate={
        antiGravityFloat && hoverMotionOn
          ? { y: [0, -7 * cms.animations.hoverIntensity, 0] }
          : undefined
      }
      transition={
        antiGravityFloat
          ? { duration: 4.8 + floatDelay, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }
          : undefined
      }
      className="relative h-full"
    >
      {/* Independent Living Shadow */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          style={{ x: shadowX, y: shadowY, scale: shadowScale }}
          className="pointer-events-none absolute inset-3 rounded-2xl bg-white/[0.06] blur-2xl opacity-70"
        />
      )}

      <motion.div
        ref={ref}
        data-cursor={cursorTag}
        data-gravity={gravityMode}
        onClick={onClick}
        onPointerEnter={() => {
          setHovered(true);
          const el = ref.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            experimentalBus.hoveredCardRect = {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            };
          }
        }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={
          shouldReduceMotion
            ? undefined
            : {
                transformPerspective: 1100,
                rotateX,
                rotateY,
              }
        }
        className={`relative h-full overflow-hidden ${className}`}
      >
        {/* Living Border Energy Trace */}
        {!shouldReduceMotion && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full z-20"
            preserveAspectRatio="none"
          >
            <motion.rect
              x="0.5"
              y="0.5"
              width="99.5%"
              height="99.5%"
              rx="16"
              ry="16"
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={hovered ? 1.5 : 0.8}
              strokeDasharray="90 360"
              animate={{ strokeDashoffset: [0, -450] }}
              transition={{ duration: hovered ? 3.2 : 7.5, repeat: Infinity, ease: 'linear' }}
              style={{ opacity: hovered ? 0.9 : 0.28 }}
            />
          </svg>
        )}

        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * 7. Black Hole CTA Button
 *    Surrounding space curves inward on hover, text gravitates toward center,
 *    brief gravitational collapse on click -> elastic release.
 */
export const BlackHoleButton: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  className?: string;
}> = ({ children, onClick, href, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [collapsing, setCollapsing] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!shouldReduceMotion) {
      setCollapsing(true);
      setTimeout(() => setCollapsing(false), 260);
    }
    onClick?.(e);
  };

  const content = (
    <>
      {/* Orbiting Event Horizon Rings */}
      {!shouldReduceMotion && (
        <motion.span
          aria-hidden="true"
          animate={{
            scale: collapsing ? 0.65 : hovered ? 1.14 : 1,
            opacity: hovered ? 0.75 : 0,
            rotate: hovered ? 180 : 0,
          }}
          transition={{ duration: 0.45, ease: EASE_CINEMATIC }}
          className="pointer-events-none absolute -inset-2 rounded-full border border-dashed border-white/40"
        />
      )}
      <motion.span
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: collapsing ? 0.86 : hovered ? 0.97 : 1,
                letterSpacing: hovered ? '-0.015em' : '0em',
              }
        }
        transition={{ duration: 0.25, ease: EASE_CINEMATIC }}
        className="relative z-10 inline-flex items-center gap-2.5"
      >
        {children}
      </motion.span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        data-cursor="blackhole"
        data-gravity="avoid"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: collapsing ? 0.88 : hovered ? 1.03 : 1,
                borderRadius: hovered ? '9999px' : '9999px',
              }
        }
        transition={{ duration: 0.24, ease: EASE_CINEMATIC }}
        className={`relative inline-flex items-center justify-center ${className}`}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      data-cursor="blackhole"
      data-gravity="avoid"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      animate={
        shouldReduceMotion
          ? undefined
          : {
              scale: collapsing ? 0.88 : hovered ? 1.03 : 1,
            }
      }
      transition={{ duration: 0.24, ease: EASE_CINEMATIC }}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {content}
    </motion.button>
  );
};

/**
 * 8. Shape Morphing System + Impossible Loop Sculpture
 *    Continuous monochrome morphing (Circle -> Blob -> Ring -> Square -> Circle)
 *    paired with Particle -> Line -> Text -> Dissolve endless cycle.
 */
export const MorphingImpossibleLoop: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative w-full py-12 border-y border-white/[0.06] bg-[#060607] overflow-hidden"
    >
      <div className="mx-auto max-w-[1360px] px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Particle Text Reconstruction Showcase */}
        <div className="flex-1 w-full">
          <ParticleTextReconstruction phrases={['CREATIVE MIND', 'DIGITAL MAGIC']} />
        </div>

        {/* Continuous Shape Morphing + Impossible Loop Sculpture */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <motion.div
            aria-hidden="true"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    borderRadius: [
                      '50% 50% 50% 50%',
                      '62% 38% 46% 54% / 55% 44% 56% 45%',
                      '24% 24% 24% 24%',
                      '42% 58% 35% 65% / 48% 62% 38% 52%',
                      '50% 50% 50% 50%',
                    ],
                    rotate: [0, 90, 180, 270, 360],
                    scale: hovered ? 1.12 : [0.94, 1.04, 0.94],
                  }
            }
            transition={{
              duration: hovered ? 5 : 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-24 h-24 border border-white/40 bg-white/[0.02] flex items-center justify-center"
          >
            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: [0.4, 1, 0.4],
                      opacity: [0.25, 0.9, 0.25],
                    }
              }
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-white"
            />
          </motion.div>

          {/* Orbiting Loop Node */}
          {!shouldReduceMotion && (
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute inset-0"
            >
              <span className="absolute top-2 left-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 9. Final Magic Moment Overlay
 *    Triggered at the final Contact CTA: dims canvas, gathers energy to center point,
 *    expands glowing monochrome circle revealing "LET'S CREATE MAGIC.", then expands cleanly out.
 */
export const FinalMagicOverlay: React.FC<{
  active: boolean;
  onComplete: () => void;
}> = ({ active, onComplete }) => {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(onComplete, shouldReduceMotion ? 900 : 2500);
    return () => clearTimeout(timer);
  }, [active, onComplete, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          onClick={onComplete}
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center cursor-pointer overflow-hidden"
        >
          {/* Gathering white center point expanding into glowing portal */}
          <motion.div
            initial={{ scale: 0.04, opacity: 0.9 }}
            animate={{
              scale: [0.04, 1, 1.06, 6.5],
              opacity: [1, 1, 1, 0],
            }}
            transition={{
              duration: 2.3,
              times: [0, 0.35, 0.72, 1],
              ease: EASE_CINEMATIC,
            }}
            className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-white/70 bg-[#050505] shadow-[0_0_90px_rgba(255,255,255,0.28)] flex items-center justify-center p-8 text-center"
          >
            <motion.p
              initial={{ opacity: 0, filter: 'blur(8px)', letterSpacing: '0.3em' }}
              animate={{ opacity: [0, 1, 1, 0], filter: 'blur(0px)', letterSpacing: '0.16em' }}
              transition={{ duration: 2.1, times: [0, 0.3, 0.75, 1] }}
              className="font-display text-lg sm:text-2xl font-bold text-white"
            >
              LET&apos;S CREATE MAGIC.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
