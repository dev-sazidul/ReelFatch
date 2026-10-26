/**
 * Global demo ad control. No AdSense script or real advertising network is
 * loaded by this project. Toggle `enabled` to hide/show every placeholder.
 */
export const DEMO_ADS_CONFIG = {
  enabled: true,
  placements: {
    belowHeader: true,
    betweenSections: true,
    belowVideoResults: true,
    desktopSidebar: false,
  },
} as const;

export type AdPlacement = keyof typeof DEMO_ADS_CONFIG.placements;
