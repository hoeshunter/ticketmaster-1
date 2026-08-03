import { useState } from 'react'
import './ConfirmAlert.css'

// ── iOS 26 "Liquid Glass" confirmation alert ────────────────────────────────
// Native system-alert pattern: dimmed backdrop behind a frosted glass card
// (28px continuous corner radius + systemThinMaterial-style blur, per Apple's
// iOS 26 alert spec) that springs in, then a hairline-divided button row —
// built from scratch to match, not a UI kit.
const ConfirmAlert = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) => {
  const [closing, setClosing] = useState(false)

  const close = (action) => {
    setClosing(true)
    setTimeout(() => action?.(), 180)
  }

  return (
    <div className={`ios-alert-backdrop ${closing ? 'ios-alert-backdrop--out' : ''}`}>
      <div className={`ios-alert-card ${closing ? 'ios-alert-card--out' : ''}`}>
        <div className="ios-alert-body">
          <p className="ios-alert-title">{title}</p>
          <p className="ios-alert-message">{message}</p>
        </div>
        <div className="ios-alert-actions">
          <button className="ios-alert-btn" onClick={() => close(onCancel)}>{cancelLabel}</button>
          <button className="ios-alert-btn ios-alert-btn--confirm" onClick={() => close(onConfirm)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmAlert
