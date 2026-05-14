import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function BirdieBetView({
  playerDirectory = [],
  courseDirectory = [],
  user,
  userProfileId,
}) {
  const currentYear = new Date().getFullYear();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [selectedHoles, setSelectedHoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const homeCourse = courseDirectory.find((c) => c.is_home_course === true);
  const birdieBetPlayers = playerDirectory.filter(
    (p) => p.is_birdie_bet === true
  );
  console.log("user.id:", user?.id);
  console.log(
    "birdieBetPlayers:",
    birdieBetPlayers.map((p) => p.id)
  );
  // Fetch all birdie bet entries for current year
  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("birdie_bet_entries")
      .select("*")
      .eq("year", currentYear);
      console.log("birdie_bet_entries:", data, "error:", error);
    if (!error) setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [currentYear]);

  // Get birdied holes for a player
  const getBirdiedHoles = (playerId) => {
    const playerEntries = entries.filter((e) => e.player_id === playerId);
    const holes = [...new Set(playerEntries.map((e) => e.hole_number))];
    return holes.sort((a, b) => a - b);
  };

  // Toggle hole selection in quick entry
  const toggleHole = (hole) => {
    setSelectedHoles((prev) =>
      prev.includes(hole) ? prev.filter((h) => h !== hole) : [...prev, hole]
    );
  };

  // Save quick entry
  const handleSave = async () => {
    if (selectedHoles.length === 0) return;
    setSaving(true);

    const today = new Date().toISOString().split("T")[0];

    // Get already birdied holes for this player to avoid duplicates
    if (!selectedPlayer) {
      alert("Please select a player first.");
      setSaving(false);
      return;
    }
    const alreadyBirdied = getBirdiedHoles(selectedPlayer);
    const newHoles = selectedHoles.filter((h) => !alreadyBirdied.includes(h));

    if (newHoles.length === 0) {
      alert("All selected holes already recorded!");
      setSaving(false);
      return;
    }

    const inserts = newHoles.map((hole) => ({
      player_id: selectedPlayer,
      hole_number: hole,
      date: today,
      year: currentYear,
    }));

    const { error } = await supabase.from("birdie_bet_entries").insert(inserts);

    if (!error) {
      await fetchEntries();
      setSelectedHoles([]);
      setSelectedPlayer(null);
      setShowQuickEntry(false);
    } else {
      alert("Error saving: " + error.message);
    }
    setSaving(false);
  };

  // Calculate leaderboard
  const playerProgress = birdieBetPlayers
    .map((player) => {
      const birdiedHoles = getBirdiedHoles(player.id);
      return {
        id: player.id,
        name: player.full_name,
        birdiedHoles,
        count: birdiedHoles.length,
      };
    })
    .sort((a, b) => b.count - a.count);

  const myBirdiedHoles = selectedPlayer ? getBirdiedHoles(selectedPlayer) : [];

  return (
    <div
      style={{
        backgroundColor: "#f4f7f6",
        minHeight: "100vh",
        paddingBottom: "100px",
        paddingTop: "60px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#1b4332",
          padding: "20px",
          color: "white",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "2rem" }}>🐦</div>
        <h2
          style={{ margin: "5px 0 0 0", fontSize: "1.3rem", fontWeight: "800" }}
        >
          Birdie Bet {currentYear}
        </h2>
        <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
          {homeCourse?.name || "Home Course"} • Birdie every hole
        </div>
      </div>

      <div style={{ padding: "0 15px" }}>
        {/* Quick Entry Button */}
        {user && birdieBetPlayers.length > 0 && (
          <button
            onClick={() => setShowQuickEntry(!showQuickEntry)}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: showQuickEntry ? "#64748b" : "#1b4332",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "0.85rem",
              marginBottom: "16px",
              cursor: "pointer",
            }}
          >
            {showQuickEntry ? "✕ Cancel" : "🐦 Log New Birdies"}
          </button>
        )}

        {/* Quick Entry Panel */}
        {showQuickEntry && (
          <div
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Select player:
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              {birdieBetPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayer(p.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    border: "none",
                    background: selectedPlayer === p.id ? "#1b4332" : "#f1f5f9",
                    color: selectedPlayer === p.id ? "white" : "#64748b",
                    fontWeight: "700",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {p.full_name.split(" ")[0]}
                </button>
              ))}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "12px",
              }}
            >
              Select holes birdied:
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(9, 1fr)",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
                const alreadyBirdied = myBirdiedHoles.includes(hole);
                const selected = selectedHoles.includes(hole);
                return (
                  <button
                    key={hole}
                    onClick={() => !alreadyBirdied && toggleHole(hole)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "6px",
                      border: "none",
                      background: alreadyBirdied
                        ? "#1b4332"
                        : selected
                        ? "#fbbf24"
                        : "#f1f5f9",
                      color: alreadyBirdied
                        ? "white"
                        : selected
                        ? "#451a03"
                        : "#94a3b8",
                      fontWeight: "700",
                      fontSize: "0.7rem",
                      cursor: alreadyBirdied ? "default" : "pointer",
                      opacity: alreadyBirdied ? 0.6 : 1,
                    }}
                  >
                    {hole}
                  </button>
                );
              })}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                marginBottom: "12px",
              }}
            >
              Green = already recorded • Yellow = selected
            </div>
            <button
              onClick={handleSave}
              disabled={selectedHoles.length === 0 || saving}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor:
                  selectedHoles.length === 0 ? "#e2e8f0" : "#1b4332",
                color: selectedHoles.length === 0 ? "#94a3b8" : "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: "800",
                fontSize: "0.85rem",
                cursor: selectedHoles.length === 0 ? "default" : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : `Save ${selectedHoles.length} Birdie${
                    selectedHoles.length !== 1 ? "s" : ""
                  }`}
            </button>
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}
          >
            Loading...
          </div>
        ) : (
          playerProgress.map((player, index) => (
            <div
              key={player.id}
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: index === 0 ? "#fbbf24" : "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "900",
                      fontSize: "0.8rem",
                      color: index === 0 ? "#451a03" : "#64748b",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "1rem",
                      color: "#1e293b",
                    }}
                  >
                    {player.name}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "900",
                    color: "#1b4332",
                  }}
                >
                  {player.count}
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    /18
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: "6px",
                  height: "8px",
                  overflow: "hidden",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: `${(player.count / 18) * 100}%`,
                    background: player.count === 18 ? "#fbbf24" : "#1b4332",
                    height: "100%",
                    borderRadius: "6px",
                  }}
                />
              </div>

              {/* Hole grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(9, 1fr)",
                  gap: "4px",
                }}
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
                  const birdied = player.birdiedHoles.includes(hole);
                  return (
                    <div
                      key={hole}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "4px",
                        background: birdied ? "#1b4332" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6rem",
                        fontWeight: "700",
                        color: birdied ? "white" : "#94a3b8",
                      }}
                    >
                      {hole}
                    </div>
                  );
                })}
              </div>

              {player.count === 18 && (
                <div
                  style={{
                    marginTop: "10px",
                    textAlign: "center",
                    background: "#fef3c7",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    color: "#92400e",
                  }}
                >
                  🏆 COMPLETE!
                </div>
              )}
            </div>
          ))
        )}

        {playerProgress.length === 0 && !loading && (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}
          >
            No players enrolled in the Birdie Bet.
          </div>
        )}
      </div>
    </div>
  );
}
