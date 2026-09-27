import { useEffect, useState } from 'react';
import './Loading.css';

export function Checkout_Payment_Loading() {

    const [darkbgdeeper, setdarkbgdeeper] = useState(0.7)
    const [showWhite, setShowWhite] = useState(false)
    const [showOverlay, setShowOverlay] = useState(false)
    const [showText, setShowText] = useState(false)

    useEffect(() => {
        const white = setTimeout(() => {
            setShowWhite(true)
        }, 4000);

        const overlay = setTimeout(() => {
            setShowOverlay(true)
        }, 5000);

        const text = setTimeout(() => {
            setShowText(true)
        }, 6500);

        const hideOverlay = setTimeout(() => {
            setShowOverlay(false)
        }, 9000);

        return () => {
            clearTimeout(white)
            clearTimeout(overlay)
            clearTimeout(text)
            clearTimeout(hideOverlay)
        }
    }, []);

    return (
        <>
            {showWhite && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    backgroundColor: 'white', 
                    zIndex: 9999 
                }} />
            )}

            {showOverlay && (
                <div className="LINEINCIRCLELOADING linecirclepayment" 
                style={{ 
                    backgroundColor: `rgba(0,0,0,${darkbgdeeper})`,
                    zIndex: 10000
                }}>
                    <div>
                        <div></div>
                        <p style={{ visibility: showText ? 'visible' : 'hidden' }}>Loading</p>
                    </div>
                </div>
            )}

            {!showWhite && (
                <div className="LINEINCIRCLELOADING linecirclepayment" 
                style={{ 
                    backgroundColor: `rgba(0,0,0,${darkbgdeeper})`
                }}>
                    <div>
                        <div></div>
                        <p>Loading</p>
                    </div>
                </div>
            )}
        </>
    )
}