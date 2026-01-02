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
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="bg-slate-800 p-4 rounded-2xl shadow-lg">
              <Trophy className="text-amber-500 w-12 h-12" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              The Challenge 2026
            </h1>
            <p className="text-slate-500 mt-2">Bereit für deine Ziele?</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setMode("select")}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
            >
              <LogIn size={20} />
              Ich habe einen Account
            </button>
            <button
              onClick={() => setMode("register")}
              className="w-full py-4 bg-white text-slate-800 border-2 border-slate-100 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:border-slate-300 transition-all"
            >
              <UserPlus size={20} />
              Neu registrieren
            </button>
          </div>
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
      <div className="max-w-4xl w-full">
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
