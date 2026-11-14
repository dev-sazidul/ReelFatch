import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, Clock, Sparkles } from 'lucide-react';
import { blogs } from '@/data/blogs';
import { buildMetadata } from '@/lib/seo';
import { FutureSolutionBadge, EcosystemSection } from '@/components/ecosystem-tools';

export const generateMetadata = () => buildMetadata('/blog');

export default function BlogIndexPage() {
  return (
    <>
      <section className="rf-page-hero">
        <div className="rf-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span className="rf-eyebrow">Creator Guides &amp; Insights</span>
            <FutureSolutionBadge />
          </div>
          <h1>Video Production &amp; Creator Workflows</h1>
          <p>
            Expert guides on cross-platform video archiving, vertical short repurposing, audio extraction, thumbnail psychology, and modern video codecs—brought to you by ReelFetch and FutureSolutionAI.
          </p>
        </div>
      </section>

      <section className="rf-section" style={{ paddingTop: 0 }}>
        <div className="rf-container">
          <div className="rf-blog-grid">
            {blogs.map((post) => (
              <article key={post.slug} className="rf-blog-card">
                <div className="rf-blog-card-meta">
                  <span className="rf-blog-category">{post.category}</span>
                  <div className="rf-blog-time">
                    <span className="rf-blog-time-item">
                      <Calendar size={13} aria-hidden="true" />
                      <time dateTime={post.publishedAt}>{post.publishedAt}</time>
                    </span>
                    <span className="rf-blog-time-item">
                      <Clock size={13} aria-hidden="true" />
                      <span>{post.readTime}</span>
                    </span>
                  </div>
                </div>

                <h2 className="rf-blog-card-title">
                  <Link href={`/blog/${post.slug}`} className="rf-blog-title-link">
                    {post.title}
                  </Link>
                </h2>

                <p className="rf-blog-card-excerpt">{post.excerpt}</p>

                <div className="rf-blog-card-tags">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rf-blog-tag">#{tag}</span>
                  ))}
                </div>

                <div className="rf-blog-card-footer">
                  <Link href={`/blog/${post.slug}`} className="rf-text-link" style={{ marginTop: 0 }}>
                    Read Full Guide <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <EcosystemSection />
    </>
  );
}

