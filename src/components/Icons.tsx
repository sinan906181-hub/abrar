import React from 'react';
import {
  Atom,
  BrainCircuit,
  Code2,
  Compass,
  Cpu,
  Dribbble,
  Figma,
  Film,
  FileCode2,
  Github,
  Globe,
  Instagram,
  Layers,
  Linkedin,
  Monitor,
  Palette,
  Play,
  Sparkles,
  Terminal,
  Wand2,
  Wind,
  Youtube,
} from 'lucide-react';
import type { ServiceIconKey, SkillIconKey, SocialPlatform } from '../types/cms';

export const BrandMark: React.FC<{ className?: string; logoUrl?: string }> = ({
  className = 'w-7 h-7',
  logoUrl,
}) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Brand Logo"
        className={`${className} object-contain grayscale contrast-125`}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 28V8L17.5 22.5L29 8V28"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M7 28H13.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
      <path d="M22.5 28H29" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
    </svg>
  );
};

export const XBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const PinterestBrandIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.017 2C6.486 2 2 6.486 2 12.017c0 4.242 2.636 7.868 6.357 9.317-.087-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.531 0 10.017-4.486 10.017-10.017C22.034 6.486 17.548 2 12.017 2z" />
  </svg>
);

export const SocialIcon: React.FC<{
  platform: SocialPlatform;
  customIconUrl?: string;
  className?: string;
}> = ({ platform, customIconUrl, className = 'w-4 h-4' }) => {
  if (customIconUrl) {
    return (
      <img
        src={customIconUrl}
        alt=""
        className={`${className} object-contain rounded-sm grayscale contrast-125`}
      />
    );
  }
  switch (platform) {
    case 'github':
      return <Github className={className} strokeWidth={1.75} />;
    case 'instagram':
      return <Instagram className={className} strokeWidth={1.75} />;
    case 'pinterest':
      return <PinterestBrandIcon className={className} />;
    case 'youtube':
      return <Youtube className={className} strokeWidth={1.75} />;
    case 'x':
      return <XBrandIcon className={className} />;
    case 'linkedin':
      return <Linkedin className={className} strokeWidth={1.75} />;
    case 'dribbble':
      return <Dribbble className={className} strokeWidth={1.75} />;
    case 'behance':
      return <Sparkles className={className} strokeWidth={1.75} />;
    case 'website':
    default:
      return <Globe className={className} strokeWidth={1.75} />;
  }
};

export const SkillIcon: React.FC<{
  iconKey: SkillIconKey;
  customIconUrl?: string;
  className?: string;
}> = ({ iconKey, customIconUrl, className = 'w-5 h-5' }) => {
  if (customIconUrl) {
    return (
      <img
        src={customIconUrl}
        alt=""
        className={`${className} object-contain rounded-sm grayscale contrast-125`}
      />
    );
  }
  switch (iconKey) {
    case 'react':
      return <Atom className={className} strokeWidth={1.6} />;
    case 'nextjs':
      return <Layers className={className} strokeWidth={1.6} />;
    case 'typescript':
      return <Code2 className={className} strokeWidth={1.6} />;
    case 'javascript':
      return <Terminal className={className} strokeWidth={1.6} />;
    case 'html':
      return <FileCode2 className={className} strokeWidth={1.6} />;
    case 'css':
      return <Palette className={className} strokeWidth={1.6} />;
    case 'tailwind':
      return <Wind className={className} strokeWidth={1.6} />;
    case 'figma':
      return <Figma className={className} strokeWidth={1.6} />;
    case 'uiux':
      return <Compass className={className} strokeWidth={1.6} />;
    case 'motion':
      return <Wand2 className={className} strokeWidth={1.6} />;
    case 'video':
      return <Film className={className} strokeWidth={1.6} />;
    case 'ai':
    default:
      return <BrainCircuit className={className} strokeWidth={1.6} />;
  }
};

export const ServiceIcon: React.FC<{
  iconKey: ServiceIconKey;
  customIconUrl?: string;
  className?: string;
}> = ({ iconKey, customIconUrl, className = 'w-5 h-5' }) => {
  if (customIconUrl) {
    return (
      <img
        src={customIconUrl}
        alt=""
        className={`${className} object-contain rounded-sm grayscale contrast-125`}
      />
    );
  }
  switch (iconKey) {
    case 'web':
      return <Monitor className={className} strokeWidth={1.6} />;
    case 'uiux':
      return <Compass className={className} strokeWidth={1.6} />;
    case 'creative':
      return <Sparkles className={className} strokeWidth={1.6} />;
    case 'video':
      return <Play className={className} strokeWidth={1.6} />;
    case 'motion':
      return <Wand2 className={className} strokeWidth={1.6} />;
    case 'ai':
    default:
      return <Cpu className={className} strokeWidth={1.6} />;
  }
};
