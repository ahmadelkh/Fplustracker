import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = ({ setIsLoggedIn, setUserRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "manager" && password === "password123") {
      localStorage.setItem("username", "manager"); // ✅ Store username as "manager"
      setIsLoggedIn(true);
      setUserRole("manager"); // ✅ Set userRole to "manager"
      navigate("/order-tracking");
    } else if (username === "client" && password === "client123") {
      localStorage.setItem("username", "client"); // ✅ Store username as "client"
      setIsLoggedIn(true);
      setUserRole("client"); // ✅ Set userRole to "client"
      navigate("/order-tracking");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default Login;
