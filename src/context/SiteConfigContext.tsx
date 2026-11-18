import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_CMS_STATE } from '../data/defaultCmsState';
import { getStoredAdminToken } from '../lib/adminApi';
import type { CmsSiteState } from '../types/cms';

interface SiteConfigContextValue {
  cms: CmsSiteState;
  mode: 'published' | 'preview';
  loading: boolean;
  reloadSite: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  cms: DEFAULT_CMS_STATE,
  mode: 'published',
  loading: true,
  reloadSite: async () => {},
});

function setMetaTag(attrName: 'name' | 'property', attrVal: string, content: string): void {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cms, setCms] = useState<CmsSiteState>(DEFAULT_CMS_STATE);
  const [mode, setMode] = useState<'published' | 'preview'>('published');
  const [loading, setLoading] = useState(true);

  const reloadSite = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const wantsPreview = params.get('preview') === '1';
    const url = wantsPreview ? '/api/public/site?preview=1' : '/api/public/site';
    const headers: Record<string, string> = {};
    const token = getStoredAdminToken();
    if (wantsPreview && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { headers, credentials: 'same-origin' });
      if (!res.ok) return;
      const json = (await res.json()) as {
        mode: 'published' | 'preview';
        data: CmsSiteState;
      };
      if (json?.data) {
        setCms(json.data);
        setMode(json.mode || 'published');
      }
    } catch {
      // Keep default/cached state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadSite();
  }, [reloadSite]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('ms_cms_sync');
      channel.onmessage = () => {
        reloadSite();
      };
    } catch {
      // Ignore unsupported
    }
    const onFocus = () => reloadSite();
    window.addEventListener('focus', onFocus);
    return () => {
      channel?.close();
      window.removeEventListener('focus', onFocus);
    };
  }, [reloadSite]);

  // Apply dynamic Theme, Typography & SEO tags to DOM
  useEffect(() => {
    const root = document.documentElement;
    const { theme, typography, seo, settings } = cms;

    root.style.setProperty('--cms-bg', theme.backgroundColor);
    root.style.setProperty('--cms-bg-alt', theme.secondaryBackgroundColor);
    root.style.setProperty('--cms-card-bg', theme.cardBackgroundColor);
    root.style.setProperty('--cms-text', theme.primaryTextColor);
    root.style.setProperty('--cms-text-muted', theme.secondaryTextColor);
    root.style.setProperty('--cms-border', theme.borderColor);
    root.style.setProperty('--cms-accent', theme.accentColor);
    root.style.setProperty('--cms-glow', theme.glowColor);

    root.style.setProperty('--font-display', typography.displayFont);
    root.style.setProperty('--font-sans', typography.bodyFont);
    root.style.setProperty('--cms-heading-scale', String(typography.headingSizeScale));
    root.style.setProperty('--cms-body-scale', String(typography.bodySizeScale));
    root.style.setProperty('--cms-font-weight', String(typography.fontWeight));
    root.style.setProperty('--cms-letter-spacing', `${typography.letterSpacingEm}em`);
    root.style.setProperty('--cms-line-height', String(typography.lineHeight));
    root.style.setProperty('--cms-text-align', typography.textAlign);

    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.color = theme.primaryTextColor;
    document.body.style.fontFamily = typography.bodyFont;
    document.body.style.letterSpacing = `${typography.letterSpacingEm}em`;
    document.body.style.lineHeight = String(typography.lineHeight);

    if (seo.title) document.title = seo.title;
    setMetaTag('name', 'description', seo.metaDescription);
    setMetaTag('name', 'keywords', seo.keywords);
    setMetaTag('property', 'og:title', seo.ogTitle || seo.title);
    setMetaTag('property', 'og:description', seo.ogDescription || seo.metaDescription);
    if (seo.ogImageUrl) setMetaTag('property', 'og:image', seo.ogImageUrl);

    if (seo.canonicalUrl) {
      let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canon) {
        canon = document.createElement('link');
        canon.rel = 'canonical';
        document.head.appendChild(canon);
      }
      canon.href = seo.canonicalUrl;
    }

    if (settings.faviconUrl) {
      let icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = settings.faviconUrl;
    }
  }, [cms]);

  return (
    <SiteConfigContext.Provider value={{ cms, mode, loading, reloadSite }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export function useSiteConfig(): SiteConfigContextValue {
  return useContext(SiteConfigContext);
}
