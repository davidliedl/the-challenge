"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Layout } from "~/components/Layout";
import { UserGate } from "~/components/UserGate";
import { ProgressLog } from "~/components/ProgressLog";
import { RegisterForm } from "~/components/RegisterForm";
import { EXERCISE_CATALOG } from "~/constants";
import {
  UserCheck,
  Plus,
  Check,
  Loader2,
  ChevronDown,
  ListChecks,
} from "lucide-react";
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
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

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
        {/* Exercise Goals Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800 uppercase tracking-tighter">
              <UserCheck className="text-amber-500" size={28} />
              Meine Disziplinen
            </h2>

            <div className="flex rounded-xl bg-slate-200 p-1">
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
                  className="bg-white rounded-3xl p-6 border border-slate-100 group transition-all duration-300"
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
                        "text-2xl font-black px-4 py-1 rounded-2xl border",
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
                          p >= 100 ? "bg-emerald-500" : "bg-amber-500"
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
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-amber-200 transition-all"
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
                        className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
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

        {/* Progress Log Accordion */}
        <section className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setIsLogOpen(!isLogOpen)}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ListChecks
                className={cn(
                  "text-amber-500 transition-transform duration-300",
                  isLogOpen && "rotate-12"
                )}
                size={24}
              />
              <div className="text-left">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                  Vergangener Fortschritt
                </h2>
                <p className="text-slate-400 font-bold text-xs">
                  Meine Historie aller Einträge
                </p>
              </div>
            </div>
            <div
              className={cn(
                "p-2 rounded-xl bg-slate-50 text-slate-400 transition-transform duration-300",
                isLogOpen && "rotate-180"
              )}
            >
              <ChevronDown size={20} />
            </div>
          </button>

          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              isLogOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-8 pb-8 pt-2">
                {user && <ProgressLog user={user} />}
              </div>
            </div>
          </div>
        </section>

        {/* Add more goals / RegisterForm Accordion */}
        <section className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setIsRegisterOpen(!isRegisterOpen)}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Plus
                className={cn(
                  "text-amber-500 transition-transform duration-300",
                  isRegisterOpen && "rotate-45"
                )}
                size={24}
              />
              <div className="text-left">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                  Neue Ziele setzen
                </h2>
                <p className="text-slate-400 font-bold text-xs">
                  Erweitere deine Challenge um neue Disziplinen.
                </p>
              </div>
            </div>
            <div
              className={cn(
                "p-2 rounded-xl bg-slate-50 text-slate-400 transition-transform duration-300",
                isRegisterOpen && "rotate-180"
              )}
            >
              <ChevronDown size={20} />
            </div>
          </button>

          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              isRegisterOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-8 pb-8 pt-2">
                <RegisterForm
                  currentUser={currentUser}
                  onSuccess={() => {
                    void utils.achievement.getStats.invalidate();
                    setIsRegisterOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
