import React, { useState } from "react"; // <--- Make sure useState is here!
import { supabase } from "../supabaseClient";

export default function ForgotPassword({ onBack, onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "?view=updatePassword",
    });

    if (error) {
      alert(error.message);
    } else {
      setMessage("Check your email for the reset link!");
      setTimeout(() => onSuccess(), 3000);
    }
    setLoading(false);
  };

  return (
    <div
      className="setup-container"
      style={{
        padding: "40px 20px",
        textAlign: "center",
        backgroundColor: "white",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ color: "#1b4332" }}>Reset Password ⛳</h2>
      {message ? (
        <p style={{ color: "#2d6a4f", fontWeight: "bold" }}>{message}</p>
      ) : (
        <form
          onSubmit={handleReset}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#1b4332",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
      <button
        onClick={onBack}
        style={{
          marginTop: "20px",
          background: "none",
          border: "none",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        Back to Login
      </button>
    </div>
  );
}
