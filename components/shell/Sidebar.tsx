"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSessionList } from "@/hooks/useSessionStore";
import { groupSessionsByDate } from "@/lib/session-store";

import { SidebarItem } from "./SidebarItem";
import { useShell } from "./ShellContext";

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className = "", onNavigate }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sessions = useSessionList();
  const { toggleSidebar } = useShell();
  const groups = groupSessionsByDate(sessions);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeId = pathname.startsWith("/c/") ? pathname.slice(3) : null;

  const goToSession = (id: string) => {
    router.push(`/c/${id}`);
    onNavigate?.();
  };

  return (
    <aside
      className={`flex h-full w-[220px] shrink-0 flex-col bg-[var(--sidebar-surface)] ${className}`}
    >
      <div className="flex items-center gap-1 px-3 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full px-2 py-1.5 text-[var(--text-primary)] transition hover:bg-[var(--sidebar-hover)]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[11px] font-medium text-[var(--text-primary)]">
            B
          </span>
          <span className="truncate text-sm font-normal">Board AI</span>
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden rounded-full p-2 text-[var(--text-tertiary)] transition hover:bg-[var(--sidebar-hover)] md:inline-flex"
          aria-label="Collapse sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New session
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!mounted ? null : groups.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[var(--text-tertiary)]">No sessions yet</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 py-1.5 text-[11px] text-[var(--text-tertiary)]">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((s) => (
                  <li key={s.id}>
                    <SidebarItem
                      title={s.title}
                      active={activeId === s.id}
                      running={s.status === "running"}
                      onClick={() => goToSession(s.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      <div className="px-3 py-3 md:hidden">
        <button type="button" onClick={onNavigate} className="text-xs text-[var(--text-tertiary)]">
          Close
        </button>
      </div>
    </aside>
  );
}

export function SidebarRail() {
  const { setSidebarCollapsed } = useShell();

  return (
    <div className="hidden h-full w-11 shrink-0 flex-col items-center bg-[var(--sidebar-surface)] py-4 md:flex">
      <Link
        href="/"
        className="mb-4 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[10px] font-medium"
      >
        B
      </Link>
      <button
        type="button"
        onClick={() => setSidebarCollapsed(false)}
        className="rounded-full p-2 text-[var(--text-tertiary)] transition hover:bg-[var(--sidebar-hover)]"
        aria-label="Open sidebar"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
