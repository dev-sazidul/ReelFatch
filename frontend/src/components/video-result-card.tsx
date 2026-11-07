import { useEffect, useState } from 'react';
import { CircleAlert, Clock3, Download } from 'lucide-react';
import { DownloadStatus, type Notice } from '@/components/download-status';
import { QualitySelector } from '@/components/quality-selector';
import type { AuthorizedVideoProvider, AuthorizedVideoResult, VideoQualityOption } from '@/services/platform-integrations';

function formatDuration(seconds?: number) {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return null;
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

function formatSizes(formats: Array<{ width?: number; height?: number }>) {
  return formats
    .map((format) => [format.width, format.height].filter((value) => value !== undefined).join('×'))
    .filter(Boolean)
    .join(', ');
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
  const [downloadNotice, setDownloadNotice] = useState<Notice>({ kind: 'idle', text: '' });
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total?: number } | null>(null);
  const selectedQuality = availableQualities.find((quality) => quality.id === selectedQualityId);
  const duration = formatDuration(result.durationSeconds);

  useEffect(() => {
    const firstAvailable = result.qualities.find((quality) => quality.available);
    setSelectedQualityId(firstAvailable?.id ?? '');
    setDownloadNotice({ kind: 'idle', text: '' });
  }, [result]);

  const startDownload = async (quality: VideoQualityOption) => {
    if (!quality.available) {
      setDownloadNotice({ kind: 'warning', text: 'That quality is not available for this video. Choose one of the available options.' });
      return;
    }
    if (!provider.download) {
      setDownloadNotice({ kind: 'warning', text: 'A download action is not configured for this source yet.' });
      return;
    }
    setIsDownloading(true);
    setProgress(null);
    setDownloadNotice({ kind: 'loading', text: 'Starting the download…' });
    try {
      await provider.download?.(result.sourceReference, quality.id, (next) => {
        setProgress(next);
        const percent = next.total ? Math.min(100, Math.round((next.loaded / next.total) * 100)) : undefined;
        setDownloadNotice({ kind: 'loading', text: percent === undefined ? 'Downloading…' : `Downloading… ${percent}%` });
      });
      setDownloadNotice({ kind: 'success', text: 'The file was prepared and your browser was asked to save it.' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'The download could not be started. Please try again in a moment.';
      setDownloadNotice({ kind: 'error', text });
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
          {result.description && <p className="rf-result-description">{result.description}</p>}
          {result.reportedFormats && result.reportedFormats.length > 0 && (
            <p className="rf-result-note">Facebook reported {formatSizes(result.reportedFormats)}. Only a file URL returned for an allowed video can be downloaded.</p>
          )}
        </div>
      </div>
      <div className="rf-result-controls">
        {result.qualities.length ? (
          <>
            <QualitySelector
              legend="Available quality options"
              busy={isDownloading}
              selectedId={selectedQualityId}
              onSelect={(id) => {
                setSelectedQualityId(id);
                setDownloadNotice({ kind: 'idle', text: '' });
              }}
              options={result.qualities.map((quality) => ({
                id: quality.id,
                label: quality.label,
                available: quality.available,
                meta: formatFileSize(quality.fileSizeBytes) ?? undefined,
              }))}
            />
            <button
              type="button"
              className="rf-button rf-button-primary"
              disabled={!selectedQuality || !provider.download || isDownloading}
              onClick={() => selectedQuality && void startDownload(selectedQuality)}
            >
              <Download size={16} aria-hidden="true" /> {isDownloading ? 'Starting…' : 'Download'}
            </button>
          </>
        ) : (
          <p className="rf-status warning" role="status">No downloadable quality options were returned for this video.</p>
        )}
        {progress?.total ? (
          <progress className="rf-download-progress" value={progress.loaded} max={progress.total} aria-label="Download progress" />
        ) : progress ? (
          <progress className="rf-download-progress" aria-label="Download progress" />
        ) : null}
        <DownloadStatus notice={downloadNotice} id="download-status" />
      </div>
    </section>
  );
}
