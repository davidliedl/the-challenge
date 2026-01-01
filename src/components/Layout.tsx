import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {children}
    </div>
  );
}
