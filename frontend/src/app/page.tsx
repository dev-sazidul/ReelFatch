import { buildMetadata } from '@/lib/seo';
import HomePage from '@/views/home';

export const generateMetadata = () => buildMetadata('/');

export default function Page() {
  return <HomePage />;
}
