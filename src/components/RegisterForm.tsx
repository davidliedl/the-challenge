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
  onSuccess: (user: { id: string; name: string }, pin?: string) => void;
}) {
  const [name, setName] = useState(currentUser || "");
  const [pin, setPin] = useState("");
  const [selections, setSelections] = useState<
    {
      exercise: string;
      level: "S" | "M" | "L" | "XL";
      target: number;
      unit: string;
    }[]
  >([]);

  const register = api.user.register.useMutation({
    onSuccess: (data) => {
      onSuccess(data, pin);
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
    // Validate pin if new user
    if (!currentUser && pin.length < 4) return;

    if (name && selections.length > 0 && !isNameTaken) {
      register.mutate({
        name,
        // Only send pin if new user. If existing user (currentUser is set), pin might be ignored or handled differently.
        // But our backend now expects 'pin'. If refining existing user, we might need to handle this.
        // Actually, this form is shared for "New Register" (no currentUser) and "Add Goals" (currentUser exists).
        // If currentUser exists, we shouldn't ask for/send pin unless we want to allow pin reset?
        // Let's assume for "Add Goals" we pass a dummy or keep existing.
        // The current backend forces `pin` in Zod schema.
        // We should make `pin` optional in backend or pass a dummy here if currentUser is set.
        // BETTER: user.register should make pin optional if just adding goals?
        // OR: Separation of concerns. create vs update.
        // For now, to keep it simple: If currentUser, send "000000" (ignored if we check existence) or current Pin?
        // Let's modify backend to make pin optional using .optional() in Zod and handling it?
        // Ah, the user request says "when a user registers, he should directly add the pin".
        // This implies new users. For existing users adding goals, they are already logged in presumably?
        // But this component `RegisterForm` is used in `start/page.tsx` for new users AND `status/page.tsx` for adding goals.
        // I need to adjust backend to allow optional pin or handle "Edit mode".

        // Send pin only if it's set (new user)
        pin: pin || undefined,
        goals: selections.map((s) => ({
          exercise: s.exercise,
          target: s.target * 12, // Annual target
          unit: s.unit,
        })),
      });
    }
  };

  return (
    <div className="w-full">
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

            <div className="pt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-4 text-center text-lg">
                Dein 4-stelliger Pin
              </label>

              <div className="relative w-full max-w-[200px] mx-auto h-16 mb-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[40px] z-10"
                />
                <div className="flex justify-between w-full h-full absolute inset-0 pointer-events-none">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-10 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all duration-200 bg-slate-50",
                        pin[i]
                          ? "border-slate-800 text-slate-800 scale-105 bg-white shadow-sm"
                          : "border-slate-200 text-slate-300"
                      )}
                    >
                      {pin[i] || ""}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 mt-4">
                Diesen Pin brauchst du zum Einloggen.
              </p>
            </div>
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
            (!currentUser && (!name || pin.length < 4 || isNameTaken)) ||
            selections.length === 0 ||
            register.isPending
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
