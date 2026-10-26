export const illustrativeReel = {
  title: 'A quiet morning by the water',
  duration: '0:18',
  source: 'Illustrative source · not fetched',
  fileSize: '5.8 MB · sample only',
  thumbnailLabel: 'Illustrative preview artwork',
  qualities: [
    { id: '720', label: '720p', detail: 'HD · sample option', available: true },
    { id: '480', label: '480p', detail: 'SD · sample option', available: true },
    { id: '1080', label: '1080p', detail: 'Sample option', available: false },
  ],
};

export const demoStatusChoices = [
  { id: 'loading', label: 'Loading' },
  { id: 'invalid', label: 'Invalid URL' },
  { id: 'unsupported', label: 'Unsupported URL' },
  { id: 'empty-source', label: 'No downloadable source' },
  { id: 'quality-unavailable', label: 'Selected quality unavailable' },
  { id: 'network-error', label: 'Network error' },
  { id: 'starting', label: 'Download starting' },
  { id: 'failed', label: 'Download failed' },
] as const;

export type DemoStatusId = (typeof demoStatusChoices)[number]['id'];
