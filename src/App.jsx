import './App.css'
import BottomNav from './components/Bottomnav';
import Discover from './components/Discover';
import Foryou from './components/Foryou';
import Event from './components/Event';
import Sell from './components/Sell';
import Account from './components/Account';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './admin/AdminLogin';
import AdminRegister from './admin/AdminRegister';
import AdminDashboard from './admin/AdminDashboard';
import { isLoggedIn } from './api';

const App = () => {
  const [activePage, setActivePage] = useState(0);
  const pages = [Discover, Foryou, Event, Sell, Account];
  const ActivePage = pages[activePage];

  return (
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
  );
};

const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export default App;
