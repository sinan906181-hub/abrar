import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  CmsSiteState,
  ServiceCmsItem,
  ServiceIconKey,
  SkillCategory,
  SkillCmsItem,
  SkillIconKey,
} from '../../types/cms';
import {
  CmsInput,
  CmsSelect,
  CmsSlider,
  CmsTextarea,
  DeleteConfirmModal,
  MediaPickerModal,
} from '../components/AdminPrimitives';

interface EditorProps {
  draft: CmsSiteState;
  onChange: (next: CmsSiteState) => void;
}

export const HomeEditorPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [pickerTarget, setPickerTarget] = useState<'profilePhotoUrl' | 'heroBackgroundUrl' | null>(
    null
  );
  const [deleteCtaId, setDeleteCtaId] = useState<string | null>(null);

  const updateHome = (patch: Partial<CmsSiteState['home']>) =>
    onChange({ ...draft, home: { ...draft.home, ...patch } });

  const moveCta = (idx: number, dir: -1 | 1) => {
    const next = [...draft.home.ctas];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    updateHome({ ctas: next });
  };

  return (
    <div className="space-y-8">
      <MediaPickerModal
        open={pickerTarget !== null}
        acceptType="image"
        defaultFolderId="hero"
        usageLocation={pickerTarget === 'profilePhotoUrl' ? 'Hero Portrait' : 'Hero Background'}
        onClose={() => setPickerTarget(null)}
        onSelect={(item) => {
          if (pickerTarget) updateHome({ [pickerTarget]: item.url });
        }}
      />

      <DeleteConfirmModal
        open={deleteCtaId !== null}
        title="Delete Hero CTA Button"
        description="Remove this button from the Home Hero section?"
        onCancel={() => setDeleteCtaId(null)}
        onConfirm={() => {
          updateHome({ ctas: draft.home.ctas.filter((c) => c.id !== deleteCtaId) });
          setDeleteCtaId(null);
        }}
      />

      {/* Core Identity */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
        <h3 className="font-display text-lg font-semibold text-white">Hero Identity &amp; Copy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CmsInput
            label="Website Name / Main Heading"
            value={draft.home.name}
            onChange={(e) => updateHome({ name: e.target.value })}
          />
          <CmsInput
            label="Badge Kicker"
            value={draft.home.kicker}
            onChange={(e) => updateHome({ kicker: e.target.value })}
          />
          <CmsInput
            label="Hero Subtitle"
            value={draft.home.heroSubtitle}
            onChange={(e) => updateHome({ heroSubtitle: e.target.value })}
          />
          <CmsInput
            label="Roles (comma-separated)"
            value={draft.home.roles.join(', ')}
            onChange={(e) =>
              updateHome({
                roles: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <CmsTextarea
          label="Hero Description"
          rows={3}
          value={draft.home.heroDescription}
          onChange={(e) => updateHome({ heroDescription: e.target.value })}
        />
      </div>

      {/* Hero Media Assets */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
        <h3 className="font-display text-lg font-semibold text-white">Hero Portrait &amp; Background</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              key: 'profilePhotoUrl' as const,
              title: 'Hero Portrait Photo',
              hint: 'Replaces procedural canvas when set',
              val: draft.home.profilePhotoUrl,
            },
            {
              key: 'heroBackgroundUrl' as const,
              title: 'Hero Background Image',
              hint: 'Subtle monochrome backdrop layer',
              val: draft.home.heroBackgroundUrl,
            },
          ].map((slot) => (
            <div
              key={slot.key}
              className="p-4 rounded-xl border border-white/10 bg-[#050507] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{slot.title}</div>
                  <div className="text-xs text-zinc-500">{slot.hint}</div>
                </div>
                {slot.val && (
                  <button
                    type="button"
                    onClick={() => updateHome({ [slot.key]: '' })}
                    className="text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Clear / Use Canvas
                  </button>
                )}
              </div>
              <div className="h-36 rounded-lg border border-white/10 bg-black flex items-center justify-center overflow-hidden">
                {slot.val ? (
                  <img src={slot.val} alt={slot.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-mono text-zinc-600">Using Generative Monochrome Canvas</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget(slot.key)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{slot.val ? 'Replace Image' : 'Select / Upload Image'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hero CTA Buttons */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">Hero CTA Buttons</h3>
          <button
            type="button"
            onClick={() =>
              updateHome({
                ctas: [
                  ...draft.home.ctas,
                  {
                    id: `cta-${Date.now()}`,
                    label: 'New Action',
                    href: '#contact',
                    variant: 'secondary',
                    visible: true,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add CTA Button</span>
          </button>
        </div>

        <div className="space-y-3">
          {draft.home.ctas.map((cta, idx) => (
            <div
              key={cta.id}
              className="p-4 rounded-xl border border-white/10 bg-[#050507] grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <div className="md:col-span-4">
                <CmsInput
                  label="Label"
                  value={cta.label}
                  onChange={(e) => {
                    const next = [...draft.home.ctas];
                    next[idx] = { ...cta, label: e.target.value };
                    updateHome({ ctas: next });
                  }}
                />
              </div>
              <div className="md:col-span-4">
                <CmsInput
                  label="Link / Section (#about, #services, #contact, URL)"
                  value={cta.href}
                  onChange={(e) => {
                    const next = [...draft.home.ctas];
                    next[idx] = { ...cta, href: e.target.value };
                    updateHome({ ctas: next });
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <CmsSelect
                  label="Style"
                  value={cta.variant}
                  onChange={(e) => {
                    const next = [...draft.home.ctas];
                    next[idx] = { ...cta, variant: e.target.value as 'primary' | 'secondary' };
                    updateHome({ ctas: next });
                  }}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </CmsSelect>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => moveCta(idx, -1)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCta(idx, 1)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...draft.home.ctas];
                    next[idx] = { ...cta, visible: !cta.visible };
                    updateHome({ ctas: next });
                  }}
                  className="p-2 rounded-lg border border-white/10 text-zinc-300 hover:text-white"
                  title={cta.visible ? 'Hide' : 'Show'}
                >
                  {cta.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteCtaId(cta.id)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AboutEditorPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteStatId, setDeleteStatId] = useState<string | null>(null);
  const [newToolInput, setNewToolInput] = useState('');

  const updateAbout = (patch: Partial<CmsSiteState['about']>) =>
    onChange({ ...draft, about: { ...draft.about, ...patch } });

  const moveStat = (idx: number, dir: -1 | 1) => {
    const next = [...draft.about.stats];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateAbout({ stats: next });
  };

  const moveTimeline = (idx: number, dir: -1 | 1) => {
    const next = [...(draft.about.timeline ?? [])];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateAbout({ timeline: next });
  };

  const handleAddTools = () => {
    const parsed = newToolInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;
    const existing = draft.about.tools ?? [];
    const merged = [...existing];
    for (const item of parsed) {
      if (!merged.includes(item)) merged.push(item);
    }
    updateAbout({ tools: merged });
    setNewToolInput('');
  };

  return (
    <div className="space-y-8">
      <MediaPickerModal
        open={pickerOpen}
        acceptType="image"
        defaultFolderId="hero"
        usageLocation="About Portrait"
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => updateAbout({ photoUrl: item.url })}
      />

      <DeleteConfirmModal
        open={deleteStatId !== null}
        title="Delete Stat Card"
        description="Remove this stat card from the About section?"
        onCancel={() => setDeleteStatId(null)}
        onConfirm={() => {
          updateAbout({ stats: draft.about.stats.filter((s) => s.id !== deleteStatId) });
          setDeleteStatId(null);
        }}
      />

      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
        <h3 className="font-display text-lg font-semibold text-white">About Narrative &amp; Portrait</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CmsInput
            label="Section Title"
            value={draft.about.heading}
            onChange={(e) => updateAbout({ heading: e.target.value })}
          />
          <CmsInput
            label="Particle Label"
            value={draft.about.sectionLabel}
            onChange={(e) => updateAbout({ sectionLabel: e.target.value.toUpperCase() })}
          />
          <CmsInput
            label="Location"
            value={draft.about.location}
            onChange={(e) => updateAbout({ location: e.target.value })}
          />
          <CmsInput
            label="Availability Status"
            value={draft.about.availability}
            onChange={(e) => updateAbout({ availability: e.target.value })}
          />
        </div>

        <CmsTextarea
          label="Lead Intro"
          rows={2}
          value={draft.about.lead}
          onChange={(e) => updateAbout({ lead: e.target.value })}
        />

        <CmsTextarea
          label="Creative Philosophy Quote"
          rows={2}
          value={draft.about.philosophyQuote ?? ''}
          onChange={(e) => updateAbout({ philosophyQuote: e.target.value })}
          placeholder="Minimalism is not the absence of motion—it is motion distilled to pure intent."
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">PARAGRAPHS</span>
            <button
              type="button"
              onClick={() =>
                updateAbout({ paragraphs: [...draft.about.paragraphs, 'New bio paragraph...'] })
              }
              className="text-xs font-mono text-white hover:underline"
            >
              + Add Paragraph
            </button>
          </div>
          {draft.about.paragraphs.map((p, idx) => (
            <div key={idx} className="flex gap-2">
              <textarea
                rows={3}
                value={p}
                onChange={(e) => {
                  const next = [...draft.about.paragraphs];
                  next[idx] = e.target.value;
                  updateAbout({ paragraphs: next });
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050507] border border-white/15 text-sm text-white focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={() =>
                  updateAbout({
                    paragraphs: draft.about.paragraphs.filter((_, i) => i !== idx),
                  })
                }
                className="p-2.5 h-fit rounded-xl border border-white/15 text-zinc-400 hover:text-white"
                title="Remove paragraph"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* About Photo */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#050507] flex flex-col sm:flex-row items-center gap-4">
          <div className="w-32 h-24 rounded-lg border border-white/10 bg-black flex items-center justify-center overflow-hidden shrink-0">
            {draft.about.photoUrl ? (
              <img src={draft.about.photoUrl} alt="About portrait" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-mono text-zinc-600 text-center px-2">
                Generative Architecture Study
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium text-white">About Section Photo</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
              >
                {draft.about.photoUrl ? 'Change Photo' : 'Select / Upload Photo'}
              </button>
              {draft.about.photoUrl && (
                <button
                  type="button"
                  onClick={() => updateAbout({ photoUrl: '' })}
                  className="px-4 py-2 rounded-full border border-white/20 text-xs text-zinc-300 hover:text-white"
                >
                  Revert to Architectural Study
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tools & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-white">Tools &amp; Technologies</h3>
            <span className="text-[11px] font-mono text-zinc-500">
              {(draft.about.tools ?? []).length} items
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newToolInput}
              onChange={(e) => setNewToolInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTools();
                }
              }}
              placeholder="Add tool(s), comma separated..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050507] border border-white/15 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
            />
            <button
              type="button"
              onClick={handleAddTools}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {(draft.about.tools ?? []).map((tool, idx) => (
              <div key={`${tool}-${idx}`} className="flex items-center gap-2">
                <input
                  type="text"
                  value={tool}
                  onChange={(e) => {
                    const next = [...(draft.about.tools ?? [])];
                    next[idx] = e.target.value;
                    updateAbout({ tools: next });
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#050507] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateAbout({
                      tools: (draft.about.tools ?? []).filter((_, i) => i !== idx),
                    })
                  }
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Remove tool"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-white">Key Achievements</h3>
            <button
              type="button"
              onClick={() =>
                updateAbout({
                  achievements: [
                    ...(draft.about.achievements ?? []),
                    'New milestone or client impact highlight',
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Achievement</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {(draft.about.achievements ?? []).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <textarea
                  rows={2}
                  value={item}
                  onChange={(e) => {
                    const next = [...(draft.about.achievements ?? [])];
                    next[idx] = e.target.value;
                    updateAbout({ achievements: next });
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#050507] border border-white/10 text-xs text-white focus:outline-none focus:border-white resize-y"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateAbout({
                      achievements: (draft.about.achievements ?? []).filter((_, i) => i !== idx),
                    })
                  }
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Remove achievement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experience Timeline */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Experience Timeline</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Chronological milestones animated along the About vertical rail.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateAbout({
                timeline: [
                  ...(draft.about.timeline ?? []),
                  {
                    id: `tl-${Date.now()}`,
                    year: '2026',
                    title: 'New Role or Milestone',
                    organization: 'Studio / Client',
                    summary: 'Key architectural, design, or engineering contribution.',
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>
        </div>

        <div className="space-y-3">
          {(draft.about.timeline ?? []).map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-white/10 bg-[#050507] space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <CmsInput
                    label="Period"
                    value={item.year}
                    onChange={(e) => {
                      const next = [...(draft.about.timeline ?? [])];
                      next[idx] = { ...item, year: e.target.value };
                      updateAbout({ timeline: next });
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <CmsInput
                    label="Role / Title"
                    value={item.title}
                    onChange={(e) => {
                      const next = [...(draft.about.timeline ?? [])];
                      next[idx] = { ...item, title: e.target.value };
                      updateAbout({ timeline: next });
                    }}
                  />
                </div>
                <div className="md:col-span-3">
                  <CmsInput
                    label="Organization"
                    value={item.organization}
                    onChange={(e) => {
                      const next = [...(draft.about.timeline ?? [])];
                      next[idx] = { ...item, organization: e.target.value };
                      updateAbout({ timeline: next });
                    }}
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveTimeline(idx, -1)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTimeline(idx, 1)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateAbout({
                        timeline: (draft.about.timeline ?? []).filter((t) => t.id !== item.id),
                      })
                    }
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <CmsTextarea
                label="Summary"
                rows={2}
                value={item.summary}
                onChange={(e) => {
                  const next = [...(draft.about.timeline ?? [])];
                  next[idx] = { ...item, summary: e.target.value };
                  updateAbout({ timeline: next });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">About Stat Cards</h3>
          <button
            type="button"
            onClick={() =>
              updateAbout({
                stats: [
                  ...draft.about.stats,
                  {
                    id: `stat-${Date.now()}`,
                    value: '10+',
                    label: 'New Metric',
                    detail: 'Description',
                    visible: true,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stat Card</span>
          </button>
        </div>

        <div className="space-y-3">
          {draft.about.stats.map((st, idx) => (
            <div
              key={st.id}
              className="p-4 rounded-xl border border-white/10 bg-[#050507] grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <div className="md:col-span-2">
                <CmsInput
                  label="Value"
                  value={st.value}
                  onChange={(e) => {
                    const next = [...draft.about.stats];
                    next[idx] = { ...st, value: e.target.value };
                    updateAbout({ stats: next });
                  }}
                />
              </div>
              <div className="md:col-span-4">
                <CmsInput
                  label="Label"
                  value={st.label}
                  onChange={(e) => {
                    const next = [...draft.about.stats];
                    next[idx] = { ...st, label: e.target.value };
                    updateAbout({ stats: next });
                  }}
                />
              </div>
              <div className="md:col-span-4">
                <CmsInput
                  label="Detail"
                  value={st.detail}
                  onChange={(e) => {
                    const next = [...draft.about.stats];
                    next[idx] = { ...st, detail: e.target.value };
                    updateAbout({ stats: next });
                  }}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => moveStat(idx, -1)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStat(idx, 1)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...draft.about.stats];
                    next[idx] = { ...st, visible: !st.visible };
                    updateAbout({ stats: next });
                  }}
                  className="p-2 rounded-lg border border-white/10 text-zinc-300 hover:text-white"
                >
                  {st.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStatId(st.id)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkillsManagerPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pickerSkillId, setPickerSkillId] = useState<string | null>(null);

  const updateSkills = (patch: Partial<CmsSiteState['skills']>) =>
    onChange({ ...draft, skills: { ...draft.skills, ...patch } });

  const addSkill = () => {
    const newItem: SkillCmsItem = {
      id: `skill-${Date.now()}`,
      name: 'New Skill',
      category: 'Development',
      percentage: 90,
      description: 'Brief summary of expertise and capabilities.',
      iconKey: 'react',
      visible: true,
    };
    updateSkills({ items: [newItem, ...draft.skills.items] });
    setEditingId(newItem.id);
  };

  const moveSkill = (idx: number, dir: -1 | 1) => {
    const next = [...draft.skills.items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateSkills({ items: next });
  };

  return (
    <div className="space-y-6">
      <MediaPickerModal
        open={pickerSkillId !== null}
        acceptType="image"
        defaultFolderId="services"
        usageLocation="Skill Icon"
        onClose={() => setPickerSkillId(null)}
        onSelect={(item) => {
          updateSkills({
            items: draft.skills.items.map((sk) =>
              sk.id === pickerSkillId ? { ...sk, customIconUrl: item.url } : sk
            ),
          });
        }}
      />

      <DeleteConfirmModal
        open={deleteId !== null}
        title="Delete Skill"
        description="Are you sure you want to remove this skill from your Creative Arsenal?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          updateSkills({ items: draft.skills.items.filter((s) => s.id !== deleteId) });
          setDeleteId(null);
        }}
      />

      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display text-lg font-semibold text-white">Skills Section Settings</h3>
          <button
            type="button"
            onClick={addSkill}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Skill</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CmsInput
            label="Heading"
            value={draft.skills.heading}
            onChange={(e) => updateSkills({ heading: e.target.value })}
          />
          <CmsInput
            label="Particle Word"
            value={draft.skills.sectionLabel}
            onChange={(e) => updateSkills({ sectionLabel: e.target.value.toUpperCase() })}
          />
        </div>
        <CmsTextarea
          label="Description"
          rows={2}
          value={draft.skills.description}
          onChange={(e) => updateSkills({ description: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        {draft.skills.items.map((skill, idx) => {
          const isExpanded = editingId === skill.id;
          return (
            <div
              key={skill.id}
              className="rounded-2xl border border-white/10 bg-[#09090C] overflow-hidden"
            >
              <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500 tabular-nums w-6">
                    {idx + 1}.
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{skill.name}</div>
                    <div className="text-xs font-mono text-zinc-400">
                      {skill.category} · {skill.percentage}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveSkill(idx, -1)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSkill(idx, 1)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSkills({
                        items: draft.skills.items.map((s) =>
                          s.id === skill.id ? { ...s, visible: !s.visible } : s
                        ),
                      })
                    }
                    className="p-2 rounded-lg border border-white/10 text-zinc-300 hover:text-white"
                  >
                    {skill.visible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(isExpanded ? null : skill.id)}
                    className="px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors"
                  >
                    {isExpanded ? 'Done' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(skill.id)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-white/10 bg-[#050507] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <CmsInput
                      label="Skill Name"
                      value={skill.name}
                      onChange={(e) =>
                        updateSkills({
                          items: draft.skills.items.map((s) =>
                            s.id === skill.id ? { ...s, name: e.target.value } : s
                          ),
                        })
                      }
                    />
                    <CmsSelect
                      label="Category"
                      value={skill.category}
                      onChange={(e) =>
                        updateSkills({
                          items: draft.skills.items.map((s) =>
                            s.id === skill.id
                              ? { ...s, category: e.target.value as SkillCategory }
                              : s
                          ),
                        })
                      }
                    >
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Motion">Motion</option>
                      <option value="AI">AI</option>
                      <option value="Other">Other</option>
                    </CmsSelect>
                    <CmsSelect
                      label="Built-In Icon"
                      value={skill.iconKey}
                      onChange={(e) =>
                        updateSkills({
                          items: draft.skills.items.map((s) =>
                            s.id === skill.id
                              ? { ...s, iconKey: e.target.value as SkillIconKey }
                              : s
                          ),
                        })
                      }
                    >
                      <option value="react">React / Atom</option>
                      <option value="nextjs">Next.js / Layers</option>
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="html">HTML5</option>
                      <option value="css">CSS</option>
                      <option value="tailwind">Tailwind</option>
                      <option value="figma">Figma</option>
                      <option value="uiux">UI/UX Compass</option>
                      <option value="motion">Motion Wand</option>
                      <option value="video">Video Film</option>
                      <option value="ai">AI Brain</option>
                    </CmsSelect>
                  </div>

                  <CmsSlider
                    label="Proficiency Percentage"
                    value={skill.percentage}
                    min={0}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={(val) =>
                      updateSkills({
                        items: draft.skills.items.map((s) =>
                          s.id === skill.id ? { ...s, percentage: val } : s
                        ),
                      })
                    }
                  />

                  <CmsTextarea
                    label="Description"
                    rows={2}
                    value={skill.description}
                    onChange={(e) =>
                      updateSkills({
                        items: draft.skills.items.map((s) =>
                          s.id === skill.id ? { ...s, description: e.target.value } : s
                        ),
                      })
                    }
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPickerSkillId(skill.id)}
                      className="px-4 py-2 rounded-full border border-white/20 text-xs text-white hover:bg-white hover:text-black"
                    >
                      {skill.customIconUrl ? 'Replace Custom Icon' : 'Upload Custom Icon'}
                    </button>
                    {skill.customIconUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          updateSkills({
                            items: draft.skills.items.map((s) =>
                              s.id === skill.id ? { ...s, customIconUrl: undefined } : s
                            ),
                          })
                        }
                        className="text-xs font-mono text-zinc-400 hover:text-white"
                      >
                        Remove Custom Icon
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ServicesManagerPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pickerCtx, setPickerCtx] = useState<{
    id: string;
    field: 'customIconUrl' | 'imageUrl';
  } | null>(null);

  const updateServices = (patch: Partial<CmsSiteState['services']>) =>
    onChange({ ...draft, services: { ...draft.services, ...patch } });

  const addService = () => {
    const newItem: ServiceCmsItem = {
      id: `svc-${Date.now()}`,
      index: `${String(draft.services.items.length + 1).padStart(2, '0')}.`,
      title: 'New Studio Service',
      category: 'Consulting',
      description: 'Describe the scope, craft, and deliverable value of this service.',
      iconKey: 'creative',
      buttonLabel: 'Inquire',
      buttonHref: '#contact',
      visible: true,
    };
    updateServices({ items: [newItem, ...draft.services.items] });
    setEditingId(newItem.id);
  };

  const duplicateService = (svc: ServiceCmsItem) => {
    const copy: ServiceCmsItem = {
      ...svc,
      id: `svc-${Date.now()}`,
      title: `${svc.title} (Copy)`,
    };
    updateServices({ items: [...draft.services.items, copy] });
  };

  const moveService = (idx: number, dir: -1 | 1) => {
    const next = [...draft.services.items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateServices({ items: next });
  };

  return (
    <div className="space-y-6">
      <MediaPickerModal
        open={pickerCtx !== null}
        acceptType="image"
        defaultFolderId="services"
        usageLocation={pickerCtx?.field === 'imageUrl' ? 'Service Preview' : 'Service Icon'}
        onClose={() => setPickerCtx(null)}
        onSelect={(item) => {
          if (!pickerCtx) return;
          updateServices({
            items: draft.services.items.map((s) =>
              s.id === pickerCtx.id ? { ...s, [pickerCtx.field]: item.url } : s
            ),
          });
        }}
      />

      <DeleteConfirmModal
        open={deleteId !== null}
        title="Delete Service"
        description="Are you sure you want to delete this service?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          updateServices({ items: draft.services.items.filter((s) => s.id !== deleteId) });
          setDeleteId(null);
        }}
      />

      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display text-lg font-semibold text-white">Services Manager</h3>
          <button
            type="button"
            onClick={addService}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CmsInput
            label="Section Heading"
            value={draft.services.heading}
            onChange={(e) => updateServices({ heading: e.target.value })}
          />
          <CmsInput
            label="Particle Word"
            value={draft.services.sectionLabel}
            onChange={(e) => updateServices({ sectionLabel: e.target.value.toUpperCase() })}
          />
        </div>
        <CmsTextarea
          label="Section Description"
          rows={2}
          value={draft.services.description}
          onChange={(e) => updateServices({ description: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        {draft.services.items.map((svc, idx) => {
          const isExpanded = editingId === svc.id;
          return (
            <div
              key={svc.id}
              className="rounded-2xl border border-white/10 bg-[#09090C] overflow-hidden"
            >
              <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-500">{svc.index}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{svc.title}</div>
                    <div className="text-xs text-zinc-500">{svc.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveService(idx, -1)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveService(idx, 1)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateService(svc)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                    title="Duplicate service"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateServices({
                        items: draft.services.items.map((s) =>
                          s.id === svc.id ? { ...s, visible: !s.visible } : s
                        ),
                      })
                    }
                    className="p-2 rounded-lg border border-white/10 text-zinc-300 hover:text-white"
                  >
                    {svc.visible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(isExpanded ? null : svc.id)}
                    className="px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors"
                  >
                    {isExpanded ? 'Done' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(svc.id)}
                    className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-white/10 bg-[#050507] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <CmsInput
                      label="Number Index"
                      value={svc.index}
                      onChange={(e) =>
                        updateServices({
                          items: draft.services.items.map((s) =>
                            s.id === svc.id ? { ...s, index: e.target.value } : s
                          ),
                        })
                      }
                    />
                    <div className="sm:col-span-2">
                      <CmsInput
                        label="Service Title"
                        value={svc.title}
                        onChange={(e) =>
                          updateServices({
                            items: draft.services.items.map((s) =>
                              s.id === svc.id ? { ...s, title: e.target.value } : s
                            ),
                          })
                        }
                      />
                    </div>
                    <CmsInput
                      label="Category"
                      value={svc.category}
                      onChange={(e) =>
                        updateServices({
                          items: draft.services.items.map((s) =>
                            s.id === svc.id ? { ...s, category: e.target.value } : s
                          ),
                        })
                      }
                    />
                  </div>

                  <CmsTextarea
                    label="Description"
                    rows={3}
                    value={svc.description}
                    onChange={(e) =>
                      updateServices({
                        items: draft.services.items.map((s) =>
                          s.id === svc.id ? { ...s, description: e.target.value } : s
                        ),
                      })
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <CmsSelect
                      label="Built-In Icon"
                      value={svc.iconKey}
                      onChange={(e) =>
                        updateServices({
                          items: draft.services.items.map((s) =>
                            s.id === svc.id
                              ? { ...s, iconKey: e.target.value as ServiceIconKey }
                              : s
                          ),
                        })
                      }
                    >
                      <option value="web">Web Monitor</option>
                      <option value="uiux">UI/UX Compass</option>
                      <option value="creative">Creative Sparkles</option>
                      <option value="video">Video Play</option>
                      <option value="motion">Motion Wand</option>
                      <option value="ai">AI Processor</option>
                    </CmsSelect>
                    <CmsInput
                      label="Button Label"
                      value={svc.buttonLabel}
                      onChange={(e) =>
                        updateServices({
                          items: draft.services.items.map((s) =>
                            s.id === svc.id ? { ...s, buttonLabel: e.target.value } : s
                          ),
                        })
                      }
                    />
                    <CmsInput
                      label="Button Link"
                      value={svc.buttonHref}
                      onChange={(e) =>
                        updateServices({
                          items: draft.services.items.map((s) =>
                            s.id === svc.id ? { ...s, buttonHref: e.target.value } : s
                          ),
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setPickerCtx({ id: svc.id, field: 'customIconUrl' })}
                      className="px-4 py-2 rounded-full border border-white/20 text-xs text-white hover:bg-white hover:text-black"
                    >
                      {svc.customIconUrl ? 'Replace Icon Image' : 'Upload Icon Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerCtx({ id: svc.id, field: 'imageUrl' })}
                      className="px-4 py-2 rounded-full border border-white/20 text-xs text-white hover:bg-white hover:text-black"
                    >
                      {svc.imageUrl ? 'Replace Floating Hover Image' : 'Set Floating Hover Image'}
                    </button>
                    {svc.imageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          updateServices({
                            items: draft.services.items.map((s) =>
                              s.id === svc.id ? { ...s, imageUrl: undefined } : s
                            ),
                          })
                        }
                        className="text-xs font-mono text-zinc-400 hover:text-white"
                      >
                        Clear Hover Image
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
