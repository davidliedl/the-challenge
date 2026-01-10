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
    <div className="min-h-screen text-slate-900 font-sans antialiased pb-20">
      {currentUser && (
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Top Row: Title & User */}
          <header className="p-4 px-6 my-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="text-amber-500 w-6 md:w-10 h-6 md:h-10" />
              <h1 className="text-xl md:text-4xl font-black text-slate-800 tracking-tight">
                The Challenge 2026
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  AKTIV
                </p>
                <p className="text-sm font-black text-slate-800 leading-none">
                  {currentUser}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-100"
              >
                Abmelden
              </button>
            </div>
          </header>

          {/* Bottom Row: Navigation */}
          <nav className="bg-white rounded-3xl p-1.5 border-2 border-slate-800 grid grid-cols-3 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center py-3 rounded-2xl transition-all",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-800 hover:bg-slate-50 hover:text-slate-800"
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
