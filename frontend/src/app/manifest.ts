import type { MetadataRoute } from 'next';
import pwaConfig from '../../pwa.config.json';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: pwaConfig.name,
    short_name: pwaConfig.shortName,
    description: pwaConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: pwaConfig.backgroundColor,
    theme_color: pwaConfig.themeColor,
    categories: ['utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
