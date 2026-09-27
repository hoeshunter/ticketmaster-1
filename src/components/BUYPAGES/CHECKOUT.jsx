import { LuCircleChevronDown, LuCircleChevronUp } from 'react-icons/lu';
import HeaderImg from './IMGS/checkout_header.jpg'
import { useState } from 'react';
import { MdInfo } from 'react-icons/md';
import './buy.css';

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
const BLADES = 29, TOTAL_S = 480, SLOT_S = TOTAL_S / BLADES;

const Fans = () => {
    return (
        <div className="fan">
            <div className="ring"></div>
            {Array.from({ length: BLADES }, (_, i) => (
              <span
                key={i}
                className="blade"
                style={{
                  '--a': `${30 + i * 12}deg`,
                  '--dur': `${SLOT_S}s`,
                  '--delay': `${i * SLOT_S}s`,
                }}
              ></span>
            ))}
        </div>
    )
}


const Checkout = () => {

    const [showTotal, setshowTotal] = useState(false);
    const [{ remaining, cycle }, setClock] = useState({ remaining: TOTAL_S, cycle: 0 });



    return (
        <>
        <div className='checkout'>
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
        <div className='fans-div'>
        <p>
          {String(Math.floor(remaining / 60)).padStart(2, '0')}:
          {String(remaining % 60).padStart(2, '0')}
        </p>
        <Fans key={cycle} />
      </div>
      </div>
    </div>



            <div className="first_nav">
                <div>
                    <p>WWE FRIDAY NIGHT SMACKDOWN</p>
                <p>Fri, Sep 25, 2026 at 7:30 PM</p>
                <p>Gainbridge Fieldhouse &#8226; Indiapolis, IN</p>
                </div>
                <hr />
                <div>
                    <div>
                        <p>TICKETS</p>
                        {showTotal ? <LuCircleChevronDown size={20} strokeWidth={1.3}/> : <LuCircleChevronUp size={20} strokeWidth={1.3}/>}
                    </div>
                    <div>
                        <p>Standard Admission x 2</p>
                        <p>Sec 210 &#8226; Row 20 &#8226; Seats 7-8</p>
                        <p>
                            <MdInfo style={{background: "white", color: "#026CDF", borderRadius: "50%", transform: "translate(5px, 1.5px)", scale: "1.45"}} />
                            <span>Seats 7-8:</span> Balcony
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default Checkout;