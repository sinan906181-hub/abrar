import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Palette,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  User,
  Wand2,
  X,
} from 'lucide-react';
import { BrandMark } from '../components/Icons';
import { adminApi } from '../lib/adminApi';
import type { CmsSiteState, ContactMessage, DashboardOverview } from '../types/cms';
import { AdminAuth } from './components/AdminAuth';
import { DeleteConfirmModal } from './components/AdminPrimitives';
import {
  AboutEditorPanel,
  HomeEditorPanel,
  ServicesManagerPanel,
  SkillsManagerPanel,
} from './panels/ContentPanels';
import { type AdminTabId, DashboardPanel } from './panels/DashboardPanel';
import { MediaManagerPanel, MessagesPanel } from './panels/MediaMessagesPanels';
import { DesignSeoSettingsPanel, MotionStudioPanel } from './panels/MotionDesignSeoPanels';

interface AdminAppProps {
  onExitAdmin: () => void;
}

const NAV_GROUPS: {
  title: string;
  items: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    title: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Portfolio Content',
    items: [
      { id: 'home', label: 'Home Hero', icon: Home },
      { id: 'about', label: 'About', icon: User },
      { id: 'skills', label: 'Skills', icon: Sparkles },
      { id: 'services', label: 'Services', icon: Layers },
    ],
  },
  {
    title: 'Assets & Inbox',
    items: [
      { id: 'media', label: 'Media Library', icon: ImageIcon },
      { id: 'messages', label: 'Messages Inbox', icon: Mail },
    ],
  },
  {
    title: 'Experience & System',
    items: [
      { id: 'motion', label: 'Motion & Particles', icon: Wand2 },
      { id: 'design', label: 'Design, SEO & Settings', icon: Palette },
    ],
  },
];

export const AdminApp: React.FC<AdminAppProps> = ({ onExitAdmin }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; username: string } | null>(null);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [draft, setDraft] = useState<CmsSiteState | null>(null);
  const [localDirty, setLocalDirty] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allMessages, setAllMessages] = useState<ContactMessage[]>([]);
  const [busyAction, setBusyAction] = useState<'save' | 'publish' | 'discard' | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const notify = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ text, kind });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadDashboard = useCallback(async (syncDraft = true) => {
    const data = await adminApi.getOverview();
    setOverview(data);
    if (syncDraft) {
      setDraft(data.draft);
      setLocalDirty(false);
    }
    adminApi
      .listMessages()
      .then((res) => setAllMessages(res.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    adminApi
      .getAuthStatus()
      .then(async (status) => {
        if (!mounted) return;
        if (status.authenticated && status.user) {
          setUser(status.user);
          await loadDashboard(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  const handleDraftChange = useCallback((next: CmsSiteState) => {
    setDraft(next);
    setLocalDirty(true);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!draft) return;
    setBusyAction('save');
    try {
      const res = await adminApi.saveDraft(draft, `Edited ${activeTab} draft`);
      setOverview(res.overview);
      setLocalDirty(false);
      notify('Draft saved to SQLite database.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save draft', 'err');
    } finally {
      setBusyAction(null);
    }
  }, [activeTab, draft, notify]);

  const handlePublish = useCallback(async () => {
    if (!draft) return;
    setBusyAction('publish');
    try {
      const res = await adminApi.publish(draft);
      setOverview(res.overview);
      setDraft(res.overview.draft);
      setLocalDirty(false);
      notify('Changes published to live portfolio.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Publish failed', 'err');
    } finally {
      setBusyAction(null);
    }
  }, [draft, notify]);

  const handleDiscardDraft = useCallback(async () => {
    setConfirmDiscardOpen(false);
    setBusyAction('discard');
    try {
      const res = await adminApi.discardDraft();
      setOverview(res.overview);
      setDraft(res.overview.draft);
      setLocalDirty(false);
      notify('Draft reverted to currently published state.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Discard failed', 'err');
    } finally {
      setBusyAction(null);
    }
  }, [notify]);

  useEffect(() => {
    if (!user) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSaveDraft, user]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !draft) return [];
    const results: { label: string; kind: string; tab: AdminTabId }[] = [];

    draft.skills.items.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) {
        results.push({ label: s.name, kind: `Skill · ${s.percentage}%`, tab: 'skills' });
      }
    });
    draft.services.items.forEach((s) => {
      if (s.title.toLowerCase().includes(q)) {
        results.push({ label: s.title, kind: 'Service', tab: 'services' });
      }
    });
    allMessages.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) {
        results.push({ label: `${m.name} (${m.email})`, kind: `Message · ${m.status}`, tab: 'messages' });
      }
    });

    return results.slice(0, 8);
  }, [allMessages, draft, searchQuery]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-xs font-mono tracking-[0.2em] text-zinc-400">
          VERIFYING ADMIN SESSION...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminAuth
        onSuccess={async (authenticatedUser) => {
          setUser(authenticatedUser);
          await loadDashboard(true);
        }}
      />
    );
  }

  if (!overview || !draft) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-xs font-mono tracking-[0.2em] text-zinc-400">
          LOADING STUDIO CMS...
        </div>
      </div>
    );
  }

  const activeNavMeta = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex">
      <DeleteConfirmModal
        open={confirmDiscardOpen}
        title="Discard Unpublished Draft"
        description="Discard all unpublished changes in the draft and restore the exact currently published website state?"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={handleDiscardDraft}
      />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 lg:hidden"
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-[#070709] border-r border-white/10 flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          <div className="px-5 h-16 border-b border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-white"
            >
              <BrandMark logoUrl={draft.settings.logoUrl} className="w-6 h-6 text-white" />
              <div className="text-left">
                <div className="font-display text-sm font-semibold tracking-tight leading-none">
                  Studio CMS
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">ADMIN PORTAL</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-mono tracking-[0.16em] text-zinc-600 uppercase">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  const unreadCount =
                    item.id === 'messages' ? overview.counts.unreadMessages : 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        active
                          ? 'bg-white text-black font-semibold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {unreadCount > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            active ? 'bg-black text-white' : 'bg-white text-black font-semibold'
                          }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="px-2 py-1 text-[11px] font-mono text-zinc-500 truncate">
            Signed in as {user.username}
          </div>
          <button
            type="button"
            onClick={async () => {
              await adminApi.logout();
              setUser(null);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-xs text-zinc-300 hover:bg-white hover:text-black transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Bar */}
        <header className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-white/15 text-zinc-300 hover:text-white"
              aria-label="Open admin menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                  {activeNavMeta?.label || 'Dashboard'}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                    localDirty
                      ? 'border-white text-white bg-white/10'
                      : overview.hasUnpublishedChanges
                        ? 'border-zinc-400 text-zinc-200'
                        : 'border-white/15 text-zinc-400'
                  }`}
                >
                  {localDirty
                    ? 'Unsaved Edits'
                    : overview.hasUnpublishedChanges
                      ? 'Draft Pending Publish'
                      : 'Synced Live'}
                </span>
              </div>
            </div>
          </div>

          {/* Global Admin Search + Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick search CMS..."
                className="w-52 pl-8 pr-3 py-1.5 rounded-full bg-[#09090C] border border-white/15 text-xs text-white focus:outline-none focus:border-white"
              />
              {searchResults.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/20 bg-[#09090C] p-2 shadow-2xl z-50 space-y-1">
                  {searchResults.map((res, i) => (
                    <button
                      key={`${res.tab}-${i}`}
                      type="button"
                      onClick={() => {
                        setActiveTab(res.tab);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.08] transition-colors"
                    >
                      <div className="text-xs font-medium text-white truncate">{res.label}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{res.kind}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/20 text-xs font-medium text-white hover:border-white transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{busyAction === 'save' ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <a
              href="/?preview=1"
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                if (localDirty) {
                  adminApi.saveDraft(draft).catch(() => {});
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/20 text-xs font-medium text-zinc-200 hover:border-white hover:text-white transition-colors"
            >
              <span>Preview</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onExitAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/15 text-xs text-zinc-300 hover:border-white hover:text-white transition-colors"
            >
              <span>Live Site</span>
            </button>

            {(overview.hasUnpublishedChanges || localDirty) && (
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => setConfirmDiscardOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/15 text-xs text-zinc-400 hover:text-white hover:border-white transition-colors"
                title="Discard Draft"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discard</span>
              </button>
            )}

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{busyAction === 'publish' ? 'Publishing...' : 'Publish Live'}</span>
            </button>
          </div>
        </header>

        {/* Status Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-2xl border border-white/25 bg-[#09090C]/95 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs text-white">
            <Check className="w-4 h-4 shrink-0" />
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Panel Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPanel
              overview={overview}
              onNavigateTab={setActiveTab}
              onOpenPreview={() => {
                if (localDirty) {
                  adminApi.saveDraft(draft).catch(() => {});
                }
                const a = document.createElement('a');
                a.href = '/?preview=1';
                a.target = '_blank';
                a.rel = 'noreferrer';
                a.click();
              }}
            />
          )}
          {activeTab === 'home' && (
            <HomeEditorPanel draft={draft} onChange={handleDraftChange} />
          )}
          {activeTab === 'about' && (
            <AboutEditorPanel draft={draft} onChange={handleDraftChange} />
          )}
          {activeTab === 'skills' && (
            <SkillsManagerPanel draft={draft} onChange={handleDraftChange} />
          )}
          {activeTab === 'services' && (
            <ServicesManagerPanel draft={draft} onChange={handleDraftChange} />
          )}
          {activeTab === 'media' && (
            <MediaManagerPanel onLibraryUpdated={() => loadDashboard(false)} />
          )}
          {activeTab === 'messages' && (
            <MessagesPanel onMessagesUpdated={() => loadDashboard(false)} />
          )}
          {activeTab === 'motion' && (
            <MotionStudioPanel draft={draft} onChange={handleDraftChange} />
          )}
          {activeTab === 'design' && (
            <DesignSeoSettingsPanel draft={draft} onChange={handleDraftChange} />
          )}
        </main>
      </div>
    </div>
  );
};
