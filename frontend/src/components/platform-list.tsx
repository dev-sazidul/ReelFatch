import Link from 'next/link';
import { getPlatformStatus, platformRegistry, type PlatformStatus } from '@/data/platforms';

export function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  return <span className={`rf-platform-status rf-status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

export function PlatformGrid() {
  return (
    <section className="rf-section rf-section-tint" id="platforms" aria-labelledby="platforms-heading">
      <div className="rf-container">
        <div className="rf-section-heading">
          <span className="rf-eyebrow">Supported Platforms</span>
          <h2 id="platforms-heading">Guides for the platforms ReelFetch can check.</h2>
          <p>Open a platform page for public videos, Reels, or Shorts. A download appears only when that source returns a file.</p>
        </div>
        <div className="rf-platform-grid">
          {platformRegistry.map(({ id, name, Icon }) => (
            <Link className="rf-platform-card" href={`/platform/${id}`} key={id} data-testid={`link-platform-${id}`}>
              <span className="rf-platform-card-icon" aria-hidden="true"><Icon size={21} /></span>
              <span className="rf-platform-card-title">{name}</span>
              <PlatformStatusBadge status={getPlatformStatus(id)} />
              <span className="rf-platform-card-note">Public videos · Guide</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DetectedPlatform({ name, Icon, status }: {
  name: string;
  Icon: typeof platformRegistry[number]['Icon'];
  status: PlatformStatus;
}) {
  return (
    <div className="rf-detected-platform" role="status" aria-live="polite">
      <span className="rf-platform-card-icon" aria-hidden="true"><Icon size={17} /></span>
      <span><strong>{name} link detected</strong><small>Ready to fetch available download options.</small></span>
      <PlatformStatusBadge status={status} />
    </div>
  );
}
