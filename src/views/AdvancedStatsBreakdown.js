import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdvancedStatsBreakdown({ user, roundId = null }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return setLoading(false);

      // Fetch all stats for the user
      let query = supabase
        .from("hole_stats")
        .select("*")
        .eq("user_id", user.id);

      // If a specific round is requested (like in View Stats), filter it.
      // If no roundId is passed (Dashboard), it fetches ALL time stats.
      if (roundId === "live") {
        query = query.is("round_id", null);
      } else if (roundId) {
        query = query.eq("round_id", roundId);
      }

      const { data } = await query;
      setStats(data || []);
      setLoading(false);
    };

    fetchStats();
    const sub = supabase
      .channel("stats_refresh")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hole_stats" },
        () => fetchStats()
      )
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [user, roundId]);

  if (loading) return null;

  // THE GUARD: If there is no data, hide the entire component
  if (stats.length === 0) return null;

  // --- Calculations ---
  const totalHoles = stats.length;
  const fwHit = stats.filter((h) => h.fairway_hit === "Hit").length;
  const fwTotal = stats.filter(
    (h) => h.fairway_hit && h.fairway_hit !== ""
  ).length;
  const girHit = stats.filter(
    (h) =>
      h.green_in_regulation === "Hit Green" || h.green_in_regulation === "Hit"
  ).length;
  const totalPutts = stats.reduce((sum, h) => sum + (h.putts || 0), 0);
  const udHit = stats.filter(
    (h) => h.up_down === "Success" || h.up_down === "Hit"
  ).length;
  const udTotal = stats.filter((h) => h.up_down && h.up_down !== "").length;

  const StatCard = ({ label, value }) => (
    <div style={cardStyle}>
      <div style={valueStyle}>{value}</div>
      <div style={labelStyle}>{label}</div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <StatCard
        label="FW"
        value={`${fwTotal > 0 ? Math.round((fwHit / fwTotal) * 100) : 0}%`}
      />
      <StatCard
        label="GIR"
        value={`${
          totalHoles > 0 ? Math.round((girHit / totalHoles) * 100) : 0
        }%`}
      />
      <StatCard
        label="UP/DN"
        value={`${udTotal > 0 ? Math.round((udHit / udTotal) * 100) : 0}%`}
      />
      <StatCard label="P/H" value={(totalPutts / totalHoles).toFixed(1)} />
      <StatCard
        label="P/R"
        value={(totalPutts / (totalHoles / 18)).toFixed(1)}
      />
    </div>
  );
}

const containerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "6px",
  margin: "15px 0",
};
const cardStyle = {
  flex: 1,
  backgroundColor: "#f8fdfb",
  padding: "10px 2px",
  borderRadius: "10px",
  textAlign: "center",
  border: "1px solid #e2eee9",
};
const valueStyle = { fontSize: "1rem", fontWeight: "bold", color: "#2d6a4f" };
const labelStyle = {
  fontSize: "0.6rem",
  fontWeight: "bold",
  color: "#777",
  marginTop: "2px",
};
