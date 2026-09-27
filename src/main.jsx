import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Poppins, self-hosted — every weight the UI references (300 light body
// copy up to 900 display titles). Imported once here so any CSS file can
// use font-family: 'Poppins' without extra setup.
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fontsource/poppins/900.css'
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
