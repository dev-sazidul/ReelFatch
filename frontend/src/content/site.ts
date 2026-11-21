import { ClipboardPaste, Download, Laptop, Link2, ListVideo, LockKeyhole, Monitor, Smartphone, Tablet, Timer, type LucideIcon } from 'lucide-react';

export type FaqItem = { question: string; answer: string };

export const homeFaq: FaqItem[] = [
  {
    question: 'How do I download a public YouTube, Instagram, TikTok, or Facebook video?',
    answer: 'Copy the public video, Reel, or Short link, paste it into the field on this page, and choose Find Video. Then download a quality that is actually listed.',
  },
  {
    question: 'Which platforms can ReelFetch check?',
    answer: 'ReelFetch has pages for public videos on YouTube, Instagram, TikTok, Facebook, X, Reddit, and Pinterest. A link on another site may still be checked, but only a returned video file can be saved.',
  },
  {
    question: 'Does ReelFetch charge a fee?',
    answer: 'The downloader does not ask you to create an account or pay to check a link. Source sites can still limit which videos and qualities are available.',
  },
  {
    question: 'What video quality and format will I get?',
    answer: 'You get a format the source provides for that link, often MP4. Full HD is included only when that video offers it. Missing qualities cannot be created.',
  },
  {
    question: 'Where are downloaded files saved on my device?',
    answer: 'Files are saved directly to your default browser downloads folder. On mobile devices (iOS and Android), files are stored in your device’s Files or Downloads app.',
  },
  {
    question: 'Can I download private or restricted videos?',
    answer: 'No. ReelFetch does not log into source platforms. Private accounts, deleted posts, and region-blocked videos are not downloaded.',
  },
];

export const moreFaq: FaqItem[] = [
  {
    question: 'Do I need to install any apps or browser extensions?',
    answer: 'No. ReelFetch operates completely within your web browser on mobile phones, tablets, and desktop computers. No third-party software is needed.',
  },
  {
    question: 'Does ReelFetch store copies of downloaded videos?',
    answer: 'ReelFetch does not keep a personal media library. Temporary files used to prepare a download are discarded after the transfer.',
  },
  {
    question: 'Why did my video link return an error?',
    answer: 'Check that the URL is complete and begins with https:// or http://. Videos that are private, deleted, or geo-restricted by the platform cannot be retrieved.',
  },
  {
    question: 'What should I know about copyright and fair use?',
    answer: 'Please only download content you own, have created, or have permission to save for offline personal viewing. Always respect creator rights and platform guidelines.',
  },
];

export const steps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: 'Copy the video link', text: 'Copy the public URL of a video, Reel, or Short from YouTube, Instagram, TikTok, Facebook, X, Reddit, or Pinterest.' },
  { icon: ClipboardPaste, title: 'Paste and find video', text: 'Paste the link into the box above and choose Find Video to see the qualities that source returns.' },
  { icon: Download, title: 'Save a listed file', text: 'Choose one of the listed qualities and download it. A quality that is not listed is not available.' },
];

export const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: 'Named platform pages', text: 'Open a guide for YouTube, Instagram, TikTok, Facebook, X, Reddit, or Pinterest, then check a public link.' },
  { icon: Smartphone, title: 'Mobile & desktop optimized', text: 'Clean, responsive design engineered for seamless use on iPhone, Android, tablets, and computers.' },
  { icon: ListVideo, title: 'Only real qualities', text: 'The result lists formats the source returns. Audio is included when that source provides it with the video.' },
  { icon: Timer, title: 'Lookup on demand', text: 'A link is checked when you submit it. How long that takes depends on the source site and your connection.' },
  { icon: Monitor, title: 'Zero installation needed', text: 'Runs 100% online in your favorite browser. No software, app downloads, or browser extensions required.' },
  { icon: LockKeyhole, title: 'No account required', text: 'You can check a link without registering. Temporary files are removed after transfer. Analytics and ads are described in the privacy policy.' },
];

export const devices: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Smartphone, title: 'Android phones', text: 'Use a current mobile browser. Downloads usually appear in the browser’s download list.' },
  { icon: Smartphone, title: 'iPhone', text: 'Safari and other mobile browsers can open the page. Saving behavior follows that browser.' },
  { icon: Tablet, title: 'Tablets', text: 'The same flow uses a wider layout, with no separate app to install.' },
  { icon: Laptop, title: 'Desktop browsers', text: 'Review the link and quality options on a laptop or desktop screen.' },
];
