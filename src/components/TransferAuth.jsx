import { useEffect, useRef, useState } from 'react'
import codeimg from '../imgs/code.svg'

// Four-stage "Authenticating" screen shown before the transfer ticket-select
// sheet, mimicking the real app's identity check before it lets a ticket
// move to someone else:
//   1. light stage, growing/shrinking blue arc              (3s)
//   2. dark stage, three staggered colored arcs              (2.5s)
//   3. dark stage, single growing/shrinking white arc         (2s)
//   4. a one-time-code card centered over the dark screen, then waits on
//      the user — Confirm Code stays disabled until a code is typed, and
//      shows a spinner for 3s after submit before onDone hands off to the
//      ticket-select sheet.
const STAGE_1_MS = 3000
const STAGE_2_MS = 2500
const STAGE_3_MS = 2000
const SUBMIT_MS = 3000
const CODEDELAY = 12000
const CODEDISPLAY_MS = 8000

const TransferAuth = ({ onCancel, onDone }) => {
  const [stage, setStage] = useState('auth') // 'auth' | 'loading' | 'loading2' | 'otp'
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitTimerRef = useRef(null)
  const [codedisplay, setcodedisplay] = useState(false)
  const [codehide, setcodehide] = useState(false)


  useEffect(() => {
    const toLoading = setTimeout(() => setStage('loading'), STAGE_1_MS)
    const toLoading2 = setTimeout(() => setStage('loading2'), STAGE_1_MS + STAGE_2_MS)
    const toOtp = setTimeout(() => setStage('otp'), STAGE_1_MS + STAGE_2_MS + STAGE_3_MS)
    return () => { clearTimeout(toLoading); clearTimeout(toLoading2); clearTimeout(toOtp) }
  }, [])


  useEffect(() => () => clearTimeout(submitTimerRef.current), [])

  // --- scroll-jump fix: while any input/textarea in this component is focused,
  // snap window scroll back to 0 the instant iOS tries to move it (instantly,
  // no smooth-scroll animation) ---
  useEffect(() => {
    const snapBack = () => {
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        const prevBehavior = document.documentElement.style.scrollBehavior
        document.documentElement.style.scrollBehavior = 'auto'
        window.scrollTo(0, 0)
        document.documentElement.style.scrollBehavior = prevBehavior
      }
    }
    window.addEventListener('scroll', snapBack, { passive: true })
    return () => window.removeEventListener('scroll', snapBack)
  }, [])

  const handleConfirm = () => {
    if (!code.trim() || submitting) return
    setSubmitting(true)
    submitTimerRef.current = setTimeout(onDone, SUBMIT_MS)
  }


  setTimeout(() => {
    setcodedisplay(true)
  }, CODEDELAY);

  setTimeout(() => {
    if (codedisplay) {
      setcodehide(true)
    }
  }, CODEDISPLAY_MS);

  


  

  

  return (
    <div>
    <div className={`tra-overlay${stage !== 'auth' ? ' tra-overlay--dark' : ''}`}>
      
      {/* {codedisplay && (<img src={codeimg} alt="codeimg" className={`code-displayshow ${codehide && 'code-displayhide'}`} style={{position: 'absolute', width: "98%", left: "1%", top: "-2.5rem", transition: " transform ease-in 500ms"}}/>)} */}
      <div className="tra-topbar">
        <button className="tra-cancel" onClick={onCancel}>Cancel</button>
        <span className="tra-title">Authentication</span>
        <span className="tra-topbar-spacer" />
      </div>

      <div className="tra-body">
        {stage === 'auth' && (
          <svg className="tra-spinner-svg" viewBox="0 0 50 50">
            <circle className="tra-spinner-circle" cx="25" cy="25" r="20" fill="none" strokeWidth="4" pathLength="100" />
          </svg>
        )}
        {stage === 'loading' && (
          <svg className="tra-spinner-tri" viewBox="0 0 50 50">
            <circle className="tra-tri-circle tra-tri-1" cx="25" cy="25" r="20" fill="none" strokeWidth="3" pathLength="100" />
            <circle className="tra-tri-circle tra-tri-2" cx="25" cy="25" r="14" fill="none" strokeWidth="3" pathLength="100" />
            <circle className="tra-tri-circle tra-tri-3" cx="25" cy="25" r="8" fill="none" strokeWidth="3" pathLength="100" />
          </svg>
        )}
        {stage === 'loading2' && (
          <svg className="tra-spinner-svg" viewBox="0 0 50 50">
            <circle className="tra-spinner-circle tra-spinner-circle--white" cx="25" cy="25" r="20" fill="none" strokeWidth="4" pathLength="100" />
          </svg>
        )}
        {stage === 'otp' && (
          <div className="tra-otp-card">
            <p className="tra-otp-title">Authenticate Your Account</p>
            <p className="tra-otp-sub">
              A one-time code has been sent to <strong>*******4259</strong>. Please enter your code below to continue.
            </p>
            <label className="tra-otp-label" htmlFor="tra-otp-input">One-Time Code</label>
            <input
              id="tra-otp-input"
              className="tra-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              readOnly
              onTouchStart={(e) => {
                e.target.removeAttribute('readonly')
                e.target.focus()
              }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
            />
            <p className="tra-otp-hint">It may take a minute to receive your code.</p>
            <button
              className={`tra-otp-confirm${!code.trim() || submitting ? ' tra-otp-confirm--off' : ''}`}
              disabled={!code.trim() || submitting}
              onClick={handleConfirm}
            >
              {submitting ? <span className="tra-otp-spinner" /> : 'Confirm Code'}
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

export default TransferAuth