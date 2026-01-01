"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Layout } from "~/components/Layout";
import { Dashboard } from "~/components/Dashboard";
import { LogForm } from "~/components/LogForm";
import { RegisterForm } from "~/components/RegisterForm";
import { Trophy, LayoutDashboard, PenLine, UserPlus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { UserGate } from "~/components/UserGate";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "log" | "register">(
    "dashboard"
  );
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("push_challenge_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setIsLoaded(true);
  }, []);

  const utils = api.useUtils();

  useEffect(() => {
    if (currentUser) {
      void utils.achievement.getStats.invalidate();
      void utils.user.getAll.invalidate();
    }
  }, [activeTab, utils, currentUser]);

  const handleUserSelect = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem("push_challenge_user", name);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("push_challenge_user");
    setCurrentUser(null);
  };

  if (!isLoaded) return null;

  if (!currentUser) {
    return (
      <Layout>
        <UserGate onSelect={handleUserSelect} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8 flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Trophy className="text-amber-500 w-8 h-8" />
            The Challenge 2026
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Aktiv
              </p>
              <p className="font-bold text-slate-800">{currentUser}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              Abmelden
            </button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all",
              activeTab === "dashboard"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all",
              activeTab === "log"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <PenLine size={20} />
            Fortschritt
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all",
              activeTab === "register"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <UserPlus size={20} />
            Registrierung
          </button>
        </nav>

        <div className="transition-all duration-300">
          {activeTab === "dashboard" && (
            <Dashboard
              currentUser={currentUser}
              setCurrentUser={handleUserSelect}
            />
          )}
          {activeTab === "log" && (
            <LogForm
              currentUser={currentUser}
              onSuccess={() => {
                setActiveTab("dashboard");
              }}
            />
          )}
          {activeTab === "register" && (
            <RegisterForm
              currentUser={currentUser}
              onSuccess={(name: string) => {
                handleUserSelect(name);
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
