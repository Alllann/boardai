"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { ThreadHeader } from "@/components/shell/ThreadHeader";
import { useShell } from "@/components/shell/ShellContext";
import { createSession } from "@/lib/session-store";

export function HomePageClient() {
  const router = useRouter();
  const { setMobileSidebarOpen } = useShell();
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const session = createSession(trimmed);
    router.push(`/c/${session.id}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title="Board AI"
        minimal
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      <main className="flex min-h-0 flex-1 items-center justify-center px-6 pb-[12vh] pt-6 md:px-10 lg:px-16">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-[1.625rem] font-normal leading-snug tracking-tight text-[var(--text-primary)] md:text-[1.75rem]">
              What should the board help with?
            </h2>
            <p className="mx-auto mt-2.5 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Describe a decision, plan, or question. The Chair will invite
              experts and share a briefing.
            </p>
          </div>

          <ChatComposer
            value={brief}
            onChange={setBrief}
            onSubmit={() => handleSubmit(brief)}
            loading={submitting}
            disabled={submitting}
            variant="home"
          />
        </div>
      </main>
    </div>
  );
}
