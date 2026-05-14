/**
 * Calculates comprehensive round statistics for a player
 */
export const calculateRoundStats = (playerScores, holes, handicap = 0) => {
  let totalGross = 0;
  const stats = { eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 };
  const holeCount = holes.length;

  holes.forEach((hole, index) => {
    const score = playerScores[index + 1];
    if (score && typeof score === "number") {
      totalGross += score;
      const diff = score - hole.par;

      if (diff <= -2) stats.eagle++;
      else if (diff === -1) stats.birdie++;
      else if (diff === 0) stats.par++;
      else if (diff === 1) stats.bogey++;
      else if (diff >= 2) stats.double++;
    }
  });

  const totalNet = totalGross - handicap;

  // Helper to get percentage
  const getPct = (count) => ((count / holeCount) * 100).toFixed(0) + "%";

  return {
    gross: totalGross,
    net: totalNet,
    counts: stats,
    percentages: {
      eagle: getPct(stats.eagle),
      birdie: getPct(stats.birdie),
      par: getPct(stats.par),
      bogey: getPct(stats.bogey),
      double: getPct(stats.double),
    },
  };
};
