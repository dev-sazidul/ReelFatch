'use client';

import Link from 'next/link';
import { ArrowRight, CircleAlert, Mail, ShieldCheck } from 'lucide-react';
import { FaqAccordion } from '@/components/faq-accordion';
import { homeFaq, moreFaq } from '@/content/site';

function PageHero({ eyebrow, title, intro, current }: { eyebrow: string; title: string; intro: string; current: string }) {
  return (
    <section className="rf-page-hero">
      <div className="rf-container">
        <nav className="rf-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{current}</span>
        </nav>
        <span className="rf-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
    </section>
  );
}

function DraftNotice() {
  return <div className="rf-draft" role="note"><CircleAlert size={15} /> Draft — review required before publication</div>;
}

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About ReelFetch"
        title="An independent downloader for public videos."
        intro="ReelFetch checks a public video link and offers a file only when that source returns one."
        current="About"
      />
      <div className="rf-container rf-prose">
        <h2>What ReelFetch Does</h2>
        <p>
          Paste a public link from <Link href="/platform/youtube">YouTube</Link>, <Link href="/platform/instagram">Instagram</Link>, <Link href="/platform/tiktok">TikTok</Link>, <Link href="/platform/facebook">Facebook</Link>, <Link href="/platform/x">X</Link>, <Link href="/platform/reddit">Reddit</Link>, or <Link href="/platform/pinterest">Pinterest</Link>. The homepage then lists the qualities that link actually provides.
        </p>

        <h2>What a listed platform means</h2>
        <p>
          Each platform page explains which public links to paste and what ReelFetch will not retrieve, including private accounts and deleted posts. A platform page is not a promise that every URL on that site can be saved.
        </p>

        <h2>Our Core Values</h2>
        <p>
          <strong>No Bloat or Paywalls:</strong> You never need to install extensions, apps, or sign up for an account. ReelFetch is 100% free and straightforward.
        </p>
        <p>
          <strong>No account:</strong> Checking a link does not require registration. Temporary download files are removed after the transfer. Analytics and advertising are described in the <Link href="/privacy">privacy policy</Link>.
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
        title="Contact ReelFetch"
        intro="Use this page for product questions. Copyright notices have a separate address."
        current="Contact"
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
    intro: 'This policy describes how ReelFetch handles a video link you submit, plus the analytics and advertising scripts loaded with the site.',
    headings: [
      ['Information you do not have to give us', 'ReelFetch does not require an account, password, or payment card. It does not keep a personal library of the videos you download.'],
      ['How links are processed', 'A submitted video URL is processed to look up formats the source returns. Temporary files used for a download are deleted after the transfer finishes. The optional ReelFetch browser extension can open this page with a link you chose. That link is checked the same way as a link you paste. The extension does not receive your downloads.'],
      ['Analytics, ads, and storage', 'The site loads a Google tag for measurement ID G-V30LSQ672C, Microsoft Clarity for usage analytics, and Google AdSense for advertising. Those services may set their own cookies. ReelFetch also uses ordinary request headers to send a file to your browser. Review their policies if you want to limit that data.'],
      ['Security', 'Pages are served over HTTPS. Do not send passwords or private media links that you are not allowed to share with a third-party tool.'],
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
      <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} current={content.eyebrow} />
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
        title="Video downloader questions"
        intro="These answers cover public links, file quality, private posts, and copyright. They match the questions shown on this page."
        current="FAQ"
      />
      <div className="rf-container" style={{ padding: '8px 0 80px' }}>
        <FaqAccordion items={[...homeFaq, ...moreFaq]} idPrefix="faq" />
        <nav className="rf-related" aria-label="Platform guides" style={{ marginTop: 28 }}>
          <Link href="/platform/facebook">Facebook</Link>
          <Link href="/platform/youtube">YouTube</Link>
          <Link href="/platform/instagram">Instagram</Link>
          <Link href="/platform/tiktok">TikTok</Link>
          <Link href="/platform/x">X</Link>
          <Link href="/platform/pinterest">Pinterest</Link>
          <Link href="/platform/reddit">Reddit</Link>
          <Link href="/#tool">Open the downloader</Link>
        </nav>
      </div>
    </>
  );
}

export function NotFoundPage() {
  return <><PageHero eyebrow="Not found" title="That page isn’t here." intro="The address may have changed, or the page may not exist." current="Not found" /><div className="rf-container rf-prose"><Link href="/" className="rf-button rf-button-primary" data-testid="link-not-found-home">Back to ReelFetch <ArrowRight size={15} /></Link></div></>;
}
