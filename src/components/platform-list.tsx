import { Link } from 'wouter';
import { getPlatformStatus, platformRegistry, type PlatformStatus } from '@/data/platforms';

export function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  return <span className={`rf-platform-status rf-status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

export function PlatformGrid() {
  return (
    <section className="rf-section rf-section-tint" aria-labelledby="platforms-heading">
      <div className="rf-container">
        <div className="rf-section-heading">
          <span className="rf-eyebrow">Platform directory</span>
          <h2 id="platforms-heading">One place for video links.</h2>
          <p>Platform recognition is separate from video access. Statuses show whether a real, authorized integration is connected.</p>
        </div>
        <div className="rf-platform-grid">
          {platformRegistry.map(({ id, name, Icon }) => (
            <Link className="rf-platform-card" href={`/platform/${id}`} key={id} data-testid={`link-platform-${id}`}>
              <span className="rf-platform-card-icon" aria-hidden="true"><Icon size={21} /></span>
              <span className="rf-platform-card-title">{name}</span>
              <PlatformStatusBadge status={getPlatformStatus(id)} />
              <span className="rf-platform-card-note">URL format only · no video lookup</span>
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
      <span><strong>{name} link format detected</strong><small>Format recognition only; no video data was fetched.</small></span>
      <PlatformStatusBadge status={status} />
    </div>
  );
}
