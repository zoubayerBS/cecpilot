
"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import type { CecFormValues } from "./schema"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"

const acidBaseChartConfig = {
  ph: { label: "pH", color: "hsl(var(--chart-1))" },
  paco2: { label: "PaCO2", color: "hsl(var(--chart-2))" },
  lactate: { label: "Lactate", color: "hsl(var(--chart-4))" },
  hco3: { label: "HCO3-", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

const electrolytesChartConfig = {
    k: { label: "K+", color: "hsl(var(--chart-6))" },
    na: { label: "Na+", color: "hsl(var(--chart-1))" },
    ca: { label: "Ca++", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig


const CustomChart = ({ data, config, title }: { data: any[], config: ChartConfig, title: string }) => (
    <div className="w-full">
        <h3 className="font-semibold text-center mb-2 text-muted-foreground">{title}</h3>
        <ChartContainer config={config} className="min-h-[200px] h-[200px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={['auto', 'auto']} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend />
                {Object.entries(config).map(([key, value]) => (
                    <Line
                        key={key}
                        dataKey={key}
                        type="monotone"
                        stroke={`var(--color-${key})`}
                        strokeWidth={2}
                        dot={true}
                        name={value.label}
                    />
                ))}
            </LineChart>
        </ChartContainer>
    </div>
);


export function BloodGasChart() {
  const { control } = useFormContext<CecFormValues>()
  const data = useWatch({
    control,
    name: "bloodGases",
  })

  const chartData = React.useMemo(() => {
    const bloodGasesData = Array.isArray(data) ? data : [];
    return bloodGasesData.filter(
      (d) => d && d.time
    ).map(d => ({
        ...d,
        name: d.time
    }))
  }, [data])

  if (chartData.length === 0) {
    return (
       <div className="text-center text-muted-foreground p-4 bg-muted/50 rounded-lg h-full flex items-center justify-center">
        Les graphiques des gaz du sang apparaîtront ici une fois que vous aurez saisi des données.
      </div>
    )
  }

  return (
    <div className="w-full h-full space-y-4 flex flex-col justify-center">
        <CustomChart data={chartData} config={acidBaseChartConfig} title="Paramètres Acido-Basiques" />
        <Separator />
        <CustomChart data={chartData} config={electrolytesChartConfig} title="Électrolytes" />
    </div>
  )
}
