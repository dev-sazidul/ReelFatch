import type { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

export type NoticeKind = 'idle' | 'info' | 'error' | 'warning' | 'loading' | 'success';

export type Notice = {
  kind: NoticeKind;
  text: string;
};

export function DownloadStatus({ notice, id = 'url-status' }: { notice: Notice; id?: string }) {
  if (notice.kind === 'idle' || !notice.text) return null;
  return (
    <div className={`rf-status ${notice.kind}`} id={id} role="status" aria-live="polite">
      {notice.kind === 'loading' && <LoaderCircle className="rf-spinner" size={16} aria-hidden="true" />}
      <span>{notice.text}</span>
    </div>
  );
}

export function StatusActions({ children }: { children: ReactNode }) {
  return <div className="rf-recovery">{children}</div>;
}
