import React, { useRef } from 'react';
import { ArrowRight, Mouse, User } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { SocialIcon } from './Icons';
import { HeroPortraitVisual } from './MonochromeVisuals';
import { MagneticWrapper } from '../motion/MotionPrimitives';
import {
  BlackHoleButton,
} from '../motion/ExperimentalEngine';
import { ParticleText } from '../motion/ParticleSectionHeader';
import { ParticleUniverseStage } from '../motion/ParticleUniverse';
import { EASE_CINEMATIC } from '../motion/motionSystem';
import { useIsBookSnapshot } from '../motion/BookSnapshotContext';

interface HeroProps {
  onNavigate: (sectionId: string) => void;
  revealed?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, revealed = true }) => {
  const { cms } = useSiteConfig();
  const sectionRef = useRef<HTMLElement | null>(null);
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;

  const dockLinks = cms.contactInfo.socials.filter(
    (item) => item.visible !== false && item.showInDock !== false
  );
  const visibleCtas = cms.home.ctas.filter((c) => c.visible !== false);

  const { scrollY } = useScroll();
  const scrollVel = useVelocity(scrollY);
  const smoothVel = useSpring(scrollVel, { stiffness: 150, damping: 28 });

  // Scroll-velocity typography stretch & line elongation
  const titleScaleX = useTransform(smoothVel, [-2400, 0, 2400], [1.06, 1, 1.06]);
  const lineWidthScale = useTransform(smoothVel, [-2400, 0, 2400], [1.65, 1, 1.65]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 115,
    damping: 26,
    mass: 0.35,
  });

  const textParallaxY = useTransform(smoothScroll, [0, 1], [0, 56]);
  const portraitParallaxY = useTransform(smoothScroll, [0, 1], [0, -34]);
  const heroScale = useTransform(smoothScroll, [0, 0.14, 0.88, 1], [1, 1, 0.962, 0.95]);
  const heroOpacity = useTransform(smoothScroll, [0, 0.16, 0.84, 1], [1, 1, 0.22, 0.06]);
  const heroRecessY = useTransform(smoothScroll, [0, 1], [0, 36]);
  const heroBlur = useTransform(
    smoothScroll,
    [0, 0.28, 0.88, 1],
    ['blur(0px)', 'blur(0px)', 'blur(3.5px)', 'blur(5px)']
  );

  const activeReveal = shouldReduceMotion || revealed;

  return (
    <section
      ref={sectionRef}
      id={isBookSnapshot ? undefined : 'home'}
      className="relative min-h-screen flex flex-col justify-between bg-transparent pt-24 pb-0 overflow-hidden"
    >
      {/* Optional CMS Hero Background Image */}
      {cms.home.heroBackgroundUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 grayscale bg-cover bg-center"
          style={{ backgroundImage: `url(${cms.home.heroBackgroundUrl})` }}
        />
      )}

      {/* 1. Background Volumetric Monochrome Light Beams */}
      <motion.div
        aria-hidden="true"
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: activeReveal ? 0.45 : 0 }}
        transition={{ duration: 0.7, delay: 0.05, ease: EASE_CINEMATIC }}
        className="pointer-events-none absolute top-0 right-0 w-[70vw] h-[80vh]"
        style={{
          background:
            'radial-gradient(ellipse at 72% 28%, rgba(255,255,255,0.09), rgba(255,255,255,0.02) 45%, transparent 75%)',
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={shouldReduceMotion ? undefined : { opacity: [0.06, 0.14, 0.06], x: [-20, 20, -20] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-32 left-1/4 w-[480px] h-[900px] rotate-[24deg] bg-gradient-to-b from-white/15 via-white/[0.02] to-transparent blur-3xl"
      />

      <motion.div
        style={
          shouldReduceMotion
            ? undefined
            : {
                opacity: heroOpacity,
                scale: heroScale,
                y: heroRecessY,
                filter: heroBlur,
                transformOrigin: '50% 42%',
              }
        }
        className="relative mx-auto w-full max-w-[1360px] px-6 sm:px-10 flex-1 flex items-center z-10 will-change-transform"
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-stretch py-6 lg:py-10">
          {/* Left Column: Staggered Post-Intro Reveal (Badge -> Name -> Roles -> Copy -> Buttons) */}
          <motion.div
            style={shouldReduceMotion ? undefined : { y: textParallaxY }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            <motion.p
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={
                activeReveal
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 14, filter: 'blur(4px)' }
              }
              transition={{ duration: 0.55, delay: activeReveal ? 0.32 : 0, ease: EASE_CINEMATIC }}
              className="text-sm font-medium text-zinc-300 tracking-wide mb-5"
            >
              {cms.home.kicker}
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={
                activeReveal
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 18, filter: 'blur(6px)' }
              }
              transition={{ duration: 0.65, delay: activeReveal ? 0.35 : 0, ease: EASE_CINEMATIC }}
              style={
                shouldReduceMotion
                  ? undefined
                  : { scaleX: titleScaleX, transformOrigin: 'left center' }
              }
              className="relative group/hero-title block w-full"
            >
              <ParticleText
                as="h1"
                size="hero"
                text={cms.home.name}
                revealed={activeReveal}
                className="w-full"
              />
              {!shouldReduceMotion && (
                <motion.div
                  aria-hidden="true"
                  animate={{ x: ['-110%', '220%'] }}
                  transition={{ duration: 4.8, repeat: Infinity, repeatDelay: 2.8, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 mix-blend-overlay"
                />
              )}
            </motion.div>

            <p className="mt-5 text-lg sm:text-xl md:text-2xl font-normal text-zinc-200 tracking-wide">
              {cms.home.roles.join('  •  ')}
            </p>

            {cms.home.heroSubtitle && (
              <p className="mt-2 text-xs font-mono tracking-[0.14em] text-zinc-500">
                {cms.home.heroSubtitle}
              </p>
            )}

            <motion.p
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={
                activeReveal
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 16, filter: 'blur(4px)' }
              }
              transition={{ duration: 0.6, delay: activeReveal ? 0.64 : 0, ease: EASE_CINEMATIC }}
              className="mt-5 max-w-xl text-base sm:text-[17px] leading-relaxed text-zinc-400"
            >
              {cms.home.heroDescription}
            </motion.p>

            {/* Dynamic CMS CTA Buttons */}
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={activeReveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.55, delay: activeReveal ? 0.74 : 0, ease: EASE_CINEMATIC }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              {visibleCtas.map((cta) => {
                const isPrimary = cta.variant === 'primary';
                const handleCtaClick = (e: React.MouseEvent<HTMLElement>) => {
                  if (cta.href.startsWith('#')) {
                    e.preventDefault();
                    onNavigate(cta.href.slice(1));
                  }
                };
                if (isPrimary) {
                  return (
                    <MagneticWrapper key={cta.id} strength={0.3}>
                      <BlackHoleButton
                        href={cta.href}
                        onClick={handleCtaClick}
                        className="group overflow-hidden px-7 py-3.5 text-sm font-semibold bg-white text-black rounded-full hover:shadow-[0_0_38px_rgba(255,255,255,0.34)] transition-shadow duration-300 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                      >
                        <span>{cta.label}</span>
                        <ArrowRight
                          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                          strokeWidth={2}
                        />
                      </BlackHoleButton>
                    </MagneticWrapper>
                  );
                }
                return (
                  <MagneticWrapper key={cta.id} strength={0.24}>
                    <motion.a
                      href={cta.href}
                      data-gravity="avoid"
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCtaClick}
                      className="group relative overflow-hidden inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-medium text-zinc-100 border border-white/20 rounded-full hover:border-white/55 hover:bg-white/[0.06] transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span>{cta.label}</span>
                      <User
                        className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors"
                        strokeWidth={1.8}
                      />
                    </motion.a>
                  </MagneticWrapper>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right Column: Broken Physics Portrait (Step 2 of Hero Reveal) */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
            animate={activeReveal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.8, delay: activeReveal ? 0.16 : 0, ease: EASE_CINEMATIC }}
            style={shouldReduceMotion ? undefined : { y: portraitParallaxY }}
            className="lg:col-span-6 flex items-stretch"
          >
            <HeroPortraitVisual photoUrl={cms.home.profilePhotoUrl} altName={cms.home.name} />
          </motion.div>
        </div>

        {/* Vertical Magnetic Social Dock */}
        {!isBookSnapshot && (
          <motion.aside
            aria-label="Social Media Links"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={activeReveal ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: activeReveal ? 0.82 : 0, ease: EASE_CINEMATIC }}
            className="hidden xl:flex flex-col items-center gap-3 fixed right-7 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-[#0C0C0E]/85 backdrop-blur-md border border-white/[0.1] shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
          >
          {dockLinks.map((social) => (
            <MagneticWrapper key={social.id} strength={0.35}>
              <motion.a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                title={social.label}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <SocialIcon
                  platform={social.platform}
                  customIconUrl={social.customIconUrl}
                  className="w-4 h-4"
                />
              </motion.a>
            </MagneticWrapper>
          ))}
          </motion.aside>
        )}
      </motion.div>

      {/* Scroll Indicator with Velocity-Reactive Line */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0 }}
        animate={activeReveal ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: activeReveal ? 0.88 : 0 }}
        className="relative z-10 mx-auto w-full max-w-[1360px] px-6 sm:px-10 pt-4 pb-6 flex items-center justify-between gap-6"
      >
        <MagneticWrapper strength={0.2}>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="group inline-flex items-center gap-3 text-xs font-medium text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-md py-1"
          >
            <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/15 group-hover:border-white/50 transition-colors">
              <motion.span
                animate={shouldReduceMotion ? undefined : { y: [0, 2.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Mouse className="w-3.5 h-3.5" strokeWidth={1.6} />
              </motion.span>
            </span>
            <span>Scroll Down</span>
            <motion.span
              style={
                shouldReduceMotion
                  ? undefined
                  : { scaleX: lineWidthScale, transformOrigin: 'left center' }
              }
              className="hidden sm:inline-block w-12 h-px bg-white/30 group-hover:bg-white/75 transition-colors duration-300"
            />
          </button>
        </MagneticWrapper>

        <div className="flex xl:hidden items-center gap-2.5">
          {dockLinks.map((social) => (
            <a
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/40 transition-colors"
            >
              <SocialIcon
                platform={social.platform}
                customIconUrl={social.customIconUrl}
                className="w-3.5 h-3.5"
              />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Main Experimental Particle Universe Frame + 3-Layer Velocity Marquee */}
      {!isBookSnapshot && <ParticleUniverseStage />}

      {/* Soft continuous atmospheric bottom fade into About */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#050505]/70 z-[5]"
      />
    </section>
  );
};
