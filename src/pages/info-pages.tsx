import { Link } from 'wouter';
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
  return <><PageHero eyebrow="About ReelFetch" title="A clear way to check a Facebook link." intro="ReelFetch is an independent interface for Facebook Reels and videos. It is designed to show download options only when an authorized source provides them." /><div className="rf-container rf-prose"><h2>What this is today</h2><p>Find Video sends the link to the ReelFetch API. That API calls Facebook's Graph API only when a user or Page access token is configured, and only for a numeric video id. The sample result layout on the homepage is labeled demo data and is not a lookup of your link.</p><h2>What we value</h2><p>The interface should be easy to use on a phone and honest about what it can do. ReelFetch does not claim that every video, quality, or device will work.</p><h2>Independent by design</h2><p>ReelFetch is not affiliated with, endorsed by, or sponsored by Meta or Facebook. Those names are used only to describe the kinds of links this tool is built to accept.</p><Link href="/#tool" className="rf-button rf-button-secondary" style={{ marginTop: 14 }} data-testid="link-about-home">Go to the link field <ArrowRight size={15} /></Link></div></>;
}

export function ContactPage() {
  return <><PageHero eyebrow="Contact" title="We’re setting up the right way to reach us." intro="A real contact channel has not been configured for this project yet. We won’t invent an email address or direct you to an inbox that may not exist." /><div className="rf-container rf-prose"><div className="rf-contact-card"><span className="rf-iconbox"><Mail size={20} /></span><h2 style={{ marginTop: 18 }}>Contact details need configuration</h2><p>Before launch, the project owner should add a monitored support email or contact form, plus a response-time expectation. Until then, please treat this page as a setup placeholder rather than an active support channel.</p><div className="rf-draft"><CircleAlert size={15} /> Placeholder — configure before publication</div></div><p style={{ marginTop: 24 }}>For questions about rights or takedowns, a valid contact route must be configured before this service is made available.</p></div></>;
}

const legalCopy: Record<string, { eyebrow: string; title: string; intro: string; headings: [string, string][] }> = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy should be easy to understand.',
    intro: 'This draft describes the current demo experience only. It needs review and completion before any production service collects or processes data.',
    headings: [
      ['What this demo does', 'Find Video sends the pasted link to the ReelFetch API on the server you run. Facebook is contacted only when a Graph API token is configured. Clipboard paste runs only when you press Paste and depends on browser permission.'],
      ['Data and storage', 'The API keeps a lookup in memory until it expires, then discards it. Tokens stay in server configuration and are not written to the browser. The project owner must still review hosting, analytics, logs, and retention before publishing a final policy.'],
      ['Future changes', 'If a service is connected later, this policy must be updated to accurately explain what information is processed, why, how long it is retained, and how users can make a privacy request.'],
      ['Contact', 'A monitored privacy contact address has not been configured. Add and verify a contact channel before this policy is published.'],
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Use content responsibly.',
    intro: 'These draft terms are not legal advice and must be reviewed by qualified counsel and the project owner before publication.',
    headings: [
      ['Demo availability', 'ReelFetch can request video details from Facebook\'s Graph API when the server token is allowed to read that video. It does not download a file the API does not return. The labeled sample card on the homepage is not a lookup result.'],
      ['Your rights and responsibilities', 'You should use only content you own or have permission to save, and follow applicable laws and the source platform’s terms. You are responsible for confirming that your use is authorized.'],
      ['No promises about future availability', 'A URL format being recognized does not guarantee that content is accessible, that a source exists, or that a future service will support it.'],
      ['Review required', 'Terms for an operational service should address eligibility, permitted use, availability, liability, dispute handling, and applicable jurisdiction. Those details have not been configured here.'],
    ],
  },
  copyright: {
    eyebrow: 'Copyright / Takedown',
    title: 'Rights concerns need a real path.',
    intro: 'This page is a draft information placeholder. A formal process and monitored contact must be configured and legally reviewed before publication.',
    headings: [
      ['Respect for rights', 'Do not use this interface to copy or save work unless you own it or have permission. ReelFetch does not determine ownership or grant rights to any content.'],
      ['Submitting a notice', 'No takedown contact or submission process has been configured yet. The site owner must provide a monitored route and publish clear notice requirements before launch. Do not rely on this page as receipt of a formal legal notice.'],
      ['What a future process should explain', 'A reviewed policy should identify the designated agent or contact, required notice information, counter-notice process where applicable, and how reports are handled.'],
      ['Independent service', 'ReelFetch is not affiliated with, endorsed by, or sponsored by Meta or Facebook.'],
    ],
  },
};

function LegalPage({ page }: { page: 'privacy' | 'terms' | 'copyright' }) {
  const content = legalCopy[page];
  return <><PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} /><div className="rf-container rf-prose"><DraftNotice />{content.headings.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}<p style={{ marginTop: 32, fontSize: 12 }}>Last updated: not yet published. This draft is for product planning and requires review.</p></div></>;
}

export function PrivacyPage() { return <LegalPage page="privacy" />; }
export function TermsPage() { return <LegalPage page="terms" />; }
export function CopyrightPage() { return <LegalPage page="copyright" />; }

export function FaqPage() {
  return <><PageHero eyebrow="FAQ" title="Good questions deserve straight answers." intro="These answers describe how ReelFetch works today, including what happens before an authorized download source is connected." /><div className="rf-container" style={{ padding: '8px 0 80px' }}><div className="rf-draft" style={{ marginBottom: 21 }}><ShieldCheck size={15} /> Limits are stated plainly</div><FaqAccordion items={[...homeFaq, ...moreFaq]} idPrefix="faq" /></div></>;
}

export function NotFoundPage() {
  return <><PageHero eyebrow="Not found" title="That page isn’t here." intro="The address may have changed, or the page may not exist." /><div className="rf-container rf-prose"><Link href="/" className="rf-button rf-button-primary" data-testid="link-not-found-home">Back to ReelFetch <ArrowRight size={15} /></Link></div></>;
}
