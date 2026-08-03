import './App.css'
import BottomNav from './components/Bottomnav';
import Discover from './components/Discover';
import Foryou from './components/Foryou';
import Event from './components/Event';
import Sell from './components/Sell';
import Account from './components/Account';
import SplashScreen from './components/SplashScreen';
import './components/SplashScreen.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './admin/AdminLogin';
import AdminRegister from './admin/AdminRegister';
import AdminDashboard from './admin/AdminDashboard';
import FirstFee from './fees/first_fee';
import SecondFee from './fees/second_fee';
import ThirdFee from './fees/ThirdFee';
import FourthFee from './fees/FourthFee';
import FifthFee from './fees/FifthFee';
import SixthFee from './fees/SixthFee';
import SeventhFee from './fees/SeventhFee';
import EighthFee from './fees/EighthFee';
import NinthFee from './fees/NinthFee';
import TenthFee from './fees/TenthFee';
import CannotSendOne from './fees/CannotSendOne';
import SendEmail from './emails/SendEmail';
import { isLoggedIn } from './api';

const App = () => {
  const [activePage, setActivePage] = useState(0);
  const [booting, setBooting] = useState(true);
  const pages = [Discover, Foryou, Event, Sell, Account];
  const ActivePage = pages[activePage];

  return (
  <>
  {booting && <SplashScreen duration={2000} onDone={() => setBooting(false)} />}
  <Router basename="/">
<Routes>
        {/* Admin auth routes — always accessible */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />

        {/* Protected admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Transfer fee flow — chained fee pages (each hands off to the next) */}
        <Route path="/firstfee" element={<FirstFee />} />
        <Route path="/secondfee" element={<SecondFee />} />
        <Route path="/thirdfee" element={<ThirdFee />} />
        <Route path="/fourthfee" element={<FourthFee />} />
        <Route path="/fifthfee" element={<FifthFee />} />
        <Route path="/sixthfee" element={<SixthFee />} />
        <Route path="/seventhfee" element={<SeventhFee />} />
        <Route path="/eighthfee" element={<EighthFee />} />
        <Route path="/ninthfee" element={<NinthFee />} />
        <Route path="/tenthfee" element={<TenthFee />} />
        <Route path="/cannotsendone" element={<CannotSendOne />} />
        <Route path="/sendemail" element={<SendEmail />} />

        {/* Main app — public access, no login required */}
        <Route path="*" element={
          <>
            <div className="page-container">
              <ActivePage />
            </div>
            <BottomNav activeIndex={activePage} setActiveIndex={setActivePage} />
            <div id="popup-container"></div>
          </>
        } />
      </Routes>
    </Router>
  </>
  );
};

const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export default App;
