import { Link } from 'wouter';
import { ArrowRight, CircleAlert, Mail, ShieldCheck } from 'lucide-react';

const questions = [
  ['How do I use the downloader?', 'Copy a video or Reel link, paste it into the link field, and check the format. The current interface is a demo, so it does not look up videos or download files.'],
  ['Why is a video link not working?', 'Make sure the complete address starts with https:// or http:// and uses a recognized facebook.com or fb.watch format. A valid format does not guarantee that a source is accessible.'],
  ['Why are some quality options unavailable?', 'Quality choices depend on what an authorized source actually provides. The options shown in this demonstration are sample data only.'],
  ['Where are downloaded files saved?', 'This demo does not create files. If a real service is added later, saving behavior will depend on your browser and device.'],
  ['Is ReelFetch connected to a video service?', 'No. The current site is a front-end demonstration. It does not send links to a server, retrieve video information, or provide downloads.'],
  ['Which links are supported?', 'The interface recognizes URL formats on facebook.com and fb.watch. This is only a format check and does not guarantee access, compatibility, or an available source.'],
  ['Does the demo preview show my video?', 'No. Preview details are illustrative sample data, separate from your link. The sample thumbnail is abstract artwork and there is no sample file to download.'],
  ['Can I use ReelFetch on a phone?', 'The interface is responsive and designed for modern Android and iPhone browsers as well as tablets and desktop browsers. Saving behavior, if a future authorized service is added, would depend on your browser and device.'],
  ['Will a video automatically save to my gallery?', 'No automatic gallery saving is promised. This demo does not create or transfer files. Device and browser behavior varies.'],
  ['Do I need an account?', 'No account is requested by this demonstration.'],
  ['Can I download any video I find?', 'Only use content you own or have permission to save. Rights, platform terms, and local laws may apply. You are responsible for confirming your authorization.'],
  ['Is every Facebook video downloadable?', 'No. Availability depends on the source, access permissions, rights, and whether an authorized downloadable source exists.'],
  ['Is ReelFetch part of Meta or Facebook?', 'No. ReelFetch is an independent concept and is not affiliated with, endorsed by, or sponsored by Meta or Facebook.'],
  ['What should I do if my link is not recognized?', 'Check that you copied the full web address and that it begins with https:// or http://. The current format checker recognizes facebook.com and fb.watch only.'],
];

function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return <section className="rf-page-hero"><div className="rf-container"><span className="rf-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></section>;
}

function DraftNotice() {
  return <div className="rf-draft" role="note"><CircleAlert size={15} /> Draft — review required before publication</div>;
}

export function AboutPage() {
  return <><PageHero eyebrow="About ReelFetch" title="A link tool should be clear about the link." intro="ReelFetch is a consumer utility concept for presenting video-link options in a careful, understandable way. The interface is designed around clarity, user choice, and permission." /><div className="rf-container rf-prose"><h2>What this is today</h2><p>This site is a front-end demo. It can recognize a small set of URL formats in your browser and show an explicitly illustrative result card. It does not contact a service, check a video, or download files.</p><h2>What we value</h2><p>Useful tools should not overstate what they can do. ReelFetch aims to make each step understandable, label example content, and remind people to use only material they have the right to save.</p><h2>Independent by design</h2><p>ReelFetch is not affiliated with, endorsed by, or sponsored by Meta or Facebook. Names are used only to describe the link formats this interface is designed to recognize.</p><Link href="/" className="rf-button rf-button-secondary" style={{ marginTop: 14 }} data-testid="link-about-home">Try the illustrative demo <ArrowRight size={15} /></Link></div></>;
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
      ['What this demo does', 'The current front end validates URL formatting locally in your browser. It does not send the entered URL to a ReelFetch backend because none is connected. Clipboard paste is initiated only when you press Paste and depends on browser permission.'],
      ['Data and storage', 'No account or backend lookup is provided in this demo. The project owner must verify actual hosting, analytics, logs, cookies, and data retention practices before publishing a final policy.'],
      ['Future changes', 'If a service is connected later, this policy must be updated to accurately explain what information is processed, why, how long it is retained, and how users can make a privacy request.'],
      ['Contact', 'A monitored privacy contact address has not been configured. Add and verify a contact channel before this policy is published.'],
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Use content responsibly.',
    intro: 'These draft terms are not legal advice and must be reviewed by qualified counsel and the project owner before publication.',
    headings: [
      ['Demo availability', 'ReelFetch is currently a front-end demonstration only. It does not retrieve video information or provide a download service. Demo content is illustrative.'],
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
  return <><PageHero eyebrow="FAQ" title="Good questions deserve straight answers." intro="The details below describe this front-end demo, not a connected video lookup or download service." /><div className="rf-container" style={{ padding: '35px 0 80px' }}><div className="rf-draft" style={{ marginBottom: 21 }}><ShieldCheck size={15} /> Demo limits are stated plainly</div><div className="rf-faq-list">{questions.map(([question, answer], index) => <details className="rf-faq-item" key={question}><summary className="rf-faq-question" data-testid={`summary-faq-${index}`}><span>{question}</span><span aria-hidden="true">+</span></summary><div className="rf-faq-answer">{answer}</div></details>)}</div></div></>;
}

export function NotFoundPage() {
  return <><PageHero eyebrow="Not found" title="That page isn’t here." intro="The address may have changed, or the page may not exist." /><div className="rf-container rf-prose"><Link href="/" className="rf-button rf-button-primary" data-testid="link-not-found-home">Back to ReelFetch <ArrowRight size={15} /></Link></div></>;
}
