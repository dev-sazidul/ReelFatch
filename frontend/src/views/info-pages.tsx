'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, Send } from 'lucide-react';
import { useCookieConsent } from '@/components/cookie-consent';
import { FutureSolutionBadge } from '@/components/ecosystem-tools';
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

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About ReelFetch"
        title="An independent downloader for public videos."
        intro="ReelFetch checks public video links on bestdownloader.site and prepares downloads only when the source platform provides a public media stream."
        current="About"
      />
      <div className="rf-container rf-prose">
        <h2>What ReelFetch Does</h2>
        <p>
          Paste a public link from <Link href="/platform/facebook">Facebook</Link>, <Link href="/platform/youtube">YouTube</Link>, or <Link href="/platform/tiktok">TikTok</Link> to view the actual qualities returned by that source. Platforms that currently restrict unauthenticated server lookups (<Link href="/platform/instagram">Instagram</Link>, <Link href="/platform/x">X</Link>, <Link href="/platform/reddit">Reddit</Link>, and <Link href="/platform/pinterest">Pinterest</Link>) are transparently marked as Coming Soon.
        </p>

        <div className="rf-about-fsi-callout">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span className="rf-eyebrow" style={{ margin: 0 }}>Developer</span>
            <FutureSolutionBadge />
          </div>
          <h2 style={{ marginTop: 0 }}>Built by FutureSolutionAI</h2>
          <p>
            ReelFetch is developed and maintained by{' '}
            <a href="https://futuresolutionai.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'hsl(var(--rf-accent))', textDecoration: 'underline' }}>
              FutureSolutionAI
            </a>
            {' '}for fast, browser-based personal offline viewing on{' '}
            <strong>bestdownloader.site</strong>.
          </p>
        </div>

        <h2>Honest Platform Statuses</h2>
        <p>
          Each platform page explains how to check a public link, what limitations apply, and common troubleshooting steps. A platform page never promises access to private accounts, deleted posts, or login-gated media.
        </p>

        <h2>Core Principles</h2>
        <p>
          <strong>No Account Required:</strong> You do not need to register or sign in. Lookups expire automatically after 10 minutes, and temporary download files are deleted immediately after streaming finishes.
        </p>
        <p>
          <strong>Transparent Privacy:</strong> Analytics and advertising scripts, as well as cookie controls, are documented in our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <Link href="/#tool" className="rf-button rf-button-primary" style={{ marginTop: 14 }} data-testid="link-about-home">
          Start Downloading <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'success' | 'error'; text: string }>({ kind: 'idle', text: '' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: 'loading', text: 'Sending your message…' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setStatus({ kind: 'error', text: data.message || 'Could not send your message. Please check all fields.' });
        return;
      }
      setStatus({ kind: 'success', text: data.message || 'Message received.' });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setStatus({ kind: 'error', text: 'Network error while sending message. Please try again or email support@reelfetch.com.' });
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Contact ReelFetch"
        intro="Use the form below or our support email for product questions and bug reports on bestdownloader.site."
        current="Contact"
      />
      <div className="rf-container rf-prose">
        <div className="rf-contact-card" style={{ marginBottom: 28 }}>
          <span className="rf-iconbox"><Mail size={20} /></span>
          <h2 style={{ marginTop: 18 }}>Customer Support &amp; Inquiries</h2>
          <p>
            For technical support, bug reports, or privacy requests, email us at{' '}
            <a href="mailto:support@reelfetch.com" style={{ fontWeight: 700, color: 'hsl(var(--rf-accent))' }}>
              support@reelfetch.com
            </a>{' '}
            or use the contact form below.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="rf-contact-form" noValidate data-testid="form-contact">
          <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="rf-form-row">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" type="text" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="rf-form-row">
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="rf-form-row">
            <label htmlFor="contact-subject">Subject</label>
            <input id="contact-subject" type="text" required minLength={3} maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="How can we help?" />
          </div>
          <div className="rf-form-row">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" required minLength={10} maxLength={2000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your question or issue..." />
          </div>
          <button type="submit" className="rf-button rf-button-primary" disabled={status.kind === 'loading'} data-testid="button-contact-submit">
            <Send size={15} aria-hidden="true" /> {status.kind === 'loading' ? 'Sending…' : 'Send Message'}
          </button>
          {status.kind !== 'idle' && (
            <p className={`rf-status ${status.kind}`} role="status" style={{ marginTop: 14 }}>
              {status.text}
            </p>
          )}
        </form>

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
    title: 'Privacy Policy for ReelFetch (bestdownloader.site)',
    intro: 'This policy explains what information ReelFetch processes when you visit bestdownloader.site, how submitted video URLs and temporary files are handled, and how you can manage analytics and advertising cookies.',
    headings: [
      ['1. Information We Do Not Collect', 'ReelFetch does not require account registration, passwords, or payment details. We do not maintain a user database or personal download history library.'],
      ['2. Submitted Video URLs & Server Processing', 'When you submit a public video URL, our server validates the link, resolves its public metadata, and stores a temporary lookup record in server memory for up to 10 minutes (600 seconds) so you can start a download. IP-based rate-limiting counters are held temporarily in memory (60-second window) to prevent abuse.'],
      ['3. Temporary Files & Data Retention', 'When a download requires server-side stream preparation or audio/video merging, a temporary file is written to server temporary storage and deleted immediately once streaming finishes, fails, or times out. We do not permanently store or archive downloaded videos.'],
      ['4. Cookies, Analytics & Advertising', 'Essential browser storage (localStorage) remembers your cookie preference and PWA installation state. Non-essential analytics scripts—Google Analytics (Measurement ID G-V30LSQ672C) and Microsoft Clarity (project zbyj1kutx9)—are loaded only if you accept non-essential cookies via our Cookie Preferences banner. Google AdSense (Publisher ID ca-pub-5871594289590523) is also integrated on this site and may use cookies or device identifiers in accordance with Google’s Privacy & Terms.'],
      ['5. Managing Consent & Your Rights', 'You can accept or reject non-essential analytics cookies at any time using the Cookie Settings link in the website footer. Depending on your jurisdiction (such as GDPR or CCPA), you may also request information about or deletion of any contact inquiries you have submitted by emailing support@reelfetch.com.'],
      ['6. Security', 'All pages and API requests are served over HTTPS. Do not submit private links, credentials, or confidential URLs that you are not authorized to process through a public web tool.'],
    ],
  },
  terms: {
    eyebrow: 'Terms of Service',
    title: 'Terms of Service',
    intro: 'By accessing or using ReelFetch at bestdownloader.site, you agree to the following terms.',
    headings: [
      ['1. Permitted Personal Use', 'ReelFetch is a technical utility intended solely for personal, non-commercial offline viewing of publicly accessible video content. You agree not to use the service for bulk scraping, automated abuse, or redistribution of copyrighted works.'],
      ['2. User Responsibility & Authorization', 'You are solely responsible for ensuring that you own the content, have explicit permission from the copyright holder, or have a lawful basis under applicable law and the source platform’s terms before downloading any media.'],
      ['3. Third-Party Platform Disclaimers', 'ReelFetch is an independent tool and is not affiliated with, endorsed by, or sponsored by Meta (Facebook, Instagram), Google (YouTube), ByteDance (TikTok), X Corp., Reddit, or Pinterest.'],
      ['4. Service Availability & Limits', 'ReelFetch is provided on an "as is" and "as available" basis without warranties of any kind. Individual downloads are capped at 512 MB, and platform availability may change without notice if a third-party site restricts public access.'],
    ],
  },
  copyright: {
    eyebrow: 'Copyright & DMCA',
    title: 'Copyright & Takedown Policy',
    intro: 'ReelFetch respects the intellectual property rights of creators and publishers worldwide.',
    headings: [
      ['1. No Hosting or Indexing', 'ReelFetch does not host, store, index, or distribute video files. All media remains on its original source platform and is processed strictly on-demand at the user’s request.'],
      ['2. Submitting a Copyright or Blocking Request', 'If you are a copyright owner or authorized agent and believe your rights are being infringed or wish to request that specific URLs or domains be blocked from processing, please send a written notice to dmca@reelfetch.com including your contact details, proof of authorization, and the exact URL(s) in question.'],
      ['3. Independent Status', 'ReelFetch is an independent third-party utility operating at bestdownloader.site and has no affiliation with any social media or video hosting platform.'],
    ],
  },
};

function LegalPage({ page }: { page: 'privacy' | 'terms' | 'copyright' }) {
  const content = legalCopy[page];
  const { openSettings } = useCookieConsent();
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
        {page === 'privacy' && (
          <p style={{ marginTop: 20 }}>
            <button type="button" className="rf-button rf-button-secondary" onClick={openSettings}>
              Manage Cookie Preferences
            </button>
          </p>
        )}
        <p style={{ marginTop: 32, fontSize: 12, color: 'hsl(216 13% 49%)' }}>
          Last updated: November 23, 2026 · ReelFetch (bestdownloader.site)
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
        intro="Answers about supported platforms, selectable qualities, file size limits, mobile downloads, and copyright."
        current="FAQ"
      />
      <div className="rf-container" style={{ padding: '8px 0 80px' }}>
        <FaqAccordion items={[...homeFaq, ...moreFaq]} idPrefix="faq" />
        <nav className="rf-related" aria-label="Platform guides" style={{ marginTop: 28 }}>
          <Link href="/platform/facebook">Facebook</Link>
          <Link href="/platform/youtube">YouTube</Link>
          <Link href="/platform/tiktok">TikTok</Link>
          <Link href="/platform/instagram">Instagram</Link>
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
