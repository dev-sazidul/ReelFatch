import { buildMetadata } from '@/lib/seo';
import { TermsPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/terms');

export default function Page() {
  return <TermsPage />;
}
