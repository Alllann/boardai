"use client";

type Props = {
  text: string;
};

export function ChatUserBubble({ text }: Props) {
  return (
    <li className="flex justify-end py-1">
      <div className="max-w-[min(28rem,85%)] rounded-2xl rounded-br-sm bg-emerald-600 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm dark:bg-emerald-700">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-emerald-100/90">
          You
        </p>
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </li>
  );
}
