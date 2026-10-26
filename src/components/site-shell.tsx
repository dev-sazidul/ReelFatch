import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowDownToLine, Menu, X } from 'lucide-react';
import { brand } from '@/config/brand';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
];

const footerLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/copyright', label: 'Copyright / Takedown Policy' },
  { href: '/faq', label: 'FAQ' },
];

function BrandLink({ testId, onClick }: { testId: string; onClick?: () => void }) {
  return (
    <Link href="/" className="rf-brand" aria-label={`${brand.name} home`} onClick={onClick} data-testid={testId}>
      <span className="rf-brand-mark"><ArrowDownToLine size={17} strokeWidth={2.5} aria-hidden="true" /></span>
      <span>{brand.name}</span>
    </Link>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="rf-shell">
      <header className="rf-header">
        <div className="rf-container rf-header-inner">
          <BrandLink testId="link-brand-home" onClick={() => setMenuOpen(false)} />
          <button
            className="rf-mobile-menu"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            <span className="rf-sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          </button>
          <nav id="primary-navigation" className={menuOpen ? 'rf-nav mobile-open' : 'rf-nav'} aria-label="Main navigation">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={location === item.href ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/#tool" className="rf-nav-cta" onClick={() => setMenuOpen(false)} data-testid="link-nav-start">Get Started</Link>
          </nav>
        </div>
      </header>
      <main className="rf-main">{children}</main>
      <footer className="rf-footer">
        <div className="rf-container">
          <div className="rf-footer-top">
            <div>
              <BrandLink testId="link-footer-brand" />
              <p className="rf-footer-note">{brand.name} is an independent tool and is not affiliated with or endorsed by Meta or Facebook.</p>
            </div>
            <nav className="rf-footer-links" aria-label="Footer">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} data-testid={`link-footer-${item.href.slice(1) || 'home'}`}>{item.label}</Link>
              ))}
            </nav>
          </div>
          <div className="rf-footer-bottom">
            <span>© {new Date().getFullYear()} {brand.name}</span>
            <span>Download only what you have permission to save.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
