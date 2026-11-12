import { JsonLd } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';
import { homeGraph } from '@/lib/structured-data';
import HomePage from '@/views/home';

export const generateMetadata = () => buildMetadata('/');

export default function Page() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      <HomePage />
    </>
  );
}
