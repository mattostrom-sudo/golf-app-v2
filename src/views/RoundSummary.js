import React, { useState } from "react";
import VerticalScorecard from "./VerticalScorecard";
import "../styles.css"; // Ensure standard styles are loaded
import AdvancedStatsBreakdown from "./AdvancedStatsBreakdown";

export default function RoundSummary({
  user,
  roundData,
  onBack,
  setView,
  setStatsTargetPlayer,
  playerDirectory = [],
}) {
  const [selectedDetails, setSelectedDetails] = useState(null); // 'scorecard'
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [scorecardMode, setScorecardMode] = React.useState("gross"); // 'gross', 'net', or 'game'
  if (!roundData) return null;

  const {
    date,
    course_name,
    players,
    scores,
    player_handicaps,
    selected_games,
  } = roundData;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // --- PRE-CALCULATE STATS FOR THE HERO SECTION ---
  const playerStats = players.map((p) => {
    const pId = typeof p === "object" ? p.id : p;
    const profile = playerDirectory.find(dir => dir.id === pId);
    const pName = typeof p === "object" ? p.full_name : (profile?.full_name || p);
    const pScores = scores[pId] || scores[pName] || {};
    const gross = Object.values(pScores).reduce(
      (a, b) => a + Number(b || 0),
      0
    );
  
    const rawHcp = player_handicaps?.[pId] || player_handicaps?.[pName];
    const hcp = typeof rawHcp === "object" ? rawHcp.current || 0 : rawHcp || 0;
    const net = gross - hcp;
  
    return { name: pName, gross, net, hcp };
  });

  // Find the absolute lowest scores
  const minNet = Math.min(...playerStats.map((s) => s.net));
  const minGross = Math.min(...playerStats.map((s) => s.gross));

  // Find who shot those scores (handles ties!)
  const netWinners = playerStats
    .filter((s) => s.net === minNet)
    .map((s) => s.name)
    .join(" & ");
  const grossWinners = playerStats
    .filter((s) => s.gross === minGross)
    .map((s) => s.name)
    .join(" & ");

  const gameBtnStyle = {
    width: "100%",
    padding: "15px",
    background: "white",
    border: "1px solid #e9ecef",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#212529",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  };

  const noGamesStyle = {
    padding: "15px",
    textAlign: "center",
    color: "#adb5bd",
    fontSize: "0.9rem",
  };

  const compareBtnStyle = {
    width: "100%",
    padding: "15px",
    background: "#1b4332",
    border: "none",
    borderRadius: "12px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(27,67,50,0.2)",
  };

  return (
    <div
      className="screen"
      style={{
        paddingTop: "80px",
        paddingBottom: "100px",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* --- HEADER --- */}
      <div style={{ padding: "0 20px 20px 20px", position: "relative" }}>
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "-10px",
            right: "20px",
            background: "#e9ecef",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            fontSize: "1.2rem",
            color: "#495057",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            zIndex: 10,
          }}
        >
          ✕
        </button>

        <h1
          style={{ fontSize: "1.8rem", color: "#1b4332", margin: "0 0 5px 0" }}
        >
          Round Summary
        </h1>
        <p style={{ color: "#6c757d", margin: 0, fontSize: "0.95rem" }}>
          {course_name} • {formatDate(date)}
        </p>
      </div>

      {/* --- HERO SECTION: THE WINNERS --- */}
      <div style={{ padding: "0 20px 20px 20px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
            padding: "20px",
            borderRadius: "16px",
            textAlign: "center",
            color: "white",
            boxShadow: "0 4px 15px rgba(27, 67, 50, 0.2)",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              opacity: 0.8,
              margin: "0 0 5px 0",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Low Net Winner
          </p>
          <h2 style={{ fontSize: "2.2rem", margin: "0 0 5px 0" }}>
            🏆 {netWinners}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "#d8f3dc",
            }}
          >
            {minNet} Net
          </p>
        </div>

        {/* --- 1. UPDATED QUICK STATS GRID (Removed parentheses) --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginTop: "15px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "#6c757d",
                textTransform: "uppercase",
              }}
            >
              Low Gross
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "1.1rem",
                color: "#212529",
                marginTop: "5px",
              }}
            >
              {grossWinners} {/* Removed ({minGross}) from here */}
            </strong>
          </div>

          <div
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "#6c757d",
                textTransform: "uppercase",
              }}
            >
              Players
            </span>
            <strong
              style={{
                display: "block",
                fontSize: "1.2rem",
                color: "#212529",
                marginTop: "5px",
              }}
            >
              {players.length}
            </strong>
          </div>
        </div>
      </div>

      {/* --- MAIN CARD (Leaderboard Table) --- */}
      <div className="glass-card" style={{ margin: "0 20px" }}>
        <table
          className="summary-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #e9ecef" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  color: "#6c757d",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}
              >
                Player
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "12px",
                  color: "#6c757d",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}
              >
                Gross
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "12px",
                  color: "#6c757d",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}
              >
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Map over our pre-calculated stats instead of recalculating */}
            {playerStats
              .sort((a, b) => a.net - b.net)
              .map((p, index) => (
                <tr
                  key={p.name}
                  style={{
                    borderBottom:
                      index !== players.length - 1
                        ? "1px solid #f1f3f5"
                        : "none",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setTargetPlayer(p.name);
                    setSelectedDetails("scorecard");
                  }}
                >
                  <td
                    style={{
                      padding: "16px 12px",
                      fontWeight: "600",
                      color: "#212529",
                    }}
                  >
                    {p.name}
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#adb5bd",
                        fontWeight: "normal",
                      }}
                    >
                      HCP: {p.hcp}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "16px 12px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                    }}
                  >
                    {p.gross}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "16px 12px",
                      fontSize: "1.1rem",
                      color: "#1b4332",
                      fontWeight: "bold",
                    }}
                  >
                    {p.net}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "20px" }}>
        <p
          style={{
            fontSize: "0.8rem",
            textAlign: "center",
            color: "#adb5bd",
            marginBottom: "15px",
          }}
        >
          Tap a player row to view full scorecard
        </p>

        {/* --- ACTIONS SECTION --- */}
        <h3
          style={{
            fontSize: "1rem",
            color: "#495057",
            marginBottom: "15px",
            marginTop: "10px",
          }}
        >
          Game Results
        </h3>

        <div style={{ display: "grid", gap: "10px" }}>
          {selected_games && selected_games.length > 0 ? (
            selected_games.map((game) => (
              <button
                key={game}
                style={gameBtnStyle} // Moved styles to a constant for cleanliness
                onClick={() => setView("leaderboard")}
              >
                <span>🏆 {game} Results</span>
                <span style={{ color: "#adb5bd" }}>→</span>
              </button>
            ))
          ) : (
            <div style={noGamesStyle}>No side games played.</div>
          )}

          {/* ✅ PLACED OUTSIDE THE MAP: Only shows once, uses correct roundData ID */}
          <AdvancedStatsBreakdown user={user} roundId={roundData.id} />

          <button
            style={compareBtnStyle}
            onClick={() => {
              if (setStatsTargetPlayer) setStatsTargetPlayer(null);
              if (setView) setView("stats");
            }}
          >
            📊 Compare Player Stats
          </button>
        </div>
      </div>

      {/* --- 2. UPDATED MODAL CALL (Matching your VerticalScorecard logic) --- */}
      {selectedDetails === "scorecard" && targetPlayer && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              padding: "20px",
              background: "white",
            }}
          >
            <button
              onClick={() => setSelectedDetails(null)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#64748b",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              ✕
            </button>

            <div
              style={{
                display: "flex",
                gap: "5px",
                background: "#f1f5f9",
                padding: "4px",
                borderRadius: "12px",
                marginBottom: "20px",
                marginTop: "10px",
              }}
            >
              {["gross", "net", "game"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScorecardMode(mode)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    background:
                      scorecardMode === mode ? "#1a4731" : "transparent",
                    color: scorecardMode === mode ? "white" : "#64748b",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <VerticalScorecard
              selectedCourse={
                roundData.course_data || {
                  name: roundData.course_name || "Unknown Course",
                }
              }
              players={[targetPlayer]} // Changed to an array so VerticalScorecard can map it
              scores={roundData.scores} // Pass the whole scores object
              mode={scorecardMode}
              playerHandicaps={player_handicaps} // Matches the variable name at the top of your file
            />
          </div>
        </div>
      )}
    </div>
  );
}
