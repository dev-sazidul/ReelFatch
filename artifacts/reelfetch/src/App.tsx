import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import HomePage from '@/pages/home';
import { AboutPage, ContactPage, CopyrightPage, FaqPage, NotFoundPage, PrivacyPage, TermsPage } from '@/pages/info-pages';
import { SiteShell } from '@/components/site-shell';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'ReelFetch — Clear choices for a video link',
      '/about': 'About ReelFetch',
      '/contact': 'Contact ReelFetch',
      '/privacy': 'Privacy — ReelFetch',
      '/terms': 'Terms — ReelFetch',
      '/copyright': 'Copyright / Takedown — ReelFetch',
      '/faq': 'FAQ — ReelFetch',
    };
    document.title = titles[location] ?? 'Page not found — ReelFetch';
  }, [location]);
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <SiteShell>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/copyright" component={CopyrightPage} />
          <Route path="/faq" component={FaqPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </SiteShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
