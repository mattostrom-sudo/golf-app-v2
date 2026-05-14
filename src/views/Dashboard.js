import React, { useState } from "react";
import { calculateCustomHandicap } from "./HandicapService";
import AdvancedStatsBreakdown from "./AdvancedStatsBreakdown";
const calculateVegasForHole = (team1Scores, team2Scores, holePar) => {
  const t1Sorted = [...team1Scores].sort((a, b) => a - b);
  const t2Sorted = [...team2Scores].sort((a, b) => a - b);

  let t1Score = Number(`${t1Sorted[0]}${t1Sorted[1]}`);
  let t2Score = Number(`${t2Sorted[0]}${t2Sorted[1]}`);

  const t1HasBirdie = t1Sorted[0] <= holePar - 1;
  const t2HasBirdie = t2Sorted[0] <= holePar - 1;

  if (t1HasBirdie && !t2HasBirdie) {
    t2Score = Number(`${t2Sorted[1]}${t2Sorted[0]}`);
  } else if (t2HasBirdie && !t1HasBirdie) {
    t1Score = Number(`${t1Sorted[1]}${t1Sorted[0]}`);
  }

  return { team1: t1Score, team2: t2Score };
};
export default function Dashboard({
  user,
  setView,
  roundHistory = [],
  playerDirectory = [],
  activeRound,
  selectedGames,
  matchTeams,
  onResume,
  playerHandicaps = {}, // 1. ADD THIS PROP
  setSelectedSummaryRound,
}) {
  const [activeTab, setActiveTab] = useState("home");

  const userProfile = playerDirectory?.find(
    (p) => p.id === user?.id || p.email === user?.email
  );
  console.log("userProfile?.id:", userProfile?.id);
  console.log("user?.id:", user?.id);
  const myName = userProfile?.full_name || user?.email || "Guest";
  console.log("myName:", myName);
  console.log(
    "sample round scores keys:",
    roundHistory[0]?.scores ? Object.keys(roundHistory[0].scores) : "none"
  );
  const homeCourseId = userProfile?.home_course_id;

  // 1. Get the data object from the main app's calculation
  // 1. Pull the pre-calculated data from props
  const hcpData = playerHandicaps[myName];

  // 2. Get the current handicap.
  // We use ?? to ensure that if the value is 0, it doesn't default back to 4.
  const displayHandicap =
    typeof hcpData === "object"
      ? hcpData.current
      : hcpData ?? userProfile?.initial_handicap ?? 0;

  // 3. Calculate the Trend based on the Initial Handicap (4.0)
  // Since Initial is 4 and Current is 0, this will now be -4.0
  const initialHcp = parseFloat(userProfile?.initial_handicap || 4.0);
  const trendDiff = displayHandicap - initialHcp;

  // 3. Helper for scoring
  const getGrossScore = (round) => {
    const directScore = Number(
      round.total_score || round.score || round.total || 0
    );
    if (directScore > 0) return directScore;

    // Try by name first (old rounds), then by UUID (new rounds)
    const myHoleScores =
      round.scores?.[myName] || round.scores?.[userProfile?.id] || {};
    return Object.values(myHoleScores).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0
    );
  };
  // 4. Smart Filter
  const filteredRounds = roundHistory.filter((round) => {
    // FIRST: Did the logged-in user even play in this round?
    const playedInRound = round.scores && (
      round.scores[myName] !== undefined ||
      round.scores[userProfile?.id] !== undefined
    );
    if (!playedInRound) return false;
  
    // SECOND: Only include full 18-hole rounds
    const playerScores = round.scores[myName] || round.scores[userProfile?.id] || {};
    const holesPlayed = Object.values(playerScores).filter(s => Number(s) > 0).length;
    if (holesPlayed < 18) return false;

    // SECOND: Apply the Home / Away / All tab filters
    if (activeTab === "all") return true;

    const isHomeMatch =
      round.is_home_course === true ||
      (homeCourseId && String(round.course_id) === String(homeCourseId));

    // If no home course is set, treat all rounds as home
    if (!homeCourseId) return true;

    return activeTab === "home" ? isHomeMatch : !isHomeMatch;
  });
  // 5. Calculate Stats (Includes the fix for accurate Net Avg)
  const avgGross =
    filteredRounds.length > 0
      ? (
          filteredRounds.reduce((sum, r) => sum + getGrossScore(r), 0) /
          filteredRounds.length
        ).toFixed(1)
      : "--";

  const avgNet =
    filteredRounds.length > 0
      ? (
          filteredRounds.reduce((acc, r) => {
            const gross = getGrossScore(r);

            // FIX: Look inside the player_handicaps object using your name
            const roundHandicap =
              (r.player_handicaps && r.player_handicaps[myName]) ??
              r.handicap ??
              displayHandicap;

            const net = gross > 0 ? gross - roundHandicap : 0;
            return acc + net;
          }, 0) / filteredRounds.length
        ).toFixed(1)
      : "--";

  const bestGross =
    filteredRounds.length > 0
      ? Math.min(
          ...filteredRounds.map((r) => getGrossScore(r)).filter((s) => s > 9) // Filters out test scores like '1' or '2'
        )
      : "--";

  const lastGross =
    filteredRounds.length > 0
      ? getGrossScore(filteredRounds[0]).toFixed(0)
      : "--";
  console.log("filteredRounds count:", filteredRounds.length);
  console.log("myName:", myName);
  console.log(
    "first round score keys:",
    roundHistory[0]?.scores ? Object.keys(roundHistory[0].scores) : "none"
  );
  return (
    <div className="screen dashboard-view">
      <div className="nav-spacer"></div>
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2 className="profile-title">Dashboard</h2>
          <p className="welcome-label">WELCOME BACK, {myName.toUpperCase()}</p>
        </header>

        {/* Tab Buttons */}
        <div
          className="stats-tabs"
          style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
        >
          {["home", "away", "all"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "tab-active" : "tab-inactive"}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: "600",
                textTransform: "uppercase",
                backgroundColor:
                  activeTab === tab ? "#e0e0e0" : "rgba(255,255,255,0.05)",
                color: activeTab === tab ? "#333" : "#888",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <section className="stats-section">
          <div className="handicap-card-compact">
            <span className="handicap-label">HDCP</span>
            <div className="handicap-value-small">{displayHandicap}</div>
            <div
              className="hdcp-trend"
              style={{
                color:
                  trendDiff < 0
                    ? "#4ade80"
                    : trendDiff > 0
                    ? "#f87171"
                    : "#888",
                fontSize: "0.7rem",
                marginTop: "4px",
                fontWeight: "bold",
              }}
            >
              {trendDiff < 0 ? "↓ " : trendDiff > 0 ? "↑ " : "• "}
              {trendDiff === 0
                ? "STABLE"
                : `${Math.abs(trendDiff)}.0 vs LAST ROUND`}
            </div>
          </div>

          <div className="stats-grid-refined">
            <div className="stat-card-refined">
              <span className="stat-label">AVG GROSS</span>
              <span className="stat-value">{avgGross}</span>
            </div>
            <div className="stat-card-refined">
              <span className="stat-label">AVG NET</span>
              <span className="stat-value">{avgNet}</span>
            </div>
            <div className="stat-card-refined">
              <span className="stat-label">LAST GROSS</span>
              <span className="stat-value">{lastGross}</span>
            </div>
            <div className="stat-card-refined">
              <span className="stat-label">BEST GROSS</span>
              <span className="stat-value">
                {bestGross === 999 ? "--" : bestGross}
              </span>
            </div>
          </div>
        </section>

        {/* --- SIDE-BY-SIDE BUTTONS --- */}
        <div style={{ display: "flex", gap: "12px", margin: "20px 0" }}>
          <button
            className="setup-card"
            onClick={() => setView("stats")}
            style={{
              flex: 1,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "none",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📊</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "1rem",
                color: "#1b4332",
              }}
            >
              View Stats
            </div>
          </button>

          <button
            className="setup-card"
            onClick={() => setView("poty")}
            style={{
              flex: 1,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "none",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🏆</div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "1rem",
                color: "#1b4332",
              }}
            >
              Player of the Year
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
