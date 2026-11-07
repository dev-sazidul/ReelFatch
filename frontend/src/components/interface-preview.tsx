import { useState } from 'react';
import { CircleAlert, Download, Play } from 'lucide-react';
import { illustrativeReel } from '@/data/demo';
import { DownloadStatus, type Notice } from '@/components/download-status';
import { QualitySelector } from '@/components/quality-selector';

const previewNotices: Record<string, Notice> = {
  empty: { kind: 'error', text: 'Paste a Facebook video or Reel link to continue.' },
  invalid: { kind: 'error', text: 'Enter a complete link beginning with https:// or http://.' },
  unsupported: { kind: 'error', text: 'That link is not a supported Facebook video or Reel address. Use a facebook.com or fb.watch link.' },
  loading: { kind: 'loading', text: 'Checking this link for available download options…' },
  found: { kind: 'success', text: 'Sample layout only. These details were not returned for a real link.' },
  'empty-source': { kind: 'warning', text: "We couldn't find a downloadable video source. Please check the link or try another supported video." },
  'quality-unavailable': { kind: 'warning', text: 'That quality is not available for this video. Choose one of the available options.' },
  'network-error': { kind: 'error', text: "We couldn't check this link right now. Please check your connection and try again." },
  starting: { kind: 'loading', text: 'Preparing the download… This preview does not transfer a file.' },
  failed: { kind: 'error', text: 'The download could not be started. Please try again in a moment.' },
};

export function InterfacePreview() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('720');
  const [notice, setNotice] = useState<Notice>({ kind: 'idle', text: '' });
  const busy = notice.kind === 'loading' && (notice.text.includes('Preparing') || notice.text.includes('Checking'));

  return (
    <section className="rf-preview" aria-labelledby="preview-heading">
      <div className="rf-preview-intro">
        <div>
          <h2 id="preview-heading">Sample result layout</h2>
          <p>Preview the card and status messages with labeled demo data. Find Video does not use this sample.</p>
        </div>
        <button type="button" className="rf-button rf-button-secondary" aria-expanded={open} aria-controls="sample-result" onClick={() => setOpen((value) => !value)} data-testid="button-show-demo">
          <Play size={15} aria-hidden="true" /> {open ? 'Hide sample layout' : 'Preview sample layout'}
        </button>
      </div>
      {open && (
        <div id="sample-result">
          <label className="rf-preview-label" htmlFor="demo-status">Preview a status</label>
          <select
            id="demo-status"
            defaultValue=""
            onChange={(event) => {
              const next = previewNotices[event.target.value];
              if (next) setNotice(next);
            }}
            data-testid="select-demo-status"
          >
            <option value="" disabled>Choose a state</option>
            <option value="empty">Empty input</option>
            <option value="invalid">Invalid URL</option>
            <option value="unsupported">Unsupported URL</option>
            <option value="loading">Loading</option>
            <option value="found">Video found (sample)</option>
            <option value="empty-source">No downloadable source</option>
            <option value="quality-unavailable">Selected quality unavailable</option>
            <option value="network-error">Network error</option>
            <option value="starting">Download starting</option>
            <option value="failed">Download failure</option>
          </select>
          <DownloadStatus notice={notice} id="preview-status" />
          <article className="rf-result" aria-labelledby="demo-result-heading" data-testid="panel-demo-result">
            <div className="rf-result-head">
              <span className="rf-demo-tag">Demo data</span>
              <span>Not a result for your link</span>
            </div>
            <div className="rf-result-content">
              <div className="rf-thumb" role="img" aria-label={illustrativeReel.thumbnailLabel}>
                <div className="rf-thumb-icon"><Play size={18} fill="currentColor" aria-hidden="true" /></div>
                <span className="rf-thumb-time">{illustrativeReel.duration}</span>
              </div>
              <div>
                <h3 className="rf-result-title" id="demo-result-heading">{illustrativeReel.title}</h3>
                <p className="rf-result-meta">
                  <span>{illustrativeReel.duration}</span>
                  <span>{illustrativeReel.source}</span>
                </p>
                <p className="rf-result-description">{illustrativeReel.note}</p>
              </div>
            </div>
            <div className="rf-result-controls">
              <QualitySelector
                legend="Sample quality options"
                options={illustrativeReel.qualities.map((item) => ({ id: item.id, label: item.label, meta: item.detail, available: item.available }))}
                selectedId={selectedId}
                busy={busy}
                onSelect={setSelectedId}
              />
              <button
                type="button"
                className="rf-button rf-button-primary"
                onClick={() => setNotice({ kind: 'warning', text: 'Downloads are unavailable in this preview. No file was created.' })}
                data-testid="button-demo-download"
              >
                <Download size={16} aria-hidden="true" /> Download
              </button>
              <p className="rf-result-note"><CircleAlert size={14} aria-hidden="true" /> This sample action never downloads a file.</p>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
