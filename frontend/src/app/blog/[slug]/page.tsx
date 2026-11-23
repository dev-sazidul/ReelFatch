import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Calendar, Clock, Share2, Tag } from 'lucide-react';
import { blogs, getBlogPostBySlug } from '@/data/blogs';
import { buildMetadata } from '@/lib/seo';
import { getBlogPostJsonLd, getBreadcrumbJsonLd } from '@/lib/structured-data';
import { DEFAULT_SITE_URL } from '@/config/brand';
import { FutureSolutionBadge, ecosystemTools } from '@/components/ecosystem-tools';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogs.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata(`/blog/${slug}`);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const postJsonLd = getBlogPostJsonLd(post);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: DEFAULT_SITE_URL },
    { name: 'Blog', url: `${DEFAULT_SITE_URL}/blog` },
    { name: post.title, url: `${DEFAULT_SITE_URL}/blog/${post.slug}` },
  ]);

  const otherPosts = blogs.filter((b) => b.slug !== post.slug).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="rf-article-wrapper">
        <header className="rf-article-header">
          <div className="rf-container" style={{ maxWidth: 840 }}>
            <nav className="rf-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog">Blog</Link>
              <span aria-hidden="true">/</span>
              <span className="rf-breadcrumb-current">{post.category}</span>
            </nav>

            <div className="rf-article-header-meta">
              <span className="rf-blog-category">{post.category}</span>
              <FutureSolutionBadge />
            </div>

            <h1 className="rf-article-title">{post.title}</h1>
            <p className="rf-article-excerpt">{post.excerpt}</p>

            <div className="rf-article-byline">
              <div className="rf-article-author-info">
                <span>Published by <strong><a href="https://futuresolutionai.com" target="_blank" rel="noopener noreferrer">FutureSolutionAI Editorial</a></strong></span>
                <div className="rf-article-dates">
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
            </div>
          </div>
        </header>

        <div className="rf-container" style={{ maxWidth: 840 }}>
          <div
            className="rf-prose rf-article-body"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="rf-article-tags-section">
            <span className="rf-article-tags-label"><Tag size={14} /> Tags:</span>
            <div className="rf-blog-card-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="rf-blog-tag">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="rf-article-author-card">
            <div className="rf-article-author-header">
              <div>
                <span className="rf-eyebrow" style={{ fontSize: 10 }}>About The Publisher</span>
                <h3>FutureSolutionAI Engineering &amp; Media Labs</h3>
              </div>
              <FutureSolutionBadge />
            </div>
            <p>
              ReelFetch is a flagship free media utility engineered by <a href="https://futuresolutionai.com" target="_blank" rel="noopener noreferrer">FutureSolutionAI</a>.
              We specialize in custom web applications, SaaS platform development, and AI-driven automation pipelines designed to help content creators, businesses, and digital agencies scale their operations.
            </p>
          </div>

          <div className="rf-article-ecosystem-box">
            <span className="rf-eyebrow">Connected Free Creator Tools</span>
            <h3>Expand Your Media Production Toolkit</h3>
            <p>
              Explore our complementary free utilities built to streamline your digital content workflow:
            </p>
            <div className="rf-article-ecosystem-grid">
              {ecosystemTools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rf-article-ecosystem-card"
                >
                  <div className="rf-article-ecosystem-card-title">
                    <strong>{tool.name}</strong>
                    <ArrowUpRight size={14} />
                  </div>
                  <p>{tool.title}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rf-article-navigation">
            <Link href="/blog" className="rf-button rf-button-secondary">
              <ArrowLeft size={15} /> Back to all articles
            </Link>
            <Link href="/#tool" className="rf-button rf-button-primary">
              Launch Downloader <ArrowRight size={15} />
            </Link>
          </div>

          {otherPosts.length > 0 && (
            <div className="rf-related-posts">
              <h2>More Creator Guides</h2>
              <div className="rf-related-posts-grid">
                {otherPosts.map((other) => (
                  <Link key={other.slug} href={`/blog/${other.slug}`} className="rf-related-card">
                    <span className="rf-blog-category" style={{ fontSize: 10 }}>{other.category}</span>
                    <h4>{other.title}</h4>
                    <span className="rf-text-link" style={{ marginTop: 'auto', fontSize: 12 }}>
                      Read Guide <ArrowRight size={13} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}

