import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { AboutArchitectureVisual } from './MonochromeVisuals';
import { AnimatedCounter, HairlineDraw } from '../motion/MotionPrimitives';
import {
  ImpossibleLivingCard,
  RealityDimensionSection,
} from '../motion/ExperimentalEngine';
import { ParticleSectionTitle } from '../motion/ParticleSectionHeader';
import { EASE_CINEMATIC, VIEWPORT_CONFIG } from '../motion/motionSystem';
import { useIsBookSnapshot } from '../motion/BookSnapshotContext';

const CREATIVE_WORLD_PILLARS = [
  {
    index: '01',
    title: 'WEB',
    description: 'Modern websites & digital experiences',
  },
  {
    index: '02',
    title: 'DESIGN',
    description: 'UI/UX & visual design',
  },
  {
    index: '03',
    title: 'MOTION',
    description: 'Creative animation & visual storytelling',
  },
  {
    index: '04',
    title: 'AI',
    description: 'AI-powered ideas & experiments',
  },
];

export const About: React.FC = () => {
  const { cms } = useSiteConfig();
  const visualWrapRef = useRef<HTMLDivElement | null>(null);
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;

  const { scrollYProgress } = useScroll({
    target: visualWrapRef,
    offset: ['start end', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [32, -32]);

  const visibleStats = cms.about.stats.filter((s) => s.visible !== false);
  const timeline = cms.about.timeline || [];
  const tools = cms.about.tools || [];
  const achievements = cms.about.achievements || [];

  return (
    <RealityDimensionSection
      id="about"
      className="py-24 sm:py-32 bg-[#050505]/40 border-b border-white/[0.06] z-10"
    >
      <div className="mx-auto max-w-[1360px] px-6 sm:px-10">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={VIEWPORT_CONFIG}
          transition={{ duration: 0.6, ease: EASE_CINEMATIC }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
        >
          <div className="flex-1">
            <ParticleSectionTitle word={cms.about.sectionLabel || 'ABOUT ME'} />
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {cms.about.heading}
            </h3>
            <p className="mt-3 max-w-2xl text-base sm:text-lg text-zinc-300 leading-relaxed">
              {cms.about.lead}
            </p>
          </div>
          <HairlineDraw className="hidden md:block flex-1 max-w-xs mb-3" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between gap-10">
            <div className="space-y-6">
              {cms.about.paragraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  data-gravity="well"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18, filter: 'blur(4px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={VIEWPORT_CONFIG}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.12,
                    ease: EASE_CINEMATIC,
                  }}
                  className={`text-base leading-[1.75] transition-colors duration-300 ${
                    index === cms.about.paragraphs.length - 1
                      ? 'text-zinc-200 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {paragraph}
                </motion.p>
              ))}

              {cms.about.philosophyQuote && (
                <motion.blockquote
                  data-gravity="gather"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={VIEWPORT_CONFIG}
                  transition={{ duration: 0.6, delay: 0.15, ease: EASE_CINEMATIC }}
                  className="pl-5 py-2 border-l-2 border-white/40 text-sm sm:text-base italic text-zinc-200 leading-relaxed"
                >
                  &ldquo;{cms.about.philosophyQuote}&rdquo;
                </motion.blockquote>
              )}

              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={VIEWPORT_CONFIG}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="pt-5 border-t border-white/[0.08] space-y-2"
              >
                <div className="text-[11px] font-mono tracking-[0.22em] text-zinc-500 uppercase">
                  BASED IN
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="font-semibold text-white">{cms.about.location}</span>
                  <span aria-hidden="true" className="text-zinc-600">
                    ·
                  </span>
                  <span className="text-zinc-300 font-medium">{cms.about.availability}</span>
                </div>
              </motion.div>
            </div>

            <div
              className={`grid gap-4 ${
                visibleStats.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'
              }`}
            >
              {visibleStats.map((stat, idx) => (
                <motion.div
                  key={stat.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={VIEWPORT_CONFIG}
                  transition={{ duration: 0.45, delay: idx * 0.06, ease: EASE_CINEMATIC }}
                >
                  <ImpossibleLivingCard
                    antiGravityFloat
                    floatDelay={idx * 0.35}
                    gravityMode="gather"
                    className="group p-5 sm:p-6 rounded-2xl bg-[#0B0B0D] border border-white/[0.08]"
                  >
                    <div className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                      <AnimatedCounter value={stat.value} />
                    </div>
                    <div className="mt-2 text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {stat.label}
                    </div>
                    {stat.detail && <div className="mt-1 text-xs text-zinc-500">{stat.detail}</div>}
                  </ImpossibleLivingCard>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            ref={visualWrapRef}
            style={shouldReduceMotion ? undefined : { y: imageY }}
            className="lg:col-span-6 flex items-stretch"
          >
            <AboutArchitectureVisual photoUrl={cms.about.photoUrl} />
          </motion.div>
        </div>

        {/* MY CREATIVE WORLD */}
        <div className="mt-20 pt-14 border-t border-white/[0.08] space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-mono text-xs tracking-[0.24em] text-zinc-400 uppercase">
              MY CREATIVE WORLD
            </h4>
            <HairlineDraw className="hidden sm:block flex-1 max-w-md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREATIVE_WORLD_PILLARS.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_CONFIG}
                transition={{ duration: 0.45, delay: idx * 0.07, ease: EASE_CINEMATIC }}
              >
                <ImpossibleLivingCard
                  gravityMode="gather"
                  className="h-full p-6 rounded-2xl bg-[#0B0B0D] border border-white/[0.08] flex flex-col justify-between gap-4"
                >
                  <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-500 tabular-nums">
                    {pillar.index}
                  </span>
                  <div>
                    <div className="font-display text-xl font-bold tracking-tight text-white">
                      {pillar.title}
                    </div>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </ImpossibleLivingCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Optional Experience Timeline, Tools & Achievements if populated in CMS */}
        {(timeline.length > 0 || tools.length > 0 || achievements.length > 0) && (
          <div className="mt-16 pt-14 border-t border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-12">
            {timeline.length > 0 && (
              <div className="lg:col-span-7 space-y-6">
                <div className="text-xs font-mono tracking-[0.2em] text-zinc-400 uppercase">
                  Experience &amp; Craft Progression
                </div>
                <div className="relative pl-6 border-l border-white/[0.12] space-y-8">
                  {timeline.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      data-gravity="well"
                      initial={shouldReduceMotion ? undefined : { opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={VIEWPORT_CONFIG}
                      transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_CINEMATIC }}
                      className="group relative"
                    >
                      <span className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#050505] border border-white/60 group-hover:bg-white group-hover:scale-125 transition-all" />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="font-display text-lg font-semibold text-white group-hover:translate-x-1 transition-transform">
                          {item.title}
                        </h4>
                        <span className="text-xs font-mono text-zinc-400 tabular-nums">
                          {item.year}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs font-mono text-zinc-500">
                        {item.organization}
                      </div>
                      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                        {item.summary}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="lg:col-span-5 flex flex-col justify-between gap-10">
              {tools.length > 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono tracking-[0.2em] text-zinc-400 uppercase">
                    Core Stack &amp; Instruments
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm text-zinc-300">
                    {tools.map((tool, tIdx) => (
                      <React.Fragment key={tool}>
                        <span className="hover:text-white transition-colors">{tool}</span>
                        {tIdx < tools.length - 1 && (
                          <span aria-hidden="true" className="text-zinc-700">
                            ·
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {achievements.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-white/[0.08]">
                  <div className="text-xs font-mono tracking-[0.2em] text-zinc-400 uppercase">
                    Selected Recognition &amp; Milestones
                  </div>
                  <ul className="space-y-3">
                    {achievements.map((ach, idx) => (
                      <motion.li
                        key={ach}
                        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={VIEWPORT_CONFIG}
                        transition={{ duration: 0.4, delay: idx * 0.06, ease: EASE_CINEMATIC }}
                        className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed"
                      >
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/75 shrink-0" />
                        <span>{ach}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RealityDimensionSection>
  );
};
