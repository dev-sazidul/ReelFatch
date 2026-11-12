import { JsonLd } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbGraph, infoCrumbs } from '@/lib/structured-data';
import { ContactPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/contact');

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbGraph(infoCrumbs.contact)} />
      <ContactPage />
    </>
  );
}
