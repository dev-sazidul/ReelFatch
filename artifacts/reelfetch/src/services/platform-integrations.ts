import type { PlatformId } from '@/data/platforms';

export type VideoQualityOption = {
  id: string;
  label: string;
  available: boolean;
  fileSizeBytes?: number;
  format?: string;
};

export type AuthorizedVideoResult = {
  title?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  sourceLabel: string;
  qualities: VideoQualityOption[];
  sourceReference: string;
};

/**
 * A platform provider must be connected to a real, authorized service before
 * the UI can treat that platform as available. Do not implement extraction or
 * scraping in this registry.
 */
export interface AuthorizedVideoProvider {
  lookup(url: string, signal?: AbortSignal): Promise<AuthorizedVideoResult>;
  download?(sourceReference: string, qualityId: string): Promise<void>;
}

/**
 * Intentionally empty in this frontend-only build. Register an adapter here
 * only when a real authorized backend is available for that platform.
 */
export const authorizedVideoProviders: Partial<
  Record<PlatformId, AuthorizedVideoProvider>
> = {};

export function getAuthorizedVideoProvider(platformId: PlatformId) {
  return authorizedVideoProviders[platformId] ?? null;
}
