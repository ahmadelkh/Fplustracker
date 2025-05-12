import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import OrderTracking from "./pages/OrderTracking";
import Login from "./pages/Login";
import AddOrder from "./pages/AddOrder";
import "./styles/App.css";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setIsLoggedIn(true);
      setUserRole(username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/login");
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">FPlus Tracker</div>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li><Link to="/home" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/order-tracking" onClick={() => setMenuOpen(false)}>Order Tracking</Link></li>
          {userRole === "manager" && (
            <li><Link to="/add-order" onClick={() => setMenuOpen(false)}>➕ Add Order</Link></li>
          )}
          {isLoggedIn ? (
            <li><button className="logout-btn" onClick={handleLogout}>Logout</button></li>
          ) : (
            <li><Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link></li>
          )}
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/order-tracking" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/order-tracking" element={<OrderTracking userRole={userRole} />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
        <Route path="/add-order" element={<AddOrder />} />
      </Routes>
    </div>
  );
};

export default App;
