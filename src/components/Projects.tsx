import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Github,
  X,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { ProjectCategory, ProjectCmsItem } from '../types/cms';
import { ProjectArtwork } from './MonochromeVisuals';
import { HairlineDraw } from '../motion/MotionPrimitives';
import { useIsBookSnapshot } from '../motion/BookSnapshotContext';
import { experimentalBus, RealityDimensionSection } from '../motion/ExperimentalEngine';
import { ParticleSectionTitle } from '../motion/ParticleSectionHeader';
import { EASE_CINEMATIC, SPRING_TILT, VIEWPORT_CONFIG } from '../motion/motionSystem';

const DEFAULT_CATEGORIES: ('ALL' | ProjectCategory)[] = ['ALL', 'CODE', 'DESIGN', 'MOTION', 'AI'];

interface RectBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

const RECONSTRUCTION_FRAGMENTS = Array.from({ length: 12 }, (_, idx) => ({
  id: idx,
  delay: ((idx * 37) % 12) * 0.022,
  offsetX: ((idx % 4) - 1.5) * 14,
  offsetY: (Math.floor(idx / 4) - 1) * 14,
}));

/**
 * Connected Canvas Particle Reconstruction & Break-Apart Layer for Projects
 * - Desktop: ~460 monochrome particles forming perimeter aura + morph dispersion stream
 * - Mobile: ~200 adaptive particles
 * - Breaks current project visual apart into luminous traveling particles toward the incoming scene
 */
const ProjectParticleMorphCanvas: React.FC<{
  morphPhaseRef: React.MutableRefObject<{
    dissolve: number; // 0 = solid crystallized visual, 1 = full particle dispersion
    direction: number; // +1 forward, -1 backward
    burstAt: number;
  }>;
  pointerRef: React.MutableRefObject<{ rx: number; ry: number; active: boolean }>;
}> = ({ morphPhaseRef, pointerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;
  const { cms } = useSiteConfig();

  useEffect(() => {
    if (shouldReduceMotion || !cms.animations.masterEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = canvas.clientWidth || 760;
    let height = canvas.clientHeight || 540;
    const isLowPower = window.innerWidth < 768 || (navigator.hardwareConcurrency || 4) <= 2;
    const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1.25 : 1.75);

    const resize = () => {
      width = canvas.clientWidth || 760;
      height = canvas.clientHeight || 540;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const COUNT = isLowPower ? 190 : 460;
    interface MorphPt {
      x: number;
      y: number;
      vx: number;
      vy: number;
      hx: number;
      hy: number;
      streamBias: number;
      size: number;
      alpha: number;
      phase: number;
      rim: boolean;
    }

    const pts: MorphPt[] = Array.from({ length: COUNT }, (_, i) => {
      const isRim = i % 4 === 0;
      let hx = 0.05 + Math.random() * 0.9;
      let hy = 0.06 + Math.random() * 0.88;
      if (isRim) {
        const edge = i % 4;
        if (edge === 0) hy = 0.02 + Math.random() * 0.05;
        else if (edge === 1) hy = 0.92 + Math.random() * 0.06;
        else if (edge === 2) hx = 0.02 + Math.random() * 0.04;
        else hx = 0.94 + Math.random() * 0.04;
      }
      return {
        x: hx * width,
        y: hy * height,
        vx: 0,
        vy: 0,
        hx,
        hy,
        streamBias: 0.45 + Math.random() * 1.15,
        size: isRim ? 0.95 + Math.random() * 1.1 : 1.15 + Math.random() * 1.65,
        alpha: isRim ? 0.35 + Math.random() * 0.45 : 0.45 + Math.random() * 0.52,
        phase: i * 0.618,
        rim: isRim,
      };
    });

    let time = 0;
    let lastBurstHandled = 0;

    const render = () => {
      rafId = requestAnimationFrame(render);
      if (document.hidden) return;
      time += 0.019;

      const { dissolve, direction, burstAt } = morphPhaseRef.current;
      let burstBoost = 0;
      if (burstAt > lastBurstHandled) {
        lastBurstHandled = burstAt;
        for (const p of pts) {
          const cx = width * 0.5;
          const cy = height * 0.5;
          const ang = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 0.9;
          const spd = 4.2 + Math.random() * 8.2;
          p.vx += Math.cos(ang) * spd + direction * 2.5;
          p.vy += Math.sin(ang) * spd;
        }
      }
      if (burstAt > 0) {
        const elapsed = performance.now() - burstAt;
        if (elapsed < 560) {
          burstBoost = Math.sin((elapsed / 560) * Math.PI);
        }
      }

      const effectiveDissolve = Math.min(1, Math.max(dissolve, burstBoost * 0.96));

      ctx.clearRect(0, 0, width, height);

      const px = pointerRef.current.rx * width;
      const py = pointerRef.current.ry * height;
      const pointerActive = pointerRef.current.active;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const homeX = p.hx * width;
        const homeY = p.hy * height;

        // Break visual apart into horizontal + spiral particle currents toward next scene
        const travelX = direction * effectiveDissolve * width * 0.64 * p.streamBias;
        const travelY =
          Math.sin(time * 2.3 + p.phase) * effectiveDissolve * 76 +
          (p.hy - 0.5) * effectiveDissolve * 124;

        const targetX = homeX + travelX;
        const targetY = homeY + travelY;

        const spring = effectiveDissolve > 0.14 ? 0.045 : 0.092;
        p.vx += (targetX - p.x) * spring;
        p.vy += (targetY - p.y) * spring;

        if (pointerActive) {
          const dx = p.x - px;
          const dy = p.y - py;
          const d = Math.hypot(dx, dy);
          if (d < 145 && d > 2) {
            const force = (1 - d / 145) * (p.rim ? 1.5 : 2.3);
            p.vx += (dx / d) * force + (-dy / d) * 0.5;
            p.vy += (dy / d) * force + (dx / d) * 0.5;
          }
        }

        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        const vis = p.rim
          ? 0.24 + effectiveDissolve * 0.72
          : Math.max(0, effectiveDissolve * 0.98);

        if (vis <= 0.02) continue;

        const twinkle = 0.72 + 0.28 * Math.sin(time * 2.5 + p.phase);
        const alpha = Math.min(0.96, p.alpha * vis * twinkle);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + effectiveDissolve * 0.42), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.fill();

        if (!isLowPower && effectiveDissolve > 0.24 && i < pts.length - 1 && i % 3 === 0) {
          const next = pts[i + 1];
          const d = Math.hypot(p.x - next.x, p.y - next.y);
          if (d < 58) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - d / 58) * effectiveDissolve * 0.18).toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    rafId = requestAnimationFrame(render);
    window.addEventListener('resize', resize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [cms.animations.masterEnabled, morphPhaseRef, pointerRef, shouldReduceMotion]);

  if (shouldReduceMotion || !cms.animations.masterEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 w-full h-full"
    />
  );
};

/**
 * Fullscreen Editorial Case Study Modal
 * Expands from exact stage frame rect and reverses smoothly back on X / ESC.
 */
const ProjectFullscreenModal: React.FC<{
  project: ProjectCmsItem | null;
  originRect: RectBox | null;
  getReturnRect: () => RectBox | null;
  onClose: () => void;
  onInquire: (title: string) => void;
}> = ({ project, originRect, getReturnRect, onClose, onInquire }) => {
  const shouldReduceMotion = useReducedMotion();
  const [slideIdx, setSlideIdx] = useState(0);
  const [closingTarget, setClosingTarget] = useState<RectBox | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setSlideIdx(0);
    setClosingTarget(null);
    setIsClosing(false);
  }, [project?.id]);

  const handleTriggerClose = useCallback(() => {
    if (isClosing) return;
    if (shouldReduceMotion) {
      onClose();
      return;
    }
    const target = getReturnRect() || originRect;
    setClosingTarget(target);
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 360);
  }, [getReturnRect, isClosing, onClose, originRect, shouldReduceMotion]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleTriggerClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [handleTriggerClose, project]);

  const mediaSlides = useMemo(() => {
    if (!project) return [];
    const slides: { type: 'video' | 'image' | 'artwork'; url?: string }[] = [];
    if (project.videoUrl) slides.push({ type: 'video', url: project.videoUrl });
    if (project.thumbnailUrl) slides.push({ type: 'image', url: project.thumbnailUrl });
    for (const url of project.galleryUrls || []) {
      if (url && url !== project.thumbnailUrl) {
        slides.push({ type: 'image', url });
      }
    }
    if (slides.length === 0) slides.push({ type: 'artwork' });
    return slides;
  }, [project]);

  if (typeof document === 'undefined' || !project) return null;

  const activeSlide = mediaSlides[slideIdx] || { type: 'artwork' };
  const initialBox = originRect || {
    top: window.innerHeight * 0.12,
    left: window.innerWidth * 0.08,
    width: window.innerWidth * 0.62,
    height: window.innerHeight * 0.68,
  };

  const fullBox: RectBox = {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const targetAnim = isClosing && closingTarget ? closingTarget : fullBox;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} case study`}
      className="fixed inset-0 z-[95]"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: 0.34, ease: EASE_CINEMATIC }}
        onClick={handleTriggerClose}
        className="fixed inset-0 bg-black/92 backdrop-blur-2xl"
      />

      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 0, top: 0, left: 0, width: fullBox.width, height: fullBox.height }
            : {
                top: initialBox.top,
                left: initialBox.left,
                width: initialBox.width,
                height: initialBox.height,
                borderRadius: 20,
                opacity: 0.85,
              }
        }
        animate={
          shouldReduceMotion
            ? { opacity: isClosing ? 0 : 1 }
            : {
                top: targetAnim.top,
                left: targetAnim.left,
                width: targetAnim.width,
                height: targetAnim.height,
                borderRadius: isClosing ? 20 : 0,
                opacity: isClosing ? 0.15 : 1,
              }
        }
        transition={{ duration: 0.42, ease: EASE_CINEMATIC }}
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-[#050507] text-white border border-white/[0.1] overflow-hidden flex flex-col shadow-[0_32px_120px_rgba(0,0,0,0.95)]"
      >
        {/* Minimal Editorial Top Header */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-4 border-b border-white/[0.08] bg-[#050507]/95 shrink-0">
          <div className="flex items-center gap-3 text-[11px] font-mono tracking-[0.18em] text-zinc-400 uppercase">
            <span className="text-white">{project.category}</span>
            <span aria-hidden="true" className="text-zinc-700">
              ·
            </span>
            <span className="tabular-nums">{project.year}</span>
            {project.client && (
              <>
                <span aria-hidden="true" className="hidden sm:inline text-zinc-700">
                  ·
                </span>
                <span className="hidden sm:inline">{project.client}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleTriggerClose}
            aria-label="Close case study"
            className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-zinc-200 hover:bg-white hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Fullscreen Interior */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8">
          <div className="mx-auto max-w-[1240px] space-y-10 pb-12">
            {/* Large Dominant Visual Stage */}
            <div className="relative aspect-[16/9] max-h-[68vh] w-full rounded-2xl overflow-hidden border border-white/[0.1] bg-[#040405]">
              {activeSlide.type === 'video' && activeSlide.url ? (
                <video
                  src={activeSlide.url}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover grayscale"
                />
              ) : activeSlide.type === 'image' && activeSlide.url ? (
                <img
                  src={activeSlide.url}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale contrast-110"
                />
              ) : (
                <ProjectArtwork variant={project.visualVariant} title={project.title} />
              )}

              {mediaSlides.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={() =>
                      setSlideIdx((i) => (i - 1 + mediaSlides.length) % mediaSlides.length)
                    }
                    aria-label="Previous project frame"
                    className="w-10 h-10 rounded-full bg-black/80 border border-white/25 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3.5 py-1.5 rounded-full bg-black/80 border border-white/20 text-[11px] font-mono tabular-nums">
                    {String(slideIdx + 1).padStart(2, '0')} /{' '}
                    {String(mediaSlides.length).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSlideIdx((i) => (i + 1) % mediaSlides.length)}
                    aria-label="Next project frame"
                    className="w-10 h-10 rounded-full bg-black/80 border border-white/25 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Title + Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
              <div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                  {project.title}
                </h2>
                <p className="mt-2 text-xs font-mono tracking-[0.14em] text-zinc-400 uppercase">
                  {project.role}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-xs font-medium text-zinc-200 hover:bg-white hover:text-black transition-colors whitespace-nowrap shrink-0"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Live Demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Description + Tools + Technology */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-6">
                <p className="text-base sm:text-lg leading-relaxed text-zinc-200">
                  {project.fullDescription || project.shortDescription}
                </p>

                {(project.challenge || project.solution) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/[0.08]">
                    {project.challenge && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono tracking-[0.18em] text-zinc-500">
                          CHALLENGE
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-400">{project.challenge}</p>
                      </div>
                    )}
                    {project.solution && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono tracking-[0.18em] text-zinc-500">
                          SOLUTION &amp; CRAFT
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-400">{project.solution}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="py-5 border-y border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500 uppercase tracking-[0.16em]">Category</span>
                    <span className="text-zinc-200 uppercase">{project.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500 uppercase tracking-[0.16em]">Year</span>
                    <span className="text-zinc-200 tabular-nums">{project.year}</span>
                  </div>
                  <div className="pt-3 border-t border-white/[0.06]">
                    <div className="text-[11px] font-mono tracking-[0.18em] text-zinc-500 uppercase mb-2">
                      Tools &amp; Technology
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-mono text-zinc-300">
                      {project.tags.map((tag, tIdx) => (
                        <React.Fragment key={tag}>
                          <span>{tag}</span>
                          {tIdx < project.tags.length - 1 && (
                            <span aria-hidden="true" className="text-zinc-700">
                              ·
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {project.metrics.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 border-b border-white/[0.08] pb-6">
                    {project.metrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="font-display text-xl font-bold text-white tabular-nums">
                          {metric.value}
                        </div>
                        <div className="mt-1 text-[11px] font-mono text-zinc-500">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleTriggerClose();
                    setTimeout(() => onInquire(project.title), 380);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.16em] text-white hover:underline"
                >
                  <span>COMMISSION SIMILAR WORK</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Project Gallery Filmstrip */}
            {mediaSlides.length > 1 && (
              <div className="pt-6 border-t border-white/[0.08] space-y-3">
                <div className="text-[11px] font-mono tracking-[0.18em] text-zinc-500 uppercase">
                  Project Gallery ({mediaSlides.length})
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {mediaSlides.map((slide, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden border transition-all ${
                        slideIdx === idx
                          ? 'border-white ring-1 ring-white/50'
                          : 'border-white/10 opacity-55 hover:opacity-90'
                      }`}
                    >
                      {slide.url && slide.type === 'image' ? (
                        <img
                          src={slide.url}
                          alt={`${project.title} frame ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover grayscale"
                        />
                      ) : (
                        <ProjectArtwork variant={project.visualVariant} title={project.title} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export const Projects: React.FC<{
  onInquire?: (subject: string) => void;
  staticPreview?: boolean;
}> = ({ onInquire, staticPreview = false }) => {
  const { cms } = useSiteConfig();
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot || staticPreview;

  const [activeCategory, setActiveCategory] = useState<'ALL' | ProjectCategory>('ALL');
  const [selectedProject, setSelectedProject] = useState<ProjectCmsItem | null>(null);
  const [originRect, setOriginRect] = useState<RectBox | null>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [visualState, setVisualState] = useState<{
    opacity: number;
    scale: number;
    infoOpacity: number;
  }>({ opacity: 1, scale: 1, infoOpacity: 1 });

  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageFrameRef = useRef<HTMLDivElement | null>(null);
  const imageWrapRef = useRef<HTMLDivElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);

  const morphPhaseRef = useRef({
    dissolve: 0,
    direction: 1,
    burstAt: 0,
  });
  const pointerRef = useRef({ rx: 0.5, ry: 0.5, active: false });
  const prevScrollProgressRef = useRef(0);

  const tiltX = useSpring(0, SPRING_TILT);
  const tiltY = useSpring(0, SPRING_TILT);

  const visibleProjects = useMemo(
    () => cms.projects.items.filter((p) => p.visible !== false),
    [cms.projects.items]
  );

  const categories = useMemo(() => {
    const present = new Set<ProjectCategory>(visibleProjects.map((p) => p.category));
    const list: ('ALL' | ProjectCategory)[] = [...DEFAULT_CATEGORIES];
    for (const c of present) {
      if (!list.includes(c)) list.push(c);
    }
    return list;
  }, [visibleProjects]);

  const filtered = useMemo(() => {
    if (activeCategory === 'ALL') return visibleProjects;
    return visibleProjects.filter((p) => p.category === activeCategory);
  }, [activeCategory, visibleProjects]);

  useEffect(() => {
    setActiveIdx(0);
    setVisualState({ opacity: 1, scale: 1, infoOpacity: 1 });
  }, [activeCategory, filtered.length]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  const { scrollYProgress: entryProgress } = useScroll({
    target: trackRef,
    offset: ['start end', 'start start'],
  });

  useMotionValueEvent(entryProgress, 'change', (ep) => {
    if (shouldReduceMotion || filtered.length === 0) return;
    if (scrollYProgress.get() <= 0.02) {
      const gather = Math.max(0, Math.min(1, (1 - ep) * 1.18));
      morphPhaseRef.current.dissolve = Math.min(0.88, gather * 0.88);
      morphPhaseRef.current.direction = -1;
      const revealScale = 0.9 + ep * 0.1;
      const revealOpacity = Math.min(1, Math.max(0.16, ep * 1.15));
      setVisualState({
        opacity: revealOpacity,
        scale: revealScale,
        infoOpacity: Math.max(0, (ep - 0.35) / 0.65),
      });
    }
  });

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (staticPreview || isBookSnapshot) return;
    const total = filtered.length;
    if (total === 0) return;
    if (total === 1 || shouldReduceMotion) {
      morphPhaseRef.current.dissolve = 0;
      setActiveIdx(0);
      setVisualState({ opacity: 1, scale: 1, infoOpacity: 1 });
      return;
    }

    const dir = p >= prevScrollProgressRef.current ? 1 : -1;
    prevScrollProgressRef.current = p;
    morphPhaseRef.current.direction = dir;

    const span = total - 1;
    const u = Math.max(0, Math.min(span, p * span));
    const nearestIdx = Math.round(u);
    const localDelta = u - nearestIdx;
    const absDelta = Math.abs(localDelta);

    setActiveIdx(nearestIdx);

    // Chapter morph across particle field around midpoint (absDelta 0.2 -> 0.48)
    const dissolve = Math.max(0, Math.min(1, (absDelta - 0.2) / 0.28));
    morphPhaseRef.current.dissolve = dissolve;

    const focusOpacity = Math.max(0.08, 1 - dissolve * 0.92);
    const focusScale = 1 - dissolve * 0.06;
    const infoOpacity = Math.max(0, 1 - dissolve * 1.35);

    setVisualState({
      opacity: focusOpacity,
      scale: focusScale,
      infoOpacity,
    });
  });

  const handleCategorySwitch = (cat: 'ALL' | ProjectCategory) => {
    if (cat === activeCategory) return;
    morphPhaseRef.current.burstAt = performance.now();
    morphPhaseRef.current.direction = 1;
    setTimeout(() => {
      setActiveCategory(cat);
    }, shouldReduceMotion ? 0 : 170);
  };

  const jumpToChapter = (targetIdx: number) => {
    if (targetIdx === activeIdx || filtered.length <= 1) return;
    morphPhaseRef.current.direction = targetIdx > activeIdx ? 1 : -1;
    morphPhaseRef.current.burstAt = performance.now();

    const el = trackRef.current;
    if (!el || staticPreview) {
      setActiveIdx(targetIdx);
      return;
    }
    const rect = el.getBoundingClientRect();
    const docTop = window.scrollY + rect.top;
    const maxScroll = Math.max(1, el.offsetHeight - window.innerHeight);
    const targetProgress = targetIdx / (filtered.length - 1);
    window.scrollTo({
      top: docTop + targetProgress * maxScroll,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  const getStageRect = useCallback((): RectBox | null => {
    const el = stageFrameRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }, []);

  const handleOpenProject = (project: ProjectCmsItem) => {
    if (isBookSnapshot) return;
    setOriginRect(getStageRect());
    setSelectedProject(project);
  };

  const activeProject = filtered[Math.min(activeIdx, Math.max(0, filtered.length - 1))] || null;
  const chapterCode = `PROJECT ${String(activeIdx + 1).padStart(2, '0')}`;

  return (
    <RealityDimensionSection
      id="projects"
      preserveSticky
      className="py-20 sm:py-28 bg-[#050505]/45 border-b border-white/[0.06] overflow-x-clip z-10"
    >
      {!isBookSnapshot && (
        <ProjectFullscreenModal
          project={selectedProject}
          originRect={originRect}
          getReturnRect={getStageRect}
          onClose={() => setSelectedProject(null)}
          onInquire={(title) => onInquire?.(title)}
        />
      )}

      {/* Minimal Header + Filter Segmented Control */}
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10 mb-8 sm:mb-10">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={VIEWPORT_CONFIG}
          transition={{ duration: 0.55, ease: EASE_CINEMATIC }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
        >
          <div className="flex-1">
            <ParticleSectionTitle
              word={
                !cms.projects.sectionLabel || cms.projects.sectionLabel === 'PROJECTS'
                  ? 'SELECTED WORKS'
                  : cms.projects.sectionLabel
              }
            />
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {cms.projects.heading}
            </h3>
            <HairlineDraw className="mt-4 max-w-xs" />
          </div>

          <div
            role="tablist"
            aria-label="Filter projects by category"
            className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0B0B0D]/90 border border-white/[0.08] self-start lg:self-auto"
          >
            {categories.map((cat) => {
              const selected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => handleCategorySwitch(cat)}
                  className={`relative px-4 py-2 text-xs font-mono tracking-[0.14em] rounded-lg transition-colors duration-200 whitespace-nowrap shrink-0 ${
                    selected ? 'text-black font-semibold' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId={isBookSnapshot ? undefined : 'projects-active-tab'}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-white rounded-lg"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Continuous Scroll-Driven Cinematic Split Showcase (80–90% Viewport Stage) */}
      <div
        ref={trackRef}
        style={{
          height:
            !staticPreview && !isBookSnapshot && filtered.length > 1
              ? `${Math.max(2, filtered.length) * 92}vh`
              : 'auto',
        }}
        className="relative w-full"
      >
        {!activeProject ? (
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10 py-24 text-center text-sm font-mono text-zinc-500 border border-white/[0.08] rounded-2xl">
            NO PROJECTS MATCH THIS DISCIPLINE YET.
          </div>
        ) : (
          <div
            className={`${
              staticPreview || isBookSnapshot
                ? 'relative py-6'
                : 'sticky top-14 sm:top-16 min-h-[calc(100vh-4rem)] flex items-center'
            } px-6 sm:px-10`}
          >
            <div className="relative mx-auto w-full max-w-[1380px] flex items-center gap-6 xl:gap-10">
              {/* Main Asymmetric Split Stage: ~65% Dominant Visual + ~35% Minimal Spec */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* LEFT (~65%): Dominant Film Showcase Frame with Fragment Reconstruction & 3D Depth */}
                <div className="lg:col-span-8">
                  <motion.div
                    ref={stageFrameRef}
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect ${activeProject.title}`}
                    data-cursor="view"
                    data-gravity="well"
                    onClick={() => handleOpenProject(activeProject)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenProject(activeProject);
                      }
                    }}
                    onPointerMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const rx = (e.clientX - rect.left) / Math.max(rect.width, 1);
                      const ry = (e.clientY - rect.top) / Math.max(rect.height, 1);
                      pointerRef.current = { rx, ry, active: true };
                      experimentalBus.hoveredCardRect = {
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                      };

                      if (shouldReduceMotion || e.pointerType !== 'mouse') return;
                      const nx = rx - 0.5;
                      const ny = ry - 0.5;
                      tiltX.set(-ny * 5);
                      tiltY.set(nx * 5);

                      if (imageWrapRef.current) {
                        imageWrapRef.current.style.transform = `scale(1.055) translate3d(${(-nx * 24).toFixed(1)}px, ${(-ny * 16).toFixed(1)}px, 0)`;
                      }
                      if (spotRef.current) {
                        spotRef.current.style.opacity = '1';
                        spotRef.current.style.background = `radial-gradient(480px circle at ${(rx * 100).toFixed(1)}% ${(ry * 100).toFixed(1)}%, rgba(255,255,255,0.16), rgba(255,255,255,0.03) 45%, transparent 72%)`;
                      }
                    }}
                    onPointerLeave={() => {
                      pointerRef.current.active = false;
                      experimentalBus.hoveredCardRect = null;
                      tiltX.set(0);
                      tiltY.set(0);
                      if (imageWrapRef.current) {
                        imageWrapRef.current.style.transform = 'scale(1.01) translate3d(0px, 0px, 0)';
                      }
                      if (spotRef.current) {
                        spotRef.current.style.opacity = '0';
                      }
                    }}
                    style={
                      shouldReduceMotion
                        ? undefined
                        : {
                            transformPerspective: 1500,
                            rotateX: tiltX,
                            rotateY: tiltY,
                          }
                    }
                    className="group relative w-full h-[42vh] sm:h-[54vh] lg:h-[72vh] min-h-[340px] max-h-[700px] rounded-2xl overflow-hidden border border-white/[0.14] hover:border-white/35 bg-[#040406] cursor-pointer shadow-[0_32px_100px_rgba(0,0,0,0.9)] transition-colors duration-300"
                  >
                    {/* Visual Surface + Subtle Idle Atmospheric Breath */}
                    <div
                      style={{
                        opacity: visualState.opacity,
                        transform: `scale(${visualState.scale.toFixed(3)})`,
                      }}
                      className="relative w-full h-full transition-[opacity,transform] duration-150 ease-out"
                    >
                      <motion.div
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : { scale: [1.0, 1.028, 1.0] }
                        }
                        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-full h-full"
                      >
                        <div
                          ref={imageWrapRef}
                          style={{ transform: 'scale(1.01) translate3d(0px, 0px, 0)' }}
                          className="w-full h-full transition-transform duration-300 ease-out will-change-transform"
                        >
                          <ProjectArtwork
                            key={activeProject.id}
                            variant={activeProject.visualVariant}
                            title={activeProject.title}
                            thumbnailUrl={activeProject.thumbnailUrl}
                            videoUrl={activeProject.videoUrl}
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Digital Fragment Grid Reconstruction Shimmer on Project Swap */}
                    {!shouldReduceMotion && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`shards-${activeProject.id}`}
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 z-10 grid grid-cols-4 grid-rows-3"
                        >
                          {RECONSTRUCTION_FRAGMENTS.map((frag) => (
                            <motion.div
                              key={frag.id}
                              initial={{
                                opacity: 0.92,
                                x: frag.offsetX,
                                y: frag.offsetY,
                                scale: 0.92,
                              }}
                              animate={{
                                opacity: 0,
                                x: 0,
                                y: 0,
                                scale: 1,
                              }}
                              transition={{
                                duration: 0.52,
                                delay: frag.delay,
                                ease: EASE_CINEMATIC,
                              }}
                              className="bg-[#050507] border border-white/[0.06]"
                            />
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* Connected Luminous Particle Break-Apart & Morph Layer */}
                    <ProjectParticleMorphCanvas
                      morphPhaseRef={morphPhaseRef}
                      pointerRef={pointerRef}
                    />

                    {/* Cursor Specular Sheen */}
                    <div
                      ref={spotRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300"
                    />

                    {/* Subtle Edge Frame Vignette (No Text Blocking the Artwork!) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-transparent to-black/20"
                    />

                    {/* Quiet Top-Left Scene Number inside Frame */}
                    <div className="pointer-events-none absolute top-4 left-5 z-20 flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] text-white/75">
                      <span>{chapterCode}</span>
                      <span aria-hidden="true" className="text-white/35">
                        /
                      </span>
                      <span className="text-white/50 tabular-nums">
                        {String(filtered.length).padStart(2, '0')}
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* RIGHT (~35%): Pure High-Whitespace Editorial Spec Block (Zero Card Clutter, Zero Pills) */}
                <div
                  style={{ opacity: visualState.infoOpacity }}
                  className="lg:col-span-4 flex flex-col justify-center space-y-6 transition-opacity duration-200"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeProject.id}
                      initial={
                        shouldReduceMotion
                          ? undefined
                          : { opacity: 0, y: 18, filter: 'blur(4px)' }
                      }
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={
                        shouldReduceMotion
                          ? undefined
                          : { opacity: 0, y: -12, filter: 'blur(4px)' }
                      }
                      transition={{ duration: 0.42, ease: EASE_CINEMATIC }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between text-xs font-mono tracking-[0.22em] text-zinc-500">
                        <span className="text-zinc-200">{chapterCode}</span>
                        <span className="tabular-nums">{activeProject.year}</span>
                      </div>

                      <h4 className="font-display text-3xl sm:text-4xl xl:text-[44px] font-bold tracking-tight leading-[1.06] text-white text-balance">
                        {activeProject.title}
                      </h4>

                      <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
                        {activeProject.shortDescription}
                      </p>

                      {/* Clean Unboxed Specs with Hairlines & Dot Separators */}
                      <div className="pt-5 border-t border-white/[0.1] space-y-3.5 text-xs font-mono">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-500 tracking-[0.16em] uppercase">
                            Category
                          </span>
                          <span className="text-zinc-200 uppercase tracking-[0.12em]">
                            {activeProject.category}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                          <div className="text-zinc-500 tracking-[0.16em] uppercase">
                            Technology
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-zinc-300">
                            {activeProject.tags.slice(0, 4).map((tag, tIdx) => (
                              <React.Fragment key={tag}>
                                <span>{tag}</span>
                                {tIdx < Math.min(activeProject.tags.length, 4) - 1 && (
                                  <span aria-hidden="true" className="text-zinc-700">
                                    ·
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Primary Trigger + Mobile/Quick Chapter Switchers */}
                      <div className="pt-3 flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => handleOpenProject(activeProject)}
                          className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black text-xs font-mono font-semibold tracking-[0.16em] hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <span>VIEW PROJECT</span>
                          <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </button>

                        {filtered.length > 1 && (
                          <div className="flex lg:hidden items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                jumpToChapter((activeIdx - 1 + filtered.length) % filtered.length)
                              }
                              aria-label="Previous project"
                              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-zinc-300 hover:bg-white hover:text-black transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => jumpToChapter((activeIdx + 1) % filtered.length)}
                              aria-label="Next project"
                              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-zinc-300 hover:bg-white hover:text-black transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Minimal Vertical Scene Indicator Rail on Right Edge (01 02 03 04 05) */}
              {filtered.length > 1 && (
                <aside
                  aria-label="Project chapters"
                  className="hidden lg:flex flex-col items-center gap-3 py-4 shrink-0 select-none"
                >
                  <button
                    type="button"
                    onClick={() =>
                      jumpToChapter((activeIdx - 1 + filtered.length) % filtered.length)
                    }
                    aria-label="Previous project chapter"
                    className="w-8 h-8 rounded-full border border-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-black hover:bg-white hover:border-white transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-col items-center gap-3 py-2 border-y border-white/[0.08]">
                    {filtered.map((proj, idx) => {
                      const isCurrent = idx === activeIdx;
                      const num = String(idx + 1).padStart(2, '0');
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => jumpToChapter(idx)}
                          aria-label={`Switch to project ${num}: ${proj.title}`}
                          className={`group flex items-center gap-2 px-1 py-0.5 text-[11px] font-mono tabular-nums transition-all duration-300 ${
                            isCurrent
                              ? 'text-white font-semibold scale-110'
                              : 'text-zinc-600 hover:text-zinc-300'
                          }`}
                        >
                          <span
                            className={`h-px transition-all duration-300 ${
                              isCurrent ? 'w-4 bg-white' : 'w-1.5 bg-zinc-700 group-hover:w-2.5'
                            }`}
                          />
                          <span>{num}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => jumpToChapter((activeIdx + 1) % filtered.length)}
                    aria-label="Next project chapter"
                    className="w-8 h-8 rounded-full border border-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-black hover:bg-white hover:border-white transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </aside>
              )}
            </div>
          </div>
        )}
      </div>
    </RealityDimensionSection>
  );
};
