import React from 'react';
import {
  Activity,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Mail,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { DashboardOverview } from '../../types/cms';

export type AdminTabId =
  | 'dashboard'
  | 'home'
  | 'about'
  | 'skills'
  | 'services'
  | 'media'
  | 'messages'
  | 'motion'
  | 'design';

interface DashboardPanelProps {
  overview: DashboardOverview;
  onNavigateTab: (tab: AdminTabId) => void;
  onOpenPreview: () => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  overview,
  onNavigateTab,
  onOpenPreview,
}) => {
  const { counts, websiteStatus, recentMedia, recentMessages, recentActivity } = overview;

  const statCards = [
    { label: 'TOTAL SKILLS', value: counts.skills, tab: 'skills' as AdminTabId, icon: Sparkles },
    { label: 'TOTAL SERVICES', value: counts.services, tab: 'services' as AdminTabId, icon: Layers },
    { label: 'TOTAL IMAGES', value: counts.media, tab: 'media' as AdminTabId, icon: ImageIcon },
    {
      label: 'TOTAL MESSAGES',
      value: counts.messages,
      sub: counts.unreadMessages > 0 ? `${counts.unreadMessages} Unread` : 'All read',
      tab: 'messages' as AdminTabId,
      icon: Mail,
    },
    {
      label: 'WEBSITE STATUS',
      value: websiteStatus,
      sub: overview.hasUnpublishedChanges ? 'Draft pending publish' : 'Synced with live',
      tab: 'design' as AdminTabId,
      icon: Activity,
    },
  ];

  const quickActions = [
    { label: '+ UPLOAD PHOTO', tab: 'media' as AdminTabId, icon: Upload },
    { label: '+ ADD SERVICE', tab: 'services' as AdminTabId, icon: Plus },
    { label: '+ ADD SKILL', tab: 'skills' as AdminTabId, icon: Plus },
    { label: 'EDIT HOME', tab: 'home' as AdminTabId, icon: Sparkles },
    { label: 'EDIT ABOUT', tab: 'about' as AdminTabId, icon: Layers },
    { label: 'VIEW MESSAGES', tab: 'messages' as AdminTabId, icon: Mail },
  ];

  return (
    <div className="space-y-8">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigateTab(card.tab)}
              className="group text-left p-5 rounded-2xl border border-white/10 bg-[#09090C] hover:border-white/35 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
                {card.value}
              </div>
              {card.sub && <div className="mt-1 text-xs font-mono text-zinc-400">{card.sub}</div>}
            </button>
          );
        })}
      </div>

      {/* Quick Actions + Website Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-white">Quick Actions</h3>
            <span className="text-[11px] font-mono text-zinc-500">INSTANT SHORTCUTS</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => onNavigateTab(qa.tab)}
                  className="flex items-center gap-2.5 p-3.5 rounded-xl border border-white/10 bg-[#050507] hover:bg-white hover:text-black text-xs font-mono tracking-[0.08em] text-zinc-200 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Website Preview Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-[#09090C] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-[0.16em] text-zinc-500">
                WEBSITE PREVIEW CARD
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                  websiteStatus === 'LIVE'
                    ? 'border-white/40 text-white'
                    : 'border-zinc-600 text-zinc-400'
                }`}
              >
                {websiteStatus}
              </span>
            </div>
            <h4 className="mt-3 font-display text-xl font-bold text-white">
              {overview.draft.home.name}
            </h4>
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
              {overview.draft.home.heroDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
            >
              <span>Preview Draft</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-xs font-medium text-zinc-200 hover:border-white transition-colors"
            >
              <span>View Live Site</span>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Uploads, Messages & Edited Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Uploads */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">Recent Uploads</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('media')}
              className="text-xs font-mono text-zinc-400 hover:text-white"
            >
              Open Library →
            </button>
          </div>
          {recentMedia.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center border border-dashed border-white/10 rounded-xl">
              No uploaded media yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {recentMedia.map((m) => (
                <div
                  key={m.id}
                  className="aspect-square rounded-lg border border-white/10 bg-black overflow-hidden"
                  title={m.originalName}
                >
                  {m.mediaType === 'video' ? (
                    <video src={m.url} muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} alt={m.originalName} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">Recent Messages</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('messages')}
              className="text-xs font-mono text-zinc-400 hover:text-white"
            >
              Inbox →
            </button>
          </div>
          <div className="space-y-3">
            {recentMessages.slice(0, 4).map((msg) => (
              <div
                key={msg.id}
                onClick={() => onNavigateTab('messages')}
                className="p-3 rounded-xl border border-white/[0.08] bg-[#050507] hover:border-white/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">{msg.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/15 text-zinc-300">
                    {msg.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 truncate">{msg.message}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Edited Content / Activity */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#09090C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">Activity Log</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('design')}
              className="text-xs font-mono text-zinc-400 hover:text-white"
            >
              Full Log →
            </button>
          </div>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {recentActivity.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="p-2.5 rounded-xl border border-white/[0.06] bg-[#050507] text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-zinc-300">{act.action}</span>
                  <span className="font-mono text-[10px] text-zinc-600">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-zinc-400 mt-1 truncate">{act.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
