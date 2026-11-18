import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { SkillCategory } from '../types/cms';
import { SkillIcon } from './Icons';
import {
  ImpossibleLivingCard,
  RealityDimensionSection,
} from '../motion/ExperimentalEngine';
import { ParticleSectionTitle } from '../motion/ParticleSectionHeader';
import { EASE_CINEMATIC, SPRING_TILT, VIEWPORT_CONFIG } from '../motion/motionSystem';
import { useIsBookSnapshot } from '../motion/BookSnapshotContext';

const SKILL_FILTERS: ('All' | SkillCategory)[] = ['All', 'Development', 'Design', 'Motion', 'AI'];

interface OrbitNode {
  id: string;
  label: string;
  category: SkillCategory;
  ring: 'inner' | 'outer';
  baseAngle: number;
}

const ORBIT_NODES: OrbitNode[] = [
  { id: 'web', label: 'WEB DEVELOPMENT', category: 'Development', ring: 'outer', baseAngle: 0 },
  { id: 'uiux', label: 'UI/UX DESIGN', category: 'Design', ring: 'inner', baseAngle: Math.PI * 0.66 },
  { id: 'graphic', label: 'GRAPHIC DESIGN', category: 'Design', ring: 'outer', baseAngle: Math.PI * 0.66 },
  { id: 'video', label: 'VIDEO EDITING', category: 'Motion', ring: 'inner', baseAngle: Math.PI * 1.33 },
  { id: 'motion', label: 'MOTION DESIGN', category: 'Motion', ring: 'outer', baseAngle: Math.PI * 1.33 },
  { id: 'ai', label: 'AI & CREATIVE TECH', category: 'AI', ring: 'inner', baseAngle: 0 },
];

const SkillsOrbitSystem: React.FC<{
  activeCategory: 'All' | SkillCategory;
  onSelectCategory: (cat: 'All' | SkillCategory) => void;
}> = ({ activeCategory, onSelectCategory }) => {
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const hoveredRef = useRef(false);

  const tiltX = useSpring(0, SPRING_TILT);
  const tiltY = useSpring(0, SPRING_TILT);

  useEffect(() => {
    hoveredRef.current = hoveredId !== null;
  }, [hoveredId]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (document.hidden) {
        lastTime = now;
        return;
      }
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const speed = hoveredRef.current ? 0.06 : 0.22;
      setPhase((p) => p + dt * speed);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldReduceMotion]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(-ny * 8);
    tiltY.set(nx * 8);
  };

  return (
    <div
      ref={stageRef}
      data-cursor="gravity"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        tiltX.set(0);
        tiltY.set(0);
      }}
      className="relative mb-14 rounded-3xl border border-white/[0.08] bg-[#050506]/90 overflow-hidden px-4 py-8 sm:p-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <span className="text-xs font-mono tracking-[0.2em] text-zinc-400">
          ORBITAL DISCIPLINE MAP
        </span>
        <span className="text-xs font-mono text-zinc-500">
          Click any orbiting node to isolate · Core resets filter
        </span>
      </div>

      {/* Desktop / Tablet Orbital Arena */}
      <motion.div
        style={
          shouldReduceMotion
            ? undefined
            : { transformPerspective: 1100, rotateX: tiltX, rotateY: tiltY }
        }
        className="relative mx-auto w-full max-w-[780px] h-[340px] sm:h-[390px] flex items-center justify-center"
      >
        {/* Concentric Elliptical Rings */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-[88%] max-w-[660px] h-[250px] sm:h-[290px] rounded-full border border-white/[0.09]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-[60%] max-w-[430px] h-[165px] sm:h-[190px] rounded-full border border-dashed border-white/[0.12]"
        />

        {/* Central Glowing White Singularity Core */}
        <button
          type="button"
          onClick={() => onSelectCategory('All')}
          aria-label="Reset skills filter to All"
          className="relative z-20 group w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white text-black flex flex-col items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.34)] hover:scale-105 transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#050505]"
        >
          <motion.span
            aria-hidden="true"
            animate={
              shouldReduceMotion ? undefined : { scale: [1, 1.24, 1], opacity: [0.45, 0.1, 0.45] }
            }
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -inset-3 rounded-full border border-white/50"
          />
          <span className="font-mono text-[10px] tracking-[0.2em] font-semibold">ALL</span>
          <span className="font-display text-sm font-bold tracking-tight">SYSTEMS</span>
        </button>

        {/* Orbiting Discipline Nodes */}
        {ORBIT_NODES.map((node) => {
          const isOuter = node.ring === 'outer';
          const angle =
            node.baseAngle + (shouldReduceMotion ? 0 : isOuter ? phase : -phase * 1.25);
          const rxPct = isOuter ? 43 : 29;
          const ryPct = isOuter ? 38 : 24;
          const xPct = 50 + Math.cos(angle) * rxPct;
          const yPct = 50 + Math.sin(angle) * ryPct;
          const selected = activeCategory === node.category;
          const isNodeHovered = hoveredId === node.id;

          return (
            <button
              key={node.id}
              type="button"
              data-gravity="well"
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() =>
                onSelectCategory(activeCategory === node.category ? 'All' : node.category)
              }
              style={{
                left: `${xPct.toFixed(2)}%`,
                top: `${yPct.toFixed(2)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-[10px] sm:text-[11px] font-mono tracking-[0.14em] whitespace-nowrap shrink-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                selected || isNodeHovered
                  ? 'bg-white text-black border-white shadow-[0_0_24px_rgba(255,255,255,0.35)] scale-105'
                  : 'bg-[#0C0C0E]/90 text-zinc-200 border-white/20 hover:border-white/55'
              }`}
            >
              {node.label}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};

export const Skills: React.FC = () => {
  const { cms } = useSiteConfig();
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;
  const [activeCategory, setActiveCategory] = useState<'All' | SkillCategory>('All');

  const visibleSkills = useMemo(
    () => cms.skills.items.filter((s) => s.visible !== false),
    [cms.skills.items]
  );

  const filteredSkills = useMemo(() => {
    if (activeCategory === 'All') return visibleSkills;
    return visibleSkills.filter((skill) => skill.category === activeCategory);
  }, [activeCategory, visibleSkills]);

  return (
    <RealityDimensionSection
      id="skills"
      antiGravity
      portalEntrance
      className="py-24 sm:py-32 bg-[#08080A]/55 border-b border-white/[0.06] overflow-hidden z-10"
    >
      {/* Subtle rotating orbital geometry backdrop */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute -top-48 -right-48 w-[540px] h-[540px] rounded-full border border-white/[0.04]"
        />
      )}

      <div className="relative mx-auto max-w-[1360px] px-6 sm:px-10">
        {/* Header + Filter Controls */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={VIEWPORT_CONFIG}
          transition={{ duration: 0.55, ease: EASE_CINEMATIC }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12"
        >
          <div className="flex-1">
            <ParticleSectionTitle word={cms.skills.sectionLabel || 'SKILLS'} />
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {cms.skills.heading}
            </h3>
            <p className="mt-2 max-w-xl text-base text-zinc-400 leading-relaxed">
              {cms.skills.description}
            </p>
          </div>

          {/* Interactive Filter Segmented Control */}
          <div
            role="tablist"
            aria-label="Filter skills by discipline"
            className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0F0F12] border border-white/[0.08] self-start lg:self-auto"
          >
            {SKILL_FILTERS.map((category) => {
              const selected = activeCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setActiveCategory(category)}
                  className={`relative px-4 py-2 text-xs font-medium rounded-lg transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    selected ? 'text-black' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="skills-active-tab"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-white rounded-lg"
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Interactive Skills Orbit System */}
        <SkillsOrbitSystem
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Anti-Gravity Floating Living Cards with Orbital Mastery Rings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredSkills.map((skill, idx) => {
            const pct = Math.max(10, Math.min(100, skill.percentage || 90));
            const radius = 19;
            const circ = 2 * Math.PI * radius;
            const dashOffset = circ * (1 - pct / 100);

            return (
              <motion.div
                key={skill.id}
                layout
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={VIEWPORT_CONFIG}
                transition={{ duration: 0.45, delay: Math.min(idx * 0.03, 0.24), ease: EASE_CINEMATIC }}
              >
                <ImpossibleLivingCard
                  antiGravityFloat
                  gravityMode="gather"
                  floatDelay={(idx % 4) * 0.45}
                  className="group p-6 rounded-2xl bg-[#0B0B0D] border border-white/[0.08] flex flex-col justify-between"
                >
                  {/* Sweeping monochrome highlight */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent rotate-12 translate-x-[-130%] group-hover:translate-x-[130%] transition-transform duration-1000 ease-out"
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200 group-hover:bg-white group-hover:text-black group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                        <SkillIcon
                          iconKey={skill.iconKey}
                          customIconUrl={skill.customIconUrl}
                          className="w-5 h-5"
                        />
                      </div>

                      {/* Sculptural Orbital SVG Mastery Ring */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90" aria-hidden="true">
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="2"
                          />
                          <motion.circle
                            cx="24"
                            cy="24"
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.85)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            initial={shouldReduceMotion ? { strokeDashoffset: dashOffset } : { strokeDashoffset: circ }}
                            whileInView={{ strokeDashoffset: dashOffset }}
                            viewport={VIEWPORT_CONFIG}
                            transition={{ duration: 0.9, delay: 0.1 + idx * 0.03, ease: EASE_CINEMATIC }}
                          />
                        </svg>
                        <span className="absolute text-[10px] font-mono text-zinc-200 tabular-nums">
                          {pct}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-semibold text-white tracking-tight group-hover:tracking-normal transition-all duration-300">
                      {skill.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      {skill.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span className="uppercase tracking-[0.14em]">{skill.category}</span>
                    <span className="text-zinc-400 tabular-nums group-hover:text-white transition-colors">
                      {pct}% MASTERY
                    </span>
                  </div>
                </ImpossibleLivingCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </RealityDimensionSection>
  );
};
