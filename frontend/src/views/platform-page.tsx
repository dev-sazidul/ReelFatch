'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { getPlatformById, getPlatformStatus } from '@/data/platforms';
import { getAuthorizedVideoProvider } from '@/services/platform-integrations';
import { PlatformStatusBadge } from '@/components/platform-list';
import { NotFoundPage } from '@/views/info-pages';

export default function PlatformPage({ slug }: { slug: string }) {
  const platformId = slug;
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
            <h1>Download {platform.name} Videos &amp; Reels</h1>
          </div>
          <p>
            Easily download public {platform.name} videos, reels, and audio in high-definition MP4 format for offline viewing.
          </p>
        </div>
      </section>
      <section className="rf-container rf-platform-page-content">
        <div className="rf-platform-page-status">
          <div>
            <span className="rf-eyebrow">Service status</span>
            <p>
              {platform.name} video and audio downloads are fully operational in high quality.
            </p>
          </div>
          <PlatformStatusBadge status={status} />
        </div>
        <Link href="/#tool" className="rf-button rf-button-primary" data-testid="link-platform-tool">
          Download {platform.name} Video <ArrowRight size={15} />
        </Link>
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
