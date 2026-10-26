import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check, CircleAlert, Clipboard, FileCheck2, Laptop, LoaderCircle, LockKeyhole, Play, Smartphone, Tablet, WandSparkles } from 'lucide-react';
import { DemoResult, DemoDisclaimer } from '@/components/demo-result';
import { demoStatusChoices, type DemoStatusId } from '@/data/demo';

type UiState = { kind: 'idle' | 'error' | 'info' | 'warning' | 'loading'; text: string };
const supportedHosts = ['facebook.com', 'fb.watch'];

function validateUrl(raw: string): { valid: boolean; supported: boolean } {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const validProtocol = url.protocol === 'https:' || url.protocol === 'http:';
    return { valid: validProtocol, supported: validProtocol && supportedHosts.some((domain) => host === domain || host.endsWith(`.${domain}`)) };
  } catch {
    return { valid: false, supported: false };
  }
}

const features = [
  { icon: LockKeyhole, title: 'Privacy-conscious by design', text: 'No sign-in is needed in this demo, and no link is sent to a lookup service.' },
  { icon: FileCheck2, title: 'Quality choices when available', text: 'A future connected service can show only the options returned by an authorized source.' },
  { icon: WandSparkles, title: 'A simple link workflow', text: 'Paste a link, review clear guidance, and choose a next step without clutter.' },
  { icon: Check, title: 'Designed to stay lightweight', text: 'A focused interface keeps the task straightforward on a range of devices.' },
  { icon: CircleAlert, title: 'Clear status at every step', text: 'Helpful messages explain what is happening and when a retry makes sense.' },
  { icon: Smartphone, title: 'Mobile-friendly by default', text: 'Touch-friendly controls and responsive layouts support phones, tablets, and desktops.' },
];

const faqItems = [
  { q: 'How do I use the downloader?', a: 'Copy a Facebook Reel or video link, paste it above, and check its format. The current demo does not look up videos or download files.' },
  { q: 'Why is a video link not working?', a: 'Check that the full URL begins with https:// or http:// and uses facebook.com or fb.watch. A recognized format does not guarantee that a video can be accessed.' },
  { q: 'Why are some quality options unavailable?', a: 'Options depend on the actual source. The qualities shown in the demo are illustrative sample data and are not available for download.' },
  { q: 'Where are downloaded files saved?', a: 'This demo does not create files. In a future connected service, saving behavior would depend on your browser and device.' },
  { q: 'Can I use ReelFetch on a phone or tablet?', a: 'The interface is designed to adapt to Android and iPhone browsers, tablets, laptops, and desktop screens. Saving or playback behavior depends on your device and browser.' },
  { q: 'Is every Facebook video downloadable?', a: 'No. Availability depends on the source, access permissions, rights, and whether an authorized downloadable source exists.' },
];

function StatusMessage({ state }: { state: UiState }) {
  if (state.kind === 'idle') return null;
  return <div className={`rf-status ${state.kind}`} role="status" aria-live="polite" data-testid="status-form-message">{state.kind === 'loading' && <LoaderCircle className="rf-spinner" size={15} aria-hidden="true" />}{state.text}</div>;
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<UiState>({ kind: 'idle', text: '' });
  const [demoVisible, setDemoVisible] = useState(false);
  const [quality, setQuality] = useState('720');

  const handlePaste = async () => {
    if (!navigator.clipboard?.readText) {
      setState({ kind: 'warning', text: 'Clipboard access isn’t available here. Paste your link into the field manually.' });
      document.getElementById('reel-url')?.focus();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setState({ kind: 'warning', text: 'Your clipboard looks empty. Copy a link, then try again or paste it manually.' });
        return;
      }
      setUrl(text.trim());
      setState({ kind: 'info', text: 'Link pasted. Check the URL before continuing.' });
      document.getElementById('reel-url')?.focus();
    } catch {
      setState({ kind: 'warning', text: 'Clipboard permission was not granted. Paste your link into the field manually.' });
      document.getElementById('reel-url')?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateUrl(url);
    if (!url.trim() || !result.valid) {
      setState({ kind: 'error', text: 'Enter a complete web address beginning with https:// or http://.' });
      setDemoVisible(false);
      return;
    }
    if (!result.supported) {
      setState({ kind: 'error', text: 'That address is formatted correctly, but this interface only recognizes facebook.com and fb.watch links.' });
      setDemoVisible(false);
      return;
    }
    setState({ kind: 'info', text: 'Link format recognized. No lookup was made: a ReelFetch service is not connected yet.' });
    setDemoVisible(false);
  };

  const runDemo = () => {
    const result = validateUrl(url);
    if (!url.trim()) {
      setState({ kind: 'error', text: 'Add a link first so the demo can show where a preview would appear.' });
      return;
    }
    if (!result.valid) {
      setState({ kind: 'error', text: 'Invalid URL format. Enter a complete web address to continue.' });
      setDemoVisible(false);
      return;
    }
    if (!result.supported) {
      setState({ kind: 'error', text: 'Unsupported URL. The demo recognizes facebook.com and fb.watch domains only.' });
      setDemoVisible(false);
      return;
    }
    setState({ kind: 'info', text: 'Illustrative preview shown below. These details are sample data, not a result for your link.' });
    setDemoVisible(true);
  };

  const handleDemoStatus = (status: DemoStatusId) => {
    const message: Record<DemoStatusId, UiState> = {
      loading: { kind: 'loading', text: 'Loading (demo state). No request is running; this state is shown for interface preview only.' },
      invalid: { kind: 'error', text: 'Invalid URL. Check for a complete web address, including https://.' },
      unsupported: { kind: 'error', text: 'Unsupported URL. Try a facebook.com or fb.watch address.' },
      'empty-source': { kind: 'warning', text: 'No downloadable source is available in this demonstration. You can try another link when a service is connected.' },
      'quality-unavailable': { kind: 'warning', text: 'The selected quality is unavailable in this sample. Choose one of the available illustrative options.' },
      'network-error': { kind: 'error', text: 'Network error (demo state). No request was sent. Check your connection or try again later when a service is available.' },
      starting: { kind: 'warning', text: 'Download starting is a demo-only state. No file is being created or transferred.' },
      failed: { kind: 'error', text: 'Download failed (demo state). No download was attempted. Retry is unavailable until a real service is connected.' },
    };
    setState(message[status]);
  };

  const handleDemoDownload = () => setState({ kind: 'warning', text: 'Downloads are unavailable in this demo. No file was created, opened, or downloaded.' });

  return (
    <>
      <section className="rf-hero" id="tool">
        <div className="rf-container rf-hero-inner">
          <span className="rf-eyebrow">A clearer way to handle a link</span>
          <h1>Bring a link.<br /><em>Know what’s next.</em></h1>
          <p className="rf-lead">Paste a Facebook Reel or video share link to see how ReelFetch is designed to guide you. Straightforward steps, clear choices, and no guesswork.</p>
          <form className="rf-tool-card" onSubmit={handleSubmit} noValidate>
            <label className="rf-url-label" htmlFor="reel-url">Video link</label>
            <div className="rf-input-wrap">
              <input id="reel-url" className="rf-url-input" type="url" inputMode="url" autoComplete="url" placeholder="https://www.facebook.com/…" value={url} onChange={(event) => { setUrl(event.target.value); if (state.kind !== 'idle') setState({ kind: 'idle', text: '' }); }} aria-describedby="url-hint" data-testid="input-video-url" />
              {url && <button type="button" className="rf-button rf-button-quiet" onClick={() => { setUrl(''); setState({ kind: 'idle', text: '' }); setDemoVisible(false); }} aria-label="Clear video link" data-testid="button-clear-url">Clear</button>}
              <button type="button" className="rf-button rf-button-secondary rf-paste" onClick={handlePaste} data-testid="button-paste-url"><Clipboard size={15} /> Paste</button>
              <button type="submit" className="rf-button rf-button-primary" data-testid="button-check-url">Find video <ArrowRight size={15} /></button>
            </div>
            <div className="rf-helper-row" id="url-hint">
              <span><CircleAlert size={13} /> Supports facebook.com and fb.watch link formats</span>
              <span><LockKeyhole size={13} /> No sign-in required</span>
            </div>
            <StatusMessage state={state} />
            <div className="rf-form-actions">
              <button type="button" className="rf-button rf-button-secondary" onClick={runDemo} data-testid="button-show-demo"><Play size={14} /> Show illustrative preview</button>
              <span style={{ alignSelf: 'center', color: 'hsl(216 13% 49%)', fontSize: 11 }}>Explicitly labeled demo; no link lookup.</span>
            </div>
            <div style={{ marginTop: 13, borderTop: '1px solid hsl(216 24% 92%)', paddingTop: 12 }}>
              <label htmlFor="demo-status" style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'hsl(216 13% 46%)', marginBottom: 6 }}>Preview a status state (demo controls)</label>
              <select id="demo-status" aria-label="Select a demo state" defaultValue="" onChange={(event) => { if (event.target.value) handleDemoStatus(event.target.value as DemoStatusId); }} style={{ width: '100%', minHeight: 40, padding: '0 10px', borderRadius: 8, border: '1px solid hsl(216 24% 86%)', background: 'white', color: 'hsl(220 37% 24%)', font: '12px var(--app-font-sans)' }} data-testid="select-demo-status">
                <option value="" disabled>Choose a state to preview</option>
                {demoStatusChoices.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
          </form>
          <DemoDisclaimer />
          <div className="rf-trust"><span><LockKeyhole size={13} /> Your link stays in this demo</span><span><Check size={13} /> No account needed</span><span><FileCheck2 size={13} /> Permission matters</span></div>
          {demoVisible && <DemoResult selectedQuality={quality} onQualityChange={(nextQuality) => {
            setQuality(nextQuality);
            if (nextQuality === '1080') setState({ kind: 'warning', text: 'Selected quality unavailable (demo). Choose an available illustrative option.' });
          }} onDemoDownload={handleDemoDownload} />}
          {!demoVisible && <div style={{ maxWidth: 710, margin: '24px auto 0', color: 'hsl(216 13% 53%)', fontSize: 12 }} data-testid="text-empty-state">A preview will appear here only when you choose <strong>Show illustrative preview</strong>.</div>}
        </div>
      </section>

      <section className="rf-section" id="how-it-works">
        <div className="rf-container">
          <div className="rf-section-heading"><span className="rf-eyebrow">Three simple steps</span><h2>Clear from the first paste.</h2><p>The intended experience is uncomplicated. At present, this interface demonstrates the flow without processing a real link.</p></div>
          <div className="rf-steps">
            {[['01', 'Add a link', 'Paste a Facebook video URL. We’ll explain whether its format is recognized.'], ['02', 'Review the details', 'When a service is connected, available source details and choices can be presented clearly.'], ['03', 'Choose what works', 'Select an authorized option if one is available. Nothing here claims a file is ready today.']].map(([number, title, body]) => <article className="rf-step" key={number}><span className="rf-step-number">{number} / STEP</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="rf-section rf-section-tint">
        <div className="rf-container">
          <div className="rf-section-heading"><span className="rf-eyebrow">Built around clarity</span><h2>Useful details. Honest boundaries.</h2><p>A good utility should tell you what it can do, and just as plainly what it can’t.</p></div>
          <div className="rf-features">{features.map(({ icon: Icon, title, text }) => <article className="rf-feature" key={title}><span className="rf-iconbox"><Icon size={19} /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="rf-section">
        <div className="rf-container rf-platforms">
          <div>
            <div className="rf-section-heading"><span className="rf-eyebrow">Made to adapt</span><h2>Works with the screen you have.</h2><p>The layout is designed for modern browsers across phone, tablet, and desktop. What you can save or play depends on the device, browser, link, and permissions.</p></div>
            <ul className="rf-platform-list">
              <li><Smartphone size={19} /><span><strong>Android & iPhone</strong>Use a current mobile browser. Saving behavior is controlled by your browser and device.</span></li>
              <li><Tablet size={19} /><span><strong>Tablets</strong>A roomier layout without requiring a separate app.</span></li>
              <li><Laptop size={19} /><span><strong>Laptop & desktop</strong>Review link details and available options on a larger screen.</span></li>
            </ul>
          </div>
          <div className="rf-device-art" aria-label="Illustration of phone, tablet, and laptop layouts" role="img"><div className="rf-device rf-device-phone"><div className="rf-device-screen"><Smartphone size={21} /></div></div><div className="rf-device rf-device-tablet"><div className="rf-device-screen"><Tablet size={24} /></div></div><div className="rf-device rf-device-laptop"><div className="rf-device-screen"><Laptop size={25} /></div></div></div>
        </div>
      </section>

      <section className="rf-section rf-section-tint">
        <div className="rf-container">
          <div className="rf-section-heading"><span className="rf-eyebrow">Good to know</span><h2>Questions, answered plainly.</h2></div>
          <div className="rf-faq-list">
            {faqItems.slice(0, 4).map((item, index) => <details className="rf-faq-item" key={item.q}><summary className="rf-faq-question" data-testid={`summary-home-faq-${index}`}><span>{item.q}</span><span aria-hidden="true">+</span></summary><div className="rf-faq-answer">{item.a}</div></details>)}
          </div>
          <Link href="/faq" style={{ display: 'inline-flex', marginTop: 23, alignItems: 'center', gap: 8, color: 'hsl(213 66% 38%)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }} data-testid="link-more-faq">Explore all FAQs <ArrowRight size={15} /></Link>
        </div>
      </section>
      <section className="rf-section" style={{ paddingBlock: 48 }}>
        <div className="rf-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 25, flexWrap: 'wrap' }}>
          <div><span className="rf-eyebrow">Start with a link</span><h2 style={{ font: '700 25px var(--app-font-serif)', margin: '10px 0 0' }}>See the ReelFetch demo for yourself.</h2></div>
          <a href="#tool" className="rf-button rf-button-primary" data-testid="link-return-to-tool">Go to the link field <ArrowRight size={15} /></a>
        </div>
      </section>
    </>
  );
}
