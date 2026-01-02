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
    { name: "DEIN STATUS", href: "/status", icon: UserCheck },
    { name: "RENNEN", href: "/race", icon: Trophy },
    { name: "ÜBERBLICK", href: "/overview", icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-20">
      {currentUser && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/status" className="flex items-center gap-2">
                <div className="bg-amber-500 p-1.5 rounded-full shadow-sm">
                  <Trophy className="text-white w-5 h-5" />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-800 hidden sm:block">
                  PUSH
                </span>
              </Link>

              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all",
                        isActive
                          ? "bg-slate-800 text-white shadow-md shadow-slate-200"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <Icon size={18} />
                      <span className="hidden md:block">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4">
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
                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                title="Abmelden"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
      )}
      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  );
}
