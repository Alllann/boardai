"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatBriefingCard } from "@/components/chat/ChatBriefingCard";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatExpertsInvite } from "@/components/chat/ChatExpertsInvite";
import { ChatGlossaryMessage } from "@/components/chat/ChatGlossaryMessage";
import { ChatSystemBubble } from "@/components/chat/ChatSystemBubble";
import { ChatUserBubble } from "@/components/chat/ChatUserBubble";
import { DiscussionTurn } from "@/components/DiscussionTurn";
import { ThreadHeader } from "@/components/shell/ThreadHeader";
import { useShell } from "@/components/shell/ShellContext";
import type { ExplainContextParams } from "@/components/SelectableExplain";
import { useBoardStream } from "@/hooks/useBoardStream";
import {
  buildBriefingSnippet,
  buildMeetingGoal,
  buildTranscriptSnippet,
} from "@/lib/explain-context";
import { loadSession } from "@/lib/session-store";

type Props = {
  sessionId: string;
};

export function BoardChatView({ sessionId }: Props) {
  const { state } = useBoardStream(sessionId);
  const { setMobileSidebarOpen, focusMode, setFocusMode } = useShell();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const SCROLL_BOTTOM_THRESHOLD = 80;

  const checkScrollPosition = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJumpToBottom(distanceFromBottom > SCROLL_BOTTOM_THRESHOLD);
  }, []);

  const jumpToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  const session = loadSession(sessionId);
  const title = session?.title ?? "Board session";

  const meetingPlan = state?.meetingPlan ?? null;
  const turns = useMemo(() => state?.turns ?? [], [state?.turns]);
  const briefing = state?.briefing ?? null;
  const glossary = state?.glossary ?? null;
  const loading = state?.loading ?? false;
  const error = state?.error ?? null;
  const brief = state?.brief ?? "";

  const roleById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof meetingPlan>["roles"][number]>();
    if (meetingPlan) {
      for (const r of meetingPlan.roles) map.set(r.id, r);
    }
    return map;
  }, [meetingPlan]);

  const explainDisabled = !brief.trim();

  const baseExplainContext = useMemo((): ExplainContextParams | undefined => {
    const userBrief = brief.trim();
    if (!userBrief) return undefined;
    return {
      source: "transcript",
      userBrief,
      meetingGoal: buildMeetingGoal(meetingPlan),
      transcriptSnippet: buildTranscriptSnippet(turns),
      briefingSnippet: briefing ? buildBriefingSnippet(briefing) : undefined,
    };
  }, [brief, meetingPlan, turns, briefing]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollPosition, { passive: true });
    checkScrollPosition();
    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition, turns.length, meetingPlan, briefing, glossary, loading]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const glossaryEntries = glossary?.entries ?? [];

  const statusMessage = (() => {
    if (!loading) return null;
    if (!meetingPlan) return "Chair is convening the board…";
    if (turns.length === 0) return "Inviting experts to the group…";
    if (!briefing) {
      if (meetingPlan && turns.length < meetingPlan.turnSchedule.length) {
        return `Discussion · ${turns.length} message${turns.length === 1 ? "" : "s"}`;
      }
      return "Writing briefing…";
    }
    if (!glossary) return "Building glossary…";
    return null;
  })();

  const headerActions = (
    <>
      <button
        type="button"
        onClick={() => setFocusMode(!focusMode)}
        className="hidden rounded-lg px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] sm:inline"
      >
        {focusMode ? "Show sidebar" : "Focus"}
      </button>
      {turns.length > 0 ? (
        <button
          type="button"
          onClick={() => copyText("transcript", JSON.stringify({ turns }, null, 2))}
          className="rounded-lg px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        >
          Copy JSON
        </button>
      ) : null}
      {briefing ? (
        <button
          type="button"
          onClick={() => copyText("briefing", JSON.stringify(briefing, null, 2))}
          className="rounded-lg px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        >
          Briefing
        </button>
      ) : null}
    </>
  );

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">
        Session not found
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader
        title={title}
        onMenuClick={() => setMobileSidebarOpen(true)}
        actions={headerActions}
      />

      {error ? (
        <div
          role="alert"
          className="mx-4 mt-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          {error}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div ref={chatScrollRef} className="h-full overflow-y-auto px-3 py-4">
          <ul className="mx-auto flex max-w-3xl flex-col gap-1">
          {brief ? <ChatUserBubble text={brief} /> : null}

          {loading && !meetingPlan ? (
            <ChatSystemBubble variant="status">Chair is convening the board…</ChatSystemBubble>
          ) : null}

          {meetingPlan ? <ChatExpertsInvite plan={meetingPlan} /> : null}

          {turns.map((t) => (
            <DiscussionTurn
              key={t.id}
              turn={t}
              role={roleById.get(t.roleId)}
              glossaryEntries={glossaryEntries}
              explainContext={
                baseExplainContext
                  ? {
                      ...baseExplainContext,
                      transcriptSnippet: buildTranscriptSnippet(turns, t.id),
                    }
                  : undefined
              }
              explainDisabled={explainDisabled}
            />
          ))}

          {loading && meetingPlan && turns.length === 0 ? (
            <ChatSystemBubble variant="status">Experts are joining the discussion…</ChatSystemBubble>
          ) : null}

          {briefing && baseExplainContext ? (
            <ChatBriefingCard
              briefing={briefing}
              glossaryEntries={glossaryEntries}
              explainContext={baseExplainContext}
              explainDisabled={explainDisabled}
            />
          ) : null}

          {glossaryEntries.length > 0 ? (
            <ChatGlossaryMessage entries={glossaryEntries} />
          ) : null}

          {statusMessage ? (
            <ChatSystemBubble variant="status">{statusMessage}</ChatSystemBubble>
          ) : null}
          </ul>
          <div ref={chatEndRef} className="h-1" aria-hidden />
        </div>

        {showJumpToBottom ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <button
              type="button"
              onClick={jumpToBottom}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[var(--border-light)] bg-[var(--main-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-md transition hover:bg-[var(--surface-hover)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Jump to bottom
            </button>
          </div>
        ) : null}
      </div>

      <ChatComposer
        value={brief}
        onChange={() => {}}
        onSubmit={() => {}}
        loading={loading}
        disabled
        variant="thread"
      />
    </div>
  );
}
