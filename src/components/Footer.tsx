import React, { useState } from 'react';
import { ArrowUp, RotateCcw, Shield } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { BrandMark, SocialIcon } from './Icons';
import { HairlineDraw, MagneticWrapper } from '../motion/MotionPrimitives';
import { EASE_CINEMATIC, VIEWPORT_CONFIG } from '../motion/motionSystem';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onReplayIntro?: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onReplayIntro,
  onOpenAdmin,
}) => {
  const { cms } = useSiteConfig();
  const shouldReduceMotion = useReducedMotion();
  const [reversing, setReversing] = useState(false);

  const navItems = cms.navigation.items.filter((item) => item.visible !== false);
  const visibleSocials = cms.contactInfo.socials.filter((s) => s.visible !== false);

  const handleReturnToOrigin = () => {
    if (!shouldReduceMotion) {
      setReversing(true);
      setTimeout(() => setReversing(false), 900);
    }
    onNavigate('home');
  };

  return (
    <footer className="relative bg-[#050505]/55 py-16 z-10 overflow-hidden">
      <AnimatePresence>
        {reversing && !shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: EASE_CINEMATIC }}
            className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
          >
            {Array.from({ length: 24 }).map((_, i) => {
              const leftPct = ((i * 37) % 92) + 4;
              return (
                <motion.span
                  key={i}
                  initial={{ y: '95vh', opacity: 0.85, scale: 1 }}
                  animate={{ y: '-12vh', opacity: 0, scale: 0.4 }}
                  transition={{
                    duration: 0.75 + (i % 4) * 0.08,
                    delay: (i % 5) * 0.03,
                    ease: EASE_CINEMATIC,
                  }}
                  style={{ left: `${leftPct}%` }}
                  className="absolute w-1 h-6 rounded-full bg-gradient-to-t from-transparent via-white to-white/80"
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.25, 0.5, 0.25], scale: [0.98, 1.04, 0.98] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[720px] h-48 rounded-full bg-white/[0.04] blur-3xl"
        />
      )}

      <div className="relative mx-auto max-w-[1360px] px-6 sm:px-10">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_CONFIG}
          transition={{ duration: 0.55, ease: EASE_CINEMATIC }}
          className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 pb-12"
        >
          <div className="max-w-sm space-y-4">
            <MagneticWrapper strength={0.2}>
              <motion.a
                href="#home"
                data-gravity="well"
                animate={shouldReduceMotion ? undefined : { y: [0, -3, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                onClick={(e) => {
                  e.preventDefault();
                  handleReturnToOrigin();
                }}
                className="inline-flex items-center gap-3 text-white group"
              >
                <BrandMark
                  logoUrl={cms.settings.logoUrl}
                  className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
                <span className="font-display text-lg font-semibold tracking-tight">
                  {cms.home.name}
                </span>
              </motion.a>
            </MagneticWrapper>
            <p className="text-sm leading-relaxed text-zinc-400">{cms.footer.tagline}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-10 sm:gap-14">
            <div>
              <h3 className="text-xs font-medium text-zinc-500 mb-4">Navigation</h3>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      data-gravity="well"
                      onClick={(e) => {
                        if (item.href.startsWith('#')) {
                          e.preventDefault();
                          onNavigate(item.href.slice(1));
                        }
                      }}
                      className="text-zinc-300 hover:text-white hover:translate-x-0.5 inline-block transition-all duration-200"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-medium text-zinc-500 mb-4">Connect</h3>
              <div className="flex flex-wrap items-center gap-2.5">
                {visibleSocials.map((social) => (
                  <MagneticWrapper key={social.id} strength={0.28}>
                    <motion.a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      data-gravity="gather"
                      aria-label={social.label}
                      title={social.label}
                      whileHover={{ y: -2, scale: 1.1, rotate: 6 }}
                      whileTap={{ scale: 0.92 }}
                      className="w-10 h-10 rounded-full border border-white/[0.1] bg-[#0A0A0C] flex items-center justify-center text-zinc-400 hover:text-black hover:bg-white hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.28)] transition-all duration-200"
                    >
                      <SocialIcon
                        platform={social.platform}
                        customIconUrl={social.customIconUrl}
                        className="w-4 h-4"
                      />
                    </motion.a>
                  </MagneticWrapper>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end justify-end gap-2.5">
              {onReplayIntro && cms.footer.showReplayIntro !== false && !shouldReduceMotion && (
                <MagneticWrapper strength={0.22}>
                  <motion.button
                    type="button"
                    data-gravity="avoid"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onReplayIntro}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/12 bg-transparent text-xs font-mono text-zinc-400 hover:text-white hover:border-white/40 transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-90" />
                    <span>Replay Intro</span>
                  </motion.button>
                </MagneticWrapper>
              )}

              <MagneticWrapper strength={0.25}>
                <motion.button
                  type="button"
                  data-gravity="avoid"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReturnToOrigin}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/15 bg-[#0A0A0C] text-xs font-mono text-zinc-300 hover:text-black hover:bg-white hover:border-white transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>Return to Origin</span>
                  <ArrowUp className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
                </motion.button>
              </MagneticWrapper>
            </div>
          </div>
        </motion.div>

        <HairlineDraw />

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <p>{cms.footer.copyright}</p>
          <div className="flex items-center gap-5">
            <p className="text-zinc-400">{cms.footer.craftNote}</p>
            {onOpenAdmin && (
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenAdmin();
                }}
                className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors font-mono"
              >
                <Shield className="w-3 h-3" />
                <span>Admin Portal</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
