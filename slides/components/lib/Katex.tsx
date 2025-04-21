import katex from "katex";
import React from "react";

export function Katex({
  className,
  text,
}: {
  className?: string;
  text: string;
}) {
  const parts = text.split(/(\$.*?\$)/gs);

  return (
    <span className={`inline-flex flex-row ${className ?? ""}`}>
      {parts.map((part, i) =>
        part.startsWith("$") && part.endsWith("$") ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(
                part.slice(1, -1), // Remove the $$
                { displayMode: false }
              ),
            }}
          />
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function KatexBlock({
  className,
  text,
}: {
  className?: string;
  text: string;
}) {
  const parts = text.split(/(\$.*?\$)/gs);

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      {parts.map((part, i) =>
        part.startsWith("$") && part.endsWith("$") ? (
          <p
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(
                part.slice(1, -1), // Remove the $
                { displayMode: true }
              ),
            }}
          />
        ) : (
          <p key={i}>{part}</p>
        )
      )}
    </div>
  );
}
