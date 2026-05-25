"use client";

type Props = {
  content: string;
};

export function ChatChairMessage({ content }: Props) {
  return (
    <li className="flex justify-start py-0.5">
      <div className="max-w-[min(36rem,92%)] rounded-2xl rounded-tl-sm border border-amber-200/80 bg-amber-50/95 px-3.5 py-2.5 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/40">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100"
            aria-hidden
          >
            C
          </span>
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Chair</p>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {content}
        </p>
      </div>
    </li>
  );
}
