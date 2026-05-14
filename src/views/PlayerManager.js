import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function PlayerManager({ players = [], onClose, onUpdate }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "", // Added for Magic Link
    initial_handicap: 0,
    is_member: true,
    is_birdie_bet: false,
    venmo_handle: "",
    phone_number: "",
  });

  // --- NEW STATE FOR INVITE PROMPT ---
  const [showInvitePrompt, setShowInvitePrompt] = useState(false);
  const [invitedPlayer, setInvitedPlayer] = useState(null);

  // --- NEW SMS INVITE HANDLERS ---
  const handleSendInviteText = () => {
    if (!invitedPlayer) return;

    // REPLACE THIS WITH YOUR ACTUAL DEPLOYED APP LINK
    const appUrl = "https://your-golf-app-url.com/signup";

    const message = `Hey ${invitedPlayer.name}! I just added you to our golf group. Create your profile here to track your stats and payouts: ${appUrl}`;
    const encodedMsg = encodeURIComponent(message);

    // Launch the text message with the phone number pre-filled
    window.location.href = `sms:${invitedPlayer.phone}?&body=${encodedMsg}`;

    // Close the modal
    setShowInvitePrompt(false);
    setInvitedPlayer(null);
  };
  const sendManualMagicLink = async (player) => {
    if (!player.email) {
      alert("This player doesn't have an email address saved.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: player.email,
      options: {
        // Make sure this matches your actual site URL
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert(`Magic Link sent to ${player.email}!`);
    }
  };
  const handleSkipInvite = () => {
    setShowInvitePrompt(false);
    setInvitedPlayer(null);
  };

  const handleSave = async () => {
    // Helper to convert empty strings or just whitespace to null
    const nullify = (val) => {
      if (!val) return null;
      const trimmed = val.trim();
      return trimmed === "" ? null : trimmed;
    };

    const payload = {
      full_name: formData.full_name.trim(),
      email: nullify(formData.email?.toLowerCase()),
      initial_handicap: parseFloat(formData.initial_handicap) || 0,
      calculated_handicap: parseFloat(formData.initial_handicap) || 0,
      is_member: formData.is_member,
      is_birdie_bet: formData.is_birdie_bet,
      // Clean Venmo: remove @, then nullify if empty
      venmo_handle: nullify(formData.venmo_handle.replace("@", "")),
      // Clean Phone: remove non-digits, then nullify if empty
      phone_number: nullify(formData.phone_number.replace(/\D/g, "")),
    };

    // Validation: Ensure we at least have a name
    if (!payload.full_name) {
      alert("Full Name is required");
      return;
    }

    try {
      let result;
      const isNewPlayer = !editingPlayer;

      if (editingPlayer) {
        result = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", editingPlayer.id);
      } else {
        // Note: If your Supabase table has 'id' set to 'gen_random_uuid()',
        // you can actually omit the ID here and let Supabase handle it.
        result = await supabase.from("profiles").insert([payload]);
      }

      if (result.error) throw result.error;

      alert("Player saved successfully!");

      setEditingPlayer(null);
      setFormData({
        full_name: "",
        email: "", // Reset state
        initial_handicap: 0,
        is_member: true,
        is_birdie_bet: false,
        venmo_handle: "",
        phone_number: "",
      });

      if (onUpdate) await onUpdate();

      // Trigger the invite prompt if it's a new player and they have a phone number
      if (isNewPlayer && payload.phone_number) {
        setInvitedPlayer({
          name: payload.full_name,
          phone: payload.phone_number,
        });
        setShowInvitePrompt(true);
      }
    } catch (err) {
      console.error("Database Error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div
      className="screen"
      style={{
        padding: "60px 20px",
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "10px 15px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            background: "white",
            fontWeight: "bold",
          }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, color: "#1b4332", fontSize: "1.2rem" }}>
          {editingPlayer ? "Edit Player" : "Add Player"}
        </h2>
      </div>

      {/* Input Form */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          marginBottom: "20px",
        }}
      >
        <input
          style={inputStyle}
          placeholder="Full Name"
          value={formData.full_name}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
        />

        {/* Email Field (New for Magic Link) */}
        <input
          type="email"
          style={inputStyle}
          placeholder="Email Address (for Magic Link)"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        {/* Phone Number Field */}
        <input
          type="tel"
          style={inputStyle}
          placeholder="Phone Number (for Group Texts)"
          value={formData.phone_number}
          onChange={(e) =>
            setFormData({ ...formData, phone_number: e.target.value })
          }
        />

        <div style={{ position: "relative", marginBottom: "15px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "11px",
              color: "#94a3b8",
              fontWeight: "bold",
            }}
          >
            @
          </span>
          <input
            style={{ ...inputStyle, paddingLeft: "30px", marginBottom: "0px" }}
            placeholder="Venmo Username"
            value={formData.venmo_handle}
            onChange={(e) =>
              setFormData({ ...formData, venmo_handle: e.target.value })
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label style={labelStyle}>HANDICAP</label>
            <input
              type="number"
              style={inputStyle}
              value={formData.initial_handicap}
              onChange={(e) =>
                setFormData({ ...formData, initial_handicap: e.target.value })
              }
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={formData.is_member}
                onChange={(e) =>
                  setFormData({ ...formData, is_member: e.target.checked })
                }
              />
              Member
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={formData.is_birdie_bet}
                onChange={(e) =>
                  setFormData({ ...formData, is_birdie_bet: e.target.checked })
                }
              />
              Birdie Bet
            </label>
          </div>
        </div>

        <button onClick={handleSave} style={saveButtonStyle}>
          {editingPlayer ? "UPDATE PLAYER" : "SAVE NEW PLAYER"}
        </button>

        {editingPlayer && (
          <button
            onClick={() => {
              setEditingPlayer(null);
              setFormData({
                full_name: "",
                email: "",
                initial_handicap: 0,
                is_member: true,
                is_birdie_bet: false,
                venmo_handle: "",
                phone_number: "",
              });
            }}
            style={cancelButtonStyle}
          >
            Cancel Editing
          </button>
        )}
      </div>

      {/* List Display */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {players.map((p) => (
          <div key={p.id} style={listItemStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", color: "#1e293b" }}>
                {p.full_name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                HCP: {p.calculated_handicap} •{" "}
                {p.is_member ? "Member" : "Guest"}
                {p.email && ` • 📧 ${p.email}`}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {/* MAGIC LINK BUTTON */}
              {p.email && (
                <button
                  onClick={() => sendManualMagicLink(p)}
                  style={{
                    ...editButtonStyle,
                    background: "#e0f2fe",
                    color: "#0369a1",
                    border: "1px solid #bae6fd",
                  }}
                >
                  📧 Link
                </button>
              )}

              <button
                onClick={() => {
                  setEditingPlayer(p);
                  setFormData({
                    full_name: p.full_name,
                    email: p.email || "",
                    initial_handicap: p.calculated_handicap,
                    is_member: p.is_member ?? true,
                    is_birdie_bet: p.is_birdie_bet ?? false,
                    venmo_handle: p.venmo_handle || "",
                    phone_number: p.phone_number || "",
                  });
                }}
                style={editButtonStyle}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- INVITE PROMPT MODAL --- */}
      {showInvitePrompt && invitedPlayer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "350px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{ color: "#1a4731", marginTop: 0, marginBottom: "10px" }}
            >
              Invite {invitedPlayer.name}?
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#64748b",
                marginBottom: "24px",
              }}
            >
              Would you like to text them a link to set up their account?
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button onClick={handleSendInviteText} style={saveButtonStyle}>
                💬 Send Text Invite
              </button>
              <button onClick={handleSkipInvite} style={cancelButtonStyle}>
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Styles
const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #eee",
  boxSizing: "border-box",
  fontSize: "1rem",
};
const labelStyle = {
  fontSize: "0.7rem",
  fontWeight: "bold",
  color: "#666",
  display: "block",
  marginBottom: "4px",
};
const checkboxLabelStyle = {
  fontSize: "0.85rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};
const saveButtonStyle = {
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
const cancelButtonStyle = {
  width: "100%",
  marginTop: "12px",
  background: "none",
  border: "none",
  color: "#ef4444",
  fontSize: "0.85rem",
  fontWeight: "600",
  cursor: "pointer",
};
const listItemStyle = {
  padding: "15px",
  borderBottom: "1px solid #f1f5f9",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const editButtonStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "0.8rem",
  fontWeight: "700",
  cursor: "pointer",
};
