"use client";

interface Temp {
  chip: string;
  sensor: string;
  value: number;
}

function getTempColor(val: number): string {
  if (val > 80) return "#ff4466";
  if (val > 65) return "#ffcc00";
  return "#e2e8f0";
}

export default function TempPanel({ temps }: { temps: Temp[] }) {
  // Group by chip
  const grouped: Record<string, Temp[]> = {};
  for (const t of temps) {
    const key = t.chip || "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  return (
    <div
      style={{
        background: "#1a1f2e",
        border: "1px solid #2a3350",
        borderRadius: 8,
        padding: "20px",
      }}
    >
      <h3
        style={{
          color: "#8899bb",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 1,
          marginBottom: 16,
        }}
      >
        Temperature
      </h3>
      {Object.keys(grouped).length === 0 ? (
        <p
          style={{
            color: "#4a5568",
            fontSize: 12,
            fontFamily: "IBM Plex Mono",
          }}
        >
          No temperature sensors found.
          <br />
          <span style={{ fontSize: 10 }}>
            Install lm-sensors on host and restart node-exporter.
          </span>
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([chip, sensors]) => (
            <div key={chip}>
              <p
                style={{
                  color: "#4a5568",
                  fontSize: 11,
                  marginBottom: 8,
                  fontFamily: "IBM Plex Mono",
                }}
              >
                {chip}
              </p>
              <div className="space-y-2">
                {sensors.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 rounded"
                    style={{ background: "#12172a" }}
                  >
                    <span style={{ color: "#8899bb", fontSize: 12 }}>
                      {s.sensor || `Sensor ${i + 1}`}
                    </span>
                    <span
                      style={{
                        color: getTempColor(s.value),
                        fontSize: 16,
                        fontFamily: "IBM Plex Mono",
                        fontWeight: 600,
                      }}
                    >
                      {s.value} °C
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
