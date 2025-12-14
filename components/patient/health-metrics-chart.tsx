"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

interface ChartOptions {
  fontSize?: number
  tickCount?: number
  roundValues?: boolean
  userTimezone?: string
}

interface HealthMetricsChartProps {
  data: Array<{
    date: Date
    value: number
    id?: number | string
    originalValue?: any
  }>
  metricName: string
  options?: ChartOptions
}

export function HealthMetricsChart({ data, metricName, options = {} }: HealthMetricsChartProps) {
  const { fontSize = 12, tickCount = 5, roundValues = false, userTimezone = 'UTC' } = options

  // Format the data for the chart - use timestamp for proper X-axis alignment
  const formattedData = data.map((item, index) => ({
    date: format(item.date, "MM/dd/yy"),
    timestamp: item.date.getTime(), // Use timestamp for X-axis alignment
    originalDate: item.date, // Keep original date object for tooltip
    value: item.value,
    index: index, // Keep index for reference
    id: item.id || index, // Use unique ID for each point
    originalValue: item.originalValue, // Keep original value
  }))
  
  // Calculate domain for X-axis to ensure first and last dates are visible
  const minTimestamp = formattedData.length > 0 ? formattedData[0].timestamp : 0
  const maxTimestamp = formattedData.length > 0 ? formattedData[formattedData.length - 1].timestamp : 0
  
  // Calculate custom ticks to ensure first and last dates are always shown
  const calculateDateTicks = () => {
    if (formattedData.length === 0) return []
    if (formattedData.length === 1) return [formattedData[0].timestamp]
    if (formattedData.length <= 5) {
      // Show all dates if 5 or fewer
      return formattedData.map(d => d.timestamp)
    }
    // Show first, last, and evenly distributed middle dates
    const ticks = [formattedData[0].timestamp] // First
    const tickCount = 5
    const step = Math.floor((formattedData.length - 1) / (tickCount - 1))
    for (let i = step; i < formattedData.length - 1; i += step) {
      ticks.push(formattedData[i].timestamp)
    }
    ticks.push(formattedData[formattedData.length - 1].timestamp) // Last
    return ticks
  }
  
  const dateTicks = calculateDateTicks()

  // Find min and max values for better tick calculation
  const values = data.map((item) => item.value).filter(val => val != null && !isNaN(val))

  if (values.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-gray-500">
        No data to display
      </div>
    )
  }

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
      <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 30, left: 5 }}>
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="linear"
          domain={[minTimestamp, maxTimestamp]}
          stroke="#888888"
          fontSize={fontSize}
          tickLine={false}
          axisLine={false}
          ticks={dateTicks}
          tickFormatter={(timestamp) => {
            // Find the exact data point for this timestamp
            const dataPoint = formattedData.find(d => d.timestamp === timestamp)
            if (dataPoint) {
              return dataPoint.date
            }
            // Fallback: format the timestamp directly
            try {
              return format(new Date(timestamp), "MM/dd/yy")
            } catch {
              return ''
            }
          }}
          angle={-45}
          textAnchor="end"
          height={60}
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
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              const value = data.value // Get value directly from the data payload
              
              // Format the display value properly
              let displayValue = value
              
              // If original value is an object (like blood pressure), format it nicely
              if (data.originalValue && typeof data.originalValue === 'object') {
                if (data.originalValue.systolic && data.originalValue.diastolic) {
                  // Blood pressure format
                  displayValue = `${data.originalValue.systolic}/${data.originalValue.diastolic}`
                } else if (data.originalValue.value !== undefined) {
                  // Object with value property
                  displayValue = data.originalValue.value
                } else {
                  // Fallback to processed value
                  displayValue = value
                }
              } else if (data.originalValue && typeof data.originalValue === 'string') {
                // If original was a string, use it
                displayValue = data.originalValue
              }
              
              // Format date and time for tooltip
              let dateDisplay = data.date
              let timeDisplay = ''
              
              if (data.originalDate instanceof Date) {
                try {
                  const dateStr = formatInTimeZone(data.originalDate, userTimezone, 'MMM dd, yyyy')
                  const timeStr = formatInTimeZone(data.originalDate, userTimezone, 'HH:mm:ss')
                  dateDisplay = dateStr
                  timeDisplay = timeStr
                } catch (e) {
                  // Fallback to locale string
                  dateDisplay = data.originalDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                  timeDisplay = data.originalDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })
                }
              }
              
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                      <span className="font-bold text-xs">
                        {dateDisplay}
                      </span>
                      {timeDisplay && (
                        <span className="text-[0.70rem] text-muted-foreground">
                          {timeDisplay}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">{metricName}</span>
                      <span className="font-bold text-xs">
                        {displayValue}
                      </span>
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
