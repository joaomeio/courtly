import React from 'react';
import ReactDOM from 'react-dom/client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import App from './App.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import './index.css';

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </PostHogProvider>
  </React.StrictMode>,
);
