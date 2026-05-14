export const calculateCustomHandicap = (
  history,
  initialHcp,
  playerName = null
) => {
  if (!history || history.length === 0) {
    return {
      current: Math.round(initialHcp),
      previous: Math.round(initialHcp),
      diff: 0,
    };
  }

  const sortedRounds = [...history].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const getScore = (round) => {
    const par =
      round.total_par ||
      round.course_data?.holes?.reduce((sum, h) => sum + h.par, 0) ||
      72;

    const holes = round.course_data?.holes || [];
    const playerScores = round.scores?.[playerName] || {};
    const hcp = round.player_handicaps?.[playerName] || initialHcp || 0;

    // Count how many holes have actual scores
    const holesPlayed = holes.filter(
      (h, i) => Number(playerScores[i + 1]) > 0
    ).length;

    // Build per-hole historical averages from fully completed rounds
    const completeRounds = sortedRounds.filter((r) => {
      if (r === round) return false;
      const s = r.scores?.[playerName] || {};
      const rHoles = r.course_data?.holes || [];
      return (
        rHoles.length > 0 &&
        rHoles.filter((h, i) => Number(s[i + 1]) > 0).length >= rHoles.length
      );
    });

    const holeHistory = {};
    completeRounds.forEach((r) => {
      const s = r.scores?.[playerName] || {};
      const rHoles = r.course_data?.holes || [];
      rHoles.forEach((h, i) => {
        const hNum = i + 1;
        const score = Number(s[hNum]);
        if (score > 0) {
          if (!holeHistory[hNum]) holeHistory[hNum] = [];
          holeHistory[hNum].push(score - h.par);
        }
      });
    });

    // Overall avg diff per hole from THIS partial round (fallback)
    const partialDiffs = holes
      .map((h, i) => ({ h, score: Number(playerScores[i + 1]) }))
      .filter(({ score }) => score > 0)
      .map(({ h, score }) => score - h.par);
    const overallAvgDiff =
      partialDiffs.length > 0
        ? partialDiffs.reduce((a, b) => a + b, 0) / partialDiffs.length
        : 0;

    // Calculate normalized total
    let playerTotal = 0;

    if (holes.length === 0) {
      // No course data — fall back to raw sum
      playerTotal = Object.values(playerScores).reduce(
        (sum, val) => sum + (Number(val) || 0),
        0
      );
    } else if (holesPlayed >= holes.length) {
      // Full round — use actual scores
      playerTotal = Object.values(playerScores).reduce(
        (sum, val) => sum + (Number(val) || 0),
        0
      );
    } else {
      // Partial round — fill missing holes
      holes.forEach((hole, i) => {
        const holeNum = i + 1;
        const actual = Number(playerScores[holeNum]);

        if (actual > 0) {
          playerTotal += actual;
        } else if (
          completeRounds.length >= 2 &&
          holeHistory[holeNum]?.length > 0
        ) {
          // EMA-weighted historical average for this specific hole
          const holeDiffs = holeHistory[holeNum];
          let ema = holeDiffs[0];
          holeDiffs.forEach((diff, idx) => {
            const k = 2 / (idx + 2);
            ema = diff * k + ema * (1 - k);
          });
          playerTotal += hole.par + Math.round(ema);
        } else if (
          completeRounds.length === 1 &&
          holeHistory[holeNum]?.length > 0
        ) {
          // Simple average from 1 complete round
          const avg =
            holeHistory[holeNum].reduce((a, b) => a + b, 0) /
            holeHistory[holeNum].length;
          playerTotal += hole.par + Math.round(avg);
        } else if (partialDiffs.length > 0) {
          // Use this round's own avg differential as fallback
          playerTotal += hole.par + Math.round(overallAvgDiff);
        } else {
          // No data at all — net par
          const baseStrokes = Math.floor(hcp / 18);
          const extraStroke = hole.difficulty <= hcp % 18 ? 1 : 0;
          playerTotal += hole.par + baseStrokes + extraStroke;
        }
      });
    }

    if (!playerTotal || playerTotal === 0) return null;
    return { total: playerTotal, par };
  };

  const runEma = (rounds) => {
    let ema = initialHcp;
    rounds.forEach((round, index) => {
      const scoreData = getScore(round);
      if (!scoreData) return;

      const differential = scoreData.total - scoreData.par;
      const n = index + 1;
      const k = 2 / (n + 1);
      ema = differential * k + ema * (1 - k);
    });
    return ema * 0.85;
  };

  const roundCount = sortedRounds.length;
  const blendWeight = Math.min(roundCount / 3, 1);

  const currentRaw = runEma(sortedRounds);
  const blendedCurrent =
    currentRaw * blendWeight + initialHcp * (1 - blendWeight);

  let blendedPrevious;
  if (roundCount <= 1) {
    blendedPrevious = initialHcp;
  } else {
    const prevRounds = sortedRounds.slice(0, -1);
    const prevBlendWeight = Math.min((roundCount - 1) / 3, 1);
    const previousRaw = runEma(prevRounds);
    blendedPrevious =
      previousRaw * prevBlendWeight + initialHcp * (1 - prevBlendWeight);
  }

  const currentRounded = Math.round(blendedCurrent);
  const previousRounded = Math.round(blendedPrevious);

  return {
    current: currentRounded,
    previous: previousRounded,
    diff: currentRounded - previousRounded,
  };
};
