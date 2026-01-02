"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Trophy, UserPlus, LogIn, Check } from "lucide-react";
import { RegisterForm } from "./RegisterForm";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function UserGate({ onSelect }: { onSelect: (name: string) => void }) {
  const [mode, setMode] = useState<"landing" | "select" | "register">(
    "landing"
  );
  const { data: users, isLoading } = api.user.getAll.useQuery();

  if (mode === "landing") {
    return (
      <div className="flex items-center justify-center p-4 w-full">
        <div className="max-w-lg w-full space-y-4 animate-in fade-in zoom-in duration-500">
          <button
            onClick={() => setMode("select")}
            className="w-full py-4 bg-slate-800 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 active:scale-95 border-4 border-slate-800"
          >
            <LogIn size={24} />
            Ich habe einen Account
          </button>
          <button
            onClick={() => setMode("register")}
            className="w-full py-4 bg-white text-slate-800 border-4 border-slate-100 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
          >
            <UserPlus size={24} />
            Neu registrieren
          </button>
        </div>
      </div>
    );
  }

  if (mode === "select") {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode("landing")}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              Zurück
            </button>
            <h2 className="text-2xl font-bold text-slate-800">
              Wähle deinen Namen
            </h2>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <p className="text-center py-8 text-slate-400">
                Lade Teilnehmer...
              </p>
            ) : users?.length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic">
                Noch keine Teilnehmer registriert.
              </p>
            ) : (
              users?.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelect(user.name)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-50 hover:border-slate-800 hover:bg-slate-50 transition-all text-left font-bold text-slate-700 flex justify-between items-center group"
                >
                  {user.name}
                  <Check
                    className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    size={20}
                  />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full">
        <div className="mb-4">
          <button
            onClick={() => setMode("landing")}
            className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            ← Zurück
          </button>
        </div>
        <RegisterForm onSuccess={(name) => onSelect(name)} />
      </div>
    </div>
  );
}
