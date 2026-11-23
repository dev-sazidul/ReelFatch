'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { getPlatformById, getPlatformStatus, platformRegistry } from '@/data/platforms';
import { PlatformStatusBadge } from '@/components/platform-list';
import { VideoResultCard } from '@/components/video-result-card';
import { VideoUrlForm } from '@/components/video-url-form';
import { useVideoLookup } from '@/hooks/use-video-lookup';
import { NotFoundPage } from '@/views/info-pages';

export default function PlatformPage({ slug }: { slug: string }) {
  const platform = getPlatformById(slug);
  const lookup = useVideoLookup();

  if (!platform) return <NotFoundPage />;

  const status = getPlatformStatus(platform.id);
  const isAvailable = status === 'Available';
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
              {isAvailable
                ? `${platform.name} links can be checked below when the video is public. Only listed qualities can be saved.`
                : `${platform.name} downloads are currently ${status} due to platform authentication or server access restrictions.`}
            </p>
          </div>
          <PlatformStatusBadge status={status} />
        </div>

        {isAvailable ? (
          <div style={{ marginBottom: 28 }}>
            <VideoUrlForm
              url={lookup.url}
              notice={lookup.notice}
              isLoading={lookup.isLoading}
              onUrlChange={lookup.updateUrl}
              onPaste={() => void lookup.pasteUrl()}
              onClear={lookup.clearUrl}
              onSubmit={(event) => void lookup.submit(event)}
            />
            {lookup.result && lookup.provider && <VideoResultCard result={lookup.result} provider={lookup.provider} />}
          </div>
        ) : (
          <div className="rf-status warning" role="note" style={{ marginBottom: 28 }}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              {platform.name} is currently marked <strong>{status}</strong>. We do not bypass login walls or platform restrictions.{' '}
              <Link href="/#platforms" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>
                View available platforms
              </Link>
              .
            </span>
          </div>
        )}

        <section className="rf-platform-faq" aria-labelledby="platform-steps-title">
          <h2 id="platform-steps-title">How to use ReelFetch for {platform.name}</h2>
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

        {platform.troubleshooting.length > 0 && (
          <section className="rf-platform-faq" aria-labelledby="platform-troubleshoot-title">
            <h2 id="platform-troubleshoot-title">{platform.name} troubleshooting</h2>
            <ul className="rf-prose" style={{ paddingLeft: 20 }}>
              {platform.troubleshooting.map((tip) => (
                <li key={tip} style={{ marginBottom: 8 }}>{tip}</li>
              ))}
            </ul>
          </section>
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
