import { useState } from 'react'
import './Alert.css'


const RESALEPRICINGRESTRICTIONS = ({close}) => {

    // Two-step close: flip --closing so the exit animation plays, THEN
    // unmount once it's done. The 250ms matches the 0.25s alert-pop-out /
    // alert-backdrop-out keyframes in Alert.css. `closing` also guards
    // against double-taps queueing two close timers.
    const [closing, setClosing] = useState(false)

    const dismiss = () => {
        if (closing) return
        setClosing(true)
        setTimeout(() => close(), 250)
    }

    return (
        <div className={`RESALEPRICINGRESTRICTIONS${closing ? ' RESALEPRICINGRESTRICTIONS--closing' : ''}`}>
            <div>
            <p>Resale Pricing Restrictions</p>
            <p>Resale price restrictions are set by the producers of this event by seat level, at their own discretion. When listing your tickets for sale for an event, we'll help provide more information when these settings are in place.</p>
            <button onClick={dismiss}>OK</button>
            </div>
        </div>
    )
}

export default RESALEPRICINGRESTRICTIONS;
