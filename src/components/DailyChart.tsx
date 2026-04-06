"use client";

import { useMemo } from "react";
import { PersonalExpense } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Props = {
  expenses: PersonalExpense[];
  daysInMonth: number;
  budgetTotal?: number;
};

export default function DailyChart({ expenses, daysInMonth, budgetTotal }: Props) {
  const { dark } = useTheme();

  const data = useMemo(() => {
    const dailyTotals: Record<number, number> = {};
    expenses.forEach((e) => {
      const day = parseInt(e.date.split("-")[2], 10);
      dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
    });

    const dailyPace = budgetTotal && budgetTotal > 0 ? budgetTotal / daysInMonth : undefined;

    let cumulative = 0;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      cumulative += dailyTotals[day] || 0;
      return {
        day,
        total: cumulative,
        ...(dailyPace !== undefined && { pace: dailyPace * day }),
      };
    });
  }, [expenses, daysInMonth, budgetTotal]);

  const textColor = dark ? "#9CA3AF" : "#64748B";
  const gridColor = dark ? "#374151" : "#E2E8F0";

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? "#1F2937" : "#FFFFFF",
              border: `1px solid ${gridColor}`,
              borderRadius: "0.75rem",
              fontSize: 12,
              color: dark ? "#F3F4F6" : "#0F172A",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [formatCurrency(Number(value)), "Acumulado"]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(label: any) => `Dia ${label}`}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#colorTotal)"
          />
          {budgetTotal && budgetTotal > 0 && (
            <Line
              type="linear"
              dataKey="pace"
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              name="Ritmo ideal"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
