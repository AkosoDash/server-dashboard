'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TopChartProps {
  data: { time: string; value: number }[]
  data2?: { time: string; value: number }[]
  label: string
  label2?: string
  color?: string
  color2?: string
  unit?: string
  formatter?: (val: number) => string
  currentValue?: string
  currentValue2?: string
}

export default function TopChart({
  data, data2, label, label2, color = '#4a9eff', color2 = '#ff6b9d',
  unit = '%', formatter, currentValue, currentValue2
}: TopChartProps) {

  const merged = data.map((d, i) => ({
    time: d.time,
    v1: d.value,
    ...(data2 ? { v2: data2[i]?.value ?? 0 } : {}),
  }))

  const fmt = (val: number) => formatter ? formatter(val) : `${val.toFixed(1)}${unit}`

  return (
    <div style={{ background: '#1a1f2e', border: '1px solid #2a3350', borderRadius: 8, padding: '16px' }}>
      <div className="text-center mb-3">
        <span style={{ color: '#8899bb', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>{label}</span>
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-6 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5" style={{ background: color }} />
          <span style={{ color: '#8899bb', fontSize: 11 }}>{label} {currentValue ? `${currentValue}` : ''}</span>
        </div>
        {data2 && label2 && (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5" style={{ background: color2 }} />
            <span style={{ color: '#8899bb', fontSize: 11 }}>{label2} {currentValue2 ? `${currentValue2}` : ''}</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={merged} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`g1-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
            {data2 && (
              <linearGradient id={`g2-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color2} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color2} stopOpacity={0.02} />
              </linearGradient>
            )}
          </defs>
          <XAxis dataKey="time" tick={{ fill: '#4a5568', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{ background: '#0d1117', border: '1px solid #2a3350', borderRadius: 4, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            labelStyle={{ color: '#8899bb' }}
            formatter={(val: number, name: string) => [fmt(val), name === 'v1' ? label : label2 || '']}
          />
          <Area type="monotone" dataKey="v1" stroke={color} strokeWidth={1.5} fill={`url(#g1-${label})`} dot={false} isAnimationActive={false} />
          {data2 && <Area type="monotone" dataKey="v2" stroke={color2} strokeWidth={1.5} fill={`url(#g2-${label})`} dot={false} isAnimationActive={false} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
