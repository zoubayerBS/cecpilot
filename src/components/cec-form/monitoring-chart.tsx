"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceArea, ReferenceLine, Label, Brush, ResponsiveContainer } from "recharts"
import type { CecFormValues } from "./schema"
import type { TimelineEvent } from "./schema"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  pression_systolique: {
    label: "PAS",
    color: "red",
  },
  pression_diastolique: {
    label: "PAD",
    color: "blue",
  },
  pam: {
    label: "PAM",
    color: "hsl(var(--chart-6))",
  },
  fc: {
    label: "FC",
    color: "green",
  },
  spo2: {
    label: "SpO2",
    color: "lightblue",
  },
} satisfies ChartConfig

export function MonitoringChart() {
  const { control } = useFormContext<CecFormValues>()
  const data = useWatch({
    control,
    name: "hemodynamicMonitoring",
  })
  const timelineEvents = useWatch({
    control,
    name: "timelineEvents",
  })

  const chartData = React.useMemo(() => {
    const monitoringData = Array.isArray(data) ? data : [];
    return monitoringData.filter(
      (d) =>
        d && d.time &&
        (d.pression_systolique || d.pression_diastolique || d.pam || d.fc || d.spo2)
    )
  }, [data])

  // Process timeline events for chart
  const eventLines = React.useMemo(() => {
    if (!timelineEvents || !Array.isArray(timelineEvents)) return [];
    return timelineEvents.filter(e => e.time && ['Départ CEC', 'Clampage', 'Déclampage', 'Fin CEC'].includes(e.type));
  }, [timelineEvents]);

  if (chartData.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 bg-muted/50 rounded-lg h-48 flex items-center justify-center">
        Le graphique apparaîtra ici une fois que vous aurez saisi des données de surveillance.
      </div>
    )
  }

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="min-h-[350px] h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 20,
              bottom: 20
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            {/* Target Zone for PAM (50-80) */}
            <ReferenceArea
              y1={50}
              y2={80}
              fill="#22c55e"
              fillOpacity={0.1}
              ifOverflow="extendDomain"
            >
              <Label value="Cible PAM" position="insideTopLeft" fill="#22c55e" fontSize={10} className="opacity-50" />
            </ReferenceArea>
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={['auto', 'auto']}
            />
            <ChartTooltip cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} content={<ChartTooltipContent />} />
            <Legend verticalAlign="top" height={36} />

            {/* Event Lines */}
            {eventLines.map((event, index) => {
              let color = 'var(--muted-foreground)';
              if (event.type === 'Départ CEC') color = '#10b981'; // emerald-500
              if (event.type === 'Clampage') color = '#f97316'; // orange-500
              if (event.type === 'Déclampage') color = '#3b82f6'; // blue-500
              if (event.type === 'Fin CEC') color = '#ef4444'; // red-500

              return (
                <ReferenceLine
                  key={event.id || index}
                  x={event.time}
                  stroke={color}
                  strokeDasharray="3 3"
                  label={{ value: event.type, position: 'insideTopRight', fill: color, fontSize: 10, angle: -90, dx: 10 }}
                />
              );
            })}

            <Line
              dataKey="pression_systolique"
              type="monotone"
              stroke="var(--color-pression_systolique)"
              strokeWidth={1.5}
              dot={false}
              name="PAS"
              connectNulls
            />
            <Line
              dataKey="pression_diastolique"
              type="monotone"
              stroke="var(--color-pression_diastolique)"
              strokeWidth={1.5}
              dot={false}
              name="PAD"
              connectNulls
            />
            <Line
              dataKey="pam"
              type="monotone"
              stroke="var(--color-pam)"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="PAM"
              connectNulls
            />
            <Line
              dataKey="fc"
              type="monotone"
              stroke="var(--color-fc)"
              strokeWidth={1.5}
              dot={false}
              name="FC"
              connectNulls
            />
            <Line
              dataKey="spo2"
              type="monotone"
              stroke="var(--color-spo2)"
              strokeWidth={1.5}
              dot={false}
              name="SpO2"
              connectNulls
            />

            <Brush
              dataKey="time"
              height={30}
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--card))"
            />

          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
