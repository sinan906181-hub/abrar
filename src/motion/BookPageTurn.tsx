import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { BookSnapshotContext } from './BookSnapshotContext';
import { EASE_CINEMATIC } from './motionSystem';

export interface BookPageMeta {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  order: number;
}

export const BOOK_PAGES: BookPageMeta[] = [
  { id: 'home', number: '01', title: 'HOME', subtitle: 'Prologue', order: 0 },
  { id: 'about', number: '02', title: 'ABOUT', subtitle: 'Identity', order: 1 },
  { id: 'skills', number: '03', title: 'SKILLS', subtitle: 'Craft & Systems', order: 2 },
  { id: 'services', number: '04', title: 'SERVICES', subtitle: 'What I Do', order: 3 },
  { id: 'contact', number: '05', title: 'CONTACT', subtitle: "Let's Create", order: 4 },
];

const TOTAL_BOOK_PAGES_LABEL = String(BOOK_PAGES.length).padStart(2, '0');

export function resolveBookPage(sectionId: string): BookPageMeta {
  return BOOK_PAGES.find((p) => p.id === sectionId) || BOOK_PAGES[0];
}

export interface PageTurnState {
  id: number;
  from: BookPageMeta;
  to: BookPageMeta;
  direction: 1 | -1; // +1 forward (right->left), -1 backward (left->right)
  mode: 'full' | 'light';
}

/**
 * Persistent Subtle Hardcover Book Binding Frame
 * - Left fixed spine depth & crease
 * - Subtle right-edge stacked paper thickness cues
 * - Mouse-responsive ambient page sheen (zero <main> transforms so position: sticky always works)
 */
export const BookBindingFrame: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;

    const onMove = (e: PointerEvent) => {
      targetX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      targetY = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          setMouseTilt({ x: targetX, y: targetY });
        });
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [shouldReduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 hidden md:block">
      {/* Left Fixed Hardcover Spine Crease + Inner Gutter Shadow */}
      <div
        className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/75 via-black/25 to-transparent"
        style={{
          opacity: 0.72 + Math.abs(mouseTilt.x) * 0.16,
        }}
      />
      <div className="absolute inset-y-0 left-[2px] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      {/* Subtle Stacked Page-Thickness Edges on Right Fore-Edge */}
      <div className="absolute inset-y-6 right-0 flex items-stretch gap-[2px] pr-[1px] opacity-65">
        <div className="w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        <div className="w-px bg-gradient-to-b from-transparent via-white/[0.11] to-transparent" />
        <div className="w-px bg-gradient-to-b from-transparent via-white/[0.18] to-transparent" />
      </div>

      {/* Delicate Top-Right Perspective Specular Light reacting to cursor */}
      {!shouldReduceMotion && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(900px circle at ${(50 + mouseTilt.x * 22).toFixed(1)}% ${(45 + mouseTilt.y * 18).toFixed(1)}%, rgba(255,255,255,0.025), transparent 65%)`,
          }}
        />
      )}
    </div>
  );
};

/**
 * Live 3D Physical Book Page-Turn Engine
 * - Forward turn (+1): The ACTUAL visible `from` page physically rotates right-to-left around the left spine
 *   while `to` page sits already live underneath, progressively exposed as the leaf turns past it.
 * - Backward turn (-1): The target previous page lifts from the left spine stack and rotates left-to-right
 *   back down over the current screen until settling flat.
 */
export const BookPageTurnOverlay: React.FC<{
  turn: PageTurnState | null;
  renderPage: (pageId: string) => React.ReactNode;
}> = ({ turn, renderPage }) => {
  const shouldReduceMotion = useReducedMotion();
  const { cms } = useSiteConfig();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const enabled = cms.animations.masterEnabled && cms.animations.pageTransitions !== false;
  const speedMul = Math.max(0.6, Math.min(1.8, cms.animations.transitionSpeed || 1));

  if (!turn || !enabled) return null;

  const isForward = turn.direction === 1;
  const isLight = turn.mode === 'light';
  const duration = isLight ? 0.58 / speedMul : (isMobile ? 0.72 : 1.18) / speedMul;

  // Accessible prefers-reduced-motion fallback: quiet monochrome fade
  if (shouldReduceMotion) {
    return (
      <AnimatePresence>
        <motion.div
          key={turn.id}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.75, 0] }}
          transition={{ duration: isLight ? 0.22 : 0.38, ease: 'easeInOut' }}
          className="pointer-events-none fixed inset-0 z-[75] bg-[#050507]"
        />
      </AnimatePresence>
    );
  }

  // Non-blocking light boundary crease curl on natural scroll wheel crossings
  if (isLight) {
    return (
      <div
        key={turn.id}
        aria-hidden="true"
        style={{ perspective: 2000 }}
        className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
      >
        <motion.div
          initial={{
            x: isForward ? '98%' : '-98%',
            opacity: 0,
            rotateY: isForward ? -16 : 16,
          }}
          animate={{
            x: isForward ? ['98%', '10%', '-100%'] : ['-98%', '-10%', '100%'],
            opacity: [0, 0.34, 0],
            rotateY: isForward ? [-16, -6, 10] : [16, 6, -10],
          }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: '0% 50%',
          }}
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-[#14141A]/55 to-transparent"
        >
          <div
            className={`absolute inset-y-0 ${
              isForward ? 'left-0' : 'right-0'
            } w-[2px] bg-gradient-to-b from-transparent via-white/35 to-transparent`}
          />
        </motion.div>
      </div>
    );
  }

  // Mobile: Compact tactile 3D page turn hinged at left spine carrying live content
  const leafPageId = isForward ? turn.from.id : turn.to.id;
  const leafMeta = isForward ? turn.from : turn.to;

  if (isMobile) {
    return (
      <div
        key={turn.id}
        aria-hidden="true"
        style={{ perspective: 1500, perspectiveOrigin: '20% 50%' }}
        className="fixed inset-0 z-[75] overflow-hidden select-none pointer-events-none"
      >
        {/* Soft Shadow cast onto page underneath */}
        <motion.div
          initial={{ opacity: isForward ? 0.55 : 0 }}
          animate={{
            opacity: isForward ? [0.55, 0.65, 0] : [0, 0.65, 0.18],
          }}
          transition={{ duration, times: [0, 0.45, 1], ease: 'easeInOut' }}
          className="absolute inset-0 bg-black/75"
        />

        {/* Turning Live Page Sheet */}
        <motion.div
          initial={{
            rotateY: isForward ? 0 : -158,
            skewY: 0,
            scale: 1,
          }}
          animate={{
            rotateY: isForward ? [0, -52, -162] : [-158, -58, 0],
            skewY: isForward ? [0, -1.6, 0.6] : [0.6, -1.4, 0],
            scale: isForward ? [1, 0.965, 0.94] : [0.94, 0.97, 1],
          }}
          transition={{
            duration,
            times: [0, 0.44, 1],
            ease: [0.24, 0.86, 0.34, 1],
          }}
          style={{
            transformOrigin: '0% 50%',
            transformStyle: 'preserve-3d',
          }}
          className="absolute inset-0 will-change-transform"
        >
          {/* Front Face: Actual Live Page */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-[#050506]/[0.98] overflow-hidden border-r-2 border-white/30 shadow-[12px_0_48px_rgba(0,0,0,0.95)]"
          >
            <BookSnapshotContext.Provider value={true}>
              <div className="w-full h-full overflow-hidden">
                {renderPage(leafPageId)}
              </div>
            </BookSnapshotContext.Provider>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-white/20 via-white/70 to-white/20" />
            <motion.div
              animate={{ opacity: isForward ? [0, 0.45, 0.7] : [0.7, 0.35, 0] }}
              transition={{ duration }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-white/[0.06]"
            />
          </div>

          {/* Back Verso Face */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 bg-[#121216] border-l border-white/20 flex flex-col justify-between p-8"
          >
            <div className="flex justify-between text-[10px] font-mono tracking-[0.22em] text-zinc-500">
              <span>MONOGRAPH VERSO</span>
              <span>{leafMeta.number}</span>
            </div>
            <div className="font-display text-3xl font-bold text-white/20 tracking-tight">
              {leafMeta.title}
            </div>
            <div className="h-px bg-white/10" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Desktop Full Signature 3D Physical Book Leaf Turning REAL Page Content
  return (
    <div
      key={turn.id}
      aria-hidden="true"
      style={{ perspective: 2800, perspectiveOrigin: '42% 50%' }}
      className="fixed inset-0 z-[75] overflow-hidden select-none pointer-events-none"
    >
      {/* Sweeping Cast Shadow projected onto the already-present destination page underneath */}
      <motion.div
        initial={{
          x: isForward ? '12%' : '-72%',
          opacity: isForward ? 0.65 : 0.12,
        }}
        animate={{
          x: isForward ? ['12%', '-18%', '-88%'] : ['-72%', '-16%', '48%'],
          opacity: isForward ? [0.65, 0.88, 0] : [0.15, 0.84, 0.08],
        }}
        transition={{
          duration,
          times: [0, 0.45, 1],
          ease: [0.24, 0.86, 0.34, 1],
        }}
        className="absolute inset-y-0 w-[62vw] bg-gradient-to-r from-black/95 via-black/75 to-transparent blur-2xl"
      />

      {/* Persistent Left Spine Gutter Compression Shadow during turn */}
      <motion.div
        animate={{ opacity: [0.35, 0.9, 0.25] }}
        transition={{ duration, ease: 'easeInOut' }}
        className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black via-black/65 to-transparent"
      />

      {/* Physical Hinged Turning Leaf anchored cleanly at Left Book Spine (`0% 50%`) */}
      <motion.div
        initial={{
          rotateY: isForward ? 0 : -176,
          skewY: 0,
          scale: 1,
        }}
        animate={{
          rotateY: isForward ? [0, -34, -98, -176] : [-176, -104, -34, 0],
          skewY: isForward ? [0, -1.7, -2.2, -0.5] : [-0.6, -2.0, -1.4, 0],
          scale: isForward ? [1, 0.99, 0.985, 0.992] : [0.992, 0.985, 0.992, 1],
        }}
        transition={{
          duration,
          times: [0, 0.26, 0.62, 1],
          ease: [0.24, 0.86, 0.32, 1],
        }}
        style={{
          transformOrigin: '0% 50%',
          transformStyle: 'preserve-3d',
        }}
        className="absolute inset-0 will-change-transform"
      >
        {/* FRONT LEAF FACE — Actual Visible Website Page Content */}
        <motion.div
          style={{ backfaceVisibility: 'hidden' }}
          animate={{
            filter: ['blur(0px)', 'blur(0.75px)', 'blur(0.45px)', 'blur(0px)'],
          }}
          transition={{ duration, times: [0, 0.35, 0.72, 1] }}
          className="absolute inset-0 bg-[#050506]/[0.965] overflow-hidden border-y border-white/[0.08]"
        >
          {/* Live Rendered Section Snapshot */}
          <BookSnapshotContext.Provider value={true}>
            <div className="w-full h-full overflow-hidden">
              {renderPage(leafPageId)}
            </div>
          </BookSnapshotContext.Provider>

          {/* Subtle Bending Lighting Gradient (darkens near spine fold, brightens along fore-edge arch) */}
          <motion.div
            animate={{
              opacity: isForward ? [0.08, 0.72, 0.9] : [0.85, 0.55, 0.04],
            }}
            transition={{ duration, ease: 'easeInOut' }}
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.11) 88%, rgba(255,255,255,0.22) 100%)',
            }}
            className="pointer-events-none absolute inset-0"
          />

          {/* 3D Extruded Thin Paper Fore-Edge Thickness (`3px` glowing white-silver edge) */}
          <div
            style={{ transform: 'translateZ(2px)' }}
            className="pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-gradient-to-b from-white/35 via-white/85 to-white/30 shadow-[0_0_24px_rgba(255,255,255,0.5)]"
          />

          {/* Subtle Running Monograph Header / Page Folio on Turning Sheet */}
          <div className="pointer-events-none absolute bottom-5 right-8 flex items-center gap-3 text-[10px] font-mono tracking-[0.22em] text-zinc-400">
            <span>PAGE {leafMeta.number}</span>
            <span aria-hidden="true" className="text-zinc-700">
              ·
            </span>
            <span>{leafMeta.title}</span>
          </div>
        </motion.div>

        {/* BACK LEAF VERSO FACE (Revealed Past -90deg as the leaf continues toward left stack) */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 bg-[#111115] border-y border-white/15 overflow-hidden"
        >
          {/* Paper grain & subtle reverse fold gradient */}
          <div
            style={{
              background:
                'linear-gradient(270deg, rgba(0,0,0,0.82) 0%, rgba(26,26,32,0.92) 48%, rgba(255,255,255,0.08) 100%)',
            }}
            className="absolute inset-0"
          />

          {/* Illuminated Outer Fore-Edge of Verso */}
          <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-white/20 via-white/65 to-white/20" />

          {/* Minimal Reverse Editorial Monograph Watermark Details */}
          <div className="relative h-full flex flex-col justify-between px-12 sm:px-16 py-12">
            <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.24em] text-zinc-500">
              <span>{(cms.home.name || 'ABRAR HASSAN').toUpperCase()} · ARCHIVE MONOGRAPH</span>
              <span className="tabular-nums">VERSO {leafMeta.number}</span>
            </div>

            <div className="max-w-lg space-y-2 border-l border-white/15 pl-6">
              <div className="text-[11px] font-mono tracking-[0.22em] text-zinc-500 uppercase">
                {isForward
                  ? `REVEALING ${turn.to.number} / ${TOTAL_BOOK_PAGES_LABEL}`
                  : `RETURNING TO ${turn.to.number} / ${TOTAL_BOOK_PAGES_LABEL}`}
              </div>
              <div className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white/30">
                {turn.to.title}
              </div>
              <div className="text-xs font-mono tracking-[0.2em] text-zinc-500 uppercase">
                {turn.to.subtitle}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-mono tracking-[0.22em] text-zinc-500">
              <span>MONOCHROME DIGITAL ART EDITION</span>
              <span>{isForward ? 'FORWARD LEAF →' : '← RETURN LEAF'}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Minimal Hardcover Folio Indicator (`01 / 06 — HOME`)
 * Compact un-padded architectural index along bottom-left corner.
 */
export const BookPageIndicator: React.FC<{
  activeSection: string;
  onTurnToPage: (sectionId: string) => void;
}> = ({ activeSection, onTurnToPage }) => {
  const shouldReduceMotion = useReducedMotion();
  const current = resolveBookPage(activeSection);

  const currentIdx = BOOK_PAGES.findIndex((p) => p.id === current.id);
  const resolvedIdx = currentIdx >= 0 ? currentIdx : 0;

  const prevPage = resolvedIdx > 0 ? BOOK_PAGES[resolvedIdx - 1] : null;
  const nextPage = resolvedIdx < BOOK_PAGES.length - 1 ? BOOK_PAGES[resolvedIdx + 1] : null;

  return (
    <aside
      aria-label="Digital Book Page Navigation"
      className="fixed bottom-5 left-4 sm:bottom-6 sm:left-8 z-40 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#08080B]/88 backdrop-blur-xl border border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
    >
      <button
        type="button"
        disabled={!prevPage}
        onClick={() => prevPage && onTurnToPage(prevPage.id)}
        aria-label={prevPage ? `Turn to previous page ${prevPage.title}` : 'At first page'}
        className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-300 hover:text-black hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 px-1.5 select-none whitespace-nowrap">
        <div className="relative h-4 overflow-hidden flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current.number}
              initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { y: -10, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_CINEMATIC }}
              className="font-mono text-xs font-semibold text-white tabular-nums tracking-[0.14em]"
            >
              {current.number}
            </motion.span>
          </AnimatePresence>
          <span className="font-mono text-[11px] text-zinc-500 tabular-nums ml-1">
            / {TOTAL_BOOK_PAGES_LABEL}
          </span>
        </div>

        <span aria-hidden="true" className="text-zinc-700 text-xs">
          ·
        </span>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current.title}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 8, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: -8, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_CINEMATIC }}
            className="font-mono text-[11px] tracking-[0.18em] text-zinc-200 uppercase"
          >
            {current.title}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        type="button"
        disabled={!nextPage}
        onClick={() => nextPage && onTurnToPage(nextPage.id)}
        aria-label={nextPage ? `Turn to next page ${nextPage.title}` : 'At final page'}
        className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-300 hover:text-black hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
