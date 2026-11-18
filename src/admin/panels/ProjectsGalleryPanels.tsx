import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Film,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type {
  CmsSiteState,
  GalleryItem,
  ProjectCategory,
  ProjectCmsItem,
  ProjectVisualVariant,
} from '../../types/cms';
import {
  CmsInput,
  CmsSelect,
  CmsTextarea,
  CmsToggle,
  DeleteConfirmModal,
  MediaPickerModal,
} from '../components/AdminPrimitives';

interface EditorProps {
  draft: CmsSiteState;
  onChange: (next: CmsSiteState) => void;
}

export const ProjectsManagerPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<
    | { projectId: string; field: 'thumbnailUrl' | 'videoUrl' | 'galleryAppend' }
    | null
  >(null);
  const [dragGalleryIdx, setDragGalleryIdx] = useState<number | null>(null);

  const updateProjects = (patch: Partial<CmsSiteState['projects']>) =>
    onChange({ ...draft, projects: { ...draft.projects, ...patch } });

  const createNewProject = () => {
    const newItem: ProjectCmsItem = {
      id: `proj-${Date.now()}`,
      title: 'Untitled Studio Project',
      category: 'CODE',
      year: String(new Date().getFullYear()),
      client: 'Independent Studio',
      role: 'Developer & Designer',
      shortDescription: 'Concise summary displayed on the portfolio showcase card.',
      fullDescription: 'Detailed narrative covering architecture, visual craft, and impact.',
      tags: ['React', 'TypeScript', 'Motion'],
      featured: false,
      visible: true,
      visualVariant: 'monolith',
      thumbnailUrl: '',
      galleryUrls: [],
      videoUrl: '',
      liveUrl: '',
      githubUrl: '',
      challenge: 'Core problem solved in this engagement.',
      solution: 'Design & engineering strategy delivered.',
      deliverables: ['Web Application', 'Design System'],
      metrics: [{ label: 'Performance', value: '100 / 100' }],
    };
    updateProjects({ items: [newItem, ...draft.projects.items] });
    setEditingId(newItem.id);
  };

  const duplicateProject = (p: ProjectCmsItem) => {
    const copy: ProjectCmsItem = {
      ...p,
      id: `proj-${Date.now()}`,
      title: `${p.title} (Copy)`,
      featured: false,
    };
    updateProjects({ items: [copy, ...draft.projects.items] });
  };

  const moveProject = (idx: number, dir: -1 | 1) => {
    const next = [...draft.projects.items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateProjects({ items: next });
  };

  const editingProject = draft.projects.items.find((p) => p.id === editingId) || null;

  const updateOne = (id: string, patch: Partial<ProjectCmsItem>) => {
    updateProjects({
      items: draft.projects.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const filtered = draft.projects.items.filter((p) => {
    if (catFilter !== 'ALL' && p.category !== catFilter) return false;
    if (
      search.trim() &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <MediaPickerModal
        open={pickerMode !== null}
        acceptType={pickerMode?.field === 'videoUrl' ? 'video' : 'image'}
        defaultFolderId="projects"
        usageLocation={`Project ${pickerMode?.field || 'Asset'}`}
        onClose={() => setPickerMode(null)}
        onSelect={(item) => {
          if (!pickerMode) return;
          const target = draft.projects.items.find((p) => p.id === pickerMode.projectId);
          if (!target) return;
          if (pickerMode.field === 'galleryAppend') {
            updateOne(target.id, { galleryUrls: [...(target.galleryUrls || []), item.url] });
          } else {
            updateOne(target.id, { [pickerMode.field]: item.url });
          }
        }}
      />

      <DeleteConfirmModal
        open={deleteId !== null}
        title="Delete Project"
        description="Are you sure you want to delete this project permanently from the portfolio?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          updateProjects({ items: draft.projects.items.filter((p) => p.id !== deleteId) });
          if (editingId === deleteId) setEditingId(null);
          setDeleteId(null);
        }}
      />

      {/* Section Header */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display text-lg font-semibold text-white">Projects Section</h3>
          <button
            type="button"
            onClick={createNewProject}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CmsInput
            label="Section Heading"
            value={draft.projects.heading}
            onChange={(e) => updateProjects({ heading: e.target.value })}
          />
          <CmsInput
            label="Particle Word"
            value={draft.projects.sectionLabel}
            onChange={(e) => updateProjects({ sectionLabel: e.target.value.toUpperCase() })}
          />
        </div>
        <CmsTextarea
          label="Section Description"
          rows={2}
          value={draft.projects.description}
          onChange={(e) => updateProjects({ description: e.target.value })}
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title or tech tag..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09090C] border border-white/15 text-sm text-white focus:outline-none focus:border-white"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#09090C] border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-white"
        >
          <option value="ALL">ALL CATEGORIES</option>
          <option value="CODE">CODE</option>
          <option value="DESIGN">DESIGN</option>
          <option value="MOTION">MOTION</option>
          <option value="AI">AI</option>
          <option value="WEB">WEB</option>
          <option value="VIDEO">VIDEO</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      {/* Editing Drawer / Card */}
      {editingProject && (
        <div className="p-6 rounded-2xl border border-white/25 bg-[#09090C] space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[11px] font-mono text-zinc-500">EDITING PROJECT</span>
              <h4 className="font-display text-xl font-bold text-white">{editingProject.title}</h4>
            </div>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold"
            >
              Done Editing
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <CmsInput
                label="Project Title"
                value={editingProject.title}
                onChange={(e) => updateOne(editingProject.id, { title: e.target.value })}
              />
            </div>
            <CmsSelect
              label="Category"
              value={editingProject.category}
              onChange={(e) =>
                updateOne(editingProject.id, { category: e.target.value as ProjectCategory })
              }
            >
              <option value="CODE">CODE</option>
              <option value="DESIGN">DESIGN</option>
              <option value="MOTION">MOTION</option>
              <option value="AI">AI</option>
              <option value="WEB">WEB</option>
              <option value="VIDEO">VIDEO</option>
              <option value="OTHER">OTHER</option>
            </CmsSelect>

            <CmsInput
              label="Year"
              value={editingProject.year}
              onChange={(e) => updateOne(editingProject.id, { year: e.target.value })}
            />
            <CmsInput
              label="Client / Studio"
              value={editingProject.client}
              onChange={(e) => updateOne(editingProject.id, { client: e.target.value })}
            />
            <CmsInput
              label="Role"
              value={editingProject.role}
              onChange={(e) => updateOne(editingProject.id, { role: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CmsTextarea
              label="Short Description (Card)"
              rows={3}
              value={editingProject.shortDescription}
              onChange={(e) => updateOne(editingProject.id, { shortDescription: e.target.value })}
            />
            <CmsTextarea
              label="Full Description (Case Study Modal)"
              rows={3}
              value={editingProject.fullDescription}
              onChange={(e) => updateOne(editingProject.id, { fullDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CmsInput
              label="Tech Tags (comma-separated)"
              value={editingProject.tags.join(', ')}
              onChange={(e) =>
                updateOne(editingProject.id, {
                  tags: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <CmsInput
              label="Live URL"
              value={editingProject.liveUrl}
              onChange={(e) => updateOne(editingProject.id, { liveUrl: e.target.value })}
            />
            <CmsInput
              label="GitHub URL"
              value={editingProject.githubUrl}
              onChange={(e) => updateOne(editingProject.id, { githubUrl: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CmsSelect
              label="Fallback Generative Artwork"
              value={editingProject.visualVariant}
              onChange={(e) =>
                updateOne(editingProject.id, {
                  visualVariant: e.target.value as ProjectVisualVariant,
                })
              }
            >
              <option value="monolith">Monolith Architecture</option>
              <option value="vespera">Vespera Typography</option>
              <option value="kinetix">Kinetix Motion Reel</option>
              <option value="aether">Aether AI Nodes</option>
              <option value="nocturne">Nocturne Harmonics</option>
              <option value="forma">Forma Tokens Grid</option>
            </CmsSelect>
            <CmsToggle
              label="Featured Project"
              description="Spans wider editorial column"
              checked={editingProject.featured}
              onChange={(val) => updateOne(editingProject.id, { featured: val })}
            />
            <CmsToggle
              label="Visible on Public Site"
              description="Show or hide from visitors"
              checked={editingProject.visible}
              onChange={(val) => updateOne(editingProject.id, { visible: val })}
            />
          </div>

          {/* Thumbnail & Video Uploaders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-[#050507] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                <span>THUMBNAIL IMAGE</span>
                {editingProject.thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => updateOne(editingProject.id, { thumbnailUrl: '' })}
                    className="text-zinc-500 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              {editingProject.thumbnailUrl && (
                <img
                  src={editingProject.thumbnailUrl}
                  alt="Thumbnail"
                  className="h-32 w-full object-cover rounded-lg border border-white/10"
                />
              )}
              <button
                type="button"
                onClick={() =>
                  setPickerMode({ projectId: editingProject.id, field: 'thumbnailUrl' })
                }
                className="w-full py-2.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white hover:text-black flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{editingProject.thumbnailUrl ? 'Replace Thumbnail' : 'Upload / Pick Thumbnail'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#050507] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                <span>VIDEO PREVIEW (MP4 / WEBM)</span>
                {editingProject.videoUrl && (
                  <button
                    type="button"
                    onClick={() => updateOne(editingProject.id, { videoUrl: '' })}
                    className="text-zinc-500 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              {editingProject.videoUrl && (
                <video
                  src={editingProject.videoUrl}
                  muted
                  loop
                  autoPlay
                  className="h-32 w-full object-cover rounded-lg border border-white/10"
                />
              )}
              <button
                type="button"
                onClick={() => setPickerMode({ projectId: editingProject.id, field: 'videoUrl' })}
                className="w-full py-2.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white hover:text-black flex items-center justify-center gap-2"
              >
                <Film className="w-3.5 h-3.5" />
                <span>{editingProject.videoUrl ? 'Replace Video' : 'Upload / Pick Video'}</span>
              </button>
            </div>
          </div>

          {/* Drag-and-Drop Multi-Image Gallery */}
          <div className="p-4 rounded-xl border border-white/10 bg-[#050507] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-zinc-300">PROJECT GALLERY IMAGES</div>
                <div className="text-[11px] text-zinc-500">Drag images to reorder case study carousel</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPickerMode({ projectId: editingProject.id, field: 'galleryAppend' })
                }
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Gallery Image</span>
              </button>
            </div>

            {editingProject.galleryUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {editingProject.galleryUrls.map((url, gIdx) => (
                  <div
                    key={`${url}-${gIdx}`}
                    draggable
                    onDragStart={() => setDragGalleryIdx(gIdx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragGalleryIdx === null || dragGalleryIdx === gIdx) return;
                      const next = [...editingProject.galleryUrls];
                      const [moved] = next.splice(dragGalleryIdx, 1);
                      next.splice(gIdx, 0, moved);
                      updateOne(editingProject.id, { galleryUrls: next });
                      setDragGalleryIdx(null);
                    }}
                    className="group relative aspect-[4/3] rounded-lg border border-white/15 bg-black overflow-hidden cursor-grab"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-white">
                      #{gIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateOne(editingProject.id, {
                          galleryUrls: editingProject.galleryUrls.filter((_, i) => i !== gIdx),
                        })
                      }
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-white hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CmsTextarea
              label="Challenge"
              rows={2}
              value={editingProject.challenge}
              onChange={(e) => updateOne(editingProject.id, { challenge: e.target.value })}
            />
            <CmsTextarea
              label="Architecture & Solution"
              rows={2}
              value={editingProject.solution}
              onChange={(e) => updateOne(editingProject.id, { solution: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-3">
        {filtered.map((project) => {
          const realIdx = draft.projects.items.findIndex((p) => p.id === project.id);
          return (
            <div
              key={project.id}
              className="p-4 rounded-2xl border border-white/10 bg-[#09090C] flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-12 rounded-lg border border-white/10 bg-black overflow-hidden shrink-0 flex items-center justify-center">
                  {project.thumbnailUrl ? (
                    <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500">{project.category}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {project.title}
                    </span>
                    {project.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-mono font-semibold">
                        FEATURED
                      </span>
                    )}
                    {!project.visible && (
                      <span className="px-2 py-0.5 rounded-full border border-white/20 text-zinc-400 text-[9px] font-mono">
                        HIDDEN
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-zinc-400 truncate mt-0.5">
                    {project.category} · {project.year} · {project.tags.join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveProject(realIdx, -1)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveProject(realIdx, 1)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateOne(project.id, { featured: !project.featured })}
                  className={`p-2 rounded-lg border transition-colors ${
                    project.featured
                      ? 'border-white bg-white text-black'
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle Featured"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateProject(project)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateOne(project.id, { visible: !project.visible })}
                  className="p-2 rounded-lg border border-white/10 text-zinc-300 hover:text-white"
                  title={project.visible ? 'Hide' : 'Show'}
                >
                  {project.visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === project.id ? null : project.id)}
                  className="px-4 py-1.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors"
                >
                  {editingId === project.id ? 'Close' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(project.id)}
                  className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GalleryManagerPanel: React.FC<EditorProps> = ({ draft, onChange }) => {
  const [newAlbumName, setNewAlbumName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [pickerItemId, setPickerItemId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const updateGallery = (patch: Partial<CmsSiteState['gallery']>) =>
    onChange({ ...draft, gallery: { ...draft.gallery, ...patch } });

  const addAlbum = () => {
    if (!newAlbumName.trim()) return;
    updateGallery({
      albums: [
        ...draft.gallery.albums,
        {
          id: `album-${Date.now()}`,
          name: newAlbumName.trim(),
          description: '',
          visible: true,
        },
      ],
    });
    setNewAlbumName('');
  };

  const addFrame = () => {
    const firstAlbum = draft.gallery.albums[0]?.id || '';
    const item: GalleryItem = {
      id: `gal-${Date.now()}`,
      title: 'Untitled Visual Frame',
      caption: 'Monochrome visual study',
      albumId: firstAlbum,
      mediaUrl: '',
      mediaType: 'image',
      aspectRatio: 'landscape',
      visualVariant: 'monolith',
      visible: true,
    };
    updateGallery({ items: [item, ...draft.gallery.items] });
    setEditingItemId(item.id);
  };

  return (
    <div className="space-y-8">
      <MediaPickerModal
        open={pickerItemId !== null}
        acceptType="all"
        defaultFolderId="gallery"
        usageLocation="Gallery Frame"
        onClose={() => setPickerItemId(null)}
        onSelect={(media) => {
          updateGallery({
            items: draft.gallery.items.map((g) =>
              g.id === pickerItemId
                ? { ...g, mediaUrl: media.url, mediaType: media.mediaType }
                : g
            ),
          });
        }}
      />

      <DeleteConfirmModal
        open={deleteItemId !== null}
        title="Delete Gallery Frame"
        description="Are you sure you want to remove this visual item from Gallery?"
        onCancel={() => setDeleteItemId(null)}
        onConfirm={() => {
          updateGallery({
            items: draft.gallery.items.filter((g) => g.id !== deleteItemId),
          });
          setDeleteItemId(null);
        }}
      />

      {/* Gallery Header */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display text-lg font-semibold text-white">Gallery &amp; Albums Manager</h3>
          <button
            type="button"
            onClick={addFrame}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Gallery Item</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CmsInput
            label="Section Heading"
            value={draft.gallery.heading}
            onChange={(e) => updateGallery({ heading: e.target.value })}
          />
          <CmsInput
            label="Particle Word"
            value={draft.gallery.sectionLabel}
            onChange={(e) => updateGallery({ sectionLabel: e.target.value.toUpperCase() })}
          />
        </div>
        <CmsTextarea
          label="Section Description"
          rows={2}
          value={draft.gallery.description}
          onChange={(e) => updateGallery({ description: e.target.value })}
        />
      </div>

      {/* Albums */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-display text-base font-semibold text-white">Albums</h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="New album name..."
              className="px-3.5 py-2 rounded-xl bg-[#050507] border border-white/15 text-xs text-white focus:outline-none focus:border-white"
            />
            <button
              type="button"
              onClick={addAlbum}
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold"
            >
              Add Album
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {draft.gallery.albums.map((alb) => (
            <div
              key={alb.id}
              className="p-3.5 rounded-xl border border-white/10 bg-[#050507] flex items-center justify-between gap-2"
            >
              <input
                type="text"
                value={alb.name}
                onChange={(e) =>
                  updateGallery({
                    albums: draft.gallery.albums.map((a) =>
                      a.id === alb.id ? { ...a, name: e.target.value } : a
                    ),
                  })
                }
                className="bg-transparent text-sm text-white focus:outline-none flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() =>
                  updateGallery({
                    albums: draft.gallery.albums.map((a) =>
                      a.id === alb.id ? { ...a, visible: !a.visible } : a
                    ),
                  })
                }
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                {alb.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() =>
                  updateGallery({
                    albums: draft.gallery.albums.filter((a) => a.id !== alb.id),
                  })
                }
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Drag & Drop Gallery Items */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-zinc-500">
          DRAG CARDS TO REORDER PUBLIC GALLERY ({draft.gallery.items.length} ITEMS)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {draft.gallery.items.map((item, idx) => {
            const isEditing = editingItemId === item.id;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx === null || dragIdx === idx) return;
                  const next = [...draft.gallery.items];
                  const [moved] = next.splice(dragIdx, 1);
                  next.splice(idx, 0, moved);
                  updateGallery({ items: next });
                  setDragIdx(null);
                }}
                className="rounded-2xl border border-white/10 bg-[#09090C] overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab shrink-0" />
                    <div className="w-14 h-10 rounded-lg border border-white/10 bg-black overflow-hidden shrink-0 flex items-center justify-center">
                      {item.mediaUrl ? (
                        item.mediaType === 'video' ? (
                          <video src={item.mediaUrl} muted className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <ImageIcon className="w-4 h-4 text-zinc-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate">
                        {draft.gallery.albums.find((a) => a.id === item.albumId)?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateGallery({
                          items: draft.gallery.items.map((g) =>
                            g.id === item.id ? { ...g, visible: !g.visible } : g
                          ),
                        })
                      }
                      className="p-2 rounded-lg border border-white/10 text-zinc-300 hover:text-white"
                    >
                      {item.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItemId(isEditing ? null : item.id)}
                      className="px-3 py-1.5 rounded-full border border-white/20 text-xs text-white hover:bg-white hover:text-black"
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteItemId(item.id)}
                      className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="p-4 border-t border-white/10 bg-[#050507] space-y-3">
                    <CmsInput
                      label="Title"
                      value={item.title}
                      onChange={(e) =>
                        updateGallery({
                          items: draft.gallery.items.map((g) =>
                            g.id === item.id ? { ...g, title: e.target.value } : g
                          ),
                        })
                      }
                    />
                    <CmsInput
                      label="Caption"
                      value={item.caption}
                      onChange={(e) =>
                        updateGallery({
                          items: draft.gallery.items.map((g) =>
                            g.id === item.id ? { ...g, caption: e.target.value } : g
                          ),
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <CmsSelect
                        label="Album"
                        value={item.albumId}
                        onChange={(e) =>
                          updateGallery({
                            items: draft.gallery.items.map((g) =>
                              g.id === item.id ? { ...g, albumId: e.target.value } : g
                            ),
                          })
                        }
                      >
                        {draft.gallery.albums.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </CmsSelect>
                      <CmsSelect
                        label="Fallback Artwork"
                        value={item.visualVariant || 'monolith'}
                        onChange={(e) =>
                          updateGallery({
                            items: draft.gallery.items.map((g) =>
                              g.id === item.id
                                ? { ...g, visualVariant: e.target.value as ProjectVisualVariant }
                                : g
                            ),
                          })
                        }
                      >
                        <option value="monolith">Monolith</option>
                        <option value="vespera">Vespera</option>
                        <option value="kinetix">Kinetix</option>
                        <option value="aether">Aether</option>
                        <option value="nocturne">Nocturne</option>
                        <option value="forma">Forma</option>
                      </CmsSelect>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPickerItemId(item.id)}
                        className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold"
                      >
                        {item.mediaUrl ? 'Replace Image/Video' : 'Upload / Pick Image or Video'}
                      </button>
                      {item.mediaUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            updateGallery({
                              items: draft.gallery.items.map((g) =>
                                g.id === item.id ? { ...g, mediaUrl: '' } : g
                              ),
                            })
                          }
                          className="text-xs font-mono text-zinc-400 hover:text-white"
                        >
                          Revert to Artwork
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
    </div>
  );
};
