import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check, CircleAlert, Clipboard, FileCheck2, Laptop, LoaderCircle, LockKeyhole, Play, Smartphone, Tablet, WandSparkles } from 'lucide-react';
import { DemoResult, DemoDisclaimer } from '@/components/demo-result';
import { demoStatusChoices, type DemoStatusId } from '@/data/demo';
import { detectPlatformUrl, getPlatformStatus, platformRegistry } from '@/data/platforms';
import { AdPlaceholder } from '@/components/ad-placeholder';
import { DetectedPlatform, PlatformGrid } from '@/components/platform-list';
import { VideoResultCard } from '@/components/video-result-card';
import { getAuthorizedVideoProvider, type AuthorizedVideoProvider, type AuthorizedVideoResult } from '@/services/platform-integrations';

type UiState = { kind: 'idle' | 'error' | 'info' | 'warning' | 'loading'; text: string };

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
  { q: 'Why is a video link not working?', a: 'Check that the full URL begins with https:// or http:// and uses a platform format listed below. A recognized format does not guarantee that a video can be accessed.' },
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
  const [realResult, setRealResult] = useState<AuthorizedVideoResult | null>(null);
  const [realProvider, setRealProvider] = useState<AuthorizedVideoProvider | null>(null);
  const detection = detectPlatformUrl(url);
  const isAnyPlatformAvailable = platformRegistry.some(({ id }) => getPlatformStatus(id) === 'Available');

  const clearResults = () => {
    setDemoVisible(false);
    setRealResult(null);
    setRealProvider(null);
  };

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
      clearResults();
      setState({ kind: 'info', text: 'Link pasted. Check the URL before continuing.' });
      document.getElementById('reel-url')?.focus();
    } catch {
      setState({ kind: 'warning', text: 'Clipboard permission was not granted. Paste your link into the field manually.' });
      document.getElementById('reel-url')?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (detection.kind === 'empty' || detection.kind === 'invalid') {
      setState({ kind: 'error', text: 'Enter a complete web address beginning with https:// or http://.' });
      clearResults();
      return;
    }
    if (detection.kind === 'unsupported') {
      setState({ kind: 'error', text: 'That URL format is not recognized yet. Check the link or choose a platform in the directory below.' });
      clearResults();
      return;
    }
    clearResults();
    const platform = detection.platform;
    const status = getPlatformStatus(platform.id);
    const provider = getAuthorizedVideoProvider(platform.id);
    if (status !== 'Available' || !provider) {
      setState({ kind: 'info', text: `${platform.name} link format detected. Its video service is not connected, so no lookup or quality check was made.` });
      return;
    }

    setState({ kind: 'loading', text: `Checking this ${platform.name} link with the connected authorized service…` });
    try {
      const result = await provider.lookup(url.trim());
      setRealProvider(provider);
      setRealResult(result);
      setState(result.qualities.some((item) => item.available)
        ? { kind: 'info', text: 'Video details were returned by the connected authorized service.' }
        : { kind: 'warning', text: 'The service did not return any available downloadable quality options for this video.' });
    } catch {
      setState({ kind: 'error', text: 'We couldn’t check this link right now. Please verify the address and try again.' });
    }
  };

  const runDemo = () => {
    if (detection.kind === 'empty') {
      setState({ kind: 'error', text: 'Add a link first so the demo can show where a preview would appear.' });
      return;
    }
    if (detection.kind === 'invalid') {
      setState({ kind: 'error', text: 'Invalid URL format. Enter a complete web address to continue.' });
      clearResults();
      return;
    }
    if (detection.kind === 'unsupported') {
      setState({ kind: 'error', text: 'Unsupported URL. Try a link from one of the platforms in the directory.' });
      clearResults();
      return;
    }
    if (detection.platform.id !== 'facebook') {
      setState({ kind: 'info', text: 'Platform detected. The illustrative result is Facebook-only; no sample video data is provided for this platform.' });
      clearResults();
      return;
    }
    setState({ kind: 'info', text: 'Illustrative preview shown below. These details are sample data, not a result for your link.' });
    setRealResult(null);
    setRealProvider(null);
    setDemoVisible(true);
  };

  const handleDemoStatus = (status: DemoStatusId) => {
    const message: Record<DemoStatusId, UiState> = {
      loading: { kind: 'loading', text: 'Loading (demo state). No request is running; this state is shown for interface preview only.' },
      invalid: { kind: 'error', text: 'Invalid URL. Check for a complete web address, including https://.' },
      unsupported: { kind: 'error', text: 'Unsupported URL. Try a URL from one of the platforms in the directory.' },
      'empty-source': { kind: 'warning', text: 'No downloadable source is available in this demonstration. You can try another link when a service is connected.' },
      'quality-unavailable': { kind: 'warning', text: 'The selected quality is unavailable in this sample. Choose one of the available illustrative options.' },
      'network-error': { kind: 'error', text: 'Network error (demo state). No request was sent. Check your connection or try again later when a service is available.' },
      starting: { kind: 'warning', text: 'Download starting is a demo-only state. No file is being created or transferred.' },
      failed: { kind: 'error', text: 'Download failed (demo state). No download was attempted. Retry is unavailable until a real service is connected.' },
    };
    setRealResult(null);
    setRealProvider(null);
    setState(message[status]);
  };

  const handleDemoDownload = () => setState({ kind: 'warning', text: 'Downloads are unavailable in this demo. No file was created, opened, or downloaded.' });

  return (
    <>
      <section className="rf-hero" id="tool">
        <div className="rf-container rf-hero-inner">
          <span className="rf-eyebrow">A clearer way to handle a link</span>
          <h1>Bring a link.<br /><em>Know what’s next.</em></h1>
          <p className="rf-lead">Paste a video link from a listed platform to see how ReelFetch identifies its URL format. Straightforward guidance, clear status, and no guesswork.</p>
          <form className="rf-tool-card" onSubmit={handleSubmit} noValidate>
            <label className="rf-url-label" htmlFor="reel-url">Video link</label>
            <div className="rf-input-wrap">
              <input id="reel-url" className="rf-url-input" type="url" inputMode="url" autoComplete="url" placeholder="Paste a video link here" value={url} onChange={(event) => { setUrl(event.target.value); if (state.kind !== 'idle') setState({ kind: 'idle', text: '' }); clearResults(); }} aria-describedby="url-hint" data-testid="input-video-url" />
              {url && <button type="button" className="rf-button rf-button-quiet" onClick={() => { setUrl(''); setState({ kind: 'idle', text: '' }); clearResults(); }} aria-label="Clear video link" data-testid="button-clear-url">Clear</button>}
              <button type="button" className="rf-button rf-button-secondary rf-paste" onClick={handlePaste} data-testid="button-paste-url"><Clipboard size={15} /> Paste</button>
              <button type="submit" className="rf-button rf-button-primary" disabled={state.kind === 'loading'} data-testid="button-check-url">{state.kind === 'loading' ? 'Checking…' : 'Find video'} <ArrowRight size={15} /></button>
            </div>
            <div className="rf-helper-row" id="url-hint">
              <span><CircleAlert size={13} /> Recognizes listed platform URL formats; detection does not mean downloads are available</span>
              <span><LockKeyhole size={13} /> No sign-in required</span>
            </div>
            {detection.kind === 'recognized' && <DetectedPlatform name={detection.platform.name} Icon={detection.platform.Icon} status={getPlatformStatus(detection.platform.id)} />}
            <StatusMessage state={state} />
            <div className="rf-form-actions">
              <button type="button" className="rf-button rf-button-secondary" onClick={runDemo} data-testid="button-show-demo"><Play size={14} /> Show Facebook demo preview</button>
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
          <DemoDisclaimer anyPlatformAvailable={isAnyPlatformAvailable} />
          <div className="rf-trust"><span><LockKeyhole size={13} /> {isAnyPlatformAvailable ? 'Service handling varies by platform' : 'No link is sent to a service'}</span><span><Check size={13} /> No account needed</span><span><FileCheck2 size={13} /> Permission matters</span></div>
          {demoVisible && <DemoResult selectedQuality={quality} onQualityChange={(nextQuality) => {
            setQuality(nextQuality);
            if (nextQuality === '1080') setState({ kind: 'warning', text: 'Selected quality unavailable (demo). Choose an available illustrative option.' });
          }} onDemoDownload={handleDemoDownload} />}
          {realResult && realProvider && <VideoResultCard result={realResult} provider={realProvider} />}
          {(demoVisible || realResult) && <AdPlaceholder placement="belowVideoResults" />}
          {!demoVisible && !realResult && <div style={{ maxWidth: 710, margin: '24px auto 0', color: 'hsl(216 13% 53%)', fontSize: 12 }} data-testid="text-empty-state">No video lookup runs until an authorized platform service is available. The Facebook sample preview is separate from any real link.</div>}
        </div>
      </section>

      <AdPlaceholder placement="betweenSections" />
      <PlatformGrid />

      <section className="rf-section" id="how-it-works">
        <div className="rf-container">
          <div className="rf-section-heading"><span className="rf-eyebrow">Three simple steps</span><h2>Clear from the first paste.</h2><p>The intended experience is uncomplicated. At present, this interface demonstrates the flow without processing a real link.</p></div>
          <div className="rf-steps">
            {[['01', 'Add a link', 'Paste a link from a listed platform. ReelFetch identifies the URL format in your browser.'], ['02', 'Review the details', 'When an authorized service is connected, only details and options it returns can be shown.'], ['03', 'Choose what works', 'Select an available option if the connected source provides one.']].map(([number, title, body]) => <article className="rf-step" key={number}><span className="rf-step-number">{number} / STEP</span><h3>{title}</h3><p>{body}</p></article>)}
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
