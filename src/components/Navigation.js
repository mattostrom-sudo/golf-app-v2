import React from "react";
import { supabase } from "../supabaseClient";

export default function Navigation({
  menuOpen,
  setMenuOpen,
  isAdmin,
  navigateTo,
  isInRound,
  onCancel,
  onFinish,
}) {
  const handleLogout = async () => {
    // Close menu immediately on logout
    setMenuOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) alert("Error logging out: " + error.message);
  };

  // Helper function to handle navigation and closing the menu at once
  const handleNav = (targetView) => {
    navigateTo(targetView); // This sends the name back to App.js
    setMenuOpen(false); // This closes the hamburger menu
  };
  return (
    <>
      {/* Floating Toggle Button */}
      <div className="nav-header">
        <button
          className={`menu-toggle ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Dimmed Blur Overlay */}
      <div
        className={`menu-overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      >
        {/* Sliding Side Drawer */}
        <div
          className={`menu-drawer ${menuOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "100vh",
          }}
        >
          <div className="menu-inner-header">
            <h3>Club Menu</h3>
            <div className="accent-line"></div>
          </div>

          <div
            className="menu-links"
            style={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* DASHBOARD */}
            <button className="nav-item" onClick={() => handleNav("dashboard")}>
              <span className="nav-icon">👤</span> Dashboard
            </button>

            <button className="nav-item" onClick={() => handleNav("history")}>
              <span className="nav-icon">📜</span> Round History
            </button>

            <button
              className="nav-item start-round-nav"
              onClick={() => handleNav("setup")}
            >
              <span className="nav-icon">➕</span> Start New Round
            </button>

            {/* COURSE LIBRARY */}
            <button
              className="nav-item"
              onClick={() => handleNav("courseManager")}
            >
              <span className="nav-icon">⛳️</span> Course Library
            </button>

            {/* MAJORS - Now follows the same close-on-click logic */}
            <button className="nav-item" onClick={() => handleNav("majors")}>
              <span className="nav-icon">🏆</span> Majors
            </button>

            {/* ADMIN ONLY SECTION */}
            {isAdmin && (
              <div className="admin-menu-section">
                <div className="menu-section-label">Administration</div>
                <button
                  className="nav-item admin-item"
                  onClick={() => handleNav("playerManager")}
                >
                  <span className="nav-icon">👥</span> Player Admin
                </button>
              </div>
            )}

            {/* ROUND MANAGEMENT */}
            {isInRound && (
              <div className="round-menu-section">
                <div className="menu-section-label">Current Round</div>
                <button
                  className="menu-finish-btn"
                  onClick={() => {
                    if (window.confirm("Finish and save round now?")) {
                      setMenuOpen(false);
                      onFinish();
                    }
                  }}
                >
                  <span className="nav-icon">🏆</span> Finish & Save
                </button>
                <button
                  className="menu-cancel-btn"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Abandon this round? No stats will be saved."
                      )
                    ) {
                      setMenuOpen(false);
                      onCancel();
                    }
                  }}
                >
                  <span className="nav-icon">✕</span> Abandon Round
                </button>
              </div>
            )}

            {/* DICE ROLLER - always visible */}
            <button
              className="nav-item"
              onClick={() => handleNav("diceRoller")}
            >
              <span className="nav-icon">🎲</span> Dice Roller
            </button>
          </div>

          <div
            className="menu-footer"
            style={{ padding: "20px", borderTop: "1px solid #eee" }}
          >
            <button className="logout-link" onClick={handleLogout}>
              <span style={{ fontSize: "1.1rem" }}>🚪</span> Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
