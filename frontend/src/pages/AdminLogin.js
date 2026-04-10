import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  consconst handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("https://khajurkart1.onrender.com/api/login", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Save token
      localStorage.setItem("token", data.access_token);

      // ✅ Check admin
      if (
        data.user.email === "admin@khajurkart.com" ||
        data.user.email === "khajurkart@gmail.com"
      ) {
        localStorage.setItem("admin", "true");
        navigate("/admin/dashboard");
      } else {
        alert("Not an admin user");
      }

    } else {
      alert(data.detail || "Login failed");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};

export default AdminLogin;
