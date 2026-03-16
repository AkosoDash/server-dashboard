import {
  queryPrometheus,
  queryPrometheusRange,
  queryPrometheusAll,
} from "./prometheus";
import { sendTelegramMessage } from "./telegram";

interface DailyMetrics {
  cpu: {
    avg: number | null;
    max: number | null;
    history: { time: string; value: number }[];
  };
  ram: {
    avg: number | null;
    max: number | null;
    history: { time: string; value: number }[];
  };
  disk: {
    total: number | null;
    used: number | null;
    percent: number | null;
  };
  network: {
    rxTotal: number | null;
    txTotal: number | null;
  };
  containers: { name: string; memoryBytes: number }[];
  temps: { chip: string; sensor: string; value: number }[];
}

export async function generateDailyReport(): Promise<string> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get 24-hour metrics
  const [
    cpuHistory,
    ramHistory,
    diskTotal,
    diskUsed,
    networkRx,
    networkTx,
    containers,
    temps,
  ] = await Promise.all([
    queryPrometheusRange(
      '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
      1440,
    ), // 24 hours
    queryPrometheusRange(
      "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
      1440,
    ),
    queryPrometheus(
      'node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"}',
    ),
    queryPrometheus(
      'node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"} - node_filesystem_free_bytes{mountpoint="/",fstype!="tmpfs"}',
    ),
    queryPrometheus(
      'increase(node_network_receive_bytes_total{device!="lo"}[24h])',
    ),
    queryPrometheus(
      'increase(node_network_transmit_bytes_total{device!="lo"}[24h])',
    ),
    queryPrometheusAll('container_memory_usage_bytes{name!=""}'),
    queryPrometheusAll("node_hwmon_temp_celsius"),
  ]);

  // Calculate averages and maxes
  const cpuValues = cpuHistory.map((h) => h.value).filter((v) => v !== null);
  const ramValues = ramHistory.map((h) => h.value).filter((v) => v !== null);

  const cpuAvg =
    cpuValues.length > 0
      ? cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length
      : null;
  const cpuMax = cpuValues.length > 0 ? Math.max(...cpuValues) : null;
  const ramAvg =
    ramValues.length > 0
      ? ramValues.reduce((a, b) => a + b, 0) / ramValues.length
      : null;
  const ramMax = ramValues.length > 0 ? Math.max(...ramValues) : null;

  const diskPercent =
    diskTotal && diskUsed ? (diskUsed / diskTotal) * 100 : null;

  // Format bytes
  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return "N/A";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  // Build report
  let report = `📊 **Daily Server Report** - ${yesterday.toLocaleDateString()}\n\n`;

  report += `🔥 **CPU Usage**\n`;
  report += `• Average: ${cpuAvg ? `${cpuAvg.toFixed(1)}%` : "N/A"}\n`;
  report += `• Peak: ${cpuMax ? `${cpuMax.toFixed(1)}%` : "N/A"}\n\n`;

  report += `💾 **Memory Usage**\n`;
  report += `• Average: ${ramAvg ? `${ramAvg.toFixed(1)}%` : "N/A"}\n`;
  report += `• Peak: ${ramMax ? `${ramMax.toFixed(1)}%` : "N/A"}\n\n`;

  report += `💿 **Disk Usage**\n`;
  report += `• Used: ${formatBytes(diskUsed)}\n`;
  report += `• Total: ${formatBytes(diskTotal)}\n`;
  report += `• Usage: ${diskPercent ? `${diskPercent.toFixed(1)}%` : "N/A"}\n\n`;

  report += `🌐 **Network Traffic (24h)**\n`;
  report += `• Received: ${formatBytes(networkRx)}\n`;
  report += `• Sent: ${formatBytes(networkTx)}\n\n`;

  if (containers.length > 0) {
    report += `🐳 **Top Containers by Memory**\n`;
    containers
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .forEach((c, i) => {
        report += `${i + 1}. ${c.metric.name || "unknown"}: ${formatBytes(c.value)}\n`;
      });
    report += "\n";
  }

  if (temps.length > 0) {
    report += `🌡️ **Temperatures**\n`;
    temps.forEach((t) => {
      report += `• ${t.metric.chip || "unknown"} ${t.metric.sensor || "sensor"}: ${t.value.toFixed(1)}°C\n`;
    });
    report += "\n";
  }

  report += `⏰ Generated at ${now.toLocaleString()}`;

  return report;
}

export async function sendDailyReport(): Promise<void> {
  try {
    const report = await generateDailyReport();
    await sendTelegramMessage(report);
    console.log("Daily report sent successfully");
  } catch (error) {
    console.error("Failed to send daily report:", error);
    // Try to send error notification
    try {
      await sendTelegramMessage(`❌ Failed to generate daily report: ${error}`);
    } catch (e) {
      console.error("Failed to send error notification:", e);
    }
  }
}

// For standalone execution
if (require.main === module) {
  sendDailyReport()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
