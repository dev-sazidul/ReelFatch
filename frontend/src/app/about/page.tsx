import { JsonLd } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbGraph, infoCrumbs } from '@/lib/structured-data';
import { AboutPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/about');

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbGraph(infoCrumbs.about)} />
      <AboutPage />
    </>
  );
}
