import { JsonLd } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbGraph, infoCrumbs } from '@/lib/structured-data';
import { TermsPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/terms');

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbGraph(infoCrumbs.terms)} />
      <TermsPage />
    </>
  );
}
