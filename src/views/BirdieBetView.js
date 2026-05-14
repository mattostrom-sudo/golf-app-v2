import React, { useMemo } from "react";

export default function BirdieBetView({
  playerDirectory = [],
  roundHistory = [],
  courseDirectory = [],
  onBack,
}) {
  const currentYear = new Date().getFullYear();

  // Find home course
  const homeCourse = courseDirectory.find(c => c.is_home_course === true);

  // Get all birdie bet players
  const birdieBetPlayers = playerDirectory.filter(p => p.is_birdie_bet === true);

  // Calculate birdied holes per player
  const playerProgress = useMemo(() => {
    return birdieBetPlayers.map(player => {
      const birdiedHoles = new Set();

      roundHistory.forEach(round => {
        if (!homeCourse) return;
        if (String(round.course_id) !== String(homeCourse.id)) return;
        if (new Date(round.date).getFullYear() !== currentYear) return;

        // Get this player's scores — try UUID first, then name
        const playerScores =
          round.scores?.[player.id] ||
          round.scores?.[player.full_name] ||
          {};

        const course = homeCourse;
        course.holes?.forEach((hole, i) => {
          const holeNum = i + 1;
          const score = Number(playerScores[holeNum]);
          if (score > 0 && score <= hole.par - 1) {
            birdiedHoles.add(holeNum);
          }
        });
      });

      return {
        id: player.id,
        name: player.full_name,
        birdiedHoles: Array.from(birdiedHoles).sort((a, b) => a - b),
        count: birdiedHoles.size,
        missingHoles: Array.from({ length: 18 }, (_, i) => i + 1)
          .filter(h => !birdiedHoles.has(h)),
      };
    }).sort((a, b) => b.count - a.count);
  }, [birdieBetPlayers, roundHistory, homeCourse, currentYear]);

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", paddingBottom: "100px", paddingTop: "60px" }}>
      {/* Header */}
      <div style={{
        background: "#1b4332",
        padding: "20px",
        color: "white",
        textAlign: "center",
        marginBottom: "20px",
      }}>
        <div style={{ fontSize: "2rem" }}>🐦</div>
        <h2 style={{ margin: "5px 0 0 0", fontSize: "1.3rem", fontWeight: "800" }}>
          Birdie Bet {currentYear}
        </h2>
        <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
          {homeCourse?.name || "Home Course"} • Birdie every hole
        </div>
      </div>

      <div style={{ padding: "0 15px" }}>
        {/* Leaderboard */}
        {playerProgress.map((player, index) => (
          <div key={player.id} style={{
            background: "white",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            {/* Player header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: index === 0 ? "#fbbf24" : "#e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "900", fontSize: "0.8rem",
                  color: index === 0 ? "#451a03" : "#64748b",
                }}>
                  {index + 1}
                </div>
                <div style={{ fontWeight: "800", fontSize: "1rem", color: "#1e293b" }}>
                  {player.name}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#1b4332" }}>
                  {player.count}
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "600" }}>/18</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: "#f1f5f9", borderRadius: "6px", height: "8px", overflow: "hidden", marginBottom: "12px" }}>
              <div style={{
                width: `${(player.count / 18) * 100}%`,
                background: player.count === 18 ? "#fbbf24" : "#1b4332",
                height: "100%",
                borderRadius: "6px",
                transition: "width 0.5s ease",
              }} />
            </div>

            {/* Hole grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px" }}>
              {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => {
                const birdied = player.birdiedHoles.includes(hole);
                return (
                  <div key={hole} style={{
                    aspectRatio: "1",
                    borderRadius: "4px",
                    background: birdied ? "#1b4332" : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    fontWeight: "700",
                    color: birdied ? "white" : "#94a3b8",
                  }}>
                    {hole}
                  </div>
                );
              })}
            </div>

            {player.count === 18 && (
              <div style={{
                marginTop: "10px", textAlign: "center",
                background: "#fef3c7", borderRadius: "8px",
                padding: "8px", fontSize: "0.8rem",
                fontWeight: "800", color: "#92400e",
              }}>
                🏆 COMPLETE!
              </div>
            )}
          </div>
        ))}

        {playerProgress.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            No players enrolled in the Birdie Bet.
          </div>
        )}
      </div>
    </div>
  );
}