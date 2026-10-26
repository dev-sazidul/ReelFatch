import type { FormEvent } from 'react';
import { ArrowRight, Clipboard, LockKeyhole, X } from 'lucide-react';
import { DownloadStatus, type Notice } from '@/components/download-status';

type VideoUrlFormProps = {
  url: string;
  notice: Notice;
  isLoading: boolean;
  onUrlChange: (value: string) => void;
  onPaste: () => void;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function VideoUrlForm({ url, notice, isLoading, onUrlChange, onPaste, onClear, onSubmit }: VideoUrlFormProps) {
  const invalid = notice.kind === 'error';
  return (
    <form className="rf-tool-card" onSubmit={onSubmit} noValidate>
      <label className="rf-url-label" htmlFor="reel-url">Facebook video or Reel link</label>
      <div className="rf-input-wrap">
        <div className="rf-field">
          <input
            id="reel-url"
            className="rf-url-input"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your Facebook video or Reel link here"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            aria-invalid={invalid}
            aria-describedby="url-hint url-privacy"
            data-testid="input-video-url"
          />
          {url && (
            <button type="button" className="rf-clear" onClick={onClear} aria-label="Clear link" data-testid="button-clear-url">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <button type="button" className="rf-button rf-button-secondary" onClick={onPaste} data-testid="button-paste-url">
          <Clipboard size={16} aria-hidden="true" /> Paste
        </button>
        <button type="submit" className="rf-button rf-button-primary rf-find" disabled={isLoading} data-testid="button-check-url">
          {isLoading ? 'Checking…' : 'Find Video'}
          {!isLoading && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </div>
      <p className="rf-format-hint" id="url-hint">Watch, Reel, share, and fb.watch links are accepted. A file is offered only when a download URL is actually returned.</p>
      <p className="rf-privacy" id="url-privacy">
        <LockKeyhole size={14} aria-hidden="true" />
        The link is sent to your ReelFetch server. Facebook is contacted only when a Graph API token is configured.
      </p>
      <DownloadStatus notice={notice} />
    </form>
  );
}
