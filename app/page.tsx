'use client'

import { useEffect, useState } from 'react'
import TopChart from '@/components/TopChart'
import DiskList from '@/components/DiskList'
import TempPanel from '@/components/TempPanel'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '0'
  if (bytes > 1e12) return `${(bytes / 1e12).toFixed(2)} TB`
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${(bytes / 1e3).toFixed(0)} KB`
}

function formatNetworkRate(bps: number): string {
  if (bps > 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`
  if (bps > 1e3) return `${(bps / 1e3).toFixed(1)} Kbps`
  return `${bps.toFixed(0)} bps`
}

interface Metrics {
  cpu: { value: number | null; history: { time: string; value: number }[] }
  ram: { percent: number | null; used: number | null; total: number | null; history: { time: string; value: number }[] }
  network: { rx: number | null; tx: number | null; rxHistory: { time: string; value: number }[]; txHistory: { time: string; value: number }[] }
  disks: { device: string; mountpoint: string; size: number; used: number; percent: number; readRate: number; writeRate: number }[]
  containers: { name: string; memoryBytes: number }[]
  temps: { chip: string; sensor: string; value: number }[]
  timestamp: string
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let es: EventSource

    const connect = () => {
      es = new EventSource('/api/metrics-stream')
      es.onopen = () => setConnected(true)
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (!data.error) {
            setMetrics(data)
            setLastUpdate(new Date().toLocaleTimeString())
            setLoading(false)
          }
        } catch {}
      }
      es.onerror = () => {
        setConnected(false)
        es.close()
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => es?.close()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e2e8f0' }}>
      {/* Header */}
      <header style={{ background: '#12172a', borderBottom: '1px solid #2a3350', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#00ff88' : '#ff4466',
            boxShadow: `0 0 8px ${connected ? '#00ff88' : '#ff4466'}`,
          }} />
          <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: 14, color: '#4a9eff', letterSpacing: 2 }}>
            SERVER MONITOR
          </span>
          <span style={{
            fontSize: 10, fontFamily: 'IBM Plex Mono', padding: '2px 8px', borderRadius: 4,
            background: connected ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,102,0.1)',
            color: connected ? '#00ff88' : '#ff4466',
          }}>
            {connected ? '● LIVE' : '○ RECONNECTING'}
          </span>
        </div>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#4a5568' }}>
          Updated: <span style={{ color: '#8899bb' }}>{lastUpdate || '—'}</span>
        </span>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'IBM Plex Mono', color: '#4a9eff', fontSize: 14, marginBottom: 8 }}>
                CONNECTING TO PROMETHEUS...
              </div>
              <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'IBM Plex Mono' }}>opening stream</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top row: 3 charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <TopChart
                data={metrics?.cpu.history ?? []}
                label="CPU Usage"
                color="#4a9eff"
                unit="%"
                currentValue={`${metrics?.cpu.value?.toFixed(0) ?? 0}%`}
              />
              <TopChart
                data={metrics?.ram.history ?? []}
                label="Memory Usage"
                color="#4a9eff"
                unit="%"
                currentValue={`Used: ${formatBytes(metrics?.ram.used ?? null)} / ${formatBytes(metrics?.ram.total ?? null)}`}
              />
              <TopChart
                data={metrics?.network.txHistory ?? []}
                data2={metrics?.network.rxHistory ?? []}
                label="Upload"
                label2="Download"
                color="#4a9eff"
                color2="#ff6b9d"
                unit=""
                formatter={formatNetworkRate}
                currentValue={metrics?.network.tx ? `(${formatNetworkRate(metrics.network.tx)})` : ''}
                currentValue2={metrics?.network.rx ? `(${formatNetworkRate(metrics.network.rx)})` : ''}
              />
            </div>

            {/* Bottom row: temp + disk */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
              <TempPanel temps={metrics?.temps ?? []} />
              <DiskList disks={metrics?.disks ?? []} />
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
