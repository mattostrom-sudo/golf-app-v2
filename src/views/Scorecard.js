import React from "react";

export default function Scorecard({
  selectedCourse,
  players,
  setView,
  setStatsReturnView,
  scores,
  setScores,
  currentHoleIndex,
  setCurrentHoleIndex,
  onNext, // Added
  onPrev, // Added
  selectedGames = [],
  playerHandicaps = {},
  playerDirectory,
  playerQuotas = {}, // Added default {} to fix the TypeError in your screenshot
  keptHoles = {}, // New State from App.js
  setKeptHoles, // New Setter from App.js
}) {
  const holeData = selectedCourse?.holes?.[currentHoleIndex];
  const holeNum = currentHoleIndex + 1;

  if (!selectedCourse || !holeData)
    return <div className="screen">Loading...</div>;

  const getQuotaPoints = (score, par) => {
    if (!score || !par || score <= 0) return 0;
    const diff = score - par;
    if (diff <= -2) return 8;
    if (diff === -1) return 4;
    if (diff === 0) return 2;
    if (diff === 1) return 1;
    return 0;
  };

  const getPlayerTotalQuota = (playerId) => {
    const pScores = scores[playerId] || {};
    return selectedCourse.holes.reduce((total, h, idx) => {
      return total + getQuotaPoints(pScores[idx + 1], h.par);
    }, 0);
  };

  const updateScore = (player, val) => {
    const n = val === "" ? "" : parseInt(val, 10);
    setScores((prev) => ({
      ...prev,
      [player]: { ...(prev[player] || {}), [holeNum]: n },
    }));
  };

  // --- 11's TOGGLE FUNCTION ---
  const toggleKeep = (player) => {
    setKeptHoles((prev) => {
      const currentKept = prev[player] || [];
      if (currentKept.includes(holeNum)) {
        return { ...prev, [player]: currentKept.filter((h) => h !== holeNum) };
      }
      if (currentKept.length < 11) {
        return { ...prev, [player]: [...currentKept, holeNum] };
      }
      return prev;
    });
  };

  return (
    <div className="screen scorecard-view">
      <div className="scoring-header">
        <div className="hole-indicator">
          <span>HOLE</span>
          <h2>{holeNum}</h2>
        </div>
        <div className="hole-stats">
          <div className="stat-badge">
            <span>PAR</span>
            <div className="value">{holeData.par}</div>
          </div>
          <div className="stat-badge">
            <span>HDCP</span>
            <div className="value">{holeData.difficulty}</div>
          </div>
        </div>
      </div>

      <div className="setup-container">
        {players.map((p) => {
          const playerId = typeof p === "object" ? p.id : p;
          const playerName =
            typeof p === "object"
              ? p.full_name
              : playerDirectory?.find((d) => d.id === p)?.full_name || p;
          const isKept = (keptHoles[playerId] || []).includes(holeNum);
          const keptCount = (keptHoles[playerId] || []).length;
          const isFull = keptCount >= 11 && !isKept;

          const safeHcp = (() => {
            const mapData = playerHandicaps?.[playerId];
            const val = typeof mapData === "object" ? mapData.current : mapData;
            const profile = playerDirectory?.find((f) => f.id === playerId);
            return val ?? profile?.initial_handicap ?? 0;
          })();

          return (
            <div key={playerId} className="glass-card player-score-card">
              <div className="player-info">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span className="player-name-label">
                    {playerName}
                    <span
                      style={{
                        color: "#ef4444",
                        marginLeft: "4px",
                        fontWeight: "900",
                      }}
                    >
                      {/* 2. FIXED STROKE INDICATORS: Now using safeHcp (a number) */}
                      {safeHcp >= holeData.difficulty ? "*" : ""}
                      {safeHcp >= holeData.difficulty + 18 ? "*" : ""}
                    </span>
                  </span>

                  {selectedGames.includes("11's") && (
                    <span
                      style={{
                        fontSize: "0.6rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: isKept ? "#1a4731" : "#f1f5f9",
                        color: isKept ? "white" : "#64748b",
                        fontWeight: "bold",
                      }}
                    >
                      {isKept ? "KEPT" : `${keptCount}/11`}
                    </span>
                  )}
                </div>

                <div className="player-total-label">
                  <p>
                    HCP: {safeHcp}{" "}
                    {/* 3. FIXED LABEL: Now guaranteed to be a number */}
                  </p>

                  {selectedGames.includes("Quota Points") && (
                    <span
                      style={{
                        background: "#2e7d32",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                      }}
                    >
                      {(() => {
                        const s = scores[playerId]?.[holeNum];
                        if (!s || s === 0) return "0 PTS";
                        const diff = s - holeData.par;
                        if (diff <= -2) return "+8 PTS";
                        if (diff === -1) return "+4 PTS";
                        if (diff === 0) return "+2 PTS";
                        if (diff === 1) return "+1 PTS";
                        return "0 PTS";
                      })()}
                    </span>
                  )}
                </div>
              </div>
              {/* ... rest of your code (Keep button and score controls) stays the same ... */}

              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {/* --- THE KEEP BUTTON --- */}
                {selectedGames.includes("11's") && (
                  <button
                    onClick={() => toggleKeep(playerId)}
                    disabled={isFull}
                    style={{
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.65rem",
                      fontWeight: "bold",
                      background: isKept ? "#1a4731" : "#e2e8f0",
                      color: isKept ? "white" : "#475569",
                      opacity: isFull ? 0.3 : 1,
                    }}
                  >
                    {isKept ? "✓ KEEP" : "KEEP?"}
                  </button>
                )}

                <div className="score-controls">
                  <button
                    className="score-btn"
                    onClick={() =>
                      updateScore(
                        playerId,
                        (scores[playerId]?.[holeNum] || holeData.par) - 1
                      )
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="score-input-box"
                    value={scores[playerId]?.[holeNum] || ""}
                    onChange={(e) => updateScore(playerId, e.target.value)}
                    placeholder="-"
                  />
                  <button
                    className="score-btn"
                    onClick={() =>
                      updateScore(
                        playerId,
                        (scores[playerId]?.[holeNum] || holeData.par - 1) + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="scorecard-footer-fixed">
        {/* LOG PERSONAL STATS - now first */}
        <button
          style={{
            background: "#1b4332",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "0px",
            width: "100%",
            justifyContent: "center",
          }}
          onClick={() => {
            setStatsReturnView("scorecard");
            setView("holeStats");
          }}
        >
          📊 Log My Personal Stats
        </button>

        {/* PREV / NEXT BUTTON ROW */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          {currentHoleIndex > 0 && (
            <button
              className="next-hole-btn-large"
              style={{ flex: 1, background: "#64748b" }}
              onClick={() => setCurrentHoleIndex(currentHoleIndex - 1)}
            >
              Prev
            </button>
          )}
          <button
            className="next-hole-btn-large"
            style={{ flex: 2 }}
            onClick={() => {
              if (holeNum === 18) setView("leaderboard");
              else setCurrentHoleIndex(currentHoleIndex + 1);
            }}
          >
            {holeNum === 18 ? "Finish" : "Next Hole"}
          </button>
        </div>

        {/* FULL CARD / LEADERBOARD BUTTONS */}
        <div className="scorecard-button-grid">
          <button
            className="view-card-btn"
            onClick={() => setView("verticalScorecard")}
          >
            📄 Full Card
          </button>
          <button
            className="view-leaderboard-btn"
            onClick={() => setView("leaderboard")}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
