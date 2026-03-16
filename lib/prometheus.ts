const PROMETHEUS_URL = process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'http://localhost:9090'

export async function queryPrometheus(query: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`,
      { next: { revalidate: 10 } }
    )
    const data = await res.json()
    const value = data?.data?.result?.[0]?.value?.[1]
    return value !== undefined ? parseFloat(value) : null
  } catch {
    return null
  }
}

export async function queryPrometheusRange(
  query: string,
  minutes: number = 60
): Promise<{ time: string; value: number }[]> {
  try {
    const end = Math.floor(Date.now() / 1000)
    const start = end - minutes * 60
    const step = Math.max(15, Math.floor((minutes * 60) / 60))

    const res = await fetch(
      `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`,
      { next: { revalidate: 15 } }
    )
    const data = await res.json()
    const values = data?.data?.result?.[0]?.values || []
    return values.map(([ts, val]: [number, string]) => ({
      time: new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: parseFloat(parseFloat(val).toFixed(2)),
    }))
  } catch {
    return []
  }
}

export async function queryPrometheusAll(query: string): Promise<{ metric: Record<string, string>; value: number }[]> {
  try {
    const res = await fetch(
      `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`,
      { next: { revalidate: 10 } }
    )
    const data = await res.json()
    return (data?.data?.result || []).map((r: any) => ({
      metric: r.metric,
      value: parseFloat(r.value?.[1] || '0'),
    }))
  } catch {
    return []
  }
}
