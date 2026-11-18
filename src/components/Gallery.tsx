import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { GalleryItem } from '../types/cms';
import { ProjectArtwork } from './MonochromeVisuals';
import { HairlineDraw } from '../motion/MotionPrimitives';
import { useIsBookSnapshot } from '../motion/BookSnapshotContext';
import { experimentalBus, RealityDimensionSection } from '../motion/ExperimentalEngine';
import { ParticleSectionTitle } from '../motion/ParticleSectionHeader';
import { EASE_CINEMATIC, VIEWPORT_CONFIG } from '../motion/motionSystem';

interface RectBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

type DepthLayer = 'background' | 'middle' | 'foreground';

interface ExhibitionSlotConfig {
  spanClass: string;
  offsetClass: string;
  aspectClass: string;
  rotateDeg: number;
  layer: DepthLayer;
  depth: number; // 0.35 (background) -> 1.0 (foreground)
  scrollShift: number; // parallax travel px
  zClass: string;
}

const EXHIBITION_SLOTS: ExhibitionSlotConfig[] = [
  {
    spanClass: 'md:col-span-6 lg:col-span-5',
    offsetClass: 'md:mt-2',
    aspectClass: 'aspect-[4/3]',
    rotateDeg: -1.4,
    layer: 'foreground',
    depth: 1.0,
    scrollShift: 44,
    zClass: 'z-30',
  },
  {
    spanClass: 'md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-8',
    offsetClass: 'md:mt-16 lg:mt-24',
    aspectClass: 'aspect-[4/5]',
    rotateDeg: 1.35,
    layer: 'background',
    depth: 0.42,
    scrollShift: 14,
    zClass: 'z-10',
  },
  {
    spanClass: 'md:col-span-5 md:col-start-2 lg:col-span-4 lg:col-start-2',
    offsetClass: 'md:-mt-8 lg:-mt-14',
    aspectClass: 'aspect-square',
    rotateDeg: 0.9,
    layer: 'middle',
    depth: 0.68,
    scrollShift: 26,
    zClass: 'z-20',
  },
  {
    spanClass: 'md:col-span-6 md:col-start-6 lg:col-span-5 lg:col-start-7',
    offsetClass: 'md:mt-4 lg:mt-2',
    aspectClass: 'aspect-[16/10]',
    rotateDeg: -1.1,
    layer: 'foreground',
    depth: 0.96,
    scrollShift: 42,
    zClass: 'z-30',
  },
  {
    spanClass: 'md:col-span-5 lg:col-span-4 lg:col-start-1',
    offsetClass: 'md:mt-6 lg:mt-10',
    aspectClass: 'aspect-[3/4]',
    rotateDeg: 1.55,
    layer: 'middle',
    depth: 0.72,
    scrollShift: 28,
    zClass: 'z-20',
  },
  {
    spanClass: 'md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-6',
    offsetClass: 'md:mt-12 lg:-mt-10',
    aspectClass: 'aspect-[16/10]',
    rotateDeg: -0.85,
    layer: 'background',
    depth: 0.38,
    scrollShift: 12,
    zClass: 'z-10',
  },
];

function extractYearLabel(item: GalleryItem): string {
  const source = `${item.caption || ''} ${item.title || ''}`;
  const match = source.match(/\b(20\d{2})\b/);
  return match ? match[1] : '2025';
}

/**
 * Connected Particle Exhibition Canvas
 * Connects Gallery to the global monochrome universe:
 * - Incoming stream coalescing into artwork fragments when entering Gallery
 * - Curved particle filaments arcing between hovered artworks
 * - Subtle dissolution drift streaming down toward Contact when exiting Gallery
 */
const GalleryExhibitionCanvas: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  flowSignalRef: React.MutableRefObject<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    seq: number;
    leaveFactor: number;
    enteredAt: number;
  }>;
}> = ({ containerRef, flowSignalRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;
  const { cms } = useSiteConfig();

  useEffect(() => {
    if (shouldReduceMotion || !cms.animations.masterEnabled) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = container.clientWidth || 1000;
    let height = container.clientHeight || 800;
    const isLowPower = window.innerWidth < 768 || (navigator.hardwareConcurrency || 4) <= 2;
    const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1.2 : 1.6);

    const resize = () => {
      width = container.clientWidth || 1000;
      height = container.clientHeight || 800;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const AMBIENT = isLowPower ? 65 : 135;
    const pts = Array.from({ length: AMBIENT }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 0.8 + Math.random() * 1.15,
      alpha: 0.22 + Math.random() * 0.45,
      phase: i * 0.71,
    }));

    interface FlowSpark {
      x: number;
      y: number;
      tx: number;
      ty: number;
      progress: number;
      speed: number;
      arc: number;
      size: number;
    }
    const flowSparks: FlowSpark[] = [];
    let lastFlowSeq = 0;
    let time = 0;

    const emitFlowStream = (fx: number, fy: number, tx: number, ty: number, count: number) => {
      for (let i = 0; i < count; i++) {
        flowSparks.push({
          x: fx + (Math.random() - 0.5) * 44,
          y: fy + (Math.random() - 0.5) * 44,
          tx: tx + (Math.random() - 0.5) * 52,
          ty: ty + (Math.random() - 0.5) * 52,
          progress: 0,
          speed: 0.018 + Math.random() * 0.016,
          arc: (Math.random() - 0.5) * 96,
          size: 1.15 + Math.random() * 1.25,
        });
      }
      if (flowSparks.length > 160) {
        flowSparks.splice(0, flowSparks.length - 160);
      }
    };

    const render = () => {
      rafId = requestAnimationFrame(render);
      if (document.hidden) return;
      time += 0.016;

      const sig = flowSignalRef.current;
      if (sig.seq > lastFlowSeq) {
        lastFlowSeq = sig.seq;
        emitFlowStream(sig.fromX, sig.fromY, sig.toX, sig.toY, isLowPower ? 16 : 30);
      }

      const entryAge = sig.enteredAt > 0 ? Math.max(0, 1 - (performance.now() - sig.enteredAt) / 1400) : 0;
      const leaveFactor = sig.leaveFactor;

      ctx.clearRect(0, 0, width, height);

      for (const p of pts) {
        p.vx += Math.cos(time * 0.7 + p.phase) * 0.012;
        p.vy += Math.sin(time * 0.7 + p.phase) * 0.012 + leaveFactor * 0.06 - entryAge * 0.04;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const a =
          p.alpha *
          (0.65 + 0.35 * Math.sin(time * 1.7 + p.phase)) *
          (1 + entryAge * 0.65 + leaveFactor * 0.7);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.88, a).toFixed(3)})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      for (let i = flowSparks.length - 1; i >= 0; i--) {
        const sp = flowSparks[i];
        sp.progress += sp.speed;
        if (sp.progress >= 1) {
          flowSparks.splice(i, 1);
          continue;
        }
        const t = sp.progress;
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const curX = sp.x + (sp.tx - sp.x) * ease;
        const curY = sp.y + (sp.ty - sp.y) * ease + Math.sin(t * Math.PI) * sp.arc;
        const a = Math.sin(t * Math.PI) * 0.88;
        ctx.beginPath();
        ctx.arc(curX, curY, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.fill();
      }
    };

    rafId = requestAnimationFrame(render);
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [cms.animations.masterEnabled, containerRef, flowSignalRef, shouldReduceMotion]);

  if (shouldReduceMotion || !cms.animations.masterEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 w-full h-full"
    />
  );
};

/**
 * In-Modal Particle Morph Burst when switching Previous / Next inside Fullscreen Exhibition Viewer
 */
const GalleryImageParticleTransition: React.FC<{
  transitionSeq: number;
  direction: 1 | -1;
}> = ({ transitionSeq, direction }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (transitionSeq === 0 || shouldReduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.clientWidth || 840;
    const h = canvas.clientHeight || 540;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pts = Array.from({ length: 320 }, (_, i) => {
      const hx = 0.08 + Math.random() * 0.84;
      const hy = 0.08 + Math.random() * 0.84;
      return {
        hx: hx * w,
        hy: hy * h,
        dx: direction * (110 + Math.random() * 240),
        dy: (Math.random() - 0.5) * 160,
        size: 1.1 + Math.random() * 1.8,
        alpha: 0.45 + Math.random() * 0.52,
        phase: i * 0.5,
      };
    });

    const duration = 520;
    const start = performance.now();
    let raf = 0;

    const render = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const env = Math.sin(p * Math.PI);
      ctx.clearRect(0, 0, w, h);

      for (const pt of pts) {
        const px = pt.hx + pt.dx * env + Math.sin(p * Math.PI * 2 + pt.phase) * 18 * env;
        const py = pt.hy + pt.dy * env;
        const a = pt.alpha * env;
        if (a <= 0.02) continue;
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.fillRect(px, py, pt.size, pt.size);
      }

      if (p < 1) {
        raf = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [direction, shouldReduceMotion, transitionSeq]);

  if (shouldReduceMotion || transitionSeq === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 w-full h-full"
    />
  );
};

/**
 * Fullscreen Exhibition Viewer
 * Pure deep black frame showing ONLY: image/video, minimal number/category/year, caption, prev, next, close.
 * Switching images triggers a particle break-apart -> swirl -> reconstruct transition.
 */
const GalleryFullscreenViewer: React.FC<{
  item: GalleryItem | null;
  items: GalleryItem[];
  albumMap: Record<string, string>;
  originRect: RectBox | null;
  getRectForId: (id: string) => RectBox | null;
  onSelectIndex: (next: GalleryItem) => void;
  onClose: () => void;
}> = ({ item, items, albumMap, originRect, getRectForId, onSelectIndex, onClose }) => {
  const shouldReduceMotion = useReducedMotion();
  const [closingTarget, setClosingTarget] = useState<RectBox | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [navSeq, setNavSeq] = useState(0);
  const [navDir, setNavDir] = useState<1 | -1>(1);

  useEffect(() => {
    setClosingTarget(null);
    setIsClosing(false);
  }, [item?.id]);

  const handleClose = useCallback(() => {
    if (!item || isClosing) return;
    if (shouldReduceMotion) {
      onClose();
      return;
    }
    const returnRect = getRectForId(item.id) || originRect;
    setClosingTarget(returnRect);
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 360);
  }, [getRectForId, isClosing, item, onClose, originRect, shouldReduceMotion]);

  const currentIndex = item ? items.findIndex((i) => i.id === item.id) : -1;

  const goPrev = useCallback(() => {
    if (items.length <= 1 || currentIndex === -1) return;
    setNavDir(-1);
    setNavSeq((s) => s + 1);
    const prev = (currentIndex - 1 + items.length) % items.length;
    onSelectIndex(items[prev]);
  }, [currentIndex, items, onSelectIndex]);

  const goNext = useCallback(() => {
    if (items.length <= 1 || currentIndex === -1) return;
    setNavDir(1);
    setNavSeq((s) => s + 1);
    const next = (currentIndex + 1) % items.length;
    onSelectIndex(items[next]);
  }, [currentIndex, items, onSelectIndex]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [goNext, goPrev, handleClose, item]);

  if (typeof document === 'undefined' || !item) return null;

  const fullBox: RectBox = {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const startBox = originRect || {
    top: window.innerHeight * 0.2,
    left: window.innerWidth * 0.2,
    width: window.innerWidth * 0.6,
    height: window.innerHeight * 0.6,
  };
  const targetBox = isClosing && closingTarget ? closingTarget : fullBox;
  const categoryName = albumMap[item.albumId] || 'Exhibition';
  const yearLabel = extractYearLabel(item);
  const indexLabel = `IMAGE ${String(Math.max(0, currentIndex) + 1).padStart(2, '0')} / ${String(
    items.length
  ).padStart(2, '0')}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[95]"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: 0.34, ease: EASE_CINEMATIC }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
      />

      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 0, top: 0, left: 0, width: fullBox.width, height: fullBox.height }
            : {
                top: startBox.top,
                left: startBox.left,
                width: startBox.width,
                height: startBox.height,
                borderRadius: 20,
                opacity: 0.85,
              }
        }
        animate={
          shouldReduceMotion
            ? { opacity: isClosing ? 0 : 1 }
            : {
                top: targetBox.top,
                left: targetBox.left,
                width: targetBox.width,
                height: targetBox.height,
                borderRadius: isClosing ? 20 : 0,
                opacity: isClosing ? 0.12 : 1,
              }
        }
        transition={{ duration: 0.42, ease: EASE_CINEMATIC }}
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-[#040405] text-white flex flex-col justify-between overflow-hidden"
      >
        {/* Minimal Exhibition Header: IMAGE XX · CATEGORY · YEAR + X */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3 text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase">
            <span className="text-white tabular-nums">{indexLabel}</span>
            <span aria-hidden="true" className="text-zinc-700">
              ·
            </span>
            <span>{categoryName}</span>
            <span aria-hidden="true" className="text-zinc-700">
              ·
            </span>
            <span className="tabular-nums">{yearLabel}</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close exhibition viewer"
            className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-zinc-200 hover:bg-white hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Exhibition Canvas with In-Frame Particle Break-Apart Morph */}
        <div className="relative flex-1 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
          <div className="relative w-full max-w-5xl h-full max-h-[68vh] rounded-2xl overflow-hidden border border-white/[0.1] bg-black flex items-center justify-center shadow-[0_24px_90px_rgba(0,0,0,0.9)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                initial={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 0.15, scale: 0.96, filter: 'blur(6px)' }
                }
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 0.15, scale: 1.03, filter: 'blur(6px)' }
                }
                transition={{ duration: 0.34, ease: EASE_CINEMATIC }}
                className="w-full h-full flex items-center justify-center"
              >
                {item.mediaUrl ? (
                  item.mediaType === 'video' ? (
                    <video
                      src={item.mediaUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain grayscale"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain grayscale contrast-115"
                    />
                  )
                ) : (
                  <ProjectArtwork
                    variant={item.visualVariant || 'monolith'}
                    title={item.title}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <GalleryImageParticleTransition transitionSeq={navSeq} direction={navDir} />
          </div>
        </div>

        {/* Minimal Footer: Caption + Previous / Next */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 px-6 sm:px-10 py-5 border-t border-white/[0.08] bg-[#040405]/95 shrink-0">
          <div className="max-w-xl">
            <h4 className="font-display text-lg sm:text-xl font-semibold text-white tracking-tight">
              {item.title}
            </h4>
            {item.caption && (
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {item.caption}
              </p>
            )}
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 text-xs font-mono tracking-[0.12em] text-zinc-200 hover:bg-white hover:text-black transition-colors whitespace-nowrap shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREVIOUS</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-mono font-semibold tracking-[0.12em] hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

/**
 * Multi-Depth Exhibition Plate Wrapper
 * Adds vertical scroll parallax tuned to each artwork's depth plane (foreground/middle/background)
 * and a 3-strip fragment emergence reveal out of near-black.
 */
const ExhibitionPlateCard: React.FC<{
  item: GalleryItem;
  idx: number;
  slot: ExhibitionSlotConfig;
  categoryName: string;
  isHovered: boolean;
  isQuiet: boolean;
  shouldReduceMotion: boolean;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  onOpen: (item: GalleryItem) => void;
  onHoverEnter: (item: GalleryItem, rect: DOMRect) => void;
  onHoverLeave: (item: GalleryItem) => void;
}> = ({
  item,
  idx,
  slot,
  categoryName,
  isHovered,
  isQuiet,
  shouldReduceMotion,
  registerRef,
  onOpen,
  onHoverEnter,
  onHoverLeave,
}) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start end', 'end start'],
  });

  const depthY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [slot.scrollShift, -slot.scrollShift]
  );

  const imageNumber = `IMAGE ${String(idx + 1).padStart(2, '0')}`;
  const yearLabel = extractYearLabel(item);

  return (
    <div
      ref={outerRef}
      className={`${slot.spanClass} ${slot.offsetClass} ${slot.zClass} relative`}
    >
      <motion.div
        style={shouldReduceMotion ? undefined : { y: depthY }}
        initial={
          shouldReduceMotion
            ? undefined
            : { opacity: 0, y: 26, scale: 0.94, filter: 'blur(4px)' }
        }
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.14 }}
        transition={{
          duration: 0.65,
          delay: Math.min(idx * 0.08, 0.32),
          ease: EASE_CINEMATIC,
        }}
      >
        <div
          ref={(el) => registerRef(item.id, el)}
          data-gallery-id={item.id}
          data-cursor="open"
          data-gravity="gather"
          role="button"
          tabIndex={0}
          aria-label={`Open ${item.title} in fullscreen exhibition viewer`}
          onClick={() => onOpen(item)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(item);
            }
          }}
          onMouseEnter={(e) => onHoverEnter(item, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => onHoverLeave(item)}
          style={{
            transform: shouldReduceMotion
              ? undefined
              : `translate3d(0px, 0px, 0) rotate(${slot.rotateDeg}deg)`,
          }}
          className={`group relative cursor-pointer rounded-2xl overflow-hidden bg-[#060608] border transition-all duration-500 ease-out will-change-transform ${
            isHovered
              ? 'border-white/50 shadow-[0_28px_90px_rgba(255,255,255,0.1)] scale-[1.022]'
              : isQuiet
                ? 'border-white/[0.05] opacity-35'
                : 'border-white/[0.11] shadow-[0_20px_65px_rgba(0,0,0,0.82)]'
          }`}
        >
          <div className={`relative ${slot.aspectClass} w-full overflow-hidden bg-black`}>
            {item.mediaUrl ? (
              item.mediaType === 'video' ? (
                <video
                  src={item.mediaUrl}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover grayscale transition-all duration-700 ${
                    isHovered
                      ? 'contrast-125 brightness-110 scale-[1.025]'
                      : 'contrast-105 brightness-90'
                  }`}
                />
              ) : (
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover grayscale transition-all duration-700 ${
                    isHovered
                      ? 'contrast-125 brightness-110 scale-[1.025]'
                      : 'contrast-105 brightness-90'
                  }`}
                />
              )
            ) : (
              <div
                className={`w-full h-full transition-all duration-700 ${
                  isHovered ? 'brightness-115 scale-[1.025]' : 'brightness-90'
                }`}
              >
                <ProjectArtwork
                  variant={item.visualVariant || 'monolith'}
                  title={item.title}
                />
              </div>
            )}

            {/* Art-Fragment Darkness Emergence Shutters on Initial Entry */}
            {!shouldReduceMotion && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3"
              >
                {[0, 1, 2].map((col) => (
                  <motion.div
                    key={col}
                    initial={{ scaleY: 1 }}
                    whileInView={{ scaleY: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.08 + col * 0.075,
                      ease: EASE_CINEMATIC,
                    }}
                    style={{ transformOrigin: col % 2 === 0 ? 'top center' : 'bottom center' }}
                    className="bg-[#050507]"
                  />
                ))}
              </div>
            )}

            {/* Soft Exhibition Vignette */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 transition-opacity duration-500 bg-gradient-to-t from-black/88 via-black/15 to-transparent ${
                isHovered ? 'opacity-90' : 'opacity-60'
              }`}
            />

            {/* Minimal Label Revealed Cleanly on Hover (IMAGE 04 · CATEGORY · YEAR) */}
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 p-5 z-20 transition-all duration-400 ${
                isHovered
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] text-zinc-300 uppercase">
                <span className="text-white tabular-nums">{imageNumber}</span>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span>{categoryName}</span>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span className="tabular-nums">{yearLabel}</span>
              </div>
              <h4 className="mt-1.5 font-display text-lg sm:text-xl font-semibold text-white tracking-tight">
                {item.title}
              </h4>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const Gallery: React.FC<{ staticPreview?: boolean }> = ({ staticPreview = false }) => {
  const { cms } = useSiteConfig();
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot || staticPreview;

  const [activeAlbumId, setActiveAlbumId] = useState<string>('ALL');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [originRect, setOriginRect] = useState<RectBox | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const exhibitionRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastHoveredCenterRef = useRef<{ x: number; y: number } | null>(null);
  const flowSignalRef = useRef({
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    seq: 0,
    leaveFactor: 0,
    enteredAt: 0,
  });

  const visibleAlbums = useMemo(
    () => cms.gallery.albums.filter((a) => a.visible !== false),
    [cms.gallery.albums]
  );

  const albumMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of visibleAlbums) {
      map[a.id] = a.name;
    }
    return map;
  }, [visibleAlbums]);

  const visibleItems = useMemo(() => {
    const allowedAlbums = new Set(visibleAlbums.map((a) => a.id));
    return cms.gallery.items.filter(
      (item) => item.visible !== false && (!item.albumId || allowedAlbums.has(item.albumId))
    );
  }, [cms.gallery.items, visibleAlbums]);

  const filteredItems = useMemo(() => {
    if (activeAlbumId === 'ALL') return visibleItems;
    return visibleItems.filter((item) => item.albumId === activeAlbumId);
  }, [activeAlbumId, visibleItems]);

  const { scrollYProgress: galleryScroll } = useScroll({
    target: exhibitionRef,
    offset: ['start end', 'end start'],
  });

  useMotionValueEvent(galleryScroll, 'change', (p) => {
    flowSignalRef.current.leaveFactor = Math.max(0, Math.min(1, (p - 0.68) / 0.25));
  });

  useEffect(() => {
    const el = exhibitionRef.current;
    if (!el || shouldReduceMotion) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          flowSignalRef.current.enteredAt = performance.now();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [shouldReduceMotion]);

  const handleExhibitionPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const container = exhibitionRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;

    for (let idx = 0; idx < filteredItems.length; idx++) {
      const item = filteredItems[idx];
      const node = itemRefs.current[item.id];
      if (!node) continue;
      const slot = EXHIBITION_SLOTS[idx % EXHIBITION_SLOTS.length];
      const tx = nx * slot.depth * 36;
      const ty = ny * slot.depth * 24;
      node.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${slot.rotateDeg}deg)`;
    }
  };

  const handleExhibitionPointerLeave = () => {
    setHoveredId(null);
    experimentalBus.hoveredCardRect = null;
    for (let idx = 0; idx < filteredItems.length; idx++) {
      const item = filteredItems[idx];
      const node = itemRefs.current[item.id];
      if (!node) continue;
      const slot = EXHIBITION_SLOTS[idx % EXHIBITION_SLOTS.length];
      node.style.transform = `translate3d(0px, 0px, 0) rotate(${slot.rotateDeg}deg)`;
    }
  };

  const triggerParticleFlowTo = (item: GalleryItem) => {
    const container = exhibitionRef.current;
    const targetNode = itemRefs.current[item.id];
    if (!container || !targetNode) return;
    const cRect = container.getBoundingClientRect();
    const tRect = targetNode.getBoundingClientRect();
    const toX = tRect.left - cRect.left + tRect.width * 0.5;
    const toY = tRect.top - cRect.top + tRect.height * 0.5;
    const prev = lastHoveredCenterRef.current || {
      x: cRect.width * 0.5,
      y: 20,
    };
    flowSignalRef.current.fromX = prev.x;
    flowSignalRef.current.fromY = prev.y;
    flowSignalRef.current.toX = toX;
    flowSignalRef.current.toY = toY;
    flowSignalRef.current.seq += 1;
    lastHoveredCenterRef.current = { x: toX, y: toY };
  };

  const getRectForId = useCallback((id: string): RectBox | null => {
    const el = itemRefs.current[id];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }, []);

  const handleOpenItem = (item: GalleryItem) => {
    if (isBookSnapshot) return;
    setOriginRect(getRectForId(item.id));
    setLightboxItem(item);
  };

  const handleAlbumSwitch = (nextAlbumId: string) => {
    if (nextAlbumId === activeAlbumId) return;
    const container = exhibitionRef.current;
    if (container) {
      flowSignalRef.current.fromX = container.clientWidth * 0.2;
      flowSignalRef.current.fromY = container.clientHeight * 0.4;
      flowSignalRef.current.toX = container.clientWidth * 0.8;
      flowSignalRef.current.toY = container.clientHeight * 0.5;
      flowSignalRef.current.seq += 1;
    }
    setActiveAlbumId(nextAlbumId);
  };

  return (
    <RealityDimensionSection
      id="gallery"
      className="py-24 sm:py-36 bg-[#050505]/45 border-b border-white/[0.06] overflow-x-clip z-10"
    >
      {!isBookSnapshot && (
        <GalleryFullscreenViewer
          item={lightboxItem}
          items={filteredItems}
          albumMap={albumMap}
          originRect={originRect}
          getRectForId={getRectForId}
          onSelectIndex={(next) => {
            triggerParticleFlowTo(next);
            setLightboxItem(next);
          }}
          onClose={() => setLightboxItem(null)}
        />
      )}

      <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
        {/* Header + Minimal Exhibition Filter */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={VIEWPORT_CONFIG}
          transition={{ duration: 0.55, ease: EASE_CINEMATIC }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 sm:mb-20"
        >
          <div className="flex-1">
            <ParticleSectionTitle word={cms.gallery.sectionLabel || 'GALLERY'} />
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {cms.gallery.heading}
            </h3>
            <p className="mt-2 max-w-2xl text-base text-zinc-400 leading-relaxed">
              {cms.gallery.description}
            </p>
            <HairlineDraw className="mt-5 max-w-xs" />
          </div>

          <div
            role="tablist"
            aria-label="Filter exhibition plates"
            className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0B0B0D]/90 border border-white/[0.08] self-start lg:self-auto"
          >
            <button
              type="button"
              onClick={() => handleAlbumSwitch('ALL')}
              className={`relative px-4 py-2 text-xs font-mono rounded-lg transition-colors ${
                activeAlbumId === 'ALL'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              All Works
            </button>
            {visibleAlbums.map((album) => (
              <button
                key={album.id}
                type="button"
                onClick={() => handleAlbumSwitch(album.id)}
                className={`relative px-4 py-2 text-xs font-mono rounded-lg transition-colors whitespace-nowrap ${
                  activeAlbumId === album.id
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {album.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Multi-Depth Floating Digital Exhibition Composition */}
        <div
          ref={exhibitionRef}
          onPointerMove={handleExhibitionPointerMove}
          onPointerLeave={handleExhibitionPointerLeave}
          className="relative py-6"
        >
          <GalleryExhibitionCanvas
            containerRef={exhibitionRef}
            flowSignalRef={flowSignalRef}
          />

          <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-y-10 md:gap-x-8 items-start">
            {filteredItems.map((item, idx) => {
              const slot = EXHIBITION_SLOTS[idx % EXHIBITION_SLOTS.length];
              const isHovered = hoveredId === item.id;
              const isQuiet = hoveredId !== null && !isHovered;
              const categoryName = albumMap[item.albumId] || 'Exhibition';

              return (
                <ExhibitionPlateCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  slot={slot}
                  categoryName={categoryName}
                  isHovered={isHovered}
                  isQuiet={isQuiet}
                  shouldReduceMotion={shouldReduceMotion}
                  registerRef={(id, el) => {
                    itemRefs.current[id] = el;
                  }}
                  onOpen={handleOpenItem}
                  onHoverEnter={(curItem, r) => {
                    setHoveredId(curItem.id);
                    triggerParticleFlowTo(curItem);
                    experimentalBus.hoveredCardRect = {
                      left: r.left,
                      top: r.top,
                      width: r.width,
                      height: r.height,
                    };
                  }}
                  onHoverLeave={(curItem) => {
                    setHoveredId((cur) => (cur === curItem.id ? null : cur));
                    experimentalBus.hoveredCardRect = null;
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </RealityDimensionSection>
  );
};
