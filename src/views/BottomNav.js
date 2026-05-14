import React from "react";

const BottomNav = ({ currentView, setView }) => {
  // Hide the nav bar if we are actively keeping score (optional preference)
  // or if we are on the auth screen
  if (currentView === "scorecard" || currentView === "auth") return null;

  const navContainerStyle = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "85px", // Height of the bar
    backgroundColor: "white",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    borderTop: "1px solid #eee",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
    zIndex: 1000,
    paddingBottom: "15px", // Safe area for iPhone home bar
  };

  const navItemStyle = (isActive) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    width: "33%", // 3 tabs = 33% width each
    cursor: "pointer",
    color: isActive ? "#1b4332" : "#aaa", // Dark Green if active, Grey if not
    transition: "color 0.2s ease",
  });

  const iconStyle = {
    fontSize: "1.6rem",
    marginBottom: "4px",
  };

  const labelStyle = {
    fontSize: "0.75rem",
    fontWeight: "600",
  };

  return (
    <div style={navContainerStyle}>
      {/* --- HOME TAB --- */}
      <button
        style={navItemStyle(currentView === "dashboard")}
        onClick={() => setView("dashboard")}
      >
        <span style={iconStyle}>🏠</span>
        <span style={labelStyle}>Home</span>
      </button>

      {/* --- POTY TAB --- */}
      <button
        style={navItemStyle(currentView === "poty")}
        onClick={() => setView("poty")}
      >
        <span style={iconStyle}>🏆</span>
        <span style={labelStyle}>POTY</span>
      </button>

      {/* --- PLAY TAB (Distinct Style) --- */}
      <button
        style={navItemStyle(currentView === "setup")}
        onClick={() => setView("setup")}
      >
        <div
          style={{
            ...iconStyle,
            backgroundColor: "#1b4332",
            color: "white",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            marginBottom: "2px",
            boxShadow: "0 4px 10px rgba(27, 67, 50, 0.3)",
          }}
        >
          ⛳
        </div>
        <span style={{ ...labelStyle, color: "#1b4332" }}>Play</span>
      </button>
    </div>
  );
};

export default BottomNav;
