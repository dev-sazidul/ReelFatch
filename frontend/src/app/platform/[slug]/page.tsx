import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/json-ld';
import { getPlatformById, platformRegistry } from '@/data/platforms';
import { buildMetadata } from '@/lib/seo';
import { platformGraph } from '@/lib/structured-data';
import PlatformPage from '@/views/platform-page';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return platformRegistry.map((platform) => ({ slug: platform.id }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata(`/platform/${slug}`);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!getPlatformById(slug)) notFound();
  return (
    <>
      <JsonLd data={platformGraph(slug)} />
      <PlatformPage slug={slug} />
    </>
  );
}
