import React from "react";
import "../styles/Home.css";
import logo from "../assets/logo.png"; // Ensure you have the correct logo path

const Home = () => {
  return (
    <div className="home-container">
      <img src={logo} alt="Company Logo" className="logo" />
      <h1>Welcome to the Order Tracking System</h1>
      <p>Track your orders with ease.</p>
    </div>
  );
};

export default Home;
