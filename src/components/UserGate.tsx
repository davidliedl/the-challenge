"use client";

import { useState, useRef, useEffect } from "react";
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

  const { data: users, isLoading, refetch } = api.user.getAll.useQuery();

  useEffect(() => {
    if (mode === "select") {
      void refetch();
    }
  }, [mode, refetch]);

  const handleUserClick = (user: { id: string; name: string }) => {
    setSelectedUser(user);
    setMode("pin");
    setPin("");
    setError("");
  };

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering pin mode
  useEffect(() => {
    if (mode === "pin" && selectedUser) {
      // Small timeout to ensure render is complete/animation started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mode, selectedUser]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && pin.length === 4) {
      void handlePinSubmit(e);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin.length < 4) {
      setError("Der Pin muss mindestens 4 Stellen haben.");
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
        <div className="max-w-lg w-full space-y-4">
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

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                {hasPassword ? "Willkommen zurück!" : "Erstelle deinen Pin"}
              </h2>
              <p className="text-slate-500 font-medium">
                {hasPassword
                  ? "Bitte gib deinen 4-stelligen Pin ein."
                  : "Wähle einen 4-stelligen Pin für dein Profil."}
              </p>
            </div>

            <div className="relative w-full max-w-[200px] mx-auto h-16">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={pin}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setPin(val);
                  setError("");
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[40px] z-10"
                style={{ letterSpacing: "1em" }}
              />
              <div className="flex justify-between w-full h-full absolute inset-0 pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-10 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-200 bg-slate-50",
                      pin[i]
                        ? "border-slate-800 text-slate-800 scale-105 bg-white"
                        : "border-slate-200 text-slate-300",
                      error && "border-red-400 bg-red-50 text-red-800"
                    )}
                  >
                    {pin[i] ? "●" : ""}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-bold text-center p-3 rounded-xl animate-shake">
                {error}
              </div>
            )}

            <button
              onClick={handlePinSubmit}
              disabled={isLoadingAuth || isLoadingPassword || pin.length < 4}
              className="w-full py-4 bg-slate-800 text-white rounded-[2rem] font-black text-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoadingAuth
                ? "Prüfe..."
                : hasPassword
                ? "Einloggen"
                : "Pin setzen & Einloggen"}
            </button>

            <button
              onClick={() => setSelectedUser(null)} // This seems redundant with the top "Zurück" button which calls setMode("select"). Maybe keep just one? But keeping as is for now to match UI user liked.
              // Actually, SelectedUser(null) effectively goes to back to select if we handle it top level,
              // but here setMode("select") is better.
              // Wait, handleUserClick sets mode to pin.
              // In the original code (lines 157-162), there is a Zurück button calling setMode("select").
              // AND at the bottom (lines 228-233) there is "Abbrechen" calling setSelectedUser(null).
              // setSelectedUser(null) might not change mode back to select instantly?
              // In UserGate, if mode is "pin" AND selectedUser is truthy, it renders this view.
              // If we set selectedUser(null), it will fall through?
              // Let's verify line 149: `if (mode === "pin" && selectedUser)`
              // If selectedUser becomes null, it won't match.
              // It will fall to the end return (RegisterForm/Select wrapper).
              // This seems confusing.
              // Let's stick to cleaning up the placeholders first.
              className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 bg-white rounded-[2rem] py-8 px-6">
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
          onSuccess={async (user, pin) => {
            if (pin) {
              // Auto-login for new registrations
              setIsLoadingAuth(true); // Reuse state or add new one if needed, but this is fine visually
              try {
                const result = await signIn("credentials", {
                  userId: user.id,
                  pin: pin,
                  redirect: false,
                });

                if (result?.ok) {
                  onSelect(user.name);
                } else {
                  // Fallback to select mode if auto-login fails
                  setMode("select");
                }
              } catch (e) {
                setMode("select");
              } finally {
                setIsLoadingAuth(false);
              }
            } else {
              // For existing users just adding goals, or fallback
              setMode("select");
            }
          }}
        />
      </div>
    </div>
  );
}
