import { useEffect, useState } from "react";

const STORAGE_KEY = "lastIncidentTime";

type PersistenceSource = "loading" | "blob" | "local" | "error";

function readLocalIncidentTime() {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return Date.now();
  }

  const parsed = Number.parseInt(saved, 10);

  return Number.isFinite(parsed) ? parsed : Date.now();
}

function formatDuration(milliseconds: number) {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds };
}

const DaysSinceIncident = () => {
  const [lastIncidentTime, setLastIncidentTime] = useState<number>(() => readLocalIncidentTime());
  const [now, setNow] = useState(() => Date.now());
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [persistenceSource, setPersistenceSource] = useState<PersistenceSource>("loading");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isActive = true;

    const syncIncidentTime = async () => {
      try {
        const response = await fetch("/api/incident");

        if (!response.ok) {
          throw new Error(`Unexpected response: ${response.status}`);
        }

        const data: unknown = await response.json();
        const remoteTime =
          typeof data === "object" && data !== null && "lastIncidentTime" in data
            ? (data as { lastIncidentTime?: unknown }).lastIncidentTime
            : null;

        if (typeof remoteTime === "number" && Number.isFinite(remoteTime) && isActive) {
          setLastIncidentTime(remoteTime);
          window.localStorage.setItem(STORAGE_KEY, String(remoteTime));
          setPersistenceSource("blob");
        } else if (isActive) {
          setPersistenceSource("local");
        }
      } catch {
        if (isActive) {
          setSyncError("Persistence is currently using browser storage only.");
          setPersistenceSource("error");
        }
      } finally {
        if (isActive) {
          setIsSyncing(false);
        }
      }
    };

    void syncIncidentTime();

    return () => {
      isActive = false;
    };
  }, []);

  const handleReset = async () => {
    const nextIncidentTime = Date.now();

    setLastIncidentTime(nextIncidentTime);
    setSyncError(null);
    window.localStorage.setItem(STORAGE_KEY, String(nextIncidentTime));

    try {
      const response = await fetch("/api/incident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastIncidentTime: nextIncidentTime }),
      });

      if (!response.ok) {
        throw new Error(`Unexpected response: ${response.status}`);
      }

      setPersistenceSource("blob");
    } catch {
      setSyncError("Saved in this browser, but the deployment store is unavailable.");
      setPersistenceSource("error");
    }
  };

  const timeSince = now - lastIncidentTime;
  const { days, hours, minutes, seconds } = formatDuration(timeSince);

  return (
    <div style={{ textAlign: "center", padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Days Since Last Incident</h2>

      <div style={{ fontSize: "3rem", fontWeight: "bold", margin: "1rem 0" }}>{days}</div>

      <div style={{ fontSize: "1.2rem", color: "#555", marginBottom: "1rem" }}>
        {hours}h {minutes}m {seconds}s
      </div>

      <div style={{ minHeight: "1.5rem", marginBottom: "1rem", color: "#666" }}>
        {isSyncing
          ? "Syncing deployment storage..."
          : syncError ??
              (persistenceSource === "blob"
                ? "Loaded from and saved to Vercel Blob."
                : persistenceSource === "local"
                  ? "Using browser storage because the remote blob is empty or unavailable."
                  : "Waiting for remote storage.")}
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
          fontSize: "1rem",
        }}
      >
        Reset Counter
      </button>
    </div>
  );
};

export default DaysSinceIncident;