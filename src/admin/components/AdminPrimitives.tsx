import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Film,
  Image as ImageIcon,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import type { MediaFolder, MediaItem, ParticleSettings } from '../../types/cms';

export const CmsFieldLabel: React.FC<{ label: string; hint?: string }> = ({ label, hint }) => (
  <div className="flex items-center justify-between gap-2 mb-1.5">
    <span className="text-xs font-mono tracking-[0.08em] text-zinc-300 uppercase">{label}</span>
    {hint && <span className="text-[11px] font-mono text-zinc-500">{hint}</span>}
  </div>
);

export const CmsInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }
> = ({ label, hint, className = '', ...props }) => (
  <div>
    {label && <CmsFieldLabel label={label} hint={hint} />}
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#070709] border border-white/15 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors ${className}`}
    />
  </div>
);

export const CmsTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }
> = ({ label, hint, className = '', ...props }) => (
  <div>
    {label && <CmsFieldLabel label={label} hint={hint} />}
    <textarea
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#070709] border border-white/15 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors resize-y ${className}`}
    />
  </div>
);

export const CmsSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
> = ({ label, className = '', children, ...props }) => (
  <div>
    {label && <CmsFieldLabel label={label} />}
    <select
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#070709] border border-white/15 text-sm text-white focus:outline-none focus:border-white transition-colors ${className}`}
    >
      {children}
    </select>
  </div>
);

export const CmsToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-4 p-3.5 rounded-xl border border-white/10 bg-[#08080B] hover:border-white/25 transition-colors text-left"
  >
    <div>
      <div className="text-sm font-medium text-white">{label}</div>
      {description && <div className="text-xs text-zinc-500 mt-0.5">{description}</div>}
    </div>
    <span
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 border ${
        checked ? 'bg-white border-white' : 'bg-zinc-900 border-white/20'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
          checked ? 'translate-x-5 bg-black' : 'translate-x-0.5 bg-zinc-400'
        }`}
      />
    </span>
  </button>
);

export const CmsSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step, suffix = '', onChange }) => (
  <div className="p-3.5 rounded-xl border border-white/10 bg-[#08080B]">
    <div className="flex items-center justify-between gap-2 mb-2">
      <span className="text-xs font-mono text-zinc-300">{label}</span>
      <span className="text-xs font-mono text-white tabular-nums">
        {Number.isInteger(step) ? value : value.toFixed(2)}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-white cursor-pointer"
    />
  </div>
);

export const CmsColorField: React.FC<{
  label: string;
  value: string;
  onChange: (hex: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="p-3 rounded-xl border border-white/10 bg-[#08080B]">
    <CmsFieldLabel label={label} />
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#050505'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="w-10 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#050505"
        className="flex-1 px-3 py-2 rounded-lg bg-[#050507] border border-white/15 font-mono text-xs text-white uppercase focus:outline-none focus:border-white"
      />
    </div>
  </div>
);

export const DeleteConfirmModal: React.FC<{
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({
  open,
  title = 'Delete Item',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#09090C] p-6 space-y-5 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full border border-white/25 bg-white/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-white/20 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const MediaPickerModal: React.FC<{
  open: boolean;
  acceptType?: 'all' | 'image' | 'video';
  defaultFolderId?: string;
  usageLocation?: string;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}> = ({
  open,
  acceptType = 'all',
  defaultFolderId = 'general',
  usageLocation = 'Website Section',
  onClose,
  onSelect,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [folderFilter, setFolderFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadLibrary = async () => {
    try {
      const data = await adminApi.listMedia();
      setItems(data.items);
      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load media library');
    }
  };

  useEffect(() => {
    if (open) {
      loadLibrary();
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const filtered = items.filter((item) => {
    if (acceptType !== 'all' && item.mediaType !== acceptType) return false;
    if (folderFilter !== 'ALL' && item.folderId !== folderFilter) return false;
    if (
      search.trim() &&
      !item.originalName.toLowerCase().includes(search.toLowerCase()) &&
      !item.usageLocation.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const res = await adminApi.uploadMedia(files, defaultFolderId, usageLocation);
      await loadLibrary();
      if (res.items[0]) {
        onSelect(res.items[0]);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl max-h-[86vh] rounded-2xl border border-white/20 bg-[#08080B] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Select or Upload Media</h3>
            <p className="text-xs text-zinc-500">Target: {usageLocation}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-zinc-300 hover:bg-white hover:text-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#050507] border border-white/15 text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#050507] border border-white/15 text-xs text-white focus:outline-none focus:border-white"
          >
            <option value="ALL">All Folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.svg,.gif,.mp4,.webm"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload New File'}</span>
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl border border-white/30 bg-white/5 text-xs text-zinc-200">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-2xl">
              No matching media files yet. Click &ldquo;Upload New File&rdquo; above to add media directly to disk.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group text-left rounded-xl border border-white/10 bg-[#0C0C0F] hover:border-white overflow-hidden transition-all"
                >
                  <div className="aspect-[4/3] bg-black relative overflow-hidden">
                    {item.mediaType === 'video' ? (
                      <video
                        src={item.url}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 border border-white/20 flex items-center justify-center text-white">
                      {item.mediaType === 'video' ? (
                        <Film className="w-3 h-3" />
                      ) : (
                        <ImageIcon className="w-3 h-3" />
                      )}
                    </span>
                    <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-medium text-white truncate">{item.originalName}</div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                      {(item.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LiveParticlePreview: React.FC<{ settings: ParticleSettings }> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 560;
    const h = 230;
    canvas.width = w;
    canvas.height = h;

    const count = Math.max(18, Math.min(180, Math.round(settings.count * 0.6)));
    const pts = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      phase: i * 0.5,
      depth: 0.5 + Math.random() * 0.8,
    }));

    const mouse = { x: w * 0.5, y: h * 0.5, active: false };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / Math.max(r.width, 1)) * w;
      mouse.y = ((e.clientY - r.top) / Math.max(r.height, 1)) * h;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    let raf = 0;
    let time = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = settingsRef.current;
      time += 0.02 * s.speed;

      if (s.trail > 0.04) {
        ctx.fillStyle = `rgba(5, 5, 6, ${Math.max(0.2, 1 - s.trail).toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      for (const p of pts) {
        p.vy += s.gravity * 0.015;
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 120 && d > 4) {
            p.vx += (dx / d) * 0.04 * s.mouseAttraction;
            p.vy += (dy / d) * 0.04 * s.mouseAttraction;
            if (d < 42) {
              p.vx -= (dx / d) * 0.08 * s.mouseRepulsion;
              p.vy -= (dy / d) * 0.08 * s.mouseRepulsion;
            }
          }
        }
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += (p.vx * s.speed + Math.cos(time + p.phase) * 0.25 * s.waveStrength) * (0.4 + p.depth * s.depth * 0.6);
        p.y += (p.vy * s.speed + Math.sin(time + p.phase) * 0.25 * s.waveStrength) * (0.4 + p.depth * s.depth * 0.6);

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.7, s.size * 0.85), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, s.opacity).toFixed(2)})`;
        ctx.fill();
      }

      if (s.connectionDistance > 10 && s.connectionOpacity > 0.01) {
        ctx.lineWidth = 0.7;
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            const d = Math.hypot(dx, dy);
            if (d < s.connectionDistance * 0.7) {
              const a = (1 - d / (s.connectionDistance * 0.7)) * s.connectionOpacity;
              ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [settings.count]);

  return (
    <div className="rounded-2xl border border-white/15 bg-[#050506] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>LIVE PARTICLE SANDBOX</span>
        <span>Move pointer inside frame to test attraction/repulsion</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[210px] block cursor-crosshair" />
    </div>
  );
};
