import { useState } from "react";
import { type RouterOutputs, api } from "~/trpc/react";
import { EXERCISE_CATALOG } from "~/constants";
import { CalendarDays, Dumbbell, Trophy, Trash2, Loader2 } from "lucide-react";
import { clsx } from "clsx";

type User = RouterOutputs["achievement"]["getStats"][number];

export function ProgressLog({ user }: { user: User }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const utils = api.useUtils();

  const deleteAchievement = api.achievement.delete.useMutation({
    onSuccess: () => {
      void utils.achievement.getStats.invalidate();
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    }
  });

  const handleDelete = async (id: string) => {
    if (confirm("Bist du sicher, dass du diesen Fortschritt löschen möchtest?")) {
      setDeletingId(id);
      deleteAchievement.mutate(id);
    }
  };

  const sortedAchievements = [...user.achievements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sortedAchievements.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <p className="text-slate-400 font-bold">
          Noch keine Einträge vorhanden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Datum</th>
              <th className="px-6 py-4">Übung</th>
              <th className="px-6 py-4">Übung</th>
              <th className="px-6 py-4 text-right">Wert</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAchievements.map((achievement) => {
              const catalogItem = EXERCISE_CATALOG.find(
                (e) => e.exercise === achievement.exercise
              );
              const date = new Date(achievement.date);

              return (
                <tr
                  key={achievement.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-600">
                    {date.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Dumbbell size={16} className="text-slate-400" />
                      {achievement.exercise}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-800">
                    {achievement.value}{" "}
                    <span className="text-slate-400 font-medium ml-1">
                      {catalogItem?.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(achievement.id)}
                      disabled={deletingId === achievement.id}
                      className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                      title="Eintrag löschen"
                    >
                      {deletingId === achievement.id ? (
                        <Loader2 size={18} className="animate-spin text-slate-400" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
