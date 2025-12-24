"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const START_EVENT = "route-loading:start";

// simple emitter to fire from links before navigation completes
export function emitRouteLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(START_EVENT));
  }
}

export function RouteLoading() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timeout = setTimeout(() => setActive(false), 1200);
    return () => clearTimeout(timeout);
  }, [pathname]);

  // listen for early trigger (e.g., onClick)
  useEffect(() => {
    const handler = () => {
      setActive(true);
      setTimeout(() => setActive(false), 1500);
    };
    window.addEventListener(START_EVENT, handler);
    return () => window.removeEventListener(START_EVENT, handler);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-4 z-[60] transition-opacity duration-500",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="mx-auto w-max rounded-2xl bg-white/85 px-4 py-3 shadow-lg shadow-orange-500/10 ring-1 ring-orange-200/60 backdrop-blur-md dark:bg-slate-800/85 dark:ring-slate-700/80">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 animate-loading-bounce" />
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 animate-loading-bounce" style={{ animationDelay: "120ms" }} />
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 animate-loading-bounce" style={{ animationDelay: "240ms" }} />
          <span className="ml-2 text-xs font-semibold text-orange-700 dark:text-orange-200 tracking-wide">
            Memuat halaman...
          </span>
        </div>
      </div>
    </div>
  );
}
