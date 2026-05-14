import React from "react";

export default function VerticalScorecard({
  selectedCourse,
  players = [],
  scores = {},
  playerHandicaps = {},
  mode = "gross",
  onBack,
  onViewStats,
}) {
  // --- HELPERS ---
  const getStrokesForHole = (hcp, holeDifficulty) => {
    if (!holeDifficulty) return 0;
    const baseStrokes = Math.floor(hcp / 18);
    const extraStroke = holeDifficulty <= hcp % 18 ? 1 : 0;
    return baseStrokes + extraStroke;
  };

  const getQuotaPoints = (score, par) => {
    if (!score) return 0;
    const diff = score - par;
    if (diff <= -2) return 8; // Eagle
    if (diff === -1) return 4; // Birdie
    if (diff === 0) return 2; // Par
    if (diff === 1) return 1; // Bogey
    return 0;
  };

  const getCellValue = (playerId, holeNum) => {
    const rawScore = parseInt(scores[playerId]?.[holeNum], 10);
    if (!rawScore) return null;
    const hole = selectedCourse.holes[holeNum - 1];
    const hcp = playerHandicaps[playerId] || 0;

    if (mode === "net") {
      return rawScore - getStrokesForHole(hcp, hole.difficulty);
    }
    if (mode === "game") {
      return getQuotaPoints(rawScore, hole.par);
    }
    return rawScore;
  };

  // --- NEW: TV MARKINGS LOGIC ---
  const getScoreShapeClass = (playerId, holeNum) => {
    if (mode === "game") return "";
    const displayedScore = getCellValue(playerId, holeNum);
    if (displayedScore === null) return "";

    const par = selectedCourse.holes[holeNum - 1].par;
    const diff = displayedScore - par;

    if (diff <= -2) return "shape-eagle"; // Double Circle
    if (diff === -1) return "shape-birdie"; // Single Circle
    if (diff === 1) return "shape-bogey"; // Single Square
    if (diff >= 2) return "shape-double-bogey"; // Double Square
    return ""; // Par is plain
  };

  const getSum = (playerId, startHole, endHole) => {
    let sum = 0;
    let hasValue = false;
    for (let i = startHole; i <= endHole; i++) {
      const val = getCellValue(playerId, i);
      if (val !== null) {
        sum += val;
        hasValue = true;
      }
    }
    return hasValue ? sum : "-";
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `70px repeat(${players.length}, 1fr)`,
    width: "100%",
    gap: "0px",
  };

  const getHeaderTitle = () => {
    if (mode === "net") return "Full Card (Net)";
    if (mode === "game") return "Quota Points Card";
    return "Full Card (Gross)";
  };

  if (!selectedCourse || !selectedCourse.holes) return null;

  return (
    <div className="screen scorecard-view">
      <div className="lb-header" style={{ position: "relative" }}>
        {/* --- ADDED BACK BUTTON --- */}
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            background: "rgba(0,0,0,0.05)",
            border: "none",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            fontSize: "1.2rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1b4332",
          }}
        >
          ✕
        </button>

        <h2>{getHeaderTitle()}</h2>
        <span className="course-info-sub">⛳️ {selectedCourse.name}</span>
      </div>
      {/* Detailed Stats Button */}
      {onViewStats && (
        <div style={{ padding: "8px 15px 12px 15px" }}>
          <button
            onClick={onViewStats}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "transparent",
              color: "#1b4332",
              border: "1px solid #1b4332",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "0.8rem",
              cursor: "pointer",
              opacity: 0.7,
            }}
          >
            View Detailed Hole Stats
          </button>
        </div>
      )}
      <div className="scorecard-container-scroll">
        <div className="vertical-scorecard-grid" style={gridStyle}>
          <div className="grid-cell header-cell sticky-col">Hole</div>
          {players.map((player) => {
            const id = typeof player === "object" ? player.id : player;
            const name = typeof player === "object" ? player.full_name : player;
            return (
              <div key={id} className="grid-cell header-cell player-name-cell">
                {name.split(" ")[0]}
              </div>
            );
          })}

          {selectedCourse.holes.map((hole, index) => {
            const holeNum = index + 1;
            const holeHcp = hole.difficulty || hole.handicap || "--";
            const rows = [];

            rows.push(
              <React.Fragment key={`hole-${holeNum}`}>
                <div className="grid-cell sticky-col hole-info-stack">
                  <span className="h-num">{holeNum}</span>
                  <span className="h-details">P{hole.par}</span>
                  <span className="h-details">HCP {holeHcp}</span>
                </div>
                {players.map((player) => {
                  const id = typeof player === "object" ? player.id : player;
                  return (
                    <div
                      key={`${id}-${holeNum}`}
                      className="grid-cell score-cell"
                    >
                      <span
                        className={`score-badge ${getScoreShapeClass(
                          id,
                          holeNum
                        )}`}
                      >
                        {getCellValue(id, holeNum) ?? "-"}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            );

            if (holeNum === 9) {
              rows.push(
                <React.Fragment key="row-front">
                  <div className="grid-cell sticky-col summary-label-cell">
                    FRONT
                  </div>
                  {players.map((p) => {
                    const id = typeof p === "object" ? p.id : p;
                    return (
                      <div
                        key={`front-${id}`}
                        className="grid-cell summary-score-cell"
                      >
                        {getSum(id, 1, 9)}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            }

            if (holeNum === 18) {
              rows.push(
                <React.Fragment key="row-back">
                  <div className="grid-cell sticky-col summary-label-cell">
                    BACK
                  </div>
                  {players.map((p) => {
                    const id = typeof p === "object" ? p.id : p;
                    return (
                      <div
                        key={`back-${id}`}
                        className="grid-cell summary-score-cell"
                      >
                        {getSum(id, 10, 18)}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
              rows.push(
                <React.Fragment key="row-total">
                  <div className="grid-cell sticky-col total-label-cell">
                    TOTAL
                  </div>
                  {players.map((p) => {
                    const id = typeof p === "object" ? p.id : p;
                    return (
                      <div
                        key={`tot-${id}`}
                        className="grid-cell total-score-cell"
                      >
                        {getSum(id, 1, 18)}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            }
            return rows;
          })}
        </div>
      </div>
    </div>
  );
}
