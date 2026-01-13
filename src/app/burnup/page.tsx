"use client";

import { useMemo, useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { UserGate } from "~/components/UserGate";
import { EXERCISE_CATALOG } from "~/constants";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LEVEL_COLORS = {
  S: "#babab9ff",
  M: "#62d0e1ff",
  L: "#fbbf24",
  XL: "#b11797ff",
};

export default function BurnupPage() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>(
    EXERCISE_CATALOG[0].exercise
  );

  const { data: stats, isLoading } = api.achievement.getStats.useQuery();

  useEffect(() => {
    const savedUser = localStorage.getItem("push_challenge_user");
    if (savedUser) setCurrentUser(savedUser);
    setIsLoaded(true);
  }, []);

  const chartData = useMemo(() => {
    if (!stats || !selectedExercise) return [];

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create array of days from Jan 1 to today
    const days = Array.from({ length: dayOfYear + 1 }, (_, i) => {
      const d = new Date(startOfYear);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split("T")[0],
        displayDate: d.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
        }),
        timestamp: d.getTime(),
      };
    });

    // Calculate cumulative values for each user
    const usersData = stats
      .filter((u) => u.goals.some((g) => g.exercise === selectedExercise))
      .map((u) => {
        const goal = u.goals.find((g) => g.exercise === selectedExercise)!;
        const catalogInfo = EXERCISE_CATALOG.find(
          (e) => e.exercise === selectedExercise
        );
        let level: "S" | "M" | "L" | "XL" = "S";
        if (catalogInfo) {
          if (goal.target >= catalogInfo.XL * 12) level = "XL";
          else if (goal.target >= catalogInfo.L * 12) level = "L";
          else if (goal.target >= catalogInfo.M * 12) level = "M";
        }

        const achievements = u.achievements
          .filter((a) => a.exercise === selectedExercise)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        let cumulative = 0;
        const userSeries: Record<string, number> = {};

        // Fill data for every day
        let achIndex = 0;
        days.forEach((day) => {
          // Add up all achievements on or before this day
          // Optimization: since achievements are sorted, we can continue from last index
          while (achIndex < achievements.length) {
            const achDate = new Date(achievements[achIndex].date).setHours(
              0,
              0,
              0,
              0
            );
            const currentDayDate = new Date(day.date).setHours(0, 0, 0, 0);

            if (achDate <= currentDayDate) {
              cumulative += achievements[achIndex].value;
              achIndex++;
            } else {
              break;
            }
          }
          userSeries[day.date!] = cumulative;
        });

        return {
          name: u.name,
          color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
          level,
          initials: u.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2),
          data: userSeries,
        };
      });

    // Format for Recharts: Array of objects { date: '...', user1: 100, user2: 120, ... }
    return days.map((day) => {
      const point: any = {
        name: day.displayDate,
        date: day.date,
      };
      usersData.forEach((u) => {
        point[u.name] = u.data[day.date!] || 0;
      });
      return point;
    });
  }, [stats, selectedExercise]);

  const usersList = useMemo(() => {
    if (!stats) return [];
    return stats
      .filter((u) => u.goals.some((g) => g.exercise === selectedExercise))
      .map((u) => {
        const goal = u.goals.find((g) => g.exercise === selectedExercise)!;
        const catalogInfo = EXERCISE_CATALOG.find(
          (e) => e.exercise === selectedExercise
        );
        let level: "S" | "M" | "L" | "XL" = "S";
        if (catalogInfo) {
          if (goal.target >= catalogInfo.XL * 12) level = "XL";
          else if (goal.target >= catalogInfo.L * 12) level = "L";
          else if (goal.target >= catalogInfo.M * 12) level = "M";
        }
        return {
          name: u.name,
          level,
          color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS],
          initials: u.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase(),
        };
      });
  }, [stats, selectedExercise]);

  if (!isLoaded) return null;
  if (!currentUser) {
    return (
      <UserGate
        onSelect={(name) => {
          setCurrentUser(name);
          localStorage.setItem("push_challenge_user", name);
        }}
      />
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Sort payload by value desc
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

      return (
        <div className="bg-slate-800 text-white text-[10px] font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700">
          <p className="mb-2 text-slate-400">{label}</p>
          <div className="flex flex-col gap-1">
            {sortedPayload.map((entry: any) => {
              const user = usersList.find((u) => u.name === entry.name);
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="flex-1 text-xs">{entry.name}</span>
                  <span className="font-mono text-slate-300">
                    {entry.value.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, stroke, payload, value } = props;
    // We need to identify which user this dot belongs to.
    // Recharts passes `dataKey` which corresponds to the user name in our structure.
    const userName = props.dataKey;
    const user = usersList.find((u) => u.name === userName);

    if (!user) return <circle cx={cx} cy={cy} r={4} fill={stroke} />;

    // Only show dot on hover or selection logic if complex,
    // but standard Recharts behavior is to show dots on line points.
    // If points are too dense, chart might look cluttered.
    // Let's render small dots, and maybe customized ones on active/hover?
    // Actually, user asked for "circles in a similar way as in the race view".
    // Race view has avatars. Rendering full avatars on every data point will be too heavy (365 points).
    // We should probably only render the dot at the *end* of the line (current status)
    // OR maybe reduce dot frequency.
    // BUT for "Burnup", points usually represent milestones.
    // Let's create a specialized localized dot that looks like the avatar but smaller (radius 4-6).
    // Since `CustomDot` is called for every point, we should check if it's the last point?
    // Or simply style the default dot to be a colored circle.

    // Let's try rendering a simple colored circle with a white border, matching the race aesthetic simplified.

    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={user.color}
        stroke="white"
        strokeWidth={2}
        className="transition-all hover:r-8"
      />
    );
  };

  // Custom Active Dot (on Hover) - this can be the full avatar!
  const CustomActiveDot = (props: any) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    const user = usersList.find((u) => u.name === dataKey);

    if (!user) return null;

    return (
      <g>
        <foreignObject x={cx - 16} y={cy - 16} width={32} height={32}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ring-4 ring-white outline outline-2 outline-slate-800 shadow-xl"
            style={{ backgroundColor: user.color, color: "white" }}
          >
            {user.initials}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-800 tracking-tighter uppercase">
            <TrendingUp className="text-amber-500 w-8 h-8" />
            BURNUP
          </h1>
          <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">
            Fortschritt über die Zeit
          </p>
        </div>

        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="px-5 py-3 rounded-2xl bg-slate-50 border-none font-black text-slate-800 focus:ring-2 focus:ring-amber-500 cursor-pointer hover:bg-slate-100 transition-colors"
        >
          {EXERCISE_CATALOG.map((ex) => (
            <option key={ex.exercise} value={ex.exercise}>
              {ex.exercise}
            </option>
          ))}
        </select>
      </header>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 min-h-[500px]">
        {chartData.length > 0 ? (
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {usersList.map((user) => (
                  <Line
                    key={user.name}
                    type="monotone"
                    dataKey={user.name} // Maps to the cumulative value in data point
                    stroke={user.color}
                    strokeWidth={3}
                    dot={<CustomDot />}
                    activeDot={<CustomActiveDot />}
                    animationDuration={1500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
            <TrendingUp size={48} className="mb-4 opacity-50" />
            <p className="font-black uppercase tracking-widest">
              Keine Daten verfügbar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
