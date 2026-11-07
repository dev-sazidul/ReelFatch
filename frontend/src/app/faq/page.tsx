import { buildMetadata } from '@/lib/seo';
import { FaqPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/faq');

export default function Page() {
  return <FaqPage />;
}
