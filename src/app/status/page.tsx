"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Layout } from "~/components/Layout";
import { UserGate } from "~/components/UserGate";
import { ProgressLog } from "~/components/ProgressLog";
import { RegisterForm } from "~/components/RegisterForm";
import { EXERCISE_CATALOG } from "~/constants";
import { UserCheck, Plus, Check, Loader2 } from "lucide-react";
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

export default function StatusPage() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [raceMode, setRaceMode] = useState<"year" | "month">("month");
  const [quickLogValue, setQuickLogValue] = useState<Record<string, string>>(
    {}
  );
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: stats, isLoading } = api.achievement.getStats.useQuery();
  const createAchievement = api.achievement.log.useMutation({
    onSuccess: () => {
      void utils.achievement.getStats.invalidate();
      setLoggingId(null);
    },
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("push_challenge_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setIsLoaded(true);
  }, []);

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

  const user = stats?.find((u) => u.name === currentUser);

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

  const handleQuickLog = async (exercise: string) => {
    const value = parseFloat(quickLogValue[exercise] || "0");
    if (isNaN(value) || value <= 0) return;

    setLoggingId(exercise);
    try {
      await createAchievement.mutateAsync({
        userName: currentUser,
        exercise,
        value,
        date: new Date().toISOString(),
      });
      setQuickLogValue((prev) => ({ ...prev, [exercise]: "" }));
    } catch (error) {
      console.error(error);
      setLoggingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-12">
        {/* Profile Header */}
        <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100">
                {currentUser
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                  {currentUser}
                </h1>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
                  Dein aktueller Fortschritt
                </p>
              </div>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 shadow-inner">
              <button
                onClick={() => setRaceMode("year")}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-black transition-all",
                  raceMode === "year"
                    ? "bg-white text-slate-800 shadow-md"
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
                    ? "bg-white text-slate-800 shadow-md"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                MONAT
              </button>
            </div>
          </div>
        </section>

        {/* Exercise Goals Grid */}
        <section className="space-y-6">
          <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 uppercase tracking-tighter">
            <UserCheck className="text-indigo-500" size={28} />
            Deine Disziplinen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user?.goals.map((g) => {
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
                  className="bg-white rounded-3xl p-6 border border-slate-100 group hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-slate-800 text-xl leading-tight uppercase tracking-tight">
                        {g.exercise}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: LEVEL_COLORS[level] }}
                        >
                          {level}
                        </span>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          {raceMode === "year" ? "Jahr" : "Monat"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-2xl font-black px-4 py-1 rounded-2xl shadow-sm border",
                        p >= 100
                          ? "bg-emerald-500 text-white border-emerald-400"
                          : "bg-slate-50 text-slate-800 border-slate-100"
                      )}
                    >
                      {p.toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-black text-slate-400 tracking-wider">
                      <span>
                        {sum.toFixed(0)} {g.unit}
                      </span>
                      <span>ZIEL: {target.toFixed(0)}</span>
                    </div>

                    <div className="h-5 bg-slate-50 rounded-full relative border border-slate-100 p-1 flex items-center overflow-hidden">
                      <div
                        className="absolute h-full w-[2px] bg-slate-300 z-10"
                        style={{ left: `${pacerPercent * 100}%` }}
                      />
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          p >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                        )}
                        style={{
                          width: `${Math.min(p, 100)}%`,
                          backgroundColor: p < 100 ? LEVEL_COLORS[level] : "",
                        }}
                      />
                    </div>

                    {/* Quick Log Input */}
                    <div className="pt-4 mt-4 border-t border-slate-50 flex gap-2">
                      <input
                        type="number"
                        placeholder="Wert"
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-200 transition-all"
                        value={quickLogValue[g.exercise] || ""}
                        onChange={(e) =>
                          setQuickLogValue((prev) => ({
                            ...prev,
                            [g.exercise]: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() => handleQuickLog(g.exercise)}
                        disabled={loggingId === g.exercise}
                        className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {loggingId === g.exercise ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Plus size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Progress Log */}
        {user && (
          <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <ProgressLog user={user} />
          </section>
        )}

        {/* Add more goals / RegisterForm */}
        <section className="bg-slate-800 rounded-3xl p-8 text-white shadow-2xl">
          <div className="mb-8">
            <h2 className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter">
              <Plus className="text-amber-400" size={28} />
              Neue Ziele setzen
            </h2>
            <p className="text-slate-400 font-bold mt-1">
              Erweitere deine Challenge um neue Disziplinen.
            </p>
          </div>
          <RegisterForm
            currentUser={currentUser}
            onSuccess={() => {
              void utils.achievement.getStats.invalidate();
            }}
          />
        </section>
      </div>
    </Layout>
  );
}
