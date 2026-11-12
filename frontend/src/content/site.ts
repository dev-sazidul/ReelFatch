import { ClipboardPaste, Download, Laptop, Link2, ListVideo, LockKeyhole, Monitor, Smartphone, Tablet, Timer, type LucideIcon } from 'lucide-react';

export type FaqItem = { question: string; answer: string };

export const homeFaq: FaqItem[] = [
  {
    question: 'How do I download videos from YouTube, Instagram, TikTok, or Facebook?',
    answer: 'Copy the video, Reel, or Short link from your app or browser, paste it into the field above, and click Find Video. Select your preferred resolution and click Download to save the file directly to your device.',
  },
  {
    question: 'Which platforms and websites are supported?',
    answer: 'ReelFetch supports all major platforms including YouTube (Videos, Shorts), Instagram (Reels, Posts), TikTok (Videos, Clips), Facebook (Reels, Watch, Videos), X/Twitter, Reddit, Pinterest, and over 1,000+ web video sites.',
  },
  {
    question: 'Is ReelFetch free and unlimited?',
    answer: 'Yes. ReelFetch is 100% free with unlimited downloads. There are no paywalls, hidden fees, subscriptions, or account registrations required.',
  },
  {
    question: 'What video quality and format will I get?',
    answer: 'ReelFetch delivers the highest available quality from the source platform, including Full HD 1080p, 720p, and original formats in standard MP4 format with audio merged.',
  },
  {
    question: 'Where are downloaded files saved on my device?',
    answer: 'Files are saved directly to your default browser downloads folder. On mobile devices (iOS and Android), files are stored in your device’s Files or Downloads app.',
  },
  {
    question: 'Can I download private or restricted videos?',
    answer: 'No. To respect platform policies and user privacy, ReelFetch only downloads publicly available videos. Private accounts or login-protected videos cannot be downloaded.',
  },
];

export const moreFaq: FaqItem[] = [
  {
    question: 'Do I need to install any apps or browser extensions?',
    answer: 'No. ReelFetch operates completely within your web browser on mobile phones, tablets, and desktop computers. No third-party software is needed.',
  },
  {
    question: 'Does ReelFetch store copies of downloaded videos?',
    answer: 'No. ReelFetch processes video streams in real-time and discards temporary files immediately after download completion. We do not keep logs of your personal media library.',
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
  { icon: Link2, title: 'Copy the video link', text: 'Copy the URL of the video, Reel, or Short from YouTube, Instagram, TikTok, Facebook, or any supported site.' },
  { icon: ClipboardPaste, title: 'Paste & find video', text: 'Paste the link into the box above and click Find Video to instantly inspect available quality options.' },
  { icon: Download, title: 'Download in high quality', text: 'Choose your desired quality (including Full HD MP4) and click Download to save it immediately.' },
];

export const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: 'Universal platform support', text: 'Download from YouTube, Instagram, TikTok, Facebook, X, Reddit, Pinterest, and 1,000+ websites.' },
  { icon: Smartphone, title: 'Mobile & desktop optimized', text: 'Clean, responsive design engineered for seamless use on iPhone, Android, tablets, and computers.' },
  { icon: ListVideo, title: 'Full HD & merged audio', text: 'Automatically merges high-definition video and audio streams into standard, ready-to-watch MP4 files.' },
  { icon: Timer, title: 'Lightning-fast processing', text: 'Direct stream engine delivers rapid link resolution and fast downloads with real-time progress.' },
  { icon: Monitor, title: 'Zero installation needed', text: 'Runs 100% online in your favorite browser. No software, app downloads, or browser extensions required.' },
  { icon: LockKeyhole, title: 'Privacy & security first', text: 'Your downloads remain confidential. No registration, no tracking, and temporary files are wiped immediately.' },
];

export const devices: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Smartphone, title: 'Android phones', text: 'Use a current mobile browser. Downloads usually appear in the browser’s download list.' },
  { icon: Smartphone, title: 'iPhone', text: 'Safari and other mobile browsers can open the page. Saving behavior follows that browser.' },
  { icon: Tablet, title: 'Tablets', text: 'The same flow uses a wider layout, with no separate app to install.' },
  { icon: Laptop, title: 'Desktop browsers', text: 'Review the link and quality options on a laptop or desktop screen.' },
];
