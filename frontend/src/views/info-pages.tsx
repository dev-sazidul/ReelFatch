'use client';

import Link from 'next/link';
import { ArrowRight, CircleAlert, Mail, ShieldCheck } from 'lucide-react';
import { FaqAccordion } from '@/components/faq-accordion';
import { homeFaq, moreFaq } from '@/content/site';

function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return <section className="rf-page-hero"><div className="rf-container"><span className="rf-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></section>;
}

function DraftNotice() {
  return <div className="rf-draft" role="note"><CircleAlert size={15} /> Draft — review required before publication</div>;
}

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About ReelFetch"
        title="Fast, simple, and universal video downloading."
        intro="ReelFetch is a high-performance web tool designed to help creators, researchers, and users save public videos, Reels, and Shorts for offline viewing."
      />
      <div className="rf-container rf-prose">
        <h2>What ReelFetch Does</h2>
        <p>
          ReelFetch connects you directly with media from your favorite social platforms. Paste a link from YouTube, Instagram, TikTok, Facebook, X (Twitter), Reddit, or Pinterest, and ReelFetch instantly analyzes the stream and provides high-definition MP4 download options.
        </p>

        <h2>Universal Platform Support</h2>
        <p>
          Unlike tools restricted to a single platform, ReelFetch utilizes a versatile backend engine capable of retrieving videos from thousands of websites with maximum fidelity, audio synchronization, and fast delivery.
        </p>

        <h2>Our Core Values</h2>
        <p>
          <strong>No Bloat or Paywalls:</strong> You never need to install extensions, apps, or sign up for an account. ReelFetch is 100% free and straightforward.
        </p>
        <p>
          <strong>Privacy First:</strong> We do not track your downloads, archive personal libraries, or retain files after your transfer is completed.
        </p>

        <Link href="/#tool" className="rf-button rf-button-primary" style={{ marginTop: 14 }} data-testid="link-about-home">
          Start Downloading <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We are here to help."
        intro="Have feedback, feature suggestions, or questions regarding ReelFetch? Get in touch with us."
      />
      <div className="rf-container rf-prose">
        <div className="rf-contact-card">
          <span className="rf-iconbox"><Mail size={20} /></span>
          <h2 style={{ marginTop: 18 }}>Customer Support &amp; Inquiries</h2>
          <p>
            For technical support, inquiries, or bug reports, you can contact our support desk directly at:
          </p>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'hsl(var(--rf-accent))' }}>
            support@reelfetch.com
          </p>
          <p style={{ fontSize: 13, color: 'hsl(216 14% 45%)' }}>
            We typically reply within 24–48 business hours.
          </p>
        </div>
        <p style={{ marginTop: 24 }}>
          For copyright or content removal requests, please review our <Link href="/copyright" className="rf-text-link" style={{ marginTop: 0 }}>Copyright &amp; Takedown Policy</Link>.
        </p>
      </div>
    </>
  );
}

const legalCopy: Record<string, { eyebrow: string; title: string; intro: string; headings: [string, string][] }> = {
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'Your privacy is respected and protected.',
    intro: 'This Privacy Policy explains how ReelFetch handles video links and data when you use our service.',
    headings: [
      ['Information We Do Not Collect', 'ReelFetch does not require an account, email address, password, or credit card. We do not track user identities or maintain personal download libraries.'],
      ['How Links Are Processed', 'When you submit a video URL, it is temporarily processed by our server to extract available video quality streams. As soon as your download finishes, temporary file fragments are permanently deleted.'],
      ['Cookies & Storage', 'ReelFetch does not use tracking cookies or persistent advertising identifiers. Basic session headers are used solely to deliver video stream chunks to your browser.'],
      ['Security', 'All communication with ReelFetch is encrypted using standard HTTPS. Outbound media streaming is routed directly to the client browser without intermediate persistent storage.'],
    ],
  },
  terms: {
    eyebrow: 'Terms of Service',
    title: 'Terms of Service',
    intro: 'Please review these terms carefully before using ReelFetch.',
    headings: [
      ['Permitted Use', 'ReelFetch is intended for personal, non-commercial offline viewing of publicly accessible media. You agree not to use the service in violation of copyright or applicable laws.'],
      ['User Responsibility', 'You are solely responsible for verifying that you have the right or permission to download and save any video content accessed through ReelFetch.'],
      ['Availability & Disclaimers', 'ReelFetch is provided on an "as is" and "as available" basis without warranty of any kind. Availability depends on the source platform and internet connectivity.'],
      ['Changes to the Service', 'We reserve the right to modify, suspend, or update ReelFetch features at any time to maintain service quality and reliability.'],
    ],
  },
  copyright: {
    eyebrow: 'Copyright & DMCA',
    title: 'Copyright and Intellectual Property',
    intro: 'ReelFetch respects the intellectual property rights of content creators worldwide.',
    headings: [
      ['Respect for Creators', 'ReelFetch does not host, store, or index copyrighted video files on its servers. All videos remain on the host platform and are fetched on-demand per user request.'],
      ['Takedown Requests', 'If you are a copyright owner or an authorized representative and believe content is being infringed, you may submit a notice to us at dmca@reelfetch.com with the relevant video URLs and proof of ownership.'],
      ['Independent Tool', 'ReelFetch is an independent third-party tool and is not affiliated with, endorsed by, or sponsored by Meta, YouTube, TikTok, Instagram, or any other platform.'],
    ],
  },
};

function LegalPage({ page }: { page: 'privacy' | 'terms' | 'copyright' }) {
  const content = legalCopy[page];
  return (
    <>
      <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} />
      <div className="rf-container rf-prose">
        {content.headings.map(([heading, text]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{text}</p>
          </section>
        ))}
        <p style={{ marginTop: 32, fontSize: 12, color: 'hsl(216 13% 49%)' }}>
          Last updated: {new Date().getFullYear()} ReelFetch. All rights reserved.
        </p>
      </div>
    </>
  );
}

export function PrivacyPage() { return <LegalPage page="privacy" />; }
export function TermsPage() { return <LegalPage page="terms" />; }
export function CopyrightPage() { return <LegalPage page="copyright" />; }

export function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Frequently Asked Questions"
        intro="Find answers to common questions about downloading videos, reels, audio quality, and supported platforms."
      />
      <div className="rf-container" style={{ padding: '8px 0 80px' }}>
        <FaqAccordion items={[...homeFaq, ...moreFaq]} idPrefix="faq" />
      </div>
    </>
  );
}

export function NotFoundPage() {
  return <><PageHero eyebrow="Not found" title="That page isn’t here." intro="The address may have changed, or the page may not exist." /><div className="rf-container rf-prose"><Link href="/" className="rf-button rf-button-primary" data-testid="link-not-found-home">Back to ReelFetch <ArrowRight size={15} /></Link></div></>;
}
