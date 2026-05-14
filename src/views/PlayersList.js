import React from "react";

export default function PlayersList({
  players = [],
  roundHistory = [],
  potyStandings = [],
  onSelectPlayer,
}) {
  // 1. Filter for Members only
  const members = players.filter((p) => p.is_member);

  // 2. Identify Leader Points for "Points Behind" calculation
  const leaderPoints = potyStandings.length > 0 ? potyStandings[0].points : 0;

  const getPlayerStats = (player) => {
    const name = player.full_name || player.p_name;

    // Get POTY data from the existing standings you passed in
    const potyEntry = potyStandings.find((s) => s.name === name);
    const rank = potyStandings.findIndex((s) => s.name === name) + 1;

    // HCP TREND calculation (Comparing current to the very last round they played)
    const lastRound = [...roundHistory]
      .reverse()
      .find((r) => r.players?.includes(name));
    const previousHcp = lastRound?.player_handicaps?.[name];
    const currentHcp =
      player.calculated_handicap ?? player.initial_handicap ?? 0;
    const change = previousHcp !== undefined ? currentHcp - previousHcp : 0;

    return {
      rank: rank > 0 ? rank : "-",
      ptsBehind: potyEntry
        ? (potyEntry.points - leaderPoints).toFixed(1)
        : "0.0",
      hcp: currentHcp,
      change: change,
    };
  };

  const sortedMembers = [...members].sort((a, b) =>
    (a.full_name || "").localeCompare(b.full_name || "")
  );

  return (
    <div
      className="screen"
      style={{ paddingBottom: "100px", backgroundColor: "#f4f7f6" }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "#1b4332",
          padding: "20px",
          color: "white",
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.3rem",
            fontWeight: "800",
            letterSpacing: "0.5px",
          }}
        >
          Member Directory
        </h2>
      </div>

      {/* COLUMN HEADINGS */}
      <div
        style={{
          display: "flex",
          padding: "0 25px 5px 25px",
          fontSize: "0.65rem",
          fontWeight: "800",
          color: "#888",
          textTransform: "uppercase",
        }}
      >
        <div style={{ flex: 1 }}>Member Name</div>
        <div style={{ width: "45px", textAlign: "center" }}>HCP</div>
        <div style={{ width: "45px", textAlign: "center" }}>Trend</div>
      </div>

      <div style={{ padding: "0 15px" }}>
        {[...sortedMembers]
          .sort((a, b) => getPlayerStats(a).rank - getPlayerStats(b).rank) // <-- ADD THIS LINE
          .map((player) => {
            const stats = getPlayerStats(player);
            const isLeader = stats.ptsBehind === "0.0" && stats.rank === 1;

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player)}
                style={{
                  background: "white",
                  marginBottom: "8px",
                  padding: "12px 15px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                  border: "1px solid #eee",
                }}
              >
                {/* RANK NUMBER */}
                <div
                  style={{
                    width: "25px",
                    fontWeight: "bold",
                    color: "#aaa",
                    fontSize: "0.9rem",
                  }}
                >
                  {stats.rank}
                </div>

                {/* NAME & POTY INFO */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "800",
                      color: "#1b4332",
                      fontSize: "1rem",
                    }}
                  >
                    {player.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: isLeader ? "#2d6a4f" : "#666",
                      fontWeight: isLeader ? "bold" : "normal",
                    }}
                  >
                    {isLeader
                      ? "★ POTY Leader"
                      : `${stats.ptsBehind} pts behind`}
                  </div>
                </div>

                {/* STATS COLUMNS */}
                <div style={{ display: "flex", gap: "5px" }}>
                  <div style={{ width: "45px", textAlign: "center" }}>
                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: "1.1rem",
                        color: "#333",
                      }}
                    >
                      {stats.hcp}
                    </div>
                  </div>
                  <div style={{ width: "45px", textAlign: "center" }}>
                    <div
                      style={{
                        fontWeight: "900",
                        fontSize: "0.9rem",
                        color:
                          stats.change < 0
                            ? "#2d6a4f"
                            : stats.change > 0
                            ? "#c1121f"
                            : "#aaa",
                      }}
                    >
                      {stats.change < 0 ? "↓" : stats.change > 0 ? "↑" : ""}
                      {Math.abs(stats.change)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
