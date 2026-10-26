import { Check, CircleAlert, Clock3, Download, Play, Sparkles } from 'lucide-react';
import { illustrativeReel } from '@/data/demo';

type Props = { selectedQuality: string; onQualityChange: (quality: string) => void; onDemoDownload: () => void };

export function DemoResult({ selectedQuality, onQualityChange, onDemoDownload }: Props) {
  return (
    <section className="rf-result" aria-labelledby="demo-result-heading" data-testid="panel-demo-result">
      <div className="rf-result-head">
        <span className="rf-demo-tag">Illustrative demo data</span>
        <span style={{ color: 'hsl(216 13% 49%)', fontSize: 10 }}>No video was looked up</span>
      </div>
      <div className="rf-result-content">
        <div className="rf-thumb" role="img" aria-label={illustrativeReel.thumbnailLabel}>
          <div className="rf-thumb-icon"><Play size={17} fill="currentColor" /></div>
          <span style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 1, fontSize: 10, background: 'hsl(220 37% 18% / .72)', color: 'white', borderRadius: 4, padding: '3px 5px' }}>{illustrativeReel.duration}</span>
        </div>
        <div>
          <h3 className="rf-result-title" id="demo-result-heading">{illustrativeReel.title}</h3>
          <div className="rf-result-meta"><span><Clock3 size={12} /> {illustrativeReel.duration}</span><span>{illustrativeReel.source}</span><span>{illustrativeReel.fileSize}</span></div>
          <p className="rf-result-description">This sample card demonstrates how source details could appear. It is not a real video, lookup, or downloadable file.</p>
        </div>
      </div>
      <div style={{ padding: '0 18px 18px' }}>
        <span className="rf-quality-label">Sample quality options</span>
        <div className="rf-quality-list" role="group" aria-label="Illustrative quality options">
          {illustrativeReel.qualities.map((quality) => (
              <button type="button" key={quality.id} className="rf-quality" aria-pressed={selectedQuality === quality.id} aria-label={`${quality.label}, ${quality.detail}${quality.available ? '' : ', unavailable'}`} disabled={!quality.available} onClick={() => onQualityChange(quality.id)} data-testid={`button-quality-${quality.id}`}>
              {selectedQuality === quality.id && <Check size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />}{quality.label}{!quality.available && <span style={{ display: 'block', fontSize: 9, fontWeight: 500, color: 'hsl(216 13% 49%)' }}>Unavailable</span>}
            </button>
          ))}
        </div>
        <button type="button" className="rf-button rf-button-primary rf-demo-download" onClick={onDemoDownload} data-testid="button-demo-download"><Download size={15} /> Try demo action</button>
        <p style={{ color: 'hsl(216 13% 49%)', fontSize: 10, margin: '8px 0 0', lineHeight: 1.5 }}><CircleAlert size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Demo action never downloads a file.</p>
      </div>
    </section>
  );
}

export function DemoDisclaimer({ anyPlatformAvailable = false }: { anyPlatformAvailable?: boolean }) {
  return (
    <div className="rf-disclosure">
      <Sparkles size={16} style={{ flex: '0 0 auto', marginTop: 1 }} />
      <span>
        {anyPlatformAvailable
          ? <><strong>Platform availability varies.</strong> Only platforms marked Available use a connected authorized service. The Facebook preview below remains illustrative sample data.</>
          : <><strong>Demo mode — no backend is connected.</strong> ReelFetch does not check links, retrieve video details, or provide downloads yet. The preview below uses separate illustrative sample data.</>}
      </span>
    </div>
  );
}
