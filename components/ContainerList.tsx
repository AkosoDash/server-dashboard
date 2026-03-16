'use client'

interface Container {
  name: string
  memoryBytes: number
}

function formatBytes(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${(bytes / 1e3).toFixed(0)} KB`
}

export default function ContainerList({ containers }: { containers: Container[] }) {
  const sorted = [...containers].sort((a, b) => b.memoryBytes - a.memoryBytes)
  const max = sorted[0]?.memoryBytes || 1

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: '320ms' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4a6375' }}>Docker Containers</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff' }}>
          {containers.length} running
        </span>
      </div>
      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-xs font-mono" style={{ color: '#4a6375' }}>No container data available</p>
        )}
        {sorted.map((c, i) => (
          <div key={c.name} className="animate-in" style={{ animationDelay: `${(i + 4) * 60}ms` }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono truncate max-w-[200px]" style={{ color: '#e2e8f0' }}>
                {c.name}
              </span>
              <span className="text-xs font-mono" style={{ color: '#00ff88' }}>
                {formatBytes(c.memoryBytes)}
              </span>
            </div>
            <div className="h-0.5 rounded-full" style={{ background: 'rgba(0,255,136,0.1)' }}>
              <div
                className="h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: `${(c.memoryBytes / max) * 100}%`,
                  background: '#00ff88',
                  boxShadow: '0 0 6px #00ff88',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
