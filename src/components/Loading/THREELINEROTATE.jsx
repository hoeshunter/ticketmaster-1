import './Loading.css'

// ── THREELINEROTATE ──────────────────────────────────────────────────────────
// Three nested rings (purple / white / blue) sweeping like the Material
// "indeterminate" spinner. Copied from the transfer flow's "Authentication"
// loading stage (TransferAuth.jsx, stage === 'loading') so it can be reused
// anywhere. All rings rotate together while a dash sweeps around each one;
// the 0.15s stagger between rings is what makes them chase each other.
// Class names carry a tlr- prefix so they never collide with the originals.
const THREELINEROTATE = () => (
  <svg className="tlr-spinner" viewBox="0 0 50 50">
    <circle className="tlr-ring tlr-ring--purple" cx="25" cy="25" r="20" fill="none" strokeWidth="3" pathLength="100" />
    <circle className="tlr-ring tlr-ring--white"  cx="25" cy="25" r="14" fill="none" strokeWidth="3" pathLength="100" />
    <circle className="tlr-ring tlr-ring--blue"   cx="25" cy="25" r="8"  fill="none" strokeWidth="3" pathLength="100" />
  </svg>
)

export default THREELINEROTATE
