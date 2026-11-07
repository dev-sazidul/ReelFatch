import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo';
import { NotFoundPage } from '@/views/info-pages';

const notFoundMetadata = getPageMetadata('/__not-found__');

export const metadata: Metadata = {
  title: notFoundMetadata.title,
  description: notFoundMetadata.description,
  robots: notFoundMetadata.robots,
};

export default function NotFound() {
  return <NotFoundPage />;
}
