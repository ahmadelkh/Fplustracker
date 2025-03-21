import React, { useState, useEffect } from "react";
import { Route, Routes, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import OrderTracking from "./pages/OrderTracking";
import InventoryListPage from "./pages/InventoryView"; // Corrected import
import CategoryPage from "./pages/CategoryPage";
import ProcurementPage from "./pages/ProcurementPage"; // Added Procurement Page
import Analysis from "./components/Analysis";
import Login from "./pages/Login";
import "./styles/App.css";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
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
      {/* Navigation Bar */}
      <nav className="navbar">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/order-tracking">Order Tracking</Link></li>
          <li><Link to="/categories">View Inventory</Link></li>
          <li><Link to="/procurement">Procurement</Link></li> {/* New Procurement Link */}
          <li><Link to="/analysis">Analysis</Link></li>
          {isLoggedIn ? (
            <li><button className="logout-btn" onClick={handleLogout}>Logout</button></li>
          ) : (
            <li><Link to="/login">Login</Link></li>
          )}
        </ul>
      </nav>

      {/* Page Routing */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order-tracking" element={<OrderTracking userRole={userRole} />} />
        <Route path="/categories" element={<CategoryPage />} />
        <Route path="/inventory/:category" element={<InventoryListPage />} />
        <Route path="/procurement" element={<ProcurementPage />} /> {/* New Procurement Route */}
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />} />
      </Routes>
    </div>
  );
};

export default App;
