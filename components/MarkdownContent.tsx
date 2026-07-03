"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { GlossaryText } from "@/components/GlossaryText";
import type { GlossaryEntry } from "@/lib/schemas";

type TextRenderer = (text: string, offset: number) => ReactNode;

type Props = {
  text: string;
  className?: string;
  glossaryEntries?: GlossaryEntry[];
  renderText?: TextRenderer;
};

function wrapStrings(
  children: ReactNode,
  renderText: TextRenderer,
  offsetRef: { current: number },
): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      if (!child.trim()) {
        offsetRef.current += child.length;
        return child;
      }
      const start = offsetRef.current;
      offsetRef.current += child.length;
      return renderText(child, start);
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      return cloneElement(
        child,
        {},
        wrapStrings(child.props.children, renderText, offsetRef),
      );
    }
    return child;
  });
}

export function MarkdownContent({
  text,
  className,
  glossaryEntries = [],
  renderText,
}: Props) {
  const defaultRender: TextRenderer = (chunk, _offset) =>
    glossaryEntries.length > 0 ? (
      <GlossaryText text={chunk} entries={glossaryEntries} />
    ) : (
      chunk
    );
  const textRenderer = renderText ?? defaultRender;
  const offsetRef = { current: 0 };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={["p", "ul", "ol", "li", "strong", "em", "br"]}
        unwrapDisallowed
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">
              {wrapStrings(children, textRenderer, offsetRef)}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-outside list-disc space-y-1 pl-4 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-outside list-decimal space-y-1 pl-4 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {wrapStrings(children, textRenderer, offsetRef)}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">
              {wrapStrings(children, textRenderer, offsetRef)}
            </strong>
          ),
          em: ({ children }) => (
            <em>{wrapStrings(children, textRenderer, offsetRef)}</em>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
