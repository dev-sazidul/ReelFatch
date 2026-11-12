import {
  SiFacebook,
  SiInstagram,
  SiPinterest,
  SiReddit,
  SiTiktok,
  SiX,
  SiYoutube,
} from 'react-icons/si';
import type { IconType } from 'react-icons';
import platformData from './platforms.json';
import { getAuthorizedVideoProvider } from '@/services/platform-integrations';

export type PlatformId =
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'x'
  | 'pinterest'
  | 'reddit';

export type PlatformStatus = 'Available' | 'Coming Soon' | 'Unavailable';

type IconName = PlatformId;

type PlatformConfig = {
  id: PlatformId;
  name: string;
  icon: IconName;
  domains: string[];
  status: PlatformStatus;
  seoTitle: string;
  seoDescription: string;
  faqs: { question: string; answer: string }[];
};

const icons: Record<IconName, IconType> = {
  facebook: SiFacebook,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  instagram: SiInstagram,
  x: SiX,
  pinterest: SiPinterest,
  reddit: SiReddit,
};

const config = platformData as { platforms: PlatformConfig[] };

export const platformRegistry = config.platforms.map((platform) => ({
  ...platform,
  Icon: icons[platform.icon],
}));

export type Platform = (typeof platformRegistry)[number];

export function getPlatformById(id: string | undefined) {
  return platformRegistry.find((platform) => platform.id === id);
}

export function getPlatformStatus(id: PlatformId): PlatformStatus {
  const platform = getPlatformById(id);
  if (!platform) return 'Unavailable';
  if (platform.status !== 'Available') return platform.status;
  return getAuthorizedVideoProvider(id) ? 'Available' : 'Unavailable';
}

export function detectPlatformUrl(rawUrl: string):
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'unsupported' }
  | { kind: 'recognized'; platform: Platform } {
  if (!rawUrl.trim()) return { kind: 'empty' };

  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { kind: 'invalid' };
    }

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    const matched = platformRegistry.find(({ domains }) =>
      domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
    );

    if (matched) {
      return { kind: 'recognized', platform: matched };
    }

    const hostParts = hostname.split('.');
    const baseName = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : 'video';
    const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    const genericPlatform: Platform = {
      id: baseName as any,
      name: capitalized,
      icon: 'facebook',
      domains: [hostname],
      status: 'Available',
      seoTitle: `${capitalized} Video Downloader — ReelFetch`,
      seoDescription: `Download ${capitalized} videos in high quality with ReelFetch.`,
      faqs: [],
      Icon: SiYoutube,
    };

    return { kind: 'recognized', platform: genericPlatform };
  } catch {
    return { kind: 'invalid' };
  }
}
