import {
  queryPrometheus,
  queryPrometheusRange,
  queryPrometheusAll,
} from "@/lib/prometheus";
import { checkAndSendAlert, ALERT_THRESHOLDS } from "@/lib/telegram";

export const dynamic = "force-dynamic";

async function collectMetrics() {
  const [
    cpuUsage,
    ramTotal,
    ramUsed,
    networkRxRate,
    networkTxRate,
    cpuHistory,
    ramHistory,
    networkRxHistory,
    networkTxHistory,
    containers,
    diskDevices,
    diskFree,
    diskReadRate,
    diskWriteRate,
    cpuTemp,
  ] = await Promise.all([
    queryPrometheus(
      '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    ),
    queryPrometheus("node_memory_MemTotal_bytes"),
    queryPrometheus(
      "node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes",
    ),
    queryPrometheus(
      'sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))',
    ),
    queryPrometheus(
      'sum(rate(node_network_transmit_bytes_total{device!="lo"}[5m]))',
    ),
    queryPrometheusRange(
      '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
      60,
    ),
    queryPrometheusRange(
      "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
      60,
    ),
    queryPrometheusRange(
      'sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))',
      60,
    ),
    queryPrometheusRange(
      'sum(rate(node_network_transmit_bytes_total{device!="lo"}[5m]))',
      60,
    ),
    queryPrometheusAll('container_memory_usage_bytes{name!=""}'),
    queryPrometheusAll(
      'node_filesystem_size_bytes{fstype!~"tmpfs|devtmpfs|squashfs|overlay"}',
    ),
    queryPrometheusAll(
      'node_filesystem_free_bytes{fstype!~"tmpfs|devtmpfs|squashfs|overlay"}',
    ),
    queryPrometheusAll("rate(node_disk_read_bytes_total[5m])"),
    queryPrometheusAll("rate(node_disk_written_bytes_total[5m])"),
    queryPrometheusAll("node_hwmon_temp_celsius"),
  ]);

  const ramPercent = ramTotal && ramUsed ? (ramUsed / ramTotal) * 100 : null;

  const normalizeDevice = (device: string = "") =>
    device.replace(/^\/dev\//, "");

  // Build disk list
  const diskMap: Record<string, any> = {};
  for (const d of diskDevices) {
    const device = d.metric.device || "";
    const mountpoint = d.metric.mountpoint || "";
    const deviceKey = normalizeDevice(device);
    const key = `${deviceKey}:${mountpoint}`;

    diskMap[key] = {
      device,
      deviceKey,
      mountpoint,
      fstype: d.metric.fstype,
      size: d.value,
      free: 0,
      readRate: 0,
      writeRate: 0,
    };
  }

  for (const d of diskFree) {
    const deviceKey = normalizeDevice(d.metric.device || "");
    const key = `${deviceKey}:${d.metric.mountpoint}`;
    if (diskMap[key]) diskMap[key].free = d.value;
  }

  // Match disk read/write by device name (normalize /dev/ prefix)
  for (const d of diskReadRate) {
    const deviceKey = normalizeDevice(d.metric.device || "");
    for (const key of Object.keys(diskMap)) {
      if (key.startsWith(deviceKey + ":")) diskMap[key].readRate = d.value;
    }
  }
  for (const d of diskWriteRate) {
    const deviceKey = normalizeDevice(d.metric.device || "");
    for (const key of Object.keys(diskMap)) {
      if (key.startsWith(deviceKey + ":")) diskMap[key].writeRate = d.value;
    }
  }

  // Temperatures
  const temps = cpuTemp.map((t) => ({
    chip: t.metric.chip || "",
    sensor: t.metric.sensor || "",
    value: parseFloat(t.value.toFixed(1)),
  }));

  // Check for alerts
  if (cpuUsage !== null) {
    await checkAndSendAlert(
      "cpu_high",
      cpuUsage > ALERT_THRESHOLDS.CPU_USAGE,
      `CPU usage is ${cpuUsage.toFixed(1)}% (threshold: ${ALERT_THRESHOLDS.CPU_USAGE}%)`,
    );
  }

  if (ramPercent !== null) {
    await checkAndSendAlert(
      "ram_high",
      ramPercent > ALERT_THRESHOLDS.RAM_USAGE,
      `RAM usage is ${ramPercent.toFixed(1)}% (threshold: ${ALERT_THRESHOLDS.RAM_USAGE}%)`,
    );
  }

  // Check disk usage for each mount
  for (const disk of Object.values(diskMap) as any[]) {
    if (disk.size > 0) {
      const usagePercent = ((disk.size - disk.free) / disk.size) * 100;
      await checkAndSendAlert(
        `disk_high_${disk.mountpoint}`,
        usagePercent > ALERT_THRESHOLDS.DISK_USAGE,
        `Disk usage on ${disk.mountpoint} is ${usagePercent.toFixed(1)}% (threshold: ${ALERT_THRESHOLDS.DISK_USAGE}%)`,
      );
    }
  }

  // Check temperatures
  for (const temp of temps) {
    if (temp.value > ALERT_THRESHOLDS.TEMPERATURE) {
      await checkAndSendAlert(
        `temp_high_${temp.chip}_${temp.sensor}`,
        temp.value > ALERT_THRESHOLDS.TEMPERATURE,
        `Temperature ${temp.chip} ${temp.sensor} is ${temp.value}°C (threshold: ${ALERT_THRESHOLDS.TEMPERATURE}°C)`,
      );
    }
  }

  return {
    cpu: {
      value: cpuUsage ? parseFloat(cpuUsage.toFixed(1)) : null,
      history: cpuHistory,
    },
    ram: {
      percent: ramPercent ? parseFloat(ramPercent.toFixed(1)) : null,
      used: ramUsed,
      total: ramTotal,
      history: ramHistory,
    },
    network: {
      rx: networkRxRate,
      tx: networkTxRate,
      rxHistory: networkRxHistory,
      txHistory: networkTxHistory,
    },
    disks: Object.values(diskMap).map((d: any) => ({
      device: d.device,
      mountpoint: d.mountpoint,
      size: d.size,
      used: d.size - d.free,
      percent:
        d.size > 0
          ? parseFloat((((d.size - d.free) / d.size) * 100).toFixed(1))
          : 0,
      readRate: d.readRate,
      writeRate: d.writeRate,
    })),
    containers: containers.map((c: any) => ({
      name: c.metric.name,
      memoryBytes: c.value,
    })),
    temps,
    timestamp: new Date().toISOString(),
  };
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send(await collectMetrics());
      } catch (e) {
        send({ error: "fetch failed" });
      }

      const interval = setInterval(async () => {
        try {
          send(await collectMetrics());
        } catch (e) {
          send({ error: "fetch failed" });
        }
      }, 2000);

      setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
