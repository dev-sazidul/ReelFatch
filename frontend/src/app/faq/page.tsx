import { JsonLd } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';
import { faqGraph, faqItems, infoCrumbs } from '@/lib/structured-data';
import { FaqPage } from '@/views/info-pages';

export const generateMetadata = () => buildMetadata('/faq');

export default function Page() {
  return (
    <>
      <JsonLd data={faqGraph(infoCrumbs.faq, faqItems)} />
      <FaqPage />
    </>
  );
}
