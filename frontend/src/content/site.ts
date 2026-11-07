import { ClipboardPaste, Download, Laptop, Link2, ListVideo, LockKeyhole, Monitor, Smartphone, Tablet, Timer, type LucideIcon } from 'lucide-react';

export type FaqItem = { question: string; answer: string };

export const homeFaq: FaqItem[] = [
  {
    question: 'How do I use the downloader?',
    answer: 'Copy a Facebook Reel or video link, paste it into the field, and choose Find Video. If an authorized source is connected, you can review the options it returns and download an available quality.',
  },
  {
    question: 'Why is a video link not working?',
    answer: 'Check that the address starts with https:// or http:// and is a facebook.com or fb.watch link. Share and fb.watch short links do not include a numeric video id, so they cannot be sent to the Graph API. A watch, reel, or videos link still needs a server token that is allowed to read that video.',
  },
  {
    question: 'Why are some quality options unavailable?',
    answer: 'Only qualities returned for that specific video can be offered. A higher resolution is not assumed, and an option marked unavailable cannot be selected.',
  },
  {
    question: 'Where are downloaded files saved?',
    answer: 'This site does not choose a folder for you. If a download is available, your browser decides where the file goes. Phones often use the browser’s download list rather than the photo gallery.',
  },
  {
    question: 'Does the website work on mobile devices?',
    answer: 'Yes. The interface is designed for Android phones, iPhones, tablets, and desktop browsers. Saving and playback still depend on the browser and device you use.',
  },
  {
    question: 'Is every Facebook video downloadable?',
    answer: 'No. A video can be downloaded only when an authorized source provides a file. Private, removed, or restricted videos may have no downloadable option.',
  },
];

export const moreFaq: FaqItem[] = [
  {
    question: 'Is ReelFetch part of Meta or Facebook?',
    answer: 'No. ReelFetch is an independent tool. It is not affiliated with, endorsed by, or sponsored by Meta or Facebook.',
  },
  {
    question: 'Does a recognized link mean the video was found?',
    answer: 'No. Checking the address format only confirms that it looks like a Facebook link. Video details appear only after an authorized source returns them.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No account is required to use the link field.',
  },
  {
    question: 'Can I download any video I find?',
    answer: 'Use only videos you own or have permission to save. Platform rules and local law can still apply.',
  },
];

export const steps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: 'Copy the video link', text: 'Open the Reel or video and copy a watch, reel, or videos link that includes the numeric id.' },
  { icon: ClipboardPaste, title: 'Paste and check options', text: 'Paste the link here to see whether a downloadable source is available.' },
  { icon: Download, title: 'Choose a quality and download', text: 'Select one of the qualities that were actually returned, then start the download.' },
];

export const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: 'Simple link workflow', text: 'Paste a link, review what comes back, and take the next step without extra setup.' },
  { icon: Smartphone, title: 'Mobile-friendly interface', text: 'Large controls and a single-column layout keep the task easy on a phone.' },
  { icon: ListVideo, title: 'Available quality selection', text: 'You only choose from qualities the source provides for that video.' },
  { icon: Timer, title: 'Fast, lightweight pages', text: 'The interface stays focused on the link, the result, and the download action.' },
  { icon: Monitor, title: 'Clear download status', text: 'Loading, unavailable, and failure states explain what happened and what to try next.' },
  { icon: LockKeyhole, title: 'Privacy-conscious handling', text: 'The link is sent only to the ReelFetch server you run. Facebook is contacted only with a configured Graph API token.' },
];

export const devices: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Smartphone, title: 'Android phones', text: 'Use a current mobile browser. Downloads usually appear in the browser’s download list.' },
  { icon: Smartphone, title: 'iPhone', text: 'Safari and other mobile browsers can open the page. Saving behavior follows that browser.' },
  { icon: Tablet, title: 'Tablets', text: 'The same flow uses a wider layout, with no separate app to install.' },
  { icon: Laptop, title: 'Desktop browsers', text: 'Review the link and quality options on a laptop or desktop screen.' },
];
