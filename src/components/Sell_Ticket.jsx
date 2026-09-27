import React, { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import './Sell_Ticket.css';
import { IoAdd, IoCopy, IoCheckmark, IoChevronForward, IoInformationCircleOutline } from "react-icons/io5";
import THREELINEROTATE from './Loading/THREELINEROTATE'
import RESALEPRICINGRESTRICTIONS from './Alert/RESALEPRICINGRESTRICTIONS'
import cc from './ICONS/cc.png'
import pen from './ICONS/pen.jpg'
import bag from './ICONS/bag.jpg'
import radio from './ICONS/radio.jpg'
import { getAdminInfo, getCountry } from '../api'

// Admin country → currency label (shown in the input) + symbol (shown in payout)
const CURRENCY_MAP = {
  US: { label: 'USD$', symbol: '$'   },
  CA: { label: 'CA$',  symbol: 'CA$' },
  UK: { label: '£',    symbol: '£'   },
}

// Standard Ticketmaster resale service fee applied to the payout calculation
const SERVICE_FEE = 0.15

const Sell_Ticket = ({ close, event }) => {
  // 'seats' → 'price' → 'payment' → 'listed'
  const [step, setStep]                   = useState('seats')
  const [Loading, setLoading]             = useState(false)
  const [alert, setalert]                 = useState(false)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [priceValue, setPriceValue]       = useState('')
  const [publicUrl, setPublicUrl]         = useState('')
  const [copied, setCopied]               = useState(false)
  const loadingTimerRef = useRef(null)
  const alertShownRef   = useRef(false)   // alert fires once per open session
  // readOnly is managed at the DOM level — not via React prop — so re-renders
  // triggered by setPriceValue never re-apply it and break mid-type keystrokes.
  const inputDomRef = useRef(null)
  useEffect(() => {
    if (inputDomRef.current) inputDomRef.current.setAttribute('readonly', 'readonly')
  }, [])

  const country  = getCountry()
  const currency = CURRENCY_MAP[country] || CURRENCY_MAP.US

  // Real seat list pulled from the event prop
  const seatList = (event?.tickets || []).map(t => ({
    section: t.section ?? '',
    row:     t.row     ?? '-',
    seat:    t.seat    ?? '',
    sent:    !!t.sent,
  }))

  const seatKey = (s) => `${s.section}-${s.row}-${s.seat}`

  const toggleSeat = (key) =>
    setSelectedSeats(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  // Sent tickets can't be re-sold — exclude them from "Select All"
  const selectAllSeats   = () => setSelectedSeats(seatList.filter(s => !s.sent).map(seatKey))
  const deselectAllSeats = () => setSelectedSeats([])

  // Reactive payout: price × selected count × (1 – service fee), updates live
  const parsedPrice = parseFloat(priceValue) || 0
  const numSelected = selectedSeats.length
  const payout      = parsedPrice * (numSelected || 1) * (1 - SERVICE_FEE)
  const payoutStr   = `${currency.symbol}${payout.toFixed(2)}`

  // Loader fires for 4s each time the step changes
  useEffect(() => {
    clearTimeout(loadingTimerRef.current)
    setLoading(true)
    loadingTimerRef.current = setTimeout(() => setLoading(false), 4000)
    return () => clearTimeout(loadingTimerRef.current)
  }, [step])

  // Resale-pricing alert — pops once, 4s after entering the price step
  useEffect(() => {
    if (step !== 'price' || alertShownRef.current) return
    const t = setTimeout(() => { setalert(true); alertShownRef.current = true }, 4000)
    return () => clearTimeout(t)
  }, [step])

  // Wire listing to real event data and the selected seats/price
  const createListing = async () => {
    const { token } = getAdminInfo()
    if (!token || !event) return
    try {
      const res = await fetch('/api/admin/resell/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          eventId:        event.id,
          eventName:      event.name,
          eventDate:      event.date,
          eventTime:      event.time,
          eventLocation:  `${event.stadium}, ${event.city}, ${event.state}`,
          tickets:        selectedSeats.map(key => {
            const [section, row, seat] = key.split('-')
            return { section, row, seat }
          }),
          pricePerTicket: parsedPrice,
          totalPrice:     parsedPrice * numSelected,
          currency:       country,
          payoutAmount:   payout,
          // Required by backend — the payment method shown on the payment step
          paymentMethods: ['card'],
        }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.publicUrl) setPublicUrl(data.publicUrl)
        // Tell Sell.jsx to refetch so the new listing appears immediately
        window.dispatchEvent(new CustomEvent('resellListingCreated'))
      } else {
        const err = await res.json().catch(() => ({}))
        console.error('Listing save failed:', res.status, err)
      }
    } catch (e) { console.error('Listing save failed:', e) }
  }

  // Step navigation — clean else-if chain, no multi-state side effects
  const goForward = () => {
    if (step === 'listed')  { close(); return }
    if (step === 'payment') { setStep('listed'); createListing(); return }
    if (step === 'price')   { setStep('payment'); return }
    setStep('price')
  }
  const goBack = () => {
    if (step === 'listed')  { close();           return }
    if (step === 'payment') { setStep('price');  return }
    if (step === 'price')   { setStep('seats');  return }
    close()
  }

  // Seat summary line shown in the sub-header on price + listed steps
  const grouped = {}
  seatList.filter(s => selectedSeats.includes(seatKey(s))).forEach(s => {
    const g = `${s.section}|${s.row}`
    ;(grouped[g] = grouped[g] || []).push(s.seat)
  })
  const seatSummary = Object.keys(grouped).length === 0
    ? 'Select All'
    : Object.entries(grouped).map(([g, seats]) => {
        const [section, row] = g.split('|')
        return row === '-'
          ? `Sec ${section} (GA)`
          : `Sec ${section}, Row ${row}, Seats ${seats.join(', ')}`
      }).join(' · ')

  const titles = { seats: 'Select items to Sell', price: 'Price Your Items', payment: 'Set Payment Method', listed: 'Well Done!' }
  const subs   = { seats: 'Select Tickets', price: 'Price Your Tickets', payment: 'Select how you would like to get paid', listed: "Here's what to expect next." }

  return createPortal(
    <div className="Sell_Ticket" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div>
        {/* ── Drag-handle notch ── */}
        <div />
        {/* ── Step title ── */}
        <h1>{titles[step]}</h1>
        {/* ── Divider ── */}
        <div />
        {/* ── Sub-header row ── */}
        <div>
          <p>{subs[step]}</p>
          <div>
            <p onClick={step === 'seats' ? selectAllSeats : undefined}>
              {step === 'seats' ? 'Select All' : ''}
            </p>
            <p onClick={step === 'seats' ? deselectAllSeats : undefined}>
              {step === 'payment'
                ? <span style={{ color: 'rgb(128,128,128,.8)' }}>*Required</span>
                : step === 'seats'
                  ? 'Deselect All'
                  : seatSummary}
            </p>
          </div>
        </div>

        {/* ── Seats step ── */}
        {step === 'seats' && (
          <div className="seats">
            {seatList.map(s => {
              const key = seatKey(s)
              return (
                <div
                  key={key}
                  onClick={() => !s.sent && toggleSeat(key)}
                  style={s.sent ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
                >
                  <p>{s.row === '-' ? 'GA' : `SEAT ${s.seat}`}</p>
                  <div className={selectedSeats.includes(key) ? 'checked' : ''} />
                </div>
              )
            })}
          </div>
        )}

        {/* ── Price step ── */}
        {step === 'price' && (
          <div className="pricing">
            <p>Price per Ticket</p>
            <div>
              {/* Label uses admin-set currency; input uses DOM-level readOnly
                  (not a React prop) so state-driven re-renders don't reset it
                  mid-type. iOS anti-jump trick same as TransferAuth.jsx. */}
              <label htmlFor="price">{currency.label}</label>
              <input
                ref={inputDomRef}
                name="price"
                type="text"
                inputMode="decimal"
                value={priceValue}
                onChange={e => setPriceValue(e.target.value)}
                onTouchStart={e => { e.target.removeAttribute('readonly'); e.target.focus({ preventScroll: true }) }}
                onClick={e => e.target.removeAttribute('readonly')}
                onBlur={e => e.target.setAttribute('readonly', 'readonly')}
              />
            </div>
            <p>Events may include a resale price limit per ticket. <IoInformationCircleOutline size={18} style={{ transform: 'translate(-2px, 4px)' }} /></p>
            <p>Set Your listing Price</p>
            <p>Based on our data tickets in your section are currently listed between {currency.symbol}78.27 and {currency.symbol}130.45</p>
            <div>
              <p>YOU'LL GET PAID</p>
              {/* Updates live as the user types — priceValue drives payout via state */}
              <p>{payoutStr}</p>
              <p>Once all tickets are sold <span>How is this payout amount calculated?</span></p>
            </div>
          </div>
        )}

        {/* ── Payment step ── */}
        {step === 'payment' && (
          <div className="savings_checkings">
            <div>
              <img src={cc} alt="C_C" width={30} />
              <p>**** **** **** 8492</p>
            </div>
            <div>
              <IoAdd size={30} />
              <img src={cc} alt="C_C" width={30} />
              <p>Add New Debit Card or Checking/Savings</p>
            </div>
          </div>
        )}

        {/* ── Listed step ── */}
        {step === 'listed' && (
          <div className="Listing_Complete">
            <div>
              <div>
                <p><IoCheckmark color="#fff" style={{ border: '1px solid white', borderRadius: '50%' }} size={22} /></p>
                <p style={{ fontSize: '14px' }}>Ticket Listing Complete</p>
              </div>
            </div>
            <div>
              <div>
                <div><img src={radio} alt="_ConfirmationRadio" width={20} /></div>
                <div>
                  <p>Your ticket listing will be live shortly</p>
                  <p>We'll send you a confirmation email once your listing is live.</p>
                </div>
              </div>
              <div>
                <div><img src={pen} alt="_EditPen" width={18} /></div>
                <div>
                  <p>You can edit or delete your listing anytime</p>
                  <p>To view, edit and manage your listing, go to Listings, located in your account.</p>
                </div>
              </div>
              <div>
                <div><img src={bag} alt="_PaymentCash" width={18} /></div>
                <div>
                  <p>Your payment will automatically be deposited</p>
                  <p>Once your tickets sell, we'll automatically deposit to your {currency.label} account. Payments typically process within 5–7 business days.</p>
                </div>
              </div>
            </div>
            {publicUrl && (
              <div style={{ margin: '0 16px', padding: '12px 14px', background: 'rgb(0,0,0,.04)', borderRadius: '10px', border: '1px solid rgb(0,0,0,.1)' }}>
                <p style={{ fontSize: '11px', color: 'rgb(0,0,0,.5)', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.04em' }}>BUYER LINK</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#026CDF', wordBreak: 'break-all', flex: 1, margin: 0 }}>{publicUrl}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      })
                    }}
                    style={{ flexShrink: 0, background: copied ? '#026CDF' : 'white', border: '1px solid #026CDF', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: copied ? 'white' : '#026CDF', fontSize: '12px', transition: 'all 150ms' }}
                  >
                    {copied ? <IoCheckmark size={14} /> : <IoCopy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            <p><span>Notice:</span> Listings are subject to change. <span>View more details</span></p>
          </div>
        )}

        {/* ── Bottom action bar ── */}
        <div>
          <button
            onClick={goBack}
            style={step === 'listed' ? { background: '#026CDF', color: 'white', width: '7rem' } : undefined}
          >
            {step === 'listed' ? 'Done' : step === 'seats' ? 'Cancel Listing' : 'Select Tickets'}
          </button>
          <button
            onClick={goForward}
            style={step === 'listed' ? { border: '1px solid #026CDF', height: '2.7rem', textAlign: 'center', padding: '0 15px', transform: 'translateY(15px)', fontSize: '14px' } : undefined}
          >
            {step === 'listed' ? 'View My Listings' : 'Continue'}
            {step !== 'listed' && <IoChevronForward style={{ transform: 'translate(5px, .8px)', scale: '1.3' }} />}
          </button>
        </div>
      </div>

      {/* ── Loading overlay ── */}
      {Loading && (
        <div style={{ background: 'white', height: '65vh', width: '100%', position: 'absolute', bottom: 0, display: 'grid', zIndex: 9999, placeItems: 'center', borderRadius: '25px 25px 0 0' }}>
          <div style={{ display: 'grid', placeItems: 'center', transform: 'translateY(-3rem)' }}>
            <THREELINEROTATE />
            <p style={{ fontSize: '17px', fontFamily: 'sans-serif', transform: 'translateY(2rem)', WebkitTextStroke: '0.01em' }}>Just a moment...</p>
          </div>
        </div>
      )}

      {/* ── Resale pricing restrictions alert ── */}
      {alert && <RESALEPRICINGRESTRICTIONS close={() => setalert(false)} />}
    </div>,
    document.getElementById('popup-container')
  )
}

export default Sell_Ticket
