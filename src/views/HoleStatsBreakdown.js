import React, { useState, useMemo, useEffect } from "react";

export default function HoleStatsBreakdown({
  holeStats = [],
  activeName,
  onBack,
  courses = [],
  derivedHomeId,
  defaultMode = "hist",
  scores = {},
  playerKey = null,
}) {
  const [overviewMode, setOverviewMode] = useState(defaultMode);
  const [activeTab, setActiveTab] = useState("overview");
  // Update overviewMode when defaultMode changes
  useEffect(() => {
    setOverviewMode(defaultMode);
  }, [defaultMode]);

  // --- FILTER STATS FOR THIS PLAYER ---
  const myStats = useMemo(
    () => holeStats.filter((s) => s.player_name === activeName),
    [holeStats, activeName]
  );
  console.log("activeName:", activeName);
  console.log("all holeStats:", JSON.stringify(holeStats));
  console.log("myStats:", JSON.stringify(myStats));
  const liveStats = useMemo(
    () => myStats.filter((s) => s.is_live === true),
    [myStats]
  );

  const historicalStats = useMemo(
    () => myStats.filter((s) => !s.is_live),
    [myStats]
  );
  console.log("activeName (UUID):", activeName);
  console.log("holeStats length:", holeStats.length);
  console.log("first holeStats player_name:", holeStats[0]?.player_name);
  console.log("myStats length:", myStats.length);
  // --- HELPER: Calculate stats from a set of hole stats ---
  const calcStats = (statSet) => {
    let fwAttempts = 0,
      fwHit = 0;
    let girAttempts = 0,
      girHit = 0;
    let totalPutts = 0,
      puttHoles = 0;
    let udAttempts = 0,
      udSuccess = 0;
    let onePutts = 0,
      twoPutts = 0,
      threePlusPutts = 0;
    let girBirdies = 0,
      girHoles = 0;

    statSet.forEach((s) => {
      if (
        s.fairway_hit !== null &&
        s.fairway_hit !== undefined &&
        s.fairway_hit !== ""
      ) {
        const isPenalty = s.fairway_hit?.includes("+Penalty");
        const baseHit = s.fairway_hit?.replace("+Penalty", "");
        fwAttempts++;
        if (baseHit === "Hit") fwHit++;
        // Penalty holes are counted as misses (no fwHit increment)
      }

      // Fix GIR — handle string "false" and "true"
      if (
        s.green_in_regulation !== null &&
        s.green_in_regulation !== undefined &&
        s.green_in_regulation !== "" &&
        s.green_in_regulation !== "Penalty"
      ) {
        girAttempts++;
        const girMade =
          s.green_in_regulation === "Hit" ||
          s.green_in_regulation === true ||
          s.green_in_regulation === "true"; // 👈 ADD THIS
        if (girMade) {
          girHit++;
          girHoles++;
          const girScore = s.score || scores?.[playerKey]?.[s.hole_number];
          if (girScore && s.par && Number(girScore) <= Number(s.par) - 1)
            girBirdies++;
        } else if (
          s.green_in_regulation === "Left" ||
          s.green_in_regulation === "Right" ||
          s.green_in_regulation === "Short" ||
          s.green_in_regulation === "Long"
        ) {
          udAttempts++;
          const holeScore = s.score || scores?.[playerKey]?.[s.hole_number];
          const holePar = s.par;
          if (
            holeScore !== null &&
            holeScore !== undefined &&
            Number(holeScore) > 0 &&
            holePar !== null &&
            holePar !== undefined &&
            Number(holeScore) <= Number(holePar)
          )
            udSuccess++;
        }
      }

      // Fix putts — only count if putts > 0
      if (s.putts !== null && s.putts !== undefined && Number(s.putts) > 0) {
        const p = Number(s.putts);
        totalPutts += p;
        puttHoles++;
        if (p === 1) onePutts++;
        else if (p === 2) twoPutts++;
        else if (p >= 3) threePlusPutts++;
      }
    });

    return {
      fwPct: fwAttempts > 0 ? Math.round((fwHit / fwAttempts) * 100) : null,
      fwHit,
      fwAttempts,
      girPct: girAttempts > 0 ? Math.round((girHit / girAttempts) * 100) : null,
      girHit,
      girAttempts,
      avgPuttsRound:
        puttHoles > 0 ? ((totalPutts / puttHoles) * 18).toFixed(1) : null,
      avgPuttsHole: puttHoles > 0 ? (totalPutts / puttHoles).toFixed(2) : null,
      totalPutts,
      puttHoles,
      onePuttPct:
        puttHoles > 0 ? Math.round((onePutts / puttHoles) * 100) : null,
      twoPuttPct:
        puttHoles > 0 ? Math.round((twoPutts / puttHoles) * 100) : null,
      threePlusPuttPct:
        puttHoles > 0 ? Math.round((threePlusPutts / puttHoles) * 100) : null,
      udPct: udAttempts > 0 ? Math.round((udSuccess / udAttempts) * 100) : null,
      udSuccess,
      udAttempts,
      girBirdiePct:
        girHoles > 0 ? Math.round((girBirdies / girHoles) * 100) : null,
    };
  };

  const totalStats = useMemo(() => calcStats(myStats), [myStats]);
  const liveStatsCalc = useMemo(() => calcStats(liveStats), [liveStats]);
  const histStats = useMemo(
    () => calcStats(historicalStats),
    [historicalStats]
  );

  // --- PER HOLE HISTORICAL STATS ---
  const perHoleStats = useMemo(() => {
    const holes = {};
    for (let i = 1; i <= 18; i++) {
      holes[i] = {
        fwAttempts: 0,
        fwHit: 0,
        girAttempts: 0,
        girHit: 0,
        totalPutts: 0,
        puttCount: 0,
      };
    }
    myStats.forEach((s) => {
      const h = s.hole_number;
      if (!holes[h]) return;
      if (s.fairway_hit !== null && s.fairway_hit !== "") {
        holes[h].fwAttempts++;
        const baseHit = s.fairway_hit?.replace("+Penalty", "");
        if (baseHit === "Hit" || s.fairway_hit === true) holes[h].fwHit++;
      }
      if (s.green_in_regulation !== null) {
        holes[h].girAttempts++;
        if (s.green_in_regulation === "Hit" || s.green_in_regulation === true)
          holes[h].girHit++;
      }
      if (s.putts !== null) {
        holes[h].totalPutts += Number(s.putts);
        holes[h].puttCount++;
      }
    });
    return holes;
  }, [myStats]);

  // --- STYLES ---
  const cardStyle = {
    background: "#fff",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  };

  const statRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
  };

  const labelStyle = {
    fontSize: "0.7rem",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "8px 4px",
    border: "none",
    borderRadius: "8px",
    background: active ? "#1b4332" : "transparent",
    color: active ? "white" : "#64748b",
    fontWeight: "700",
    fontSize: "0.65rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  const BigStat = ({ label, value, sub, color = "#1b4332" }) => (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: "1.6rem", fontWeight: "900", color }}>
        {value ?? "—"}
      </div>
      <div style={labelStyle}>{label}</div>
      {sub && (
        <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "2px" }}>
          {sub}
        </div>
      )}
    </div>
  );

  const OverviewRow = ({ label, live, hist, onClick }) => (
    <div
      onClick={onClick}
      style={{
        ...statRowStyle,
        cursor: onClick ? "pointer" : "default",
        padding: "12px 0",
      }}
    >
      <div
        style={{
          width: "80px",
          fontWeight: "700",
          fontSize: "0.85rem",
          color: "#1e293b",
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          fontWeight: "800",
          fontSize: "1rem",
          color: "#ef4444",
        }}
      >
        {live ?? "—"}
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          fontWeight: "700",
          fontSize: "0.9rem",
          color: "#64748b",
        }}
      >
        {hist ?? "—"}
      </div>
      {onClick && <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>›</div>}
    </div>
  );

  const BarRow = ({ label, value, total, color, maxVal }) => {
    const pct = maxVal ? Math.min((value / maxVal) * 100, 100) : value;
    return (
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
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
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div
          style={{
            width: "60px",
            textAlign: "right",
            fontSize: "0.8rem",
            fontWeight: "700",
            color,
          }}
        >
          {total}
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    const modeStats =
      overviewMode === "live"
        ? liveStatsCalc
        : overviewMode === "hist"
        ? histStats
        : totalStats;

    return (
      <>
        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            background: "#e2e8f0",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "14px",
          }}
        >
          {[
            { key: "hist", label: "Historical" },
            { key: "live", label: "This Round" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setOverviewMode(key)}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "8px",
                background: overviewMode === key ? "#1b4332" : "transparent",
                color: overviewMode === key ? "white" : "#64748b",
                fontWeight: "700",
                fontSize: "0.7rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          {[
            {
              label: "Fairway %",
              value: modeStats.fwPct !== null ? `${modeStats.fwPct}%` : "—",
              color: "#1b4332",
              sub: `${modeStats.fwHit}/${modeStats.fwAttempts} hit`,
            },
            {
              label: "GIR %",
              value: modeStats.girPct !== null ? `${modeStats.girPct}%` : "—",
              color: "#10b981",
              sub: `${modeStats.girHit}/${modeStats.girAttempts} hit`,
            },
            {
              label: overviewMode === "live" ? "Putts/Hole" : "Putts/Round", // 👈 CHANGE LABEL
              value:
                overviewMode === "live"
                  ? modeStats.avgPuttsHole ?? "—" // 👈 USE avgPuttsHole for live
                  : modeStats.avgPuttsRound ?? "—", // 👈 USE avgPuttsRound for historical
              color: "#3b82f6",
              sub:
                overviewMode === "live"
                  ? `${modeStats.puttHoles} holes tracked`
                  : `${modeStats.avgPuttsHole ?? "—"} per hole`,
            },
            {
              label: "Up & Down %",
              value: modeStats.udPct !== null ? `${modeStats.udPct}%` : "—",
              color: "#f59e0b",
              sub: `${modeStats.udSuccess}/${modeStats.udAttempts} att.`,
            },
          ].map(({ label, value, color, sub }) => (
            <div
              key={label}
              style={{ ...cardStyle, marginBottom: 0, textAlign: "center" }}
            >
              <div style={{ fontSize: "1.5rem", fontWeight: "900", color }}>
                {value}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginTop: "4px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "#94a3b8",
                  marginTop: "2px",
                }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table - always shows all three */}
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: "800",
              color: "#1b4332",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            This Round vs Historical
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div style={{ ...labelStyle, width: "80px" }}></div>
            <div
              style={{
                ...labelStyle,
                flex: 1,
                textAlign: "center",
                color: "#ef4444",
              }}
            >
              THIS ROUND
            </div>
            <div style={{ ...labelStyle, flex: 1, textAlign: "center" }}>
              HISTORICAL
            </div>
            <div style={{ width: "12px" }}></div>
          </div>
          <OverviewRow
            label="FW %"
            live={
              liveStatsCalc.fwPct !== null ? `${liveStatsCalc.fwPct}%` : "—"
            }
            hist={histStats.fwPct !== null ? `${histStats.fwPct}%` : "—"}
            onClick={() => setActiveTab("fairway")}
          />
          <OverviewRow
            label="GIR %"
            live={
              liveStatsCalc.girPct !== null ? `${liveStatsCalc.girPct}%` : "—"
            }
            hist={histStats.girPct !== null ? `${histStats.girPct}%` : "—"}
            onClick={() => setActiveTab("gir")}
          />
          <OverviewRow
            label="Putts"
            live={liveStatsCalc.totalPutts > 0 ? liveStatsCalc.totalPutts : "—"}
            hist={histStats.avgPuttsRound ?? "—"}
            onClick={() => setActiveTab("putts")}
          />
          <OverviewRow
            label="U/D %"
            live={
              liveStatsCalc.udPct !== null ? `${liveStatsCalc.udPct}%` : "—"
            }
            hist={histStats.udPct !== null ? `${histStats.udPct}%` : "—"}
            onClick={() => setActiveTab("updown")}
          />
        </div>

        {/* Putt Distribution */}
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: "800",
              color: "#1b4332",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            Putt Distribution
          </div>
          <BarRow
            label="1-Putt"
            value={modeStats.onePuttPct ?? 0}
            total={`${modeStats.onePuttPct ?? 0}%`}
            color="#10b981"
            maxVal={100}
          />
          <BarRow
            label="2-Putt"
            value={modeStats.twoPuttPct ?? 0}
            total={`${modeStats.twoPuttPct ?? 0}%`}
            color="#3b82f6"
            maxVal={100}
          />
          <BarRow
            label="3+ Putt"
            value={modeStats.threePlusPuttPct ?? 0}
            total={`${modeStats.threePlusPuttPct ?? 0}%`}
            color="#ef4444"
            maxVal={100}
          />
        </div>

        {/* Birdie Conversion */}
        <div style={cardStyle}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: "800",
              color: "#1b4332",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            Birdie Conversion
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{ fontSize: "2rem", fontWeight: "900", color: "#10b981" }}
            >
              {modeStats.girBirdiePct !== null
                ? `${modeStats.girBirdiePct}%`
                : "—"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              When you hit the green, this is how often you make birdie or
              better
            </div>
          </div>
        </div>
      </>
    );
  };

  // --- FAIRWAY TAB ---
  const renderFairway = () => (
    <>
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
          Fairway Hit Summary
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <BigStat
            label="This Round"
            value={
              liveStatsCalc.fwPct !== null ? `${liveStatsCalc.fwPct}%` : "—"
            }
            sub={`${liveStatsCalc.fwHit}/${liveStatsCalc.fwAttempts}`}
            color="#ef4444"
          />
          <BigStat
            label="Historical"
            value={histStats.fwPct !== null ? `${histStats.fwPct}%` : "—"}
            sub={`${histStats.fwHit}/${histStats.fwAttempts}`}
            color="#64748b"
          />
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: "800",
            color: "#1b4332",
            marginBottom: "12px",
            textTransform: "uppercase",
          }}
        >
          Fairway % by Hole
        </div>
        {Object.entries(perHoleStats).map(([hNum, data]) => {
          const pct =
            data.fwAttempts > 0
              ? Math.round((data.fwHit / data.fwAttempts) * 100)
              : null;
          const hasPenalty = data.penaltyCount > 0;
          return (
            <div
              key={hNum}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{ fontWeight: "700", width: "45px", fontSize: "0.8rem" }}
              >
                Hole {hNum}
              </span>
              <div
                style={{
                  flex: 1,
                  margin: "0 10px",
                  background: "#f1f5f9",
                  borderRadius: "4px",
                  height: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: pct !== null ? `${pct}%` : "0%",
                    background: "#1b4332",
                    height: "100%",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span
                style={{
                  fontWeight: "700",
                  color: "#1b4332",
                  width: "40px",
                  textAlign: "right",
                  fontSize: "0.85rem",
                }}
              >
                {pct !== null ? `${pct}%` : "—"}
              </span>
              {hasPenalty && (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "0.65rem",
                    color: "#ef4444",
                    fontWeight: "800",
                  }}
                >
                  P
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  // --- GIR TAB ---
  const renderGIR = () => (
    <>
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
          Greens in Regulation Summary
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <BigStat
            label="This Round"
            value={
              liveStatsCalc.girPct !== null ? `${liveStatsCalc.girPct}%` : "—"
            }
            sub={`${liveStatsCalc.girHit}/${liveStatsCalc.girAttempts}`}
            color="#ef4444"
          />
          <BigStat
            label="Historical"
            value={histStats.girPct !== null ? `${histStats.girPct}%` : "—"}
            sub={`${histStats.girHit}/${histStats.girAttempts}`}
            color="#64748b"
          />
        </div>
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
          <div style={labelStyle}>Birdie Conversion</div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: "900",
              color: "#10b981",
              marginTop: "4px",
            }}
          >
            {totalStats.girBirdiePct !== null
              ? `${totalStats.girBirdiePct}%`
              : "—"}
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: "800",
            color: "#1b4332",
            marginBottom: "12px",
            textTransform: "uppercase",
          }}
        >
          GIR % by Hole
        </div>
        {Object.entries(perHoleStats).map(([hNum, data]) => {
          const pct =
            data.girAttempts > 0
              ? Math.round((data.girHit / data.girAttempts) * 100)
              : null;
          return (
            <div
              key={hNum}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{ fontWeight: "700", width: "45px", fontSize: "0.8rem" }}
              >
                Hole {hNum}
              </span>
              <div
                style={{
                  flex: 1,
                  margin: "0 10px",
                  background: "#f1f5f9",
                  borderRadius: "4px",
                  height: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: pct !== null ? `${pct}%` : "0%",
                    background: "#10b981",
                    height: "100%",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span
                style={{
                  fontWeight: "700",
                  color: "#10b981",
                  width: "40px",
                  textAlign: "right",
                  fontSize: "0.85rem",
                }}
              >
                {pct !== null ? `${pct}%` : "—"}
              </span>
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "0.65rem",
                  width: "35px",
                  textAlign: "right",
                }}
              >
                {data.girAttempts > 0
                  ? `${data.girHit}/${data.girAttempts}`
                  : ""}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  // --- PUTTS TAB ---
  const renderPutts = () => (
    <>
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
          Putting Summary
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <BigStat
            label="This Round"
            value={
              liveStatsCalc.totalPutts > 0 ? liveStatsCalc.totalPutts : "—"
            }
            sub="total putts"
            color="#ef4444"
          />
          <BigStat
            label="Avg/Hole (Live)"
            value={liveStatsCalc.avgPuttsHole ?? "—"}
            color="#ef4444"
          />
          <BigStat
            label="Avg/Round (Hist)"
            value={histStats.avgPuttsRound ?? "—"}
            color="#64748b"
          />
        </div>
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
          <div style={{ ...labelStyle, marginBottom: "10px" }}>
            Putt Distribution (Historical)
          </div>
          <BarRow
            label="1-Putt"
            value={histStats.onePuttPct ?? 0}
            total={`${histStats.onePuttPct ?? 0}%`}
            color="#10b981"
            maxVal={100}
          />
          <BarRow
            label="2-Putt"
            value={histStats.twoPuttPct ?? 0}
            total={`${histStats.twoPuttPct ?? 0}%`}
            color="#3b82f6"
            maxVal={100}
          />
          <BarRow
            label="3+ Putt"
            value={histStats.threePlusPuttPct ?? 0}
            total={`${histStats.threePlusPuttPct ?? 0}%`}
            color="#ef4444"
            maxVal={100}
          />
        </div>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: "800",
            color: "#1b4332",
            marginBottom: "12px",
            textTransform: "uppercase",
          }}
        >
          Avg Putts by Hole (Historical)
        </div>
        {Object.entries(perHoleStats).map(([hNum, data]) => {
          const avg =
            data.puttCount > 0
              ? (data.totalPutts / data.puttCount).toFixed(1)
              : null;
          const barPct =
            avg !== null ? Math.min((Number(avg) / 4) * 100, 100) : 0;
          const color =
            avg === null
              ? "#ccc"
              : Number(avg) <= 1.5
              ? "#10b981"
              : Number(avg) <= 2
              ? "#3b82f6"
              : "#ef4444";
          return (
            <div
              key={hNum}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{ fontWeight: "700", width: "45px", fontSize: "0.8rem" }}
              >
                Hole {hNum}
              </span>
              <div
                style={{
                  flex: 1,
                  margin: "0 10px",
                  background: "#f1f5f9",
                  borderRadius: "4px",
                  height: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barPct}%`,
                    background: color,
                    height: "100%",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <span
                style={{
                  fontWeight: "700",
                  color,
                  width: "40px",
                  textAlign: "right",
                  fontSize: "0.85rem",
                }}
              >
                {avg ?? "—"}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  // --- UP/DOWN TAB ---
  const renderUpDown = () => (
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
        Up and Down Summary
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
        <BigStat
          label="This Round"
          value={liveStatsCalc.udPct !== null ? `${liveStatsCalc.udPct}%` : "—"}
          sub={`${liveStatsCalc.udSuccess}/${liveStatsCalc.udAttempts} att.`}
          color="#ef4444"
        />
        <BigStat
          label="Historical"
          value={histStats.udPct !== null ? `${histStats.udPct}%` : "—"}
          sub={`${histStats.udSuccess}/${histStats.udAttempts} att.`}
          color="#64748b"
        />
      </div>
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
        <div style={labelStyle}>Scrambling %</div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            marginBottom: "8px",
            marginTop: "4px",
          }}
        >
          Par or better after missing the GIR
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <BigStat
            label="This Round"
            value={
              liveStatsCalc.udPct !== null ? `${liveStatsCalc.udPct}%` : "—"
            }
            color="#ef4444"
          />
          <BigStat
            label="Historical"
            value={histStats.udPct !== null ? `${histStats.udPct}%` : "—"}
            color="#64748b"
          />
        </div>
      </div>
    </div>
  );
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
          padding: "15px 20px 15px 65px", // 👈 65px left padding clears the hamburger
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h2 style={{ margin: 0, color: "#1b4332", fontSize: "1.2rem" }}>
          Detailed Hole Stats
        </h2>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            color: "#ccc",
            cursor: "pointer",
          }}
        >
          x
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "10px 15px 10px 65px",
          background: "#f1f5f9",
          position: "sticky",
          top: "57px",
          zIndex: 9,
        }}
      >
        {[
          { key: "overview", label: "Overview" },
          { key: "fairway", label: "FW" },
          { key: "gir", label: "GIR" },
          { key: "putts", label: "Putts" },
          { key: "updown", label: "U/D" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={tabStyle(activeTab === key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "15px" }}>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "fairway" && renderFairway()}
        {activeTab === "gir" && renderGIR()}
        {activeTab === "putts" && renderPutts()}
        {activeTab === "updown" && renderUpDown()}
      </div>
    </div>
  );
}
