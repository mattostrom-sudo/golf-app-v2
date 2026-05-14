import React from "react";
import "../styles.css"; // Ensure we have access to your CSS

export default function RoundHistory({
  roundHistory,
  setSelectedSummaryRound,
  setView,
}) {
  // 1. Empty State: What to show if there are no rounds yet
  if (!roundHistory || roundHistory.length === 0) {
    return (
      <div
        className="screen history-view"
        style={{ textAlign: "center", padding: "40px" }}
      >
        <h2>No Rounds Yet ⛳</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Go play a round and save it to see your history here!
        </p>
        <button className="action-btn" onClick={() => setView("setup")}>
          Start New Round
        </button>
      </div>
    );
  }

  // 2. The List View
  return (
    <div className="screen history-view" style={{ paddingBottom: "80px" }}>
      <header className="history-header">
        <h1>Round History</h1>
        <p>{roundHistory.length} rounds played</p>
      </header>

      <div className="history-list">
        {roundHistory.map((round) => {
          // Helper: Format the date nicely (e.g., "Oct 24, 2023")
          const dateObj = new Date(round.date);
          const dateStr = dateObj.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={round.id}
              className="glass-card history-item"
              style={{ cursor: "pointer", marginBottom: "15px" }}
              onClick={() => {
                // This is the magic link!
                // 1. We tell App.js WHICH round we clicked
                setSelectedSummaryRound(round);
                // 2. We tell App.js to switch to the Summary view
                setView("roundSummary");
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "#1b4332" }}>
                    {round.course_name || "Unknown Course"}
                  </h3>
                  <span style={{ fontSize: "0.85rem", color: "#555" }}>
                    📅 {dateStr}
                  </span>
                </div>

                {/* Optional: Show how many players were in that round */}
                <div className="player-badge">
                  👥 {round.players ? round.players.length : 0}
                </div>
              </div>

              {/* Optional: Show if it was a Major */}
              {round.is_major && (
                <div
                  style={{
                    marginTop: "8px",
                    display: "inline-block",
                    backgroundColor: "#ffd700",
                    color: "#000",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  🏆 {round.major_name || "Major"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
