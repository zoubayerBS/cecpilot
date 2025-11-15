"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import type { CecFormValues } from "./schema"
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

  const chartData = React.useMemo(() => {
    const monitoringData = Array.isArray(data) ? data : [];
    return monitoringData.filter(
      (d) =>
        d && d.time &&
        (d.pression_systolique || d.pression_diastolique || d.pam || d.fc || d.spo2)
    )
  }, [data])

  if (chartData.length === 0) {
    return (
       <div className="text-center text-muted-foreground p-4 bg-muted/50 rounded-lg h-48 flex items-center justify-center">
        Le graphique apparaîtra ici une fois que vous aurez saisi des données de surveillance.
      </div>
    )
  }

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="min-h-[250px] h-[250px] w-full">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={['auto', 'auto']}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Legend />
          <Line
            dataKey="pression_systolique"
            type="monotone"
            stroke="var(--color-pression_systolique)"
            strokeWidth={2}
            dot={true}
            name="PAS"
          />
           <Line
            dataKey="pression_diastolique"
            type="monotone"
            stroke="var(--color-pression_diastolique)"
            strokeWidth={2}
            dot={true}
            name="PAD"
          />
          <Line
            dataKey="pam"
            type="monotone"
            stroke="var(--color-pam)"
            strokeWidth={2}
            dot={true}
            name="PAM"
          />
          <Line
            dataKey="fc"
            type="monotone"
            stroke="var(--color-fc)"
            strokeWidth={2}
            dot={true}
            name="FC"
          />
          <Line
            dataKey="spo2"
            type="monotone"
            stroke="var(--color-spo2)"
            strokeWidth={2}
            dot={true}
            name="SpO2"
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
