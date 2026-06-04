// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import AppProviders from '../components/AppProviders.jsx';
import ReleaseSync from '../components/ReleaseSync.jsx';
import { HelmetProvider } from 'react-helmet-async';
import './globals.css'; // Tailwind globals if any

const buildVersion = import.meta.env.VITE_BUILD_VERSION || 'local-dev';

const getInitialTheme = () => {
  const match = document.cookie.match(/(?:^|;\s*)theme=([^;]*)/);
  return match && match[1] === 'dark' ? 'dark' : 'light';
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HelmetProvider>
        <ReleaseSync currentVersion={buildVersion} />
        <AppProviders initialTheme={getInitialTheme()}>
          <App />
        </AppProviders>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
);
