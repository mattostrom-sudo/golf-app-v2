import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function HoleStats({
  user,
  activeRound,
  setView,
  advancedStats,
  setAdvancedStats,
  returnView = "leaderboard",
  selectedCourse,
  onFinish,
  scores = {},
  players = [],
}) {
  const playerName = user?.id || user?.email || "Unknown Player";
  // Find the player object that matches this user
  const playerObj = players.find((p) => p.id === user?.id);
  const playerKey = playerObj?.id || playerName;

  const [currentHole, setCurrentHole] = useState(() => {
    for (let i = 1; i <= 18; i++) {
      const stats = advancedStats?.[playerName]?.[i];
      if (!stats) return i; // no stats at all for this hole

      const hasFairway =
        stats.fairway_hit !== null && stats.fairway_hit !== undefined;
      const hasGIR =
        stats.green_in_regulation !== null &&
        stats.green_in_regulation !== undefined;
      const hasPutts =
        stats.putts !== null &&
        stats.putts !== undefined &&
        Number(stats.putts) > 0;

      // Consider hole empty if none of the stats have been entered
      if (!hasFairway && !hasGIR && !hasPutts) return i;
    }
    return 18; // all holes filled
  });

  const currentHoleStats = advancedStats?.[playerName]?.[currentHole] || {
    fairway_hit: null,
    green_in_regulation: null,
    putts: 0,
  };

  const updateStat = async (key, value) => {
    const updatedHoleData = {
      ...(advancedStats?.[playerName]?.[currentHole] || {}),
      [key]: value,
    };

    setAdvancedStats((prev) => ({
      ...prev,
      [playerName]: {
        ...(prev[playerName] || {}),
        [currentHole]: {
          ...(prev[playerName]?.[currentHole] || {}),
          [key]: value,
        },
      },
    }));

    // Save to Supabase
    if (user?.id) {
      const hole = selectedCourse?.holes?.[currentHole - 1];
      const playerScore = scores[playerKey]?.[currentHole] || null;
      const { error } = await supabase.from("hole_stats").upsert(
        {
          user_id: user.id,
          round_id: null,
          player_name: playerName,
          hole_number: currentHole,
          fairway_hit: updatedHoleData.fairway_hit,
          green_in_regulation: updatedHoleData.green_in_regulation,
          putts: updatedHoleData.putts || 0,
          is_finalized: false,
          updated_at: new Date().toISOString(),
          par: hole?.par || null,
          score: playerScore,
        },
        { onConflict: "user_id, round_id, hole_number" }
      );
      if (error) console.error("Critical Sync Error:", error.message);
    }
  };
  return (
    <div
      className="screen hole-stats-view"
      style={{
        padding: "10px 20px",
        backgroundColor: "#f8f9fa",
        paddingBottom: "100px",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          Hole {currentHole} Stats
        </h2>
        {returnView === "leaderboard" && (
          <button
            onClick={() => setView("dashboard")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "#ccc",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        )}
      </header>

      {/* Hole Navigation - only show at top when coming from scorecard */}
      {returnView !== "leaderboard" && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
          }}
        >
          <button
            onClick={() => setCurrentHole(Math.max(1, currentHole - 1))}
            disabled={currentHole === 1}
            style={navBtnStyle}
          >
            Prev Hole
          </button>
          <button
            onClick={() => setCurrentHole(Math.min(18, currentHole + 1))}
            disabled={currentHole === 18}
            style={navBtnStyle}
          >
            Next Hole
          </button>
        </div>
      )}

      {/* Fairway Stats - hidden for par 3s */}
      {selectedCourse?.holes?.[currentHole - 1]?.par !== 3 && (
        <section style={sectionStyle}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>Fairway</h3>
          <div style={buttonGroupStyle}>
            {["Hit", "Left", "Right"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  updateStat("fairway_hit", opt);
                  if (opt === "Hit") {
                    updateStat("green_in_regulation", null);
                  }
                }}
                style={
                  currentHoleStats.fairway_hit === opt ||
                  currentHoleStats.fairway_hit === `${opt}+Penalty`
                    ? activeBtnStyle
                    : inactiveBtnStyle
                }
              >
                {opt}
              </button>
            ))}
          </div>
          {/* Penalty toggle - hidden for now, uncomment to re-enable
          {(currentHoleStats.fairway_hit === "Left" ||
            currentHoleStats.fairway_hit === "Right" ||
            currentHoleStats.fairway_hit === "Left+Penalty" ||
            currentHoleStats.fairway_hit === "Right+Penalty") && (
            <button
              onClick={() => {
                const hasPenalty =
                  currentHoleStats.fairway_hit?.includes("+Penalty");
                const baseDirection = currentHoleStats.fairway_hit?.replace(
                  "+Penalty",
                  ""
                );
                if (hasPenalty) {
                  updateStat("fairway_hit", baseDirection);
                  updateStat("green_in_regulation", null);
                } else {
                  updateStat(
                    "fairway_hit",
                    `${currentHoleStats.fairway_hit}+Penalty`
                  );
                  updateStat("green_in_regulation", "Penalty");
                }
              }}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "10px",
                borderRadius: "8px",
                border: currentHoleStats.fairway_hit?.includes("+Penalty")
                  ? "2px solid #ef4444"
                  : "1px solid #ccc",
                backgroundColor: currentHoleStats.fairway_hit?.includes(
                  "+Penalty"
                )
                  ? "#fee2e2"
                  : "transparent",
                color: currentHoleStats.fairway_hit?.includes("+Penalty")
                  ? "#ef4444"
                  : "#666",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {currentHoleStats.fairway_hit?.includes("+Penalty")
                ? "Penalty ✓"
                : "Add Penalty"}
            </button>
          )}
                        */}
        </section>
      )}

      {/* Green Stats - hidden if penalty */}
      {!currentHoleStats.fairway_hit?.includes("+Penalty") && (
        <section style={sectionStyle}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>
            Green in Regulation
          </h3>
          <div style={{ ...buttonGroupStyle, flexWrap: "wrap" }}>
            {["Hit", "Left", "Right", "Short", "Long"].map((opt) => (
              <button
                key={opt}
                onClick={() => updateStat("green_in_regulation", opt)}
                style={{
                  ...(currentHoleStats.green_in_regulation === opt
                    ? activeBtnStyle
                    : inactiveBtnStyle),
                  flex: opt === "Hit" ? "1 1 100%" : "1 1 40%",
                  marginBottom: opt === "Hit" ? "10px" : "0",
                }}
              >
                {opt === "Hit" ? "Hit Green" : `Miss ${opt}`}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Putts */}
      <section style={{ ...sectionStyle, padding: "12px 20px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>Putts</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <button
            onClick={() =>
              updateStat(
                "putts",
                Math.max(0, (currentHoleStats.putts || 0) - 1)
              )
            }
            style={{ ...circleBtnStyle, width: "40px", height: "40px" }}
          >
            -
          </button>
          <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {currentHoleStats.putts || 0}
          </span>
          <button
            onClick={() =>
              updateStat("putts", (currentHoleStats.putts || 0) + 1)
            }
            style={{ ...circleBtnStyle, width: "40px", height: "40px" }}
          >
            +
          </button>
        </div>
      </section>

      {/* Show different footer based on where we came from */}
      {returnView === "leaderboard" ? (
        <>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={() => setCurrentHole(Math.max(1, currentHole - 1))}
              disabled={currentHole === 1}
              style={{ ...navBtnStyle, flex: 1 }}
            >
              Prev Hole
            </button>
            <button
              onClick={() => setCurrentHole(Math.min(18, currentHole + 1))}
              disabled={currentHole === 18}
              style={{ ...navBtnStyle, flex: 1 }}
            >
              Next Hole
            </button>
          </div>
          <button
            onClick={() => setView("leaderboard")}
            style={{
              ...finishBtnStyle,
              marginTop: "10px",
              backgroundColor: "#64748b",
            }}
          >
            🏆 Leaderboard
          </button>
        </>
      ) : (
        <button
          onClick={() => (onFinish ? onFinish() : setView(returnView))}
          style={finishBtnStyle}
        >
          Finish & Return to Scorecard
        </button>
      )}
    </div>
  );
}

// --- STYLES ---
const btnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#e2e8f0",
  fontWeight: "bold",
};

const finishBtnStyle = {
  ...btnStyle,
  width: "100%",
  padding: "16px",
  marginTop: "10px",
  backgroundColor: "#1b4332",
  color: "white",
  fontSize: "1rem",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  cursor: "pointer",
};

const navBtnStyle = { ...btnStyle, backgroundColor: "#1b4332", color: "white" };

const sectionStyle = {
  backgroundColor: "white",
  padding: "12px 20px",
  borderRadius: "12px",
  marginBottom: "12px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

const buttonGroupStyle = { display: "flex", gap: "10px" };

const activeBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "8px",
  border: "2px solid #1b4332",
  backgroundColor: "#e6f4ea",
  color: "#1b4332",
  fontWeight: "bold",
};

const inactiveBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  backgroundColor: "transparent",
  color: "#666",
};

const circleBtnStyle = {
  borderRadius: "25px",
  border: "none",
  backgroundColor: "#e2e8f0",
  fontSize: "1.5rem",
  fontWeight: "bold",
  cursor: "pointer",
};
