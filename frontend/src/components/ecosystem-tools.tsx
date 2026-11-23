import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Sparkles, RefreshCw, Image as ImageIcon, Cpu } from 'lucide-react';

export const ecosystemTools = [
  {
    name: 'BestConvert',
    url: 'https://bestconvert.site',
    title: 'Convert Downloaded Videos to MP3/GIF & Documents with BestConvert',
    shortTitle: 'Video, Audio & Document Converter',
    description: 'Transform downloaded video clips into crystal-clear MP3 audio, lightweight animated GIFs, WebM, and document formats with zero quality loss.',
    badge: 'Media Transcoding',
    icon: RefreshCw,
  },
  {
    name: 'ImageCustomize',
    url: 'https://imagecustomize.site',
    title: 'Resize, Compress & Customize Thumbnails and Images with ImageCustomize',
    shortTitle: 'Thumbnail & Image Optimizer',
    description: 'Crop, resize, enhance, and compress YouTube thumbnails, social covers, and visual assets to maximize click-through rate across all devices.',
    badge: 'Visual Design',
    icon: ImageIcon,
  },
  {
    name: 'FutureSolutionAI',
    url: 'https://futuresolutionai.com',
    title: 'Custom Web, SaaS & AI Solutions by FutureSolutionAI',
    shortTitle: 'AI & Custom Software Engineering',
    description: 'Powering high-performance digital tools, enterprise media workflows, artificial intelligence systems, and bespoke SaaS architectures.',
    badge: 'Parent Innovation Lab',
    icon: Cpu,
  },
];

export function FutureSolutionBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://futuresolutionai.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`rf-fsi-badge ${className}`}
      title="Visit FutureSolutionAI — Custom Web, SaaS & AI Solutions"
    >
      <span className="rf-fsi-dot" aria-hidden="true" />
      <span>A Product of <strong>FutureSolutionAI</strong></span>
      <ArrowUpRight size={13} strokeWidth={2.5} className="rf-fsi-arrow" aria-hidden="true" />
    </a>
  );
}

export function EcosystemSection() {
  return (
    <section className="rf-section rf-ecosystem-section" id="ecosystem">
      <div className="rf-container">
        <div className="rf-section-heading">
          <span className="rf-eyebrow">Our Free Ecosystem Tools</span>
          <h2>Integrated Creator &amp; Media Utilities</h2>
          <p className="rf-lead" style={{ margin: '8px auto 0' }}>
            Part of the FutureSolutionAI productivity network. Enhance your video workflow with our free sister tools built for speed, format conversion, and visual optimization.
          </p>
        </div>

        <div className="rf-ecosystem-grid">
          {ecosystemTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rf-ecosystem-card"
                data-testid={`link-ecosystem-${tool.name.toLowerCase()}`}
              >
                <div className="rf-ecosystem-card-top">
                  <span className="rf-ecosystem-icon">
                    <IconComponent size={20} strokeWidth={2.2} />
                  </span>
                  <span className="rf-ecosystem-badge">{tool.badge}</span>
                </div>
                <h3 className="rf-ecosystem-card-title">{tool.title}</h3>
                <p className="rf-ecosystem-card-desc">{tool.description}</p>
                <div className="rf-ecosystem-card-footer">
                  <span className="rf-ecosystem-visit">
                    Visit {tool.name} <ArrowUpRight size={14} />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FooterEcosystem() {
  return (
    <div className="rf-footer-ecosystem">
      <div className="rf-footer-ecosystem-header">
        <div>
          <span className="rf-eyebrow" style={{ fontSize: 10 }}>Connected Tools</span>
          <h4 className="rf-footer-ecosystem-title">Our Free Ecosystem Tools</h4>
        </div>
        <FutureSolutionBadge />
      </div>
      <div className="rf-footer-ecosystem-grid">
        {ecosystemTools.map((tool) => (
          <a
            key={tool.name}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rf-footer-tool-link"
            title={tool.title}
          >
            <div className="rf-footer-tool-text">
              <strong>{tool.name}</strong>
              <span>{tool.shortTitle}</span>
            </div>
            <ArrowUpRight size={14} className="rf-footer-tool-arrow" />
          </a>
        ))}
      </div>
    </div>
  );
}

