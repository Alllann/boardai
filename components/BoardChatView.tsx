"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { ChatBriefingCard } from "@/components/chat/ChatBriefingCard";
import { ChatChairMessage } from "@/components/chat/ChatChairMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatExpertsInvite } from "@/components/chat/ChatExpertsInvite";
import { ChatProposalCard } from "@/components/chat/ChatProposalCard";
import { ChatUserBubble } from "@/components/chat/ChatUserBubble";
import { ChairTypingIndicator } from "@/components/ChairTypingIndicator";
import { DiscussionTurn } from "@/components/DiscussionTurn";
import { DiscussionTypingIndicator } from "@/components/DiscussionTypingIndicator";
import { ThreadHeader } from "@/components/shell/ThreadHeader";
import { GlossarySidebar, GlossarySidebarRail } from "@/components/shell/GlossarySidebar";
import { useShell } from "@/components/shell/ShellContext";
import type { ExplainContextParams } from "@/components/SelectableExplain";
import { useBoardStream } from "@/hooks/useBoardStream";
import {
  buildBriefingSnippet,
  buildMeetingGoal,
  buildTranscriptSnippet,
} from "@/lib/explain-context";
import {
  getContinuationFlags,
  getGroupFlags,
  getThreadSpeaker,
} from "@/lib/chat-grouping";
import { getMentionCandidates, loadSession } from "@/lib/session-store";
import type { ThreadItem, SessionTimelineEvent } from "@/lib/schemas";

type Props = {
  sessionId: string;
};

function isLegacyDiscussionCount(message: string): boolean {
  return /^Discussion · \d+ message/.test(message);
}

const LEGACY_STATUS_AS_CHAIR: Record<string, string> = {
  "Chair is convening the board…": "I'm convening the board and reviewing your brief…",
  "Chair is reviewing your brief…": "I'm reviewing your brief and putting together a roster for this session…",
  "Inviting experts to the group…": "Starting the discussion with your invited experts…",
  "Writing briefing…": "I'll wrap up with a briefing from this discussion…",
  "Building glossary…": "I'm building a glossary from this session…",
};

export function BoardChatView({ sessionId }: Props) {
  const {
    state,
    approveProposal,
    sendProposalReply,
    sendFollowUp,
    interruptDiscussion,
  } = useBoardStream(sessionId);
  const { setMobileSidebarOpen, focusMode, setFocusMode } = useShell();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const pinnedToBottomRef = useRef(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [glossaryExpanded, setGlossaryExpanded] = useState(false);
  const [invitedRoleIds, setInvitedRoleIds] = useState<string[]>([]);

  const SCROLL_BOTTOM_THRESHOLD = 80;

  const isNearBottom = useCallback((el: HTMLDivElement) => {
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
  }, []);

  const checkScrollPosition = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const nearBottom = isNearBottom(el);
    pinnedToBottomRef.current = nearBottom;
    setShowJumpToBottom(!nearBottom);
  }, [isNearBottom]);

  const jumpToBottom = useCallback(() => {
    pinnedToBottomRef.current = true;
    setShowJumpToBottom(false);
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  const session = loadSession(sessionId);
  const title = state?.title ?? session?.title ?? "Board session";

  const meetingPlan = state?.meetingPlan ?? null;
  const turns = useMemo(() => state?.turns ?? [], [state?.turns]);
  const briefing = state?.briefing ?? null;
  const glossary = state?.glossary ?? null;
  const loading = state?.loading ?? false;
  const error = state?.error ?? null;
  const brief = state?.brief ?? "";
  const timeline = state?.timeline ?? [];
  const thread = state?.thread ?? [];
  const pendingProposal = state?.pendingProposal ?? null;
  const streamingTurn = state?.streamingTurn ?? null;
  const streamingChair = state?.streamingChair ?? null;
  const status = state?.status ?? "idle";
  const roundCount = state?.roundCount ?? 1;
  const mentionCandidates = useMemo(
    () => (session ? getMentionCandidates(session) : []),
    [session],
  );

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
    if (pendingProposal) {
      setInvitedRoleIds([]);
    }
  }, [pendingProposal?.id]);

  const discussionInProgress =
    loading && !!meetingPlan && !briefing && !pendingProposal;

  const nextSpeakerRole = useMemo(() => {
    if (!discussionInProgress || !meetingPlan || streamingTurn) return null;
    const completedInRound = thread.filter(
      (t) => t.kind === "expert" && t.roundId === roundCount,
    ).length;
    const nextRoleId = meetingPlan.turnSchedule[completedInRound];
    if (!nextRoleId) return null;
    return roleById.get(nextRoleId) ?? null;
  }, [discussionInProgress, meetingPlan, thread, roundCount, roleById, streamingTurn]);

  const showChairTyping = useMemo(() => {
    if (!loading || streamingTurn || streamingChair) return false;
    if (pendingProposal) return false;
    if (!meetingPlan) return true;
    if (!briefing && meetingPlan && turns.length >= meetingPlan.turnSchedule.length) {
      return true;
    }
    return false;
  }, [
    loading,
    streamingTurn,
    streamingChair,
    pendingProposal,
    meetingPlan,
    briefing,
    turns.length,
  ]);

  useEffect(() => {
    pinnedToBottomRef.current = true;
    setShowJumpToBottom(false);
  }, [sessionId]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollPosition, { passive: true });
    checkScrollPosition();
    return () => el.removeEventListener("scroll", checkScrollPosition);
  }, [checkScrollPosition, turns.length, meetingPlan, briefing, glossary, loading, thread.length]);

  useEffect(() => {
    if (pinnedToBottomRef.current) {
      jumpToBottom();
    } else {
      checkScrollPosition();
    }
  }, [
    turns.length,
    thread.length,
    loading,
    jumpToBottom,
    checkScrollPosition,
    streamingTurn?.content.length,
    streamingChair?.content.length,
  ]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const glossaryEntries = glossary?.entries ?? [];

  const composerEnabled =
    status === "awaiting_user" ||
    discussionInProgress ||
    (!loading && status === "idle" && !!meetingPlan && !!glossary);

  const handleComposerSubmit = () => {
    const msg = composerValue.trim();
    if (!msg) return;
    if (discussionInProgress) {
      void interruptDiscussion(msg);
    } else if (status === "awaiting_user" && pendingProposal) {
      void sendProposalReply(msg);
    } else if (status === "idle" && !loading) {
      void sendFollowUp(msg);
    }
    setComposerValue("");
  };

  const handleSuggestChanges = () => {
    composerRef.current?.focus();
  };

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

  const threadItemKey = (item: ThreadItem, index: number): string => {
    switch (item.kind) {
      case "user":
      case "chair":
      case "status":
        return `${item.kind}-${item.id}`;
      case "expert":
        return `expert-${item.id}`;
      case "proposal":
        return `proposal-${item.payload.id}-${item.status}`;
      case "briefing":
        return `briefing-${item.roundId}-${index}`;
      default:
        return `thread-${index}`;
    }
  };

  const renderThreadItem = (
    item: ThreadItem,
    index: number,
    speakers: (string | null)[],
  ) => {
    const key = threadItemKey(item, index);
    const group = getGroupFlags(speakers, index);

    if (item.kind === "user") {
      return (
        <ChatUserBubble
          key={key}
          text={item.content}
          mentionCandidates={mentionCandidates}
          showName={group.showName}
        />
      );
    }

    if (item.kind === "status") {
      if (isLegacyDiscussionCount(item.message)) return null;
      const chairText = LEGACY_STATUS_AS_CHAIR[item.message] ?? item.message;
      return (
        <ChatChairMessage
          key={key}
          content={chairText}
          showAvatar={group.showAvatar}
          showName={group.showName}
        />
      );
    }

    if (item.kind === "proposal" && item.status === "pending" && pendingProposal) {
      return (
        <ChatProposalCard
          key={key}
          proposal={pendingProposal}
          invitedRoleIds={invitedRoleIds}
          onInvitedChange={setInvitedRoleIds}
          onApprove={() => void approveProposal(invitedRoleIds)}
          onSuggestChanges={handleSuggestChanges}
          loading={loading}
        />
      );
    }

    if (item.kind === "expert") {
      return (
        <DiscussionTurn
          key={key}
          turn={item}
          role={roleById.get(item.roleId)}
          glossaryEntries={glossaryEntries}
          explainContext={
            baseExplainContext
              ? {
                  ...baseExplainContext,
                  transcriptSnippet: buildTranscriptSnippet(turns, item.id),
                }
              : undefined
          }
          explainDisabled={explainDisabled}
          showAvatar={group.showAvatar}
          showName={group.showName}
        />
      );
    }

    if (item.kind === "chair") {
      return (
        <ChatChairMessage
          key={key}
          content={item.content}
          showAvatar={group.showAvatar}
          showName={group.showName}
        />
      );
    }

    if (item.kind === "briefing" && baseExplainContext) {
      return (
        <ChatBriefingCard
          key={key}
          briefing={item.payload}
          glossaryEntries={glossaryEntries}
          explainContext={baseExplainContext}
          explainDisabled={explainDisabled}
        />
      );
    }

    return null;
  };

  const renderLegacyTimeline = () => {
    const items: ReactNode[] = [];
    let lastSpeaker: string | null = null;

    if (brief) {
      const group = getContinuationFlags(lastSpeaker, "owner");
      lastSpeaker = "owner";
      items.push(
        <ChatUserBubble
          key="brief"
          text={brief}
          mentionCandidates={mentionCandidates}
          showName={group.showName}
        />,
      );
    }

    const preTurnEvents = timeline.filter((e: SessionTimelineEvent) => e.afterTurnCount === 0);
    for (const ev of preTurnEvents) {
      if (isLegacyDiscussionCount(ev.message)) continue;
      const chairText = LEGACY_STATUS_AS_CHAIR[ev.message] ?? ev.message;
      const group = getContinuationFlags(lastSpeaker, "chair");
      lastSpeaker = "chair";
      items.push(
        <ChatChairMessage
          key={ev.id}
          content={chairText}
          showAvatar={group.showAvatar}
          showName={group.showName}
        />,
      );
    }

    if (pendingProposal && status === "awaiting_user") {
      lastSpeaker = null;
      items.push(
        <ChatProposalCard
          key="proposal"
          proposal={pendingProposal}
          invitedRoleIds={invitedRoleIds}
          onInvitedChange={setInvitedRoleIds}
          onApprove={() => void approveProposal(invitedRoleIds)}
          onSuggestChanges={handleSuggestChanges}
          loading={loading}
        />,
      );
    }

    if (meetingPlan) {
      lastSpeaker = null;
      items.push(<ChatExpertsInvite key="invite" plan={meetingPlan} />);
    }

    turns.forEach((t, i) => {
      const turnEvents = timeline.filter((e: SessionTimelineEvent) => e.afterTurnCount === i + 1);
      for (const ev of turnEvents) {
        if (isLegacyDiscussionCount(ev.message)) continue;
        const chairText = LEGACY_STATUS_AS_CHAIR[ev.message] ?? ev.message;
        const group = getContinuationFlags(lastSpeaker, "chair");
        lastSpeaker = "chair";
        items.push(
          <ChatChairMessage
            key={ev.id}
            content={chairText}
            showAvatar={group.showAvatar}
            showName={group.showName}
          />,
        );
      }
      const speaker = `expert:${t.roleId}`;
      const group = getContinuationFlags(lastSpeaker, speaker);
      lastSpeaker = speaker;
      items.push(
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
          showAvatar={group.showAvatar}
          showName={group.showName}
        />,
      );
    });

    const postTurnEvents = timeline.filter(
      (e: SessionTimelineEvent) => e.afterTurnCount === turns.length,
    );
    for (const ev of postTurnEvents) {
      if (isLegacyDiscussionCount(ev.message)) continue;
      const chairText = LEGACY_STATUS_AS_CHAIR[ev.message] ?? ev.message;
      const group = getContinuationFlags(lastSpeaker, "chair");
      lastSpeaker = "chair";
      items.push(
        <ChatChairMessage
          key={`post-${ev.id}`}
          content={chairText}
          showAvatar={group.showAvatar}
          showName={group.showName}
        />,
      );
    }

    if (briefing && baseExplainContext) {
      lastSpeaker = null;
      items.push(
        <ChatBriefingCard
          key="briefing"
          briefing={briefing}
          glossaryEntries={glossaryEntries}
          explainContext={baseExplainContext}
          explainDisabled={explainDisabled}
        />,
      );
    }

    return items;
  };

  const renderThreadTimeline = () => {
    const items: ReactNode[] = [];
    let inviteShown = false;
    const speakers = thread.map(getThreadSpeaker);

    for (let index = 0; index < thread.length; index++) {
      const item = thread[index]!;
      if (!inviteShown && item.kind === "expert" && meetingPlan) {
        items.push(<ChatExpertsInvite key="invite" plan={meetingPlan} />);
        inviteShown = true;
      }
      const node = renderThreadItem(item, index, speakers);
      if (node) items.push(node);
    }

    if (!inviteShown && meetingPlan && turns.length > 0) {
      items.unshift(<ChatExpertsInvite key="invite" plan={meetingPlan} />);
    }

    return items;
  };

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">
        Session not found
      </div>
    );
  }

  const useThread = thread.length > 0;
  const chatItems = useThread ? renderThreadTimeline() : renderLegacyTimeline();

  const lastThreadSpeaker =
    thread.length > 0 ? getThreadSpeaker(thread[thread.length - 1]!) : null;

  const streamingTurnGroup = streamingTurn
    ? getContinuationFlags(lastThreadSpeaker, `expert:${streamingTurn.roleId}`)
    : null;
  const streamingChairGroup = streamingChair
    ? getContinuationFlags(lastThreadSpeaker, "chair")
    : null;
  const nextSpeakerGroup = nextSpeakerRole
    ? getContinuationFlags(
        streamingTurn
          ? `expert:${streamingTurn.roleId}`
          : lastThreadSpeaker,
        `expert:${nextSpeakerRole.id}`,
      )
    : null;
  const chairTypingGroup = showChairTyping
    ? getContinuationFlags(
        streamingChair ? "chair" : streamingTurn ? `expert:${streamingTurn.roleId}` : lastThreadSpeaker,
        "chair",
      )
    : null;

  const composerPlaceholder = discussionInProgress
    ? "Join the discussion…"
    : status === "awaiting_user"
      ? "Suggest a different goal or roster…"
      : undefined;

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

      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1">
          <div ref={chatScrollRef} className="h-full overflow-y-auto px-3 py-4">
            <ul className="mx-auto flex max-w-3xl flex-col gap-1">
              {chatItems}

              {streamingTurn ? (
                <DiscussionTurn
                  key={`streaming-${streamingTurn.id}`}
                  turn={{
                    id: streamingTurn.id,
                    roleId: streamingTurn.roleId,
                    roleName: streamingTurn.roleName,
                    content: streamingTurn.content || "…",
                  }}
                  role={roleById.get(streamingTurn.roleId)}
                  glossaryEntries={glossaryEntries}
                  streaming
                  showAvatar={streamingTurnGroup?.showAvatar ?? true}
                  showName={streamingTurnGroup?.showName ?? true}
                />
              ) : null}

              {streamingChair ? (
                <ChatChairMessage
                  key={`streaming-chair-${streamingChair.id}`}
                  content={streamingChair.content || "…"}
                  streaming
                  showAvatar={streamingChairGroup?.showAvatar ?? true}
                  showName={streamingChairGroup?.showName ?? true}
                />
              ) : null}

              {nextSpeakerRole ? (
                <DiscussionTypingIndicator
                  role={nextSpeakerRole}
                  showAvatar={nextSpeakerGroup?.showAvatar ?? true}
                  showName={nextSpeakerGroup?.showName ?? true}
                />
              ) : null}

              {showChairTyping ? (
                <ChairTypingIndicator
                  showAvatar={chairTypingGroup?.showAvatar ?? true}
                  showName={chairTypingGroup?.showName ?? true}
                />
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

        <GlossarySidebar
          entries={glossaryEntries}
          expanded={glossaryExpanded}
          onToggle={() => setGlossaryExpanded((v) => !v)}
        />
        <GlossarySidebarRail
          entries={glossaryEntries}
          expanded={glossaryExpanded}
          onToggle={() => setGlossaryExpanded(true)}
        />
      </div>

      {discussionInProgress ? (
        <p className="shrink-0 border-t border-zinc-100 px-4 py-1.5 text-center text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Discussion in progress — send anytime to jump in.
        </p>
      ) : null}

      <ChatComposer
        value={composerEnabled ? composerValue : brief}
        onChange={composerEnabled ? setComposerValue : () => {}}
        onSubmit={composerEnabled ? handleComposerSubmit : () => {}}
        loading={loading && !discussionInProgress}
        disabled={!composerEnabled}
        variant="thread"
        mentionCandidates={mentionCandidates}
        inputRef={composerRef}
        placeholder={composerPlaceholder}
      />
    </div>
  );
}
