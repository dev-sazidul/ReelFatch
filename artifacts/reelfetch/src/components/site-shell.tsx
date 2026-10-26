import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowDownToLine, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

const footerLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/copyright', label: 'Copyright / Takedown' },
  { href: '/faq', label: 'FAQ' },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="rf-shell">
      <header className="rf-header">
        <div className="rf-container rf-header-inner">
          <Link href="/" className="rf-brand" aria-label="ReelFetch home" onClick={() => setMenuOpen(false)} data-testid="link-brand-home">
            <span className="rf-brand-mark"><ArrowDownToLine size={18} strokeWidth={2.6} /></span>
            <span>ReelFetch</span>
          </Link>
          <button className="rf-mobile-menu" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <nav className={`rf-nav${menuOpen ? ' mobile-open' : ''}`} aria-label="Main navigation">
            {navLinks.map((item) => <Link key={item.href} href={item.href} aria-current={location === item.href ? 'page' : undefined} onClick={() => setMenuOpen(false)} data-testid={`link-nav-${item.label.toLowerCase()}`}>{item.label}</Link>)}
            <Link href="/#tool" className="rf-nav-cta" onClick={() => setMenuOpen(false)} data-testid="link-nav-start">Try the tool</Link>
          </nav>
        </div>
      </header>
      <main className="rf-main">{children}</main>
      <footer className="rf-footer">
        <div className="rf-container">
          <div className="rf-footer-top">
            <div>
              <Link href="/" className="rf-brand" data-testid="link-footer-brand"><span className="rf-brand-mark"><ArrowDownToLine size={18} /></span><span>ReelFetch</span></Link>
              <p className="rf-footer-note">A straightforward interface concept for working with video links you’re authorized to use. ReelFetch is independent and is not affiliated with Meta or Facebook.</p>
            </div>
            <nav className="rf-footer-links" aria-label="Footer navigation">
              {footerLinks.map((item) => <Link key={item.href} href={item.href} data-testid={`link-footer-${item.href.slice(1) || 'home'}`}>{item.label}</Link>)}
            </nav>
          </div>
          <div className="rf-footer-bottom"><span>© {new Date().getFullYear()} ReelFetch</span><span>Use only where you have permission and rights.</span></div>
        </div>
      </footer>
    </div>
  );
}
