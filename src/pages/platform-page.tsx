import { Link, useLocation } from 'wouter';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { getPlatformById, getPlatformStatus } from '@/data/platforms';
import { getAuthorizedVideoProvider } from '@/services/platform-integrations';
import { PlatformStatusBadge } from '@/components/platform-list';
import { NotFoundPage } from '@/pages/info-pages';

export default function PlatformPage() {
  const [location] = useLocation();
  const platformId = location.split('/').filter(Boolean).at(-1);
  const platform = getPlatformById(platformId);

  if (!platform) return <NotFoundPage />;

  const status = getPlatformStatus(platform.id);
  const hasReadyIntegration = status === 'Available' && Boolean(getAuthorizedVideoProvider(platform.id));
  const PlatformIcon = platform.Icon;

  return (
    <>
      <section className="rf-page-hero">
        <div className="rf-container">
          <span className="rf-eyebrow">Platform guide</span>
          <div className="rf-platform-page-heading">
            <span className="rf-platform-card-icon" aria-hidden="true"><PlatformIcon size={25} /></span>
            <h1>{platform.name} video links</h1>
          </div>
          <p>{hasReadyIntegration
            ? `Review ${platform.name} video options when the connected service returns a file you are allowed to access.`
            : `This page is an informational status guide. ReelFetch does not currently look up or download ${platform.name} videos.`}
          </p>
        </div>
      </section>
      <section className="rf-container rf-platform-page-content">
        <div className="rf-platform-page-status">
          <div>
            <span className="rf-eyebrow">Current service status</span>
            <p>{hasReadyIntegration
              ? `The ${platform.name} lookup service is connected. A download is offered only when that service returns a file the configured token may access.`
              : `The ${platform.name} URL format is recognized for routing only. No video details or quality options are fetched.`}
            </p>
          </div>
          <PlatformStatusBadge status={status} />
        </div>
        {hasReadyIntegration ? (
          <Link href="/#tool" className="rf-button rf-button-primary" data-testid="link-platform-tool">
            Check a video link <ArrowRight size={15} />
          </Link>
        ) : (
          <div className="rf-disclosure" role="note">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Service pages become functional only after an authorized backend integration is connected. Only use videos you own or are permitted to save.</span>
          </div>
        )}
        <section className="rf-platform-faq" aria-labelledby="platform-faq-title">
          <h2 id="platform-faq-title">About {platform.name} links</h2>
          <div className="rf-faq-list">
            {platform.faqs.map((faq) => (
              <details className="rf-faq-item" key={faq.question}>
                <summary className="rf-faq-question"><span>{faq.question}</span><span aria-hidden="true">+</span></summary>
                <div className="rf-faq-answer">{faq.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
