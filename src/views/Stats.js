import React, { useState, useMemo, useEffect } from "react";

// --- POPUP MODAL ---
function BirdieBetModal({
  playerName,
  courseName,
  missingHoles,
  totalCount,
  onClose,
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "24px",
          padding: "30px",
          textAlign: "center",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#1b4332", fontSize: "1.5rem" }}>
          🏆 Birdie Bet 2026
        </h2>
        <p
          style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}
        >
          Birdies Made
        </p>
        <div
          style={{
            fontSize: "3rem",
            fontWeight: "900",
            color: "#1b4332",
            marginBottom: "20px",
          }}
        >
          {totalCount}
          <span style={{ color: "#cbd5e1", fontSize: "1.5rem" }}>/18</span>
        </div>
        <div
          style={{
            background: "#f8fafc",
            padding: "20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            maxHeight: "250px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: "800",
              color: "#94a3b8",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Holes Still Needed:
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
            }}
          >
            {missingHoles.map((h) => (
              <div
                key={h}
                style={{
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#475569",
                }}
              >
                {h}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: "25px",
            width: "100%",
            padding: "14px",
            background: "#1b4332",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---
function StatCard({ label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        padding: "15px 10px",
        borderRadius: "12px",
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          color: color || "#1b4332",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.6rem",
          color: "#888",
          marginTop: "4px",
          textTransform: "uppercase",
          fontWeight: "600",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function BarRow({ label, count, pct, color }) {
  const numericPct = parseFloat(pct) || 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: "0.85rem",
        marginBottom: "8px",
      }}
    >
      <div style={{ width: "60px", fontWeight: "600", color: "#444" }}>
        {label}
      </div>
      <div
        style={{
          flex: 1,
          background: "#f1f5f9",
          height: "8px",
          borderRadius: "4px",
          overflow: "hidden",
          margin: "0 10px",
        }}
      >
        <div
          style={{
            width: `${numericPct}%`,
            background: numericPct > 0 ? color : "transparent",
            height: "100%",
          }}
        ></div>
      </div>
      <div style={{ width: "85px", textAlign: "right", fontSize: "0.8rem" }}>
        <strong>{count}</strong> <span style={{ color: "#999" }}>({pct})</span>
      </div>
    </div>
  );
}
// --- MAIN STATS PAGE ---
export function Stats({
  user,
  roundHistory,
  courseDirectory,
  advancedStats,
  courses,
  onBack,
  statsTargetPlayer,
  holeStats = [],
  supabase,
  onRefresh,
  navigateTo,
  playerDirectory = [],
}) {
  const [filterMode, setFilterMode] = useState("Home");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [sortMode, setSortMode] = useState("Num");
  const [view, setView] = useState("stats");
  const [selectedRound, setSelectedRound] = useState(null);
  const [showBirdieModal, setShowBirdieModal] = useState(false);
  const [selectedHole, setSelectedHole] = useState(null);
  const [selectedRoundHoleStats, setSelectedRoundHoleStats] = useState([]);
  // --- ADD THIS USEEFFECT BLOCK ---
  useEffect(() => {
    if (!supabase) return;

    const statsChannel = supabase
      .channel("stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "round_history" },
        () => {
          console.log("Realtime: Round History updated");
          if (onRefresh) onRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hole_stats" },
        () => {
          console.log("Realtime: Hole Stats updated");
          if (onRefresh) onRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "active_rounds" },
        () => {
          console.log("Realtime: Active Round updated");
          if (onRefresh) onRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statsChannel);
    };
  }, [supabase, onRefresh]);
  const activeName = useMemo(() => {
    return statsTargetPlayer || user?.full_name || user?.email || "";
  }, [statsTargetPlayer, user]);

  const activeCourses = courseDirectory || courses || [];

  const getPlayerScores = (round) => {
    if (!round?.scores) return null;
    // Try by name first (old rounds)
    if (round.scores[activeName]) return round.scores[activeName];
    if (user?.full_name && round.scores[user.full_name])
      return round.scores[user.full_name];
    // Try by UUID (new rounds)
    const profile = playerDirectory?.find((p) => p.full_name === activeName);
    if (profile && round.scores[profile.id]) return round.scores[profile.id];
    return null;
  };

  const derivedHomeId = useMemo(() => {
    if (user?.home_course_id) return String(user.home_course_id);
    if (roundHistory && roundHistory.length > 0) {
      const counts = {};
      roundHistory.forEach((r) => {
        if (getPlayerScores(r) && r.course_id) {
          counts[r.course_id] = (counts[r.course_id] || 0) + 1;
        }
      });
      const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      return sorted.length > 0 ? String(sorted[0]) : null;
    }
    return null;
  }, [user, roundHistory, activeName]);

  const filteredRounds = useMemo(() => {
    if (!roundHistory) return [];
    return roundHistory.filter((r) => {
      const isHome =
        r.is_home_course === true ||
        (derivedHomeId && String(r.course_id) === derivedHomeId);
      const playerScores = getPlayerScores(r);
      if (!playerScores) return false;
  
      // Only include full 18-hole rounds
      const holesPlayed = Object.values(playerScores).filter(s => Number(s) > 0).length;
      if (holesPlayed < 18) return false;
  
      return filterMode === "Home" ? isHome : true;
    });
  }, [roundHistory, filterMode, derivedHomeId]);

  const finalizedRounds = useMemo(() => {
    return filteredRounds.filter((r) => r.id !== "live");
  }, [filteredRounds]);

  // --- LIVE ADVANCED STATS LOGIC ---
  const calculatedAdvancedStats = useMemo(() => {
    const validHoleStats = (holeStats || []).filter((stat) => {
      if (stat.player_name && stat.player_name !== activeName) return false;
      if (
        filterMode === "Home" &&
        derivedHomeId &&
        String(stat.course_id) !== derivedHomeId
      )
        return false;
      return true;
    });

    let totalFwAttempted = 0,
      totalFwHit = 0,
      totalGIR = 0,
      upDownSuccess = 0,
      upDownAttempts = 0,
      totalPutts = 0;

    validHoleStats.forEach((stat) => {
      const putts = Number(stat.putts) || 0;
      totalPutts += putts;

      if (Number(stat.par) > 3) {
        totalFwAttempted++;
        if (stat.fairway_hit === true || stat.fairway_hit === "Hit")
          totalFwHit++;
      }

      if (stat.green_in_regulation === true || stat.gir === "Hit") {
        totalGIR++;
      } else {
        upDownAttempts++;
        if (Number(stat.score) <= Number(stat.par)) upDownSuccess++;
      }
    });

    const count = validHoleStats.length || 0;
    return {
      overall: {
        fwPct:
          totalFwAttempted > 0
            ? Math.round((totalFwHit / totalFwAttempted) * 100)
            : 0,
        girPct: count > 0 ? Math.round((totalGIR / count) * 100) : 0,
        upDownPct:
          upDownAttempts > 0
            ? Math.round((upDownSuccess / upDownAttempts) * 100)
            : 0,
        avgPuttsHole: count > 0 ? (totalPutts / count).toFixed(1) : "0.0",
        avgPuttsRound:
          count > 0 ? ((totalPutts / count) * 18).toFixed(1) : "0.0",
      },
    };
  }, [holeStats, filterMode, derivedHomeId, activeName]);

  const stats = useMemo(() => {
    const data = {
      avg: "0.0",
      best: "-",
      worst: "-",
      counts: { Eagle: 0, Birdie: 0, Par: 0, Bogey: 0, Double: 0 },
      pct: {},
      birdieBet: 0,
      holeAnalysis: {},
      birdiedHoles: new Set(),
    };
    for (let i = 1; i <= 18; i++)
      data.holeAnalysis[i] = { relSum: 0, count: 0, best: 99, worst: 0 };

    if (!filteredRounds.length) return data;

    const scores = finalizedRounds
      .map((r) => {
        const s = getPlayerScores(r);
        return s
          ? Object.values(s).reduce((acc, val) => acc + (Number(val) || 0), 0)
          : 0;
      })
      .filter((s) => s > 0);

    if (scores.length) {
      data.avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      data.best = Math.min(...scores);
      data.worst = Math.max(...scores);
    }

    let totalHoles = 0;
    filteredRounds.forEach((r) => {
      const s = getPlayerScores(r);
      const course = activeCourses.find(
        (c) => String(c.id) === String(r.course_id)
      );
      if (s && course) {
        course.holes.forEach((h, i) => {
          const hNum = i + 1;
          const score = Number(s[hNum] || s[String(hNum)]);
          if (score > 0) {
            totalHoles++;
            const diff = score - h.par;
            if (diff <= -2) data.counts.Eagle++;
            else if (diff === -1) data.counts.Birdie++;
            else if (diff === 0) data.counts.Par++;
            else if (diff === 1) data.counts.Bogey++;
            else data.counts.Double++;

            data.holeAnalysis[hNum].relSum += diff;
            data.holeAnalysis[hNum].count++;
            data.holeAnalysis[hNum].best = Math.min(
              data.holeAnalysis[hNum].best,
              score
            );
            data.holeAnalysis[hNum].worst = Math.max(
              data.holeAnalysis[hNum].worst,
              score
            );
          }
        });
      }
    });

    const homeId = derivedHomeId;
    const homeCourse = activeCourses.find((c) => String(c.id) === homeId);
    if (homeCourse) {
      roundHistory.forEach((r) => {
        if (
          String(r.course_id) !== homeId ||
          new Date(r.date).getFullYear() !== 2026
        )
          return;
        const s = getPlayerScores(r);
        if (s)
          homeCourse.holes.forEach((h, i) => {
            const holeScore = Number(s[i + 1] || s[String(i + 1)]);
            if (holeScore > 0 && holeScore - h.par <= -1)
              data.birdiedHoles.add(i + 1);
          });
      });
    }

    data.birdieBet = data.birdiedHoles.size;
    Object.keys(data.counts).forEach(
      (k) =>
        (data.pct[k] = totalHoles
          ? ((data.counts[k] / totalHoles) * 100).toFixed(1) + "%"
          : "0%")
    );
    return data;
  }, [
    filteredRounds,
    activeCourses,
    user,
    roundHistory,
    activeName,
    derivedHomeId,
  ]);

  const sortedHoles = useMemo(() => {
    const keys = Object.keys(stats.holeAnalysis);
    if (sortMode === "Num") return keys;
    return [...keys].sort((a, b) => {
      const avgA =
        stats.holeAnalysis[a].count > 0
          ? stats.holeAnalysis[a].relSum / stats.holeAnalysis[a].count
          : 99;
      const avgB =
        stats.holeAnalysis[b].count > 0
          ? stats.holeAnalysis[b].relSum / stats.holeAnalysis[b].count
          : 99;
      return avgA - avgB;
    });
  }, [stats, sortMode]);

  // --- VIEW SWITCHING ---
  if (view === "history") {
    return (
      <div style={{ backgroundColor: "#f4f4f5", minHeight: "100vh" }}>
        {/* --- HEADER --- */}
        <div
          style={{
            background: "#fff",
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#1b4332", fontSize: "1.2rem" }}>
              Round History
            </h2>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                fontWeight: "600",
              }}
            >
              {filteredRounds.length} TOTAL ROUNDS
            </div>
          </div>
          <button
            onClick={() => setView("stats")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.8rem",
              color: "#ccc",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "15px" }}>
          {filteredRounds.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}
            >
              No rounds found for this filter.
            </div>
          ) : (
            // Sort rounds by date (newest first)
            [...filteredRounds]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((round, idx) => {
                const scores = getPlayerScores(round);
                const total = scores
                  ? Object.values(scores).reduce(
                      (a, b) => a + (Number(b) || 0),
                      0
                    )
                  : 0;

                return (
                  <div
                    key={round.id || idx}
                    onClick={async () => {
                      if (supabase && round.id) {
                        const { data } = await supabase
                          .from("hole_stats")
                          .select("*")
                          .eq("round_id", round.id);
                        setSelectedRoundHoleStats(data || []);
                      }
                      setSelectedRound(round);
                      setView("scorecard");
                    }}
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      padding: "15px",
                      marginBottom: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                      cursor: "pointer",
                      borderLeft:
                        total <= Number(stats.best)
                          ? "4px solid #10b981"
                          : "none",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "700",
                          color: "#1b4332",
                          marginBottom: "2px",
                        }}
                      >
                        {round.course_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          fontWeight: "500",
                        }}
                      >
                        {new Date(round.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "1.4rem",
                          fontWeight: "900",
                          color: "#1b4332",
                          lineHeight: 1,
                        }}
                      >
                        {total}
                      </div>
                      <div
                        style={{
                          fontSize: "0.6rem",
                          color: "#94a3b8",
                          fontWeight: "700",
                          marginTop: "4px",
                        }}
                      >
                        TOTAL
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    );
  }

  if (view === "scorecard" && selectedRound) {
    const scores = getPlayerScores(selectedRound);
    const course = activeCourses.find(
      (c) => String(c.id) === String(selectedRound.course_id)
    );

    // Helper to get color for the score relative to par
    const getScoreColor = (hNum) => {
      if (!course || !scores) return "#475569";
      const hole = course.holes[hNum - 1];
      const diff = Number(scores[hNum]) - hole.par;
      if (diff <= -1) return "#10b981"; // Birdie/Eagle
      if (diff === 0) return "#3b82f6"; // Par
      if (diff === 1) return "#94a3b8"; // Bogey
      return "#ef4444"; // Double+
    };

    return (
      <div style={{ backgroundColor: "#f4f4f5", minHeight: "100vh" }}>
        {/* --- HEADER --- */}
        <div
          style={{
            background: "#fff",
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ margin: 0, color: "#1b4332", fontSize: "1.2rem" }}>
            Round Scorecard
          </h2>
          <button
            onClick={() => setView("stats")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.8rem",
              color: "#ccc",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* --- COURSE INFO CARD --- */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 5px 0", color: "#1b4332" }}>
              {selectedRound.course_name}
            </h3>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                fontWeight: "600",
              }}
            >
              📅{" "}
              {new Date(selectedRound.date).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* --- SCORE GRID --- */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "15px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "center",
              }}
            >
              <thead>
                <tr
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                  }}
                >
                  <th
                    style={{
                      padding: "10px 5px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    Hole
                  </th>
                  {[...Array(9)].map((_, i) => (
                    <th
                      key={i + 1}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      {i + 1}
                    </th>
                  ))}
                  <th
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      color: "#1b4332",
                    }}
                  >
                    Out
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Front 9 Scores */}
                <tr style={{ fontSize: "0.95rem", fontWeight: "bold" }}>
                  <td style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                    Score
                  </td>
                  {[...Array(9)].map((_, i) => (
                    <td
                      key={i + 1}
                      style={{
                        padding: "12px 2px",
                        color: getScoreColor(i + 1),
                      }}
                    >
                      {scores[i + 1] || "-"}
                    </td>
                  ))}
                  <td style={{ background: "#f8fafc", borderRadius: "4px" }}>
                    {Object.entries(scores)
                      .slice(0, 9)
                      .reduce((a, b) => a + (Number(b[1]) || 0), 0)}
                  </td>
                </tr>

                {/* Back 9 Header */}
                <tr
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                  }}
                >
                  <th
                    style={{
                      padding: "20px 5px 10px 5px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    Hole
                  </th>
                  {[...Array(9)].map((_, i) => (
                    <th
                      key={i + 10}
                      style={{
                        paddingTop: "20px",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {i + 10}
                    </th>
                  ))}
                  <th
                    style={{
                      paddingTop: "20px",
                      borderBottom: "1px solid #f1f5f9",
                      color: "#1b4332",
                    }}
                  >
                    In
                  </th>
                </tr>

                {/* Back 9 Scores */}
                <tr style={{ fontSize: "0.95rem", fontWeight: "bold" }}>
                  <td style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                    Score
                  </td>
                  {[...Array(9)].map((_, i) => (
                    <td
                      key={i + 10}
                      style={{
                        padding: "12px 2px",
                        color: getScoreColor(i + 10),
                      }}
                    >
                      {scores[i + 10] || "-"}
                    </td>
                  ))}
                  <td style={{ background: "#f8fafc", borderRadius: "4px" }}>
                    {Object.entries(scores)
                      .slice(9, 18)
                      .reduce((a, b) => a + (Number(b[1]) || 0), 0)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* TOTAL SCORE FOOTER */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "15px",
                borderTop: "2px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: "800",
                  color: "#64748b",
                  fontSize: "0.8rem",
                }}
              >
                TOTAL ROUND SCORE
              </span>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "#1b4332",
                }}
              >
                {Object.values(scores).reduce(
                  (a, b) => a + (Number(b) || 0),
                  0
                )}
              </span>
            </div>
          </div>

          {/* Advanced Stats Section */}
          {selectedRoundHoleStats.length > 0 && (
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "15px",
                marginTop: "20px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 14px 0",
                  color: "#1b4332",
                  fontSize: "0.9rem",
                  fontWeight: "800",
                  textTransform: "uppercase",
                }}
              >
                Advanced Stats
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.75rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      color: "#94a3b8",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>
                      Hole
                    </th>
                    <th style={{ textAlign: "center", padding: "6px 4px" }}>
                      FW
                    </th>
                    <th style={{ textAlign: "center", padding: "6px 4px" }}>
                      GIR
                    </th>
                    <th style={{ textAlign: "right", padding: "6px 4px" }}>
                      Putts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRoundHoleStats
                    .sort((a, b) => a.hole_number - b.hole_number)
                    .map((s) => (
                      <tr
                        key={s.hole_number}
                        style={{ borderBottom: "1px solid #f8fafc" }}
                      >
                        <td style={{ padding: "8px 4px", fontWeight: "700" }}>
                          {s.hole_number}
                        </td>
                        <td style={{ textAlign: "center", padding: "8px 4px" }}>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              color:
                                s.fairway_hit === "Hit"
                                  ? "#10b981"
                                  : s.fairway_hit
                                  ? "#ef4444"
                                  : "#94a3b8",
                            }}
                          >
                            {s.fairway_hit === "Hit"
                              ? "✓"
                              : s.fairway_hit && s.fairway_hit !== ""
                              ? s.fairway_hit.replace("+Penalty", "⚠")
                              : "—"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", padding: "8px 4px" }}>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              color:
                                s.green_in_regulation === "Hit"
                                  ? "#10b981"
                                  : s.green_in_regulation
                                  ? "#ef4444"
                                  : "#94a3b8",
                            }}
                          >
                            {s.green_in_regulation === "Hit"
                              ? "✓"
                              : s.green_in_regulation &&
                                s.green_in_regulation !== "" &&
                                s.green_in_regulation !== "Penalty"
                              ? s.green_in_regulation
                              : s.green_in_regulation === "Penalty"
                              ? "⚠"
                              : "—"}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "8px 4px",
                            fontWeight: "700",
                            color:
                              Number(s.putts) === 1
                                ? "#10b981"
                                : Number(s.putts) >= 3
                                ? "#ef4444"
                                : "#334155",
                          }}
                        >
                          {s.putts || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }
  const missing = Array.from({ length: 18 }, (_, i) => i + 1).filter(
    (h) => !stats.birdiedHoles.has(h)
  );
  if (view === "holeDetail" && selectedHole) {
    const holeScoringHistory = filteredRounds.flatMap((r) => {
      const s = getPlayerScores(r);
      const course = activeCourses.find(
        (c) => String(c.id) === String(r.course_id)
      );
      if (!s || !course) return [];
      const hole = course.holes[selectedHole - 1];
      const score = Number(s[selectedHole] || s[String(selectedHole)]);
      if (!score) return [];
      return [
        {
          date: r.date,
          score,
          par: hole.par,
          diff: score - hole.par,
        },
      ];
    });

    const holeAdvanced = (holeStats || []).filter(
      (s) =>
        s.hole_number === parseInt(selectedHole) ||
        s.hole_number === selectedHole
    );

    const fwHit = holeAdvanced.filter((s) => s.fairway_hit === "Hit").length;
    const fwLeft = holeAdvanced.filter(
      (s) => s.fairway_hit === "Left" || s.fairway_hit === "Left+Penalty"
    ).length;
    const fwRight = holeAdvanced.filter(
      (s) => s.fairway_hit === "Right" || s.fairway_hit === "Right+Penalty"
    ).length;
    const fwTotal = holeAdvanced.filter(
      (s) => s.fairway_hit && s.fairway_hit !== ""
    ).length;

    const girHit = holeAdvanced.filter(
      (s) => s.green_in_regulation === "Hit"
    ).length;
    const girLeft = holeAdvanced.filter(
      (s) => s.green_in_regulation === "Left"
    ).length;
    const girRight = holeAdvanced.filter(
      (s) => s.green_in_regulation === "Right"
    ).length;
    const girShort = holeAdvanced.filter(
      (s) => s.green_in_regulation === "Short"
    ).length;
    const girLong = holeAdvanced.filter(
      (s) => s.green_in_regulation === "Long"
    ).length;
    const girTotal = holeAdvanced.filter(
      (s) =>
        s.green_in_regulation &&
        s.green_in_regulation !== "" &&
        s.green_in_regulation !== "Penalty"
    ).length;

    const puttsData = holeAdvanced.filter(
      (s) => s.putts && Number(s.putts) > 0
    );
    const avgPutts =
      puttsData.length > 0
        ? (
            puttsData.reduce((sum, s) => sum + Number(s.putts), 0) /
            puttsData.length
          ).toFixed(1)
        : "—";

    const avgScore =
      holeScoringHistory.length > 0
        ? (
            holeScoringHistory.reduce((sum, h) => sum + h.score, 0) /
            holeScoringHistory.length
          ).toFixed(1)
        : "—";
    const avgDiff =
      holeScoringHistory.length > 0
        ? (
            holeScoringHistory.reduce((sum, h) => sum + h.diff, 0) /
            holeScoringHistory.length
          ).toFixed(1)
        : "—";

    const cardStyle = {
      background: "#fff",
      borderRadius: "14px",
      padding: "16px",
      marginBottom: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    };

    const MissBar = ({ label, count, total, color }) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return (
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
        >
          <div
            style={{
              width: "55px",
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#475569",
            }}
          >
            {label}
          </div>
          <div
            style={{
              flex: 1,
              background: "#f1f5f9",
              borderRadius: "4px",
              height: "8px",
              overflow: "hidden",
              margin: "0 10px",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                background: color,
                height: "100%",
                borderRadius: "4px",
              }}
            />
          </div>
          <div
            style={{
              width: "65px",
              textAlign: "right",
              fontSize: "0.8rem",
              fontWeight: "700",
              color,
            }}
          >
            {count} ({pct}%)
          </div>
        </div>
      );
    };

    return (
      <div
        style={{
          backgroundColor: "#f4f4f5",
          minHeight: "100vh",
          paddingBottom: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#fff",
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#1b4332", fontSize: "1.2rem" }}>
              Hole {selectedHole} Stats
            </h2>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                fontWeight: "600",
              }}
            >
              {holeScoringHistory.length} rounds tracked
            </div>
          </div>
          <button
            onClick={() => setView("stats")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "#ccc",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "15px" }}>
          {/* Scoring Summary */}
          <div style={cardStyle}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: "800",
                color: "#1b4332",
                marginBottom: "14px",
                textTransform: "uppercase",
              }}
            >
              Scoring Summary
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { label: "Avg Score", value: avgScore, color: "#1b4332" },
                {
                  label: "Avg vs Par",
                  value: Number(avgDiff) > 0 ? `+${avgDiff}` : avgDiff,
                  color: Number(avgDiff) <= 0 ? "#10b981" : "#ef4444",
                },
                {
                  label: "Rounds",
                  value: holeScoringHistory.length,
                  color: "#64748b",
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900", color }}>
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#94a3b8",
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Score distribution */}
            <div
              style={{
                marginTop: "14px",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "800",
                  color: "#64748b",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                }}
              >
                Score Distribution
              </div>
              {[
                {
                  label: "Eagle-",
                  count: holeScoringHistory.filter((h) => h.diff <= -2).length,
                  color: "#f59e0b",
                },
                {
                  label: "Birdie",
                  count: holeScoringHistory.filter((h) => h.diff === -1).length,
                  color: "#10b981",
                },
                {
                  label: "Par",
                  count: holeScoringHistory.filter((h) => h.diff === 0).length,
                  color: "#3b82f6",
                },
                {
                  label: "Bogey",
                  count: holeScoringHistory.filter((h) => h.diff === 1).length,
                  color: "#94a3b8",
                },
                {
                  label: "Double+",
                  count: holeScoringHistory.filter((h) => h.diff >= 2).length,
                  color: "#ef4444",
                },
              ].map(({ label, count, color }) => (
                <MissBar
                  key={label}
                  label={label}
                  count={count}
                  total={holeScoringHistory.length}
                  color={color}
                />
              ))}
            </div>
          </div>

          {/* Fairway */}
          {fwTotal > 0 && (
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#1b4332",
                  marginBottom: "14px",
                  textTransform: "uppercase",
                }}
              >
                Fairway ({fwTotal > 0 ? Math.round((fwHit / fwTotal) * 100) : 0}
                % Hit)
              </div>
              <MissBar
                label="Hit"
                count={fwHit}
                total={fwTotal}
                color="#10b981"
              />
              <MissBar
                label="Left"
                count={fwLeft}
                total={fwTotal}
                color="#f59e0b"
              />
              <MissBar
                label="Right"
                count={fwRight}
                total={fwTotal}
                color="#ef4444"
              />
            </div>
          )}

          {/* GIR */}
          {girTotal > 0 && (
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#1b4332",
                  marginBottom: "14px",
                  textTransform: "uppercase",
                }}
              >
                Green in Regulation (
                {girTotal > 0 ? Math.round((girHit / girTotal) * 100) : 0}% Hit)
              </div>
              <MissBar
                label="Hit"
                count={girHit}
                total={girTotal}
                color="#10b981"
              />
              <MissBar
                label="Left"
                count={girLeft}
                total={girTotal}
                color="#f59e0b"
              />
              <MissBar
                label="Right"
                count={girRight}
                total={girTotal}
                color="#3b82f6"
              />
              <MissBar
                label="Short"
                count={girShort}
                total={girTotal}
                color="#8b5cf6"
              />
              <MissBar
                label="Long"
                count={girLong}
                total={girTotal}
                color="#ef4444"
              />
            </div>
          )}

          {/* Putts */}
          {puttsData.length > 0 && (
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#1b4332",
                  marginBottom: "14px",
                  textTransform: "uppercase",
                }}
              >
                Putting
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { label: "Avg Putts", value: avgPutts, color: "#3b82f6" },
                  {
                    label: "1-Putt",
                    value: `${
                      puttsData.filter((s) => Number(s.putts) === 1).length
                    }`,
                    color: "#10b981",
                  },
                  {
                    label: "2-Putt",
                    value: `${
                      puttsData.filter((s) => Number(s.putts) === 2).length
                    }`,
                    color: "#64748b",
                  },
                  {
                    label: "3+ Putt",
                    value: `${
                      puttsData.filter((s) => Number(s.putts) >= 3).length
                    }`,
                    color: "#ef4444",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{ fontSize: "1.2rem", fontWeight: "900", color }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        color: "#94a3b8",
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent rounds */}
          <div style={cardStyle}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: "800",
                color: "#1b4332",
                marginBottom: "14px",
                textTransform: "uppercase",
              }}
            >
              Recent Rounds
            </div>
            {[...holeScoringHistory]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {new Date(h.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "0.9rem",
                      color:
                        h.diff < 0
                          ? "#10b981"
                          : h.diff === 0
                          ? "#3b82f6"
                          : "#ef4444",
                      background:
                        h.diff < 0
                          ? "#dcfce7"
                          : h.diff === 0
                          ? "#dbeafe"
                          : "#fee2e2",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {h.score} (
                    {h.diff === 0 ? "E" : h.diff > 0 ? `+${h.diff}` : h.diff})
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        backgroundColor: "#f4f4f5",
        minHeight: "100vh",
        paddingBottom: "40px",
      }}
    >
      {showBirdieModal && (
        <BirdieBetModal
          totalCount={stats.birdieBet}
          missingHoles={missing}
          courseName="Home Course"
          onClose={() => setShowBirdieModal(false)}
        />
      )}

      <div style={{ background: "#fff", padding: "15px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, color: "#1b4332", fontSize: "1.2rem" }}>
            {statsTargetPlayer
              ? `${statsTargetPlayer}'s Stats`
              : "My Performance"}
          </h2>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "#ccc",
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            display: "flex",
            background: "#f1f5f9",
            borderRadius: "8px",
            padding: "4px",
            marginTop: "15px",
          }}
        >
          <button
            onClick={() => setFilterMode("Home")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              border: "none",
              background: filterMode === "Home" ? "#fff" : "transparent",
              fontWeight: "600",
            }}
          >
            Home
          </button>
          <button
            onClick={() => setFilterMode("All")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              border: "none",
              background: filterMode === "All" ? "#fff" : "transparent",
              fontWeight: "600",
            }}
          >
            All Courses
          </button>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Top Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {/* AVG Card - Opens the full Round History list */}
          <StatCard
            label="AVG"
            value={stats.avg}
            onClick={() => setView("history")}
          />

          {/* BEST Card - Finds the round with the lowest score and opens its scorecard */}
          <StatCard
            label="BEST"
            value={stats.best}
            color="#10b981"
            onClick={async () => {
              const bestRnd = filteredRounds.find((r) => {
                const s = getPlayerScores(r);
                const total = s
                  ? Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0)
                  : 0;
                return total === Number(stats.best);
              });
              if (bestRnd) {
                // Only fetch from Supabase if it's a real finalized round
                if (supabase && bestRnd.id && bestRnd.id !== "live") {
                  const { data: hsData } = await supabase
                    .from("hole_stats")
                    .select("*")
                    .eq("round_id", bestRnd.id);
                  setSelectedRoundHoleStats(hsData || []);
                } else {
                  // Live round - use advancedStats from props
                  setSelectedRoundHoleStats([]);
                }
                setSelectedRound(bestRnd);
                setView("scorecard");
              }
            }}
          />

          {/* WORST Card - Finds the round with the highest score and opens its scorecard */}
          <StatCard
            label="WORST"
            value={stats.worst}
            color="#ef4444"
            onClick={async () => {
              const worstRnd = filteredRounds.find((r) => {
                const s = getPlayerScores(r);
                const total = s
                  ? Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0)
                  : 0;
                return total === Number(stats.worst);
              });
              if (worstRnd) {
                if (supabase && worstRnd.id && worstRnd.id !== "live") {
                  const { data: hsData } = await supabase
                    .from("hole_stats")
                    .select("*")
                    .eq("round_id", worstRnd.id); // 👈 was bestRnd.id
                  setSelectedRoundHoleStats(hsData || []);
                } else {
                  setSelectedRoundHoleStats([]);
                }
                setSelectedRound(worstRnd); // 👈 was bestRnd
                setView("scorecard");
              }
            }}
          />
        </div>

        {/* Scoring Distribution Block */}
        <div
          style={{
            padding: "20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#1b4332",
              fontSize: "1rem",
              marginBottom: "15px",
            }}
          >
            Scoring Distribution
          </h3>
          <BarRow
            label="Eagle"
            count={stats.counts.Eagle}
            pct={stats.pct.Eagle}
            color="#f59e0b"
          />
          <BarRow
            label="Birdie"
            count={stats.counts.Birdie}
            pct={stats.pct.Birdie}
            color="#10b981"
          />
          <BarRow
            label="Par"
            count={stats.counts.Par}
            pct={stats.pct.Par}
            color="#3b82f6"
          />
          <BarRow
            label="Bogey"
            count={stats.counts.Bogey}
            pct={stats.pct.Bogey}
            color="#9ca3af"
          />
          <BarRow
            label="Double"
            count={stats.counts.Double}
            pct={stats.pct.Double}
            color="#ef4444"
          />

          {/* Birdie Bet Progress */}
          <div
            onClick={() => setShowBirdieModal(true)}
            style={{
              marginTop: "20px",
              paddingTop: "15px",
              borderTop: "1px solid #f1f5f9",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#1b4332",
                }}
              >
                🏆 BIRDIE BET PROGRESS
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#1b4332",
                }}
              >
                {stats.birdieBet}/18
              </span>
            </div>
            <div
              style={{
                background: "#f1f5f9",
                height: "10px",
                borderRadius: "5px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(stats.birdieBet / 18) * 100}%`,
                  background: "#1b4332",
                  height: "100%",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* --- ADVANCED STATS SUMMARY --- */}
        {calculatedAdvancedStats?.overall &&
        parseFloat(calculatedAdvancedStats.overall.avgPuttsRound) > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "6px", // Slightly more gap for better tap targets
              marginBottom: "20px",
              padding: "0 5px",
            }}
          >
            <StatCard
              label="FW"
              value={`${calculatedAdvancedStats.overall.fwPct}%`}
              color="#2d6a4f"
            />
            <StatCard
              label="GIR"
              value={`${calculatedAdvancedStats.overall.girPct}%`}
              color="#2d6a4f"
            />
            <StatCard
              label="UP/DN"
              value={`${calculatedAdvancedStats.overall.upDownPct}%`}
              color="#40916c"
              // Success = Missed Green but Score <= Par
            />
            <StatCard
              label="P/H"
              value={calculatedAdvancedStats.overall.avgPuttsHole}
              color="#1b4332"
            />
            <StatCard
              label="P/R"
              value={calculatedAdvancedStats.overall.avgPuttsRound}
              color="#1b4332"
            />
          </div>
        ) : null}
        {/* Hole Analysis Block */}
        <div
          style={{
            padding: "20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ margin: 0, color: "#1b4332", fontSize: "1rem" }}>
              Hole Analysis
            </h3>
            <div
              style={{
                background: "#f1f5f9",
                borderRadius: "6px",
                padding: "2px",
                display: "flex",
              }}
            >
              <button
                onClick={() => setSortMode("Num")}
                style={{
                  border: "none",
                  background: sortMode === "Num" ? "#fff" : "transparent",
                  fontSize: "0.6rem",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                }}
              >
                1-18
              </button>
              <button
                onClick={() => setSortMode("Rank")}
                style={{
                  border: "none",
                  background: sortMode === "Rank" ? "#fff" : "transparent",
                  fontSize: "0.6rem",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                }}
              >
                Rank
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8rem",
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "1px solid #eee", color: "#94a3b8" }}
                >
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>
                    Hole
                  </th>
                  <th style={{ textAlign: "center", padding: "8px 4px" }}>
                    Avg
                  </th>
                  <th style={{ textAlign: "center", padding: "8px 4px" }}>
                    Best
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Rnds
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedHoles.map((hNum) => {
                  const data = stats.holeAnalysis[hNum];
                  const avg =
                    data.count > 0
                      ? (data.relSum / data.count).toFixed(1)
                      : "-";
                  const avgColor =
                    avg === "-"
                      ? "#000"
                      : Number(avg) <= 0
                      ? "#10b981"
                      : "#ef4444";
                  return (
                    <tr
                      key={hNum}
                      onClick={() => {
                        setSelectedHole(hNum);
                        setView("holeDetail");
                      }}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "10px 4px", fontWeight: "bold" }}>
                        {hNum}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color: avgColor,
                          fontWeight: "bold",
                        }}
                      >
                        {avg > 0 ? `+${avg}` : avg}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {data.best === 99 ? "-" : data.best}
                      </td>
                      <td style={{ textAlign: "right", color: "#94a3b8" }}>
                        {data.count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Hole Stats Button goes HERE */}
        <button
          onClick={() => navigateTo && navigateTo("holeStatsBreakdown")}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "16px",
            backgroundColor: "#1b4332",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "800",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(27,67,50,0.2)",
          }}
        >
          Detailed Hole Stats
        </button>
      </div>
    </div>
  );
}
