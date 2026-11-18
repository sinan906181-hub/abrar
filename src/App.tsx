/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { AdminApp } from './admin/AdminApp';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BrandMark } from './components/Icons';
import { Services } from './components/Services';
import { Skills } from './components/Skills';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';
import {
  ExperimentalAtmosphereCanvas,
  ExperimentalCursorPortal,
  experimentalBus,
} from './motion/ExperimentalEngine';
import {
  BOOK_PAGES,
  BookBindingFrame,
  BookPageTurnOverlay,
  resolveBookPage,
  type PageTurnState,
} from './motion/BookPageTurn';
import { ScrollProgressHUD } from './motion/MotionPrimitives';
import { MuhammedSinanIntro } from './motion/MuhammedSinanIntro';

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

const PublicPortfolio: React.FC<{ onOpenAdmin: () => void }> = ({ onOpenAdmin }) => {
  const { cms, mode } = useSiteConfig();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [pageTurn, setPageTurn] = useState<PageTurnState | null>(null);

  const activeSectionRef = useRef<string>('home');
  const manualNavUntilRef = useRef<number>(0);
  const lastLightTurnAtRef = useRef<number>(0);
  const turnTimerRef = useRef<number>(0);
  const scrollJumpTimerRef = useRef<number>(0);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const shouldPlayIntroOnMount = useMemo(() => {
    if (!cms.animations.masterEnabled || !cms.animations.introEnabled || !cms.intro.enabled) {
      return false;
    }
    if (cms.intro.replayBehavior === 'disabled') return false;
    if (cms.intro.replayBehavior === 'once') {
      try {
        if (sessionStorage.getItem('ms_intro_seen') === '1') return false;
      } catch {
        // Ignore storage errors
      }
    }
    return true;
  }, [
    cms.animations.introEnabled,
    cms.animations.masterEnabled,
    cms.intro.enabled,
    cms.intro.replayBehavior,
  ]);

  const [introActive, setIntroActive] = useState<boolean>(shouldPlayIntroOnMount);
  const [introCondensed, setIntroCondensed] = useState<boolean>(false);
  const [siteRevealed, setSiteRevealed] = useState<boolean>(!shouldPlayIntroOnMount);

  useEffect(() => {
    if (
      !cms.animations.masterEnabled ||
      !cms.animations.introEnabled ||
      !cms.intro.enabled ||
      cms.intro.replayBehavior === 'disabled'
    ) {
      setIntroActive(false);
      setSiteRevealed(true);
    }
  }, [
    cms.animations.introEnabled,
    cms.animations.masterEnabled,
    cms.intro.enabled,
    cms.intro.replayBehavior,
  ]);

  const handleIntroStartReveal = useCallback(() => {
    setSiteRevealed(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIntroActive(false);
    setSiteRevealed(true);
    try {
      sessionStorage.setItem('ms_intro_seen', '1');
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleReplayIntro = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setActiveSection('home');
    setIntroCondensed(false);
    setSiteRevealed(false);
    setIntroActive(true);
  }, []);

  const triggerTurnVisual = useCallback(
    (fromId: string, toId: string, mode: 'full' | 'light') => {
      const fromMeta = resolveBookPage(fromId);
      const toMeta = resolveBookPage(toId);
      const direction: 1 | -1 = toMeta.order >= fromMeta.order ? 1 : -1;
      const speedMul = Math.max(0.6, Math.min(1.8, cms.animations.transitionSpeed || 1));
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const totalMs =
        mode === 'light'
          ? Math.round(680 / speedMul)
          : Math.round((isMobile ? 740 : 1180) / speedMul);

      experimentalBus.triggerNavTransition(toId, direction, totalMs);
      setPageTurn({
        id: Date.now() + Math.random(),
        from: fromMeta,
        to: toMeta,
        direction,
        mode,
      });

      window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = window.setTimeout(() => {
        setPageTurn(null);
      }, totalMs + 80);

      return { direction, totalMs };
    },
    [cms.animations.transitionSpeed]
  );

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const el = document.getElementById(sectionId);
      if (!el) return;

      const prevId = activeSectionRef.current;
      if (prevId === sectionId) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const isHomeAboutPair =
        (prevId === 'home' && sectionId === 'about') ||
        (prevId === 'about' && sectionId === 'home');

      if (isHomeAboutPair) {
        manualNavUntilRef.current = Date.now() + 950;
        setActiveSection(sectionId);
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      manualNavUntilRef.current = Date.now() + 1600;
      const { direction, totalMs } = triggerTurnVisual(prevId, sectionId, 'full');
      setActiveSection(sectionId);

      // Forward turn: leaf starts flat at 0deg covering viewport -> scroll underlying destination immediately (24ms) so it sits revealed behind the turning page!
      // Backward turn: underlying current page stays visible until the previous page lands back flat at ~92% of duration -> then swap silently!
      const jumpDelay = direction === 1 ? 24 : Math.round(totalMs * 0.91);

      window.clearTimeout(scrollJumpTimerRef.current);
      scrollJumpTimerRef.current = window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, jumpDelay);
    },
    [triggerTurnVisual]
  );

  useEffect(() => {
    return () => {
      window.clearTimeout(turnTimerRef.current);
      window.clearTimeout(scrollJumpTimerRef.current);
    };
  }, []);

  const handleSelectServiceForContact = useCallback(
    (serviceTitle: string) => {
      setSelectedService(serviceTitle);
      scrollToSection('contact');
    },
    [scrollToSection]
  );

  const renderPageSnapshot = useCallback(
    (pageId: string) => {
      const noop = () => {};
      switch (pageId) {
        case 'home':
          return <Hero onNavigate={noop} revealed />;
        case 'about':
          return <About />;
        case 'skills':
          return <Skills />;
        case 'services':
          return <Services onSelectService={noop} />;
        case 'contact':
          return <Contact preselectedService={selectedService} />;
        default:
          return <Hero onNavigate={noop} revealed />;
      }
    },
    [selectedService]
  );

  useEffect(() => {
    experimentalBus.activeSection = activeSection;
  }, [activeSection]);

  const visibleSections = useMemo(
    () => cms.sections.filter((sec) => sec.visible !== false),
    [cms.sections]
  );

  // Keyboard & Touch Swipe Book Page-Turn Support
  useEffect(() => {
    if (!siteRevealed || introActive) return;

    const turnRelative = (delta: 1 | -1) => {
      const curMeta = resolveBookPage(activeSectionRef.current);
      const curIdx = BOOK_PAGES.findIndex((p) => p.id === curMeta.id);
      const baseIdx = curIdx >= 0 ? curIdx : 0;
      const nextIdx = Math.max(0, Math.min(BOOK_PAGES.length - 1, baseIdx + delta));
      if (nextIdx !== baseIdx) {
        scrollToSection(BOOK_PAGES[nextIdx].id);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.querySelector('[role="dialog"]')) return;

      if (e.key === 'PageDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        turnRelative(1);
      } else if (e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        turnRelative(-1);
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let touchTracking = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (document.querySelector('[role="dialog"]')) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchTracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchTracking || e.changedTouches.length === 0) return;
      touchTracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.7) {
        turnRelative(dx < 0 ? 1 : -1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [introActive, scrollToSection, siteRevealed]);

  useEffect(() => {
    const sectionIds = visibleSections
      .map((s) => s.id)
      .filter((id) => id !== 'footer');

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const nextId = entry.target.id;
          const prevId = activeSectionRef.current;
          setActiveSection(nextId);

          const now = Date.now();
          const isHomeAboutCrossing =
            (prevId === 'home' && nextId === 'about') ||
            (prevId === 'about' && nextId === 'home');

          if (
            nextId !== prevId &&
            !isHomeAboutCrossing &&
            siteRevealed &&
            !introActive &&
            now > manualNavUntilRef.current &&
            now - lastLightTurnAtRef.current > 1500
          ) {
            lastLightTurnAtRef.current = now;
            triggerTurnVisual(prevId, nextId, 'light');
          }
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-35% 0px -50% 0px',
      threshold: 0.01,
    });

    sectionIds.forEach((id) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });

    return () => observer.disconnect();
  }, [introActive, siteRevealed, triggerTurnVisual, visibleSections]);

  if (cms.settings.maintenanceMode && mode !== 'preview') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
        style={{ backgroundColor: cms.theme.backgroundColor, color: cms.theme.primaryTextColor }}
      >
        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-white/15 bg-white/[0.03] mx-auto">
            <BrandMark logoUrl={cms.settings.logoUrl} className="w-7 h-7 text-white" />
          </div>
          <div className="text-xs font-mono tracking-[0.22em] text-zinc-500 uppercase">
            Maintenance Mode
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {cms.home.name}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {cms.settings.maintenanceMessage}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors"
            >
              Studio Admin Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const footerVisible = visibleSections.some((s) => s.id === 'footer');

  return (
    <div
      className="relative min-h-screen font-sans"
      style={{ backgroundColor: cms.theme.backgroundColor, color: cms.theme.primaryTextColor }}
    >
      <MuhammedSinanIntro
        active={introActive}
        condensed={introCondensed}
        settings={cms.intro}
        onStartReveal={handleIntroStartReveal}
        onComplete={handleIntroComplete}
      />

      <ExperimentalAtmosphereCanvas />
      <ExperimentalCursorPortal />
      {siteRevealed && !introActive && <BookBindingFrame />}
      <BookPageTurnOverlay turn={pageTurn} renderPage={renderPageSnapshot} />
      <ScrollProgressHUD />

      <div
        className={`transition-opacity duration-500 ${
          siteRevealed ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <Header
          activeSection={activeSection}
          onNavigate={scrollToSection}
          revealed={siteRevealed}
        />

        <main className="relative z-10">
          {visibleSections.map((sec) => {
            switch (sec.id) {
              case 'home':
                return <Hero key="home" onNavigate={scrollToSection} revealed={siteRevealed} />;
              case 'about':
                return <About key="about" />;
              case 'skills':
                return <Skills key="skills" />;
              case 'services':
                return <Services key="services" onSelectService={handleSelectServiceForContact} />;
              case 'contact':
                return <Contact key="contact" preselectedService={selectedService} />;
              default:
                return null;
            }
          })}
        </main>

        {footerVisible && (
          <Footer
            onNavigate={scrollToSection}
            onReplayIntro={handleReplayIntro}
            onOpenAdmin={onOpenAdmin}
          />
        )}
      </div>

      {mode === 'preview' && (
        <div className="fixed bottom-4 left-4 z-[90] flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/25 bg-[#09090C]/90 backdrop-blur-xl text-xs font-mono text-white shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>DRAFT PREVIEW</span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="underline underline-offset-4 text-zinc-300 hover:text-white"
          >
            Back to Admin
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setPathname(path);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <SiteConfigProvider>
        {isAdminPath(pathname) ? (
          <AdminApp onExitAdmin={() => navigateTo('/')} />
        ) : (
          <PublicPortfolio onOpenAdmin={() => navigateTo('/admin')} />
        )}
      </SiteConfigProvider>
    </MotionConfig>
  );
}
