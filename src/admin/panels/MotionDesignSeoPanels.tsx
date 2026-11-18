import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { DEFAULT_CMS_STATE } from '../../data/defaultCmsState';
import { adminApi } from '../../lib/adminApi';
import type {
  ActivityLogItem,
  AnimationSettings,
  CmsSiteState,
  IntroSettings,
  NavCmsItem,
  ParticleSettings,
  SocialCmsItem,
  SocialPlatform,
  ThemeSettings,
  TypographySettings,
} from '../../types/cms';
import {
  CmsColorField,
  CmsInput,
  CmsSelect,
  CmsSlider,
  CmsTextarea,
  CmsToggle,
  DeleteConfirmModal,
  LiveParticlePreview,
  MediaPickerModal,
} from '../components/AdminPrimitives';

interface EditorProps {
  draft: CmsSiteState;
  onChange: (next: CmsSiteState) => void;
}

const FONT_OPTIONS = [
  { label: 'Outfit (Display Geometric)', value: '"Outfit", ui-sans-serif, system-ui, sans-serif' },
  {
    label: 'Plus Jakarta Sans (Modern Sans)',
    value: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  },
  {
    label: 'Cormorant Garamond (Editorial Serif)',
    value: '"Cormorant Garamond", Georgia, serif',
  },
  {
    label: 'JetBrains Mono (Technical Mono)',
    value: '"JetBrains Mono", ui-monospace, monospace',
  },
  { label: 'Inter / System Sans', value: '"Inter", system-ui, -apple-system, sans-serif' },
  { label: 'Space Grotesk', value: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif' },
];

export const MotionStudioPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [subTab, setSubTab] = useState<'animations' | 'intro' | 'particles'>('animations');

  const updateAnimations = (patch: Partial<AnimationSettings>) =>
    onChange({ ...draft, animations: { ...draft.animations, ...patch } });

  const updateIntro = (patch: Partial<IntroSettings>) =>
    onChange({ ...draft, intro: { ...draft.intro, ...patch } });

  const updateParticles = (patch: Partial<ParticleSettings>) =>
    onChange({ ...draft, particles: { ...draft.particles, ...patch } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'animations', label: 'Animation Control Center' },
          { id: 'intro', label: 'Intro Animation Control' },
          { id: 'particles', label: 'Particle System Sandbox' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id as 'animations' | 'intro' | 'particles')}
            className={`px-4 py-2 rounded-full text-xs font-mono border transition-colors ${
              subTab === t.id
                ? 'bg-white text-black border-white font-semibold'
                : 'border-white/15 text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'animations' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">
                  Animation &amp; Particle Control Center
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Toggle individual experimental particle physics, cursor fields, and transition effects live across the public portfolio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateAnimations({ ...DEFAULT_CMS_STATE.animations });
                  updateParticles({ ...DEFAULT_CMS_STATE.particles });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/15 text-xs text-zinc-300 hover:border-white hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Motion</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                Core Engine &amp; Navigation Transitions
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CmsToggle
                  label="Master Animation Switch"
                  description="Global circuit breaker for all experimental motion systems"
                  checked={draft.animations.masterEnabled}
                  onChange={(v) => updateAnimations({ masterEnabled: v })}
                />
                <CmsToggle
                  label="Intro Animation"
                  description="Play 5–7s particle letterform formation before homepage reveal"
                  checked={draft.animations.introEnabled}
                  onChange={(v) => updateAnimations({ introEnabled: v })}
                />
                <CmsToggle
                  label="Section Transitions"
                  description="Particle curtain & atmospheric shockwave between navbar sections"
                  checked={draft.animations.sectionTransitions}
                  onChange={(v) => updateAnimations({ sectionTransitions: v })}
                />
                <CmsToggle
                  label="Page & Modal Transitions"
                  description="Particle dissolution & spatial choreography on modal close"
                  checked={draft.animations.pageTransitions}
                  onChange={(v) => updateAnimations({ pageTransitions: v })}
                />
                <CmsToggle
                  label="Scroll Reaction & Distortion"
                  description="Velocity-driven skew, elastic warp & depth tilt"
                  checked={draft.animations.scrollDistortion}
                  onChange={(v) => updateAnimations({ scrollDistortion: v })}
                />
                <CmsToggle
                  label="Section Scroll Reveals"
                  description="Staggered dimensional entrances on viewport entry"
                  checked={draft.animations.sectionReveal}
                  onChange={(v) => updateAnimations({ sectionReveal: v })}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                Particle Physics &amp; Field Switches
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CmsToggle
                  label="Particle Background Canvas"
                  description="Full-screen interactive atmospheric particle field"
                  checked={draft.animations.particleBackground}
                  onChange={(v) => updateAnimations({ particleBackground: v })}
                />
                <CmsToggle
                  label="Mouse Attraction & Repulsion"
                  description="Cursor gravity pull, orbital deflection & click ripples"
                  checked={draft.animations.mouseParticles}
                  onChange={(v) => updateAnimations({ mouseParticles: v })}
                />
                <CmsToggle
                  label="Particle Trails"
                  description="Persistence vapor trails behind fast-moving particles"
                  checked={draft.animations.particleTrails}
                  onChange={(v) => updateAnimations({ particleTrails: v })}
                />
                <CmsToggle
                  label="Particle Connections"
                  description="Constellation hairline filaments between nearby nodes"
                  checked={draft.animations.particleConnections}
                  onChange={(v) => updateAnimations({ particleConnections: v })}
                />
                <CmsToggle
                  label="Particle Waves"
                  description="Ambient harmonic drift & radial wave propagation"
                  checked={draft.animations.particleWaves}
                  onChange={(v) => updateAnimations({ particleWaves: v })}
                />
                <CmsToggle
                  label="Touch Particle Interaction"
                  description="Enable responsive touch gravity & ripples on mobile/tablet"
                  checked={draft.animations.touchInteraction}
                  onChange={(v) => updateAnimations({ touchInteraction: v })}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                Cursor, Hover &amp; Typography Effects
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CmsToggle
                  label="Cursor Effects (Magnetic Portal)"
                  description="Custom cursor ring & precision spotlight field"
                  checked={draft.animations.magneticCursor}
                  onChange={(v) => updateAnimations({ magneticCursor: v })}
                />
                <CmsToggle
                  label="Liquid Gravity Cards"
                  description="Interactive 3D specular sheen & card-edge particle orbit"
                  checked={draft.animations.liquidHover}
                  onChange={(v) => updateAnimations({ liquidHover: v })}
                />
                <CmsToggle
                  label="Kinetic Text Morphing"
                  description="Specular headline sweeps & melting kinetic characters"
                  checked={draft.animations.textAnimations}
                  onChange={(v) => updateAnimations({ textAnimations: v })}
                />
                <CmsToggle
                  label="Parallax Depth Motion"
                  description="Multi-plane parallax floating layers"
                  checked={draft.animations.parallaxMotion}
                  onChange={(v) => updateAnimations({ parallaxMotion: v })}
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">
                  Intensity Calibration &amp; Live Particle Preview
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Fine-tune particle density, speed, size, opacity, attraction, repulsion, and motion physics in real time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('particles')}
                className="px-3.5 py-1.5 rounded-full border border-white/15 text-[11px] font-mono text-zinc-300 hover:border-white hover:text-white"
              >
                Open Full Particle Sandbox →
              </button>
            </div>

            <LiveParticlePreview settings={draft.particles} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CmsSlider
                label="Particle Density"
                value={draft.particles.count}
                min={20}
                max={240}
                step={2}
                onChange={(v) => updateParticles({ count: v })}
              />
              <CmsSlider
                label="Particle Speed"
                value={draft.particles.speed}
                min={0.2}
                max={2.5}
                step={0.05}
                suffix="x"
                onChange={(v) => updateParticles({ speed: v })}
              />
              <CmsSlider
                label="Particle Size"
                value={draft.particles.size}
                min={0.6}
                max={3.5}
                step={0.1}
                suffix="px"
                onChange={(v) => updateParticles({ size: v })}
              />
              <CmsSlider
                label="Particle Opacity"
                value={draft.particles.opacity}
                min={0.1}
                max={1}
                step={0.02}
                onChange={(v) => updateParticles({ opacity: v })}
              />
              <CmsSlider
                label="Particle Attraction"
                value={draft.particles.mouseAttraction}
                min={0}
                max={2.5}
                step={0.05}
                suffix="x"
                onChange={(v) => updateParticles({ mouseAttraction: v })}
              />
              <CmsSlider
                label="Particle Repulsion"
                value={draft.particles.mouseRepulsion}
                min={0}
                max={2.5}
                step={0.05}
                suffix="x"
                onChange={(v) => updateParticles({ mouseRepulsion: v })}
              />
              <CmsSlider
                label="Mouse Strength"
                value={draft.animations.cursorStrength}
                min={0}
                max={2}
                step={0.05}
                suffix="x"
                onChange={(v) => updateAnimations({ cursorStrength: v })}
              />
              <CmsSlider
                label="Scroll Reaction"
                value={draft.animations.scrollStrength}
                min={0}
                max={2}
                step={0.05}
                suffix="x"
                onChange={(v) => updateAnimations({ scrollStrength: v })}
              />
              <CmsSlider
                label="Global Speed Multiplier"
                value={draft.animations.animationSpeed}
                min={0.3}
                max={2}
                step={0.05}
                suffix="x"
                onChange={(v) => updateAnimations({ animationSpeed: v })}
              />
              <CmsSlider
                label="Parallax Intensity"
                value={draft.animations.parallaxIntensity}
                min={0}
                max={2}
                step={0.05}
                suffix="x"
                onChange={(v) => updateAnimations({ parallaxIntensity: v })}
              />
              <CmsSlider
                label="Transition Speed"
                value={draft.animations.transitionSpeed}
                min={0.4}
                max={2}
                step={0.05}
                suffix="x"
                onChange={(v) => updateAnimations({ transitionSpeed: v })}
              />
              <CmsSlider
                label="Hover Liquid Intensity"
                value={draft.animations.hoverIntensity}
                min={0}
                max={2}
                step={0.05}
                suffix="x"
                onChange={(v) => updateAnimations({ hoverIntensity: v })}
              />
              <CmsSlider
                label="Luminance Glow Strength"
                value={draft.animations.glowStrength}
                min={0}
                max={2}
                step={0.05}
                suffix="x"
                onChange={(v) => updateAnimations({ glowStrength: v })}
              />
            </div>
          </div>
        </div>
      )}

      {subTab === 'intro' && (
        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                Cinematic Intro Configuration
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Controls the particle-formed identity opening sequence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateIntro({ ...DEFAULT_CMS_STATE.intro })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/15 text-xs text-zinc-300 hover:border-white hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Intro</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CmsToggle
              label="Intro Sequence Enabled"
              description="Show opening particle formation before hero reveal"
              checked={draft.intro.enabled}
              onChange={(v) => updateIntro({ enabled: v })}
            />
            <CmsSelect
              label="Replay Behavior"
              value={draft.intro.replayBehavior}
              onChange={(e) =>
                updateIntro({ replayBehavior: e.target.value as IntroSettings['replayBehavior'] })
              }
            >
              <option value="always">Play on Every Visit</option>
              <option value="once">Play Once per Session</option>
              <option value="disabled">Disabled (Skip Immediately)</option>
            </CmsSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CmsInput
              label="Intro Formation Text"
              value={draft.intro.text}
              onChange={(e) => updateIntro({ text: e.target.value })}
              placeholder="Developer • Designer • Creator"
            />
            <CmsColorField
              label="Intro Backdrop Color"
              value={draft.intro.backgroundColor}
              onChange={(v) => updateIntro({ backgroundColor: v })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CmsSlider
              label="Duration (Seconds)"
              value={draft.intro.durationSec}
              min={2.5}
              max={10}
              step={0.25}
              suffix="s"
              onChange={(v) => updateIntro({ durationSec: v })}
            />
            <CmsSlider
              label="Particle Density"
              value={draft.intro.particleDensity}
              min={0.5}
              max={1.8}
              step={0.05}
              suffix="x"
              onChange={(v) => updateIntro({ particleDensity: v })}
            />
            <CmsSlider
              label="Convergence Speed"
              value={draft.intro.particleSpeed}
              min={0.5}
              max={2}
              step={0.05}
              suffix="x"
              onChange={(v) => updateIntro({ particleSpeed: v })}
            />
            <CmsSlider
              label="Letterform Scale"
              value={draft.intro.textSize}
              min={0.65}
              max={1.35}
              step={0.05}
              suffix="x"
              onChange={(v) => updateIntro({ textSize: v })}
            />
            <CmsSlider
              label="Glow / Sweep Intensity"
              value={draft.intro.glowIntensity}
              min={0.2}
              max={2}
              step={0.05}
              suffix="x"
              onChange={(v) => updateIntro({ glowIntensity: v })}
            />
          </div>
        </div>
      )}

      {subTab === 'particles' && (
        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                Particle Physics &amp; Field Control
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Live sandbox reflects exact settings synced to the public Canvas engine.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateParticles({ ...DEFAULT_CMS_STATE.particles })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/15 text-xs text-zinc-300 hover:border-white hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Particles</span>
            </button>
          </div>

          <LiveParticlePreview settings={draft.particles} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CmsSlider
              label="Particle Count"
              value={draft.particles.count}
              min={20}
              max={240}
              step={2}
              onChange={(v) => updateParticles({ count: v })}
            />
            <CmsSlider
              label="Particle Size"
              value={draft.particles.size}
              min={0.6}
              max={3.5}
              step={0.1}
              suffix="px"
              onChange={(v) => updateParticles({ size: v })}
            />
            <CmsSlider
              label="Velocity Speed"
              value={draft.particles.speed}
              min={0.2}
              max={2.5}
              step={0.05}
              suffix="x"
              onChange={(v) => updateParticles({ speed: v })}
            />
            <CmsSlider
              label="Base Opacity"
              value={draft.particles.opacity}
              min={0.1}
              max={1}
              step={0.02}
              onChange={(v) => updateParticles({ opacity: v })}
            />
            <CmsSlider
              label="Connection Distance"
              value={draft.particles.connectionDistance}
              min={0}
              max={220}
              step={4}
              suffix="px"
              onChange={(v) => updateParticles({ connectionDistance: v })}
            />
            <CmsSlider
              label="Connection Opacity"
              value={draft.particles.connectionOpacity}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(v) => updateParticles({ connectionOpacity: v })}
            />
            <CmsSlider
              label="Mouse Attraction"
              value={draft.particles.mouseAttraction}
              min={0}
              max={2.5}
              step={0.05}
              suffix="x"
              onChange={(v) => updateParticles({ mouseAttraction: v })}
            />
            <CmsSlider
              label="Mouse Repulsion"
              value={draft.particles.mouseRepulsion}
              min={0}
              max={2.5}
              step={0.05}
              suffix="x"
              onChange={(v) => updateParticles({ mouseRepulsion: v })}
            />
            <CmsSlider
              label="Gravity Pull"
              value={draft.particles.gravity}
              min={-1}
              max={1}
              step={0.05}
              onChange={(v) => updateParticles({ gravity: v })}
            />
            <CmsSlider
              label="Ambient Wave"
              value={draft.particles.waveStrength}
              min={0}
              max={2.5}
              step={0.05}
              suffix="x"
              onChange={(v) => updateParticles({ waveStrength: v })}
            />
            <CmsSlider
              label="Motion Trail Fade"
              value={draft.particles.trail}
              min={0}
              max={0.9}
              step={0.05}
              onChange={(v) => updateParticles({ trail: v })}
            />
            <CmsSlider
              label="Core Halo Glow"
              value={draft.particles.glow}
              min={0}
              max={2}
              step={0.05}
              suffix="x"
              onChange={(v) => updateParticles({ glow: v })}
            />
            <CmsSlider
              label="Depth Parallax Spread"
              value={draft.particles.depth}
              min={0.2}
              max={2}
              step={0.05}
              suffix="x"
              onChange={(v) => updateParticles({ depth: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const DesignSeoSettingsPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [subTab, setSubTab] = useState<'theme' | 'typography' | 'layout' | 'socials' | 'seo'>(
    'theme'
  );
  const [pickerTarget, setPickerTarget] = useState<
    | { kind: 'ogImageUrl' | 'logoUrl' | 'faviconUrl' }
    | { kind: 'socialIcon'; socialId: string }
    | null
  >(null);
  const [dragSectionIdx, setDragSectionIdx] = useState<number | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activityFilter, setActivityFilter] = useState('');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (subTab === 'seo') {
      adminApi
        .listActivity()
        .then((res) => setActivityLogs(res.items))
        .catch(() => {});
    }
  }, [subTab]);

  const updateTheme = (patch: Partial<ThemeSettings>) =>
    onChange({ ...draft, theme: { ...draft.theme, ...patch } });

  const updateTypography = (patch: Partial<TypographySettings>) =>
    onChange({ ...draft, typography: { ...draft.typography, ...patch } });

  const handleReorderSection = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= draft.sections.length || fromIdx === toIdx) return;
    const next = [...draft.sections];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange({ ...draft, sections: next });
  };

  const addNavItem = () => {
    const newItem: NavCmsItem = {
      id: `nav-${Date.now()}`,
      label: 'Custom Link',
      href: '#services',
      visible: true,
      isExternal: false,
    };
    onChange({
      ...draft,
      navigation: { ...draft.navigation, items: [...draft.navigation.items, newItem] },
    });
  };

  const addSocial = () => {
    const newSoc: SocialCmsItem = {
      id: `soc-${Date.now()}`,
      platform: 'website',
      label: 'Portfolio Link',
      handle: '@studio',
      href: 'https://example.com',
      showInDock: false,
      visible: true,
    };
    onChange({
      ...draft,
      contactInfo: { ...draft.contactInfo, socials: [...draft.contactInfo.socials, newSoc] },
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    try {
      await adminApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwMessage('Administrator password updated in SQLite.');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Unable to update password');
    }
  };

  return (
    <div className="space-y-6">
      <MediaPickerModal
        open={pickerTarget !== null}
        acceptType="image"
        defaultFolderId="general"
        usageLocation="Branding & SEO"
        onClose={() => setPickerTarget(null)}
        onSelect={(item) => {
          if (!pickerTarget) return;
          if (pickerTarget.kind === 'ogImageUrl') {
            onChange({ ...draft, seo: { ...draft.seo, ogImageUrl: item.url } });
          } else if (pickerTarget.kind === 'logoUrl') {
            onChange({ ...draft, settings: { ...draft.settings, logoUrl: item.url } });
          } else if (pickerTarget.kind === 'faviconUrl') {
            onChange({ ...draft, settings: { ...draft.settings, faviconUrl: item.url } });
          } else if (pickerTarget.kind === 'socialIcon') {
            onChange({
              ...draft,
              contactInfo: {
                ...draft.contactInfo,
                socials: draft.contactInfo.socials.map((s) =>
                  s.id === pickerTarget.socialId ? { ...s, customIconUrl: item.url } : s
                ),
              },
            });
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'theme', label: 'Colors & Theme' },
          { id: 'typography', label: 'Typography' },
          { id: 'layout', label: 'Navigation, Sections & Footer' },
          { id: 'socials', label: 'Contact Info & Socials' },
          { id: 'seo', label: 'SEO, Settings, Security & Logs' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() =>
              setSubTab(t.id as 'theme' | 'typography' | 'layout' | 'socials' | 'seo')
            }
            className={`px-4 py-2 rounded-full text-xs font-mono border transition-colors ${
              subTab === t.id
                ? 'bg-white text-black border-white font-semibold'
                : 'border-white/15 text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. COLORS & THEME */}
      {subTab === 'theme' && (
        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                Color Tokens &amp; Surface Calibration
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Supports color picker or exact HEX input. Defaults to pure grayscale monochrome.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateTheme({ ...DEFAULT_CMS_STATE.theme })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-xs font-medium text-zinc-200 hover:bg-white hover:text-black transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Monochrome Default</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CmsColorField
              label="Primary Background"
              value={draft.theme.backgroundColor}
              onChange={(v) => updateTheme({ backgroundColor: v })}
            />
            <CmsColorField
              label="Secondary Background"
              value={draft.theme.secondaryBackgroundColor}
              onChange={(v) => updateTheme({ secondaryBackgroundColor: v })}
            />
            <CmsColorField
              label="Card Surface"
              value={draft.theme.cardBackgroundColor}
              onChange={(v) => updateTheme({ cardBackgroundColor: v })}
            />
            <CmsColorField
              label="Primary Text"
              value={draft.theme.primaryTextColor}
              onChange={(v) => updateTheme({ primaryTextColor: v })}
            />
            <CmsColorField
              label="Secondary Text"
              value={draft.theme.secondaryTextColor}
              onChange={(v) => updateTheme({ secondaryTextColor: v })}
            />
            <CmsColorField
              label="Border Stroke"
              value={draft.theme.borderColor}
              onChange={(v) => updateTheme({ borderColor: v })}
            />
            <CmsColorField
              label="Accent / Highlights"
              value={draft.theme.accentColor}
              onChange={(v) => updateTheme({ accentColor: v })}
            />
            <CmsColorField
              label="Luminance Glow"
              value={draft.theme.glowColor}
              onChange={(v) => updateTheme({ glowColor: v })}
            />
          </div>
        </div>
      )}

      {/* 2. TYPOGRAPHY */}
      {subTab === 'typography' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">Typography System</h3>
              <button
                type="button"
                onClick={() => updateTypography({ ...DEFAULT_CMS_STATE.typography })}
                className="text-xs font-mono text-zinc-400 hover:text-white"
              >
                Reset Typography
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CmsSelect
                label="Display Heading Font"
                value={draft.typography.displayFont}
                onChange={(e) => updateTypography({ displayFont: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </CmsSelect>

              <CmsSelect
                label="Body Copy Font"
                value={draft.typography.bodyFont}
                onChange={(e) => updateTypography({ bodyFont: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </CmsSelect>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CmsSlider
                label="Heading Size Scale"
                value={draft.typography.headingSizeScale}
                min={0.8}
                max={1.3}
                step={0.02}
                suffix="x"
                onChange={(v) => updateTypography({ headingSizeScale: v })}
              />
              <CmsSlider
                label="Body Size Scale"
                value={draft.typography.bodySizeScale}
                min={0.85}
                max={1.25}
                step={0.02}
                suffix="x"
                onChange={(v) => updateTypography({ bodySizeScale: v })}
              />
              <CmsSlider
                label="Heading Weight"
                value={draft.typography.fontWeight}
                min={400}
                max={800}
                step={100}
                onChange={(v) => updateTypography({ fontWeight: v })}
              />
              <CmsSlider
                label="Letter Spacing"
                value={draft.typography.letterSpacingEm}
                min={-0.04}
                max={0.08}
                step={0.005}
                suffix="em"
                onChange={(v) => updateTypography({ letterSpacingEm: v })}
              />
              <CmsSlider
                label="Line Height"
                value={draft.typography.lineHeight}
                min={1.2}
                max={2}
                step={0.05}
                onChange={(v) => updateTypography({ lineHeight: v })}
              />
              <CmsSelect
                label="Default Text Alignment"
                value={draft.typography.textAlign}
                onChange={(e) =>
                  updateTypography({
                    textAlign: e.target.value as TypographySettings['textAlign'],
                  })
                }
              >
                <option value="left">Left Aligned</option>
                <option value="center">Center Aligned</option>
                <option value="right">Right Aligned</option>
              </CmsSelect>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
            <div className="text-[11px] font-mono tracking-[0.16em] text-zinc-500">
              LIVE TYPOGRAPHY SPECIMEN
            </div>
            <div
              className="p-6 rounded-2xl border border-white/10 bg-[#050505]"
              style={{
                textAlign: draft.typography.textAlign,
                letterSpacing: `${draft.typography.letterSpacingEm}em`,
                lineHeight: draft.typography.lineHeight,
              }}
            >
              <div
                style={{
                  fontFamily: draft.typography.displayFont,
                  fontWeight: draft.typography.fontWeight,
                  fontSize: `${2.2 * draft.typography.headingSizeScale}rem`,
                  color: draft.theme.primaryTextColor,
                }}
              >
                {draft.home.name}
              </div>
              <p
                className="mt-3"
                style={{
                  fontFamily: draft.typography.bodyFont,
                  fontSize: `${0.95 * draft.typography.bodySizeScale}rem`,
                  color: draft.theme.secondaryTextColor,
                }}
              >
                Minimalist engineering paired with expressive optical hierarchy and kinetic restraint.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION, SECTION ORDER & FOOTER */}
      {subTab === 'layout' && (
        <div className="space-y-6">
          {/* Drag-and-Drop Section Manager */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                Section Visibility &amp; Page Order
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Drag rows or use arrows to reorder portfolio sections. Toggle eye icon to hide/show any section live.
              </p>
            </div>
            <div className="space-y-2">
              {draft.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={() => setDragSectionIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragSectionIdx !== null) {
                      handleReorderSection(dragSectionIdx, idx);
                    }
                    setDragSectionIdx(null);
                  }}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-[#050507] hover:border-white/30 transition-colors cursor-grab"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-500">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-white">{sec.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">#{sec.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReorderSection(idx, idx - 1)}
                      className="p-1.5 text-zinc-400 hover:text-white"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorderSection(idx, idx + 1)}
                      className="p-1.5 text-zinc-400 hover:text-white"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = draft.sections.map((s) =>
                          s.id === sec.id ? { ...s, visible: !s.visible } : s
                        );
                        onChange({ ...draft, sections: next });
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
                        sec.visible
                          ? 'border-white/25 text-white'
                          : 'border-zinc-700 text-zinc-500'
                      }`}
                    >
                      {sec.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navbar Links & CTA */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">Navigation Links</h3>
              <button
                type="button"
                onClick={addNavItem}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white hover:text-black"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Nav Link</span>
              </button>
            </div>

            <div className="space-y-3">
              {draft.navigation.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-white/10 bg-[#050507] grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                >
                  <div className="md:col-span-4">
                    <CmsInput
                      label="Label"
                      value={item.label}
                      onChange={(e) => {
                        const next = draft.navigation.items.map((n) =>
                          n.id === item.id ? { ...n, label: e.target.value } : n
                        );
                        onChange({ ...draft, navigation: { ...draft.navigation, items: next } });
                      }}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <CmsInput
                      label="Target (#section or URL)"
                      value={item.href}
                      onChange={(e) => {
                        const next = draft.navigation.items.map((n) =>
                          n.id === item.id
                            ? {
                                ...n,
                                href: e.target.value,
                                isExternal: e.target.value.startsWith('http'),
                              }
                            : n
                        );
                        onChange({ ...draft, navigation: { ...draft.navigation, items: next } });
                      }}
                    />
                  </div>
                  <div className="md:col-span-3 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === 0) return;
                        const next = [...draft.navigation.items];
                        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
                        onChange({ ...draft, navigation: { ...draft.navigation, items: next } });
                      }}
                      className="p-2 text-zinc-400 hover:text-white"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === draft.navigation.items.length - 1) return;
                        const next = [...draft.navigation.items];
                        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                        onChange({ ...draft, navigation: { ...draft.navigation, items: next } });
                      }}
                      className="p-2 text-zinc-400 hover:text-white"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = draft.navigation.items.map((n) =>
                          n.id === item.id ? { ...n, visible: !n.visible } : n
                        );
                        onChange({ ...draft, navigation: { ...draft.navigation, items: next } });
                      }}
                      className="p-2 text-zinc-400 hover:text-white"
                    >
                      {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = draft.navigation.items.filter((n) => n.id !== item.id);
                        onChange({ ...draft, navigation: { ...draft.navigation, items: next } });
                      }}
                      className="p-2 text-zinc-400 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <CmsInput
                label="Header CTA Button Label"
                value={draft.navigation.ctaLabel}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    navigation: { ...draft.navigation, ctaLabel: e.target.value },
                  })
                }
              />
              <CmsInput
                label="Header CTA Href"
                value={draft.navigation.ctaHref}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    navigation: { ...draft.navigation, ctaHref: e.target.value },
                  })
                }
              />
              <CmsToggle
                label="Show Header CTA"
                checked={draft.navigation.ctaVisible}
                onChange={(v) =>
                  onChange({
                    ...draft,
                    navigation: { ...draft.navigation, ctaVisible: v },
                  })
                }
              />
            </div>
          </div>

          {/* Footer Settings */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">Footer Configuration</h3>
            <CmsTextarea
              label="Footer Tagline"
              rows={2}
              value={draft.footer.tagline}
              onChange={(e) =>
                onChange({ ...draft, footer: { ...draft.footer, tagline: e.target.value } })
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CmsInput
                label="Copyright Line"
                value={draft.footer.copyright}
                onChange={(e) =>
                  onChange({ ...draft, footer: { ...draft.footer, copyright: e.target.value } })
                }
              />
              <CmsInput
                label="Craft Note"
                value={draft.footer.craftNote}
                onChange={(e) =>
                  onChange({ ...draft, footer: { ...draft.footer, craftNote: e.target.value } })
                }
              />
            </div>
            <CmsToggle
              label='Show "Replay Intro" Button in Footer'
              checked={draft.footer.showReplayIntro}
              onChange={(v) =>
                onChange({ ...draft, footer: { ...draft.footer, showReplayIntro: v } })
              }
            />
          </div>
        </div>
      )}

      {/* 4. CONTACT INFO & SOCIALS */}
      {subTab === 'socials' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">Contact Section &amp; Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CmsInput
                label="Section Heading"
                value={draft.contactInfo.heading}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contactInfo: { ...draft.contactInfo, heading: e.target.value },
                  })
                }
              />
              <CmsInput
                label="Email Address"
                value={draft.contactInfo.email}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contactInfo: { ...draft.contactInfo, email: e.target.value },
                  })
                }
              />
              <CmsInput
                label="Phone Number"
                value={draft.contactInfo.phone}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contactInfo: { ...draft.contactInfo, phone: e.target.value },
                  })
                }
              />
              <CmsInput
                label="Location"
                value={draft.contactInfo.location}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contactInfo: { ...draft.contactInfo, location: e.target.value },
                  })
                }
              />
            </div>
            <CmsTextarea
              label="Subheading"
              rows={2}
              value={draft.contactInfo.subheading}
              onChange={(e) =>
                onChange({
                  ...draft,
                  contactInfo: { ...draft.contactInfo, subheading: e.target.value },
                })
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CmsInput
                label="Response SLA Note"
                value={draft.contactInfo.responseNote}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contactInfo: { ...draft.contactInfo, responseNote: e.target.value },
                  })
                }
              />
              <CmsInput
                label="Budget Tiers (comma-separated)"
                value={draft.contactInfo.budgetOptions.join(', ')}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    contactInfo: {
                      ...draft.contactInfo,
                      budgetOptions: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">Social Media Profiles</h3>
              <button
                type="button"
                onClick={addSocial}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Social Link</span>
              </button>
            </div>

            <div className="space-y-3">
              {draft.contactInfo.socials.map((soc, idx) => (
                <div
                  key={soc.id}
                  className="p-4 rounded-xl border border-white/10 bg-[#050507] grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                >
                  <div className="md:col-span-2">
                    <CmsSelect
                      label="Platform"
                      value={soc.platform}
                      onChange={(e) => {
                        const next = draft.contactInfo.socials.map((s) =>
                          s.id === soc.id ? { ...s, platform: e.target.value as SocialPlatform } : s
                        );
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                    >
                      <option value="github">GitHub</option>
                      <option value="instagram">Instagram</option>
                      <option value="pinterest">Pinterest</option>
                      <option value="youtube">YouTube</option>
                      <option value="x">X</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="dribbble">Dribbble</option>
                      <option value="behance">Behance</option>
                      <option value="website">Website</option>
                    </CmsSelect>
                  </div>
                  <div className="md:col-span-2">
                    <CmsInput
                      label="Label"
                      value={soc.label}
                      onChange={(e) => {
                        const next = draft.contactInfo.socials.map((s) =>
                          s.id === soc.id ? { ...s, label: e.target.value } : s
                        );
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <CmsInput
                      label="Handle"
                      value={soc.handle}
                      onChange={(e) => {
                        const next = draft.contactInfo.socials.map((s) =>
                          s.id === soc.id ? { ...s, handle: e.target.value } : s
                        );
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <CmsInput
                      label="Profile URL"
                      value={soc.href}
                      onChange={(e) => {
                        const next = draft.contactInfo.socials.map((s) =>
                          s.id === soc.id ? { ...s, href: e.target.value } : s
                        );
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                    />
                  </div>
                  <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPickerTarget({ kind: 'socialIcon', socialId: soc.id })}
                      className="px-2.5 py-1.5 rounded-lg border border-white/15 text-[11px] text-zinc-300 hover:border-white"
                      title="Custom Icon"
                    >
                      Icon
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = draft.contactInfo.socials.map((s) =>
                          s.id === soc.id ? { ...s, showInDock: !s.showInDock } : s
                        );
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                        soc.showInDock ? 'border-white text-white' : 'border-white/15 text-zinc-500'
                      }`}
                      title="Show in Hero Dock"
                    >
                      Dock
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === 0) return;
                        const next = [...draft.contactInfo.socials];
                        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = draft.contactInfo.socials.map((s) =>
                          s.id === soc.id ? { ...s, visible: !s.visible } : s
                        );
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white"
                    >
                      {soc.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = draft.contactInfo.socials.filter((s) => s.id !== soc.id);
                        onChange({ ...draft, contactInfo: { ...draft.contactInfo, socials: next } });
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. SEO, WEBSITE SETTINGS, SECURITY & ACTIVITY LOG */}
      {subTab === 'seo' && (
        <div className="space-y-6">
          {/* SEO + Google SERP Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
              <h3 className="font-display text-lg font-semibold text-white">SEO &amp; OpenGraph</h3>
              <CmsInput
                label="Meta Page Title"
                value={draft.seo.title}
                onChange={(e) =>
                  onChange({ ...draft, seo: { ...draft.seo, title: e.target.value } })
                }
              />
              <CmsTextarea
                label="Meta Description"
                rows={3}
                value={draft.seo.metaDescription}
                onChange={(e) =>
                  onChange({ ...draft, seo: { ...draft.seo, metaDescription: e.target.value } })
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CmsInput
                  label="Keywords"
                  value={draft.seo.keywords}
                  onChange={(e) =>
                    onChange({ ...draft, seo: { ...draft.seo, keywords: e.target.value } })
                  }
                />
                <CmsInput
                  label="Canonical URL"
                  value={draft.seo.canonicalUrl}
                  onChange={(e) =>
                    onChange({ ...draft, seo: { ...draft.seo, canonicalUrl: e.target.value } })
                  }
                />
                <CmsInput
                  label="OpenGraph Title"
                  value={draft.seo.ogTitle}
                  onChange={(e) =>
                    onChange({ ...draft, seo: { ...draft.seo, ogTitle: e.target.value } })
                  }
                />
                <CmsInput
                  label="OpenGraph Description"
                  value={draft.seo.ogDescription}
                  onChange={(e) =>
                    onChange({ ...draft, seo: { ...draft.seo, ogDescription: e.target.value } })
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPickerTarget({ kind: 'ogImageUrl' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-xs text-white hover:bg-white hover:text-black"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Select OG Share Image</span>
                </button>
                {draft.seo.ogImageUrl && (
                  <span className="text-xs font-mono text-zinc-400 truncate max-w-xs">
                    {draft.seo.ogImageUrl}
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
              <div className="text-[11px] font-mono tracking-[0.16em] text-zinc-500">
                SEARCH RESULT PREVIEW
              </div>
              <div className="p-5 rounded-2xl border border-white/10 bg-[#050507] space-y-1.5">
                <div className="text-xs font-mono text-zinc-500 truncate">
                  {draft.seo.canonicalUrl || 'https://muhammedsinan.studio'}
                </div>
                <div className="text-base font-semibold text-white line-clamp-1">
                  {draft.seo.title || draft.home.name}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {draft.seo.metaDescription}
                </p>
              </div>
            </div>
          </div>

          {/* General Website Settings & Maintenance Mode */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
            <h3 className="font-display text-lg font-semibold text-white">
              Website Identity, Branding &amp; Maintenance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CmsInput
                label="Website Name"
                value={draft.settings.siteName}
                onChange={(e) =>
                  onChange({ ...draft, settings: { ...draft.settings, siteName: e.target.value } })
                }
              />
              <CmsInput
                label="Analytics Measurement ID (Optional)"
                value={draft.settings.analyticsId}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    settings: { ...draft.settings, analyticsId: e.target.value },
                  })
                }
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-[#050507] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-zinc-400">CUSTOM BRAND LOGO</div>
                  <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">
                    {draft.settings.logoUrl || 'Using Built-in Monogram'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerTarget({ kind: 'logoUrl' })}
                    className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold"
                  >
                    Choose
                  </button>
                  {draft.settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...draft, settings: { ...draft.settings, logoUrl: '' } })
                      }
                      className="px-2.5 py-1.5 rounded-full border border-white/20 text-xs text-zinc-300"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-[#050507] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-zinc-400">FAVICON ICON</div>
                  <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">
                    {draft.settings.faviconUrl || 'Default icon'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerTarget({ kind: 'faviconUrl' })}
                    className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold"
                  >
                    Choose
                  </button>
                  {draft.settings.faviconUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...draft, settings: { ...draft.settings, faviconUrl: '' } })
                      }
                      className="px-2.5 py-1.5 rounded-full border border-white/20 text-xs text-zinc-300"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            <CmsToggle
              label="Maintenance Mode"
              description="Replaces the public website with a monochrome maintenance screen (Admin Preview still works)."
              checked={draft.settings.maintenanceMode}
              onChange={(v) =>
                onChange({ ...draft, settings: { ...draft.settings, maintenanceMode: v } })
              }
            />

            {draft.settings.maintenanceMode && (
              <CmsTextarea
                label="Maintenance Notice Message"
                rows={2}
                value={draft.settings.maintenanceMessage}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    settings: { ...draft.settings, maintenanceMessage: e.target.value },
                  })
                }
              />
            )}
          </div>

          {/* Admin Password Update + Activity Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handlePasswordSubmit}
              className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white" />
                <h3 className="font-display text-lg font-semibold text-white">
                  Update Admin Password
                </h3>
              </div>
              {pwError && (
                <div className="p-3 rounded-xl border border-white/30 bg-white/5 text-xs text-zinc-200">
                  {pwError}
                </div>
              )}
              {pwMessage && (
                <div className="p-3 rounded-xl border border-white/30 bg-white/10 text-xs text-white">
                  {pwMessage}
                </div>
              )}
              <CmsInput
                label="Current Password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <CmsInput
                label="New Password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <CmsInput
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
              >
                Update Password
              </button>
            </form>

            <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold text-white">
                  System Activity Log
                </h3>
                <input
                  type="text"
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  placeholder="Filter logs..."
                  className="px-3 py-1.5 rounded-xl bg-[#050507] border border-white/15 text-xs text-white"
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {activityLogs
                  .filter(
                    (l) =>
                      !activityFilter.trim() ||
                      l.action.toLowerCase().includes(activityFilter.toLowerCase()) ||
                      l.detail.toLowerCase().includes(activityFilter.toLowerCase())
                  )
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-white/[0.08] bg-[#050507] flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-zinc-400">
                          {log.action} · {log.target}
                        </div>
                        <div className="text-zinc-200 mt-0.5 truncate">{log.detail}</div>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
