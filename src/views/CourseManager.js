import React, { useState } from "react";

/**
 * SUB-COMPONENT: CourseCreator
 * Used for adding a new course or editing an existing one.
 */
export function CourseCreator({ course, onSave, onCancel }) {
  const [courseName, setCourseName] = useState(course?.name || "");
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
      holes: holes,
      total_par: holes.reduce((acc, h) => acc + h.par, 0),
    });
  };

  return (
    <div
      className="view-container"
      style={{
        padding: "20px",
        paddingTop: "100px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "25px",
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
          }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, color: "#1b4332", fontWeight: "800" }}>
          {course ? "Edit Course" : "New Course"}
        </h2>
      </div>

      <div
        className="glass-card"
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
            fontSize: "0.7rem",
            color: "#888",
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
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingBottom: "100px",
        }}
      >
        {holes.map((h, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 1fr",
              alignItems: "center",
              background: "#fff",
              padding: "12px",
              borderRadius: "14px",
              border: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: "900",
                color: "#1b4332",
              }}
            >
              {i + 1}
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "#aaa",
                  fontWeight: "bold",
                }}
              >
                PAR
              </div>
              <input
                type="number"
                value={h.par}
                onChange={(e) => handleHoleChange(i, "par", e.target.value)}
                style={{
                  width: "80%",
                  textAlign: "center",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "5px",
                }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "#aaa",
                  fontWeight: "bold",
                }}
              >
                DIFF
              </div>
              <input
                type="number"
                value={h.difficulty}
                onChange={(e) =>
                  handleHoleChange(i, "difficulty", e.target.value)
                }
                style={{
                  width: "80%",
                  textAlign: "center",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "5px",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 20,
          left: 0,
          right: 0,
          padding: "20px",
          background: "linear-gradient(to top, #fff 80%, transparent)",
          display: "flex",
          justifyContent: "center",
          zIndex: 10,
          marginTop: "20px",
        }}
      >
        <button
          onClick={handleSave}
          style={{
            width: "100%",
            maxWidth: "460px",
            padding: "18px",
            backgroundColor: "#1b4332",
            color: "white",
            border: "none",
            borderRadius: "16px",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(27,67,50,0.2)",
          }}
        >
          SAVE COURSE
        </button>
      </div>
    </div>
  );
}

/**
 * MAIN COMPONENT: CourseManager (The Library View)
 * This is the DEFAULT export that App.js expects.
 */
export default function CourseManager({
  courses = [],
  onEdit,
  onAdd,
  setHomeCourse,
  homeCourseId,
}) {
  return (
    <div
      className="view-container"
      style={{
        padding: "20px",
        paddingTop: "100px",
        minHeight: "100vh",
        backgroundColor: "#fcfdfd",
      }}
    >
      <div className="view-header" style={{ marginBottom: "25px" }}>
        <h2
          className="profile-title"
          style={{
            margin: 0,
            fontSize: "2.2rem",
            color: "#1b4332",
            fontWeight: "900",
          }}
        >
          Course Library
        </h2>
        <p
          style={{
            color: "#888",
            fontSize: "0.9rem",
            marginTop: "5px",
            fontWeight: "500",
          }}
        >
          Manage your home and away tracks
        </p>
      </div>

      <div className="course-list">
        {courses && courses.length > 0 ? (
          courses.map((course) => (
            <div
              key={course.id}
              className="glass-card"
              style={{
                padding: "18px",
                marginBottom: "15px",
                background: "white",
                borderRadius: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                border: "1px solid #edf2f0",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "#1b4332",
                    fontSize: "1.1rem",
                    fontWeight: "800",
                  }}
                >
                  {course.name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "#aaa",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginTop: "4px",
                  }}
                >
                  {course.holes?.length || 18} Holes • Par{" "}
                  {course.total_par || 72}
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setHomeCourse(course.id)}
                  style={{
                    // Change background if this is the home course
                    background: homeCourseId === course.id ? "#1b4332" : "#fff",
                    border: "1px solid #edf2f0",
                    padding: "10px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "1.3rem",
                    transition: "all 0.2s ease", // Smooth color transition
                  }}
                  title="Set as Home Course"
                >
                  {/* Show a different emoji or color based on selection */}
                  {homeCourseId === course.id ? "🏠" : "🏡"}
                </button>
                <button
                  onClick={() => onEdit(course)}
                  style={{
                    background: "#fff",
                    border: "1px solid #edf2f0",
                    padding: "10px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                  }}
                >
                  ✏️
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#ccc",
              background: "white",
              borderRadius: "16px",
              border: "2px dashed #eee",
            }}
          >
            No courses in your library yet.
          </div>
        )}
      </div>

      <button
        onClick={onAdd}
        style={{
          width: "100%",
          padding: "18px",
          backgroundColor: "#1b4332",
          color: "white",
          borderRadius: "16px",
          border: "none",
          fontWeight: "800",
          marginTop: "20px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(27,67,50,0.2)",
          fontSize: "1rem",
        }}
      >
        + ADD NEW COURSE
      </button>
    </div>
  );
}
