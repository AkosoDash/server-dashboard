import { queryPrometheus, queryPrometheusRange, queryPrometheusAll } from '@/lib/prometheus'

export const dynamic = 'force-dynamic'

async function collectMetrics() {
  const [
    cpuUsage, ramTotal, ramUsed, diskTotal, diskUsed,
    networkRxRate, networkTxRate, cpuHistory, ramHistory,
    networkRxHistory, networkTxHistory, containers,
  ] = await Promise.all([
    queryPrometheus('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
    queryPrometheus('node_memory_MemTotal_bytes'),
    queryPrometheus('node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes'),
    queryPrometheus('node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"}'),
    queryPrometheus('node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"} - node_filesystem_free_bytes{mountpoint="/",fstype!="tmpfs"}'),
    queryPrometheus('sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))'),
    queryPrometheus('sum(rate(node_network_transmit_bytes_total{device!="lo"}[5m]))'),
    queryPrometheusRange('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)', 60),
    queryPrometheusRange('(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100', 60),
    queryPrometheusRange('sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))', 60),
    queryPrometheusRange('sum(rate(node_network_transmit_bytes_total{device!="lo"}[5m]))', 60),
    queryPrometheusAll('container_memory_usage_bytes{name!=""}'),
  ])

  const ramPercent = ramTotal && ramUsed ? (ramUsed / ramTotal) * 100 : null
  const diskPercent = diskTotal && diskUsed ? (diskUsed / diskTotal) * 100 : null

  return {
    cpu: { value: cpuUsage ? parseFloat(cpuUsage.toFixed(1)) : null, history: cpuHistory },
    ram: { percent: ramPercent ? parseFloat(ramPercent.toFixed(1)) : null, used: ramUsed, total: ramTotal, history: ramHistory },
    disk: { percent: diskPercent ? parseFloat(diskPercent.toFixed(1)) : null, used: diskUsed, total: diskTotal },
    network: { rx: networkRxRate, tx: networkTxRate, rxHistory: networkRxHistory, txHistory: networkTxHistory },
    containers: containers.map(c => ({ name: c.metric.name, memoryBytes: c.value })),
    timestamp: new Date().toISOString(),
  }
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send immediately on connect
      try {
        const metrics = await collectMetrics()
        send(metrics)
      } catch (e) {
        send({ error: 'Failed to fetch metrics' })
      }

      // Then every 2 seconds
      const interval = setInterval(async () => {
        try {
          const metrics = await collectMetrics()
          send(metrics)
        } catch (e) {
          send({ error: 'Failed to fetch metrics' })
        }
      }, 2000)

      // Cleanup on disconnect
      const cleanup = () => clearInterval(interval)
      setTimeout(cleanup, 5 * 60 * 1000) // auto-close after 5 min, client reconnects
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
