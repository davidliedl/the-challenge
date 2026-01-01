"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { EXERCISE_CATALOG } from "~/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartLine,
  CalendarDays,
  Dumbbell,
  UserCheck,
  Trophy,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = [
  "#3498db",
  "#1abc9c",
  "#e74c3c",
  "#f1c40f",
  "#9b59b6",
  "#e67e22",
  "#2ecc71",
  "#34495e",
];

export function Dashboard({
  currentUser,
}: {
  currentUser: string;
  setCurrentUser: (name: string) => void;
}) {
  const [detailMode, setDetailMode] = useState<"year" | "month">("year");
  const [raceExercise, setRaceExercise] = useState<string>(
    EXERCISE_CATALOG[0]?.exercise || ""
  );
  const [raceMode, setRaceMode] = useState<"year" | "month">("year");

  const { data: stats, isLoading } = api.achievement.getStats.useQuery();

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const yearPacer = (dayOfYear / 365) * 100;

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const monthPacer = (dayOfMonth / daysInMonth) * 100;

  const chartData = useMemo(() => {
    if (!stats) return { year: [], month: [], exercise: [], race: [] };

    const yearData = stats.map((u) => {
      let totalPerc = 0;
      u.goals.forEach((g) => {
        const sum = u.achievements
          .filter((a) => a.exercise === g.exercise)
          .reduce((acc, a) => acc + a.value, 0);
        totalPerc += Math.min((sum / g.target) * 100, 100);
      });
      return {
        name: u.name,
        progress: u.goals.length ? (totalPerc / u.goals.length).toFixed(1) : 0,
      };
    });

    const monthData = stats.map((u) => {
      let totalPerc = 0;
      u.goals.forEach((g) => {
        const mTarget = g.target / 12;
        const mSum = u.achievements
          .filter((a) => {
            const d = new Date(a.date);
            return (
              a.exercise === g.exercise &&
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            );
          })
          .reduce((acc, a) => acc + a.value, 0);
        totalPerc += Math.min((mSum / mTarget) * 100, 100);
      });
      return {
        name: u.name,
        progress: u.goals.length ? (totalPerc / u.goals.length).toFixed(1) : 0,
      };
    });

    const exerciseTotals: Record<string, number> = {};
    stats.forEach((u) => {
      u.achievements.forEach((a) => {
        exerciseTotals[a.exercise] =
          (exerciseTotals[a.exercise] || 0) + a.value;
      });
    });

    const exerciseData = Object.entries(exerciseTotals).map(
      ([name, value]) => ({ name, value })
    );

    const raceResults = stats
      .filter((u) => u.goals.some((g) => g.exercise === raceExercise))
      .map((u) => {
        const goal = u.goals.find((g) => g.exercise === raceExercise)!;
        const target = raceMode === "year" ? goal.target : goal.target / 12;
        const sum = u.achievements
          .filter((a) => {
            if (a.exercise !== raceExercise) return false;
            if (raceMode === "month") {
              const d = new Date(a.date);
              return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
              );
            }
            return true;
          })
          .reduce((acc, a) => acc + a.value, 0);

        return {
          name: u.name,
          progress: parseFloat(((sum / target) * 100).toFixed(1)),
          absolute: sum.toFixed(0),
          unit: goal.unit,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    const racePacerVal = raceMode === "year" ? yearPacer : monthPacer;

    return {
      year: [
        { name: "Push (Pacer)", progress: yearPacer.toFixed(1) },
        ...yearData,
      ],
      month: [
        { name: "Push (Pacer)", progress: monthPacer.toFixed(1) },
        ...monthData,
      ],
      exercise: exerciseData,
      race: [
        {
          name: "Push (Pacer)",
          progress: parseFloat(racePacerVal.toFixed(1)),
          absolute: "",
          unit: "",
        },
        ...raceResults,
      ],
    };
  }, [stats, yearPacer, monthPacer, now, raceExercise, raceMode]);

  const selectedStats = stats?.find((u) => u.name === currentUser);

  if (isLoading)
    return (
      <div className="py-20 text-center font-medium text-slate-500">
        Daten werden geladen...
      </div>
    );

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="grid grid-cols-1 gap-8">
        {/* Year Progress */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <ChartLine className="text-blue-500" size={20} />
              Jahresfortschritt (max. 100%)
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pacer: Push
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.year}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  unit="%"
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                  {chartData.year.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Push (Pacer)"
                          ? "#94a3b8"
                          : entry.name === currentUser
                          ? "#3b82f6"
                          : "#e2e8f0"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Month progress */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800">
              <CalendarDays className="text-emerald-500" size={20} />
              Monatsziel (max. 100%)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.month}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: "12px", border: "none" }}
                  />
                  <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                    {chartData.month.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "Push (Pacer)"
                            ? "#94a3b8"
                            : entry.name === currentUser
                            ? "#10b981"
                            : "#e2e8f0"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rennen Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Trophy className="text-orange-500" size={20} />
                Rennen
              </h3>
              <div className="flex gap-2">
                <select
                  value={raceExercise}
                  onChange={(e) => setRaceExercise(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-slate-800"
                >
                  {EXERCISE_CATALOG.map((ex) => (
                    <option key={ex.exercise} value={ex.exercise}>
                      {ex.exercise}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    onClick={() => setRaceMode("year")}
                    className={cn(
                      "px-3 py-0.5 rounded-md text-xs font-bold transition-all",
                      raceMode === "year"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Jahr
                  </button>
                  <button
                    onClick={() => setRaceMode("month")}
                    className={cn(
                      "px-3 py-0.5 rounded-md text-xs font-bold transition-all",
                      raceMode === "month"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Monat
                  </button>
                </div>
              </div>
            </div>

            {chartData.race.length <= 1 ? (
              <div className="flex h-64 items-center justify-center text-sm font-medium text-slate-400">
                Keine Teilnehmer für diese Übung.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.race} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis type="number" hide domain={[0, "dataMax + 30"]} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border-none bg-white p-3 shadow-xl">
                              <p className="text-sm font-bold text-slate-800">
                                {data.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {data.progress}% (
                                {data.name === "Push (Pacer)"
                                  ? "Pacer"
                                  : `${data.absolute} ${data.unit}`}
                                )
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="progress"
                      radius={[0, 4, 4, 0]}
                      label={(props: any) => {
                        const { x, y, width, height, value, payload } = props;
                        if (!payload) return null;
                        const labelText =
                          payload.name === "Push (Pacer)"
                            ? `${value}%`
                            : `${value}% (${payload.absolute})`;
                        return (
                          <text
                            x={x + width + 5}
                            y={y + height / 2}
                            fill="#64748b"
                            fontSize={10}
                            textAnchor="start"
                            dominantBaseline="middle"
                          >
                            {labelText}
                          </text>
                        );
                      }}
                    >
                      {chartData.race.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === "Push (Pacer)"
                              ? "#94a3b8"
                              : entry.name === currentUser
                              ? "#f59e0b"
                              : "#e2e8f0"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Personal Detail */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <UserCheck className="text-indigo-500" size={20} />
              Dein Status: {currentUser}
            </h3>
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setDetailMode("year")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  detailMode === "year"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Jahr
              </button>
              <button
                onClick={() => setDetailMode("month")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  detailMode === "month"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Monat
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="mb-2 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100 italic text-slate-600">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span>Push (Pacer)</span>
                <span>
                  Soll:{" "}
                  {(detailMode === "year" ? yearPacer : monthPacer).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-slate-400 transition-all duration-1000"
                  style={{
                    width: `${detailMode === "year" ? yearPacer : monthPacer}%`,
                  }}
                />
              </div>
            </div>

            {selectedStats?.goals.map((g) => {
              const target = detailMode === "year" ? g.target : g.target / 12;
              const sum = selectedStats.achievements
                .filter((a) => {
                  if (a.exercise !== g.exercise) return false;
                  if (detailMode === "month") {
                    const d = new Date(a.date);
                    return (
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }
                  return true;
                })
                .reduce((acc, a) => acc + a.value, 0);

              const p = Math.min((sum / target) * 100, 100);
              const displayP = p.toFixed(1);

              return (
                <div
                  key={g.id}
                  className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="font-bold text-slate-800">{g.exercise}</h4>
                      <p className="text-sm text-slate-500">
                        {sum.toFixed(1)} / {target.toFixed(1)} {g.unit}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        p >= 100 ? "text-emerald-600" : "text-blue-600"
                      }`}
                    >
                      {displayP}%
                    </span>
                  </div>
                  <div className="w-full bg-white h-4 rounded-full border border-slate-200 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        p >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
