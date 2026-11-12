import { JsonLd } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbGraph, infoCrumbs } from '@/lib/structured-data';
import { PrivacyPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/privacy');

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbGraph(infoCrumbs.privacy)} />
      <PrivacyPage />
    </>
  );
}
