import { ClipboardPaste, Download, Laptop, Link2, ListVideo, LockKeyhole, Monitor, Smartphone, Tablet, Timer, type LucideIcon } from 'lucide-react';

export type FaqItem = { question: string; answer: string };

export const homeFaq: FaqItem[] = [
  {
    question: 'How do I download a public Facebook, YouTube, or TikTok video?',
    answer: 'Copy the public video, Reel, or Short link, paste it into the field on this page, and choose Find Video. Then pick one of the available qualities returned for that video.',
  },
  {
    question: 'Which platforms are currently available on ReelFetch?',
    answer: 'Facebook, YouTube, and TikTok public videos are currently active. Instagram, X, Reddit, and Pinterest are marked Coming Soon because they currently require login cookies or restrict unauthenticated server lookups.',
  },
  {
    question: 'Does ReelFetch charge a fee or require an account?',
    answer: 'No. ReelFetch does not ask you to register, log in, or pay to check a public link.',
  },
  {
    question: 'What video quality and format will I get?',
    answer: 'You get the MP4 or original format returned by the source for that link. Selectable resolutions (such as 1080p, 720p, 480p, or 360p) appear only when the source provides them; if only a single stream is exposed, Original / Best available is shown.',
  },
  {
    question: 'Where are downloaded files saved on my device?',
    answer: 'Your browser streams the file directly to its default Downloads folder. On iPhone (Safari), downloaded videos appear in the Files app under Downloads rather than directly in Photos. On Android, check Chrome Downloads or your Files app.',
  },
  {
    question: 'Can I download private, age-gated, or restricted videos?',
    answer: 'No. ReelFetch does not log into source platforms or bypass access controls. Private accounts, deleted posts, live streams in progress, and region-blocked videos cannot be downloaded.',
  },
];

export const moreFaq: FaqItem[] = [
  {
    question: 'Is there a maximum file size limit?',
    answer: 'Yes. Individual downloads are capped at 512 MB so server transfers remain reliable and responsive for all users.',
  },
  {
    question: 'Do I need to install any apps or browser extensions?',
    answer: 'No. ReelFetch works directly in your mobile or desktop web browser. You can also optionally install it as a Progressive Web App (PWA) from your browser menu for quick access.',
  },
  {
    question: 'Does ReelFetch store copies of downloaded videos?',
    answer: 'No. ReelFetch does not keep a media library. Temporary server files created during stream preparation are deleted immediately after your download completes or fails.',
  },
  {
    question: 'Why did my video link return an error or timeout?',
    answer: 'Verify that the URL starts with https:// or http://, belongs to an active supported platform, and is publicly viewable without signing in. Temporary platform rate limits or videos over 512 MB can also trigger an error.',
  },
  {
    question: 'What should I know about copyright and fair use?',
    answer: 'Please only download content you own, have created, or have explicit permission from the rights holder to save for offline personal viewing.',
  },
];

export const steps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: 'Copy the video link', text: 'Copy the public URL of a video, Reel, or Short from a supported platform such as Facebook, YouTube, or TikTok.' },
  { icon: ClipboardPaste, title: 'Paste and find video', text: 'Paste the link into the box above and choose Find Video to see the qualities that source returns.' },
  { icon: Download, title: 'Save a listed file', text: 'Choose one of the listed qualities and download it directly through your browser.' },
];

export const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: 'Direct platform pages', text: 'Use the downloader on the homepage or directly on each active platform guide page.' },
  { icon: Smartphone, title: 'Mobile & desktop ready', text: 'Clean, responsive interface designed for iPhone, Android, tablets, and desktop browsers.' },
  { icon: ListVideo, title: 'Genuine quality options', text: 'Lists only the resolutions the source actually provides, merging video and audio into MP4 when needed.' },
  { icon: Timer, title: 'Native browser streaming', text: 'Files stream directly through your browser download manager without buffering large videos in page memory.' },
  { icon: Monitor, title: 'Zero installation needed', text: 'Runs 100% online in your browser, with optional PWA home-screen support.' },
  { icon: LockKeyhole, title: 'No account required', text: 'Check public links without registering. Temporary files are removed after transfer. See our Privacy Policy for analytics and ad details.' },
];

export const devices: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Smartphone, title: 'Android phones', text: 'Use Chrome or another modern mobile browser. Saved files appear in your Downloads folder.' },
  { icon: Smartphone, title: 'iPhone', text: 'Safari streams downloads to the Files app (Downloads folder) on iOS.' },
  { icon: Tablet, title: 'Tablets', text: 'Uses the full responsive layout in Safari or Chrome with no separate app required.' },
  { icon: Laptop, title: 'Desktop browsers', text: 'Check links and download MP4 files directly in Chrome, Firefox, Edge, or Safari.' },
];
