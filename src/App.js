import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom"; // ❌ Removed <Router>
import Home from "./pages/Home";
import OrderTracking from "./pages/OrderTracking";
import InventoryListPage from "./pages/InventoryView"; 
import CategoryPage from "./pages/CategoryPage";
import ProcurementPage from "./pages/ProcurementPage";
import AnalysisPage from "./pages/AnalysisPage";
import Login from "./pages/Login";
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
      {/* ✅ Navbar */}
      <nav className="navbar">
        <div className="logo">FPlus Tracker</div>

        {/* ✅ Mobile Menu Button */}
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

        {/* ✅ Navigation Links */}
        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li><Link to="/home" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/order-tracking" onClick={() => setMenuOpen(false)}>Order Tracking</Link></li>
          <li><Link to="/categories" onClick={() => setMenuOpen(false)}>View Inventory</Link></li>
          <li><Link to="/procurement" onClick={() => setMenuOpen(false)}>Procurement</Link></li>
          <li><Link to="/analysis" onClick={() => setMenuOpen(false)}>Analysis</Link></li>
          {isLoggedIn ? (
            <li><button className="logout-btn" onClick={handleLogout}>Logout</button></li>
          ) : (
            <li><Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link></li>
          )}
        </ul>
      </nav>

      {/* ✅ Page Routing */}
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/order-tracking" element={<OrderTracking userRole={userRole} />} />
        <Route path="/categories" element={<CategoryPage />} />
        <Route path="/inventory/:category" element={<InventoryListPage />} />
        <Route path="/procurement" element={<ProcurementPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
      </Routes>
    </div>
  );
};

export default App;
