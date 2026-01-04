"use client";

import { useMemo, useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { api } from "~/trpc/react";
import { Layout } from "~/components/Layout";
import { UserGate } from "~/components/UserGate";
import { Portal } from "~/components/Portal";
import { EXERCISE_CATALOG } from "~/constants";
import { Trophy, Dumbbell, ZoomIn } from "lucide-react";
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

export default function RacePage() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
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

  const [zoomLevel, setZoomLevel] = useState(1);

  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    type: "user" | "pacer";
    x: number;
    y: number;
    alignment: "left" | "center" | "right";
    data: any; // We'll store the data needed to render the tooltip here
  } | null>(null);

  const scrollContainerRef = useState<HTMLDivElement | null>(null); // We need to capture ref in the map loop? No, ref to the container.
  // Actually, we can just use an ID or class for the container, or a ref accessible in the scope.
  // Let's create a ref for the container.
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  const { data: stats, isLoading } = api.achievement.getStats.useQuery();

  useEffect(() => {
    const savedUser = localStorage.getItem("push_challenge_user");
    if (savedUser) setCurrentUser(savedUser);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleClose = () => setActiveTooltip(null);
    window.addEventListener("click", handleClose);
    window.addEventListener("resize", handleClose);

    // Add scroll listener to container if it exists
    const container = containerRef;
    if (container) {
      container.addEventListener("scroll", handleClose);
    }

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("resize", handleClose);
      if (container) {
        container.removeEventListener("scroll", handleClose);
      }
    };
  }, [containerRef]);

  const filteredStats = useMemo(() => {
    if (!stats) return [];
    const allExercises = Array.from(
      new Set(EXERCISE_CATALOG.map((e) => e.exercise))
    );
    const myUser = stats.find((u) => u.name === currentUser);
    const myExercises = myUser?.goals.map((g) => g.exercise) || [];
    const exercisesToShow = filterMyDisciplines ? myExercises : allExercises;
    const now = new Date();

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
  }, [stats, raceMode, currentUser, filterMyDisciplines]);

  if (!isLoaded) return null;
  if (!currentUser) {
    return (
      <Layout>
        <UserGate
          onSelect={(name) => {
            setCurrentUser(name);
            localStorage.setItem("push_challenge_user", name);
          }}
        />
      </Layout>
    );
  }

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const monthPacer = dayOfMonth / daysInMonth;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const yearPacer = dayOfYear / 365;
  const pacerPercent = raceMode === "year" ? yearPacer : monthPacer;

  const VIEW_MAX_PERCENT = 120;

  return (
    <Layout>
      <div className="bg-white rounded-3xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-8">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-slate-800 tracking-tighter uppercase">
              <Trophy className="text-amber-500 w-10 h-10" />
              Das Rennen
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">
              Wer dominiert die Rangliste?
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setFilterMyDisciplines(!filterMyDisciplines)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 border",
                filterMyDisciplines
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
              )}
            >
              <Dumbbell size={18} />
              {filterMyDisciplines ? "Meine Übungen" : "Alle Übungen"}
            </button>

            {/* Zoom Control */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 h-[42px]">
              <ZoomIn size={16} className="text-slate-400" />
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
              <span className="text-xs font-bold text-slate-500 w-8 text-right font-mono">
                {zoomLevel.toFixed(1)}x
              </span>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setDisplayMode("relative")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all",
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
                  "px-4 py-2 rounded-lg text-xs font-black transition-all",
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
        </header>

        <div className="space-y-16 md:px-2">
          {filteredStats.map((row) => (
            <div key={row.exercise} className="group flex flex-col gap-4">
              <div className="flex justify-between items-end px-2">
                <span className="text-xl font-black text-slate-800 tracking-tight group-hover:text-amber-600 transition-colors uppercase">
                  {row.exercise}
                </span>
                {displayMode === "absolute" && (
                  <span className="hidden sm:inline-block text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    Max: {row.maxAbsolute} {row.catalog.unit}
                  </span>
                )}
              </div>

              <div className="w-full overflow-x-auto pb-4 -mb-4 px-2" ref={setContainerRef}>
                <div
                  className="relative h-20 flex items-center rounded-3xl px-8 transition-all duration-300 ease-out"
                  style={{ width: `${zoomLevel * 100}%`, minWidth: "100%" }}
                >
                  {/* Track line */}
                  <div className="absolute inset-x-0 h-[6px] bg-slate-100 rounded-full" />

                  {/* Vertical labels/lines */}
                  {displayMode === "relative" ? (
                    <div
                      className="absolute top-0 bottom-0 border-l-[3px] border-dotted border-slate-300 z-0 ring-4 ring-white"
                      style={{ left: `${(100 / VIEW_MAX_PERCENT) * 100}%` }}
                    >
                      <span className="absolute -bottom-6 left-0 -translate-x-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-1 font-sans">
                        Target
                      </span>
                    </div>
                  ) : (
                    (["S", "M", "L", "XL"] as const).map((lvl) => {
                      const target =
                        row.catalog[lvl] * (raceMode === "year" ? 12 : 1);
                      const pos = (target / row.maxAbsolute) * 100;

                      const id = `${row.exercise}-line-${lvl}`;
                      const isTooltip = activeTooltip?.id === id;

                      // Calculate tooltip alignment based on position
                      let alignment: "left" | "center" | "right" = "center";
                      if (pos < 20) alignment = "left";
                      else if (pos > 80) alignment = "right";

                      return (
                        <div
                          key={lvl}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveTooltip(
                              isTooltip
                                ? null
                                : {
                                  id,
                                  type: "pacer", // Using "pacer" type for package line tooltips too, efficiently
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                  alignment,
                                  data: {
                                    lvl,
                                    value: target,
                                    // We need to pass enough info to render the package line tooltip
                                    // It renders: {lvl}: {target} {unit}
                                    unit: row.catalog.unit,
                                    isPackageLine: true,
                                  },
                                }
                            );
                          }}
                          className="group/line absolute top-0 bottom-0 border-l-[3px] border-dotted border-slate-200 z-0 ring-2 ring-white cursor-pointer hover:border-slate-400 transition-colors"
                          style={{ left: `${pos}%` }}
                        >
                          <span className="absolute -top-7 left-0 -translate-x-1/2 text-[10px] font-black text-slate-400 bg-white px-1 font-sans">
                            {lvl}
                          </span>
                        </div>
                      );
                    })
                  )}

                  {/* Pacer indicators */}
                  {(["S", "M", "L", "XL"] as const).map((lvl) => {
                    let pos = 0;
                    if (displayMode === "relative") {
                      pos = ((pacerPercent * 100) / VIEW_MAX_PERCENT) * 100;
                      if (lvl !== "S") return null;
                    } else {
                      const target =
                        row.catalog[lvl] * (raceMode === "year" ? 12 : 1);
                      pos = ((target * pacerPercent) / row.maxAbsolute) * 100;
                    }

                    const id = `${row.exercise}-${lvl}`;
                    const isTooltip = activeTooltip?.id === id;

                    return (
                      <div
                        key={lvl}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveTooltip(
                            isTooltip
                              ? null
                              : {
                                id,
                                type: "pacer",
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                                alignment: "center",
                                data: {
                                  lvl,
                                  value:
                                    pacerPercent *
                                    (displayMode === "absolute"
                                      ? row.catalog[lvl] *
                                      (raceMode === "year" ? 12 : 1)
                                      : 100),
                                },
                              }
                          );
                        }}
                        className="group/pacer absolute top-0 bottom-0 w-[4px] transition-all duration-1000 z-10 cursor-pointer"
                        style={{
                          left: `${Math.min(pos, 98)}%`,
                          backgroundColor:
                            displayMode === "absolute"
                              ? LEVEL_COLORS[lvl]
                              : "#1e293b",
                        }}
                      />
                    )
                  })}                  {/* User Avatars */}
                  {(() => {
                    // Group users by position to handle overlaps
                    const usersWithPos = row.users.map((u) => {
                      const pos =
                        displayMode === "relative"
                          ? (u.progress / VIEW_MAX_PERCENT) * 100
                          : (u.absolute / row.maxAbsolute) * 100;
                      return { ...u, pos };
                    });

                    const groups = new Map<string, typeof usersWithPos>();
                    usersWithPos.forEach((u) => {
                      // Use 2 decimal places for grouping key to catch practically identical positions
                      const key = u.pos.toFixed(2);
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key)!.push(u);
                    });

                    return Array.from(groups.values()).map((group) => {
                      // If current user is in this group, use them as the primary visual
                      // otherwise just take the first one
                      const primaryUser =
                        group.find((u) => u.name === currentUser) || group[0]!;
                      const isMeInGroup = group.some(
                        (u) => u.name === currentUser
                      );
                      const groupSize = group.length;

                      // Position comes from the group key effectively, or just the first user's pos
                      const pos = group[0]!.pos;
                      const id = `${row.exercise}-group-${pos.toFixed(2)}`;
                      const isTooltip = activeTooltip?.id === id;

                      // Calculate tooltip alignment based on position
                      // If < 20% left, align left
                      // If > 80% right, align right
                      // Else center
                      let alignment: "left" | "center" | "right" = "center";
                      if (pos < 20) alignment = "left";
                      else if (pos > 80) alignment = "right";

                      return (
                        <div
                          key={id}
                          className={cn(
                            "absolute -translate-x-1/2 transition-all duration-1000 ease-out",
                            isMeInGroup ? "z-30" : "z-20"
                          )}
                          style={{ left: `${Math.min(pos, 98)}%` }}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveTooltip(
                                isTooltip
                                  ? null
                                  : {
                                    id,
                                    type: "user",
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                    alignment,
                                    data: { group, primaryUser, currentUser },
                                  }
                              );
                            }}
                            className={cn(
                              "group/user relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all hover:scale-110 active:scale-95 cursor-pointer",
                              isMeInGroup
                                ? "ring-4 ring-white outline outline-2 outline-slate-800"
                                : "ring-2 ring-white"
                            )}
                            style={{
                              backgroundColor: LEVEL_COLORS[primaryUser.level],
                              color: "white",
                            }}
                          >
                            {primaryUser.initials}

                            {/* Group Indicator (if more than 1 user) */}
                            {groupSize > 1 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 text-white flex items-center justify-center text-[8px] rounded-full ring-2 ring-white">
                                {groupSize}
                              </div>
                            )}


                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ))}

          {filteredStats.length === 0 && (
            <div className="py-24 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Trophy className="mx-auto text-slate-200 w-16 h-16 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest">
                Keine Daten verfügbar
              </p>
            </div>
          )}
        </div>
        {activeTooltip && (
          <Portal>
            <div
              className={cn(
                "fixed z-[100] bg-slate-800 text-white text-[10px] font-bold px-4 py-3 rounded-2xl transition-all whitespace-nowrap border border-slate-700 flex flex-col gap-2 min-w-[120px] shadow-xl",
                activeTooltip.alignment === "center" && "-translate-x-1/2",
                activeTooltip.alignment === "left" && "-translate-x-4",
                activeTooltip.alignment === "right" && "translate-x-[-100%] translate-x-4"
              )}
              style={{
                top: activeTooltip.y - 12, // 12px margin above target
                left: activeTooltip.x,
                transform: `translate(${activeTooltip.alignment === "center"
                  ? "-50%"
                  : activeTooltip.alignment === "left"
                    ? "0"
                    : "-100%"
                  }, -100%)`, // Move up by 100% of height
              }}
            >
              {activeTooltip.type === "pacer" && (
                <>
                  PUSH {displayMode === "absolute" ? activeTooltip.data.lvl : ""}:{" "}
                  {activeTooltip.data.value.toFixed(0)}
                  {displayMode === "relative" ? "%" : ""}
                </>
              )}

              {activeTooltip.type === "user" &&
                activeTooltip.data.group.map((u: any, idx: number) => (
                  <div
                    key={u.name}
                    className={cn(
                      "flex flex-col gap-0.5",
                      idx !== activeTooltip.data.group.length - 1 &&
                      "border-b border-slate-700 pb-2"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: LEVEL_COLORS[u.level as keyof typeof LEVEL_COLORS],
                        }}
                      />
                      <p className="font-black text-xs">
                        {u.name} {u.name === currentUser && "(Ich)"}
                      </p>
                    </div>
                    <p className="text-slate-400 font-bold pl-4">
                      {u.progress.toFixed(1)}% | {u.absolute.toFixed(0)}{" "}
                      {u.unit}
                    </p>
                  </div>
                ))}

              <div
                className={cn(
                  "absolute top-full border-4 border-transparent border-t-slate-800",
                  activeTooltip.alignment === "center" &&
                  "left-1/2 -translate-x-1/2",
                  activeTooltip.alignment === "left" && "left-4",
                  activeTooltip.alignment === "right" && "right-4"
                )}
              />
            </div>
          </Portal>
        )}
        {activeTooltip && (
          <Portal>
            <div
              className={cn(
                "fixed z-[100] bg-slate-800 text-white text-[10px] font-bold px-4 py-3 rounded-2xl transition-all whitespace-nowrap border border-slate-700 flex flex-col gap-2 min-w-[120px] shadow-xl",
                activeTooltip.alignment === "center" && "-translate-x-1/2",
                activeTooltip.alignment === "left" && "-translate-x-4",
                activeTooltip.alignment === "right" && "translate-x-[-100%] translate-x-4"
              )}
              style={{
                top: activeTooltip.y - 12, // 12px margin above target
                left: activeTooltip.x,
                transform: `translate(${activeTooltip.alignment === "center"
                  ? "-50%"
                  : activeTooltip.alignment === "left"
                    ? "0"
                    : "-100%"
                  }, -100%)`, // Move up by 100% of height
              }}
            >
              {activeTooltip.type === "pacer" && (
                <>
                  PUSH {displayMode === "absolute" ? activeTooltip.data.lvl : ""}:{" "}
                  {activeTooltip.data.value.toFixed(0)}
                  {displayMode === "relative" ? "%" : ""}
                </>
              )}

              {activeTooltip.type === "user" &&
                activeTooltip.data.group.map((u: any, idx: number) => (
                  <div
                    key={u.name}
                    className={cn(
                      "flex flex-col gap-0.5",
                      idx !== activeTooltip.data.group.length - 1 &&
                      "border-b border-slate-700 pb-2"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: LEVEL_COLORS[u.level as keyof typeof LEVEL_COLORS],
                        }}
                      />
                      <p className="font-black text-xs">
                        {u.name} {u.name === currentUser && "(Ich)"}
                      </p>
                    </div>
                    <p className="text-slate-400 font-bold pl-4">
                      {u.progress.toFixed(1)}% | {u.absolute.toFixed(0)}{" "}
                      {u.unit}
                    </p>
                  </div>
                ))}

              <div
                className={cn(
                  "absolute top-full border-4 border-transparent border-t-slate-800",
                  activeTooltip.alignment === "center" &&
                  "left-1/2 -translate-x-1/2",
                  activeTooltip.alignment === "left" && "left-4",
                  activeTooltip.alignment === "right" && "right-4"
                )}
              />
            </div>
          </Portal>
        )}
      </div>
    </Layout>
  );
}
