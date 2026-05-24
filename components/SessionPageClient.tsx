"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BoardChatView } from "@/components/BoardChatView";
import { loadSession } from "@/lib/session-store";

type Props = {
  sessionId: string;
};

export function SessionPageClient({ sessionId }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!loadSession(sessionId)) {
      router.replace("/");
    }
  }, [sessionId, router]);

  return <BoardChatView sessionId={sessionId} />;
}
