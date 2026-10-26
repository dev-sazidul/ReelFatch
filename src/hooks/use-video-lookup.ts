import { useState, type FormEvent } from 'react';
import { detectPlatformUrl } from '@/data/platforms';
import type { Notice } from '@/components/download-status';
import { classifyFacebookLink, facebookLinkLabel } from '@/services/facebook-link';
import { reportLookup } from '@/services/lookup-log';
import {
  getAuthorizedVideoProvider,
  VideoLookupError,
  type AuthorizedVideoProvider,
  type AuthorizedVideoResult,
} from '@/services/platform-integrations';

const idle: Notice = { kind: 'idle', text: '' };

function noticeKind(code?: string): Notice['kind'] {
  if (code === 'PROVIDER_NOT_CONFIGURED' || code === 'LINK_ID_UNAVAILABLE' || code === 'LOGIN_REQUIRED' || code === 'VIDEO_NOT_AVAILABLE' || code === 'VIDEO_NOT_PERMITTED' || code === 'VIDEO_NOT_FOUND') {
    return 'warning';
  }
  return 'error';
}

export function useVideoLookup() {
  const [url, setUrl] = useState('');
  const [notice, setNotice] = useState<Notice>(idle);
  const [result, setResult] = useState<AuthorizedVideoResult | null>(null);
  const [provider, setProvider] = useState<AuthorizedVideoProvider | null>(null);

  const clearResult = () => {
    setResult(null);
    setProvider(null);
  };

  const updateUrl = (value: string) => {
    setUrl(value);
    setNotice(idle);
    clearResult();
  };

  const clearUrl = () => updateUrl('');

  const pasteUrl = async () => {
    const field = document.getElementById('reel-url');
    if (!navigator.clipboard?.readText) {
      setNotice({ kind: 'warning', text: 'Clipboard access is not available in this browser. Paste the link into the field instead.' });
      field?.focus();
      return;
    }
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        setNotice({ kind: 'warning', text: 'Your clipboard is empty. Copy a Facebook link, then try Paste again.' });
        return;
      }
      setUrl(text);
      setNotice({ kind: 'info', text: 'Link pasted. Choose Find Video when you are ready.' });
      clearResult();
      field?.focus();
    } catch {
      setNotice({ kind: 'warning', text: 'Clipboard permission was not granted. Paste the link into the field instead.' });
      field?.focus();
    }
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const submittedUrl = url.trim();
    const detection = detectPlatformUrl(submittedUrl);
    clearResult();

    if (detection.kind === 'empty') {
      const detail = 'The link field was empty. No request was sent.';
      await reportLookup({ outcome: 'empty', detail });
      setNotice({ kind: 'error', text: 'Paste a Facebook video or Reel link to continue.' });
      return;
    }
    if (detection.kind === 'invalid') {
      const detail = 'The text is not an http or https URL. No request was sent.';
      await reportLookup({ outcome: 'invalid', url: submittedUrl, detail });
      setNotice({ kind: 'error', text: 'Enter a complete link beginning with https:// or http://.' });
      return;
    }
    if (detection.kind === 'unsupported' || detection.platform.id !== 'facebook') {
      const detail = 'The host is not a facebook.com or fb.watch address. No request was sent.';
      await reportLookup({ outcome: 'unsupported', url: submittedUrl, detail });
      setNotice({ kind: 'error', text: 'That link is not a supported Facebook video or Reel address. Use a facebook.com or fb.watch link.' });
      return;
    }

    const linkType = classifyFacebookLink(submittedUrl);
    const linkLabel = facebookLinkLabel(linkType);
    if (linkType === 'other') {
      const detail = 'The Facebook address was recognized, but the path is not a Reel, Watch, or share link. No request was sent.';
      await reportLookup({ outcome: 'unsupported', url: submittedUrl, linkType: linkLabel, detail });
      setNotice({ kind: 'error', text: 'That Facebook link does not look like a Reel, Watch, or share video. Paste the video share link instead.' });
      return;
    }

    const connected = getAuthorizedVideoProvider(detection.platform.id);
    if (!connected) {
      const detail = `${linkLabel} recognized. No authorized download service is registered, so availability and privacy were not checked.`;
      await reportLookup({ outcome: 'no-provider', url: submittedUrl, linkType: linkLabel, detail });
      setNotice({
        kind: 'warning',
        text: `This ${linkLabel} was recognized, but no download service is connected. The video was not checked.`,
      });
      return;
    }

    setNotice({ kind: 'loading', text: 'Checking this link for available download options…' });
    try {
      const next = await connected.lookup(submittedUrl);
      setProvider(connected);
      setResult(next);
      const hasDownload = next.qualities.some((item) => item.available);
      await reportLookup({
        outcome: hasDownload ? 'lookup-ok' : 'lookup-empty',
        url: submittedUrl,
        linkType: linkLabel,
        detail: hasDownload
          ? `The connected service returned ${next.qualities.filter((item) => item.available).length} available quality option(s).`
          : 'The connected service returned no downloadable quality. The video may be private, removed, or restricted.',
      });
      setNotice(
        hasDownload
          ? { kind: 'success', text: 'Video details are ready. Choose an available quality to download.' }
          : { kind: 'warning', text: "We couldn't find a downloadable video source. The video may be private, removed, or restricted." },
      );
    } catch (error) {
      const status = error instanceof VideoLookupError ? error.status : undefined;
      const responseSummary = error instanceof VideoLookupError ? error.responseSummary : undefined;
      const detail = error instanceof Error ? error.message : 'The connected service failed without a message.';
      const code = error instanceof VideoLookupError ? error.code : undefined;
      await reportLookup({
        outcome: 'lookup-failed',
        url: submittedUrl,
        linkType: linkLabel,
        detail,
        httpStatus: status,
        responseSummary: responseSummary ?? code,
      });
      setNotice({ kind: noticeKind(code), text: detail });
    }
  };

  return {
    url,
    notice,
    result,
    provider,
    isLoading: notice.kind === 'loading',
    updateUrl,
    clearUrl,
    pasteUrl,
    submit,
  };
}
