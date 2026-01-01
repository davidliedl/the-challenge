"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { EXERCISE_CATALOG } from "~/constants";
import { Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function RegisterForm({
  currentUser,
  onSuccess,
}: {
  currentUser?: string;
  onSuccess: (name: string) => void;
}) {
  const [name, setName] = useState(currentUser || "");
  const [selections, setSelections] = useState<
    {
      exercise: string;
      level: "S" | "M" | "L" | "XL";
      target: number;
      unit: string;
    }[]
  >([]);

  const register = api.user.register.useMutation({
    onSuccess: () => {
      onSuccess(name);
    },
  });

  const { data: users } = api.user.getAll.useQuery();
  const currentUserData = users?.find((u) => u.name === name);
  const existingExercises = currentUserData?.goals.map((g) => g.exercise) || [];

  const isNameTaken =
    !currentUser &&
    users?.some((u) => u.name.toLowerCase() === name.trim().toLowerCase());

  const toggleSelection = (
    ex: string,
    level: "S" | "M" | "L" | "XL",
    target: number,
    unit: string
  ) => {
    if (existingExercises.includes(ex)) return;

    setSelections((prev) => {
      const exists = prev.find((s) => s.exercise === ex && s.level === level);
      if (exists) {
        return prev.filter((s) => !(s.exercise === ex && s.level === level));
      }
      // Keep only one level per exercise for simplicity and clarity
      const otherLevelsRemoved = prev.filter((s) => s.exercise !== ex);
      return [...otherLevelsRemoved, { exercise: ex, level, target, unit }];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selections.length > 0 && !isNameTaken) {
      register.mutate({
        name,
        goals: selections.map((s) => ({
          exercise: s.exercise,
          target: s.target * 12, // Annual target
          unit: s.unit,
        })),
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
        Ziele registrieren
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {!currentUser && (
          <div className="max-w-md mx-auto space-y-3">
            <label className="block text-sm font-semibold text-slate-700 mb-2 text-center text-lg">
              Dein Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent outline-none transition-all text-center text-xl font-medium",
                isNameTaken
                  ? "border-amber-300 bg-amber-50 focus:ring-amber-500"
                  : "border-slate-200 focus:ring-slate-800"
              )}
              placeholder="Name eingeben..."
              required
            />
            {isNameTaken && (
              <div className="bg-amber-100 border border-amber-200 p-3 rounded-xl text-amber-800 text-sm animate-in fade-in slide-in-from-top-1">
                <p className="font-bold mb-1">
                  Dieser Name ist bereits vergeben.
                </p>
                <p>
                  Füge z.B. den ersten Buchstaben deines Nachnamens hinzu (z.B.{" "}
                  {name} M.)
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm text-center">
            Wähle deine Schwierigkeitsstufen. Bereits registrierte Übungen sind
            deaktiviert.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 rounded-tl-xl text-left">Übung</th>
                  <th className="p-3">Einheit</th>
                  <th className="p-3 text-sm">S (Small)</th>
                  <th className="p-3 text-sm">M (Medium)</th>
                  <th className="p-3 text-sm">L (Large)</th>
                  <th className="p-3 rounded-tr-xl text-sm">XL (X-Large)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EXERCISE_CATALOG.map((ex) => {
                  const isExisting = existingExercises.includes(ex.exercise);
                  return (
                    <tr
                      key={ex.exercise}
                      className={cn(
                        "transition-colors",
                        isExisting
                          ? "bg-slate-50 opacity-60"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <td className="p-3 font-semibold text-slate-700 text-left">
                        {ex.exercise}
                      </td>
                      <td className="p-3 text-slate-400 text-sm">{ex.unit}</td>
                      {(["S", "M", "L", "XL"] as const).map((lvl) => {
                        const isSelected = selections.some(
                          (s) => s.exercise === ex.exercise && s.level === lvl
                        );
                        return (
                          <td
                            key={lvl}
                            onClick={() =>
                              toggleSelection(
                                ex.exercise,
                                lvl,
                                ex[lvl],
                                ex.unit
                              )
                            }
                            className={cn(
                              "p-3 transition-all border-l border-slate-50",
                              isSelected
                                ? "bg-slate-800 text-white font-bold"
                                : isExisting
                                ? "cursor-not-allowed text-slate-300"
                                : "cursor-pointer text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            {ex[lvl]}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selections.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="font-bold mb-2">Ausgewählte Ziele:</h4>
            <ul className="text-sm space-y-1">
              {selections.map((s) => (
                <li key={s.exercise} className="flex justify-between">
                  <span>
                    {s.exercise} ({s.level})
                  </span>
                  <span>
                    {s.target} {s.unit} / Monat
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={
            !name ||
            selections.length === 0 ||
            register.isPending ||
            isNameTaken
          }
          className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-lg hover:bg-slate-900 focus:ring-4 focus:ring-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {register.isPending
            ? "Wird registriert..."
            : "Registrieren & Loslegen"}
        </button>
      </form>
    </div>
  );
}
