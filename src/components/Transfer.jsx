import { useState } from 'react'
import { IoChevronForward, IoChevronBack } from 'react-icons/io5'
import { BsPersonLinesFill, BsPlusCircle } from 'react-icons/bs'
import { MdOutlineConfirmationNumber } from 'react-icons/md'
import { PiPaperPlaneTilt } from 'react-icons/pi'

const Transfer = ({ event, onClose }) => {
  const [step, setStep]       = useState(1)
  const [selected, setSelected] = useState([])
  const [usePhone, setUsePhone] = useState(false)
  const [note, setNote]       = useState('')
  const MAX_NOTE = 160

  const tickets = event?.tickets || []
  const sectionLabel = tickets.length > 0
    ? `Sec ${tickets[0].section}, Row ${tickets[0].row}`
    : ''

  const toggleSeat = (idx) =>
    setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])

  return (
    <div className="tr-overlay" onClick={onClose}>
      <div
        className={`tr-sheet ${step === 3 ? 'tr-sheet--tall' : step === 2 ? 'tr-sheet--mid' : 'tr-sheet--short'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="tr-handle" />

        {/* ── STEP 1: SELECT TICKETS ───────────────────────────────── */}
        {step === 1 && (
          <>
            <p className="tr-section-title">SELECT TICKETS TO TRANSFER</p>
            <div className="tr-divider" />

            <div className="tr-seat-meta">
              <span className="tr-seat-meta-label">{sectionLabel}</span>
              <span className="tr-seat-meta-count">
                <MdOutlineConfirmationNumber size={14} style={{ marginRight: 4 }} />
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="tr-seats">
              {tickets.map((ticket, idx) => (
                <div
                  key={idx}
                  className={`tr-seat-card ${selected.includes(idx) ? 'tr-seat-card--on' : ''}`}
                  onClick={() => toggleSeat(idx)}
                >
                  <span className="tr-seat-name">SEAT {ticket.seat}</span>
                  <div className={`tr-seat-circle ${selected.includes(idx) ? 'tr-seat-circle--on' : ''}`}>
                    {selected.includes(idx) && (
                      <svg viewBox="0 0 24 24" fill="white" width="11" height="11">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="tr-footer">
              <span className="tr-footer-count">
                {selected.length > 0 ? `${selected.length} Selected` : ''}
              </span>
              <button
                className={`tr-next-btn ${selected.length === 0 ? 'tr-next-btn--off' : ''}`}
                disabled={selected.length === 0}
                onClick={() => setStep(2)}
              >
                TRANSFER TO <IoChevronForward size={13} />
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: TRANSFER TO ─────────────────────────────────── */}
        {step === 2 && (
          <>
            <p className="tr-section-title">TRANSFER TO</p>
            <div className="tr-divider" />

            <div className="tr-options">
              <button className="tr-option-btn" onClick={() => setStep(3)}>
                <span>Select From Contacts</span>
                <BsPersonLinesFill size={17} />
              </button>
              <button className="tr-option-btn" onClick={() => setStep(3)}>
                <span>Manually Enter A Recipient</span>
                <BsPlusCircle size={17} />
              </button>
            </div>

            <div className="tr-empty">
              <PiPaperPlaneTilt size={48} color="#bbb" />
              <p className="tr-empty-title">Transfer Tickets Via Email or Text Message</p>
              <p className="tr-empty-sub">
                Select an Email or mobile number to transfer tickets to your recipient.
              </p>
            </div>

            <div className="tr-footer tr-footer--left">
              <button className="tr-back-btn" onClick={() => setStep(1)}>
                <IoChevronBack size={13} /> BACK
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: RECIPIENT DETAILS ────────────────────────────── */}
        {step === 3 && (
          <>
            <p className="tr-form-title">RECIPIENT DETAILS</p>

            <div className="tr-fields">
              <div className="tr-field">
                <label className="tr-label">First Name</label>
                <input className="tr-input" type="text" placeholder="Enter First Name" />
              </div>

              <div className="tr-field">
                <label className="tr-label">Last Name</label>
                <input className="tr-input" type="text" placeholder="Enter Last Name" />
              </div>

              <div className="tr-field">
                <label className="tr-label">{usePhone ? 'Mobile Number' : 'Email'}</label>
                <input
                  className="tr-input"
                  type={usePhone ? 'tel' : 'email'}
                  placeholder={usePhone ? 'Enter Mobile Number' : 'Enter Email Address'}
                />
                <button className="tr-toggle-link" onClick={() => setUsePhone(p => !p)}>
                  {usePhone ? 'Use Email Instead' : 'Use Mobile Number Instead'}
                </button>
              </div>

              <div className="tr-field tr-field--note">
                <label className="tr-label">Note</label>
                <textarea
                  className="tr-textarea"
                  maxLength={MAX_NOTE}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                />
                <span className="tr-note-count">{MAX_NOTE - note.length} Characters Left</span>
              </div>
            </div>

            <div className="tr-form-footer">
              <button className="tr-back-btn" onClick={() => setStep(2)}>
                <IoChevronBack size={13} /> BACK
              </button>
              <button className="tr-submit-btn">
                Transfer {selected.length} Ticket{selected.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Transfer
