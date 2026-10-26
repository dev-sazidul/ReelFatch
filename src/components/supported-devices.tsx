import { devices } from '@/content/site';

export function SupportedDevices() {
  return (
    <section className="rf-section" id="devices">
      <div className="rf-container">
        <div className="rf-section-heading">
          <span className="rf-eyebrow">Supported devices</span>
          <h2>Use the browser you already have.</h2>
          <p>ReelFetch is a website, not an app install. Your browser decides how a file is saved. It is not sent straight to a phone gallery.</p>
        </div>
        <ul className="rf-device-grid">
          {devices.map(({ icon: Icon, title, text }) => (
            <li className="rf-device-card" key={title}>
              <span className="rf-iconbox" aria-hidden="true"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
