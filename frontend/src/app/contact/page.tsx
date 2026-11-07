import { buildMetadata } from '@/lib/seo';
import { ContactPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/contact');

export default function Page() {
  return <ContactPage />;
}
