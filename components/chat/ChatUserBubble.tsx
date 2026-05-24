"use client";

type Props = {
  text: string;
};

export function ChatUserBubble({ text }: Props) {
  return (
    <li className="flex justify-end py-1">
      <div className="max-w-[min(28rem,85%)] rounded-3xl bg-[var(--user-msg-bg)] px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)]">
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </li>
  );
}
