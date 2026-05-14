import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function UpdatePassword({ setView }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // This updates the password for the currently "logged in" recovery session
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("Error updating password: " + error.message);
    } else {
      setMessage("Password updated successfully!");
      // Briefly show success then redirect to the Dashboard
      setTimeout(() => setView("profile"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="screen login-gate">
      <div className="login-card glass-card">
        <div className="brand-header">
          <div className="logo-icon">🔒</div>
          <h1>Security</h1>
          <p>Set your new account password</p>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="primary shadow-btn"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && (
          <p
            className="success-message"
            style={{ color: "green", marginTop: "10px" }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
