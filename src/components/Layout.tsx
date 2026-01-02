"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy,
  LayoutDashboard,
  ListChecks,
  UserCheck,
  LogOut,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("push_challenge_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    } else if (pathname !== "/") {
      // If no user and not on home page, maybe redirect?
      // For now let's just keep it simple as the home page handles UserGate.
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("push_challenge_user");
    setCurrentUser(null);
    router.push("/");
  };

  const navItems = [
    { name: "STATUS", href: "/status", icon: UserCheck },
    { name: "RENNEN", href: "/race", icon: Trophy },
    { name: "ÜBERBLICK", href: "/overview", icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased pb-20">
      {currentUser && (
        <div className="container mx-auto px-4 pt-6 space-y-4 max-w-6xl">
          {/* Top Row: Title & User */}
          <header className="bg-white rounded-3xl p-4 px-6 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-amber-500 w-6 h-6" />
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                The Challenge 2026
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden xs:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  AKTIV
                </p>
                <p className="text-sm font-black text-slate-800 leading-none">
                  {currentUser}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
              >
                Abmelden
              </button>
            </div>
          </header>

          {/* Bottom Row: Navigation */}
          <nav className="bg-white rounded-3xl p-2 border border-slate-100 grid grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center gap-3 px-4 py-3 rounded-2xl transition-all",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-bold text-sm hidden sm:block">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
      <main className="container mx-auto px-4 py-8 max-w-6xl">{children}</main>
    </div>
  );
}
