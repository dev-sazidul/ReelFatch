import { DEMO_ADS_CONFIG, type AdPlacement } from '@/config/ads';

const placementLabels: Record<AdPlacement, string> = {
  belowHeader: 'Below header',
  betweenSections: 'Between homepage sections',
  belowVideoResults: 'Below video results',
  desktopSidebar: 'Desktop sidebar',
};

export function AdPlaceholder({ placement }: { placement: AdPlacement }) {
  if (!DEMO_ADS_CONFIG.enabled || !DEMO_ADS_CONFIG.placements[placement]) {
    return null;
  }

  return (
    <aside
      className={`rf-ad-placeholder rf-ad-${placement}`}
      aria-label={`Advertisement demo placeholder: ${placementLabels[placement]}`}
      role="note"
    >
      <span>Advertisement — Demo Placeholder</span>
    </aside>
  );
}
