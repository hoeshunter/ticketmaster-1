import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './buy.css';
import tag from './IMGS/tag.jpg';
import { LuChevronUp, LuCircleChevronDown, LuCircleChevronUp, LuMinus, LuPlus } from 'react-icons/lu';
import { MdInfo } from 'react-icons/md';
import { BsQuestionCircle } from 'react-icons/bs';
import RESERVETICKETSLOADING from '../Loading/RESERVETICKETSLOADING';
import CheckoutPreview from '../PREVIEW/checkoutpreload';
import { fetchAdminEvents } from '../../api';

export const RESERVE_DATA = {
  event: {
    name: 'WWE Friday Night SmackDown',
    day: 'Fri',
    date: 'Sep 25, 2026',
    time: '7:30 PM',
  },
  seat: {
    section: 'Balcony',
    sec: '210',
    row: '20',
    seats: '1 - 2',
    type: 'Standard Admission',
    quantity: 1,
    price_per_ticket: 5,
    ticket_limit: 2,
    description: 'Balcony',
  },
  venue: {
    name: 'Gainbridge Fieldhouse',
    city: 'Indianapolis',
    state: 'IN',
  },
  pricing: {
    subtotal_label: '2 Tickets',
    face_value_per: 0,
    service_fee: 0,
  },
  parking: [
    {
      walk: '4 min walk',
      name: '301 E. Washington St. - Presidential Place Lot',
      price: 0,
      key: 'parking1',
    },
    {
      walk: '3 min walk',
      name: '101 S. Alabama St. - 101 S. Alabama St. Lot',
      price: 0,
      key: 'parking2',
    },
  ],
  extras: [
    {
      key: 'vip',
      name: 'VIP Meet & Greet Experience',
      subtitle: '(no Main Ticket Included)',
      price: 0,
      checkout_label: 'VIP Meet & Greet Experience (no Main Ticket Included)',
      short_desc: 'Pre-Event Meet & Greet with WWE SuperStars, Pre-Ev',
      full_desc: "Pre-Event Meet & Greet with WWE SuperStars, Pre-Event Merchandise Shopping, VIP Check-In & Early, Ringside Photo Opportunity. Please note that all attendees, regardless of age, must have a VIP Meet & Greet Upgrade to participate in this event. If anyone in your group does not have a VIP Meet & Greet upgrade, they won't be allowed to attend the meet & greet event.",
    },
    {
      key: 'souvenir',
      name: 'WWE Souvenir Ticket',
      subtitle: null,
      price: 0,
      checkout_label: 'WWE Souvenir Ticket',
      short_desc: 'THIS WILL NOT BE YOUR TICKET TO THE EVENT. The lim',
      full_desc: "THIS WILL NOT BE YOUR TICKET TO THE EVENT. The limit-edition WWE Replica Ticket is your chance to capture the nostalgia of having a printed ticket delivered to you after you attend your event. All tickets will be printed on premium ticket stock, featuring exclusive WWE imagery along with the date and location of the event you attended. All WWE Replica Tickets are NON-TRANSFERABLE and will NOT be available for pickup on-site at the venue. All orders will be SHIPPED directly to the address provided to you at checkout within 4 weeks after the event you attend. Actual delivery dates will vary by location. The price includes shipping/handling and are only available to be shipped to US & Canada. Please contact i6myticket_support@i6tix.com with any issues about your order.",
    },
  ],
};



const Loading_Screen = () => {
    return (
        <div className='Loading_Screen_Reserve'>
        <div>
        <RESERVETICKETSLOADING />
        <p>Confirming Availability</p>
        </div>
        </div>
    )
}
const RESERVETICKETS = () => {

    const { uniqueLink } = useParams() || {}

    const [showTotal, setshowTotal] = useState(false)
    const [eventData, setEventData] = useState(null)

    // Reserve flow: idle → (1s tap delay) → loading 4s → checkout.
    const [phase, setphase] = useState('idle')
    const [firstLoad, setFirstLoad] = useState(true)
    const timersRef = useRef([])

    useEffect(() => {
        const t = setTimeout(() => setFirstLoad(false), 5000)
        return () => clearTimeout(t)
    }, [])

    // Helper: write fetched fields into RESERVE_DATA in place so CheckoutPreview
    // (which imports the same object reference) sees live data when it renders.
    const applyToReserveData = (mapped) => {
        Object.assign(RESERVE_DATA.event,   mapped.event)
        Object.assign(RESERVE_DATA.seat,    mapped.seat)
        Object.assign(RESERVE_DATA.venue,   mapped.venue)
        Object.assign(RESERVE_DATA.pricing, mapped.pricing)
    }

    useEffect(() => {
        if (uniqueLink) {
            // ── Public resell route: /resell/:uniqueLink ──────────────────
            // Fetch from the public listing endpoint — no auth needed.
            fetch(`/api/resell/${uniqueLink}`)
                .then(r => r.json())
                .then(listing => {
                    if (listing.error) return   // listing not found / cancelled
                    const tickets = Array.isArray(listing.tickets) ? listing.tickets : []
                    const first   = tickets[0] || {}
                    const numTickets    = tickets.length || 1
                    const pricePerTicket = listing.totalPrice / numTickets

                    // Parse "Stadium, City, State" stored by createListing
                    const [venueName = '', venueCity = '', venueState = ''] =
                        (listing.eventLocation || '').split(', ')

                    const mapped = {
                        event: {
                            name: listing.eventName  || RESERVE_DATA.event.name,
                            day:  RESERVE_DATA.event.day,
                            date: listing.eventDate  || RESERVE_DATA.event.date,
                            time: listing.eventTime  || RESERVE_DATA.event.time,
                        },
                        seat: {
                            ...RESERVE_DATA.seat,
                            sec:              first.section   || RESERVE_DATA.seat.sec,
                            row:              first.row       || RESERVE_DATA.seat.row,
                            seats:            tickets.map(t => t.seat).join(' - ') || RESERVE_DATA.seat.seats,
                            quantity:         numTickets,
                            price_per_ticket: pricePerTicket,
                            ticket_limit:     numTickets,
                            description:      venueName       || RESERVE_DATA.seat.description,
                        },
                        venue: {
                            name:  venueName  || RESERVE_DATA.venue.name,
                            city:  venueCity  || RESERVE_DATA.venue.city,
                            state: venueState || RESERVE_DATA.venue.state,
                        },
                        pricing: {
                            ...RESERVE_DATA.pricing,
                            subtotal_label: `${numTickets} Ticket${numTickets !== 1 ? 's' : ''}`,
                            face_value_per: pricePerTicket,
                            service_fee:    0,
                        },
                        parking:      RESERVE_DATA.parking,
                        extras:       RESERVE_DATA.extras,
                        _uniqueLink:  uniqueLink,
                        _listingId:   listing.id,
                    }

                    applyToReserveData(mapped)
                    setEventData(mapped)
                })
                .catch(() => {/* stay on RESERVE_DATA defaults */})

        } else {
            // ── Admin preview route: /sell ────────────────────────────────
            // Fetch the admin's first active event and map it to the shape.
            fetchAdminEvents()
                .then(events => {
                    const active = events.find(e => !e.held) || events[0]
                    if (!active) return
                    const tickets = Array.isArray(active.tickets) ? active.tickets : []
                    const first   = tickets[0] || {}

                    const mapped = {
                        event: {
                            name: active.name || RESERVE_DATA.event.name,
                            day:  active.day  || RESERVE_DATA.event.day,
                            date: active.date || RESERVE_DATA.event.date,
                            time: active.time || RESERVE_DATA.event.time,
                        },
                        seat: {
                            ...RESERVE_DATA.seat,
                            type:             first.type     || RESERVE_DATA.seat.type,
                            quantity:         first.quantity ?? RESERVE_DATA.seat.quantity,
                            price_per_ticket: first.price    ?? RESERVE_DATA.seat.price_per_ticket,
                            sec:              first.section  || RESERVE_DATA.seat.sec,
                            row:              first.row      || RESERVE_DATA.seat.row,
                            seats:            first.seats    || RESERVE_DATA.seat.seats,
                            description:      active.stadium || RESERVE_DATA.seat.description,
                        },
                        venue: {
                            name:  active.stadium || RESERVE_DATA.venue.name,
                            city:  active.city    || RESERVE_DATA.venue.city,
                            state: active.state   || RESERVE_DATA.venue.state,
                        },
                        pricing: {
                            ...RESERVE_DATA.pricing,
                            face_value_per: first.price    ?? RESERVE_DATA.pricing.face_value_per,
                            subtotal_label: `${first.quantity ?? 2} Tickets`,
                        },
                        parking:   RESERVE_DATA.parking,
                        extras:    RESERVE_DATA.extras,
                        _eventId:  active.id,
                        _orderNum: active.order_num,
                        _imageUrl: active.image_url,
                    }

                    applyToReserveData(mapped)
                    setEventData(mapped)
                })
                .catch(() => {/* fallback to RESERVE_DATA defaults silently */})
        }
    }, [uniqueLink])

    const startReserve = () => {
        if (phase !== 'idle') return   // ignore double-taps mid-flow
        timersRef.current.forEach(clearTimeout)
        setphase('delay')
        timersRef.current = [
            setTimeout(() => setphase('loading'), 1000),
            setTimeout(() => setphase('checkout'), 1000 + 8000),
        ]
    }

    useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

    // Merge live event data over the static defaults
    const data = eventData || RESERVE_DATA



    return (
        <>
        {phase === 'checkout' ? (
        <CheckoutPreview onTryAgain={() => {
            timersRef.current.forEach(clearTimeout);
            setphase('idle');
        }} />
        ) : (
        <>
        {firstLoad && (
            <div className='first_loading'>
                <div className='first-load-div'>
                    <div></div>
                    <p>One moment please...</p>
                </div>
            </div>
        )}
        <div className='RESERVETICKETS'>
            <div className='header'>
                <div className='header-blue-bg'></div>
                <p>{data.event.name}</p>
                <p className='e-time-date'><LuChevronUp strokeWidth={1.5} style={{rotate: "-90deg", transform: "translate(-9px, -10px)"}} size={30}/> {data.event.day} &#8226; {data.event.date} &#8226; {data.event.time}</p>
            </div>
            <div className='top-nav'>
                <div>
                <img src={tag} alt="Tag" width={13.5} height={20} style={{transform: "translateY(3px)"}}/>
                <p>Location</p>
                </div>
                <p>{data.seat.section} <span className='dot-icon'>&#8226;</span> Sec {data.seat.sec} <span className='dot-icon'>&#8226;</span> Row {data.seat.row}</p>
                <p>You'll get {data.seat.quantity} tickets together in this row. Select 'Reserve Tickets' to reserve them.</p>
                <p>Hide map <LuChevronUp  strokeWidth={1.1} size={30} style={{transform: "translate(0, 10px)"}}/></p>
                <hr />
                <div  className='second-nav'>
                    <div>
                <p>{data.seat.type} <MdInfo style={{background: "white", color: "#026CDF", borderRadius: "50%", transform: "translate(5px, 1.5px)", scale: "1.45"}} /></p>
                <p>${data.seat.price_per_ticket.toFixed(2)}</p>
                <p>Event ticket limit: {data.seat.ticket_limit}</p>
                    </div>
                    <div>
                        <div><LuMinus size={25} strokeWidth={2.2} /></div>
                        <p>{data.seat.quantity}</p>
                        <div><LuPlus strokeWidth={2.2} size={25}/></div>
                    </div>
                </div>
                <hr />
                <p className='description'>Description</p>
                <p>{data.seat.description}</p>
                <hr />
            </div>
            <div className='bottomNav'>
                <div></div>
                <div>
                    <div>
                        <p>SUBTOTAL</p>
                        <p>{data.pricing.subtotal_label}</p>
                    </div>
                    <div>
                        <p onClick={() => setshowTotal(!showTotal)}>${(data.pricing.face_value_per * data.seat.quantity + data.pricing.service_fee).toFixed(2)} {showTotal ? <LuCircleChevronDown size={20} strokeWidth={1.3}/> : <LuCircleChevronUp size={20} strokeWidth={1.3}/>} </p>
                    </div>
                </div>
                {showTotal && <div>
                    <div>
                        <p>Face Value x{data.seat.quantity} <BsQuestionCircle size={20} color='black' style={{transform: "translate(5px,5px)"}}/></p>
                        <p>${(data.pricing.face_value_per * data.seat.quantity).toFixed(2)}</p>
                    </div>
                    <div>
                        <p>Service Fee x{data.seat.quantity} <BsQuestionCircle size={20} color='black' style={{transform: "translate(5px,5px)"}}/></p>
                        <p>${data.pricing.service_fee.toFixed(2)}</p>
                    </div>
                </div>}
            </div>
            <button onClick={startReserve}>Reserve Tickets</button>
        </div>
        {phase === 'loading' && <Loading_Screen />}
        </>
        )}
        </>
    )
}

export default RESERVETICKETS; 