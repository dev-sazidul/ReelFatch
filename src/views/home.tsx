import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { FaqAccordion } from '@/components/faq-accordion';
import { FeatureGrid } from '@/components/feature-grid';
import { HowItWorks } from '@/components/how-it-works';
import { InterfacePreview } from '@/components/interface-preview';
import { SupportedDevices } from '@/components/supported-devices';
import { VideoResultCard } from '@/components/video-result-card';
import { VideoUrlForm } from '@/components/video-url-form';
import { homeFaq } from '@/content/site';
import { useVideoLookup } from '@/hooks/use-video-lookup';

export function HeroSection() {
  const lookup = useVideoLookup();
  return (
    <section className="rf-hero" id="tool">
      <div className="rf-container rf-hero-inner">
        <p className="rf-eyebrow">Independent tool · Not a Meta product</p>
        <h1>Download Facebook Reels &amp; Videos Easily</h1>
        <p className="rf-lead">Paste a video link to check available download options in a simple, mobile-friendly interface.</p>
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
        <InterfacePreview />
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeatureGrid />
      <SupportedDevices />
      <section className="rf-section rf-section-tint" id="faq">
        <div className="rf-container">
          <div className="rf-section-heading">
            <span className="rf-eyebrow">FAQ</span>
            <h2>Questions, answered plainly.</h2>
          </div>
          <FaqAccordion items={homeFaq} defaultIndex={0} idPrefix="home-faq" />
          <Link href="/faq" className="rf-text-link" data-testid="link-more-faq">Read more questions <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </section>
      <section className="rf-section rf-closing">
        <div className="rf-container rf-closing-inner">
          <div>
            <p className="rf-eyebrow">Ready when you are</p>
            <h2>Paste a link to get started.</h2>
          </div>
          <a href="#tool" className="rf-button rf-button-primary" data-testid="link-return-to-tool">Get Started <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </section>
    </>
  );
}
