"use client";

import { useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { api } from "~/trpc/react";
import { EXERCISE_CATALOG } from "~/constants";
import { DashboardOverview } from "./DashboardOverview";
import { ProgressLog } from "./ProgressLog";
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
  ListChecks,
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
  setCurrentUser,
}: {
  currentUser: string;
  setCurrentUser: (name: string) => void;
}) {
  const [raceMode, setRaceMode] = useLocalStorage<"year" | "month">(
    "push_race_mode",
    "month"
  );
  const [filterMyDisciplines, setFilterMyDisciplines] = useLocalStorage(
    "push_race_filter_my_disciplines",
    true
  );
  const [displayMode, setDisplayMode] = useLocalStorage<
    "relative" | "absolute"
  >("push_race_display_mode", "relative");
  const [activeTab, setActiveTab] = useState<"race" | "overview" | "log">(
    "race"
  );

  const [activeTooltip, setActiveTooltip] = useState<{
    id: string; // exercise + name or exercise + lvl
    type: "user" | "pacer";
  } | null>(null);

  // Clear tooltips on global click/touch
  useEffect(() => {
    const handleClick = () => setActiveTooltip(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const { data: stats, isLoading } = api.achievement.getStats.useQuery();

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const yearPacer = dayOfYear / 365;

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const monthPacer = dayOfMonth / daysInMonth;

  const pacerPercent = raceMode === "year" ? yearPacer : monthPacer;

  const LEVEL_COLORS = {
    S: "#babab9ff", // Rose 500
    M: "#62d0e1ff", // Cyan 400
    L: "#fbbf24", // Amber 400
    XL: "#b11797ff", // Indigo 500
  };

  const filteredStats = useMemo(() => {
    if (!stats) return [];

    // Get all unique exercises across all users
    const allExercises = Array.from(
      new Set(EXERCISE_CATALOG.map((e) => e.exercise))
    );

    // Current user's exercises
    const myUser = stats.find((u) => u.name === currentUser);
    const myExercises = myUser?.goals.map((g) => g.exercise) || [];

    const exercisesToShow = filterMyDisciplines ? myExercises : allExercises;

    return exercisesToShow
      .map((ex) => {
        const catalogInfo = EXERCISE_CATALOG.find((e) => e.exercise === ex);
        if (!catalogInfo) return null;

        const userProgress = stats
          .filter((u) => u.goals.some((g) => g.exercise === ex))
          .map((u) => {
            const goal = u.goals.find((g) => g.exercise === ex)!;
            const annualTarget = goal.target;
            const target =
              raceMode === "year" ? annualTarget : annualTarget / 12;

            // Determine level by comparing annual target with catalog
            let level: "S" | "M" | "L" | "XL" = "S";
            if (annualTarget >= catalogInfo.XL * 12) level = "XL";
            else if (annualTarget >= catalogInfo.L * 12) level = "L";
            else if (annualTarget >= catalogInfo.M * 12) level = "M";

            const sum = u.achievements
              .filter((a) => {
                if (a.exercise !== ex) return false;
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
              initials: u.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2),
              progress: (sum / target) * 100,
              absolute: sum,
              unit: goal.unit,
              level,
            };
          })
          .sort((a, b) => b.progress - a.progress);

        const maxAbsolute =
          catalogInfo.XL * (raceMode === "year" ? 12 : 1) * 1.2;

        return {
          exercise: ex,
          users: userProgress,
          catalog: catalogInfo,
          maxAbsolute,
        };
      })
      .filter(
        (e): e is NonNullable<typeof e> =>
          e !== null && (e.users.length > 0 || !filterMyDisciplines)
      );
  }, [stats, raceMode, now, currentUser, filterMyDisciplines]);

  const VIEW_MAX_PERCENT = 120;

  if (isLoading)
    return (
      <div className="py-20 text-center font-medium text-slate-500">
        Daten werden geladen...
      </div>
    );

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* Tab Navigation */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("race")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
            activeTab === "race"
              ? "bg-white text-slate-800"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Trophy size={18} />
          RACE
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
            activeTab === "overview"
              ? "bg-white text-slate-800"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <ListChecks size={18} />
          OVERVIEW
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
            activeTab === "log"
              ? "bg-white text-slate-800"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <CalendarDays size={18} />
          FORTSCHRITT LOG
        </button>
      </div>

      {activeTab === "overview" ? (
        <DashboardOverview users={stats} />
      ) : activeTab === "log" ? (
        stats?.find((u) => u.name === currentUser) ? (
          <ProgressLog user={stats.find((u) => u.name === currentUser)!} />
        ) : null
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Race View */}
          <div className="rounded-3xl border border-slate-100 bg-white p-8">
            <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="flex items-center gap-3 text-2xl font-black text-slate-800 tracking-tight">
                  <Trophy className="text-amber-500" size={28} />
                  Das Rennen
                </h3>
                <p className="text-slate-400 font-medium text-sm mt-1">
                  Wer hat die Nase vorn?
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setFilterMyDisciplines(!filterMyDisciplines)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                    filterMyDisciplines
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"
                  )}
                >
                  <Dumbbell size={16} />
                  {filterMyDisciplines ? "Meine Übungen" : "Alle Übungen"}
                </button>

                {/* Relative/Absolute Toggle */}
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setDisplayMode("relative")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                      displayMode === "relative"
                        ? "bg-white text-slate-800"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDisplayMode("absolute")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                      displayMode === "absolute"
                        ? "bg-white text-slate-800"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    ABS
                  </button>
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setRaceMode("year")}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-black transition-all",
                      raceMode === "year"
                        ? "bg-white text-slate-800"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    JAHR
                  </button>
                  <button
                    onClick={() => setRaceMode("month")}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-black transition-all",
                      raceMode === "month"
                        ? "bg-white text-slate-800"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    MONAT
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {filteredStats.map((row) => (
                <div key={row.exercise} className="group flex flex-col gap-2">
                  <div className="flex justify-between items-end px-2">
                    <span className="text-lg font-black text-slate-700 tracking-tight group-hover:text-slate-900 transition-colors uppercase">
                      {row.exercise}
                    </span>
                    {displayMode === "absolute" && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Max: {row.maxAbsolute} {row.catalog.unit}
                      </span>
                    )}
                  </div>

                  <div className="relative h-14 flex items-center rounded-2xl px-4">
                    {/* Track line */}
                    <div className="absolute inset-x-4 h-[4px] bg-slate-100 rounded-full" />

                    {/* 100% Target Line (Relative Mode only) */}
                    {displayMode === "relative" && (
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-slate-200 z-0"
                        style={{ left: `${(100 / VIEW_MAX_PERCENT) * 100}%` }}
                      >
                        <span className="absolute -bottom-5 left-0 -translate-x-1/2 text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                          Target
                        </span>
                      </div>
                    )}

                    {/* Vertical Goal Lines (Absolute Mode only) */}
                    {displayMode === "absolute" &&
                      (["S", "M", "L", "XL"] as const).map((lvl) => {
                        const target =
                          row.catalog[lvl] * (raceMode === "year" ? 12 : 1);
                        const pos = (target / row.maxAbsolute) * 100;
                        return (
                          <div
                            key={lvl}
                            className="absolute top-0 bottom-0 w-[1px] border-l border-dashed border-slate-300 z-0"
                            style={{ left: `${pos}%` }}
                          >
                            <span className="absolute -top-5 left-0 -translate-x-1/2 text-[8px] font-black text-slate-300">
                              {lvl}
                            </span>
                          </div>
                        );
                      })}

                    {/* Pacer lines (Push) */}
                    {(["S", "M", "L", "XL"] as const).map((lvl) => {
                      let pos = 0;
                      if (displayMode === "relative") {
                        pos = ((pacerPercent * 100) / VIEW_MAX_PERCENT) * 100;
                        // In relative mode, they all overlap, so we only show one
                        if (lvl !== "S") return null;
                      } else {
                        const target =
                          row.catalog[lvl] * (raceMode === "year" ? 12 : 1);
                        pos = ((target * pacerPercent) / row.maxAbsolute) * 100;
                      }

                      return (
                        <div
                          key={lvl}
                          onClick={(e) => {
                            e.stopPropagation();
                            const id = `${row.exercise}-${lvl}`;
                            setActiveTooltip(
                              activeTooltip?.id === id
                                ? null
                                : { id, type: "pacer" }
                            );
                          }}
                          className="group/pacer absolute top-0 bottom-0 w-[3px] transition-all duration-1000 z-10 cursor-help"
                          style={{
                            left: `${Math.min(pos, 98)}%`,
                            backgroundColor:
                              displayMode === "absolute"
                                ? LEVEL_COLORS[lvl]
                                : "#1e293b",
                          }}
                        >
                          <div
                            className={cn(
                              "absolute -top-11 left-1/2 -translate-x-1/2 text-white text-[9px] font-black px-2 py-1 rounded-md transition-opacity whitespace-nowrap z-50 pointer-events-none",
                              displayMode === "absolute" ? "" : "bg-slate-900",
                              activeTooltip?.id === `${row.exercise}-${lvl}`
                                ? "opacity-100"
                                : "opacity-0 group-hover/pacer:opacity-100"
                            )}
                            style={{
                              backgroundColor:
                                displayMode === "absolute"
                                  ? LEVEL_COLORS[lvl]
                                  : "",
                            }}
                          >
                            PUSH {displayMode === "absolute" ? lvl : ""}:{" "}
                            {(
                              pacerPercent *
                              (displayMode === "absolute"
                                ? row.catalog[lvl] *
                                  (raceMode === "year" ? 12 : 1)
                                : 100)
                            ).toFixed(0)}
                            {displayMode === "relative" ? "%" : ""}
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                              style={{
                                borderTopColor:
                                  displayMode === "absolute"
                                    ? LEVEL_COLORS[lvl]
                                    : "#0f172a",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {row.users.map((u, i) => {
                      const isMe = u.name === currentUser;
                      const pos =
                        displayMode === "relative"
                          ? (u.progress / VIEW_MAX_PERCENT) * 100
                          : (u.absolute / row.maxAbsolute) * 100;

                      return (
                        <div
                          key={u.name}
                          className={cn(
                            "absolute -translate-x-1/2 transition-all duration-1000 ease-out",
                            isMe ? "z-30" : "z-20"
                          )}
                          style={{ left: `${Math.min(pos, 98)}%` }}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const id = `${row.exercise}-${u.name}`;
                              setActiveTooltip(
                                activeTooltip?.id === id
                                  ? null
                                  : { id, type: "user" }
                              );
                            }}
                            className={cn(
                              "group/user relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all hover:scale-110 cursor-help shadow-md",
                              isMe
                                ? "ring-4 ring-white outline outline-2 outline-slate-800"
                                : "ring-2 ring-white"
                            )}
                            style={{
                              backgroundColor: LEVEL_COLORS[u.level],
                              color: "white",
                            }}
                          >
                            {u.initials}

                            {/* Custom User Tooltip */}
                            <div
                              className={cn(
                                "absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-xl transition-all scale-75 whitespace-nowrap z-50 pointer-events-none shadow-2xl border border-slate-700",
                                activeTooltip?.id ===
                                  `${row.exercise}-${u.name}`
                                  ? "opacity-100 scale-100 mt-[-8px]"
                                  : "opacity-0 group-hover/user:opacity-100 group-hover/user:scale-100"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: LEVEL_COLORS[u.level],
                                  }}
                                />
                                <p className="font-black text-xs">
                                  {u.name} ({u.level})
                                </p>
                              </div>
                              <p className="text-slate-400 font-bold">
                                {u.progress.toFixed(1)}% |{" "}
                                {u.absolute.toFixed(0)} {u.unit}
                              </p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredStats.length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">
                    Keine Übungen gefunden.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Existing Status detail */}
          <div className="rounded-3xl border border-slate-100 bg-white p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-6">
              <h3 className="flex items-center gap-3 text-xl font-black text-slate-800 uppercase tracking-tighter">
                <UserCheck className="text-amber-500" size={24} />
                Dein Status
              </h3>

              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setRaceMode("year")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                    raceMode === "year"
                      ? "bg-white text-slate-800"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  JAHR
                </button>
                <button
                  onClick={() => setRaceMode("month")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                    raceMode === "month"
                      ? "bg-white text-slate-800"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  MONAT
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats
                ?.find((u) => u.name === currentUser)
                ?.goals.map((g) => {
                  const user = stats.find((u) => u.name === currentUser)!;
                  const target = raceMode === "year" ? g.target : g.target / 12;
                  const sum = user.achievements
                    .filter((a) => {
                      if (a.exercise !== g.exercise) return false;
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
                  const p = (sum / target) * 100;

                  const catalogInfo = EXERCISE_CATALOG.find(
                    (e) => e.exercise === g.exercise
                  );
                  if (!catalogInfo) return null;

                  let level: "S" | "M" | "L" | "XL" = "S";
                  if (g.target >= catalogInfo.XL * 12) level = "XL";
                  else if (g.target >= catalogInfo.L * 12) level = "L";
                  else if (g.target >= catalogInfo.M * 12) level = "M";

                  return (
                    <div
                      key={g.id}
                      className="bg-slate-50 rounded-2xl p-6 border border-slate-100 group transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-slate-800 text-lg leading-tight">
                            {g.exercise}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: LEVEL_COLORS[level] }}
                            >
                              {level}
                            </span>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                              {raceMode === "year" ? "Jahr" : "Monat"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-xl font-black px-3 py-1 rounded-xl",
                            p >= 100
                              ? "bg-emerald-500 text-white"
                              : "bg-white text-slate-800"
                          )}
                        >
                          {p.toFixed(0)}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black text-slate-400">
                          <span>
                            {sum.toFixed(0)} {g.unit}
                          </span>
                          <span>ZIEL: {target.toFixed(0)}</span>
                        </div>
                        <div className="h-4 bg-white rounded-full relative border border-slate-200 p-1 flex items-center">
                          {/* Pacer Line */}
                          <div
                            className="absolute h-4 w-[2px] bg-slate-400/50 z-10 transition-all duration-1000"
                            style={{ left: `${pacerPercent * 100}%` }}
                          />
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              p >= 100 ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{
                              width: `${Math.min(p, 100)}%`,
                              backgroundColor:
                                p < 100 ? LEVEL_COLORS[level] : "",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
