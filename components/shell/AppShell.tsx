"use client";

import { useEffect, type ReactNode } from "react";

import { Sidebar, SidebarRail } from "./Sidebar";
import { useShell } from "./ShellContext";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    focusMode,
  } = useShell();

  const showSidebar = !focusMode && !sidebarCollapsed;
  const showRail = !focusMode && sidebarCollapsed;

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--main-surface)]">
      {showSidebar ? (
        <div className="hidden h-full md:block">
          <Sidebar />
        </div>
      ) : null}

      {showRail ? <SidebarRail /> : null}

      {mobileSidebarOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] md:hidden"
            aria-label="Close sidebar overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
