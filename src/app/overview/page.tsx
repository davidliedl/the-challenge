"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

import { UserGate } from "~/components/UserGate";
import { DashboardOverview } from "~/components/DashboardOverview";
import { ListChecks } from "lucide-react";

export default function OverviewPage() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: stats, isLoading } = api.achievement.getStats.useQuery();

  useEffect(() => {
    const savedUser = localStorage.getItem("push_challenge_user");
    if (savedUser) setCurrentUser(savedUser);
    setIsLoaded(true);
  }, []);

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="bg-white rounded-3xl p-8 border border-slate-100">
        <h1 className="flex items-center gap-3 text-3xl font-black text-slate-800 tracking-tighter uppercase">
          <ListChecks className="text-amber-500 w-8 h-8" />
          ÜBERBLICK
        </h1>
        <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">
          Die gesamte Achievement-Matrix 2026
        </p>
      </header>

      <DashboardOverview users={stats} />
    </div>
  );
}
