import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { ProjectVisualVariant, ServiceCmsItem, ServiceIconKey } from '../types/cms';
import { ServiceIcon } from './Icons';
import { ProjectArtwork } from './MonochromeVisuals';
import { HairlineDraw } from '../motion/MotionPrimitives';
import { RealityDimensionSection } from '../motion/ExperimentalEngine';
import { ParticleSectionTitle } from '../motion/ParticleSectionHeader';
import { EASE_CINEMATIC, SPRING_CURSOR, VIEWPORT_CONFIG } from '../motion/motionSystem';
import { useIsBookSnapshot } from '../motion/BookSnapshotContext';

interface ServicesProps {
  onSelectService: (serviceTitle: string) => void;
}

const SERVICE_VISUAL_MAP: Record<ServiceIconKey, ProjectVisualVariant> = {
  web: 'monolith',
  uiux: 'vespera',
  creative: 'forma',
  video: 'kinetix',
  motion: 'nocturne',
  ai: 'aether',
};

const ServiceHoverSignature: React.FC<{ iconKey: ServiceIconKey }> = ({ iconKey }) => {
  switch (iconKey) {
    case 'web':
      return (
        <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-zinc-400">
          <span className="w-2 h-2 border border-white/60 animate-spin" />
          <span className="tracking-[0.18em]">DOM · RENDER</span>
        </div>
      );
    case 'uiux':
      return (
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
          <span className="w-3 h-3 rounded-full border border-white/60" />
          <span className="w-3 h-3 rounded-sm border border-white/40 -ml-2" />
          <span className="tracking-[0.18em]">GRID · TOKENS</span>
        </div>
      );
    case 'creative':
      return (
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
          <span className="w-5 h-px bg-white/70" />
          <span className="tracking-[0.18em]">FORM · CONTRAST</span>
        </div>
      );
    case 'video':
      return (
        <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-zinc-400">
          {[10, 16, 8, 14, 10].map((h, idx) => (
            <span
              key={idx}
              style={{ height: `${h}px` }}
              className="w-[2px] bg-white/70 rounded-full animate-pulse"
            />
          ))}
          <span className="ml-1 tracking-[0.18em]">24 FPS</span>
        </div>
      );
    case 'motion':
      return (
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
          <span className="tracking-[0.18em]">KINETIC · ARC</span>
        </div>
      );
    case 'ai':
      return (
        <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-white/75" />
          <span className="w-4 h-px bg-white/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/75" />
          <span className="ml-1 tracking-[0.18em]">NEURAL · FLOW</span>
        </div>
      );
  }
};

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  const { cms } = useSiteConfig();
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;
  const [hoveredService, setHoveredService] = useState<ServiceCmsItem | null>(null);

  const visibleServices = cms.services.items.filter((s) => s.visible !== false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const previewX = useSpring(rawX, SPRING_CURSOR);
  const previewY = useSpring(rawY, SPRING_CURSOR);
  const tilt = useSpring(0, { stiffness: 180, damping: 24 });
  const skew = useTransform(tilt, [-12, 12], [-4, 4]);

  const handleListPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const prevX = rawX.get();
    const dx = e.clientX - prevX;
    rawX.set(e.clientX + 28);
    rawY.set(e.clientY - 115);
    tilt.set(Math.max(-12, Math.min(12, dx * 0.45)));
  };

  const floatingPreview =
    typeof document !== 'undefined' && !shouldReduceMotion
      ? createPortal(
          <AnimatePresence>
            {hoveredService && (
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.72, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.76, filter: 'blur(8px)' }}
                transition={{ duration: 0.28, ease: EASE_CINEMATIC }}
                style={{
                  x: previewX,
                  y: previewY,
                  skewX: skew,
                  rotateZ: skew,
                }}
                className="pointer-events-none hidden lg:block fixed top-0 left-0 z-40 w-[290px] h-[196px] rounded-2xl overflow-hidden border border-white/25 bg-[#070709] shadow-[0_28px_80px_rgba(0,0,0,0.92)]"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hoveredService.id}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.24, ease: EASE_CINEMATIC }}
                    className="w-full h-full"
                  >
                    <ProjectArtwork
                      variant={SERVICE_VISUAL_MAP[hoveredService.iconKey] || 'monolith'}
                      title={hoveredService.title}
                      thumbnailUrl={hoveredService.imageUrl}
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(5,5,5,0.85)_100%)]" />
                <div className="pointer-events-none absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                  <span>{hoveredService.title.toUpperCase()}</span>
                  <span>{hoveredService.index}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <RealityDimensionSection
      id="services"
      silenceOnFirstEnter
      className="py-24 sm:py-32 bg-[#08080A]/55 border-b border-white/[0.06] z-10 overflow-hidden"
    >
      {floatingPreview}

      <div className="mx-auto max-w-[1360px] px-6 sm:px-10">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={VIEWPORT_CONFIG}
          transition={{ duration: 0.55, ease: EASE_CINEMATIC }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
        >
          <div className="flex-1">
            <ParticleSectionTitle
              word={
                !cms.services.sectionLabel || cms.services.sectionLabel === 'SERVICES'
                  ? 'WHAT I DO'
                  : cms.services.sectionLabel
              }
            />
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {cms.services.heading}
            </h3>
            <p className="mt-2 max-w-xl text-base text-zinc-400 leading-relaxed">
              {cms.services.description}
            </p>
          </div>
          <HairlineDraw className="hidden md:block flex-1 max-w-xs mb-3" />
        </motion.div>

        <div
          onPointerMove={handleListPointerMove}
          onPointerLeave={() => {
            setHoveredService(null);
            tilt.set(0);
          }}
          className="divide-y divide-white/[0.08] border-y border-white/[0.08]"
        >
          {visibleServices.map((service, idx) => {
            const isHovered = hoveredService?.id === service.id;
            const isDimmed = hoveredService !== null && !isHovered;

            return (
              <motion.div
                key={service.id}
                data-gravity="gather"
                data-cursor="open"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_CONFIG}
                transition={{
                  duration: 0.45,
                  delay: Math.min(idx * 0.04, 0.24),
                  ease: EASE_CINEMATIC,
                }}
                onMouseEnter={() => setHoveredService(service)}
                className={`group relative transition-opacity duration-300 ${
                  isDimmed ? 'opacity-45' : 'opacity-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectService(service.title)}
                  className="w-full text-left py-7 sm:py-9 px-2 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300 hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-xl"
                >
                  <div className="flex-1 min-w-0 flex items-start sm:items-center gap-5 sm:gap-8">
                    <span className="font-mono text-sm sm:text-base text-zinc-500 tabular-nums transition-all duration-300 group-hover:text-white group-hover:scale-125 origin-left">
                      {service.index || `${String(idx + 1).padStart(2, '0')}.`}
                    </span>

                    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200 group-hover:bg-white group-hover:text-black group-hover:rotate-6 group-hover:scale-105 transition-all duration-300 shrink-0">
                      <ServiceIcon
                        iconKey={service.iconKey}
                        customIconUrl={service.customIconUrl}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                        {service.title}
                      </h3>
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 self-end md:self-center shrink-0">
                    <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <ServiceHoverSignature iconKey={service.iconKey} />
                    </div>
                    <span className="hidden sm:inline-block text-xs font-mono tracking-[0.14em] text-zinc-500 group-hover:text-white transition-colors uppercase">
                      {service.buttonLabel || 'INQUIRE'}
                    </span>
                    <span className="w-11 h-11 rounded-full border border-white/[0.12] flex items-center justify-center text-zinc-300 group-hover:text-black group-hover:bg-white group-hover:border-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </button>

                <div
                  aria-hidden="true"
                  className="pointer-events-none h-px w-0 bg-gradient-to-r from-white/75 via-white/30 to-transparent group-hover:w-full transition-all duration-500 ease-out"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </RealityDimensionSection>
  );
};
