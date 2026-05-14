import React, { useMemo } from "react";

export function BirdieBet({ roundHistory, courses, user, onBack }) {
  const leaderboard = useMemo(() => {
    // 1. Robust Safety Checks
    const rawHomeId = String(user?.home_course_id || "").trim();
    if (!rawHomeId || !roundHistory || !courses) return [];

    const playersData = {};

    // 2. Find Crystal Lake (Home Course)
    const homeCourse = courses.find((c) => String(c.id).trim() === rawHomeId);
    if (!homeCourse) return [];

    // 3. Filter rounds played ONLY at Crystal Lake
    const homeRounds = roundHistory.filter((r) => {
      const roundCourseId = String(r.course_id || "").trim();
      return roundCourseId === rawHomeId;
    });

    // 4. Scan every round for every player's birdies
    homeRounds.forEach((round) => {
      const allScores = round.scores;
      if (!allScores) return;

      Object.entries(allScores).forEach(([playerName, holeScores]) => {
        // Normalize name to prevent duplicates (e.g., "Matt " vs "Matt")
        const normalizedName = playerName.trim();

        if (!playersData[normalizedName]) {
          playersData[normalizedName] = new Set();
        }

        homeCourse.holes.forEach((hole, idx) => {
          const holeNum = idx + 1;
          const score = Number(
            holeScores[holeNum] || holeScores[String(holeNum)]
          );

          // BIRDIE BET LOGIC: Score must be less than Par
          if (score > 0 && score < hole.par) {
            playersData[normalizedName].add(holeNum);
          }
        });
      });
    });

    // 5. Transform into sortable array
    return Object.entries(playersData)
      .map(([name, birdiedHolesSet]) => ({
        name,
        count: birdiedHolesSet.size,
        remaining: Array.from({ length: 18 }, (_, i) => i + 1).filter(
          (h) => !birdiedHolesSet.has(h)
        ),
      }))
      .sort((a, b) => b.count - a.count); // Rank by most unique birdies
  }, [roundHistory, courses, user]);

  // Helper for Course Name in Header
  const homeCourseName =
    courses?.find(
      (c) => String(c.id).trim() === String(user?.home_course_id || "").trim()
    )?.name || "Crystal Lake";

  return (
    <div
      className="screen"
      style={{ backgroundColor: "#f4f4f5", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <div
        style={{
          background: "#fff",
          padding: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ marginLeft: "55px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#991b1b",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🐦</span> Birdie Bet
            </h2>
            <button
              onClick={onBack}
              style={{
                background: "#fee2e2",
                border: "none",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                color: "#991b1b",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
              margin: "4px 0 0 0",
              fontWeight: "600",
            }}
          >
            {homeCourseName}
          </p>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {leaderboard.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#94a3b8",
            }}
          >
            No home course rounds found. Get out there and make some birdies!
          </div>
        ) : (
          leaderboard.map((player, index) => (
            <div
              key={player.name}
              style={{
                marginBottom: "15px",
                padding: "18px",
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* Player Identity and Score */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: "800",
                      color: index === 0 ? "#f59e0b" : "#94a3b8",
                    }}
                  >
                    #{index + 1}
                  </span>
                  <span
                    style={{
                      fontWeight: "700",
                      color: "#1e293b",
                      fontSize: "1.1rem",
                    }}
                  >
                    {player.name}
                  </span>
                </div>
                <div
                  style={{
                    background: "#991b1b",
                    color: "#fff",
                    padding: "5px 12px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                  }}
                >
                  {player.count} / 18
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "12px",
                  background: "#f1f5f9",
                  borderRadius: "6px",
                  overflow: "hidden",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    width: `${(player.count / 18) * 100}%`,
                    height: "100%",
                    background: "#ef4444",
                    borderRadius: "6px",
                    transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>

              {/* Grid of Remaining Holes */}
              <div>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  Remaining Hunt
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {player.remaining.length === 0 ? (
                    <span
                      style={{
                        fontSize: "0.9rem",
                        color: "#10b981",
                        fontWeight: "bold",
                      }}
                    >
                      🏆 CHAMPION: BET COMPLETED
                    </span>
                  ) : (
                    player.remaining.map((h) => (
                      <div
                        key={h}
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#fff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          color: "#334155",
                          fontWeight: "700",
                        }}
                      >
                        {h}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
