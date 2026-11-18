export type SkillCategory = 'Development' | 'Design' | 'Motion' | 'AI' | 'Other';
export type ProjectCategory = 'CODE' | 'DESIGN' | 'MOTION' | 'AI' | 'WEB' | 'VIDEO' | 'OTHER';
export type SectionId =
  | 'home'
  | 'about'
  | 'skills'
  | 'projects'
  | 'services'
  | 'gallery'
  | 'contact'
  | 'footer';

export interface CtaButton {
  id: string;
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  visible: boolean;
}

export interface StatCardItem {
  id: string;
  value: string;
  label: string;
  detail: string;
  visible: boolean;
}

export type SkillIconKey =
  | 'react'
  | 'nextjs'
  | 'typescript'
  | 'javascript'
  | 'html'
  | 'css'
  | 'tailwind'
  | 'figma'
  | 'uiux'
  | 'motion'
  | 'video'
  | 'ai';

export interface SkillCmsItem {
  id: string;
  name: string;
  category: SkillCategory;
  percentage: number;
  description: string;
  iconKey: SkillIconKey;
  customIconUrl?: string;
  visible: boolean;
}

export type ServiceIconKey = 'web' | 'uiux' | 'creative' | 'video' | 'motion' | 'ai';

export interface ServiceCmsItem {
  id: string;
  index: string;
  title: string;
  description: string;
  category: string;
  iconKey: ServiceIconKey;
  customIconUrl?: string;
  imageUrl?: string;
  buttonLabel: string;
  buttonHref: string;
  visible: boolean;
}

export type ProjectVisualVariant =
  | 'monolith'
  | 'vespera'
  | 'kinetix'
  | 'aether'
  | 'nocturne'
  | 'forma';

export interface ProjectCmsItem {
  id: string;
  title: string;
  category: ProjectCategory;
  year: string;
  client: string;
  role: string;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
  featured: boolean;
  visible: boolean;
  visualVariant: ProjectVisualVariant;
  thumbnailUrl?: string;
  galleryUrls: string[];
  videoUrl?: string;
  liveUrl: string;
  githubUrl: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  metrics: { label: string; value: string }[];
}

export interface GalleryAlbum {
  id: string;
  name: string;
  description: string;
  visible: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  albumId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  aspectRatio: 'landscape' | 'portrait' | 'square';
  visualVariant?: ProjectVisualVariant;
  visible: boolean;
}

export type SocialPlatform =
  | 'github'
  | 'instagram'
  | 'pinterest'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'dribbble'
  | 'behance'
  | 'website';

export interface SocialCmsItem {
  id: string;
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  customIconUrl?: string;
  showInDock: boolean;
  visible: boolean;
}

export interface NavCmsItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  isExternal?: boolean;
}

export interface SectionCmsItem {
  id: SectionId;
  label: string;
  visible: boolean;
}

export interface AnimationSettings {
  masterEnabled: boolean;
  introEnabled: boolean;
  particleBackground: boolean;
  mouseParticles: boolean;
  particleConnections: boolean;
  particleTrails: boolean;
  particleWaves: boolean;
  scrollDistortion: boolean;
  magneticCursor: boolean;
  liquidHover: boolean;
  textAnimations: boolean;
  pageTransitions: boolean;
  sectionReveal: boolean;
  sectionTransitions: boolean;
  parallaxMotion: boolean;
  touchInteraction: boolean;
  animationSpeed: number;
  parallaxIntensity: number;
  scrollStrength: number;
  transitionSpeed: number;
  hoverIntensity: number;
  glowStrength: number;
  cursorStrength: number;
}

export interface AboutTimelineItem {
  id: string;
  year: string;
  title: string;
  organization: string;
  summary: string;
}

export interface IntroSettings {
  enabled: boolean;
  text: string;
  durationSec: number;
  particleDensity: number;
  particleSpeed: number;
  textSize: number;
  glowIntensity: number;
  backgroundColor: string;
  replayBehavior: 'always' | 'once' | 'disabled';
}

export interface ParticleSettings {
  count: number;
  size: number;
  speed: number;
  opacity: number;
  connectionDistance: number;
  connectionOpacity: number;
  mouseAttraction: number;
  mouseRepulsion: number;
  gravity: number;
  waveStrength: number;
  trail: number;
  glow: number;
  depth: number;
}

export interface ThemeSettings {
  backgroundColor: string;
  secondaryBackgroundColor: string;
  cardBackgroundColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  borderColor: string;
  accentColor: string;
  glowColor: string;
}

export interface TypographySettings {
  displayFont: string;
  bodyFont: string;
  headingSizeScale: number;
  bodySizeScale: number;
  fontWeight: number;
  letterSpacingEm: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface SeoSettings {
  title: string;
  metaDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  canonicalUrl: string;
}

export interface WebsiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  analyticsId: string;
}

export interface CmsSiteState {
  home: {
    name: string;
    initials: string;
    kicker: string;
    roles: string[];
    heroSubtitle: string;
    heroDescription: string;
    profilePhotoUrl: string;
    heroBackgroundUrl: string;
    availability: string;
    ctas: CtaButton[];
  };
  about: {
    sectionLabel: string;
    heading: string;
    lead: string;
    philosophyQuote: string;
    paragraphs: string[];
    photoUrl: string;
    location: string;
    availability: string;
    tools: string[];
    achievements: string[];
    timeline: AboutTimelineItem[];
    stats: StatCardItem[];
  };
  skills: {
    sectionLabel: string;
    heading: string;
    description: string;
    items: SkillCmsItem[];
  };
  services: {
    sectionLabel: string;
    heading: string;
    description: string;
    items: ServiceCmsItem[];
  };
  projects: {
    sectionLabel: string;
    heading: string;
    description: string;
    items: ProjectCmsItem[];
  };
  gallery: {
    sectionLabel: string;
    heading: string;
    description: string;
    albums: GalleryAlbum[];
    items: GalleryItem[];
  };
  contactInfo: {
    sectionLabel: string;
    heading: string;
    subheading: string;
    email: string;
    phone: string;
    location: string;
    responseNote: string;
    budgetOptions: string[];
    socials: SocialCmsItem[];
  };
  navigation: {
    items: NavCmsItem[];
    ctaLabel: string;
    ctaHref: string;
    ctaVisible: boolean;
  };
  sections: SectionCmsItem[];
  footer: {
    tagline: string;
    copyright: string;
    craftNote: string;
    showReplayIntro: boolean;
  };
  animations: AnimationSettings;
  intro: IntroSettings;
  particles: ParticleSettings;
  theme: ThemeSettings;
  typography: TypographySettings;
  seo: SeoSettings;
  settings: WebsiteSettings;
}

export interface MediaFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  mediaType: 'image' | 'video';
  sizeBytes: number;
  url: string;
  folderId: string;
  usageLocation: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  service: string;
  budget: string;
  message: string;
  status: MessageStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
}

export interface DashboardOverview {
  counts: {
    projects: number;
    skills: number;
    services: number;
    media: number;
    messages: number;
    unreadMessages: number;
    galleryItems: number;
  };
  websiteStatus: 'LIVE' | 'MAINTENANCE';
  hasUnpublishedChanges: boolean;
  lastPublishedAt: string | null;
  lastDraftUpdatedAt: string | null;
  recentMedia: MediaItem[];
  recentMessages: ContactMessage[];
  recentActivity: ActivityLogItem[];
  draft: CmsSiteState;
  published: CmsSiteState;
}
