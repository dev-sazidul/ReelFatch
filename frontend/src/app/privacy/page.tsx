import { buildMetadata } from '@/lib/seo';
import { PrivacyPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/privacy');

export default function Page() {
  return <PrivacyPage />;
}
