'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getPlatformById, getPlatformStatus, platformRegistry } from '@/data/platforms';
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
          <nav className="rf-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{platform.name}</span>
          </nav>
          <div className="rf-platform-page-heading">
            <span className="rf-platform-card-icon" aria-hidden="true"><PlatformIcon size={25} /></span>
            <h1>{platform.headline}</h1>
          </div>
          <p>{platform.intro}</p>
        </div>
      </section>
      <section className="rf-container rf-platform-page-content">
        <div className="rf-platform-page-status">
          <div>
            <span className="rf-eyebrow">Service status</span>
            <p>
              {hasReadyIntegration
                ? `${platform.name} links can be checked when the video is public. Only listed qualities can be saved.`
                : `${platform.name} lookup is not available from this server right now.`}
            </p>
          </div>
          <PlatformStatusBadge status={status} />
        </div>
        <Link href="/#tool" className="rf-button rf-button-primary" data-testid="link-platform-tool">
          Open the downloader <ArrowRight size={15} />
        </Link>
        <section className="rf-platform-faq" aria-labelledby="platform-steps-title">
          <h2 id="platform-steps-title">How to download from {platform.name}</h2>
          <ol className="rf-steps">
            {platform.steps.map((step, index) => (
              <li className="rf-step" key={step}>
                <span className="rf-step-number">Step {index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <p className="rf-result-note">{platform.note}</p>
        </section>
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
        <section className="rf-platform-faq" aria-labelledby="related-title">
          <h2 id="related-title">Other download pages</h2>
          <nav className="rf-related" aria-label="Related platforms">
            {platformRegistry.filter((item) => item.id !== platform.id).map((item) => (
              <Link key={item.id} href={`/platform/${item.id}`}>{item.name} downloader</Link>
            ))}
            <Link href="/faq">Downloader FAQ</Link>
            <Link href="/copyright">Copyright policy</Link>
          </nav>
        </section>
      </section>
    </>
  );
}
