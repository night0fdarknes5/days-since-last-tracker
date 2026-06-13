import React, { useState, useEffect } from "react";

const DaysSinceIncident: React.FC = () => {
  // Initialize state (stored as milliseconds)
  const [lastIncidentTime, setLastIncidentTime] = useState<number>(() => {
    const saved = localStorage.getItem("lastIncidentTime");
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const [timeSince, setTimeSince] = useState<number>(Date.now() - lastIncidentTime);

  useEffect(() => {
    // Save to local storage so it persists across reloads
    localStorage.setItem("lastIncidentTime", lastIncidentTime.toString());

    // Update the counter every second
    const interval = setInterval(() => {
      setTimeSince(Date.now() - lastIncidentTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastIncidentTime]);

  // Reset function
  const handleReset = () => {
    setLastIncidentTime(Date.now());
  };

  // Calculate Days, Hours, Minutes, Seconds
  const seconds = Math.floor((timeSince / 1000) % 60);
  const minutes = Math.floor((timeSince / (1000 * 60)) % 60);
  const hours = Math.floor((timeSince / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeSince / (1000 * 60 * 60 * 24));

  return (
    <div style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Days Since Last Incident</h2>
      
      <div style={{ fontSize: "3rem", fontWeight: "bold", margin: "1rem 0" }}>
        {days}
      </div>
      
      <div style={{ fontSize: "1.2rem", color: "#555", marginBottom: "2rem" }}>
        {hours}h {minutes}m {seconds}s
      </div>

      <button 
        onClick={handleReset}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff4d4f",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "1rem"
        }}
      >
        Reset Counter
      </button>
    </div>
  );
};

export default DaysSinceIncident;