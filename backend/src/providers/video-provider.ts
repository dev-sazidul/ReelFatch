export type VideoQuality = {
  id: string;
  label: string;
  available: boolean;
  fileSizeBytes?: number;
  format?: string;
};

export type ProviderLookup = {
  platform: string;
  videoId: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  sourceLabel: string;
  qualities: VideoQuality[];
  reportedFormats: Array<{ width?: number; height?: number }>;
};

export interface VideoProvider {
  readonly platform: string;
  readonly hosts: string[];
  readonly unavailableMessage: string;
  isConfigured(): boolean;
  lookup(pageUrl: URL): Promise<ProviderLookup>;
}

export function hostMatches(hostname: string, domain: string) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === domain || host.endsWith(`.${domain}`);
}
