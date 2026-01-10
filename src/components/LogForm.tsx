"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { PenLine } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function LogForm({
  currentUser,
  onSuccess,
}: {
  currentUser: string;
  onSuccess: () => void;
}) {
  const [exercise, setExercise] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: users } = api.user.getAll.useQuery();
  const logAchievement = api.achievement.log.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const selectedUser = users?.find((u) => u.name === currentUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && exercise && value && date) {
      logAchievement.mutate({
        exercise,
        value: parseFloat(value),
        date: new Date(date!).toISOString(),
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-800 flex items-center justify-center gap-2">
        <PenLine className="text-emerald-500" />
        Training eintragen
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Teilnehmer
          </p>
          <div className="text-2xl font-bold text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {currentUser}
          </div>
        </div>

        {selectedUser && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Welche Übung?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedUser.goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setExercise(g.exercise)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                    exercise === g.exercise
                      ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "font-bold",
                      exercise === g.exercise
                        ? "text-emerald-700"
                        : "text-slate-700"
                    )}
                  >
                    {g.exercise}
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {g.unit}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Wert
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="z.B. 50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Datum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={
            !currentUser || !exercise || !value || logAchievement.isPending
          }
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {logAchievement.isPending ? "Wird gespeichert..." : "Speichern"}
        </button>
      </form>
    </div>
  );
}
