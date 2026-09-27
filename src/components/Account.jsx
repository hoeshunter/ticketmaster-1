import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, getAdminInfo, logout } from '../api';
import { IoPerson, IoLogOut, IoGrid, IoChevronForward, IoShieldCheckmark } from 'react-icons/io5';
import img1 from '../imgs/account.jpg';
import img2 from '../imgs/account2.jpg';


const Account = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [showadmin, setshowadmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => {
      const status = isLoggedIn();
      setLoggedIn(status);
      if (status) setAdmin(getAdminInfo());
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setAdmin(null);
  };

  return (
    <div className="account-container">
      {showadmin ? (
        <div className="account-page">

      {/* ── Header ── */}
      <div className="account-header">
        <p className="account-title">Account</p>
      </div>

      {/* ── Admin Portal Card ── */}
      <div className="account-section">
        <p className="account-section-label">ADMIN PORTAL</p>

        {loggedIn && admin ? (
          <>
            {/* Signed in state */}
            <div className="account-card">
              <div className="account-card-row account-admin-info">
                <div className="account-avatar">
                  <IoPerson size={22} color="#667eea" />
                </div>
                <div className="account-admin-text">
                  <p className="account-admin-name">{admin.username}</p>
                  <p className="account-admin-role">Administrator</p>
                </div>
                <IoShieldCheckmark size={20} color="#4caf50" />
              </div>
            </div>

            <div className="account-card account-card-actions">
              <button
                className="account-card-row account-action-row"
                onClick={() => navigate('/admin/dashboard')}
              >
                <IoGrid size={20} color="#667eea" />
                <span className="account-action-label">Go to Dashboard</span>
                <IoChevronForward size={16} color="#ccc" />
              </button>
              <button
                className="account-card-row account-action-row"
                onClick={() => setshowadmin(false)}
              >
                <IoGrid size={20} color="#667eea" />
                <span className="account-action-label">Switch back to account display</span>
                <IoChevronForward size={16} color="#ccc" />
              </button>

              <div className="account-divider" />

              <button
                className="account-card-row account-action-row account-logout-row"
                onClick={handleLogout}
              >
                <IoLogOut size={20} color="#e53935" />
                <span className="account-action-label account-action-danger">Sign Out</span>
                <IoChevronForward size={16} color="#ccc" />
              </button>
            </div>
          </>
        ) : (
          /* Signed out state */
          <div className="account-card">
            <div className="account-signin-content">
              <div className="account-avatar account-avatar-lg">
                <IoPerson size={30} color="#aaa" />
              </div>
              <p className="account-signin-title">Admin Sign In</p>
              <p className="account-signin-sub">
                Sign in to manage your events and tickets
              </p>
              <button
                className="account-signin-btn"
                onClick={() => navigate('/admin')}
              >
                Sign In to Admin Portal
              </button>
              <button
                className="account-register-btn"
                onClick={() => navigate('/admin/register')}
              >
                Create Admin Account
              </button>
            </div>
          </div>
        )}
      </div>

    </div>) : (
        <div style={{
          color: "white",
          position: "relative"
        }} >
          <p className='static-account' onClick={() => setshowadmin(true)}>Account</p>
          <div className="account-page-topbar">
          <p>Priscillia Thach</p>
          <p>priscilliathack63@gmail.com</p>
          </div>
          <img src={img1} alt="Profile" className="account-profile-pic" style={{width:"100%", marginTop: "25px"}}/>
          <img src={img2} alt="Background" className="account-backgroundclass" style={{width:"100%", transform: "translateY(-10px)", marginBottom:"-13px"}}/>

        </div>
      )}
    </div>
  );
};

export default Account;
