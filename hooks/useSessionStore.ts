"use client";

import { useCallback, useEffect, useState } from "react";

import {
  listSessionSummaries,
  SESSIONS_CHANGED_EVENT,
  type SessionSummary,
} from "@/lib/session-store";

export function useSessionList(): SessionSummary[] {
  const [sessions, setSessions] = useState<SessionSummary[]>(listSessionSummaries);

  const refresh = useCallback(() => {
    setSessions(listSessionSummaries());
  }, []);

  useEffect(() => {
    window.addEventListener(SESSIONS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SESSIONS_CHANGED_EVENT, refresh);
  }, [refresh]);

  return sessions;
}

export function useRefreshSessions(): () => void {
  const refresh = useCallback(() => {
    window.dispatchEvent(new Event(SESSIONS_CHANGED_EVENT));
  }, []);
  return refresh;
}
