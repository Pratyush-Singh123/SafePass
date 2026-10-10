import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Emergency Offline Service Worker (Zero-Network Disaster Redundancy)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SafePass] Emergency Offline Cache Active:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SafePass] Service Worker registration non-fatal notice:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
