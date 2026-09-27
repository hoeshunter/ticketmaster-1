import './SecondFeeConfirmSheet.css'

// ── Gate 2 of the review-fee payment ────────────────────────────────────────
// Opened after the first ConfirmAlert is confirmed; its own Authorize tap
// starts the loading phase. All money figures are derived from
// SECOND_FEE_PER_TICKET (passed as perTicket) — nothing is hardcoded here.
const SecondFeeConfirmSheet = ({ perTicket, count, refId, onConfirm, onCancel, recipient }) => {
  const qty   = count || 1
  const total = (perTicket * qty).toFixed(2)

  return (
    <div className="sfs-layer">
      <div className="sfs-backdrop" onClick={onCancel} />
      <div className="sfs-sheet" role="dialog" aria-modal="true">
        <div className="sfs-grabber" />

        <p className="sfs-title">Authorize Review Fee</p>
        <p className="sfs-sub">Charged by Artist Management Office · Ref {refId}</p>

        <div className="sfs-rows">
          <div className="sfs-row">
            <span>Review fee</span>
            <span>${perTicket} × {qty}</span>
          </div>
          <div className="sfs-row">
            <span>Refund policy</span>
            <span>Refunded to {recipient} on transfer success</span>
          </div>
          <div className="sfs-row sfs-row--total">
            <span>Total</span>
            <span>${perTicket * 2}</span>
          </div>
        </div>

        <button className="sfs-cta" onClick={onConfirm}>
          Authorize ${perTicket * 2}
        </button>
        <button className="sfs-cancel" onClick={onCancel}>
          Not Now
        </button>
      </div>
    </div>
  )
}

export default SecondFeeConfirmSheet
