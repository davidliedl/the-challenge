"use client";

import { useMemo, useState } from "react";
import { Check, X, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UserWithGoalsAndAchievements = {
  name: string;
  goals: {
    id: string;
    exercise: string;
    target: number;
    unit: string;
  }[];
  achievements: {
    exercise: string;
    value: number;
    date: Date;
  }[];
};

const MONTHS = [
  "JAN",
  "FEB",
  "MÄR",
  "APR",
  "MAI",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OKT",
  "NOV",
  "DEZ",
];

export function DashboardOverview({
  users,
}: {
  users: UserWithGoalsAndAchievements[] | undefined;
}) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const matrixData = useMemo(() => {
    if (!users) return [];

    return users
      .map((user) => {
        const goals = user.goals;
        const hasNoGoals = goals.length === 0;

        // Calculate status for each month (Overall)
        const monthsStatus = MONTHS.map((_, monthIndex) => {
          if (hasNoGoals) return { isMet: false, isFuture: false, progress: 0 };

          const isFuture = monthIndex > currentMonthIndex;

          // Check if all goals are met for this specific month
          const allGoalsMet = goals.every((goal) => {
            const monthlyTarget = goal.target / 12;

            const monthlyProgress = user.achievements
              .filter((a) => {
                const d = new Date(a.date);
                return (
                  a.exercise === goal.exercise &&
                  d.getMonth() === monthIndex &&
                  d.getFullYear() === currentYear
                );
              })
              .reduce((acc, a) => acc + a.value, 0);

            return monthlyProgress >= monthlyTarget;
          });

          return {
            isMet: allGoalsMet,
            isFuture,
          };
        });

        // Calculate matrix details for each goal across all months
        const goalsMatrix = goals.map((goal) => {
          const monthlyTarget = goal.target / 12;

          const monthlyData = MONTHS.map((_, mIdx) => {
            const isFuture = mIdx > currentMonthIndex;
            const currentProgress = user.achievements
              .filter((a) => {
                const d = new Date(a.date);
                return (
                  a.exercise === goal.exercise &&
                  d.getMonth() === mIdx &&
                  d.getFullYear() === currentYear
                );
              })
              .reduce((acc, a) => acc + a.value, 0);

            return {
              value: currentProgress,
              isMet: currentProgress >= monthlyTarget,
              isFuture,
            };
          });

          return {
            ...goal,
            monthlyTarget,
            monthlyData,
          };
        });

        return {
          user,
          monthsStatus,
          hasNoGoals,
          goalsMatrix,
        };
      })
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
  }, [users, currentYear, currentMonthIndex]);

  if (!users) return null;

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white p-8 animate-in fade-in duration-500">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="py-4 px-4 text-left font-black text-slate-800 text-sm uppercase tracking-wider w-[240px]">
              Teilnehmer
            </th>
            {MONTHS.map((month, i) => (
              <th
                key={month}
                className={cn(
                  "py-4 px-2 text-center font-black text-xs uppercase tracking-wider w-[60px]",
                  i === currentMonthIndex ? "text-amber-600" : "text-slate-400"
                )}
              >
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrixData.map(({ user, monthsStatus, hasNoGoals, goalsMatrix }) => {
            const isExpanded = expandedUserId === user.name;

            return (
              <>
                <tr
                  key={user.name}
                  className={cn(
                    "group transition-colors border-b border-slate-50 last:border-0 cursor-pointer",
                    isExpanded
                      ? "bg-slate-50 border-b-0"
                      : "hover:bg-slate-50/50"
                  )}
                  onClick={() =>
                    setExpandedUserId(isExpanded ? null : user.name)
                  }
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <button className="p-1 rounded-full hover:bg-slate-200/50 text-slate-400 transition-colors">
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  {monthsStatus.map((status, i) => (
                    <td key={i} className="py-4 px-2 text-center">
                      <div className="flex justify-center">
                        {hasNoGoals ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                        ) : status.isMet ? (
                          <div className="h-6 w-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        ) : status.isFuture ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-100" />
                        ) : (
                          <div className="h-6 w-6 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Detail Nested Matrix */}
                {isExpanded && !hasNoGoals && (
                  <tr className="bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <td colSpan={13} className="p-0">
                      <div className="py-4 px-4 pl-[50px]">
                        <table className="w-full">
                          <tbody>
                            {goalsMatrix.map((goal) => (
                              <tr
                                key={goal.id}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="py-2 px-4 w-[190px]">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-600 truncate">
                                      {goal.exercise}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Target: {goal.monthlyTarget.toFixed(0)}{" "}
                                      {goal.unit}
                                    </span>
                                  </div>
                                </td>
                                {goal.monthlyData.map((m, idx) => (
                                  <td
                                    key={idx}
                                    className="py-2 px-2 text-center w-[60px]"
                                  >
                                    <div
                                      className={cn(
                                        "text-[10px] font-black py-1 px-1 rounded",
                                        m.isFuture
                                          ? "text-slate-300"
                                          : m.isMet
                                          ? "bg-white text-emerald-600 border border-emerald-100/50"
                                          : "text-slate-400"
                                      )}
                                    >
                                      {m.value > 0 ? m.value.toFixed(0) : "-"}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}

          {users.length === 0 && (
            <tr>
              <td
                colSpan={13}
                className="py-20 text-center text-slate-400 font-bold"
              >
                Keine Teilnehmer gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
