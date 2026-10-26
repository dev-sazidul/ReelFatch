import { createRoot } from 'react-dom/client';

import App from './App';
import { brand } from '@/config/brand';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

document.documentElement.style.setProperty('--rf-accent', brand.accent);
document.documentElement.style.setProperty('--rf-accent-hover', brand.accentHover);
document.documentElement.style.setProperty('--rf-navy', brand.navy);

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
