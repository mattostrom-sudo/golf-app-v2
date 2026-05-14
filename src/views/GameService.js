// GameService.js

// 1. HELPER: Calculate the NEW quota for the NEXT round
// Call this function when a user hits "Finish Round" to save their new target.
export const calculateNextQuota = (previousQuota, pointsScored) => {
  const diff = pointsScored - previousQuota;

  // Rule 1: Missed by > 6 (e.g. -7, -8...) -> Down by 2
  if (diff < -6) {
    return previousQuota - 2;
  }

  // Rule 2: Missed by 6-1 (e.g. -6 to -1) -> Down by 1
  if (diff >= -6 && diff <= -1) {
    return previousQuota - 1;
  }

  // Rule 3: Hit Quota exactly (0) -> No Change
  if (diff === 0) {
    return previousQuota;
  }

  // Rule 4: Exceeded by 1-6 -> Increase by 50% (0.5) rounded up
  if (diff >= 1 && diff <= 6) {
    return previousQuota + Math.ceil(diff * 0.5);
  }

  // Rule 5: Exceeded by > 6 (e.g. +7...) -> Increase by 75% (0.75) rounded up
  if (diff > 6) {
    return previousQuota + Math.ceil(diff * 0.75);
  }

  return previousQuota;
};

// 2. MAIN: Calculate current game status for the Leaderboard
export const calculateGameStatus = (
  gameType,
  players,
  scores,
  selectedCourse,
  handicaps,
  currentQuotas = {} // <--- NEW: Pass in existing quotas for Round 2+
) => {
  const holes = selectedCourse.holes;
  const results = {};

  players.forEach((p) => (results[p] = { total: 0, points: 0, status: "" }));

  switch (gameType) {
    case "Quota Points":
      players.forEach((player) => {
        let points = 0;
        const playerScores = scores[player] || {};

        // Calculate Points
        holes.forEach((hole, idx) => {
          const s = playerScores[idx + 1];
          if (!s) return;
          const diff = s - hole.par;
          if (diff <= -2) points += 8; // Eagle
          else if (diff === -1) points += 4; // Birdie
          else if (diff === 0) points += 2; // Par
          else if (diff === 1) points += 1; // Bogey
        });

        // DETERMINE TARGET:
        // If a quota is passed in (Round 2+), use it.
        // Otherwise, default to 36 - Handicap (Round 1).
        const quota =
          currentQuotas[player] !== undefined
            ? currentQuotas[player]
            : 36 - (handicaps[player] || 0);

        results[player] = {
          score: points,
          target: quota,
          vsQuota: points - quota,
        };
      });
      break;

    case "Match Play":
      // Basic 1v1 Logic (Note: Your Leaderboard.js handles the complex Nassau logic)
      if (players.length >= 2) {
        let p1Wins = 0;
        let p2Wins = 0;
        holes.forEach((hole, idx) => {
          const s1 = scores[players[0]]?.[idx + 1];
          const s2 = scores[players[1]]?.[idx + 1];
          if (s1 && s2) {
            if (s1 < s2) p1Wins++;
            else if (s2 < s1) p2Wins++;
          }
        });
        results.matchStatus =
          p1Wins > p2Wins
            ? `${players[0]} ${p1Wins - p2Wins} UP`
            : p2Wins > p1Wins
            ? `${players[1]} ${p2Wins - p1Wins} UP`
            : "AS";
      }
      break;
  }
  return results;
};
