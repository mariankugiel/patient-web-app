"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format } from "date-fns"

interface BloodPressureChartProps {
  data: Array<{
    date: Date
    systolic: number
    diastolic: number
  }>
}

export function BloodPressureChart({ data }: BloodPressureChartProps) {
  const formattedData = data.map((item) => ({
    date: format(item.date, "MMM d"),
    systolic: item.systolic,
    diastolic: item.diastolic,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[60, 180]} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <p className="text-xs font-medium">{label}</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs">Systolic: {payload[0]?.value}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">Diastolic: {payload[1]?.value}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Systolic" />
        <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="Diastolic" />
      </LineChart>
    </ResponsiveContainer>
  )
}
