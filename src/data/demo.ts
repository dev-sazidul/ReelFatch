export const illustrativeReel = {
  title: 'Sample Reel preview',
  duration: '0:18',
  source: 'Illustrative source · not fetched',
  thumbnailLabel: 'Abstract sample artwork, not a real video',
  note: 'This card shows how a result could look. It is sample data, not a video that was found from your link.',
  qualities: [
    { id: '144', label: '144p', detail: 'Sample', available: true },
    { id: '360', label: '360p', detail: 'Sample · 2.1 MB', available: true },
    { id: '480', label: '480p', detail: 'Sample · 3.4 MB', available: true },
    { id: '720', label: '720p HD', detail: 'Sample · 5.8 MB', available: true },
    { id: '1080', label: '1080p', detail: 'Not in this sample', available: false },
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
