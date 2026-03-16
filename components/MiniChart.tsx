'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface MiniChartProps {
  data: { time: string; value: number }[]
  label: string
  color?: string
  unit?: string
  index?: number
  formatter?: (val: number) => string
}

export default function MiniChart({ data, label, color = '#00d4ff', unit = '%', index = 0, formatter }: MiniChartProps) {
  const latest = data[data.length - 1]?.value ?? 0

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#4a6375' }}>{label}</span>
        <span className="value-display text-sm" style={{ color }}>
          {formatter ? formatter(latest) : `${latest.toFixed(1)}${unit}`}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 4, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            labelStyle={{ color: '#4a6375' }}
            itemStyle={{ color }}
            formatter={(val: number) => [formatter ? formatter(val) : `${val.toFixed(2)}${unit}`, '']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${label})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
