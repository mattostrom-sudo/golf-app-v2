import React, { useState } from "react";

export default function Setup({
  user,
  roundDate,
  setRoundDate,
  courses,
  selectedCourse,
  setSelectedCourse,
  playerDirectory,
  players,
  setPlayers,
  matchConfig,
  setMatchConfig,
  vegasConfig,
  setVegasConfig,
  startingHole,
  selectedGames,
  setSelectedGames,
  onBegin,
  onBack,
}) {
  // STATE FOR SPECIAL MODES
  const [isNassau, setIsNassau] = useState(false);
  const [isMajor, setIsMajor] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("The Masters");

  const removePlayer = (idToRemove) => {
    setPlayers(players.filter((p) => p.id !== idToRemove));
  };
  const handleTeamAssignment = (team, player) => {
    let newA = [...matchConfig.teamA];
    let newB = [...matchConfig.teamB];

    // Remove player from both teams first
    newA = newA.filter((p) => p !== player);
    newB = newB.filter((p) => p !== player);

    // Add to the selected team
    if (team === "A") newA.push(player);
    else newB.push(player);

    // UPDATE: Force a limit of 2 if Vegas is selected,
    // otherwise use the Match Play mode setting.
    const isVegas = selectedGames.includes("Vegas");
    const limit = isVegas ? 2 : matchConfig.mode === "1v1" ? 1 : 2;

    if (team === "A" && newA.length > limit) newA.shift();
    if (team === "B" && newB.length > limit) newB.shift();

    setMatchConfig({ ...matchConfig, teamA: newA, teamB: newB });
  };

  const handleVegasTeamAssignment = (team, playerId) => {
    const currentVegas = vegasConfig || { teamA: [], teamB: [] };
    let newA = [...currentVegas.teamA];
    let newB = [...currentVegas.teamB];
    newA = newA.filter((p) => p !== playerId);
    newB = newB.filter((p) => p !== playerId);
    if (team === "A") newA.push(playerId);
    else newB.push(playerId);
    if (newA.length > 2) newA.shift();
    if (newB.length > 2) newB.shift();
    setVegasConfig({ teamA: newA, teamB: newB });
  };

  const removeGame = (gameToRemove) => {
    if (selectedGames.length > 1) {
      setSelectedGames(selectedGames.filter((g) => g !== gameToRemove));
    } else {
      alert("You must have at least one active game.");
    }
  };

  const handleBegin = () => {
    // 1. Validation for Team-Based Games (Match Play or Vegas)
    const isMatchPlay = selectedGames.includes("Match Play");
    const isVegas = selectedGames.includes("Vegas");

    if (isMatchPlay) {
      const minRequired = matchConfig.mode === "1v1" ? 1 : 2;
      if (matchConfig.teamA.length < minRequired || matchConfig.teamB.length < minRequired) {
        alert(`Please finish setting up teams for ${matchConfig.mode} Match Play.`);
        return;
      }
    }
    if (isVegas) {
      const vc = vegasConfig || { teamA: [], teamB: [] };
      if (vc.teamA.length < 2 || vc.teamB.length < 2) {
        alert(`Please finish setting up teams for 2v2 Vegas.`);
        return;
      }
    }

    // 2. Execute the transition to the round
    onBegin({
      matchConfig,
      vegasConfig,
      isNassau: true,
      selectedGames,
      isMajor,
      majorName: isMajor ? selectedMajor : null,
    });
  };

  const gameOptions = [
    "Stroke Play",
    "Match Play",
    "Quota Points",
    "Vegas",
    "11's",
    "Skins",
  ];

  const majorOptions = [
    { name: "The Masters", emoji: "🟢" },
    { name: "The PGA Championship", emoji: "🏆" },
    { name: "The US Open", emoji: "🇺🇸" },
    { name: "The British Open", emoji: "🏺" },
  ];

  return (
    <div className="screen setup-view">
      <div className="nav-spacer"></div>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2 className="profile-title">New Round</h2>
          <p className="welcome-label">CONFIGURE YOUR GAME</p>
        </header>

        <section className="setup-form-content" style={{ marginTop: "20px" }}>
          {/* MAJOR TOURNAMENT SELECTOR */}
          <div
            className="setup-card"
            style={{
              background: isMajor ? "#fef3c7" : "#fff",
              border: isMajor ? "2px solid #fbbf24" : "1px solid #e2e8f0",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label
                className="section-label-refined"
                style={{ marginBottom: 0 }}
              >
                🏆 MAJOR TOURNAMENT?
              </label>
              <input
                type="checkbox"
                checked={isMajor}
                onChange={(e) => setIsMajor(e.target.checked)}
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#1b4332",
                }}
              />
            </div>

            {isMajor && (
              <div style={{ marginTop: "15px" }}>
                <select
                  className="setup-input"
                  style={{ border: "1px solid #fbbf24" }}
                  value={selectedMajor}
                  onChange={(e) => setSelectedMajor(e.target.value)}
                >
                  {majorOptions.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} {m.emoji}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ROUND DATE & COURSE */}
          <div className="setup-card">
            <label className="section-label-refined">ROUND DATE</label>
            <input
              type="date"
              className="setup-input"
              value={roundDate}
              onChange={(e) => setRoundDate(e.target.value)}
            />
          </div>

          <div className="setup-card">
            <label className="section-label-refined">COURSE SELECTION</label>
            <div className="setup-input-wrapper">
              <select
                className="setup-input"
                value={selectedCourse?.name || ""}
                onChange={(e) =>
                  setSelectedCourse(
                    courses.find((c) => c.name === e.target.value)
                  )
                }
              >
                <option value="">-- Select a Course --</option>
                {[...courses]
                  .sort((a, b) => {
                    const aIsHome = a.is_home_course === true;
                    const bIsHome = b.is_home_course === true;
                    if (aIsHome && !bIsHome) return -1;
                    if (!aIsHome && bIsHome) return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.is_home_course ? `🏠 ${c.name}` : c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* ADD PLAYERS */}
          <div className="setup-card">
            <label className="section-label-refined">ADD PLAYERS</label>
            <div className="setup-input-wrapper">
              <select
                className="setup-input"
                value=""
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const profile = playerDirectory.find(
                    (p) => p.id === selectedId
                  );
                  if (
                    profile &&
                    !players.find((p) => p.id === selectedId) &&
                    players.length < 4
                  )
                    setPlayers([
                      ...players,
                      { id: profile.id, full_name: profile.full_name },
                    ]);
                }}
              >
                <option value="">-- Choose User --</option>
                {playerDirectory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "10px",
              }}
            >
              {players.map((p) => (
                <div
                  key={p.id}
                  className="player-tag"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>{p.full_name.split(" ")[0]}</span>
                  <span
                    onClick={() => removePlayer(p.id)}
                    style={{ cursor: "pointer", color: "#f87171" }}
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* GAMES & HOLE */}
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <div className="setup-card" style={{ flex: 1.5, marginBottom: 0 }}>
              <label className="section-label-refined">ACTIVE GAMES</label>
              <select
                className="setup-input"
                value=""
                onChange={(e) =>
                  e.target.value &&
                  !selectedGames.includes(e.target.value) &&
                  setSelectedGames([...selectedGames, e.target.value])
                }
              >
                <option value="">+ Add Game</option>
                {gameOptions.map((g) => (
                  <option
                    key={g}
                    value={g}
                    disabled={selectedGames.includes(g)}
                  >
                    {g}
                  </option>
                ))}
              </select>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  marginTop: "8px",
                }}
              >
                {selectedGames.map((game) => (
                  <div
                    key={game}
                    onClick={() => removeGame(game)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#f0fdf4",
                      color: "#1b4332",
                      borderRadius: "6px",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    {game} ✕
                  </div>
                ))}
              </div>
            </div>

            <div className="setup-card" style={{ flex: 1, marginBottom: 0 }}>
              <label className="section-label-refined">START HOLE</label>
              <select
                className="setup-input"
                value={startingHole}
                onChange={(e) => setStartingHole(Number(e.target.value))}
              >
                {[...Array(18)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Hole {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <footer
          className="dashboard-footer"
          style={{ marginTop: "30px", textAlign: "center" }}
        >
{/* MATCH PLAY SETUP */}
{selectedGames.includes("Match Play") && (
  <div className="glass-card match-setup" style={{ padding: "20px", marginTop: "20px" }}>
    <h3>Match Play Setup</h3>
    <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
      <button
        className={matchConfig.mode === "1v1" ? "active-btn" : "inactive-btn"}
        onClick={() => setMatchConfig({ ...matchConfig, mode: "1v1", teamA: [], teamB: [] })}
      >1 v 1</button>
      <button
        className={matchConfig.mode === "2v2" ? "active-btn" : "inactive-btn"}
        onClick={() => setMatchConfig({ ...matchConfig, mode: "2v2", teamA: [], teamB: [] })}
      >2 v 2</button>
    </div>
    <div className="team-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
      <div>
        <label style={{ fontWeight: "bold", color: "#1b4332" }}>TEAM A</label>
        {players.map((p) => (
          <button key={p.id} onClick={() => handleTeamAssignment("A", p.id)}
            style={{ width: "100%", padding: "8px", margin: "4px 0", borderRadius: "8px",
              backgroundColor: matchConfig.teamA.includes(p.id) ? "#1b4332" : "#f1f5f9",
              color: matchConfig.teamA.includes(p.id) ? "white" : "#64748b" }}>
            {p.full_name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div>
        <label style={{ fontWeight: "bold", color: "#ff4d4d" }}>TEAM B</label>
        {players.map((p) => (
          <button key={p.id} onClick={() => handleTeamAssignment("B", p.id)}
            style={{ width: "100%", padding: "8px", margin: "4px 0", borderRadius: "8px",
              backgroundColor: matchConfig.teamB.includes(p.id) ? "#ff4d4d" : "#f1f5f9",
              color: matchConfig.teamB.includes(p.id) ? "white" : "#64748b" }}>
            {p.full_name.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{/* VEGAS SETUP */}
{selectedGames.includes("Vegas") && (
  <div className="glass-card match-setup" style={{ padding: "20px", marginTop: "20px" }}>
    <h3>Vegas Team Setup (2v2)</h3>
    <div className="team-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
      <div>
        <label style={{ fontWeight: "bold", color: "#1b4332" }}>TEAM A</label>
        {players.map((p) => (
          <button key={p.id} onClick={() => handleVegasTeamAssignment("A", p.id)}
            style={{ width: "100%", padding: "8px", margin: "4px 0", borderRadius: "8px",
              backgroundColor: vegasConfig.teamA.includes(p.id) ? "#1b4332" : "#f1f5f9",
              color: vegasConfig.teamA.includes(p.id) ? "white" : "#64748b" }}>
            {p.full_name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div>
        <label style={{ fontWeight: "bold", color: "#ff4d4d" }}>TEAM B</label>
        {players.map((p) => (
          <button key={p.id} onClick={() => handleVegasTeamAssignment("B", p.id)}
            style={{ width: "100%", padding: "8px", margin: "4px 0", borderRadius: "8px",
              backgroundColor: vegasConfig.teamB.includes(p.id) ? "#ff4d4d" : "#f1f5f9",
              color: vegasConfig.teamB.includes(p.id) ? "white" : "#64748b" }}>
            {p.full_name.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{/* 2. START BUTTON - MUST BE OUTSIDE THE CURLY BRACES ABOVE */}
          <button
            className="main-start-btn"
            disabled={players.length === 0 || !selectedCourse}
            onClick={handleBegin}
            style={{ marginTop: "20px" }}
          >
            {isMajor ? "🏆 BEGIN MAJOR" : "🏌️‍♂️ BEGIN ROUND"}
          </button>

          {/* 3. CANCEL LINK */}
          <div
            onClick={onBack}
            style={{
              marginTop: "20px",
              color: "#888",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </div>
        </footer>
      </div>
    </div>
  );
}
