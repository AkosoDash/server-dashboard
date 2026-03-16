import { NextResponse } from 'next/server'
import { queryPrometheus, queryPrometheusRange, queryPrometheusAll } from '@/lib/prometheus'

export async function GET() {
  const [
    cpuUsage,
    ramTotal,
    ramUsed,
    diskTotal,
    diskUsed,
    networkRxRate,
    networkTxRate,
    cpuHistory,
    ramHistory,
    networkRxHistory,
    networkTxHistory,
    containers,
    diskMounts,
  ] = await Promise.all([
    // CPU usage %
    queryPrometheus('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
    // RAM total bytes
    queryPrometheus('node_memory_MemTotal_bytes'),
    // RAM used bytes
    queryPrometheus('node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes'),
    // Disk total bytes
    queryPrometheus('node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"}'),
    // Disk used bytes
    queryPrometheus('node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"} - node_filesystem_free_bytes{mountpoint="/",fstype!="tmpfs"}'),
    // Network RX rate
    queryPrometheus('sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))'),
    // Network TX rate
    queryPrometheus('sum(rate(node_network_transmit_bytes_total{device!="lo"}[5m]))'),
    // Histories
    queryPrometheusRange('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)', 60),
    queryPrometheusRange('(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100', 60),
    queryPrometheusRange('sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))', 60),
    queryPrometheusRange('sum(rate(node_network_transmit_bytes_total{device!="lo"}[5m]))', 60),
    // Docker containers
    queryPrometheusAll('container_memory_usage_bytes{name!=""}'),
    // Disk mounts
    queryPrometheusAll('node_filesystem_size_bytes{fstype!="tmpfs",fstype!="devtmpfs"}'),
  ])

  const ramPercent = ramTotal && ramUsed ? (ramUsed / ramTotal) * 100 : null
  const diskPercent = diskTotal && diskUsed ? (diskUsed / diskTotal) * 100 : null

  return NextResponse.json({
    cpu: { value: cpuUsage ? parseFloat(cpuUsage.toFixed(1)) : null, history: cpuHistory },
    ram: {
      percent: ramPercent ? parseFloat(ramPercent.toFixed(1)) : null,
      used: ramUsed,
      total: ramTotal,
      history: ramHistory,
    },
    disk: {
      percent: diskPercent ? parseFloat(diskPercent.toFixed(1)) : null,
      used: diskUsed,
      total: diskTotal,
      mounts: diskMounts,
    },
    network: {
      rx: networkRxRate,
      tx: networkTxRate,
      rxHistory: networkRxHistory,
      txHistory: networkTxHistory,
    },
    containers: containers.map(c => ({
      name: c.metric.name,
      memoryBytes: c.value,
    })),
    timestamp: new Date().toISOString(),
  })
}
