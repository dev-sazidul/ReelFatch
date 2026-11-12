import { SITE_ORIGIN } from '../src/handoff.js';

const copy = {
  unsupported: ['Unsupported page', 'ReelFetch does not support this site. The link was not sent.'],
  invalid: ['Link not accepted', 'This address is not a public http or https link. Nothing was sent.'],
  empty: ['No link found', 'Open a video page or right-click a video link, then try again.'],
  'coming-soon': ['Coming soon', 'ReelFetch recognizes this platform, but checking it is not connected yet. Nothing was sent.'],
};

const reason = new URLSearchParams(location.search).get('reason') || 'unsupported';
const [title, detail] = copy[reason] || copy.unsupported;
document.querySelector('#title').textContent = title;
document.querySelector('#detail').textContent = detail;
document.querySelector('#site').href = `${SITE_ORIGIN}/`;
