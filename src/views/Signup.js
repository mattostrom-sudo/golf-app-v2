import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Signup({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: fullName, // This maps to your profiles table
        },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful! You can now log in.");
      onBack(); // Send them back to the login screen
    }
    setLoading(false);
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#1b4332", marginBottom: "10px" }}>
          Join the Crew
        </h1>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name (e.g. John Smith)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <button onClick={onBack} style={backButtonStyle}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

// ... (Use the same styles as Login.js above) ...
const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "#f8f9fa",
  padding: "20px",
};
const cardStyle = {
  background: "white",
  padding: "40px 30px",
  borderRadius: "20px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  width: "100%",
  maxWidth: "400px",
  textAlign: "center",
};
const inputStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  marginBottom: "16px",
  fontSize: "1rem",
  boxSizing: "border-box",
};
const buttonStyle = {
  width: "100%",
  padding: "14px",
  background: "#1b4332",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "bold",
  fontSize: "1rem",
  cursor: "pointer",
};
const backButtonStyle = {
  marginTop: "20px",
  background: "none",
  border: "none",
  color: "#64748b",
  cursor: "pointer",
};
