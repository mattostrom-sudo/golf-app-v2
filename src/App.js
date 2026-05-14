import React, { useState, useEffect, useRef, useCallback } from "react";
import "./styles.css";
import { supabase } from "./supabaseClient";
import { calculateCustomHandicap } from "./views/HandicapService";
import { Stats } from "./views/Stats.js";
import Navigation from "./components/Navigation";
import Login from "./views/Login";
import Dashboard from "./views/Dashboard";
import Setup from "./views/Setup";
import Scorecard from "./views/Scorecard";
import RoundHistory from "./views/RoundHistory";
import RoundSummary from "./views/RoundSummary";
import Leaderboard from "./views/Leaderboard.js";
import CourseManager, { CourseCreator } from "./views/CourseManager";
import PlayerManager from "./views/PlayerManager";
import UpdatePassword from "./views/UpdatePassword";
import VerticalScorecard from "./views/VerticalScorecard";
import { BirdieBet } from "./views/BirdieBet.js";
import MajorsView from "./views/MajorsView";
import POTYView from "./views/POTYView";
import { calculatePOTY } from "./POTYService";
import PlayersList from "./views/PlayersList";
import Signup from "./views/Signup";
import ForgotPassword from "./views/ForgotPassword";
import HoleStats from "./views/HoleStats";
import HoleStatsBreakdown from "./views/HoleStatsBreakdown";
import DiceRoller from "./views/DiceRoller";
import BirdieBetView from "./views/BirdieBetView";
// --- PURE HELPERS ---
const getGrossScore = (scores, player, holeNum) =>
  scores[player]?.[holeNum] || 0;

const getHoleData = (course, holeNum) => course?.holes[holeNum - 1];

const getNetScore = (grossScore, playerHandicap, holeDifficulty) => {
  if (!grossScore) return 0;
  const baseStrokes = Math.floor(playerHandicap / 18);
  const remainder = playerHandicap % 18;
  const extraStroke = Number(holeDifficulty) <= remainder ? 1 : 0;
  return grossScore - (baseStrokes + extraStroke);
};

const calculateNextQuota = (currentQuota, pointsEarned) => {
  const diff = pointsEarned - currentQuota;
  if (diff < 0) return Math.max(0, currentQuota - 1);
  if (diff > 0) return Math.ceil(currentQuota + diff * 0.5);
  return currentQuota;
};

// --- COMPONENTS ---
const BottomNav = ({ currentView, setView, isRoundActive }) => {
  if (
    ["scorecard", "login", "updatePassword", "signup", "holeStats"].includes(
      currentView
    )
  )
    return null;
  const navItemStyle = (isActive) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    width: "33%",
    cursor: "pointer",
    color: isActive ? "#1b4332" : "#aaa",
    transition: "all 0.2s ease",
  });
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        backgroundColor: "white",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        borderTop: "1px solid #eee",
        zIndex: 1000,
        paddingBottom: "10px",
        boxShadow: "0 -4px 15px rgba(0,0,0,0.05)",
      }}
    >
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .live-dot { width: 6px; height: 6px; background-color: #ff4d4d; border-radius: 50%; 
                    display: inline-block; margin-right: 4px; animation: pulse 1.5s infinite; }
      `}</style>

      {/* HOME TAB */}
      <button
        style={navItemStyle(currentView === "dashboard")}
        onClick={() => setView("dashboard")}
      >
        <span style={{ fontSize: "1.2rem" }}>🏠</span>
        <span style={{ fontSize: "0.6rem", fontWeight: "700" }}>HOME</span>
      </button>

      <button
        style={navItemStyle(currentView === "birdieBet")}
        onClick={() => setView("birdieBet")}
      >
        <span style={{ fontSize: "1.2rem" }}>🐦</span>
        <span style={{ fontSize: "0.6rem", fontWeight: "700" }}>
          BIRDIE BET
        </span>
      </button>

      {/* LEADERBOARD TAB */}
      <button
        style={navItemStyle(currentView === "leaderboard")}
        onClick={() => setView("leaderboard")}
      >
        <span style={{ fontSize: "1.2rem" }}>
          {isRoundActive ? "📊" : "🏆"}
        </span>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: "800",
            color: isRoundActive ? "#ff4d4d" : "inherit",
            display: "flex",
            alignItems: "center",
          }}
        >
          {isRoundActive && <span className="live-dot"></span>}
          {isRoundActive ? "LIVE" : "LEADERBOARD"}
        </span>
      </button>

      {/* PLAY / RESUME TAB */}
      <button
        style={navItemStyle(
          currentView === "setup" || currentView === "verticalScorecard"
        )}
        onClick={() => setView(isRoundActive ? "scorecard" : "setup")}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            height: "38px",
            width: "38px",
          }}
        >
          ⛳
        </div>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: "700",
            color: "#1b4332",
            marginTop: "2px",
          }}
        >
          {isRoundActive ? "RESUME" : "PLAY"}
        </span>
      </button>
    </div>
  );
};

export default function App() {
  // --- 1. STATE ---
  // Add these to the top of your App component state section
  const [advancedStats, setAdvancedStats] = useState({});
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [majors, setMajors] = useState([]);
  const [appReady, setAppReady] = useState(false);
  const [view, setView] = useState(
    () => localStorage.getItem("activeView") || "login"
  );
  const [user, setUser] = useState(null);
  const [statsTargetPlayer, setStatsTargetPlayer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [breakdownHoleStats, setBreakdownHoleStats] = useState([]);
  const [keptHoles, setKeptHoles] = useState(() =>
    JSON.parse(localStorage.getItem("keptHoles") || "{}")
  );
  const [selectedCourse, setSelectedCourse] = useState(() =>
    JSON.parse(localStorage.getItem("selectedCourse") || "null")
  );
  const [players, setPlayers] = useState(() =>
    JSON.parse(localStorage.getItem("players") || "[]")
  );
  const [scores, setScores] = useState(() =>
    JSON.parse(localStorage.getItem("scores") || "{}")
  );
  const [matchConfig, setMatchConfig] = useState(() =>
    JSON.parse(
      localStorage.getItem("matchConfig") ||
        '{"mode":"1v1","teamA":[],"teamB":[]}'
    )
  );
  const [vegasConfig, setVegasConfig] = useState(() =>
    JSON.parse(localStorage.getItem("vegasConfig") || '{"teamA":[],"teamB":[]}')
  );
  const [matchTeams, setMatchTeams] = useState(() =>
    JSON.parse(localStorage.getItem("matchTeams") || "null")
  );
  const [currentHoleIndex, setCurrentHoleIndex] = useState(
    () => Number(localStorage.getItem("currentHoleIndex")) || 0
  );
  const [playerHandicaps, setPlayerHandicaps] = useState(() =>
    JSON.parse(localStorage.getItem("playerHandicaps") || "{}")
  );
  const [roundDate, setRoundDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startingHole, setStartingHole] = useState(1);
  const [selectedGames, setSelectedGames] = useState(() =>
    JSON.parse(localStorage.getItem("selectedGames") || '["Stroke Play"]')
  );
  const [isNassau, setIsNassau] = useState(() =>
    JSON.parse(localStorage.getItem("isNassau") || "false")
  );
  const [courseDirectory, setCourseDirectory] = useState([]);
  const [playerDirectory, setPlayerDirectory] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [activeMajorInfo, setActiveMajorInfo] = useState({
    isMajor: false,
    majorName: null,
  });
  const [selectedSummaryRound, setSelectedSummaryRound] = useState(null);
  const [statsReturnView, setStatsReturnView] = useState("leaderboard");
  const isLoaded = useRef(false);
  const isAdmin = user?.email?.toLowerCase() === "matt.ostrom@gmail.com";
  const isRoundActive = players.length > 0;
  const [holeStatsSource, setHoleStatsSource] = useState("stats");
  const [scorecardStatsPlayer, setScorecardStatsPlayer] = useState(null);
  // Replace the old line 175 with this:
  const [diceCount, setDiceCount] = useState(1);
  const [showDeepLinkBanner, setShowDeepLinkBanner] = useState(false);
  const rawStandings = calculatePOTY(roundHistory, majors, playerDirectory);
  const potyStandings = rawStandings.map((standing) => {
    // Find this player in your directory to see if they are a member
    const playerProfile = playerDirectory.find(
      (p) => p.full_name === standing.name
    );
    return {
      ...standing,
      is_member: playerProfile?.is_member, // Attach the missing true/false flag
    };
  });

  // --- 2. LOCAL STORAGE SYNC ---
  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem("activeView", view);
      localStorage.setItem("selectedCourse", JSON.stringify(selectedCourse));
      localStorage.setItem("players", JSON.stringify(players));
      localStorage.setItem("scores", JSON.stringify(scores));
      localStorage.setItem("playerHandicaps", JSON.stringify(playerHandicaps));
      localStorage.setItem("currentHoleIndex", currentHoleIndex);
      localStorage.setItem("selectedGames", JSON.stringify(selectedGames));
      localStorage.setItem("matchTeams", JSON.stringify(matchTeams));
      localStorage.setItem("isNassau", JSON.stringify(isNassau));
      localStorage.setItem("keptHoles", JSON.stringify(keptHoles));
      localStorage.setItem("matchConfig", JSON.stringify(matchConfig));
    } else {
      isLoaded.current = true;
    }
  }, [
    view,
    selectedCourse,
    players,
    scores,
    playerHandicaps,
    currentHoleIndex,
    selectedGames,
    matchTeams,
    isNassau,
    keptHoles,
    matchConfig,
  ]);

  // --- 3. DATA FETCHING ---
  const fetchInitialData = async (currentUser) => {
    if (!currentUser?.id) return;
    try {
      const { data: allHistory } = await supabase
        .from("round_history")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (allHistory) setRoundHistory(allHistory);

      const { data: profiles } = await supabase.from("profiles").select("*");

      if (profiles) {
        setPlayerDirectory(profiles);
        const hcpMap = {};
        profiles.forEach((p) => {
          const userRounds = allHistory
            ? allHistory.filter(
                (r) =>
                  (r.players && r.players.includes(p.id)) || r.user_id === p.id
              )
            : [];
          console.log(
            `Rounds for ${p.full_name}:`,
            userRounds.map((r) => ({
              date: r.date,
              total_score: r.total_score,
              total_par: r.total_par,
            }))
          );
          // REPLACE your hcpMap logic with this:
          // ... inside your loop
          const hcpResult = calculateCustomHandicap(
            userRounds,
            parseFloat(p.initial_handicap || 4.0),
            p.full_name
          );

          // Store the WHOLE object {current: 0, diff: -4, ...}
          hcpMap[p.id] = hcpResult.current;

          let numericValue =
            typeof hcpResult === "object" ? hcpResult.current : hcpResult;
          if (p.calculated_handicap !== numericValue) {
            supabase
              .from("profiles")
              .update({ calculated_handicap: numericValue })
              .eq("id", p.id)
              .then();
          }
        });

        console.log("FINAL HCP MAP FOR LEADERBOARD:", hcpMap);
        setPlayerHandicaps(hcpMap);
      }

      const { data: majorData } = await supabase
        .from("major_history")
        .select("*");
      if (majorData) setMajors(majorData);

      const { data: courses } = await supabase.from("courses").select("*");
      if (courses) setCourseDirectory(courses);

      // CHECK FOR ACTIVE ROUND
      const { data: activeRound } = await supabase
        .from("active_rounds")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (activeRound) {
        setPlayers(activeRound.players || []);
        setScores(activeRound.scores || {});
        setSelectedCourse(activeRound.selected_course || null);
        setCurrentHoleIndex(activeRound.current_hole_index || 0);
        setSelectedGames(activeRound.selected_games || ["Stroke Play"]);
        if (activeRound.kept_holes) setKeptHoles(activeRound.kept_holes);
        if (
          activeRound.player_handicaps &&
          Object.keys(activeRound.player_handicaps).length > 0
        ) {
          setPlayerHandicaps((prev) =>
            Object.keys(prev).length === 0 ? activeRound.player_handicaps : prev
          );
        }
        // Only redirect to scorecard if not already on a stats view
        const statsViews = [
          "holeStats",
          "holeStatsBreakdown",
          "stats",
          "leaderboard",
          "verticalScorecard",
        ];
        if (!statsViews.includes(localStorage.getItem("activeView"))) {
          setView("scorecard");
        }
        // --- FETCH HOLE STATS ONLY IF A ROUND IS ACTIVE ---
        const { data: activeStats } = await supabase
          .from("hole_stats")
          .select("*")
          .eq("user_id", currentUser.id)
          .is("round_id", null); // Fetch "unattached" stats

        if (activeStats && activeStats.length > 0) {
          const transformedStats = {};
          activeStats.forEach((s) => {
            if (!transformedStats[s.player_name])
              transformedStats[s.player_name] = {};
            transformedStats[s.player_name][s.hole_number] = {
              putts: s.putts,
              fairway: s.fairway_hit,
              gir: s.green_in_regulation,
            };
          });
          setAdvancedStats(transformedStats);
        }
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };
  const memoizedRefresh = useCallback(() => {
    if (user) {
      console.log("🔄 Real-time refresh triggered...");
      fetchInitialData(user);
    }
  }, [user]);
  // --- 4. INITIALIZATION HOOKS ---
  useEffect(() => {
    const initApp = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchInitialData(session.user);

        // Handle deep link params AFTER data is loaded
        const params = new URLSearchParams(window.location.search);
        if (params.get("view") === "leaderboard") {
          const roundId = params.get("round");
          if (roundId) {
            const { data } = await supabase
              .from("round_history")
              .select("*")
              .eq("id", roundId)
              .single();
            if (data) {
              setSelectedSummaryRound(data);
            }
          }
          setView("leaderboard");
          if (window.navigator.standalone !== true) setShowDeepLinkBanner(true);
        } else if (params.get("view") === "diceRoller") {
          setView("diceRoller");
        } else if (!isRoundActive) {
        } else if (!isRoundActive) {
          setView("dashboard");
        }
      } else {
        setView("login");
      }
      setAppReady(true);
    };
    initApp();

    // *** DELETED THE EXTRA memoizedRefresh THAT WAS HERE ***

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        fetchInitialData(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.clear();
        setView("login");
      }
    });

    // *** DELETED THE OTHER EXTRA memoizedRefresh THAT WAS HERE ***

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("type") === "recovery" ||
      params.get("view") === "updatePassword"
    ) {
      setView("updatePassword");
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("type") === "recovery" ||
      params.get("view") === "updatePassword"
    ) {
      setView("updatePassword");
    }
  }, []);

  // NEW: Fetch hole stats when HoleStatsBreakdown view opens
  useEffect(() => {
    if (view === "holeStatsBreakdown" && user) {
      console.log("Fetching hole stats for user.id:", user.id);
      supabase
        .from("hole_stats")
        .select("*")
        .eq("user_id", user.id)
        .then(({ data, error }) => {
          console.log("hole stats fetch result:", data?.length, error);
          if (data) setBreakdownHoleStats(data);
        });
    }
  }, [view, user]);
  // --- 5. APP LOGIC HANDLERS ---
  const syncActiveRound = async () => {
    if (!user || players.length === 0) return;

    // 1. Sync main round data to active_rounds
    const activeData = {
      user_id: user.id,
      players,
      scores,
      selected_course: selectedCourse,
      player_handicaps: playerHandicaps,
      current_hole_index: currentHoleIndex,
      selected_games: selectedGames,
      kept_holes: keptHoles,
      vegas_config: vegasConfig,
      updated_at: new Date().toISOString(),
    };

    const { error: roundError } = await supabase
      .from("active_rounds")
      .upsert(activeData);
    if (roundError)
      console.error("Active round sync failed:", roundError.message);

    // 2. Sync Advanced Stats to hole_stats
    if (Object.keys(advancedStats).length > 0) {
      const statsToUpload = [];
      Object.entries(advancedStats).forEach(([playerName, holes]) => {
        Object.entries(holes).forEach(([holeNum, stats]) => {
          const playerProfile = playerDirectory.find(
            (p) => p.full_name === playerName
          );
          statsToUpload.push({
            user_id: user.id,
            player_name: playerProfile?.id || playerName,
            hole_number: parseInt(holeNum, 10),
            putts: stats.putts || 0,
            fairway_hit: stats.fairway || stats.fairway_hit || null,
            green_in_regulation:
              stats.green || stats.green_in_regulation || stats.gir || null,
            round_id: null, // This marks them as "Live/Active"
          });
        });
      });

      // We use upsert so it updates existing rows rather than creating 18 new rows every time
      const { error: statsError } = await supabase
        .from("hole_stats")
        .upsert(statsToUpload, {
          onConflict: "user_id,player_name,hole_number,round_id",
        });

      if (statsError)
        console.error("Hole stats sync failed:", statsError.message);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      syncActiveRound();
    }, 1000);

    return () => clearTimeout(timer);
  }, [scores, players, currentHoleIndex, selectedCourse, advancedStats]); // Added advancedStats here

  const handleFinishRound = async () => {
    if (!user) return;

    // MISSING SCORE SAFETY CHECK
    const numHoles = selectedCourse?.holes?.length || 18;
    const missingByPlayer = {};

    for (let i = 1; i <= numHoles; i++) {
      const anyScoreOnHole = players.some((p) => scores[p.id]?.[i]);
      if (anyScoreOnHole) {
        players.forEach((p) => {
          if (!scores[p.id]?.[i]) {
            if (!missingByPlayer[p.id]) missingByPlayer[p.id] = [];
            missingByPlayer[p.id].push(i);
          }
        });
      }
    }

    const missingPlayers = Object.keys(missingByPlayer);
    if (missingPlayers.length > 0) {
      let message = "Wait! Some players are missing scores...\n\n";
      missingPlayers.forEach((id) => {
        const name = players.find((p) => p.id === id)?.full_name || id;
        message += `- ${name}: Hole(s) ${missingByPlayer[id].join(", ")}\n`;
      });
      message += "\nDo you want to proceed and finish the round anyway?";

      if (!window.confirm(message)) return;
    }

    // Calculate total score and par for each player for handicap use
    const totalPar =
      selectedCourse?.holes?.reduce((sum, h) => sum + (h.par || 0), 0) || 72;
    const playerTotals = {};
    players.forEach((p) => {
      const pScores = scores[p.id] || {};
      playerTotals[p.id] = Object.values(pScores).reduce(
        (sum, s) => sum + (Number(s) || 0),
        0
      );
    });

    const roundData = {
      user_id: user.id,
      date: roundDate,
      course_id: selectedCourse?.id,
      course_name: selectedCourse?.name,
      course_data: selectedCourse,
      players: players.map((p) => p.id), // store UUIDs only
      scores: scores, // already keyed by UUID
      player_handicaps: playerHandicaps, // already keyed by UUID
      selected_games: selectedGames,
      match_config: matchConfig,
      kept_holes: keptHoles,
      is_major: activeMajorInfo.isMajor,
      major_name: activeMajorInfo.majorName,
      is_finalized: true,
    };
    try {
      // 1. Add .select() to get the newly inserted row back
      const { data: insertedRound, error } = await supabase
        .from("round_history")
        .insert([roundData])
        .select();

      if (error) throw error;

      // 2. Safely grab the ID from the returned data
      const newRoundId = insertedRound[0]?.id;

      // 3. Finalize advanced stats by linking them to the new round ID
      if (newRoundId && Object.keys(advancedStats).length > 0) {
        const { error: statsError } = await supabase
          .from("hole_stats")
          .update({ round_id: newRoundId }) // Give them the official ID
          .eq("user_id", user.id) // Only your stats
          .is("round_id", null); // Only the "live" ones from this round

        if (statsError) {
          console.error("Error finalizing advanced stats:", statsError.message);
        }
      }
      // Delete active round from DB
      await supabase.from("active_rounds").delete().eq("user_id", user.id);

      setSelectedSummaryRound(roundData);

      // Clear active state
      setScores({});
      setPlayers([]);
      setKeptHoles({});
      setCurrentHoleIndex(0);
      localStorage.setItem("currentHoleIndex", 0);
      setActiveMajorInfo({ isMajor: false, majorName: null });
      setMatchConfig({ mode: "1v1", teamA: [], teamB: [] });
      localStorage.removeItem("matchConfig");
      setSelectedGames(["Stroke Play"]);
      localStorage.setItem("selectedGames", JSON.stringify(["Stroke Play"]));
      // Check for 2s and set dice count
      const twosCount = players.reduce((total, player) => {
        const playerScores = scores[player.id] || {};
        const twos = Object.values(playerScores).filter(
          (s) => Number(s) === 2
        ).length;
        return total + twos;
      }, 0);
      if (twosCount > 0) {
        setDiceCount(twosCount);
      }

      // Refresh data & show summary
      await fetchInitialData(user);
      setView("leaderboard");
    } catch (err) {
      console.error("Error saving round:", err.message);
      alert("Failed to save round. Check console.");
    }
  };

  const cancelRound = async () => {
    if (window.confirm("Abandon this round?")) {
      // 1. Escape the scorecard immediately to prevent rendering errors
      setView("dashboard");

      // 2. Delete the active round from SUPABASE (The real ghost-buster!)
      if (user) {
        try {
          await supabase.from("active_rounds").delete().eq("user_id", user.id);
        } catch (err) {
          console.error("Failed to clear cloud round:", err.message);
        }
      }

      // 3. Clear ALL local storage EXCEPT Supabase Auth
      Object.keys(localStorage).forEach((key) => {
        if (!key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      });

      // 4. Reset React State
      setScores({});
      setPlayers([]);
      setMatchTeams(null);
      setCurrentHoleIndex(0);
      setSelectedCourse(null);
      setAdvancedStats({});
      setSelectedGames(["Stroke Play"]);

      // 5. Reset the 11's game state
      if (typeof setKeptHoles === "function") {
        setKeptHoles({});
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setPlayers([]);
      setScores({});
      setSelectedCourse(null);
      setRoundHistory([]);

      localStorage.clear();
      setView("login");
    } catch (err) {
      console.error("Logout failed:", err.message);
      setView("login");
    }
  };

  const handleSaveCourse = async (courseData) => {
    const { error } = await supabase.from("courses").upsert(courseData);
    if (!error) {
      await fetchInitialData(user);
      setView("courseManager");
    }
  };

  const handleSetHomeCourse = async (courseId) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ home_course_id: courseId })
        .eq("id", user.id);

      if (error) throw error;

      alert("Home course updated!");
      await fetchInitialData(user);
    } catch (err) {
      console.error("Error updating home course:", err.message);
    }
  };
  // Build guaranteed handicap map for leaderboard
  const leaderboardHandicaps = React.useMemo(() => {
    const result = {};
    playerDirectory.forEach((p) => {
      if (p.id) {
        result[p.id] = p.calculated_handicap ?? p.initial_handicap ?? 0;
      }
    });
    Object.entries(playerHandicaps).forEach(([id, hcp]) => {
      result[id] = hcp;
    });
    return result;
  }, [playerDirectory, playerHandicaps]);
  const handleStatsFinish = () => {
    // Advance to next hole if not on hole 18
    if (currentHoleIndex < (selectedCourse?.holes?.length || 18) - 1) {
      setCurrentHoleIndex((prev) => prev + 1);
    }
    setView("scorecard");
  };
  // --- RENDER ---
  if (!appReady) return null; // or a loading spinner

  const noNavViews = [
    "login",
    "signup",
    "updatePassword",
    "scorecard",
    "forgotPassword",
    "verticalScorecard",
    "leaderboard",
    "dashboard",
    "birdieBet",
  ];
  const needsTopPadding = user && !noNavViews.includes(view);

  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        paddingBottom: "100px",
        paddingTop: needsTopPadding ? "55px" : "0px",
      }}
    >
      {showDeepLinkBanner && (
        <div
          style={{
            background: "#1b4332",
            color: "white",
            textAlign: "center",
            padding: "10px 16px",
            fontSize: "13px",
            position: "sticky",
            top: 0,
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          📲 Add to Home Screen for the best experience
          <button
            onClick={() => setShowDeepLinkBanner(false)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}
      {user && view !== "login" && (
        <Navigation
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          isAdmin={isAdmin}
          navigateTo={setView}
          isInRound={isRoundActive}
          onCancel={cancelRound}
          onFinish={handleFinishRound}
          onLogout={handleLogout}
        />
      )}

      {view === "forgotPassword" && (
        <ForgotPassword
          onBack={() => setView("login")}
          onSuccess={() => setView("login")}
        />
      )}
      {view === "login" && (
        <Login
          onLoginSuccess={(u) => {
            setUser(u);
            setView("dashboard");
          }}
          onGoToSignup={() => setView("signup")}
          onForgotPassword={() => setView("forgotPassword")} // <-- ADD THIS LINE
        />
      )}

      {view === "signup" && <Signup onBack={() => setView("login")} />}

      {view === "dashboard" && (
        <Dashboard
          user={user}
          setView={(newView) => {
            if (newView === "stats") {
              // Find the profile that matches the logged-in user
              const currentUserProfile = playerDirectory.find(
                (p) => p.id === user?.id
              );
              // Use a safe fallback so it doesn't crash if profile isn't found
              setStatsTargetPlayer(
                currentUserProfile?.full_name ||
                  user?.user_metadata?.full_name ||
                  "Me"
              );
            }
            setView(newView);
          }}
          roundHistory={roundHistory}
          playerDirectory={playerDirectory}
          activeRound={isRoundActive}
          onResume={() => setView("scorecard")}
          playerHandicaps={playerHandicaps}
        />
      )}
      {view === "setup" && (
        <Setup
          roundDate={roundDate}
          setRoundDate={setRoundDate}
          courses={courseDirectory}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          playerDirectory={playerDirectory}
          players={players}
          setPlayers={setPlayers}
          matchConfig={matchConfig}
          setMatchConfig={setMatchConfig}
          vegasConfig={vegasConfig}
          setVegasConfig={setVegasConfig}
          playerHandicaps={playerHandicaps}
          setPlayerHandicaps={setPlayerHandicaps}
          startingHole={startingHole}
          setStartingHole={setStartingHole}
          selectedGames={selectedGames}
          setSelectedGames={setSelectedGames}
          onBegin={(config) => {
            if (config.matchConfig) setMatchConfig(config.matchConfig);
            if (config.vegasConfig) setVegasConfig(config.vegasConfig);
            setIsNassau(config.isNassau);
            setSelectedGames(config.selectedGames);
            setActiveMajorInfo({
              isMajor: config.isMajor,
              majorName: config.majorName,
            });
            setView("scorecard");
          }}
          onBack={() => setView("dashboard")}
        />
      )}

      {view === "scorecard" && (
        <Scorecard
          selectedCourse={selectedCourse}
          players={players}
          scores={scores}
          setScores={setScores}
          playerHandicaps={playerHandicaps}
          playerDirectory={playerDirectory}
          currentHoleIndex={currentHoleIndex}
          setCurrentHoleIndex={setCurrentHoleIndex}
          setView={setView}
          setStatsReturnView={setStatsReturnView} // ✅ ADD THIS
          onFinish={handleFinishRound}
          selectedGames={selectedGames}
          getHoleData={getHoleData}
          getNetScore={getNetScore}
          keptHoles={keptHoles}
          setKeptHoles={setKeptHoles}
          onNext={() =>
            setCurrentHoleIndex((prev) =>
              Math.min((selectedCourse?.holes?.length || 18) - 1, prev + 1)
            )
          }
          onPrev={() => setCurrentHoleIndex((prev) => Math.max(0, prev - 1))}
        />
      )}

      {view === "leaderboard" &&
        playerDirectory.length > 0 &&
        (() => {
          const historicalSource =
            selectedSummaryRound ||
            (roundHistory.length > 0 ? roundHistory[0] : null);
          const source = isRoundActive ? null : historicalSource;
          console.log(
            "leaderboardHandicaps at render:",
            JSON.stringify(leaderboardHandicaps)
          );
          console.log("playerDirectory at render:", playerDirectory.length);
          console.log(
            "playerHandicaps at render:",
            JSON.stringify(playerHandicaps)
          );
          console.log("App keptHoles state:", JSON.stringify(keptHoles));
          console.log("App vegasConfig state:", JSON.stringify(vegasConfig));
          return (
            <Leaderboard
              players={isRoundActive ? players : source?.players || []}
              scores={isRoundActive ? scores : source?.scores || {}}
              selectedCourse={
                isRoundActive ? selectedCourse : source?.course_data || null
              }
              playerHandicaps={leaderboardHandicaps}
              keptHoles={isRoundActive ? keptHoles : source?.kept_holes || {}}
              selectedGames={
                isRoundActive
                  ? selectedGames
                  : source?.selected_games || ["Stroke Play"]
              }
              matchConfig={
                isRoundActive ? matchConfig : source?.match_config || null
              }
              vegasConfig={
                isRoundActive ? vegasConfig : source?.vegas_config || null
              }
              roundDate={isRoundActive ? roundDate : source?.date}
              isHistorical={!isRoundActive}
              isMajor={
                isRoundActive ? activeMajorInfo.isMajor : source?.is_major
              }
              majorName={
                isRoundActive ? activeMajorInfo.majorName : source?.major_name
              }
              isFinalized={source?.is_finalized}
              setView={setView}
              playerDirectory={playerDirectory}
              onFinish={handleFinishRound}
              roundId={source?.id || null}
              onBack={() => {
                if (selectedSummaryRound) {
                  setView("roundSummary");
                } else {
                  setView(isRoundActive ? "scorecard" : "dashboard");
                }
              }}
              onSelectPlayer={(playerName) => {
                setTargetPlayer(playerName);
                setView("verticalScorecard");
              }}
              onTrackStats={() => {
                setStatsReturnView("leaderboard");
                setView("holeStats");
              }}
            />
          );
        })()}

      {view === "poty" && (
        <POTYView
          standings={potyStandings}
          onBack={() => setView("dashboard")}
        />
      )}

      {view === "playersList" && (
        <PlayersList
          players={playerDirectory}
          roundHistory={roundHistory}
          potyStandings={potyStandings}
          onSelectPlayer={(player) => {
            setStatsTargetPlayer(player.full_name || player); // ← just the name string
            setView("stats");
          }}
        />
      )}

      {view === "stats" && (
        <Stats
          user={user}
          homeCourseId={user?.home_course_id}
          players={playerDirectory}
          playerDirectory={playerDirectory}
          advancedStats={advancedStats}
          holeStats={Object.entries(advancedStats).flatMap(
            ([playerName, holes]) => {
              const playerProfile = playerDirectory.find(
                (p) => p.email === playerName
              );
              const playerFullName = playerProfile?.full_name || playerName;
              return Object.entries(holes).map(([holeNum, stat]) => ({
                player_name: playerName,
                hole_number: parseInt(holeNum),
                putts: stat.putts || 0,
                fairway_hit: stat.fairway || stat.fairway_hit || null,
                green_in_regulation:
                  stat.green || stat.green_in_regulation || stat.gir || null,
                is_live: true,
                score: scores?.[playerFullName]?.[parseInt(holeNum)] || null,
                par:
                  selectedCourse?.holes?.[parseInt(holeNum) - 1]?.par || null,
              }));
            }
          )}
          roundHistory={[
            ...(isRoundActive
              ? [
                  {
                    id: "live",
                    date: roundDate,
                    course_id: selectedCourse?.id,
                    course_name: selectedCourse?.name,
                    is_home_course: true,
                    scores: scores,
                    player_handicaps: playerHandicaps,
                    players: players,
                  },
                ]
              : []),
            ...roundHistory,
          ]}
          courses={courseDirectory}
          courseDirectory={courseDirectory}
          statsTargetPlayer={statsTargetPlayer}
          supabase={supabase}
          onRefresh={memoizedRefresh}
          navigateTo={(destination) => {
            console.log("navigateTo statsTargetPlayer:", statsTargetPlayer);
            setHoleStatsSource("stats");
            setView(destination);
          }}
          onBack={() => {
            setView(selectedSummaryRound ? "roundSummary" : "dashboard");
            setStatsTargetPlayer(null);
          }}
        />
      )}
      {view === "playerManager" && (
        <PlayerManager
          players={playerDirectory}
          onClose={() => setView("dashboard")}
          onUpdate={() => fetchInitialData(user)}
        />
      )}

      {view === "majors" && (
        <MajorsView history={majors} onBack={() => setView("dashboard")} />
      )}

      {user && (
        <BottomNav
          currentView={view}
          setView={setView}
          isRoundActive={isRoundActive}
        />
      )}

      {view === "verticalScorecard" && (
        <VerticalScorecard
          players={
            targetPlayer
              ? [
                  playerDirectory.find((p) => p.full_name === targetPlayer) || {
                    id: targetPlayer,
                    full_name: targetPlayer,
                  },
                ]
              : players
          }
          selectedCourse={selectedCourse || selectedSummaryRound?.course_data}
          scores={
            isRoundActive
              ? scores
              : selectedSummaryRound?.scores ||
                (roundHistory.length > 0 ? roundHistory[0]?.scores : {})
          }
          playerHandicaps={
            isRoundActive
              ? playerHandicaps
              : selectedSummaryRound?.player_handicaps ||
                (roundHistory.length > 0
                  ? roundHistory[0]?.player_handicaps
                  : {})
          }
          onBack={() => {
            setTargetPlayer(null);
            if (isRoundActive) {
              setView("scorecard");
            } else if (selectedSummaryRound) {
              setView("roundSummary");
            } else {
              setView("leaderboard");
            }
          }}
          onViewStats={
            targetPlayer
              ? () => {
                  setScorecardStatsPlayer(targetPlayer);
                  setHoleStatsSource("scorecard");
                  setView("holeStatsBreakdown");
                }
              : null
          }
        />
      )}

      {view === "courseManager" && (
        <CourseManager
          courses={courseDirectory}
          homeCourseId={user?.home_course_id}
          onAdd={() => {
            setEditingCourse(null);
            setView("courseCreator");
          }}
          onEdit={(course) => {
            setEditingCourse(course);
            setView("courseCreator");
          }}
          setHomeCourse={handleSetHomeCourse}
        />
      )}

      {view === "courseCreator" && (
        <CourseCreator
          course={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => setView("courseManager")}
        />
      )}

      {view === "history" && (
        <RoundHistory
          roundHistory={roundHistory}
          setSelectedSummaryRound={setSelectedSummaryRound}
          setView={setView}
        />
      )}

      {view === "roundSummary" && (
        <RoundSummary
          roundData={selectedSummaryRound}
          setView={setView}
          setStatsTargetPlayer={setStatsTargetPlayer}
          playerDirectory={playerDirectory}
          onBack={() => {
            const hasHistory = roundHistory.some(
              (r) => r.id === selectedSummaryRound?.id
            );
            setSelectedSummaryRound(null);
            setView(hasHistory ? "history" : "dashboard");
          }}
        />
      )}
      {view === "holeStats" && (
        <HoleStats
          user={user}
          isRoundActive={isRoundActive} // Corrected name from activeRound
          setView={setView}
          advancedStats={advancedStats}
          setAdvancedStats={setAdvancedStats}
          returnView={statsReturnView}
          onFinish={handleStatsFinish}
          scores={scores}
          players={players}
          selectedCourse={selectedCourse}
        />
      )}
      {view === "holeStatsBreakdown" && (
        <HoleStatsBreakdown
          holeStats={breakdownHoleStats}
          activeName={
            scorecardStatsPlayer
              ? user?.id
              : playerDirectory.find((p) => p.full_name === statsTargetPlayer)
                  ?.id || user?.id
          }
          playerKey={user?.id}
          scores={scores}
          defaultMode={holeStatsSource === "scorecard" ? "live" : "hist"}
          onBack={() => {
            if (scorecardStatsPlayer) {
              setScorecardStatsPlayer(null);
              setHoleStatsSource("stats");
              setView("verticalScorecard");
            } else {
              setHoleStatsSource("stats");
              setView("stats");
            }
          }}
          courses={courseDirectory}
          derivedHomeId={user?.home_course_id}
        />
      )}
      {view === "birdieBet" && (
        <BirdieBetView
          playerDirectory={playerDirectory}
          roundHistory={roundHistory}
          courseDirectory={courseDirectory}
          onBack={() => setView("dashboard")}
        />
      )}
      {view === "diceRoller" && (
        <DiceRoller numDice={diceCount} onBack={() => setView("dashboard")} />
      )}
    </div>
  );
}
