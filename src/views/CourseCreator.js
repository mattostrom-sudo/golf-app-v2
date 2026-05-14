import React, { useState } from "react";

export default function CourseCreator({ course, onSave, onCancel }) {
  const [courseName, setCourseName] = useState(course?.name || "");
  const [isHomeCourse, setIsHomeCourse] = useState(
    course?.is_home_course || false
  );
  const [holes, setHoles] = useState(
    course?.holes ||
      Array.from({ length: 18 }, (_, i) => ({
        index: i + 1,
        par: 4,
        difficulty: i + 1,
      }))
  );

  const handleHoleChange = (i, field, value) => {
    const newHoles = [...holes];
    newHoles[i][field] = parseInt(value) || 0;
    setHoles(newHoles);
  };

  const handleSave = () => {
    if (!courseName) return alert("Please enter a course name");
    onSave({
      id: course?.id || Date.now(),
      name: courseName,
      is_home_course: isHomeCourse,
      holes: holes,
      total_par: holes.reduce((acc, h) => acc + h.par, 0),
    });
  };

  return (
    <div
      className="screen course-creator"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", color: "#333" }}
    >
      {/* Increased paddingTop to 100px and added paddingLeft to 
        move the arrow out from under the hamburger menu.
      */}
      <div
        className="dashboard-view"
        style={{
          paddingTop: "100px",
          maxWidth: "450px",
          margin: "0 auto",
          paddingLeft: "15px",
          paddingRight: "15px",
        }}
      >
        {/* Header Section - Shifted Right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "25px",
            paddingLeft: "60px", // This pushes the arrow past the hamburger button
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "10px 14px",
              cursor: "pointer",
              fontSize: "1.2rem",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            ←
          </button>
          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: "800",
              color: "#1b4332",
            }}
          >
            {course ? "Edit Course" : "New Course"}
          </h2>
        </div>

        {/* Course Info Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            marginBottom: "20px",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "700",
              marginBottom: "8px",
              fontSize: "0.8rem",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Course Name
          </label>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. Pebble Beach"
            style={{
              width: "100%",
              padding: "14px",
              border: "2px solid #edf2f0",
              borderRadius: "12px",
              fontSize: "1rem",
              color: "#000",
              backgroundColor: "#fcfdfd",
              boxSizing: "border-box",
              marginBottom: "15px",
            }}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              padding: "10px",
              backgroundColor: "#f0f7f4",
              borderRadius: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={isHomeCourse}
              onChange={(e) => setIsHomeCourse(e.target.checked)}
              style={{ width: "20px", height: "20px" }}
            />
            <span style={{ fontWeight: "600", color: "#1b4332" }}>
              Set as Home Course 🏠
            </span>
          </label>
        </div>

        {/* Hole Editor List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingBottom: "120px",
          }}
        >
          {holes.map((h, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1fr",
                alignItems: "center",
                background: "#fff",
                padding: "15px",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#999",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  Hole
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "900",
                    color: "#1b4332",
                  }}
                >
                  {i + 1}
                </div>
              </div>

              <div style={{ padding: "0 5px" }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#aaa",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                    textAlign: "center",
                  }}
                >
                  Par
                </div>
                <input
                  type="number"
                  value={h.par}
                  onChange={(e) => handleHoleChange(i, "par", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    backgroundColor: "#fafafa",
                    color: "#333",
                  }}
                />
              </div>

              <div style={{ padding: "0 5px" }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#aaa",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                    textAlign: "center",
                  }}
                >
                  Diff
                </div>
                <input
                  type="number"
                  value={h.difficulty}
                  onChange={(e) =>
                    handleHoleChange(i, "difficulty", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    textAlign: "center",
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    backgroundColor: "#fafafa",
                    color: "#333",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Save Button Container */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px",
            background: "linear-gradient(to top, #f8f9fa 80%, transparent)",
            display: "flex",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <button
            onClick={handleSave}
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "18px",
              backgroundColor: "#1b4332",
              color: "white",
              border: "none",
              borderRadius: "16px",
              fontWeight: "800",
              fontSize: "1.1rem",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(27, 67, 50, 0.3)",
            }}
          >
            SAVE COURSE
          </button>
        </div>
      </div>
    </div>
  );
}
