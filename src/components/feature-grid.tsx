import { features } from '@/content/site';

export function FeatureGrid() {
  return (
    <section className="rf-section rf-section-tint" id="features">
      <div className="rf-container">
        <div className="rf-section-heading">
          <span className="rf-eyebrow">Why ReelFetch</span>
          <h2>A straightforward download tool.</h2>
          <p>Built to stay clear on a phone, without promising results the source cannot provide.</p>
        </div>
        <div className="rf-features">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="rf-feature" key={title}>
              <span className="rf-iconbox" aria-hidden="true"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
