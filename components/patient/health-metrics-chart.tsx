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

  // Check if this is a sleep start/end time metric (show time only, not date)
  const metricNameLower = (metricName || '').toLowerCase()
  const isTimeOnlyMetric = (
    metricNameLower.includes('sleep') && 
    (metricNameLower.includes('start time') || metricNameLower.includes('end time'))
  )
  
  // Check if this is a sleep duration metric (sleep time, deep sleep time, etc.)
  const isSleepDurationMetric = (
    metricNameLower.includes('sleep') && 
    metricNameLower.includes('time') && 
    !metricNameLower.includes('start') && 
    !metricNameLower.includes('end')
  )

  // Filter out invalid dates before formatting
  const validData = data.filter(item => {
    if (!item.date || !(item.date instanceof Date) || isNaN(item.date.getTime())) {
      console.warn('Invalid date in chart data:', item.date)
      return false
    }
    return true
  })

  // Format the data for the chart
  const formattedData = validData.map((item, index) => ({
    date: isTimeOnlyMetric 
      ? format(item.date, "HH:mm") // Time only for sleep start/end time
      : format(item.date, "MM/dd/yy"), // Date for other metrics
    originalDate: item.date, // Keep original date object for tooltip
    value: item.value,
    id: item.id || index, // Use unique ID for each point
    originalValue: item.originalValue, // Keep original value
    isTimeOnly: isTimeOnlyMetric, // Flag for tooltip formatting
    isSleepDuration: (item as any).isSleepDuration || false, // Flag for sleep duration metrics
  }))

  // Find min and max values for better tick calculation
  const values = validData.map((item) => item.value).filter(val => val != null && !isNaN(val))

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
      <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="id"
          stroke="#888888"
          fontSize={fontSize}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickCount={isTimeOnlyMetric ? 5 : 3}
          tickFormatter={(value, index) => formattedData[index]?.date || value}
        />
        <YAxis
          stroke="#888888"
          fontSize={fontSize}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (isTimeOnlyMetric) {
              // For sleep start/end time: format minutes since midnight as HH:mm
              const hours = Math.floor(value / 60)
              const minutes = Math.floor(value % 60)
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            }
            // For all other numbers, show 2 decimal places
            const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
            return numValue.toFixed(2)
          }}
          ticks={calculateTicks()}
          domain={[(minValue) => Math.floor(minValue * 0.95), (maxValue) => Math.ceil(maxValue * 1.05)]}
          width={isTimeOnlyMetric ? 40 : 25}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              let value = data.value // Get value directly from the data payload
              
              // Check if this is a sleep duration metric
              const isSleepDuration = data.isSleepDuration || isSleepDurationMetric
              
              // Format the display value properly
              let displayValue = value
              
              // If original value is an object (like blood pressure), format it nicely
              if (data.originalValue && typeof data.originalValue === 'object') {
                if (data.originalValue.systolic && data.originalValue.diastolic) {
                  // Blood pressure format
                  displayValue = `${data.originalValue.systolic}/${data.originalValue.diastolic}`
                } else if (data.originalValue.value !== undefined) {
                  // Object with value property - already converted to hours in chart data if sleep duration
                  displayValue = data.originalValue.value
                } else {
                  // Fallback to processed value
                  displayValue = value
                }
              } else {
                // For simple values, data.value is already in hours for sleep duration metrics
                // (converted in chart data preparation), so use it directly
                displayValue = data.value
              }
              
              // Format the display value (always show 2 decimal places, remove trailing zeros)
              if (typeof displayValue === 'number') {
                displayValue = displayValue.toFixed(2).replace(/\.?0+$/, '')
              } else if (typeof displayValue === 'string') {
                // Try to parse string numbers and format them
                const parsed = parseFloat(displayValue)
                if (!isNaN(parsed)) {
                  displayValue = parsed.toFixed(2).replace(/\.?0+$/, '')
                }
              }
              
              // Format date and time for tooltip
              const isTimeOnly = data.isTimeOnly || false
              let dateDisplay = ''
              let timeDisplay = ''
              
              if (data.originalDate instanceof Date) {
                try {
                  if (isTimeOnly) {
                    // For sleep start/end time: show only time (hh:mm) - no date
                    timeDisplay = formatInTimeZone(data.originalDate, userTimezone, 'HH:mm')
                    dateDisplay = '' // Don't show date at all
                  } else {
                    // For other metrics: show date and time
                    const dateStr = formatInTimeZone(data.originalDate, userTimezone, 'MMM dd, yyyy')
                    const timeStr = formatInTimeZone(data.originalDate, userTimezone, 'HH:mm:ss')
                    dateDisplay = dateStr
                    timeDisplay = timeStr
                  }
                } catch (e) {
                  // Fallback to locale string
                  if (isTimeOnly) {
                    timeDisplay = data.originalDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })
                    dateDisplay = '' // Don't show date
                  } else {
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
              } else if (isTimeOnly && data.date) {
                // Fallback: if originalDate is not available but we have formatted date, use it
                timeDisplay = data.date // This should already be "HH:mm" format
                dateDisplay = ''
              } else if (!isTimeOnly && data.date) {
                // Fallback for non-time-only metrics
                dateDisplay = data.date
              }
              
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className={isTimeOnly ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2"}>
                    {!isTimeOnly && (
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
                    )}
                    {isTimeOnly && (
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
                        <span className="font-bold text-xs">
                          {timeDisplay}
                        </span>
                      </div>
                    )}
                    {!isTimeOnly && (
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">{metricName}</span>
                        <span className="font-bold text-xs">
                          {displayValue}
                        </span>
                      </div>
                    )}
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
