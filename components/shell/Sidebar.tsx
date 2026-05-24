"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  const activeId = pathname.startsWith("/c/") ? pathname.slice(3) : null;

  const goToSession = (id: string) => {
    router.push(`/c/${id}`);
    onNavigate?.();
  };

  return (
    <aside
      className={`flex h-full w-[260px] shrink-0 flex-col bg-[var(--sidebar-surface)] ${className}`}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            B
          </span>
          <span className="truncate text-sm font-semibold">Board AI</span>
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] md:inline-flex"
          aria-label="Collapse sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex w-full items-center gap-2 rounded-lg border border-[var(--border-light)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New board session
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 ? (
          <p className="px-2 py-4 text-xs text-[var(--text-secondary)]">No sessions yet</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                {group.label}
              </p>
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

      <div className="border-t border-[var(--border-light)] px-3 py-3 md:hidden">
        <button
          type="button"
          onClick={onNavigate}
          className="text-xs text-[var(--text-secondary)]"
        >
          Close sidebar
        </button>
      </div>
    </aside>
  );
}

export function SidebarRail() {
  const { setSidebarCollapsed } = useShell();

  return (
    <div className="hidden h-full w-14 shrink-0 flex-col items-center border-r border-[var(--border-light)] bg-[var(--sidebar-surface)] py-3 md:flex">
      <Link
        href="/"
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white"
      >
        B
      </Link>
      <button
        type="button"
        onClick={() => setSidebarCollapsed(false)}
        className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        aria-label="Open sidebar"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
