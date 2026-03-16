'use client'

import { useEffect, useState, useCallback } from 'react'
import StatCard from '@/components/StatCard'
import MiniChart from '@/components/MiniChart'
import ContainerList from '@/components/ContainerList'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes > 1e12) return `${(bytes / 1e12).toFixed(1)}`
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)}`
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)}`
  return `${(bytes / 1e3).toFixed(0)}`
}

function bytesUnit(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes > 1e12) return 'TB'
  if (bytes > 1e9) return 'GB'
  if (bytes > 1e6) return 'MB'
  return 'KB'
}

function formatNetworkRate(bps: number): string {
  if (bps > 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`
  if (bps > 1e3) return `${(bps / 1e3).toFixed(1)} KB/s`
  return `${bps.toFixed(0)} B/s`
}

interface Metrics {
  cpu: { value: number | null; history: { time: string; value: number }[] }
  ram: { percent: number | null; used: number | null; total: number | null; history: { time: string; value: number }[] }
  disk: { percent: number | null; used: number | null; total: number | null; mounts: any[] }
  network: { rx: number | null; tx: number | null; rxHistory: { time: string; value: number }[]; txHistory: { time: string; value: number }[] }
  containers: { name: string; memoryBytes: number }[]
  timestamp: string
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [tick, setTick] = useState(0)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics', { cache: 'no-store' })
      const data = await res.json()
      setMetrics(data)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Failed to fetch metrics', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(() => {
      fetchMetrics()
      setTick(t => t + 1)
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const cpuColor = (metrics?.cpu.value ?? 0) > 80 ? '#ff4466' : (metrics?.cpu.value ?? 0) > 60 ? '#ffcc00' : '#00d4ff'
  const ramColor = (metrics?.ram.percent ?? 0) > 80 ? '#ff4466' : (metrics?.ram.percent ?? 0) > 60 ? '#ffcc00' : '#00ff88'
  const diskColor = (metrics?.disk.percent ?? 0) > 85 ? '#ff4466' : (metrics?.disk.percent ?? 0) > 70 ? '#ffcc00' : '#00d4ff'

  return (
    <div className="min-h-screen" style={{ background: '#080c10' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: '#1e2d3d', background: 'rgba(8,12,16,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
            <span className="font-mono font-semibold tracking-widest text-sm uppercase" style={{ color: '#00d4ff' }}>
              SRV<span style={{ color: '#4a6375' }}>::</span>MONITOR
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-mono" style={{ color: '#4a6375' }}>
              REFRESH <span style={{ color: '#00d4ff' }}>15s</span>
            </span>
            <span className="text-xs font-mono" style={{ color: '#4a6375' }}>
              LAST <span style={{ color: '#e2e8f0' }}>{lastUpdate || '—'}</span>
            </span>
            <button
              onClick={fetchMetrics}
              className="text-xs font-mono px-3 py-1.5 rounded transition-all"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
            >
              ↻ REFRESH
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="font-mono text-sm mb-2" style={{ color: '#00d4ff' }}>
                CONNECTING TO PROMETHEUS<span className="blink">_</span>
              </div>
              <div className="text-xs font-mono" style={{ color: '#4a6375' }}>fetching metrics...</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Section label */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4a6375' }}>// system overview</span>
              <div className="flex-1 h-px" style={{ background: '#1e2d3d' }} />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="CPU Usage"
                value={metrics?.cpu.value?.toFixed(1) ?? '—'}
                unit="%"
                percent={metrics?.cpu.value}
                color={cpuColor === '#ff4466' ? 'red' : cpuColor === '#ffcc00' ? 'yellow' : 'accent'}
                index={0}
              />
              <StatCard
                label="RAM Usage"
                value={formatBytes(metrics?.ram.used ?? null)}
                unit={bytesUnit(metrics?.ram.used ?? null)}
                percent={metrics?.ram.percent}
                sub={`of ${formatBytes(metrics?.ram.total ?? null)} ${bytesUnit(metrics?.ram.total ?? null)}`}
                color={ramColor === '#ff4466' ? 'red' : ramColor === '#ffcc00' ? 'yellow' : 'green'}
                index={1}
              />
              <StatCard
                label="Disk Usage"
                value={formatBytes(metrics?.disk.used ?? null)}
                unit={bytesUnit(metrics?.disk.used ?? null)}
                percent={metrics?.disk.percent}
                sub={`of ${formatBytes(metrics?.disk.total ?? null)} ${bytesUnit(metrics?.disk.total ?? null)}`}
                color={diskColor === '#ff4466' ? 'red' : diskColor === '#ffcc00' ? 'yellow' : 'accent'}
                index={2}
              />
              <StatCard
                label="Network RX"
                value={metrics?.network.rx ? formatNetworkRate(metrics.network.rx) : '—'}
                sub={`TX: ${metrics?.network.tx ? formatNetworkRate(metrics.network.tx) : '—'}`}
                color="green"
                index={3}
              />
            </div>

            {/* Section label */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4a6375' }}>// historical metrics (1h)</span>
              <div className="flex-1 h-px" style={{ background: '#1e2d3d' }} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MiniChart
                data={metrics?.cpu.history ?? []}
                label="CPU History"
                color="#00d4ff"
                unit="%"
                index={0}
              />
              <MiniChart
                data={metrics?.ram.history ?? []}
                label="RAM History"
                color="#00ff88"
                unit="%"
                index={1}
              />
              <MiniChart
                data={metrics?.network.rxHistory ?? []}
                label="Network RX"
                color="#ffcc00"
                unit=""
                index={2}
                formatter={formatNetworkRate}
              />
              <MiniChart
                data={metrics?.network.txHistory ?? []}
                label="Network TX"
                color="#ff4466"
                unit=""
                index={3}
                formatter={formatNetworkRate}
              />
            </div>

            {/* Section label */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4a6375' }}>// containers</span>
              <div className="flex-1 h-px" style={{ background: '#1e2d3d' }} />
            </div>

            {/* Containers */}
            <ContainerList containers={metrics?.containers ?? []} />

          </div>
        )}
      </main>
    </div>
  )
}
