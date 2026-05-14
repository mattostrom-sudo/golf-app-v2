import React, { useState } from "react";

const POTYView = ({ standings, onBack }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // 1. Now that we attached is_member in App.js, this filter will actually find people!
  const memberStandings = standings.filter(
    (player) => player.is_member === true
  );

  // 2. Use the filtered list for the leader points
  const leaderPoints =
    memberStandings.length > 0 ? memberStandings[0].points : 0;

  // ... rest of your component logic

  const statRow = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "0.95rem",
  };
  console.log("First player in standings:", standings[0]);
  return (
    <div
      className="screen poty-view"
      style={{ backgroundColor: "#f0f2f0", minHeight: "100vh" }}
    >
      {/* --- HEADER --- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "15px",
          background: "#1b4332",
          color: "white",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "1px solid white",
            color: "white",
            padding: "5px 10px",
            borderRadius: "5px",
          }}
        >
          ← Back
        </button>
        <h1
          style={{
            flexGrow: 1,
            textAlign: "center",
            margin: 0,
            fontSize: "1.2rem",
          }}
        >
          2026 Player of the Year
        </h1>
      </div>

      {/* --- LEADERBOARD LIST --- */}
      <div style={{ padding: "15px" }}>
        {/* 3. USE FILTERED LIST: Map over memberStandings instead of standings */}
        {memberStandings.map((player, index) => {
          const isLeader = player.points === leaderPoints;
          const pointsBehind = (player.points - leaderPoints).toFixed(1);

          return (
            <div
              key={player.name}
              onClick={() => setSelectedPlayer(player)}
              style={{
                display: "flex",
                alignItems: "center",
                background: "white",
                marginBottom: "10px",
                padding: "15px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "30px",
                  fontWeight: "bold",
                  color: index === 0 ? "#D4AF37" : "#999",
                }}
              >
                {index + 1}
              </div>
              <div style={{ flexGrow: 1, fontWeight: "bold" }}>
                {player.name} {player.breakdown?.majorWins > 0 && "🏆"}
              </div>

              <div
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  color: isLeader ? "#1b4332" : "#ef4444",
                  fontSize: "1.1rem",
                }}
              >
                {isLeader ? (
                  <span>{player.points.toFixed(1)}</span>
                ) : (
                  <span>{pointsBehind}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- POINT BREAKDOWN MODAL --- */}
      {selectedPlayer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "15px",
              width: "100%",
              maxWidth: "400px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#1b4332", textAlign: "center" }}>
              {selectedPlayer.name}
            </h2>
            <div
              style={{
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              {selectedPlayer.points.toFixed(1)}{" "}
              <span style={{ fontSize: "0.8rem", color: "#666" }}>PTS</span>
            </div>
            <hr style={{ opacity: 0.2, marginBottom: "20px" }} />

            <div style={statRow}>
              <span>Holes Played ({selectedPlayer.breakdown.holesPlayed})</span>
              <strong>
                +{(selectedPlayer.breakdown.holesPlayed * 0.1).toFixed(1)}
              </strong>
            </div>

            <button
              onClick={() => setSelectedPlayer(null)}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "12px",
                background: "#1b4332",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POTYView;
