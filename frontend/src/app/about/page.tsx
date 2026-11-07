import { buildMetadata } from '@/lib/seo';
import { AboutPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/about');

export default function Page() {
  return <AboutPage />;
}
