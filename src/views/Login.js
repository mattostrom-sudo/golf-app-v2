import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login({
  onLoginSuccess,
  onGoToSignup,
  onForgotPassword,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // New state
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      // App.js onAuthStateChange will handle the redirect
      if (onLoginSuccess) onLoginSuccess(data.user);
    }
    setLoading(false);
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#1b4332", marginBottom: "10px" }}>Golf Crew</h1>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Log in to track your rounds and stats.
        </p>

        <form onSubmit={handleLogin}>
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            borderTop: "1px solid #eee",
            paddingTop: "20px",
          }}
        >
          <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
            New to the group?
          </p>
          <button onClick={onGoToSignup} style={signupLinkStyle}>
            Create an Account
          </button>
          <div style={{ marginTop: "15px", textAlign: "center" }}>
            <button
              onClick={() => onForgotPassword()} // We'll pass this prop from App.js
              style={{
                background: "none",
                border: "none",
                color: "#1b4332",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ... Styles stay exactly the same as your current Login.js ...
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
const signupLinkStyle = {
  background: "none",
  border: "none",
  color: "#2d6a4f",
  fontWeight: "bold",
  fontSize: "1rem",
  cursor: "pointer",
  textDecoration: "underline",
};
