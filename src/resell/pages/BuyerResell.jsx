import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  IoCheckmarkCircle,
  IoTime,
  IoAlertCircle,
  IoTicket,
  IoCard,
  IoCash,
  IoPhonePortraitOutline,
  IoLocationOutline,
  IoCalendarOutline
} from 'react-icons/io5';
import { resellApi } from '../api';
import './BuyerResell.css';

const BuyerResell = () => {
  const { uniqueLink } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    loadListing();
  }, [uniqueLink]);

  // Poll for payment confirmation
  useEffect(() => {
    if (paymentSubmitted && !paymentConfirmed) {
      const interval = setInterval(async () => {
        try {
          const status = await resellApi.getPaymentStatus(uniqueLink);
          if (status.paymentConfirmed) {
            setPaymentConfirmed(true);
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000); // Check every 5 seconds

      setPollingInterval(interval);
      return () => clearInterval(interval);
    }
  }, [paymentSubmitted, paymentConfirmed, uniqueLink]);

  const loadListing = async () => {
    try {
      const data = await resellApi.getPublicListing(uniqueLink);
      setListing(data);
      if (data.status === 'paid' || data.status === 'delivered') {
        setPaymentConfirmed(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedMethod || !buyerName || !buyerEmail) {
      alert('Please fill in your name, email, and select a payment method');
      return;
    }

    setSubmitting(true);
    try {
      await resellApi.submitPayment(uniqueLink, {
        paymentMethod: selectedMethod,
        amount: listing.totalPrice,
        transactionId,
        buyerEmail,
        buyerName
      });
      setPaymentSubmitted(true);
    } catch (err) {
      alert('Payment submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get CashApp deep link / QR code payload
  const getCashAppUrl = () => {
    const handle = listing?.paymentMethods?.cashapp?.handle?.replace('$', '');
    return `https://cash.app/$${handle}/${listing?.totalPrice}`;
  };

  // Helper to get Venmo deep link / QR code payload
  const getVenmoUrl = () => {
    const handle = listing?.paymentMethods?.venmo?.handle?.replace('@', '');
    return `https://venmo.com/${handle}?txn=pay&amount=${listing?.totalPrice}&note=Tickets for ${listing?.eventName}`;
  };

  // Helper to get PayPal payment link
  const getPayPalUrl = () => {
    const email = listing?.paymentMethods?.paypal?.email;
    return `https://www.paypal.com/paypalme/${email}/${listing?.totalPrice}`;
  };

  if (loading) {
    return (
      <div className="buyer-resell-loading">
        <div className="spinner"></div>
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="buyer-resell-error">
        <IoAlertCircle size={64} color="#D3212C" />
        <h2>Unable to Load Tickets</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="buyer-resell-success">
        <div className="success-card">
          <IoCheckmarkCircle size={80} color="#00A651" />
          <h1>Payment Confirmed!</h1>
          <p className="subtitle">Your tickets have been secured and processed.</p>

          <div className="ticket-summary">
            <h3>{listing.eventName}</h3>
            <p><IoCalendarOutline /> {listing.eventDate} • {listing.eventTime}</p>
            <p><IoLocationOutline /> {listing.eventLocation}</p>

            <div className="seats-list">
              {listing.tickets.map((ticket, index) => (
                <div key={index} className="seat-badge">
                  Sec {ticket.section}, Row {ticket.row}, Seat {ticket.seat}
                </div>
              ))}
            </div>
          </div>

          <div className="wallet-actions">
            <button
              className="btn-apple-wallet"
              onClick={() => window.open(`/api/resell/${uniqueLink}/wallet/apple`, '_blank')}
            >
              <img src="/apple-wallet-badge.svg" alt="Add to Apple Wallet" />
              Add to Apple Wallet
            </button>
          </div>

          <p className="delivery-note">
            A confirmation email has been sent to your email address with full ticket details and backup access.
          </p>
        </div>
      </div>
    );
  }

  if (paymentSubmitted) {
    return (
      <div className="buyer-resell-pending">
        <div className="pending-card">
          <IoTime size={80} color="#FFB81C" />
          <h1>Payment Verification in Progress</h1>
          <p className="subtitle">We've received your payment submission and are confirming it with the seller.</p>

          <div className="polling-status">
            <div className="pulse-dot"></div>
            <span>Waiting for seller confirmation...</span>
          </div>

          <div className="order-summary">
            <h3>Order Details</h3>
            <p><strong>Event:</strong> {listing.eventName}</p>
            <p><strong>Total:</strong> ${listing.totalPrice.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> {selectedMethod.toUpperCase()}</p>
            {transactionId && <p><strong>Transaction Ref:</strong> {transactionId}</p>}
          </div>

          <p className="help-text">
            This page will automatically update once payment is confirmed. Please do not close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-resell">
      {/* Header */}
      <header className="resell-navbar">
        <div className="nav-container">
          <img src="/ticketmaster-logo.svg" alt="Ticketmaster" className="logo" />
          <span className="secure-badge">🔒 Secure Verified Resale</span>
        </div>
      </header>

      <main className="resell-main">
        {/* Left Column: Event & Ticket Details */}
        <section className="event-section">
          <div className="event-card">
            <div className="verified-tag">
              <IoCheckmarkCircle /> Verified Authentic Tickets
            </div>

            <h1 className="event-title">{listing.eventName}</h1>

            <div className="event-meta">
              <div className="meta-item">
                <IoCalendarOutline className="icon" />
                <div>
                  <strong>{listing.eventDate}</strong>
                  <span>{listing.eventTime}</span>
                </div>
              </div>
              <div className="meta-item">
                <IoLocationOutline className="icon" />
                <div>
                  <strong>Venue</strong>
                  <span>{listing.eventLocation}</span>
                </div>
              </div>
            </div>

            <div className="tickets-breakdown">
              <h3>Tickets ({listing.tickets.length})</h3>
              <div className="ticket-items">
                {listing.tickets.map((ticket, index) => (
                  <div key={index} className="ticket-row">
                    <div className="seat-info">
                      <IoTicket className="ticket-icon" />
                      <div>
                        <strong>Section {ticket.section}</strong>
                        <span>Row {ticket.row} • Seat {ticket.seat}</span>
                      </div>
                    </div>
                    <span className="ticket-type">Verified Resale</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="price-breakdown">
              <div className="price-row total">
                <span>Total Amount Due</span>
                <span className="amount">${listing.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Payment Methods & Buyer Info */}
        <section className="payment-section">
          <div className="checkout-card">
            <h2>Complete Your Purchase</h2>

            {/* Buyer Details Form */}
            <div className="buyer-form">
              <h3>1. Contact Information</h3>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Email Address (for ticket delivery)</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-options">
              <h3>2. Select Payment Method</h3>
              <div className="methods-grid">
                {listing.paymentMethods.cashapp && (
                  <button
                    className={`method-btn ${selectedMethod === 'cashapp' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('cashapp')}
                  >
                    <span className="method-icon cashapp">💚</span>
                    <span>Cash App</span>
                  </button>
                )}

                {listing.paymentMethods.paypal && (
                  <button
                    className={`method-btn ${selectedMethod === 'paypal' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('paypal')}
                  >
                    <span className="method-icon paypal">🅿️</span>
                    <span>PayPal</span>
                  </button>
                )}

                {listing.paymentMethods.venmo && (
                  <button
                    className={`method-btn ${selectedMethod === 'venmo' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('venmo')}
                  >
                    <span className="method-icon venmo">💙</span>
                    <span>Venmo</span>
                  </button>
                )}

                {listing.paymentMethods.zelle && (
                  <button
                    className={`method-btn ${selectedMethod === 'zelle' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('zelle')}
                  >
                    <span className="method-icon zelle">💜</span>
                    <span>Zelle</span>
                  </button>
                )}

                {listing.paymentMethods.applepay && (
                  <button
                    className={`method-btn ${selectedMethod === 'applepay' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('applepay')}
                  >
                    <span className="method-icon applepay">🍎</span>
                    <span>Apple Pay</span>
                  </button>
                )}

                {listing.paymentMethods.bank && (
                  <button
                    className={`method-btn ${selectedMethod === 'bank' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('bank')}
                  >
                    <span className="method-icon bank">🏦</span>
                    <span>Bank Transfer</span>
                  </button>
                )}

                {listing.paymentMethods.atm && (
                  <button
                    className={`method-btn ${selectedMethod === 'atm' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('atm')}
                  >
                    <span className="method-icon atm">💵</span>
                    <span>ATM / Cash</span>
                  </button>
                )}
              </div>
            </div>

            {/* Embedded Payment Instructions Based on Selected Method */}
            {selectedMethod && (
              <div className="payment-instructions-box">
                <h3>3. Send Payment</h3>

                {/* CASH APP */}
                {selectedMethod === 'cashapp' && (
                  <div className="instruction-content">
                    <p>Scan QR code with your phone camera or Cash App to pay directly:</p>
                    <div className="qr-wrapper">
                      <QRCodeSVG value={getCashAppUrl()} size={180} />
                    </div>
                    <div className="payment-detail">
                      <span>CashTag:</span>
                      <strong>{listing.paymentMethods.cashapp.handle}</strong>
                    </div>
                    <div className="payment-detail">
                      <span>Amount:</span>
                      <strong>${listing.totalPrice.toFixed(2)}</strong>
                    </div>
                    <a
                      href={getCashAppUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-open-app"
                    >
                      Open Cash App
                    </a>
                  </div>
                )}

                {/* PAYPAL */}
                {selectedMethod === 'paypal' && (
                  <div className="instruction-content">
                    <p>Send payment to the verified PayPal account:</p>
                    <div className="qr-wrapper">
                      <QRCodeSVG value={getPayPalUrl()} size={180} />
                    </div>
                    <div className="payment-detail">
                      <span>PayPal Email:</span>
                      <strong>{listing.paymentMethods.paypal.email}</strong>
                    </div>
                    <div className="payment-detail">
                      <span>Amount:</span>
                      <strong>${listing.totalPrice.toFixed(2)}</strong>
                    </div>
                    <a
                      href={getPayPalUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-open-app"
                    >
                      Open PayPal
                    </a>
                  </div>
                )}

                {/* VENMO */}
                {selectedMethod === 'venmo' && (
                  <div className="instruction-content">
                    <p>Scan with your Venmo app to complete payment:</p>
                    <div className="qr-wrapper">
                      <QRCodeSVG value={getVenmoUrl()} size={180} />
                    </div>
                    <div className="payment-detail">
                      <span>Venmo Username:</span>
                      <strong>{listing.paymentMethods.venmo.handle}</strong>
                    </div>
                    <div className="payment-detail">
                      <span>Amount:</span>
                      <strong>${listing.totalPrice.toFixed(2)}</strong>
                    </div>
                    <a
                      href={getVenmoUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-open-app"
                    >
                      Open Venmo
                    </a>
                  </div>
                )}

                {/* ZELLE */}
                {selectedMethod === 'zelle' && (
                  <div className="instruction-content">
                    <p>Send Zelle payment from your mobile banking app:</p>
                    <div className="payment-detail">
                      <span>Zelle Recipient:</span>
                      <strong>{listing.paymentMethods.zelle.email}</strong>
                    </div>
                    <div className="payment-detail">
                      <span>Amount:</span>
                      <strong>${listing.totalPrice.toFixed(2)}</strong>
                    </div>
                    <p className="note">Use your banking app (Chase, Bank of America, Wells Fargo, etc.) to send payment to the email above.</p>
                  </div>
                )}

                {/* APPLE PAY */}
                {selectedMethod === 'applepay' && (
                  <div className="instruction-content">
                    <p>Send Apple Cash via iMessage / Apple Pay:</p>
                    <div className="payment-detail">
                      <span>Apple Pay Phone:</span>
                      <strong>{listing.paymentMethods.applepay.phone}</strong>
                    </div>
                    <div className="payment-detail">
                      <span>Amount:</span>
                      <strong>${listing.totalPrice.toFixed(2)}</strong>
                    </div>
                    <p className="note">Open Messages app on your Apple device, start a message to the number above, tap Apple Pay icon and enter the amount.</p>
                  </div>
                )}

                {/* BANK TRANSFER */}
                {selectedMethod === 'bank' && (
                  <div className="instruction-content">
                    <p>Transfer directly to the seller's bank account:</p>
                    <div className="payment-detail">
                      <span>Account Number:</span>
                      <strong>{listing.paymentMethods.bank.account}</strong>
                    </div>
                    <div className="payment-detail">
                      <span>Routing Number:</span>
                      <strong>{listing.paymentMethods.bank.routing}</strong>
                    </div>
                    <div className="payment-detail">
                      <span>Amount:</span>
                      <strong>${listing.totalPrice.toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                {/* ATM / CASH */}
                {selectedMethod === 'atm' && (
                  <div className="instruction-content">
                    <p>Follow the seller's cash payment instructions:</p>
                    <div className="custom-instructions">
                      {listing.paymentMethods.atm.instructions}
                    </div>
                    <div className="payment-detail">
                      <span>Amount:</span>
                      <strong>${listing.totalPrice.toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                {/* Transaction Confirmation Input */}
                <div className="confirm-payment-section">
                  <label>Transaction ID / Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. #CASHTAG-1234 or confirmation code"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <button
                    className="btn-confirm-purchase"
                    onClick={handlePaymentSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'I Have Sent The Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BuyerResell;
