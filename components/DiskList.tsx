"use client";

interface Disk {
  device: string;
  mountpoint: string;
  size: number;
  used: number;
  percent: number;
  readRate: number;
  writeRate: number;
}

function formatBytes(bytes: number): string {
  if (bytes > 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function formatRate(bps: number): string {
  if (bps > 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
  if (bps > 1e3) return `${(bps / 1e3).toFixed(1)} KB/s`;
  return `${bps.toFixed(0)} B/s`;
}

function getBarColor(percent: number): string {
  if (percent > 85) return "#ff4466";
  if (percent > 70) return "#ffcc00";
  return "#00c896";
}

export default function DiskList({ disks }: { disks: Disk[] }) {
  const sorted = [...disks].sort((a, b) => b.size - a.size);

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
        Disk Usage
      </h3>
      <div className="space-y-4">
        {sorted.length === 0 && (
          <p
            style={{
              color: "#4a5568",
              fontSize: 12,
              fontFamily: "IBM Plex Mono",
            }}
          >
            No disk data available
          </p>
        )}
        {sorted.map((disk, i) => {
          const barColor = getBarColor(disk.percent);
          return (
            <div key={`${disk.device}-${disk.mountpoint}`}>
              <div className="flex justify-between items-baseline mb-1">
                <span
                  style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500 }}
                >
                  {disk.device}{" "}
                  <span style={{ color: "#4a5568" }}>({disk.mountpoint})</span>
                </span>
                <span
                  style={{
                    color: "#8899bb",
                    fontSize: 12,
                    fontFamily: "IBM Plex Mono",
                  }}
                >
                  {formatBytes(disk.used)} / {formatBytes(disk.size)} (
                  {disk.percent}%)
                </span>
              </div>
              <div
                style={{
                  background: "#2a3350",
                  borderRadius: 3,
                  height: 6,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: `${Math.min(disk.percent, 100)}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: barColor,
                    boxShadow: `0 0 6px ${barColor}88`,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span
                  style={{
                    color: "#4a5568",
                    fontSize: 11,
                    fontFamily: "IBM Plex Mono",
                  }}
                >
                  Read: {formatRate(disk.readRate)}
                </span>
                <span
                  style={{
                    color: "#4a5568",
                    fontSize: 11,
                    fontFamily: "IBM Plex Mono",
                  }}
                >
                  Write: {formatRate(disk.writeRate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
