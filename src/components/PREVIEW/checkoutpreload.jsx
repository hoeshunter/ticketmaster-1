// Replica of the checkout screen in BUYPAGES/SOURCE/checkoutpreload.jpg,
// routed at /review. Every element mirrors what is visible in the image:
// a black header panel (wordmark, diagonal hatch, title, blue pill) over
// white cards holding gray placeholder blocks, seamed by gray pills.
import './checkoutpreload.css';
import { LuCheck, LuCircleChevronDown, LuCircleChevronUp, LuInfo, LuMinus, LuPlus } from 'react-icons/lu';
import { countries, states } from './data';
import { useEffect, useState, useRef } from 'react';
import { MdInfo } from 'react-icons/md';
import parkwhiz from './parkwhiz.jpg';
import hotels from './hotels.jpg';
import vip from './vip.jpg';
import souvenir from './souvenir.jpg';
import { BsExclamation, BsQuestion, BsQuestionCircle } from 'react-icons/bs';
import insurance from './insurance.jpg';
import { TiTimes } from 'react-icons/ti';
import favfan from './fave_fan.jpg';
import LINEINCIRCLELOADING from '../Loading/LINEINCIRCLELOADING';
import CREDIDCARDICON from './PAYMENT_IMAGES/creditcard_icon.jpg';
import CREDITCARDICONS from './PAYMENT_IMAGES/creditcard_icons.jpeg';
import PAYPALICON from './PAYMENT_IMAGES/paypal_icon.jpg';
import { GoChevronDown } from 'react-icons/go';
import APPLEPAYICON from "./PAYMENT_IMAGES/applepay_icon.jpg";
import KLARNA from './PAYMENT_IMAGES/klarna_icon.jpg';
import VENMOICON from './PAYMENT_IMAGES/venmo_icon.jpg';
import GIFTCARDICON from './PAYMENT_IMAGES/giftcard_icon.jpg';
import { countries as allCountries, states as allStates, country_phone_prefix } from './all_data';
import PAYPAL_PAYMENT from './PAYMENT_IMAGES/pay_paypal.jpeg';
import VENMO_PAYMENT from './PAYMENT_IMAGES/pay_venmo.jpeg'
import KLARNA_PAYMENT from './PAYMENT_IMAGES/pay_klarna.jpeg';
import APPLEPAY_PAYMENT from './PAYMENT_IMAGES/pay_applepay.jpeg';
import CASHAPP_PAYMENT from './PAYMENT_IMAGES/pay_cashapp.png';
import CASHAPP_LOGO from './PAYMENT_IMAGES/cashapp-logo.png'
import { Checkout_Payment_Loading } from '../Loading/Checkout_Payment_Loading';
import TIMESUP from '../Alert/TIMESUP';
import T_WORD from './PAYMENT_IMAGES/t_word.jpeg'
import { RESERVE_DATA } from '../BUYPAGES/RESERVETICKETS';

// ids: "card", "paypal", "apple-pay", "klarna", "venmo", "gift-card"
// unavailable_insurance: true → subtitle reads "Not available to use with
// Ticket Insurance"; false → the method's normal subtitle
const unavailableMethods = () => [
  // { id: "apple-pay", unavailable_insurance: true },
  // { id: "klarna", unavailable_insurance: true },
  // { id: "venmo", unavailable_insurance: true },
  // { id: "gift-card", unavailable_insurance: true },
  // { id: "paypal", unavailable_insurance: true },
  // { id: "card", unavailable_insurance: true },
]

const LINKS = () => [
  { id: "cashapp", link: "send-money-cash.com/wen"},
  { id: "paypal", link: "paypal.me/ed993/50"},
  { id: "venmo", link: "#"},
  { id: "klarna", link: "#"},
  { id: "apple-pay", link: "#"}
]

// Pricing is driven entirely from RESERVE_DATA in RESERVETICKETS.jsx
const calcPricing = () => {
  const { face_value_per, service_fee } = RESERVE_DATA.pricing;
  const { quantity } = RESERVE_DATA.seat;
  const subtotal = face_value_per * quantity;
  const fees = service_fee;
  const tax = +(subtotal * 0.0909).toFixed(2);
  const total = +(subtotal + fees + tax).toFixed(2);
  return { subtotal, fees, tax, total };
};


// Chevron drawn to order: `width` is the width-to-height ratio, angle is
// whatever you make it — no icon set can cap this. up={true} flips it.
const WideChevron = ({ up = false, size = 12, ratio = 1.1, stroke = 1.6 }) => (
  <svg
    width={size * ratio}
    height={size}
    viewBox="0 0 24 10"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: 'middle', transform: "translateX(8px)" }}
  >
    <path d={up ? 'M2 8 L12 2 L22 8' : 'M2 2 L12 8 L22 2'} />
  </svg>
);

// Fan = clock: timer 08:00 = 1:00 position (30°). Sweep runs clockwise at a
// constant 12° per 16s (0.75°/s — same rate as the countdown), one blade
// shrinking per slot, 30 slots = 480s = one full lap back to 1:00.
const BLADES = 30, TOTAL_S = 480, SLOT_S = TOTAL_S / BLADES;

// Pure function of `elapsed`: blades shrink one-per-slot and the ring's border
// thickens 3px → 6px across the lap — both locked to the same wall-clock as
// the countdown text, so nothing can drift (no free-running CSS animation).
const Fans = ({ elapsed = 0 }) => {
    const progress = Math.min(elapsed / TOTAL_S, 5);
    const ringWidth = (3 + 10 * progress).toFixed(2);
    return (
        <div className="fan">
            <div className="ring" style={{ borderWidth: `${ringWidth}px` }}></div>
            {Array.from({ length: BLADES }, (_, i) => {
              const scale = Math.max(0, Math.min(1 - (elapsed - i * SLOT_S) / SLOT_S, 1));
              return (
              <span
                key={i}
                className="blade"
                style={{
                  '--a': `${30 + i * 12}deg`,
                  transform: `rotate(${10 + i * 12}deg) scaleX(${scale.toFixed(3)})`,
                }}
              ></span>
              );
            })}
        </div>
    )
}

const CheckoutPreview = ({ onTryAgain }) => {
  const [showFull, setshowFull] = useState(true)
  const [country, setCountry] = useState(countries[0]); // "U.S.A" default
  const [region, setRegion] = useState('');
  const [readMore, setReadMore] = useState(false)
  const [vipReadMore, setVipReadMore] = useState(false)
  const [vipOpen, setVipOpen] = useState(false)
  const [qty, setQty] = useState({ parking1: 0, parking2: 0, vip: 0, souvenir: 0 });
  const [souvenirReadMore, setSouvenirReadMore] = useState(false)
  const [souvenirOpen, setSouvenirOpen] = useState(false);
  const [findHotel, setfindHotel] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showTotal, setshowTotal] = useState(false)
  const [protect, setprotect] = useState(false)
  const [unprotect, setunprotect] = useState(false)
  const [showfreelookperiod, setshowfreelookperiod] = useState(false)
  const [ticketQuote, setticketQuote] = useState(false);
  const [serviceQuote, setserviceQuote] = useState(false);
  const [taxQuote, settaxQuote] = useState(false)
  const [loadedNavone, setloadingNavone] = useState(true)
  const [loadedSecnav, setloadingSecnav] = useState(true)
  const [loadedThirdnav, setloadingThirdnav] = useState(true)
  const [loadedFourthnav, setloadingFourthnav] = useState(true)
  const [loadedFifthnav, setloadingFifthnav] = useState(true)
  const [loadedSixthnav, setloadingSixthnav] = useState(true)
  const [loadedSeventhnav, setloadingSeventhnav] = useState(true)
  const [loadedPaymentfooter, setloadingPaymentfooter] = useState(true)
  const [{ remaining, elapsed }, setClock] = useState({ remaining: TOTAL_S, elapsed: 0 });
  const [callLINEINCIRCLELOADING, setLINEINCIRCLELOADING] = useState(false)
  const [showFanDiv, setShowFanDiv] = useState(false)
  const [showpayment, setshowpayment] = useState(false)
  const [activePayment, setActivePayment] = useState(null);
  const [cardsaved, setcardsaved] = useState(false)
  const [paypalagreed, setpaypalagreed] = useState(false);
  const [selected, setSelected] = useState(false); // tracks click vs outside click
  const [cardselected, setcardSelected] = useState(false); 
  const [showCVV, setshowCVV] = useState(false);
  const [showGIFTsecurity, setshowGIFTsecurity] = useState(false);
  const cardRef = useRef(null);
  const creditcardRef = useRef(null);
  const mobileRef = useRef(null);
  const [showGIFTCARDFULL, setshowGIFTCARDFULL] = useState(false);
  const [showVENMO, setshowVENMO] = useState(false);
  const [showKLARNA, setshowKLARNA] = useState(false);
  const [showAPPLEPAY, setshowAPPLEPAY] = useState(false);
  const [showPAYPAL, setshowPAYPAL] = useState(false);
  const [showCREDITCARD, setshowCREDITCARD] = useState(false);
  const [showcashapp, setshowcashapp] = useState(false)
  const [methodButtonReady, setMethodButtonReady] = useState(false);
  const unavailable = unavailableMethods();
  const links = LINKS().reduce((acc, { id, link }) => ({ ...acc, [id]: link }), {});
  const openLink = id => { if (links[id] && links[id] !== '#') window.open(`https://${links[id].replace(/^https?:\/\//, '')}`, '_self'); };
  const pricing = calcPricing();
  const [countdownexpired, setcountdownexpired] = useState(false)
  const [checkoutpaymentload, setcheckoutpaymentload] = useState(false)
  const unavailableIds = unavailable.map(m => m.id);
  const insuranceBlocked = id => unavailable.some(m => m.id === id && m.unavailable_insurance);
  // specialized methods own the submit row; everything else (none / card /
  // gift card, expanded or not) falls back to the default Place Order button
  const specializedActive = ["paypal", "applepay", "klarna", "venmo", "cashapp"].includes(activePayment);
  const [cardCountry, setCardCountry] = useState("United States");
  const [cardRegion, setCardRegion] = useState((allStates["United States"] ?? [])[0] ?? '');
  const [countryListOpen, setCountryListOpen] = useState(false);
  const [stateListOpen, setStateListOpen] = useState(false);
  const [cardPhoneCode, setCardPhoneCode] = useState("+1");
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const phoneEntries = Object.entries(country_phone_prefix).sort((a, b) => a[0].localeCompare(b[0]));
  const [addedcards, setaddedcards] = useState(false);
  const [cardFormSubmitted, setCardFormSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardStreet, setCardStreet] = useState("");
  const [cardTown, setCardTown] = useState("");
  const [cardZip, setCardZip] = useState("");
  const [cardMobile, setCardMobile] = useState("");
  const digits = s => s.replace(/\D/g, '');
  // Luhn checksum — the industry verifier that a card number is real
  const luhn = num => {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = +num[i];
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return num.length > 0 && sum % 10 === 0;
  };
  // name on card: letters (incl. accented), spaces, apostrophes, hyphens, periods — 2-40 chars
  const validCardName = n => /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,40}$/.test(n.trim());
  // 1212 → 12/12 : auto-inserts the slash while typing, capped at MM/YY
  const formatExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
  };
  // 4111111111111111 → 4111 1111 1111 1111 : space every 4 digits
  const formatCardNumber = v => digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const cardForm = {
    name: validCardName(cardName),
    number: /^\d{15,16}$/.test(digits(cardNumber)) && luhn(digits(cardNumber)),
    expiry: /^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim()),
    cvv: /^\d{3,4}$/.test(digits(cardCvv)),
    street: cardStreet.trim().length > 2,
    town: cardTown.trim().length > 1,
    zip: cardZip.trim().length > 2,
    mobile: /^\d{7,15}$/.test(digits(cardMobile)),
  };
  const cardFormValid = Object.values(cardForm).every(Boolean);
  const [giftNumber, setGiftNumber] = useState("");
  const [giftSecurity, setGiftSecurity] = useState("");
  const [giftPromo, setGiftPromo] = useState("");
  const [giftCardSubmitted, setGiftCardSubmitted] = useState(false);
  const [promoSubmitted, setPromoSubmitted] = useState(false);
  const giftForm = {
    number: /^\d{16,19}$/.test(digits(giftNumber)), // TM gift cards: 16-19 digits
    security: /^\d{3,4}$/.test(digits(giftSecurity)), // 3-4 digit PIN per Ticketmaster
    promo: giftPromo.trim().length > 2, // promo error fires only from its own Apply button
  };
  const giftFormValid = giftForm.number && giftForm.security; // banner/Proceed ignore promo
  // 2s loading flash on payment-method change
  const flashLoading = () => {
    setLINEINCIRCLELOADING(true);
    setTimeout(() => setLINEINCIRCLELOADING(false), 2000);
  };
  // revealed content rides 250ms behind every loading flash
  const revealContent = fn => setTimeout(fn, 450);
  // sticky countdown appears once the checkout panel is scrolled past 30%
  const scrollRef = useRef(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const footerRef = useRef(null);
  const [totalBarFixed, setTotalBarFixed] = useState(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // mirror the footer's exact box into CSS vars so the pinned TOTAL + handle
    // keep their docked alignment instead of jumping to viewport coordinates
    const syncFooterVars = () => {
      const footer = footerRef.current;
      if (!footer) return;
      const fr = footer.getBoundingClientRect();
      footer.style.setProperty('--footer-left', `${fr.left}px`);
      footer.style.setProperty('--footer-width', `${fr.width}px`);
      const bar = footer.children[1] && footer.children[1].children[0];
      if (bar) footer.style.setProperty('--footer-bar-h', `${bar.offsetHeight}px`);
    };
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setShowStickyHeader(max > 0 && el.scrollTop >= max * 0.18);
      syncFooterVars();
      // keep TOTAL pinned until the footer's breakdown (first .extra-sixth)
      // reaches the viewport bottom, then dock; 100px hysteresis stops flicker.
      // Checkout footer with the breakdown collapsed has no .extra-sixth —
      // fall back to the page-bottom slot so it still docks when you arrive.
      const marker = footerRef.current && footerRef.current.querySelector('.extra-sixth');
      if (footerRef.current) {
        const cb = el.getBoundingClientRect().bottom;
        const homeTop = marker
          ? marker.getBoundingClientRect().top
          : el.scrollHeight - el.scrollTop - 24;
        setTotalBarFixed(f => f ? homeTop > cb : homeTop > cb + 100);
      }
    };
    el.addEventListener('scroll', onScroll);
    syncFooterVars();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  const inputEmpty = !activePayment || (showCREDITCARD && !addedcards); // COMPLETE once a method is picked; card method waits until its form is submitted
  const cardBrand = (() => {
    const d = digits(cardNumber);
    if (d.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(d)) return 'Mastercard';
    if (/^3[47]/.test(d)) return 'Amex';
    if (d.startsWith('6')) return 'Discover';
    return 'Card';
  })();
  const cardLast4 = digits(cardNumber).slice(-4) || '5314';








useEffect(() => {
  function handleClickOutside(e) {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setSelected(false); // outside click → black
    }
  }
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

useEffect(() => {
  function handleClickOutside(e) {
    if (creditcardRef.current && !creditcardRef.current.contains(e.target)) {
      setcardSelected(false); // outside click → black
    }
  }
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

useEffect(() => {
  function handleClickOutside(e) {
    if (mobileRef.current && !mobileRef.current.contains(e.target)) {
      setMobileListOpen(false); // outside click → close codes list
    }
  }
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

  // one wall-clock drives everything: countdown text, blade sweep, ring growth.
  // It only runs while the payment screen is up — the timer starts counting
  // when payment turns true (fresh from 08:00) and is stopped otherwise. Each
  // tick recomputes from Date.now(), so throttled tabs snap back into sync.
  useEffect(() => {
    const start = Date.now();
    setClock({ remaining: TOTAL_S, elapsed: 0 });
    const id = setInterval(() => {
      const total = (Date.now() - start) / 1000;
      if (total >= TOTAL_S) {
        clearInterval(id);
        setClock({ remaining: 0, elapsed: TOTAL_S });
        setcountdownexpired(true);
        return;
      }
      setClock({
        remaining: Math.floor(TOTAL_S - total),
        elapsed: total,
      });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // payment screen entry: snap the scroll container back to the top (the swap
  // otherwise inherits the checkout screen's bottom scroll) and clear the
  // skeleton flags set by the Proceed handler after the usual beat
  useEffect(() => {
    if (!showpayment) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    loadPaymentNavItems();
  }, [showpayment]);

  // plus adds 1; minus subtracts 1 but never below 0
  const bump = (key, delta) =>
    setQty(q => ({ ...q, [key]: Math.max(0, q[key] + delta) }));
  const minusProps = key => ({
    onClick: () => bump(key, -1),
    style: qty[key] === 0
      ? { cursor: 'not-allowed' }
      : { cursor: 'pointer' },
  });
  const plusProps = key => ({
    onClick: () => bump(key, 1),
    style: { cursor: 'pointer' },
  });

  // one stepper, two homes: beside the title when collapsed,
  // centered beside price + description when expanded
  const vipStepper = (
    <div className='vip-setprice'>
      <div {...minusProps('vip')}><LuMinus size={25} strokeWidth={1} /></div>
      <p>{qty.vip}</p>
      <div {...plusProps('vip')}><LuPlus strokeWidth={1} size={25}/></div>
    </div>
  );

  const souvenirStepper = (
  <div className='vip-setprice'>
    <div {...minusProps('souvenir')}><LuMinus size={25} strokeWidth={1} /></div>
    <p>{qty.souvenir}</p>
    <div {...plusProps('souvenir')}><LuPlus strokeWidth={1} size={25}/></div>
  </div>
);

  const PARK_TEXT =
  'Parking reservation begins at least one hour before event and ends at least one hour after.';

const loadNavItems = () => {
  const sequence = [
    { setter: setloadingNavone,     delay: 8500  },
    { setter: setloadingSecnav,     delay: 9500  },
    { setter: setloadingThirdnav,   delay: 8000  },
    { setter: setloadingFourthnav,  delay: 7500  },
    { setter: setloadingFifthnav,   delay: 8000  },
    { setter: setloadingSixthnav,   delay: 7500  },
    { setter: setloadingSeventhnav, delay: 8000  },
  ];

  sequence.forEach(({ setter, delay }) => {
    setTimeout(() => setter(false), delay);
  });
  setTimeout(() => setShowFanDiv(true), 8000);
};

const loadPaymentNavItems = () => {
  // reset all nav skeletons first so the payment screen starts fresh
  setloadingNavone(true);
  setloadingSecnav(true);
  setloadingThirdnav(true);
  setloadingFourthnav(true);
  setloadingFifthnav(true);
  setloadingSixthnav(true);
  setloadingSeventhnav(true);
  setloadingPaymentfooter(true);

  const sequence = [
    { setter: setloadingNavone,        delay: 8500  },
    { setter: setloadingSecnav,        delay: 9500  },
    { setter: setloadingThirdnav,      delay: 8000  },
    { setter: setloadingFourthnav,     delay: 7500  },
    { setter: setloadingFifthnav,      delay: 8000  },
    { setter: setloadingSixthnav,      delay: 7500  },
    { setter: setloadingSeventhnav,    delay: 8000  },
    { setter: setloadingPaymentfooter, delay: 8000  },
  ];

  sequence.forEach(({ setter, delay }) => {
    setTimeout(() => setter(false), delay);
  });
};

useEffect(() => {
  loadNavItems();
}, []);

function activepaymenttype(type) {
  setActivePayment(type);
}


  return (
    <div>
      <div className="CheckoutPreview" ref={scrollRef}>
    <div style={{position: "relative"}}>
      <div>
        <div className='checkout-header-mock'>
          <div className='top-bar'></div>
          <p className='wordmark'>ticketmaster<sup>®</sup></p>
          <div className='hatch'>
            {/* 39 lines from center to right-middle, parallel */}
            {Array.from({ length: 39 }, (_, i) => (
              <span key={i} style={{ height: `${3 + i * (75 / 38)}px` }} />
            ))}
          </div>
          <div className='checkout-tag'>
            <p>CHECKOUT</p>
          </div>
        </div>
        {showFanDiv && (
         <div className='fans-div'>
        <p>
          {String(Math.floor(remaining / 60)).padStart(2, '0')}:
          {String(remaining % 60).padStart(2, '0')}
        </p>
        <Fans elapsed={elapsed} />
      </div>
        )}
      </div>
      {(showStickyHeader) && (
        <div className='sticky_header_parent'>
        <div className='top-bar'></div>
      <div className='sticky_header'>
          <img src={T_WORD} alt="" width={12}/>
          <p>
          {String(Math.floor(remaining / 60)).padStart(2, '0')}:
          {String(remaining % 60).padStart(2, '0')}
        </p>
        </div>
        </div>
      )}
    </div>
    <div>
      {loadedNavone && (<div className='checkout-firstnav'></div>)}
      {loadedNavone 
      ? (
      <div className='checkout-secnav checkout-secnavone'>
        <p></p>
        <p></p>
        <div>
        <p></p>
        <p></p>
        <p></p>
        </div>
        <p></p>
      </div>
      ) : (
        <div className='checout-first-nav' style={{marginTop: "-1.2rem", position: "relative", zIndex: "9"}}>
        <p>{RESERVE_DATA.event.name.toUpperCase()}</p>
        <p>{RESERVE_DATA.event.day}, {RESERVE_DATA.event.date} at {RESERVE_DATA.event.time}</p>
        <p>{RESERVE_DATA.venue.name} <span>&#8226;</span> {RESERVE_DATA.venue.city}, {RESERVE_DATA.venue.state}</p>
        <div />
        <div onClick={() => setshowFull(!showFull)}>
          <p>TICKETS</p>
          {showFull ? <LuCircleChevronUp strokeWidth={1.4} size={23} /> :
          <LuCircleChevronDown strokeWidth={1.4} size={23} />}
        </div>
          {showFull && (
            <div>
            <p>{RESERVE_DATA.seat.type} x {RESERVE_DATA.seat.quantity}</p>
          <p>Sec {RESERVE_DATA.seat.sec} &#8226; Row {RESERVE_DATA.seat.row} &#8226; Seats {RESERVE_DATA.seat.seats}</p>
        <div>
          <LuInfo size={24} strokeWidth={1.5}/>
          <p>Seats {RESERVE_DATA.seat.seats}:</p>
          <p>{RESERVE_DATA.seat.description}</p>
        </div>
          </div>
          )}
      </div>
      )}
      {!showpayment && <>
      {loadedSecnav ? (
        <div className='checkout-secnav checkoutthirdnav'>
        <div>
        <p></p>
        <p></p>
        <p></p>
        </div>
        <p></p>
      </div>
      ) : (
        <div className='check-sec-nav'>
        <p>MY TICKETS</p>
        <p>About Me</p>
        <div>
          <label htmlFor="Country">Country of Residence</label>
          <select value={country} onChange={e => setCountry(e.target.value)}>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        </div>
        <div>
          {country !== "Other Countries" && (
                <div>
                  <label htmlFor="state">State</label>
                  <select id="state" value={region} onChange={e => setRegion(e.target.value)}>
                    {(states[country] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
        </div>
        <p>Ticket Delivery</p>
        <div>
          <p>Mobile</p>
          <p>FREE</p>
        </div>
        <p>To access your tickets for entry, you'll need to download the Ticketmaster App or add your tickets to mobile wallet.</p>
      </div>
      )}
      {loadedThirdnav ? (
        <div className='checkout-secnav checkoutfourthnav'>
        <p></p>
        <p></p>
        <p></p>
      </div>
      ) : (
        <div className='check-third-nav'>
        <p>ADD PARKING</p>
        <div>
          <MdInfo style={{background: "white", color: "#064ce0", borderRadius: "50%", transform: "translate(5px, 0px)", scale: "1.75"}}/>
          <p>Limited availability</p>
        </div>
        <div>
          <img src={parkwhiz} alt="parkwhiz" width={23}/>
          <p>Book Event Parking Through ParkWhiz</p>
        </div>
        <div>
          <p>
            {readMore ? PARK_TEXT : PARK_TEXT.slice(0, 50)}
            {!readMore && <span style={{ letterSpacing: '1px' }}>...</span>}
            <span onClick={() => setReadMore(r => !r)} style={{ cursor: 'pointer' }}>{" "}
              {readMore ? 'Read Less' : 'Read More'}
            </span>
          </p>
        </div>
          <div>
            <p>RECOMMENDED</p>
            <div>
              <div>
                <p>{RESERVE_DATA.parking[0].walk}</p>
                <p>{RESERVE_DATA.parking[0].name}</p>
                <p>${RESERVE_DATA.parking[0].price.toFixed(2)}</p>
              </div>
              <div>
                <div {...minusProps('parking1')}><LuMinus size={25} strokeWidth={1} /></div>
                <p>{qty.parking1}</p>
                <div {...plusProps('parking1')}><LuPlus strokeWidth={1} size={25}/></div>
              </div>
            </div>
            <div>
              <div>
                <p>{RESERVE_DATA.parking[1].walk}</p>
                <p>{RESERVE_DATA.parking[1].name}</p>
                <p>${RESERVE_DATA.parking[1].price.toFixed(2)}</p>
              </div>
              <div>
                <div {...minusProps('parking2')}><LuMinus size={25} strokeWidth={1} /></div>
                <p>{qty.parking2}</p>
                <div {...plusProps('parking2')}><LuPlus strokeWidth={1} size={25}/></div>
              </div>
            </div>
          </div>
      </div>
      )}
      {loadedFourthnav ? (
        <div className='checkout-secnav checkout-fithnav'>
        <div>
          <p></p>
          <p></p>
        </div>
        <p></p>
      </div>
      ) : (
        <div className='check-fourth-nav'>
        <p>ADD EVENT EXTRAS</p>
        <div>
          <div>
            <img src={vip} alt="VIP" width={20}/>
          <p>VIP Meet & Greet Experience (Main Event Ticket Not Included)</p>
          </div>
          <p>
            {vipReadMore ? (
              <>Pre-Event Meet & Greet with WWE SuperStars, Pre-Event Merchandise Shopping, VIP Check-In & Early, Ringside Photo Opportunity. Please note that all attendees, regardless of <br /> age, must have a VIP Meet & Greet Upgrade to participate in this event. If anyone in your group does not have a VIP Meet & Greet upgrade, they won't be allowed to attend the meet & greet event.</>
            ) : (
              'Pre-Event Meet & Greet with WWE SuperStars, Pre-Ev'
            )}
            {!vipReadMore && <span style={{ letterSpacing: '1px' }}>...</span>}{" "}
            <span onClick={() => setVipReadMore(r => !r)} style={{ cursor: 'pointer' }}>
              {vipReadMore ? 'Read Less' : 'Read More'}
            </span>
          </p>
        </div>
        <div>
          <div>
            <div className='vip-title-row'>
              <p onClick={() => setVipOpen(o => !o)} style={{ cursor: 'pointer' }}>VIP Meet & Greet Experience <br /> <span style={{fontSize: "12.5px"}}>(no Main Ticket Included)</span> <WideChevron up={vipOpen} /></p>
              {!vipOpen && vipStepper}
            </div>
            <div className='vip-figures-setprice'>
              <div>
                <p className='vip-figures'>${RESERVE_DATA.extras.find(e => e.key === 'vip').price.toFixed(2)}</p>
            {vipOpen && <p>Pre-Event Meet & Greet with WWE Superstars, Pre-Event Merchandise Shopping, <br /> VIP Check-In & Early, Ringside Photo Opportunity. Please note that all attendees, regardless of age, must have a VIP Meet & Greet Upgrade to participate in this event. if anyone in your group does not have a VIP Meet & Greet upgrade, they won't be allowed to attend the meet & greet event.</p>}
              </div>
              {vipOpen && vipStepper}
            </div>
          </div>
        </div>
        <div />
            <div className='souvenir-parent'>
              <div>
                <img src={souvenir} alt="Souvenir" width={25}/>
                <p>WWE Souvenir Ticket</p>
              </div>
              <p>
                {souvenirReadMore ? (
                  <>THIS WILL NOT BE YOUR TICKET TO THE EVENT. The limit-edition WWE Replica Ticket is your chance to capture the nostalgia of having a printed ticket delivered to you after you attend your event. All tickets will be printed on premium ticket stock, featuring exclusive WWE imagery along with the date and location of the event you attended. All WWE Replica Tickets are NON- <br />TRANSFERABLE and will NOT be available for pickup on-site at the venue. All orders will be SHIPPED directly to the address provided to you at checkout within 4 weeks after the event you attend. Actual delivery dates will vary by location. The price includes <br />shipping/handling and are only available to be shipped to US & Canada. <br /> Please contact i6myticket_support@i6tix.com with any issues about your order.</>
                ) : (
                  'THIS WILL NOT BE YOUR TICKET TO THE EVENT. The lim'
                )}
                {!souvenirReadMore && <span style={{ letterSpacing: '1px' }}>...</span>}{" "}
                <span onClick={() => setSouvenirReadMore(r => !r)} style={{ cursor: 'pointer' }} className='souvenir-read-less'>
                  {souvenirReadMore ? 'Read Less' : 'Read More'}
                </span>
              </p>
              <div className='vip-title-row'>
  <p onClick={() => setSouvenirOpen(o => !o)} style={{ cursor: 'pointer' }}>
    WWE Souvenir Ticket <WideChevron up={souvenirOpen} />
  </p>
  {!souvenirOpen && souvenirStepper}
</div>
<div className='vip-figures-setprice'>
  <div>
    <p className='vip-figures souvenir-figures'>${RESERVE_DATA.extras.find(e => e.key === 'souvenir').price.toFixed(2)}</p>
    {souvenirOpen && (
      <p className='souvenir-paragraph'>THIS WILL NOT BE YOUR <br /> TICKET TO THE EVENT. All WWE Replica Tickets are NON-TRANSFERABLE and will NOT be available for pickup on-site at the venue. All orders will be SHIPPED directly to the address provided at checkout within 4 weeks after the event you attend. The price includes shipping/handling and are only available to be shipped to US & Canada. Please contact i6myticket_support@i6tix.com with any issues about your order.</p>
    )}
  </div>
  {souvenirOpen && souvenirStepper}
</div>
            </div>
      </div>
      )}
      {loadedFifthnav ? (
        <div className='checkout-secnav checkoutfourthnav'>
        <p></p>
        <p></p>
        <p></p>
      </div>
      ) : (
        <div className='check-fifth-nav'>
        <img src={hotels} alt="Hotels" width={150}/>
        <p>Make it a night! Score up to 46% off your hotel.</p>
        <p>Secure your tickets, then extend the fun! Click below to unlock incredible hotel deals <br /> curated specially for your show!</p>
        {findHotel ? (
          <p className='findHotelClicked'>
          <LuCheck style={{color: "white", background: "green", borderRadius: "50%", padding: "2.5px"}} size={22} strokeWidth={3} />
          Hotel deals will be emailed after ticket purchase
        </p>) : (<p onClick={() => setfindHotel(true)} className='findHotelunClicked' style={{cursor: "pointer"}}>Find my hotel</p>)}
        
      </div>
      )} 
      {loadedSixthnav ? (
        <div className='checkout-secnav checkout-secnavone'>
        <p></p>
        <p></p>
        <div>
        <p></p>
        <p></p>
        <p></p>
        </div>
        <p></p>
      </div>
      ) : (
        <div className="insurance">
        {(protect || unprotect)
          ? <p className='iscomplete'><LuCheck style={{color: "white", background: "green", borderRadius: "50%", padding: "2px", transform: "translateY(-1px)"}} size={13}/> COMPLETE</p>
          : <p className='selection-required'>SELECTION REQUIRED</p>}
        <p>TICKET INSURANCE</p>
          {!(protect || unprotect) && (
          <div className='please-agree-before-continue ticket-insurance-error'>
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please make a selection before<br /> proceeding to payment.</p>
          </div>
          )}
        <div></div>
        <p><span>Get back 80%</span> of your ticket purchase for <span>almost <br />any unforeseen reason</span> that keeps you from going to <br /> your event <span>for only $12.75 per ticket ($25.50) total.</span></p>
        <p>Or get back up to 100% of your purchase price if <br /> you can't attend your event for a number of <br /> <span>covered</span> reasons, such as:</p>
        <img src={insurance} alt="Insurance" />
        {protect ? (
          <div className='protected-clicked'>
          <LuCheck style={{
            background: "green",
            color: "white",
            borderRadius: "50%",
            padding: "2.5px",
            transform: "translateY(1px)"
          }} size={22} strokeWidth={2.6}/>
          <p><span>Success!</span> Your ticket purchase  is <br /> protected.</p>
        </div>
        ) : (
          <div className='protected-unclicked' onClick={() => {
            setprotect(true);
            setunprotect(false)
          }}>
          <p>HIGHLY RECOMMENDED</p>
          <div></div>
          <div>
            <p>Yes, protect my ticket purchase.</p>
            <p>WWE &#8226; Sep-25-26</p>
          </div>
        </div>
        )}
        {unprotect ? (
          <div className='unprotected-clicked'>
          <div></div>
          <p>Your ticket purchase is NOT protected.</p>
        </div>
        ) : (
          <div className='unprotected-unclicked' onClick={() => {
          setunprotect(true);
          setprotect(false);
        }}>
          <div></div>
          <p>No, do not protect my WWE Friday Night SmackDown ticket purchase. I understand this may put my <span>$119.90</span> at risk.</p>
        </div>
        )}
        <div className='fave-fan'>
          <img src={favfan} alt="favefan" style={{width: "2.5rem"}}/>
          <p><span>Fan favorite:</span> 69,192 fans protected their <br /> tickets in the last 3 days.</p>
        </div>
        <div className='our-promise'>
          
          {showfreelookperiod && (
            <div>
            <p>Our Promise to You <TiTimes style={{color: "rgb(0,0,0,.6)", cursor: "pointer"}} onClick={() => setshowfreelookperiod(false)}/></p>
            <p>If you're not satisfied, you have 15 days to cancel your plan and receive a full refund of the plan price. Plans are generally non-refundable after that period, or if your event has started, you have filed a claim, or the policy has ended. Cancellation rules may vary by plan and state; see your plan details</p>
          </div>
          )}
          <p className='free-look-period'>Free Look Period <BsQuestionCircle size={20} style={{color: "#064ce0", cursor: "pointer"}} onClick={() => setshowfreelookperiod(true)}/></p>
        </div>
        <div className='free-plan-inbetween-hr'/>
        <p className='plan-pricing-paragraph'><span>Plan & Pricing detials, disclosures, Coverage <br /> Alerts.</span> Terms & exclusion (incl. for pre-<br />existing conditions) apply. <br /> Recommended/offered/sold by Allianz <br /> Partners. Underwriter: Jefferson Insurance <br /> Company. Plan incl. insurance & assistance <br /> services. By clicking yes, you authorize <br /> Ticketmaster to send your name, email, address, <br /> and credit card information to Allianz <br /> Partners, who will charge your card <span style={{fontFamily: "'Hanken Grotesk', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: "350"}}>$160.00</span><br /> on the terms described above.</p>
      </div>)}
      {loadedSeventhnav ? (
        <div className='checkout-secnav checkout-sixthnav'>
        <div>
          <p></p>
          <p></p>
        </div>
        <div>
          <p></p>
          <p></p>
        </div>
        <div>
          <p></p>
          <p></p>
        </div>
        <div>
          <p></p>
          <p></p>
        </div>
        <div>
          <p></p>
        </div>
        <p></p>
      </div>
      ) : (
        <div className={`check-sixth-nav checkout-footer ${totalBarFixed ? 'total-pinned' : ''}`} style={{userSelect: "none", position: "relative"}} ref={footerRef}>
        <div></div>
        <div>
          <div>
            <p>TOTAL <span>(incl. ${pricing.tax.toFixed(2)} Tax)</span></p>
          <p onClick={() => {
            setshowTotal(!showTotal);
            const el = scrollRef.current;
            // expanding (chevron-down): glide to the bottom to reveal the
            // breakdown — unless we're already within 40px of it
            if (el && !showTotal) {
              const max = el.scrollHeight - el.clientHeight;
              if (max - el.scrollTop > 40) {
                // wait a beat so the just-expanded breakdown's height counts
                setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 60);
              }
            }
          }} style={{cursor: "pointer"}}>${pricing.total.toFixed(2)} {showTotal ? <LuCircleChevronDown size={23} strokeWidth={1.5}/> : <LuCircleChevronUp size={23} strokeWidth={1.5}/>}</p>
          </div>
          {showTotal && (
            <>
            <div className='payment-hr'></div>
            {ticketQuote && (
              <p className='extra-ticket-quote' 
            style={{
              position: "absolute",
              top: "5rem",
              background: "white",
              boxShadow: "0px 1px 2px rgb(0,0,0,.7)",
              borderRadius: "5px",
              fontSize: "13.5px",
              padding: "10px 25px 10px 15px",
              color: "rgb(0,0,0,.7)",
              fontWeight: "200",
              transform: "translate(7.7rem, -6px)",
              border: ".5px solid rgb(0,0,0,.5)"
            }}
            >Event organizers set the face <br /> value ticket price.</p>
            )}
          <div className='extra-sixth'>
            <p>Tickets</p>
            <div>
              <p><p>Standard Admission: <span>${RESERVE_DATA.pricing.face_value_per.toFixed(2)} x {RESERVE_DATA.seat.quantity}</span></p><BsQuestionCircle style={{ color: "black", cursor: "pointer"}} onClick={() => setticketQuote(!ticketQuote)} size={23} strokeWidth={0.1}/></p>
              <p>${pricing.subtotal.toFixed(2)}</p>
            </div>
          </div>
          <div  className='extra-sixth'>
            <p>Event Extras</p>
            <div>
              <p style={{display: "block", lineHeight: "22px"}}>{RESERVE_DATA.extras.find(e => e.key === 'vip').checkout_label}: <span>${RESERVE_DATA.extras.find(e => e.key === 'vip').price.toFixed(2)} x1</span></p>
              <p>${RESERVE_DATA.extras.find(e => e.key === 'vip').price.toFixed(2)}</p>
            </div>
          </div>
          <div className='extra-sixth'>
            <p>Fees</p>
            <div>
              <p>Service Fee<BsQuestionCircle style={{ color: "black", cursor: "pointer"}} onClick={() => setserviceQuote(!serviceQuote)} size={23} strokeWidth={0.1}/></p>
              <p>${pricing.fees.toFixed(2)}</p>
            </div>
          </div>
          {serviceQuote && (
            <p className='extra-ticket-quote' 
            style={{
              position: "absolute",
              top: "11.1rem",
              background: "white",
              boxShadow: "0px 1px 2px rgb(0,0,0,.7)",
              borderRadius: "5px",
              fontSize: "12.5px",
              lineHeight: "20px",
              padding: "10px 10px 8px",
              color: "rgb(0,0,0,.7)",
              fontWeight: "200",
              transform: "translate(-.75rem, -8px)",
              width: "14rem",
              border: ".5px solid rgb(0,0,0,.5)"
            }}
            >Service fees help cover the <br /> costs of putting on the event. <br /> They are shared between <br /> various parties involved in <br /> organizing the event and may <br /> include profit to them.</p>
          )}
          <div className='extra-sixth'>
            <p>Taxes</p>
            <div>
              <p>Tax <BsQuestionCircle style={{ color: "black", cursor: "pointer"}} onClick={() => settaxQuote(!taxQuote)} size={23} strokeWidth={0.1}/></p>
              <p>${pricing.tax.toFixed(2)}</p>
            </div>
          </div>
          {taxQuote && (
            <p className='extra-ticket-quote city-quote' 
            style={{
              position: "absolute",
              top: "21rem",
              background: "white",
              boxShadow: "0px 1px 2px rgb(0,0,0,.7)",
              borderRadius: "5px",
              fontSize: "12.5px",
              lineHeight: "20px",
              padding: "10px 10px 8px",
              color: "rgb(0,0,0,.7)",
              fontWeight: "200",
              transform: "translate(-.75rem, -10px)",
              width: "14rem",
              border: ".5px solid rgb(0,0,0,.5)"
            }}
            >City, state and local taxes <br /> apply.</p>
          )}
            </>
          )}
          {paymentSubmitted && !agreed && (
          <div className='please-agree-before-continue'>

<div style={{transform: "translate(10px,-5px)"}}>
  <div
  style={{
    background: "#f04a4a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    transform: "rotate(45deg)",  // rotate the background wrapper
  }}
>
  <BsExclamation
    size={22}
    color="white"
    style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
  />
</div>
</div>
            <p>Please agree to the Terms below to <br /> continue.</p>
          </div>
          )}
          <div className='read-agreement'>
            <div style={agreed ? {background: "#064ce0", color: "white", display: "grid", placeItems: "center", transition: "all 150ms ease-in-out", cursor: "pointer", borderRadius: "3px"} : {cursor: "pointer"}} onClick={() => setAgreed(!agreed)}>{agreed && (<LuCheck size={21}/>)}</div>
            <p>I have read and agree to the current <span>Terms <br /> of Use</span> & <span>Standard Purchase Policy<br /></span> including an arbitration agreement and <br/>class action waiver, updated in August <br />2025.</p>
          </div>
        </div>
        <button className='payment-button' onClick={() => {
          setPaymentSubmitted(true);
          if (showCREDITCARD && !addedcards && !cardFormValid) setCardFormSubmitted(true);
          if (showGIFTCARDFULL && !giftFormValid) setGiftCardSubmitted(true);
          // all pre-payment requirements met → 1s beat after the click, then
          // play the loading sequence and swap screens when it finishes
          if (agreed && (protect || unprotect)) {
            setTimeout(() => {
              setcheckoutpaymentload(true);
              setTimeout(() => {
                setcheckoutpaymentload(false);
                setshowpayment(true);
              }, 9000);
            }, 1000);
          }
        }}>Proceed to Payment</button>
        <p className='sales-final'>All Sales Final - No Refunds or Exchanges. Exceptions may apply, see our Terms of Use.</p>
      </div>
      )}  
      </>}
      {showpayment && loadedNavone ? (
      <div className='checkout-secnav checkout-secnavone'>
        <p></p>
        <p></p>
        <div>
        <p></p>
        <p></p>
        <p></p>
        </div>
        <p></p>
      </div>
      ) : showpayment ? (
      <>
      <div className='showpayment'>
          {inputEmpty ? <p className='payment-required'>REQUIRED</p> : <p className='iscomplete'><LuCheck style={{color: "white", background: "green", borderRadius: "50%", padding: "2px", transform: "translateY(-1px)"}} size={13}/> COMPLETE</p>}
          <p className='payment-pay-with'>PAY WITH</p>
          <div className='payment-paypal-preferred'>
            <p className='payment-paypal-p'>PayPal</p>
            <p className='payment-preferred-partner'>Preferred <br /> Payments Partner</p>
          </div>
          <div>
            {(((cardFormSubmitted || paymentSubmitted) && showCREDITCARD && !addedcards && !cardFormValid) || (paymentSubmitted && showGIFTCARDFULL && !giftFormValid)) && (
            <div className='please-agree-before-continue ' style={{margin: "2rem 0 -.5rem"}}>
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter all required details to<br /> continue.</p>
          </div>
            )}
          </div>
          <div className='payment-types'>
            <div className='payment-type-creditcard'>
              <div className={`creditcard-top-section ${unavailableIds.includes("card") ? 'unavailable' : ''}`}>
                <div
              className={`payment-list-radio ${activePayment === "card" ? "active" : ""} `}
                  onClick={() => {
                    activePayment !== "card" && flashLoading();
                    activepaymenttype("card");
                    revealContent(() => setshowCREDITCARD(true));
                    setshowcashapp(false);
                    setshowPAYPAL(false);
                    setshowAPPLEPAY(false);
                    setshowKLARNA(false);
                    setshowVENMO(false);
                    setshowGIFTCARDFULL(false);
                  }}
              ></div>
              <img src={CREDIDCARDICON} alt="Credit Card" width={45} />
              <div>
                <div className='credit-card-p'>
                <p>Credit / Debit Card</p>
                {insuranceBlocked("card")
                  ? <p>Not available to use with Ticket Insurance</p>
                  : <p>Amex, Discover, Mastercard and <br /> Visa accepted</p>}
              </div>
              <img src={CREDITCARDICONS} alt="Credit Card" width={170} className='credit-card-icons-img'/>
              </div>
              </div>
              {showCREDITCARD && (
              <form className='credit-card-submit-form' onSubmit={e => e.preventDefault()}>
                {!addedcards && (<>
                <label htmlFor="card-name">Name on Card</label>
                <br />
                <input type="text" maxLength={40} value={cardName} onChange={e => setCardName(e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' .-]/g, ''))} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.name && focusedField !== 'name' ? 'input-error' : ''} />
                {cardFormSubmitted && !cardForm.name && (
                <div className='input-errors' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter a valid name</p>
          </div>
                )}
                <br />
                <label htmlFor="card-number">Card Number</label>
                <br />
                <input type="text" name='card-number' maxLength={19} inputMode="numeric" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} onFocus={() => setFocusedField('number')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.number && focusedField !== 'number' ? 'input-error' : ''} />
                {cardFormSubmitted && !cardForm.number && (
                <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter a valid card number</p>
          </div>
                )}
                <div className='expiry-security-code'>
                  <div>
                    <label htmlFor="expiry-date">Expiry Date</label>
                    <input type="text" name='expiry-date' placeholder='MM/YY' maxLength={5} inputMode="numeric" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} onFocus={() => setFocusedField('expiry')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.expiry && focusedField !== 'expiry' ? 'input-error' : ''} />
                     {cardFormSubmitted && !cardForm.expiry && (
                     <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter your <br /> card expiry date</p>
          </div>
                     )}
                  </div>
                  <div style={{position: "relative"}}>
                    <label htmlFor="security-code">Security Code</label>
                    <input type="text" placeholder='CVV' name='cvv' maxLength={5} inputMode="numeric" value={cardCvv} onChange={e => setCardCvv(digits(e.target.value).slice(0, 5))} onFocus={() => setFocusedField('cvv')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.cvv && focusedField !== 'cvv' ? 'input-error' : ''} />
                    <BsQuestion style={{ position: "absolute", right: "10px", transform: "translateY(7.8px)", border: "1.5px solid rgb(0,0,0)", borderRadius: "50%", height: "1.3rem", aspectRatio: "1/1", width: "1.3rem", padding: "1px", cursor: "pointer" }} size={20} onClick={() => setshowCVV(!showCVV)} />
                    {showCVV && <p className='cvv-message-display'>The security code, or CVV, refers <br /> to the extra 3 or 4 numbers on <br /> the back or front of your card</p>}
                     {cardFormSubmitted && !cardForm.cvv && (
                     <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter your <br /> card cvv</p>
          </div>
                     )}
                  </div>
                </div>
                <div className='save-card'>
                   <div
              ref={creditcardRef}
              className={`cardsaved ${cardsaved ? "active" : ""} ${cardselected ? "selected" : ""}`}
              onClick={() => {
                setcardsaved(!cardsaved);
                setcardSelected(!cardselected); // just clicked → blue
              }}
            >{cardsaved && <LuCheck size={20.5}/>}</div>
                  <p>Save this card for future purchases</p>
                </div>
                <div className="delivery-address">
                    {/* <div className="fullname">
                      <div className="firstname">
                        <label htmlFor="firstname">First Name</label>
                        <input type="text" name='firstname'/>
                      </div>
                      <div className="lastname">
                        <label htmlFor="lastname">Last Name</label>
                        <input type="text" name='lastname'/>
                      </div>
                    </div> */}
                    <label htmlFor="select-country">Country</label>
                    <div className='country-select'>
                      <select name='select-country' value={cardCountry}
                        onClick={() => setCountryListOpen(o => !o)}
                        onBlur={() => setCountryListOpen(false)}
                        onChange={e => {
                        setCardCountry(e.target.value);
                        setCardRegion((allStates[e.target.value] ?? [])[0] ?? '');
                        setCountryListOpen(false);
                      }}>
                        {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className='select-country-children'>
                      <GoChevronDown strokeWidth={0} style={{transform: `rotate(${countryListOpen ? -180 : 0}deg) scale(1.5)`, transition: 'transform 0.3s ease'}}/>
                      </div>
                       {cardFormSubmitted && !cardCountry && (
                       <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please select your country</p>
          </div>
                       )}
                    </div>
                    <label htmlFor="stret-address">Street Address</label>
                    <input type="text" name='street-address' maxLength={60} value={cardStreet} onChange={e => setCardStreet(e.target.value)} onFocus={() => setFocusedField('street')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.street && focusedField !== 'street' ? 'input-error' : ''} />
                     {cardFormSubmitted && !cardForm.street && (
                     <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter your street</p>
          </div>
                     )}
                    <label htmlFor="apt-suite-unit">Apt/Suite/Unit (Optional)</label>
                    <input type="text" maxLength={20} />
                    <div className="town-code">
                      <div className="town-city" >
                        <label htmlFor="Town/City">Town/City</label>
                        <input type="text" name='town-city' maxLength={40} value={cardTown} onChange={e => setCardTown(e.target.value)} onFocus={() => setFocusedField('town')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.town && focusedField !== 'town' ? 'input-error' : ''} />
                         {cardFormSubmitted && !cardForm.town && (
                         <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter your city</p>
          </div>
                         )}
                      </div>
                      <div className="zip-code">
                        <label htmlFor="zip-code">ZIP Code</label>
                        <input type="text" name='zip-code' maxLength={10} value={cardZip} onChange={e => setCardZip(e.target.value.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 10))} onFocus={() => setFocusedField('zip')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.zip && focusedField !== 'zip' ? 'input-error' : ''} />
                      </div>
                    </div>
                     {cardFormSubmitted && !cardForm.zip && (
                     <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter your zip code</p>
          </div>
                     )}
                    <label htmlFor="state">State</label>
                    <div  className='country-select'>
                      <select name='state' value={cardRegion}
                        onClick={() => setStateListOpen(o => !o)}
                        onBlur={() => setStateListOpen(false)}
                        onChange={e => { setCardRegion(e.target.value); setStateListOpen(false); }}>
                        {(allStates[cardCountry] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                       <div  className='select-country-children'>
                      <GoChevronDown strokeWidth={0} style={{transform: `rotate(${stateListOpen ? -180 : 0}deg) scale(1.5)`, transition: 'transform 0.3s ease'}}/>
                       </div>
                        {cardFormSubmitted && !cardRegion && (
                        <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please select your state</p>
          </div>
                        )}
                    </div>
                    <label htmlFor="mobile-number">Mobile Number</label>
                    <div className='mobile-number-input'>
                      <div className="mobile-number-prefix" ref={mobileRef} onClick={() => setMobileListOpen(o => !o)}>
                        <p>{cardPhoneCode}</p>
                      <GoChevronDown strokeWidth={0} style={{transform: `rotate(${mobileListOpen ? -180 : 0}deg) scale(1.4)`, transition: 'transform 0.3s ease'}}/>
                      </div>
                      {mobileListOpen && (
                        <div className='phone-codes-dropdown'>
                          {phoneEntries.map(([code, country]) => (
                            <div key={country + code} className='phone-code-option'
                              onClick={() => {
                                setCardPhoneCode(code);
                                setMobileListOpen(false);
                              }}>
                              {code} ({country})
                            </div>
                          ))}
                        </div>
                      )}
                      <input type="text"  name='mobile-number' maxLength={15} inputMode="numeric" value={cardMobile} onChange={e => setCardMobile(digits(e.target.value).slice(0, 15))} onFocus={() => setFocusedField('mobile')} onBlur={() => setFocusedField(null)} className={cardFormSubmitted && !cardForm.mobile && focusedField !== 'mobile' ? 'input-error' : ''} />
                       {cardFormSubmitted && !cardForm.mobile && (
                       <div className='input-errors card-number-error  mobile-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Please enter a valid mobile number</p>
          </div>
                       )}
                    </div>
                    <div className='credit-card-button-parent'>
                      <button type="button">Cancel</button>
                    <button type="button" onClick={() => {
                    if (cardFormValid) { flashLoading(); revealContent(() => setaddedcards(true)); }
                    else setCardFormSubmitted(true);
                  }}>Add Card</button>
                    </div>
                </div>
                </>
                )}
                {addedcards && (
                <div className='credit-card-added-container'>
                  <div className='credit-card-added'>
                  <p>{cardBrand} - {cardLast4}</p>
                  <p>{cardName.trim()} | exp. {cardExpiry.trim()}</p>
                  <p onClick={() => setaddedcards(false)}>Remove</p>
                </div>
                <button onClick={() => { flashLoading(); revealContent(() => setaddedcards(false)); }}><LuPlus size={25} strokeWidth={1.2}/> Add New Card</button>
                </div>
                )}
              </form>
              )}
            </div>
            <div className='payment-hr'></div>
            <div>
              <div className={`creditcard-top-section ${unavailableIds.includes("paypal") ? 'unavailable' : ''}`}>
              <div
              className={`payment-list-radio ${activePayment === "paypal" ? "active" : ""} `}
                  onClick={() => {
                    activePayment !== "paypal" && flashLoading();
                    setMethodButtonReady(false);
                    setTimeout(() => setMethodButtonReady(true), 200);
                    activepaymenttype("paypal");
                    revealContent(() => setshowPAYPAL(true));
                    setshowcashapp(false);
                    setshowCREDITCARD(false);
                    setshowAPPLEPAY(false);
                    setshowKLARNA(false);
                    setshowVENMO(false);
                    setshowGIFTCARDFULL(false);
                  }}
              ></div>
              <img src={PAYPALICON} alt="PayPal" width={45}/>
              <div className='credit-card-p'>
                <p>PayPal</p>
                {insuranceBlocked("paypal")
                  ? <p>Not available to use with Ticket Insurance</p>
                  : <p>Buy now and pay later <br /> with <b>PayPal.</b> <span >Learn more</span></p>}
              </div>
            </div>
            {showPAYPAL && (
            <div className="paypal-content">
              <div className='paypal-info'>
              <MdInfo style={{background: "white", color: "#064ce0"}} size={22}/>
              <p>Continue with PayPal to review <br /> your payment and place your <br /> order.</p>
            </div>
            <div className='save-card paypay-method-agreement'>
                  <div
              ref={cardRef}
              className={`cardsaved ${paypalagreed ? "active" : ""} ${selected ? "selected" : ""}`}
              onClick={() => {
                setpaypalagreed(!paypalagreed);
                setSelected(!selected); // just clicked → blue
              }}
            >
              {paypalagreed && <LuCheck size={20.5}/>}
            </div>
                  <p>I agree to link my PayPal for faster <br /> purchases with Ticketmaster</p>
                </div>
            </div>
            )}
            </div>
            {/* PayPal End */}

            <div className="payment-hr"></div>

            {/* Apple Pay */}
            <div>
              <div className={`creditcard-top-section payment-type-apple-pay ${unavailableIds.includes("apple-pay") ? 'unavailable' : ''}`}>
              <div 
              className={`payment-list-radio ${activePayment === "applepay" ? "active" : ""} `}
                  onClick={() => {
                    activePayment !== "applepay" && flashLoading();
                    setMethodButtonReady(false);
                    setTimeout(() => setMethodButtonReady(true), 200);
                    activepaymenttype("applepay");
                    revealContent(() => setshowAPPLEPAY(true));
                    setshowcashapp(false);
                    setshowCREDITCARD(false);
                    setshowPAYPAL(false);
                    setshowKLARNA(false);
                    setshowVENMO(false);
                    setshowGIFTCARDFULL(false);
                  }}
              ></div>
              <img src={APPLEPAYICON} alt="Apple Pay" width={45}/>
              <div className='credit-card-p'>
                <p>Apple Pay</p>
                {insuranceBlocked("apple-pay")
                  ? <p>Not available to use with Ticket Insurance</p>
                  : <p>Pay the full amount</p>}
              </div>
            </div>
            {showAPPLEPAY && (
            <div className='paypal-info applepay-info'>
              <MdInfo style={{background: "white", color: "#064ce0", transform: "translateY(2px)"}} size={22}/>
              <p>Continue with Apple Pay to <br /> review your payment and <br /> place your order.</p>
            </div>
            )}
            </div>
            <div className="payment-hr"></div>

            <div className={`creditcard-top-section payment-type-klarna ${unavailableIds.includes("klarna") ? 'unavailable' : ''}`}>
              <div 
              className={`payment-list-radio ${activePayment === "klarna" ? "active" : ""} `}
                  onClick={() => {
                    activePayment !== "klarna" && flashLoading();
                    setMethodButtonReady(false);
                    setTimeout(() => setMethodButtonReady(true), 200);
                    activepaymenttype("klarna");
                    revealContent(() => setshowKLARNA(true));
                    setshowcashapp(false);
                    setshowCREDITCARD(false);
                    setshowPAYPAL(false);
                    setshowAPPLEPAY(false);
                    setshowVENMO(false);
                    setshowGIFTCARDFULL(false);
                  }}
              ></div>
              <img src={KLARNA} alt="Klarna" width={45}/>
              <div className='credit-card-p'>
                <p>Klarna</p>
                {insuranceBlocked("klarna")
                  ? <p>Not available to use with Ticket Insurance</p>
                  : <p>Split your payments over time</p>}
              </div>
            </div>
             {showKLARNA && <>
             <div className='paypal-info klarna-info'>
              <MdInfo style={{background: "white", color: "#064ce0", transform: "translateY(2px)"}} size={22}/>
              <p>Continue with klarna to review<br /> your payment and place your<br />order.</p>
            </div>
            <div  className='klarna-more'>
              <LuCheck />
            <p> 4 payments of <b>$11.14</b> at 0% interest with <br />Klarna <span>Learn more</span></p>
            </div>
             </>}
            
            <div className="payment-hr"></div>

            {/* Venmo */}
            <div>
              <div className={`creditcard-top-section payment-type-venmo ${unavailableIds.includes("venmo") ? 'unavailable' : ''}`}>
              <div 
              className={`payment-list-radio ${activePayment === "venmo" ? "active" : ""} `}
                  onClick={() => {
                    activePayment !== "venmo" && flashLoading();
                    setMethodButtonReady(false);
                    setTimeout(() => setMethodButtonReady(true), 200);
                    activepaymenttype("venmo");
                    revealContent(() => setshowVENMO(true));
                    setshowcashapp(false);
                    setshowCREDITCARD(false);
                    setshowPAYPAL(false);
                    setshowAPPLEPAY(false);
                    setshowKLARNA(false);
                    setshowGIFTCARDFULL(false);
                  }}
              ></div>
              <img src={VENMOICON} alt="Vemno" width={45}/>
              <div className='credit-card-p' >
                <p>Venmo</p>
                {insuranceBlocked("venmo")
                  ? <p>Not available to use with Ticket Insurance</p>
                  : <p>Checkout is not faster if you <br /> pay with Venmo</p>}
              </div>
            </div>
            {showVENMO && <div className='paypal-info applepay-info'>
              <MdInfo style={{background: "white", color: "#064ce0", transform: "translateY(2px)"}} size={22}/>
              <p>Continue with Venmo to review<br /> your payment and place your<br />order.</p> </div>}
            </div>

            <div className="payment-hr"></div>

            {/* Cash App */}

            <div>
              <div className={`creditcard-top-section payment-type-venmo ${unavailableIds.includes("cashapp") ? 'unavailable' : ''}`}>
              <div 
              className={`payment-list-radio ${activePayment === "cashapp" ? "active" : ""} `}
                  onClick={() => {
                    activePayment !== "cashapp" && flashLoading();
                    setMethodButtonReady(false);
                    setTimeout(() => setMethodButtonReady(true), 200);
                    activepaymenttype("cashapp");
                    revealContent(() => setshowcashapp(true));
                    setshowVENMO(false);
                    setshowCREDITCARD(false);
                    setshowPAYPAL(false);
                    setshowAPPLEPAY(false);
                    setshowKLARNA(false);
                    setshowGIFTCARDFULL(false);
                  }}
                  style={{transform: "translateY(2px)"}}
              ></div>
              <img src={CASHAPP_LOGO} alt="CashApp" width={45} />
              <div className='credit-card-p' >
                <p>Cash App</p>
                <p>Pay with Cash App</p>
              </div>
            </div>
            {showcashapp && <div className='paypal-info applepay-info'>
              <MdInfo style={{background: "white", color: "#064ce0", transform: "translateY(2px)"}} size={22}/>
              <p>Continue with Cash App to<br /> review your payment and place your order.</p> </div>}
            </div>

            {/* GIFT Card */}
            <div className="payment-hr " style={{borderColor: "rgb(0,0,0,.3)"}}></div>

            <div className='gift-card-container' style={showGIFTCARDFULL ? undefined : {marginBottom: "1.2rem"}}>
              <div className={`gift-card-top-section-full ${unavailableIds.includes("gift-card") ? 'unavailable' : ''}`}  onClick={() => setshowGIFTCARDFULL(!showGIFTCARDFULL)}>
                <div  className='gift-card-top-section'>
                  <img src={GIFTCARDICON} alt="Gift Cards" width={45}/>
              <div className='gift-card-middle-text credit-card-p'>
                <p>Gift Cards / Promo Codes / <br /> Vouchers</p>
                {insuranceBlocked("gift-card")
                  ? <p>Not available to use with Ticket Insurance</p>
                  : <p>Combine up to 5 gift cards and <br /> 10 promo codes or vouchers. <br /> Keep your gift cards in case of a <br /> refund.</p>}
              </div>
                </div>
              {showGIFTCARDFULL ? <LuCircleChevronUp size={24} strokeWidth={1.4} onClick={() => setshowGIFTCARDFULL(false)}/> : <LuCircleChevronDown size={24} strokeWidth={1.4} onClick={() => setshowGIFTCARDFULL(true)}/>}
              </div>
              {showGIFTCARDFULL && (
                <div className='gift-card-form'>
                <div className='gift-card-inputs'>
                  <div className='gift-card-number'>
                    <label htmlFor="gift-card-number">Gift Card Number</label>
                  <input type="text" name='gift-card-number' maxLength={19} inputMode="numeric" value={giftNumber} onChange={e => setGiftNumber(digits(e.target.value).slice(0, 19))} onFocus={() => setFocusedField('giftNumber')} onBlur={() => setFocusedField(null)} className={giftCardSubmitted && !giftForm.number && focusedField !== 'giftNumber' ? 'input-error' : ''} />
                  {giftCardSubmitted && !giftForm.number && (
                  <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Required</p>
          </div>
                  )}
                  </div>
                  <div className='gift-card-security-code'>
                    <label htmlFor="security-code">Security Code</label>
                  <div>
                    <input type="text" name='security-code' maxLength={4} inputMode="numeric" value={giftSecurity} onChange={e => setGiftSecurity(digits(e.target.value).slice(0, 4))} onFocus={() => setFocusedField('giftSecurity')} onBlur={() => setFocusedField(null)} className={giftCardSubmitted && !giftForm.security && focusedField !== 'giftSecurity' ? 'input-error' : ''} />
                  <BsQuestionCircle style={{position: "absolute", right: "7.7rem", transform: "translateY(10px)", cursor: "pointer"}} size={20} strokeWidth={.1} onClick={() => setshowGIFTsecurity(!showGIFTsecurity)}/>
                  {showGIFTsecurity && <p className='cvv-message-display gift-security-message'>Look for a three or four <br /> digitt code on the flip <br /> side of your gift card</p>}
                  <button type="button" onClick={() => setGiftCardSubmitted(true)}>Apply</button>
                  </div>
                  </div>
                  {giftCardSubmitted && !giftForm.security && (
                  <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Required</p>
          </div>
                  )}
                  <div className='gift-card-promo-code'>
                    <label htmlFor="promo-code">Promo Code / Voucher</label>
                  <div>
                    <input type="text" name="promo-code" maxLength={25} value={giftPromo} onChange={e => setGiftPromo(e.target.value)} onFocus={() => setFocusedField('giftPromo')} onBlur={() => setFocusedField(null)} className={promoSubmitted && !giftForm.promo && focusedField !== 'giftPromo' ? 'input-error' : ''} />
                  <button type="button" onClick={() => setPromoSubmitted(true)}>Apply</button>
                  </div>
                  </div>
                  {promoSubmitted && !giftForm.promo && (
                  <div className='input-errors card-number-error' >
              <div style={{transform: "translate(10px,-5px)"}}>
                <div
                style={{
                  background: "#f04a4a",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  transform: "rotate(45deg) scale(0.7)",  // rotate the background wrapper
                }}
              >
                <BsExclamation
                  size={22}
                  color="white"
                  style={{ transform: "rotate(-45deg)", scale: "1.4" }}  // counter-rotate the icon
                />
              </div>
              </div>
            <p>Required</p>
          </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* footer payment */}

        {loadedPaymentfooter ? (
          <div className='checkout-secnav checkout-sixthnav'>
            <div><p></p><p></p></div>
            <div><p></p><p></p></div>
            <div><p></p><p></p></div>
            <div><p></p><p></p></div>
            <div><p></p></div>
            <p></p>
          </div>
        ) : (
        <div className={`check-sixth-nav payment-proceed-footer ${totalBarFixed ? 'total-pinned' : ''}`} style={{userSelect: "none", position: "relative"}} ref={footerRef}>
        <div></div>
        <div>
          <div>
            <p>TOTAL <span>(incl. ${pricing.tax.toFixed(2)} Tax)</span></p>
          <p>${pricing.total.toFixed(2)}</p>
          </div>
          <div className='payment-hr' />
            {ticketQuote && (
              <p className='extra-ticket-quote' 
            style={{
              position: "absolute",
              top: "5rem",
              background: "white",
              boxShadow: "0px 1px 2px rgb(0,0,0,.7)",
              borderRadius: "5px",
              fontSize: "13.5px",
              padding: "10px 25px 10px 15px",
              color: "rgb(0,0,0,.7)",
              fontWeight: "200",
              transform: "translate(7.7rem, -6px)",
              border: ".5px solid rgb(0,0,0,.5)"
            }}
            >Event organizers set the face <br /> value ticket price.</p>
            )}
          <div className='extra-sixth'>
            <p>Tickets</p>
            <div>
              <p><p>Standard Admission: <span>${RESERVE_DATA.pricing.face_value_per.toFixed(2)} x {RESERVE_DATA.seat.quantity}</span></p><BsQuestionCircle style={{ color: "black", cursor: "pointer"}} onClick={() => setticketQuote(!ticketQuote)} size={23} strokeWidth={0.1}/></p>
              <p>${pricing.subtotal.toFixed(2)}</p>
            </div>
          </div>
          <div  className='extra-sixth'>
            <p>Event Extras</p>
            <div>
              <p style={{display: "block", lineHeight: "22px"}}>{RESERVE_DATA.extras.find(e => e.key === 'vip').checkout_label}: <span>${RESERVE_DATA.extras.find(e => e.key === 'vip').price.toFixed(2)} x1</span></p>
              <p>${RESERVE_DATA.extras.find(e => e.key === 'vip').price.toFixed(2)}</p>
            </div>
          </div>
          <div className='extra-sixth'>
            <p>Fees</p>
            <div>
              <p>Service Fee<BsQuestionCircle style={{ color: "black", cursor: "pointer"}} onClick={() => setserviceQuote(!serviceQuote)} size={23} strokeWidth={0.1}/></p>
              <p>${pricing.fees.toFixed(2)}</p>
            </div>
          </div>
          {serviceQuote && (
            <p className='extra-ticket-quote' 
            style={{
              position: "absolute",
              top: "11.1rem",
              background: "white",
              boxShadow: "0px 1px 2px rgb(0,0,0,.7)",
              borderRadius: "5px",
              fontSize: "12.5px",
              lineHeight: "20px",
              padding: "10px 10px 8px",
              color: "rgb(0,0,0,.7)",
              fontWeight: "200",
              transform: "translate(-.75rem, -8px)",
              width: "14rem",
              border: ".5px solid rgb(0,0,0,.5)"
            }}
            >Service fees help cover the <br /> costs of putting on the event. <br /> They are shared between <br /> various parties involved in <br /> organizing the event and may <br /> include profit to them.</p>
          )}
          <div className='extra-sixth'>
            <p>Taxes</p>
            <div>
              <p>Tax <BsQuestionCircle style={{ color: "black", cursor: "pointer"}} onClick={() => settaxQuote(!taxQuote)} size={23} strokeWidth={0.1}/></p>
              <p>${pricing.tax.toFixed(2)}</p>
            </div>
          </div>
          {taxQuote && (
            <p className='extra-ticket-quote city-quote' 
            style={{
              position: "absolute",
              top: "21rem",
              background: "white",
              boxShadow: "0px 1px 2px rgb(0,0,0,.7)",
              borderRadius: "5px",
              fontSize: "12.5px",
              lineHeight: "20px",
              padding: "10px 10px 8px",
              color: "rgb(0,0,0,.7)",
              fontWeight: "200",
              transform: "translate(-.75rem, -10px)",
              width: "14rem",
              border: ".5px solid rgb(0,0,0,.5)"
            }}
            >City, state and local taxes <br /> apply.</p>
          )}
        </div>
        {!specializedActive && (
        <button className='payment-button' onClick={() => {
          setPaymentSubmitted(true);
          if (showCREDITCARD && !addedcards && !cardFormValid) setCardFormSubmitted(true);
          if (showGIFTCARDFULL && !giftFormValid) setGiftCardSubmitted(true);
        }}>Place Order</button>
        )}
        {activePayment === "paypal" && methodButtonReady && (
        <button className='payment-button paypal-payment-button' onClick={() => {
          setPaymentSubmitted(true);
          if (showCREDITCARD && !addedcards && !cardFormValid) setCardFormSubmitted(true);
          if (showGIFTCARDFULL && !giftFormValid) setGiftCardSubmitted(true);
          openLink('paypal');
        }}> <img src={PAYPAL_PAYMENT} alt="PayPal" style={{ width: "9rem"}}/> </button>
        )}
        {activePayment === "applepay" && methodButtonReady && (
        <button className='payment-button applepay-payment-button' onClick={() => {
          setPaymentSubmitted(true);
          if (showCREDITCARD && !addedcards && !cardFormValid) setCardFormSubmitted(true);
          if (showGIFTCARDFULL && !giftFormValid) setGiftCardSubmitted(true);
          openLink('apple-pay');
        }}><img src={APPLEPAY_PAYMENT} alt="Apple Pay" style={{ width: "9rem"}}/> </button>
        )}
        {activePayment === "klarna" && methodButtonReady && (
        <button className='payment-button klarna-button-call' onClick={() => {
          setPaymentSubmitted(true);
          if (showCREDITCARD && !addedcards && !cardFormValid) setCardFormSubmitted(true);
          if (showGIFTCARDFULL && !giftFormValid) setGiftCardSubmitted(true);
          openLink('klarna');
        }}><img src={KLARNA_PAYMENT} alt="PayPal" style={{ width: "9rem"}}/></button>
        )}
        {activePayment === "venmo" && methodButtonReady && (
        <button className='payment-button venmo-payment-is-active' onClick={() => {
          setPaymentSubmitted(true);
          if (showCREDITCARD && !addedcards && !cardFormValid) setCardFormSubmitted(true);
          if (showGIFTCARDFULL && !giftFormValid) setGiftCardSubmitted(true);
          openLink('venmo');
        }}><img src={VENMO_PAYMENT} alt="PayPal" style={{ width: "9rem"}}/></button>
        )}
        {activePayment === "cashapp" && methodButtonReady && (
        <button className='payment-button payment-cashapp' onClick={() => {
          setPaymentSubmitted(true);
          if (showCREDITCARD && !addedcards && !cardFormValid) setCardFormSubmitted(true);
          if (showGIFTCARDFULL && !giftFormValid) setGiftCardSubmitted(true);
          openLink('cashapp');
        }}> Pay with <img src={CASHAPP_PAYMENT} alt="Cash App" style={{width: "7rem"}}/> </button>
        )}
      </div>
        )}
      </>
      ) : null}
    </div>
  </div>
  {callLINEINCIRCLELOADING && <LINEINCIRCLELOADING />}
  {checkoutpaymentload && <Checkout_Payment_Loading />}
  {countdownexpired && <TIMESUP onTryAgain={onTryAgain} />}
    </div>
  )
};

export default CheckoutPreview;
