import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Film,
  FolderPlus,
  Image as ImageIcon,
  Mail,
  RefreshCw,
  Replace,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import type { ContactMessage, MediaFolder, MediaItem, MessageStatus } from '../../types/cms';
import {
  CmsInput,
  CmsSelect,
  CmsTextarea,
  DeleteConfirmModal,
} from '../components/AdminPrimitives';

export const MediaManagerPanel: React.FC<{ onLibraryUpdated?: () => void }> = ({
  onLibraryUpdated,
}) => {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'image' | 'video'>('ALL');
  const [search, setSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFolder, setUploadFolder] = useState('general');
  const [uploadUsage, setUploadUsage] = useState('Media Library');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFolder, setEditFolder] = useState('general');
  const [editUsage, setEditUsage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [deleteMediaId, setDeleteMediaId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const loadMedia = async () => {
    try {
      const res = await adminApi.listMedia();
      setFolders(res.folders);
      setItems(res.items);
      if (selectedItemId) {
        const found = res.items.find((i) => i.id === selectedItemId);
        if (found) {
          setEditName(found.originalName);
          setEditFolder(found.folderId);
          setEditUsage(found.usageLocation);
        }
      }
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to load media library');
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  useEffect(() => {
    if (selectedItem) {
      setEditName(selectedItem.originalName);
      setEditFolder(selectedItem.folderId);
      setEditUsage(selectedItem.usageLocation);
    }
  }, [selectedItemId]);

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    setStatusMsg('');
    try {
      const targetFolder = selectedFolder !== 'ALL' ? selectedFolder : uploadFolder;
      const res = await adminApi.uploadMedia(fileList, targetFolder, uploadUsage || 'Media Library');
      await loadMedia();
      onLibraryUpdated?.();
      if (res.items[0]) setSelectedItemId(res.items[0].id);
      setStatusMsg(`Uploaded ${res.items.length} file(s).`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceFile = async (fileList: FileList | null) => {
    if (!fileList || !fileList[0] || !selectedItem) return;
    setBusy(true);
    setStatusMsg('');
    try {
      await adminApi.replaceMedia(selectedItem.id, fileList[0]);
      await loadMedia();
      onLibraryUpdated?.();
      setStatusMsg('File replaced cleanly in place.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Replace failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!selectedItem) return;
    setBusy(true);
    try {
      await adminApi.updateMedia(selectedItem.id, {
        originalName: editName.trim() || selectedItem.originalName,
        folderId: editFolder,
        usageLocation: editUsage.trim() || 'Media Library',
      });
      await loadMedia();
      onLibraryUpdated?.();
      setStatusMsg('Media metadata updated.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to update media');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setBusy(true);
    try {
      const res = await adminApi.createMediaFolder(newFolderName.trim());
      setNewFolderName('');
      await loadMedia();
      setSelectedFolder(res.folder.id);
      setUploadFolder(res.folder.id);
      setStatusMsg(`Folder "${res.folder.name}" created.`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setBusy(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedFolder !== 'ALL' && item.folderId !== selectedFolder) return false;
    if (typeFilter !== 'ALL' && item.mediaType !== typeFilter) return false;
    if (
      search.trim() &&
      !item.originalName.toLowerCase().includes(search.toLowerCase()) &&
      !item.usageLocation.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard?.writeText(item.url).catch(() => {});
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((cur) => (cur === item.id ? null : cur)), 1500);
  };

  return (
    <div className="space-y-6">
      <DeleteConfirmModal
        open={deleteMediaId !== null}
        title="Delete Media File"
        description="This permanently removes the file from disk storage. Any published references to this URL will stop resolving."
        onCancel={() => setDeleteMediaId(null)}
        onConfirm={async () => {
          if (!deleteMediaId) return;
          const id = deleteMediaId;
          setDeleteMediaId(null);
          await adminApi.deleteMedia(id);
          if (selectedItemId === id) setSelectedItemId(null);
          await loadMedia();
          onLibraryUpdated?.();
          setStatusMsg('Media file deleted.');
        }}
      />

      <DeleteConfirmModal
        open={deleteFolderId !== null}
        title="Delete Folder"
        description="Files inside this folder will be moved back into General rather than deleted."
        onCancel={() => setDeleteFolderId(null)}
        onConfirm={async () => {
          if (!deleteFolderId) return;
          const id = deleteFolderId;
          setDeleteFolderId(null);
          await adminApi.deleteMediaFolder(id);
          if (selectedFolder === id) setSelectedFolder('ALL');
          await loadMedia();
        }}
      />

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUploadFiles(e.dataTransfer.files);
        }}
        className={`p-6 rounded-2xl border-2 border-dashed transition-colors ${
          dragOver ? 'border-white bg-white/[0.06]' : 'border-white/15 bg-[#09090C]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-white">
              Upload Media to Disk Storage
            </h3>
            <p className="text-xs text-zinc-400">
              Drag &amp; drop or choose files (JPG, JPEG, PNG, WEBP, SVG, GIF, MP4, WEBM · max 35MB).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedFolder !== 'ALL' ? selectedFolder : uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#050507] border border-white/15 text-xs text-white"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  Folder: {f.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={uploadUsage}
              onChange={(e) => setUploadUsage(e.target.value)}
              placeholder="Usage note (e.g. Hero)"
              className="px-3 py-2 rounded-xl bg-[#050507] border border-white/15 text-xs text-white w-44"
            />
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.svg,.gif,.mp4,.webm"
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => uploadInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{busy ? 'Uploading...' : 'Select Files'}</span>
            </button>
          </div>
        </div>
        {statusMsg && (
          <div className="mt-4 text-xs font-mono text-zinc-300 border-t border-white/10 pt-3">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Main Browser Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Folders Sidebar */}
        <div className="xl:col-span-3 p-5 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="text-xs font-mono tracking-[0.14em] text-zinc-500">FOLDERS</div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedFolder('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                selectedFolder === 'ALL'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.06]'
              }`}
            >
              <span>All Media</span>
              <span className="font-mono text-[10px] opacity-75">{items.length}</span>
            </button>
            {folders.map((folder) => {
              const count = items.filter((i) => i.folderId === folder.id).length;
              return (
                <div key={folder.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      selectedFolder === folder.id
                        ? 'bg-white text-black font-semibold'
                        : 'text-zinc-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="truncate">{folder.name}</span>
                    <span className="font-mono text-[10px] opacity-75">{count}</span>
                  </button>
                  {folder.id !== 'general' && (
                    <button
                      type="button"
                      onClick={() => setDeleteFolderId(folder.id)}
                      aria-label={`Delete folder ${folder.name}`}
                      className="p-1.5 text-zinc-500 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateFolder} className="pt-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder..."
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#050507] border border-white/15 text-xs text-white focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl border border-white/20 text-white hover:bg-white hover:text-black transition-colors"
              title="Create folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* File Grid */}
        <div className="xl:col-span-6 p-5 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search filename or usage..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#050507] border border-white/15 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(['ALL', 'image', 'video'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors ${
                    typeFilter === t
                      ? 'bg-white text-black border-white'
                      : 'border-white/15 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-500 border border-dashed border-white/15 rounded-2xl">
              No media files match this filter. Upload files above to store assets on disk.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`group text-left rounded-xl border overflow-hidden transition-all bg-[#050507] ${
                      isSelected ? 'border-white ring-1 ring-white' : 'border-white/10 hover:border-white/35'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-black relative overflow-hidden">
                      {item.mediaType === 'video' ? (
                        <video src={item.url} muted className="w-full h-full object-cover" />
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
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs font-medium text-white truncate">
                        {item.originalName}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1">
                        <span>{(item.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span className="truncate max-w-[80px]">{item.folderId}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Inspector Panel */}
        <div className="xl:col-span-3 p-5 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="text-xs font-mono tracking-[0.14em] text-zinc-500">ASSET INSPECTOR</div>
          {!selectedItem ? (
            <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-xl">
              Select a file from the grid to inspect, rename, replace, download, or delete it.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="aspect-[16/10] rounded-xl border border-white/15 bg-black overflow-hidden">
                {selectedItem.mediaType === 'video' ? (
                  <video
                    src={selectedItem.url}
                    controls
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.originalName}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="text-[11px] font-mono text-zinc-400 space-y-1 bg-[#050507] p-3 rounded-xl border border-white/10">
                <div>TYPE: {selectedItem.mimeType}</div>
                <div>SIZE: {(selectedItem.sizeBytes / 1024).toFixed(1)} KB</div>
                <div>UPLOADED: {new Date(selectedItem.createdAt).toLocaleDateString()}</div>
              </div>

              <CmsInput
                label="Display Filename"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <CmsSelect
                label="Folder"
                value={editFolder}
                onChange={(e) => setEditFolder(e.target.value)}
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </CmsSelect>

              <CmsInput
                label="Usage Location"
                value={editUsage}
                onChange={(e) => setEditUsage(e.target.value)}
              />

              <button
                type="button"
                disabled={busy}
                onClick={handleSaveMeta}
                className="w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
              >
                Save Asset Details
              </button>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => copyUrl(selectedItem)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 text-xs text-zinc-300 hover:border-white hover:text-white"
                >
                  {copiedId === selectedItem.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
                <a
                  href={selectedItem.url}
                  download={selectedItem.originalName}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 text-xs text-zinc-300 hover:border-white hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg,.gif,.mp4,.webm"
                  className="hidden"
                  onChange={(e) => handleReplaceFile(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => replaceInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 text-xs text-zinc-300 hover:border-white hover:text-white"
                >
                  <Replace className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteMediaId(selectedItem.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 text-xs text-zinc-300 hover:bg-white hover:text-black transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MessagesPanel: React.FC<{ onMessagesUpdated?: () => void }> = ({
  onMessagesUpdated,
}) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MessageStatus>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadMessages = async () => {
    try {
      const res = await adminApi.listMessages();
      setMessages(res.items);
      if (!selectedId && res.items[0]) {
        setSelectedId(res.items[0].id);
        setNotesDraft(res.items[0].notes || '');
      }
    } catch {
      // Ignore error on poll
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const selectedMessage = messages.find((m) => m.id === selectedId) || null;

  const openMessage = async (msg: ContactMessage) => {
    setSelectedId(msg.id);
    setNotesDraft(msg.notes || '');
    if (msg.status === 'NEW') {
      try {
        await adminApi.updateMessage(msg.id, { status: 'READ' });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'READ' } : m))
        );
        onMessagesUpdated?.();
      } catch {
        // Ignore
      }
    }
  };

  const handleUpdateMessage = async (status: MessageStatus) => {
    if (!selectedMessage) return;
    setSaving(true);
    try {
      const res = await adminApi.updateMessage(selectedMessage.id, {
        status,
        notes: notesDraft,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === selectedMessage.id ? res.item : m))
      );
      onMessagesUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const filtered = messages
    .filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (
        search.trim() &&
        !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.email.toLowerCase().includes(search.toLowerCase()) &&
        !m.service.toLowerCase().includes(search.toLowerCase()) &&
        !m.message.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });

  return (
    <div className="space-y-6">
      <DeleteConfirmModal
        open={deleteId !== null}
        title="Delete Contact Message"
        description="Permanently delete this message from the SQLite inbox?"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          const id = deleteId;
          setDeleteId(null);
          await adminApi.deleteMessage(id);
          setMessages((prev) => prev.filter((m) => m.id !== id));
          if (selectedId === id) setSelectedId(null);
          onMessagesUpdated?.();
        }}
      />

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-white/10 bg-[#09090C] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'NEW', 'READ', 'REPLIED', 'ARCHIVED'] as const).map((st) => {
            const count =
              st === 'ALL' ? messages.length : messages.filter((m) => m.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-black border-white font-semibold'
                    : 'border-white/15 text-zinc-400 hover:text-white'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sender, service..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#050507] border border-white/15 text-xs text-white focus:outline-none focus:border-white"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-1.5 rounded-xl bg-[#050507] border border-white/15 text-xs text-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button
            type="button"
            onClick={loadMessages}
            className="p-2 rounded-xl border border-white/15 text-zinc-300 hover:border-white hover:text-white"
            title="Refresh inbox"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inbox Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-white/15 text-center text-sm text-zinc-500">
              No messages match the current filter.
            </div>
          ) : (
            filtered.map((msg) => {
              const active = msg.id === selectedId;
              return (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => openMessage(msg)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    active
                      ? 'border-white bg-[#101014]'
                      : 'border-white/10 bg-[#09090C] hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-white truncate">
                      {msg.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono border shrink-0 ${
                        msg.status === 'NEW'
                          ? 'bg-white text-black border-white font-semibold'
                          : 'border-white/20 text-zinc-400'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 truncate">{msg.email}</div>
                  <div className="text-xs text-zinc-300 mt-2 line-clamp-2">{msg.message}</div>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>{msg.service || 'General Inquiry'}</span>
                    <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Message Detail Inspector */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
          {!selectedMessage ? (
            <div className="py-24 text-center text-sm text-zinc-500">
              Select a message from the left list to inspect details and update status.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/10">
                <div>
                  <div className="text-[11px] font-mono text-zinc-500">INQUIRY RECORD</div>
                  <h3 className="mt-1 font-display text-2xl font-bold text-white">
                    {selectedMessage.name}
                  </h3>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-sm text-zinc-300 hover:text-white underline underline-offset-4"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.service || 'Portfolio Inquiry'}`
                    )}`}
                    onClick={() => handleUpdateMessage('REPLIED')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteId(selectedMessage.id)}
                    className="p-2 rounded-full border border-white/15 text-zinc-400 hover:border-white hover:text-white"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#050507] border border-white/10">
                  <div className="text-[10px] font-mono text-zinc-500">SERVICE</div>
                  <div className="mt-1 text-white font-medium">
                    {selectedMessage.service || 'Not specified'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#050507] border border-white/10">
                  <div className="text-[10px] font-mono text-zinc-500">BUDGET</div>
                  <div className="mt-1 text-white font-medium">
                    {selectedMessage.budget || 'Not specified'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#050507] border border-white/10">
                  <div className="text-[10px] font-mono text-zinc-500">RECEIVED</div>
                  <div className="mt-1 text-white font-medium">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#050507] border border-white/10">
                <div className="text-[10px] font-mono text-zinc-500 mb-2">MESSAGE</div>
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              <CmsTextarea
                label="Internal Studio Notes"
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Private follow-up notes (only visible in Admin Portal)..."
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {(['NEW', 'READ', 'REPLIED', 'ARCHIVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={saving}
                      onClick={() => handleUpdateMessage(st)}
                      className={`px-3.5 py-2 rounded-full text-xs font-mono border transition-colors ${
                        selectedMessage.status === st
                          ? 'bg-white text-black border-white font-semibold'
                          : 'border-white/15 text-zinc-300 hover:border-white'
                      }`}
                    >
                      Mark {st}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleUpdateMessage(selectedMessage.status)}
                  className="px-4 py-2 rounded-full border border-white/25 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
