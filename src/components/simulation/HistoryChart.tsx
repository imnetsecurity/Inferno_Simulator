
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Stats } from '@/types/simulation';

interface HistoryChartProps {
  history: Stats['history'];
}

export function HistoryChart({ history }: HistoryChartProps) {
  if (!history || history.length < 2) {
    return null; // Don't render chart without enough data
  }

  const formatTime = (time: number) => {
    const day = Math.floor(time / 96) + 1;
    const hour = String(Math.floor((time % 96) / 4)).padStart(2, '0');
    return `D${day} ${hour}h`;
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Simulation History</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              fontSize={10}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
            />
            <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelClassName="font-bold"
              wrapperClassName="text-xs"
              labelFormatter={formatTime}
            />
            <Legend wrapperStyle={{fontSize: "10px"}} />
            <Line yAxisId="left" type="monotone" dataKey="fires" name="Fires" stroke="hsl(var(--accent))" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="casualties" name="Casualties" stroke="hsl(var(--destructive))" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="buildingsDestroyed" name="Destroyed" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
