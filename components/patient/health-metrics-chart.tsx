"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format } from "date-fns"

interface ChartOptions {
  fontSize?: number
  tickCount?: number
  roundValues?: boolean
}

interface HealthMetricsChartProps {
  data: Array<{
    date: Date
    value: number
  }>
  metricName: string
  options?: ChartOptions
}

export function HealthMetricsChart({ data, metricName, options = {} }: HealthMetricsChartProps) {
  const { fontSize = 12, tickCount = 5, roundValues = false } = options

  // Format the data for the chart
  const formattedData = data.map((item) => ({
    date: format(item.date, "MMM d"),
    value: item.value,
  }))

  // Find min and max values for better tick calculation
  const values = data.map((item) => item.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  // Calculate nice round ticks if roundValues is true
  const calculateTicks = () => {
    if (!roundValues || tickCount <= 1) return undefined

    const range = maxValue - minValue
    const roughStep = range / (tickCount - 1)

    // Round to a nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const normalizedStep = roughStep / magnitude

    let step
    if (normalizedStep < 1.5) step = 1
    else if (normalizedStep < 3) step = 2
    else if (normalizedStep < 7) step = 5
    else step = 10

    step *= magnitude

    // Calculate ticks
    const minTick = Math.floor(minValue / step) * step
    const ticks = []
    for (let i = 0; i < tickCount; i++) {
      const tick = minTick + i * step
      if (tick > maxValue) break
      ticks.push(tick)
    }

    return ticks
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={fontSize}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickCount={3}
        />
        <YAxis
          stroke="#888888"
          fontSize={fontSize}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${roundValues ? Math.round(value) : value}`}
          ticks={calculateTicks()}
          domain={[(minValue) => Math.floor(minValue * 0.95), (maxValue) => Math.ceil(maxValue * 1.05)]}
          width={25}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                      <span className="font-bold text-xs">{payload[0].payload.date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">{metricName}</span>
                      <span className="font-bold text-xs">{payload[0].value}</span>
                    </div>
                  </div>
                </div>
              )
            }

            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0ea5e9"
          strokeWidth={2}
          activeDot={{
            r: 4,
            style: { fill: "#0ea5e9", opacity: 0.8 },
          }}
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
