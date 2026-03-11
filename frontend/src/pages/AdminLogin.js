import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Example admin login
    if (email === "admin@khajurkart.com" && password === "ZAAIMPEX") {
      localStorage.setItem("admin", "true");
      navigate("/admin/dashboard");
    } else {
      alert("Invalid admin credentials");
    }
  };

  return (
    <div style={{padding:"50px", textAlign:"center"}}>
      <h2>Admin Login</h2>

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <br /><br />

        <button type="submit">Login</button>

      </form>

    </div>
  );
};

export default AdminLogin;
