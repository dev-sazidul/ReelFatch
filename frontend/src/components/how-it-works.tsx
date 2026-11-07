import { steps } from '@/content/site';

export function HowItWorks() {
  return (
    <section className="rf-section" id="how-it-works">
      <div className="rf-container">
        <div className="rf-section-heading">
          <span className="rf-eyebrow">How it works</span>
          <h2>Three steps, then you’re done.</h2>
          <p>Copy a link, check what is available, and download only a quality the source actually provides.</p>
        </div>
        <ol className="rf-steps">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li className="rf-step" key={title}>
              <span className="rf-step-icon" aria-hidden="true"><Icon size={18} /></span>
              <span className="rf-step-number">Step {index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
