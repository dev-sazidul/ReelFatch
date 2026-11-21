import { JsonLd } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbGraph, infoCrumbs } from '@/lib/structured-data';
import { CopyrightPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/copyright');

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbGraph(infoCrumbs.copyright)} />
      <CopyrightPage />
    </>
  );
}
