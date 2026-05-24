"use client";

import { AppShell } from "@/components/shell/AppShell";
import { ShellProvider } from "@/components/shell/ShellContext";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellProvider>
      <AppShell>{children}</AppShell>
    </ShellProvider>
  );
}
