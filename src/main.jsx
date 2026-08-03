import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Service worker ────────────────────────────────────────────────────────────
// Register ONLY in production (the built/deployed app). In dev the worker fights
// Vite's HMR and serves stale cached modules — the cause of the white screen on
// relaunch — so instead we actively remove any worker/cache left behind.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => console.log('ServiceWorker registered, scope:', reg.scope))
        .catch(err => console.log('ServiceWorker registration failed:', err))
    })
  } else {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister())
    })
    if (window.caches) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
