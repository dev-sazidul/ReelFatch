import { buildMetadata } from '@/lib/seo';
import { CopyrightPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/copyright');

export default function Page() {
  return <CopyrightPage />;
}
