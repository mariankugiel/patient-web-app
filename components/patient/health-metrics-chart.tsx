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

  // Filter out invalid dates first
  const validData = data.filter(item => {
    if (!item.date) return false
    const date = item.date instanceof Date ? item.date : new Date(item.date)
    return !isNaN(date.getTime())
  })

  // Determine date format based on data range
  const getDateFormat = () => {
    if (validData.length === 0) return "MM/dd/yy"
    
    const dates = validData.map(d => {
      const date = d.date instanceof Date ? d.date : new Date(d.date)
      return date.getTime()
    }).filter(time => !isNaN(time)).sort((a, b) => a - b)
    
    if (dates.length === 0) return "MM/dd/yy"
    
    const minDate = dates[0]
    const maxDate = dates[dates.length - 1]
    const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24)
    
    // If data spans more than 3 months, use month/year format
    if (daysDiff > 90) {
      return "MMM yy"
    }
    // If data spans more than 1 month, use month/day format
    else if (daysDiff > 30) {
      return "MM/dd"
    }
    // Otherwise use full date format
    else {
      return "MM/dd"
    }
  }

  const dateFormat = getDateFormat()

  // Format the data for the chart
  const formattedData = validData.map((item, index) => {
    const date = item.date instanceof Date ? item.date : new Date(item.date)
    return {
      date: format(date, dateFormat),
      dateObj: date, // Keep original date object for tooltip
      value: item.value,
      id: item.id || index, // Use unique ID for each point
      originalValue: item.originalValue, // Keep original value
    }
  })

  // Find min and max values for better tick calculation
  const values = formattedData.map((item) => item.value).filter(val => val != null && !isNaN(val))

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
          dataKey="date"
          stroke="#888888"
          fontSize={fontSize}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickCount={Math.min(3, formattedData.length)}
          angle={formattedData.length > 10 ? -45 : 0}
          textAnchor={formattedData.length > 10 ? "end" : "middle"}
          height={formattedData.length > 10 ? 50 : 30}
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
              
              // Format date-time for tooltip using user's timezone
              let dateTimeDisplay = data.date
              if (data.dateObj instanceof Date) {
                try {
                  const dateStr = formatInTimeZone(data.dateObj, userTimezone, 'MMM dd, yyyy')
                  const timeStr = formatInTimeZone(data.dateObj, userTimezone, 'HH:mm:ss')
                  dateTimeDisplay = `${dateStr}\n${timeStr}`
                } catch (e) {
                  // Fallback to locale string
                  dateTimeDisplay = data.dateObj.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
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
                      <span className="font-bold text-xs whitespace-pre-line">
                        {dateTimeDisplay}
                      </span>
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
