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
        onMenuClick={() => setMobileSidebarOpen(true)}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4 pt-12 text-center">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            What should the board help with?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Send a decision, plan, or question in any domain. The Chair will invite experts,
            run the discussion, and share a briefing — like a group chat.
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
    </div>
  );
}
