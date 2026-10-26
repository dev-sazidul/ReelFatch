import { useEffect, useState } from 'react';
import { Check, CircleAlert, Clock3, Download } from 'lucide-react';
import type { AuthorizedVideoProvider, AuthorizedVideoResult, VideoQualityOption } from '@/services/platform-integrations';

function formatDuration(seconds?: number) {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return null;
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

function formatFileSize(bytes?: number) {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return null;
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

export function VideoResultCard({
  result,
  provider,
}: {
  result: AuthorizedVideoResult;
  provider: AuthorizedVideoProvider;
}) {
  const availableQualities = result.qualities.filter((quality) => quality.available);
  const [selectedQualityId, setSelectedQualityId] = useState(availableQualities[0]?.id ?? '');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const selectedQuality = availableQualities.find((quality) => quality.id === selectedQualityId);
  const duration = formatDuration(result.durationSeconds);

  useEffect(() => {
    setSelectedQualityId(availableQualities[0]?.id ?? '');
    setDownloadStatus('');
  }, [result]);

  const startDownload = async (quality: VideoQualityOption) => {
    if (!provider.download) {
      setDownloadStatus('A download action is not configured for this source yet.');
      return;
    }
    setIsDownloading(true);
    setDownloadStatus('Starting the authorized download…');
    try {
      await provider.download(result.sourceReference, quality.id);
      setDownloadStatus('The download request was handed to the connected service.');
    } catch {
      setDownloadStatus('The download could not be started. Please retry in a moment.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="rf-result rf-real-result" aria-labelledby="real-result-heading">
      <div className="rf-result-head">
        <span className="rf-result-source-tag">Authorized source result</span>
        <span className="rf-real-result-status">Video details returned by the connected service</span>
      </div>
      <div className="rf-result-content">
        {result.thumbnailUrl ? (
          <img
            className="rf-real-thumbnail"
            src={result.thumbnailUrl}
            alt={result.title ? `Thumbnail for ${result.title}` : 'Video thumbnail'}
            width="168"
            height="111"
            loading="lazy"
          />
        ) : (
          <div className="rf-thumb rf-real-thumbnail-empty" role="img" aria-label="No thumbnail was provided by the source">
            <CircleAlert size={20} />
          </div>
        )}
        <div>
          <h3 className="rf-result-title" id="real-result-heading">{result.title || 'Video details'}</h3>
          <div className="rf-result-meta">
            {duration && <span><Clock3 size={12} /> {duration}</span>}
            <span>{result.sourceLabel}</span>
          </div>
        </div>
      </div>
      <div className="rf-real-result-controls">
        <span className="rf-quality-label">Available quality options</span>
        {availableQualities.length ? (
          <>
            <div className="rf-quality-list" role="group" aria-label="Available video qualities">
              {result.qualities.map((quality) => (
                <button
                  type="button"
                  key={quality.id}
                  className="rf-quality"
                  aria-pressed={selectedQualityId === quality.id}
                  disabled={!quality.available}
                  onClick={() => {
                    setSelectedQualityId(quality.id);
                    setDownloadStatus('');
                  }}
                >
                  {selectedQualityId === quality.id && <Check size={12} aria-hidden="true" />}
                  {quality.label}
                  {formatFileSize(quality.fileSizeBytes) && <small>{formatFileSize(quality.fileSizeBytes)}</small>}
                  {!quality.available && <small>Unavailable</small>}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rf-button rf-button-primary rf-demo-download"
              disabled={!selectedQuality || !provider.download || isDownloading}
              onClick={() => selectedQuality && void startDownload(selectedQuality)}
            >
              <Download size={15} /> {isDownloading ? 'Starting…' : 'Download selected quality'}
            </button>
          </>
        ) : (
          <p className="rf-status warning" role="status">No downloadable quality options were returned for this video.</p>
        )}
        {downloadStatus && <p className="rf-download-status" role="status" aria-live="polite">{downloadStatus}</p>}
      </div>
    </section>
  );
}
