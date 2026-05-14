import React, { useState } from "react";

export default function DiceRoller({ onBack, numDice = 1 }) {
  const [dice, setDice] = useState(Array(numDice).fill(null));
  const [rolling, setRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState(Array(numDice).fill(1));

  const diceFaces = {
    1: "⚀",
    2: "⚁",
    3: "⚂",
    4: "⚃",
    5: "⚄",
    6: "⚅",
  };

  const rollDice = () => {
    if (rolling) return;
    setRolling(true);
    setDice(Array(numDice).fill(null));

    let rollCount = 0;
    const maxRolls = 15;
    const interval = setInterval(() => {
      setDisplayDice(
        Array(numDice)
          .fill(null)
          .map(() => Math.floor(Math.random() * 6) + 1)
      );
      rollCount++;
      if (rollCount >= maxRolls) {
        clearInterval(interval);
        const finalResults = Array(numDice)
          .fill(null)
          .map(() => Math.floor(Math.random() * 6) + 1);
        setDice(finalResults);
        setDisplayDice(finalResults);
        setRolling(false);
      }
    }, 80);
  };

  const total = dice.every((d) => d !== null)
    ? dice.reduce((a, b) => a + b, 0)
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1b4332",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "60px 20px 20px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ color: "white", margin: 0, fontSize: "1.4rem" }}>
          🎲 Dice Roller
        </h2>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            borderRadius: "8px",
            padding: "8px 16px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* Subtitle */}
      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: "0.9rem",
          marginBottom: "40px",
          textAlign: "center",
        }}
      >
        {numDice === 1
          ? "You made a 2! Roll for your winnings 💰"
          : `You made ${numDice} twos! Roll each die for your winnings 💰`}
      </p>

      {/* Dice */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "50px",
        }}
      >
        {Array(numDice)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              style={{
                fontSize: numDice > 2 ? "6rem" : "8rem",
                lineHeight: 1,
                transition: "transform 0.1s ease",
                transform: rolling
                  ? `rotate(${Math.random() * 30 - 15}deg)`
                  : "rotate(0deg)",
                filter: rolling ? "blur(1px)" : "none",
                color: "white",
                animation: rolling ? "none" : "none",
              }}
            >
              {diceFaces[displayDice[i]] || "⚀"}
            </div>
          ))}
      </div>

      {/* Result */}
      {total !== null && !rolling && (
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "20px 40px",
            textAlign: "center",
            marginBottom: "40px",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {numDice > 1 && (
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.8rem",
                marginBottom: "8px",
                textTransform: "uppercase",
                fontWeight: "700",
              }}
            >
              Total Winnings
            </div>
          )}
          <div
            style={{ color: "#4ade80", fontSize: "3rem", fontWeight: "900" }}
          >
            ${total}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.85rem",
              marginTop: "4px",
            }}
          >
            {numDice > 1
              ? `each player owes you $${total}`
              : `each player owes you $${total}`}
          </div>
        </div>
      )}

      {/* Roll Button */}
      <button
        onClick={rollDice}
        disabled={rolling}
        style={{
          background: rolling ? "rgba(255,255,255,0.2)" : "#4ade80",
          color: rolling ? "rgba(255,255,255,0.5)" : "#1b4332",
          border: "none",
          borderRadius: "16px",
          padding: "18px 60px",
          fontSize: "1.2rem",
          fontWeight: "900",
          cursor: rolling ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: rolling ? "none" : "0 8px 20px rgba(74,222,128,0.3)",
        }}
      >
        {rolling ? "Rolling..." : total !== null ? "Roll Again 🎲" : "Roll 🎲"}
      </button>
    </div>
  );
}
