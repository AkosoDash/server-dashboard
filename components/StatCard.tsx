'use client'

interface StatCardProps {
  label: string
  value: string | null
  unit?: string
  percent?: number | null
  sub?: string
  color?: 'accent' | 'green' | 'yellow' | 'red'
  index?: number
}

const colorMap = {
  accent: { text: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)', track: 'rgba(0,212,255,0.15)' },
  green:  { text: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.2)', track: 'rgba(0,255,136,0.15)' },
  yellow: { text: '#ffcc00', bg: 'rgba(255,204,0,0.08)',  border: 'rgba(255,204,0,0.2)',  track: 'rgba(255,204,0,0.15)' },
  red:    { text: '#ff4466', bg: 'rgba(255,68,102,0.08)', border: 'rgba(255,68,102,0.2)', track: 'rgba(255,68,102,0.15)' },
}

export default function StatCard({ label, value, unit, percent, sub, color = 'accent', index = 0 }: StatCardProps) {
  const c = colorMap[color]
  const isHigh = percent !== null && percent !== undefined && percent > 80

  return (
    <div
      className="card p-5 animate-in"
      style={{
        animationDelay: `${index * 80}ms`,
        borderColor: isHigh ? colorMap.red.border : c.border,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4a6375' }}>
          {label}
        </span>
        {percent !== null && percent !== undefined && (
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: c.bg, color: c.text }}>
            {percent.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="mb-3">
        <span className="value-display text-3xl" style={{ color: isHigh ? colorMap.red.text : c.text }}>
          {value ?? '—'}
        </span>
        {unit && <span className="text-sm ml-1.5" style={{ color: '#4a6375' }}>{unit}</span>}
      </div>

      {percent !== null && percent !== undefined && (
        <div className="mt-3">
          <div className="h-1 rounded-full" style={{ background: c.track }}>
            <div
              className="h-1 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(percent, 100)}%`,
                background: isHigh ? colorMap.red.text : c.text,
                boxShadow: `0 0 8px ${isHigh ? colorMap.red.text : c.text}`,
              }}
            />
          </div>
        </div>
      )}

      {sub && (
        <p className="text-xs mt-2 font-mono" style={{ color: '#4a6375' }}>{sub}</p>
      )}
    </div>
  )
}
