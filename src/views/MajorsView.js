import React from "react";

const TROPHY_LOGOS = {
  Masters: "/Logos/Masters_Logo.png",
  "The Masters": "/Logos/Masters_Logo.png",
  "PGA Championship": "/Logos/Wannemaker.jpg",
  PGA: "/Logos/Wannemaker.jpg",
  "US Open": "/Logos/usopen.png",
  "U.S. Open": "/Logos/usopen.png",
  "The Open": "/Logos/The_Open_Championship_logo.png",
  "The Open Championship": "/Logos/The_Open_Championship_logo.png",
  "British Open": "/Logos/The_Open_Championship_logo.png",
};

const MajorsView = ({ history, onBack }) => {
  // 1. Group wins by player name
  const groupedWinners = history.reduce((acc, record) => {
    const name = record.winner_name || record.winner;
    if (!acc[name]) acc[name] = [];
    acc[name].push(record);
    return acc;
  }, {});

  // 2. Convert to array and SORT by wins (highest to lowest)
  const sortedChampions = Object.entries(groupedWinners).sort((a, b) => {
    return b[1].length - a[1].length; // b.length - a.length sorts descending
  });

  const getLogo = (win) => {
    const name = win.major_name || "";
    if (TROPHY_LOGOS[name]) return TROPHY_LOGOS[name];
    if (win.logo_path) return win.logo_path;
    return "/Logos/generic-trophy.png";
  };

  return (
    <div className="majors-container">
      <div
        className="majors-header"
        style={{ display: "flex", alignItems: "center", padding: "10px" }}
      >
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1 style={{ flexGrow: 1, textAlign: "center", color: "#1b4332" }}>
          Hall of Champions
        </h1>
      </div>

      <div className="champions-list">
        {sortedChampions.map(([winner, wins]) => (
          <div
            key={winner}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "15px",
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                minWidth: "110px", // Increased slightly for name space
              }}
            >
              {winner}
            </span>
            <div
              style={{
                display: "flex",
                gap: "15px",
                flexGrow: 1,
                marginLeft: "10px",
                flexWrap: "wrap",
              }}
            >
              {wins.map((win, idx) => (
                <div key={idx} style={{ textAlign: "center" }}>
                  <img
                    src={getLogo(win)}
                    alt="trophy"
                    style={{
                      width: "35px",
                      height: "35px",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.target.src = "/Logos/generic-trophy.png";
                    }}
                  />
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>
                    '{win.year.toString().slice(-2)}
                  </div>
                </div>
              ))}
            </div>
            <span
              style={{
                color: "#2e7d32",
                fontWeight: "bold",
                fontSize: "1.1rem",
                minWidth: "30px",
                textAlign: "right",
              }}
            >
              ({wins.length})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MajorsView;
