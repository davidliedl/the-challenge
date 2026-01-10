"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { UserGate } from "~/components/UserGate";
import { Trophy } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("push_challenge_user");
    if (savedUser) {
      setCurrentUser(savedUser);
      router.push("/status");
    }
    setIsLoaded(true);
  }, [router]);

  const handleUserSelect = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem("push_challenge_user", name);
    router.push("/status");
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 bg-amber-500 rounded-3xl animate-bounce transition-all">
          <Trophy className="text-white w-12 h-12" />
        </div>
        <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">
          The Challenge <span className="text-amber-500">2026</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">
          Push yourself to the next level
        </p>
      </header>

      <div className="w-full">
        <UserGate onSelect={handleUserSelect} />
      </div>
    </div>
  );
}
