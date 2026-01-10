"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Trophy, UserPlus, LogIn, Check } from "lucide-react";
import { RegisterForm } from "./RegisterForm";
import { signIn } from "next-auth/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function UserGate({ onSelect }: { onSelect: (name: string) => void }) {
  const [mode, setMode] = useState<"landing" | "select" | "register" | "pin">(
    "landing"
  );
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // We only enable this query when we have a selected user and we are checking their status
  // But to keep it simple, we can just fetch it when entering pin mode or rely on a separate query.
  // Actually, keeping the hook at top level is better.
  const { data: hasPassword, isLoading: isLoadingPassword } =
    api.user.hasPassword.useQuery(
      { name: selectedUser?.name ?? "" },
      { enabled: !!selectedUser }
    );

  const { data: users, isLoading } = api.user.getAll.useQuery();

  const handleUserClick = (user: { id: string; name: string }) => {
    setSelectedUser(user);
    setMode("pin");
    setPin("");
    setError("");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin.length < 6) {
      setError("Der Pin muss mindestens 6 Stellen haben.");
      return;
    }

    setIsLoadingAuth(true);
    setError("");

    // Dynamically import signIn to avoid build issues if not transpiled correctly in some envs,
    // but standard import is fine. I'll use standard import at top.
    // Actually, I need to add the import to the top of the file!
    try {
      const result = await signIn("credentials", {
        userId: selectedUser.id,
        pin: pin,
        redirect: false,
      });

      if (result?.error) {
        setError("Falscher Pin oder zu viele Versuche.");
        setIsLoadingAuth(false);
      } else {
        // Success
        onSelect(selectedUser.name);
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten.");
      setIsLoadingAuth(false);
    }
  };

  if (mode === "landing") {
    return (
      <div className="flex items-center justify-center p-4 w-full">
        <div className="max-w-lg w-full space-y-4 animate-in fade-in zoom-in duration-500">
          <button
            onClick={() => setMode("select")}
            className="w-full py-4 bg-slate-800 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all active:scale-95 border-4 border-slate-800"
          >
            <LogIn size={24} />
            Ich habe einen Account
          </button>
          <button
            onClick={() => setMode("register")}
            className="w-full py-4 bg-white text-slate-800 border-4 border-slate-100 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:border-slate-300 transition-all active:scale-95"
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
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
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
                  onClick={() => handleUserClick(user)}
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

  if (mode === "pin" && selectedUser) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
          <button
            onClick={() => setMode("select")}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            Zurück
          </button>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">
              Hallo {selectedUser.name}!
            </h2>
            <p className="text-slate-500">
              {isLoadingPassword
                ? "Lade Status..."
                : hasPassword
                ? "Bitte gib deinen Pin ein."
                : "Erstelle deinen 6-stelligen Pin."}
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-4xl font-black tracking-[1em] py-4 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-slate-800 focus:outline-none"
              placeholder="••••••"
              disabled={isLoadingAuth || isLoadingPassword}
              autoFocus
            />
            {error && (
              <p className="text-red-500 font-bold text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoadingAuth || isLoadingPassword || pin.length < 6}
              className="w-full py-4 bg-slate-800 text-white rounded-[2rem] font-black text-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoadingAuth
                ? "Prüfe..."
                : hasPassword
                ? "Einloggen"
                : "Pin setzen & Einloggen"}
            </button>
          </form>
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
        <RegisterForm
          onSuccess={(name) => {
            // For registration, we can either select the user and show pin screen,
            // or maybe we should just select the user and let them set the pin.
            // We need to fetch the ID though. RegisterForm returns name?
            // If RegisterForm returns name, we need to find the ID.
            // Ideally RegisterForm should return the full user object or we refetch.
            // For now, let's just go to select mode, or "landing".
            // Simplest: Go to select mode.
            setMode("select");
          }}
        />
      </div>
    </div>
  );
}
