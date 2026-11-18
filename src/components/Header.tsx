import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { BrandMark, SocialIcon } from './Icons';
import { MagneticWrapper } from '../motion/MotionPrimitives';
import { EASE_CINEMATIC, EASE_CURTAIN } from '../motion/motionSystem';

interface HeaderProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  revealed?: boolean;
}

const MobileDrawerParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles = Array.from({ length: 58 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() * 1.5 + 0.6,
      alpha: 0.16 + Math.random() * 0.34,
      phase: i * 0.7,
    }));

    const pointer = { x: width * 0.5, y: height * 0.4, active: false };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onPointerDown = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      for (const p of particles) {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const d = Math.hypot(dx, dy);
        if (d < 140 && d > 1) {
          p.vx += (dx / d) * 2.4;
          p.vy += (dy / d) * 2.4;
        }
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    let t = 0;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (document.hidden) return;
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 130 && d > 8) {
            p.vx += (dx / d) * 0.03 + (-dy / d) * 0.04;
            p.vy += (dy / d) * 0.03 + (dx / d) * 0.04;
          }
        }
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx + Math.cos(t + p.phase) * 0.18;
        p.y += p.vy + Math.sin(t + p.phase) * 0.18;

        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;
        if (p.y < -8) p.y = height + 8;
        if (p.y > height + 8) p.y = -8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha.toFixed(3)})`;
        ctx.fill();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  revealed = true,
}) => {
  const { cms } = useSiteConfig();
  const shouldReduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = cms.navigation.items.filter((item) => item.visible !== false);
  const dockSocials = cms.contactInfo.socials.filter(
    (s) => s.visible !== false && s.showInDock !== false
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLinkClick = (sectionId: string) => {
    setMobileOpen(false);
    onNavigate(sectionId);
  };

  return (
    <>
      <motion.header
        initial={shouldReduceMotion ? undefined : { y: -24, opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { y: 0, opacity: 1 }
            : revealed
              ? { y: 0, opacity: 1 }
              : { y: -24, opacity: 0 }
        }
        transition={{ duration: 0.65, delay: revealed ? 0.22 : 0, ease: EASE_CINEMATIC }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050505]/85 backdrop-blur-2xl border-b border-white/[0.1] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.9)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div
          className={`mx-auto max-w-[1360px] px-6 sm:px-10 flex items-center justify-between gap-8 transition-all duration-300 ${
            scrolled ? 'h-[64px]' : 'h-[76px]'
          }`}
        >
          {/* Zone 1: Magnetic Monogram + Name */}
          <MagneticWrapper strength={0.22}>
            <a
              href="#home"
              data-gravity="well"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('home');
              }}
              className="flex items-center gap-3 text-white whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md"
            >
              <motion.span
                initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.75, rotate: -14 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.55, ease: EASE_CINEMATIC }}
                className="inline-flex"
              >
                <BrandMark
                  logoUrl={cms.settings.logoUrl}
                  className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
              </motion.span>
              <span className="font-display text-base sm:text-lg font-semibold tracking-tight group-hover:tracking-normal transition-all duration-200">
                {cms.home.name}
              </span>
            </a>
          </MagneticWrapper>

          {/* Zone 2: Staggered Magnetic Navigation Links */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-7">
            {navItems.map((item, idx) => {
              const targetId = item.href.replace(/^#/, '');
              const isActive = activeSection === targetId;
              return (
                <motion.div
                  key={item.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 + idx * 0.045, ease: EASE_CINEMATIC }}
                >
                  <MagneticWrapper strength={0.18}>
                    <a
                      href={item.href}
                      target={item.isExternal ? '_blank' : undefined}
                      rel={item.isExternal ? 'noreferrer' : undefined}
                      data-gravity="well"
                      onClick={(e) => {
                        if (!item.isExternal && item.href.startsWith('#')) {
                          e.preventDefault();
                          handleLinkClick(targetId);
                        }
                      }}
                      className={`group relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-400 hover:text-white hover:-translate-y-[1px]'
                      }`}
                    >
                      <span className="relative z-10">{item.label}</span>
                      {!isActive && (
                        <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-white/40 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200" />
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="active-nav-indicator"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.65)]"
                        />
                      )}
                    </a>
                  </MagneticWrapper>
                </motion.div>
              );
            })}
          </nav>

          {/* Zone 3: Magnetic Primary CTA + Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {cms.navigation.ctaVisible !== false && (
              <MagneticWrapper strength={0.26} className="hidden sm:inline-block">
                <a
                  href={cms.navigation.ctaHref || '#contact'}
                  data-gravity="avoid"
                  onClick={(e) => {
                    const href = cms.navigation.ctaHref || '#contact';
                    if (href.startsWith('#')) {
                      e.preventDefault();
                      handleLinkClick(href.slice(1));
                    }
                  }}
                  className="group relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white border border-white/25 rounded-full hover:text-black hover:border-white transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">{cms.navigation.ctaLabel || "Let's Talk"}</span>
                  <ArrowUpRight
                    className="relative z-10 w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2}
                  />
                </a>
              </MagneticWrapper>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Particle-Infused Mobile Curtain Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 92% 4%)', opacity: 0.4 }}
            animate={{ clipPath: 'circle(150% at 92% 4%)', opacity: 1 }}
            exit={{ clipPath: 'circle(0% at 92% 4%)', opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE_CURTAIN }}
            className="fixed inset-0 z-40 bg-[#050505]/95 backdrop-blur-2xl md:hidden flex flex-col justify-between px-6 pt-28 pb-10 overflow-hidden"
          >
            <MobileDrawerParticles />

            <nav aria-label="Mobile Navigation" className="relative z-10 flex flex-col gap-3">
              {navItems.map((item, idx) => {
                const targetId = item.href.replace(/^#/, '');
                const isActive = activeSection === targetId;
                return (
                  <motion.a
                    key={item.id}
                    href={item.href}
                    initial={{ opacity: 0, x: -18, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.12 + idx * 0.05, duration: 0.3, ease: EASE_CINEMATIC }}
                    onClick={(e) => {
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        handleLinkClick(targetId);
                      } else {
                        setMobileOpen(false);
                      }
                    }}
                    className={`py-3 text-3xl font-display font-semibold tracking-tight border-b border-white/[0.08] flex items-center justify-between ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="text-xs font-mono text-zinc-400">Active</span>}
                  </motion.a>
                );
              })}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="relative z-10 space-y-6"
            >
              {cms.navigation.ctaVisible !== false && (
                <a
                  href={cms.navigation.ctaHref || '#contact'}
                  onClick={(e) => {
                    const href = cms.navigation.ctaHref || '#contact';
                    if (href.startsWith('#')) {
                      e.preventDefault();
                      handleLinkClick(href.slice(1));
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"
                >
                  <span>{cms.navigation.ctaLabel || "Let's Talk"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}

              <div className="flex items-center justify-center gap-5 pt-2">
                {dockSocials.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/40 transition-colors"
                  >
                    <SocialIcon
                      platform={social.platform}
                      customIconUrl={social.customIconUrl}
                      className="w-4 h-4"
                    />
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
