import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

Sentry.init({
  dsn: "https://18f06f2d8cf128fa9cb17753501b6288@o4511971316400128.ingest.de.sentry.io/4511971334160464",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Tracing
  tracesSampleRate: 0.5,
  // Smart Quota Protection: 0% replay for normal visits, 100% replay when errors occur
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,
  release: typeof __APP_GIT_COMMIT__ !== 'undefined' ? `asset-tracker@${__APP_GIT_COMMIT__}` : 'asset-tracker@latest',
  environment: window.location.hostname.includes('web.app') 
    ? 'production' 
    : (window.location.hostname.includes('github.io') ? 'staging' : 'development'),
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

