import type { PlatformId } from '@/data/platforms';
import { createBackendVideoProvider } from '@/services/backend-api';

export type VideoQualityOption = {
  id: string;
  label: string;
  available: boolean;
  fileSizeBytes?: number;
  format?: string;
};

export type DownloadProgress = {
  loaded: number;
  total?: number;
};

export type AuthorizedVideoResult = {
  title?: string;
  description?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  sourceLabel: string;
  qualities: VideoQualityOption[];
  reportedFormats?: Array<{ width?: number; height?: number }>;
  sourceReference: string;
};

/**
 * A platform provider must be connected to a real, authorized service before
 * the UI can treat that platform as available. Do not implement extraction or
 * scraping in this registry.
 */
export interface AuthorizedVideoProvider {
  lookup(url: string, signal?: AbortSignal): Promise<AuthorizedVideoResult>;
  download?(sourceReference: string, qualityId: string, onProgress?: (progress: DownloadProgress) => void): Promise<void>;
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/**
 * Facebook lookup goes through the local API. The API calls Graph API only when a token is configured.
 */
export const authorizedVideoProviders: Partial<
  Record<PlatformId, AuthorizedVideoProvider>
> = {
  facebook: createBackendVideoProvider(apiBase),
};

export function getAuthorizedVideoProvider(platformId: PlatformId) {
  return authorizedVideoProviders[platformId] ?? null;
}

export class VideoLookupError extends Error {
  status?: number;
  code?: string;
  responseSummary?: string;

  constructor(message: string, options?: { status?: number; code?: string; responseSummary?: string }) {
    super(message);
    this.name = 'VideoLookupError';
    this.status = options?.status;
    this.code = options?.code;
    this.responseSummary = options?.responseSummary?.slice(0, 500);
  }
}
