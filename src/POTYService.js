export const calculatePOTY = (roundHistory, majorHistory, players) => {
  const standings = {};

  // 1. Initialize Players
  players.forEach((p) => {
    const name = p.full_name || p.p_name || p.email;
    standings[name] = {
      name,
      points: 0,
      thursdays: 0,
      majorWins: 0,
      breakdown: {
        holesPlayed: 0,
        quotaWins: 0,
        quotaSeconds: 0,
        quotaThirds: 0,
        majorWins: 0,
        majorSeconds: 0,
        majorThirds: 0,
        netBirdies: 0,
        netEagles: 0,
      },
    };
  });

  // 2. Process Majors (Placement Points: 10, 5, 3.5)
  // These are the "Big Points" awarded from the Major History list
  majorHistory.forEach((m) => {
    if (standings[m.winner_name]) {
      standings[m.winner_name].points += 10;
      standings[m.winner_name].majorWins += 1;
      standings[m.winner_name].breakdown.majorWins += 1;
    }
    if (m.second_place && standings[m.second_place]) {
      standings[m.second_place].points += 5;
      standings[m.second_place].breakdown.majorSeconds += 1;
    }
    if (m.third_place && standings[m.third_place]) {
      standings[m.third_place].points += 3.5;
      standings[m.third_place].breakdown.majorThirds += 1;
    }
  });

  // 3. Process Rounds (Thursday OR Majors)
  roundHistory.forEach((round) => {
    const date = new Date(round.date);
    const isThursday = date.getUTCDay() === 4;
    // CRITICAL: We count performance stats if it's Thursday OR if the round is flagged as a Major
    const countsForPOTY = isThursday || round.is_major;

    if (countsForPOTY) {
      // Thursday-only Quota Placements (Majors have their own points above)
      if (isThursday) {
        if (round.quota_winner && standings[round.quota_winner]) {
          standings[round.quota_winner].points += 5;
          standings[round.quota_winner].breakdown.quotaWins += 1;
        }
        if (round.quota_second && standings[round.quota_second]) {
          standings[round.quota_second].points += 2.5;
          standings[round.quota_second].breakdown.quotaSeconds += 1;
        }
        if (round.quota_third && standings[round.quota_third]) {
          standings[round.quota_third].points += 1;
          standings[round.quota_third].breakdown.quotaThirds += 1;
        }

        // Track "Thursday Appearance" count
        const playersInRound = Object.keys(round.scores || {});
        playersInRound.forEach((p) => {
          if (standings[p]) standings[p].thursdays += 1;
        });
      }

      // Individual Player Performance Stats (Holes, Birdies, Eagles)
      // This runs for BOTH Thursdays and Majors now
      const playersInRound = Object.keys(round.scores || {});
      playersInRound.forEach((playerName) => {
        if (!standings[playerName]) return;

        const playerHoles = round.scores[playerName] || {};
        const count = Object.keys(playerHoles).length;

        // 0.1 pt per hole played
        standings[playerName].breakdown.holesPlayed += count;
        standings[playerName].points += count * 0.1;

        // Net Birdies (0.5 each)
        const birdieCount = Number(round.net_birdies?.[playerName] || 0);
        standings[playerName].breakdown.netBirdies += birdieCount;
        standings[playerName].points += birdieCount * 0.5;

        // Net Eagles (1.0 each)
        const eagleCount = Number(round.net_eagles?.[playerName] || 0);
        standings[playerName].breakdown.netEagles += eagleCount;
        standings[playerName].points += eagleCount * 1.0;
      });
    }
  });

  return Object.values(standings).sort((a, b) => b.points - a.points);
};
