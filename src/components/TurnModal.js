import React from "react";

export default function TurnModal({
  isOpen,
  onClose,
  hole,
  players,
  scores,
  updateScore,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div className="modal-header">
          <h3>
            Hole {hole?.index}{" "}
            <span className="par-badge">Par {hole?.par}</span>
          </h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="player-score-list">
          {players.map((player) => (
            <div key={player} className="player-input-row">
              <label>{player}</label>
              <div className="counter-input">
                <button
                  onClick={() =>
                    updateScore(
                      player,
                      hole.index,
                      Math.max(
                        1,
                        (parseInt(scores[`${player}-${hole.index}`]) ||
                          hole.par) - 1
                      )
                    )
                  }
                >
                  -
                </button>
                <input
                  type="number"
                  value={scores[`${player}-${hole.index}`] || ""}
                  placeholder={hole.par}
                  onChange={(e) =>
                    updateScore(player, hole.index, e.target.value)
                  }
                />
                <button
                  onClick={() =>
                    updateScore(
                      player,
                      hole.index,
                      (parseInt(scores[`${player}-${hole.index}`]) ||
                        hole.par) + 1
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="primary shadow-btn"
          style={{ marginTop: "20px" }}
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
