import React from "react";

// --- VEGAS CALCULATION ENGINE ---
const calculateVegasScores = (
  teamA,
  teamB,
  scores,
  holes,
  playerHandicaps = {}
) => {
  console.log(
    "calculateVegasScores called with playerHandicaps:",
    JSON.stringify(playerHandicaps)
  );
  console.log("teamA:", JSON.stringify(teamA));
  console.log("teamB:", JSON.stringify(teamB));
  let totalA = 0;
  let totalB = 0;

  // Helper to calculate strokes given on a hole
  const getStrokes = (hcp, holeDifficulty) => {
    if (!holeDifficulty) return 0;
    const baseStrokes = Math.floor(hcp / 18);
    const extraStroke = holeDifficulty <= hcp % 18 ? 1 : 0;
    return baseStrokes + extraStroke;
  };
  // Helper to get display name from UUID
  const getName = (p) => {
    if (typeof p === "object" && p.full_name) return p.full_name;
    const profile = playerDirectory?.find((dir) => dir.id === p);
    return profile?.full_name || p;
  };
  holes.forEach((h, i) => {
    const holeNum = i + 1;
    // TEMPORARY DEBUG - remove after fixing
    if (holeNum === 1) {
      console.log("Hole 1 difficulty:", h.difficulty);
      console.log("playerHandicaps:", JSON.stringify(playerHandicaps));
      teamA.forEach((p) => {
        const hcp =
          typeof playerHandicaps[p] === "object"
            ? playerHandicaps[p].current
            : playerHandicaps[p] || 0;
        console.log(
          `TeamA - ${p}: HCP=${hcp}, gross=${
            scores[p]?.[1]
          }, strokes=${getStrokes(hcp, h.difficulty)}, net=${
            scores[p]?.[1] - getStrokes(hcp, h.difficulty)
          }`
        );
      });
      teamB.forEach((p) => {
        const hcp =
          typeof playerHandicaps[p] === "object"
            ? playerHandicaps[p].current
            : playerHandicaps[p] || 0;
        console.log(
          `TeamB - ${p}: HCP=${hcp}, gross=${
            scores[p]?.[1]
          }, strokes=${getStrokes(hcp, h.difficulty)}, net=${
            scores[p]?.[1] - getStrokes(hcp, h.difficulty)
          }`
        );
      });
    }
    const aScores = teamA
      .map((p) => {
        const gross = parseInt(scores[p]?.[holeNum], 10);
        if (isNaN(gross)) return NaN;
        const hcp =
          typeof playerHandicaps[p] === "object"
            ? playerHandicaps[p].current
            : playerHandicaps[p] || 0;
        const strokes = getStrokes(hcp, h.difficulty);
        if (holeNum === 1)
          console.log(
            `aScores ${p}: gross=${gross}, hcp=${hcp}, difficulty=${
              h.difficulty
            }, strokes=${strokes}, net=${gross - strokes}`
          );
        return gross - getStrokes(hcp, h.difficulty);
      })
      .filter((s) => !isNaN(s));

    const bScores = teamB
      .map((p) => {
        const gross = parseInt(scores[p]?.[holeNum], 10);
        if (isNaN(gross)) return NaN;
        const hcp =
          typeof playerHandicaps[p] === "object"
            ? playerHandicaps[p].current
            : playerHandicaps[p] || 0;
        return gross - getStrokes(hcp, h.difficulty);
      })
      .filter((s) => !isNaN(s));

    if (aScores.length === teamA.length && bScores.length === teamB.length) {
      const t1Sorted = [...aScores].sort((a, b) => a - b);
      const t2Sorted = [...bScores].sort((a, b) => a - b);

      let t1Points = Number(`${t1Sorted[0]}${t1Sorted[1]}`);
      let t2Points = Number(`${t2Sorted[0]}${t2Sorted[1]}`);

      // Birdie flip logic uses net scores (under par = birdie)
      const t1Birdie = t1Sorted[0] < h.par;
      const t2Birdie = t2Sorted[0] < h.par;

      if (t1Birdie && !t2Birdie) {
        t2Points = Number(`${t2Sorted[1]}${t2Sorted[0]}`);
      } else if (t2Birdie && !t1Birdie) {
        t1Points = Number(`${t1Sorted[1]}${t1Sorted[0]}`);
      }

      totalA += t1Points;
      totalB += t2Points;
    }
  });

  return { totalA, totalB };
};

export default function Leaderboard({
  players,
  scores,
  selectedCourse,
  roundDate,
  isHistorical,
  setView,
  onBack,
  setStatsTargetPlayer,
  selectedGames = [],
  matchConfig,
  vegasConfig = null,
  playerHandicaps = {},
  isFinalized,
  onSelectPlayer,
  keptHoles = {},
  isMajor = false,
  majorName = "",
  playerPhones = {},
  onTrackStats,
  playerDirectory = [],
  onFinish,
  roundId,
}) {
  // --- HELPER: Resolve display name from UUID or object ---
  const getName = (p) => {
    if (typeof p === "object" && p?.full_name) return p.full_name;
    const profile = playerDirectory?.find((dir) => dir.id === p);
    return profile?.full_name || p;
  };
  // --- VENMO LOGIC ---
  const handleVenmoPayment = (playerName) => {
    const note = encodeURIComponent(
      `Golf Bet: ${selectedCourse?.name || "Round"}`
    );
    const venmoUrl = `venmo://paycharge?txn=pay&note=${note}`;
    window.location.href = venmoUrl;
  };

  // --- SHARE SUMMARY LOGIC (NATIVE SMS) ---
  // --- SHARE SUMMARY LOGIC (NATIVE SMS) ---
  const handleShareSummary = () => {
    const phoneNumbers = players
      .map((p) => {
        const name = getName(p);
        const pId = typeof p === "object" ? p.id : p;
        const profile = playerDirectory?.find((dir) => dir.id === pId);
        return profile?.phone || profile?.phone_number || null;
      })
      .filter((num) => !!num)
      .map((num) => num.replace(/\D/g, ""))
      .map((num) => (num.length === 10 ? `+1${num}` : `+${num}`))
      .join(",");

    const date = new Date(roundDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    let message = `⛳ ${selectedCourse?.name || "Golf"} - ${date}\n\n`;

    // 1. Net Leaderboard
    message += `NET RESULTS\n`;
    sortedPlayers.forEach((p, i) => {
      const name = typeof p === "object" ? p.full_name : p;
      const lastName = getLastName(name);
      const stats = getPlayerStats(name);
      const pos = i + 1;
      message += `${pos}. ${lastName}: ${stats.netRel} net (${stats.grossRel} gross)\n`;
    });

    // 2. Quota Points
    if (selectedGames.includes("Quota Points")) {
      message += `\nQUOTA\n`;
      const sortedQuota = [...players].sort((a, b) => {
        const nameA = typeof a === "object" ? a.full_name : a;
        const nameB = typeof b === "object" ? b.full_name : b;
        return (
          parseInt(getPlayerStats(nameB).quotaRel) -
          parseInt(getPlayerStats(nameA).quotaRel)
        );
      });
      sortedQuota.forEach((p) => {
        const name = typeof p === "object" ? p.full_name : p;
        message += `${getLastName(name)}: ${getPlayerStats(name).quotaRel}\n`;
      });
    }

    // 3. Match Play
    if (selectedGames.includes("Match Play") && matchConfig) {
      message += `\nMATCH PLAY\n`;
      message += `Total: ${getMatchStatus(1, 18)}\n`;
      message += `F9: ${getMatchStatus(1, 9)} | B9: ${getMatchStatus(
        10,
        18
      )}\n`;
    }

    // 4. Vegas
    if (selectedGames.includes("Vegas") && matchConfig) {
      const { totalA, totalB } = calculateVegasScores(
        matchConfig.teamA,
        matchConfig.teamB,
        scores,
        selectedCourse?.holes || [],
        playerHandicaps
      );
      message += `\nVEGAS\n`;
      message += `Team A: ${totalA} | Team B: ${totalB}\n`;
    }

    // 5. 11's Game
    if (selectedGames.includes("11's")) {
      const winner = sortedElevens[0];
      const name = typeof winner === "object" ? winner.full_name : winner;
      const winStats = getElevensStats(name);
      message += `\n11'S: ${getLastName(name)} wins (${winStats.netRel})\n`;
    }

    // 6. Skins
    if (selectedGames.includes("Skins")) {
      message += `\nSKINS\n`;
      let skinsFound = false;
      sortedSkinsPlayers.forEach((p) => {
        const name = typeof p === "object" ? p.full_name : p;
        if (skinWinners[name] > 0) {
          message += `${getLastName(name)}: ${skinWinners[name]}\n`;
          skinsFound = true;
        }
      });
      if (!skinsFound) message += "No skins\n";
    }

    // Deep link back to round summary
    // roundId comes from props
    // Deep link back to round summary
    if (roundId) {
      message += `\n\n📲 Full leaderboard:\https://5jmz8f.csb.app/?view=leaderboard&round=${roundId}`;
    }
    alert("roundId: " + roundId);
    const encodedMsg = encodeURIComponent(message);
    window.location.href = `sms:${phoneNumbers}?&body=${encodedMsg}`;

    // Find players who made a 2 and have a phone number
    const twosPhoneNumbers = players
      .filter((p) => {
        const name = typeof p === "object" ? p.full_name : p;
        const playerScores = scores[name] || {};
        return Object.values(playerScores).some((s) => Number(s) === 2);
      })
      .map((p) => {
        const name = typeof p === "object" ? p.full_name : p;
        const profile = playerDirectory?.find((dir) => dir.full_name === name);
        return profile?.phone || profile?.phone_number || null;
      })
      .filter((num) => !!num)
      .map((num) => num.replace(/\D/g, ""))
      .map((num) => (num.length === 10 ? `+1${num}` : `+${num}`))
      .join(",");

    if (twosPhoneNumbers) {
      const diceMessage = `🎲 You made a 2 today — time to roll!\nhttps://5jmz8f.csb.app/?view=diceRoller`;
      const encodedDiceMsg = encodeURIComponent(diceMessage);
      setTimeout(() => {
        window.location.href = `sms:${twosPhoneNumbers}?&body=${encodedDiceMsg}`;
      }, 1000);
    }
    window.location.href = `sms:${phoneNumbers}?&body=${encodedMsg}`;
  };

  const getLastName = (p) => {
    const name = typeof p === "object" ? p.full_name : getName(p);
    return name ? name.split(" ").pop() : "";
  };

  // --- HELPER: Unified Stroke Calculation ---
  const getStrokesForHole = (hcp, holeDifficulty) => {
    if (!holeDifficulty) return 0;
    const baseStrokes = Math.floor(hcp / 18);
    const extraStroke = holeDifficulty <= hcp % 18 ? 1 : 0;
    return baseStrokes + extraStroke;
  };

  // --- HELPER: Quota Points ---
  const getQuotaPoints = (score, par) => {
    const diff = score - par;
    if (diff <= -2) return 8;
    if (diff === -1) return 4;
    if (diff === 0) return 2;
    if (diff === 1) return 1;
    return 0;
  };

  // --- STATS CALCULATION ---
  const getPlayerStats = (p) => {
    const pId = typeof p === "object" ? p.id : p;
    const pScores = scores[pId] || {};
    let currentQuotaPts = 0;
    let totalGrossRel = 0;
    let totalNetRel = 0;

    const rawHcp = playerHandicaps[pId] || 0;
    const hcp = typeof rawHcp === "object" ? rawHcp.current : rawHcp;
    const quotaTarget = 36 - hcp;

    selectedCourse?.holes.forEach((h, i) => {
      const holeNum = i + 1;
      const rawScore = pScores[holeNum];

      if (rawScore) {
        const val = parseInt(rawScore, 10);
        totalGrossRel += val - h.par;
        currentQuotaPts += getQuotaPoints(val, h.par);

        const strokes = getStrokesForHole(hcp, h.difficulty);
        const netScore = val - strokes;
        totalNetRel += netScore - h.par;
      }
    });

    return {
      quotaRel:
        currentQuotaPts - quotaTarget > 0
          ? `+${currentQuotaPts - quotaTarget}`
          : currentQuotaPts - quotaTarget,
      grossRel:
        totalGrossRel === 0
          ? "E"
          : totalGrossRel > 0
          ? `+${totalGrossRel}`
          : totalGrossRel,
      netRel:
        totalNetRel === 0
          ? "E"
          : totalNetRel > 0
          ? `+${totalNetRel}`
          : totalNetRel,
      rawNetRel: totalNetRel,
      hcp: hcp,
    };
  };

  // --- MATCH PLAY STATUS ---
  const getMatchStatus = (startHole, endHole) => {
    let aWins = 0,
      bWins = 0,
      playedCount = 0;
    const totalHolesInRange = endHole - startHole + 1;
    const { teamA, teamB } = matchConfig || {};
    if (!teamA || !teamB) return "Setup Teams";

    for (let i = startHole; i <= endHole; i++) {
      const hole = selectedCourse?.holes[i - 1];
      const aScores = teamA.map((p) => scores[p]?.[i]);
      const bScores = teamB.map((p) => scores[p]?.[i]);

      if (aScores.every((s) => s > 0) && bScores.every((s) => s > 0)) {
        playedCount++;
        const aBest = Math.min(
          ...teamA.map(
            (p) =>
              parseInt(scores[p][i], 10) -
              getStrokesForHole(playerHandicaps[p], hole.difficulty)
          )
        );
        const bBest = Math.min(
          ...teamB.map(
            (p) =>
              parseInt(scores[p][i], 10) -
              getStrokesForHole(playerHandicaps[p], hole.difficulty)
          )
        );
        if (aBest < bBest) aWins++;
        else if (bBest < aBest) bWins++;
      }
    }
    if (playedCount === 0) return "AS";
    const diff = Math.abs(aWins - bWins);
    const leaderLabel =
      aWins > bWins
        ? teamA.map(getLastName).join("/")
        : teamB.map(getLastName).join("/");
    const holesLeft = totalHolesInRange - playedCount;

    if (diff === 0) return "AS";

    // Match is over — clinched before last hole
    if (diff > holesLeft && holesLeft > 0) {
      return `${leaderLabel} ${diff}&${holesLeft}`;
    }

    // Match finished all holes
    if (holesLeft === 0) {
      return `${leaderLabel} ${diff} UP`;
    }

    // Dormie — leader is up by exactly the holes remaining
    if (diff === holesLeft) {
      return `${leaderLabel} DORMIE`;
    }

    // Match still in progress
    return `${leaderLabel} ${diff} UP`;
  };

  // --- 11'S GAME LOGIC ---
  const getElevensStats = (p) => {
    const pId = typeof p === "object" ? p.id : p;
    const pKept = keptHoles[pId] || [];
    let totalNetRel = 0;

    const rawHcp = playerHandicaps[pId] || 0;
    const hcp = typeof rawHcp === "object" ? rawHcp.current : rawHcp;

    pKept.forEach((holeNum) => {
      const hole = selectedCourse?.holes[holeNum - 1];
      const rawScore = parseInt(scores[pId]?.[holeNum], 10);
      if (rawScore && hole) {
        totalNetRel +=
          rawScore -
          getStrokesForHole(hcp, hole.difficulty) - // 👈 USE hcp INSTEAD OF playerHandicaps[pName]
          hole.par;
      }
    });
    return {
      count: pKept.length,
      netRel:
        totalNetRel === 0
          ? "E"
          : totalNetRel > 0
          ? `+${totalNetRel}`
          : totalNetRel,
      rawNet: totalNetRel,
    };
  };

  // --- SKINS LOGIC ---
  const getSkinsData = () => {
    let carryOver = 0;
    const winners = {},
      wonHoles = {};
    players.forEach((p) => {
      const pId = typeof p === "object" ? p.id : p;
      winners[pId] = 0;
      wonHoles[pId] = [];
    });

    selectedCourse?.holes.forEach((h, i) => {
      const holeNum = i + 1;
      let minScore = 999,
        scoresOnHole = [];
      players.forEach((p) => {
        const pId = typeof p === "object" ? p.id : p;
        const raw = scores[pId]?.[holeNum];
        if (raw) {
          const net =
            parseInt(raw, 10) -
            getStrokesForHole(playerHandicaps[pId], h.difficulty);
          if (net < minScore) minScore = net;
          scoresOnHole.push({ player: pId, net });
        }
      });
      const holeWinners = scoresOnHole.filter((s) => s.net === minScore);
      if (holeWinners.length === 1) {
        winners[holeWinners[0].player] += 1 + carryOver;
        wonHoles[holeWinners[0].player].push(holeNum);
        carryOver = 0;
      } else if (scoresOnHole.length > 0) carryOver++;
    });
    return { winners, wonHoles };
  };

  const { winners: skinWinners, wonHoles } = getSkinsData();

  const sortedPlayers = isMajor
    ? [...players].sort((a, b) => {
        const idA = typeof a === "object" ? a.id : a;
        const idB = typeof b === "object" ? b.id : b;
        return getPlayerStats(idA).rawNetRel - getPlayerStats(idB).rawNetRel;
      })
    : players;
  const sortedElevens = [...players].sort((a, b) => {
    const idA = typeof a === "object" ? a.id : a;
    const idB = typeof b === "object" ? b.id : b;
    return getElevensStats(idA).rawNet - getElevensStats(idB).rawNet;
  });

  const sortedSkinsPlayers = [...players].sort((a, b) => {
    const idA = typeof a === "object" ? a.id : a;
    const idB = typeof b === "object" ? b.id : b;
    return skinWinners[idB] - skinWinners[idA];
  });

  return (
    <div
      className="screen leaderboard-view"
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "20px",
        paddingBottom: "100px",
      }}
    >
      {/* Back Button */}
      {!isHistorical && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#1a4731",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            marginBottom: "10px",
            padding: "5px 0",
          }}
        >
          ← Back to Scorecard
        </button>
      )}
      {/* Date Header */}
      {isHistorical && roundDate && (
        <div
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#64748b",
            fontWeight: "700",
            marginBottom: "15px",
            backgroundColor: "white",
            padding: "8px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          📅{" "}
          {new Date(roundDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )}

      {/* Title Banners */}
      {isMajor ? (
        <div
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            padding: "15px",
            borderRadius: "16px",
            textAlign: "center",
            marginBottom: "20px",
            border: "2px solid #fff",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: "900",
              color: "#451a03",
              letterSpacing: "2px",
            }}
          >
            OFFICIAL MAJOR CHAMPIONSHIP
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#fff" }}>
            🏆 {majorName.toUpperCase()} 🏆
          </div>
        </div>
      ) : (
        <h2
          style={{
            color: "#1a4731",
            textAlign: "center",
            fontWeight: "900",
            fontSize: "1.5rem",
            marginBottom: "20px",
          }}
        >
          LEADERBOARD
        </h2>
      )}

      {/* --- NATIVE SMS SHARE BUTTON --- */}
      {isFinalized && (
        <button
          onClick={handleShareSummary}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#007aff",
            color: "white",
            border: "none",
            borderRadius: "14px",
            fontWeight: "900",
            fontSize: "0.85rem",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(0, 122, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          💬 TEXT ROUND SUMMARY
        </button>
      )}

      {/* Match Play Section */}
      {selectedGames.includes("Match Play") && players.length >= 2 && (
        <div
          style={{
            background: "#1a4731",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "25px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "10px",
            }}
          >
            <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>MATCH TOTAL</div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "900",
                color: "#fbbf24",
              }}
            >
              {getMatchStatus(1, 18)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.65rem", opacity: 0.8 }}>FRONT 9</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "800" }}>
                {getMatchStatus(1, 9)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.65rem", opacity: 0.8 }}>BACK 9</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "800" }}>
                {getMatchStatus(10, 18)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- VEGAS DISPLAY CARD --- */}
      {selectedGames.includes("Vegas") &&
        vegasConfig &&
        vegasConfig.teamA.length === 2 && (
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "25px",
              color: "white",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
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
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "900",
                  color: "#94a3b8",
                  letterSpacing: "1px",
                }}
              >
                VEGAS POINTS
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "900",
                  padding: "4px 8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                }}
              >
                2v2
              </span>
            </div>

            {(() => {
              const { totalA, totalB } = calculateVegasScores(
                vegasConfig.teamA,
                vegasConfig.teamB,
                scores,
                selectedCourse?.holes || [],
                playerHandicaps
              );
              const diff = totalA - totalB;

              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: "900",
                        color: diff < 0 ? "#4ade80" : "white",
                      }}
                    >
                      {totalA}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>
                      {vegasConfig.teamA.map((p) => getLastName(p)).join("/")}
                    </div>
                  </div>

                  <div style={{ padding: "0 20px", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "900",
                        color: "#fbbf24",
                        background: "rgba(251,191,36,0.1)",
                        padding: "4px 12px",
                        borderRadius: "20px",
                      }}
                    >
                      {diff === 0
                        ? "EVEN"
                        : `${Math.abs(diff)} ${diff < 0 ? "UP" : "DN"}`}
                    </div>
                  </div>

                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: "900",
                        color: diff > 0 ? "#4ade80" : "white",
                      }}
                    >
                      {totalB}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>
                      {vegasConfig.teamB.map((p) => getLastName(p)).join("/")}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      {/* Main Stats Cards */}
      <div className="leaderboard-list">
        {sortedPlayers.map((p) => {
          const pId = typeof p === "object" ? p.id : p;
          const name = getName(p);
          const stats = getPlayerStats(pId);
          return (
            <div
              key={name}
              className="glass-card"
              style={{
                marginBottom: "15px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
                borderRadius: "16px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
              onClick={() => {
                if (onSelectPlayer) onSelectPlayer(name);
                else if (setStatsTargetPlayer) {
                  setStatsTargetPlayer(name);
                  if (setView) setView("verticalScorecard");
                }
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "1.1rem",
                    color: "#1e293b",
                  }}
                >
                  {name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  HCP: {stats.hcp}
                </div>
              </div>

              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                {selectedGames.includes("Quota Points") && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "0.55rem",
                        color: "#60a5fa",
                        fontWeight: "bold",
                      }}
                    >
                      QUOTA
                    </div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "800",
                        color: "#2563eb",
                      }}
                    >
                      {stats.quotaRel}
                    </div>
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "0.55rem",
                      color: "#94a3b8",
                      fontWeight: "bold",
                    }}
                  >
                    GROSS
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "800",
                      color: "#334155",
                    }}
                  >
                    {stats.grossRel}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "0.55rem",
                      color: isMajor ? "#d97706" : "#16a34a",
                      fontWeight: "bold",
                    }}
                  >
                    {isMajor ? "TOURNEY" : "NET"}
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: "800",
                      color: isMajor ? "#fff" : "#16a34a",
                      background: isMajor ? "#fbbf24" : "#dcfce7",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {stats.netRel}
                  </div>
                </div>

                {isFinalized && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVenmoPayment(name);
                    }}
                    style={{
                      marginLeft: "10px",
                      backgroundColor: "#3d95ce",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      fontSize: "0.7rem",
                      fontWeight: "900",
                    }}
                  >
                    PAY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 11's Standings */}
      {selectedGames.includes("11's") && (
        <div style={{ marginTop: "30px" }}>
          <h3
            style={{
              color: "#1a4731",
              fontSize: "0.9rem",
              fontWeight: "900",
              marginBottom: "10px",
            }}
          >
            11'S GAME STANDINGS
          </h3>
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody style={{ fontSize: "0.9rem" }}>
                {sortedElevens.map((p) => {
                  const name = typeof p === "object" ? p.full_name : p;
                  const stats = getElevensStats(name);
                  return (
                    <tr
                      key={name}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: "15px", fontWeight: "700" }}>
                        {getLastName(name)}
                      </td>
                      <td style={{ textAlign: "center", padding: "15px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "800",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            background:
                              stats.count === 11 ? "#dcfce7" : "#f1f5f9",
                            color: stats.count === 11 ? "#16a34a" : "#64748b",
                          }}
                        >
                          {stats.count === 11 ? "✓" : `${stats.count}/11`}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "15px",
                          fontWeight: "900",
                        }}
                      >
                        {stats.netRel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skins Standings */}
      {selectedGames.includes("Skins") && (
        <div style={{ marginTop: "30px" }}>
          <h3
            style={{
              color: "#1a4731",
              fontSize: "0.9rem",
              fontWeight: "900",
              marginBottom: "10px",
            }}
          >
            NET SKINS
          </h3>
          <div style={{ background: "white", borderRadius: "16px" }}>
            {sortedSkinsPlayers.map((p) => {
              const name = typeof p === "object" ? p.full_name : p;
              const skinsWon = skinWinners[name] || 0;

              if (skinsWon === 0) return null;

              return (
                <div
                  key={name}
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: "700" }}>{getLastName(name)}</span>
                  <span
                    style={{
                      fontWeight: "900",
                      color: "#16a34a",
                      background: "#dcfce7",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {skinsWon} Skins
                  </span>
                </div>
              );
            })}

            {/* Show message if no skins were won by anyone */}
            {Object.values(skinWinners).every((s) => s === 0) && (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#64748b",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                No skins won today.
              </div>
            )}
          </div>
        </div>
      )}
      {/* --- NEW: ADVANCED STATS TOGGLE --- */}
      {!isHistorical && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "white",
            borderRadius: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <h4
              style={{
                margin: "0 0 5px 0",
                color: "#1a4731",
                fontWeight: "800",
                fontSize: "1rem",
              }}
            >
              My Advanced Stats
            </h4>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
              Track Fairways, GIR & Putts
            </p>
          </div>
          <button
            onClick={() =>
              onTrackStats ? onTrackStats() : setView("holeStats")
            }
            style={{
              padding: "10px 16px",
              backgroundColor: "#1a4731",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: "900",
              fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(26, 71, 49, 0.2)",
            }}
          >
            TRACK 📊
          </button>
        </div>
      )}
      {/* Finish & Save Button */}
      {!isHistorical && (
        <button
          onClick={() => {
            if (window.confirm("Finish and save this round?")) {
              onFinish();
            }
          }}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#1b4332",
            color: "white",
            border: "none",
            borderRadius: "14px",
            fontWeight: "900",
            fontSize: "0.85rem",
            marginTop: "12px",
            marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(27, 67, 50, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          🏆 Finish & Save Round
        </button>
      )}
    </div>
  );
}
