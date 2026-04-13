"use client";

import { useEffect, useRef } from "react";
import { ResearchEvent } from "@/lib/types";

interface Props {
  events: ResearchEvent[];
  isRunning: boolean;
}

function timestamp() {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LogEntry({ event }: { event: ResearchEvent }) {
  const ts = timestamp();

  switch (event.type) {
    case "planning":
      return (
        <div className="slide-in flex gap-3 text-[13px] font-mono leading-relaxed">
          <span className="text-[var(--color-text-dim)] shrink-0 select-none">
            {ts}
          </span>
          <span className="text-[var(--color-text-dim)] shrink-0 select-none">
            SYS
          </span>
          <span className="text-[var(--color-text-secondary)]">
            {event.message}
          </span>
        </div>
      );

    case "tool_call":
      return (
        <div className="slide-in flex gap-3 text-[13px] font-mono leading-relaxed">
          <span className="text-[var(--color-text-dim)] shrink-0 select-none">
            {ts}
          </span>
          <span className="text-[var(--color-gold)] shrink-0 select-none font-medium">
            PAY
          </span>
          <div className="flex-1">
            <span className="text-[var(--color-text)]">
              {event.tool.replace(/_/g, ".")}
            </span>
            <span className="text-[var(--color-text-dim)]">(</span>
            <span className="text-[var(--color-teal)]">
              {Object.entries(event.params)
                .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                .join(", ")}
            </span>
            <span className="text-[var(--color-text-dim)]">)</span>
            <span className="ml-3 text-[var(--color-gold)]">
              −${event.cost.toFixed(2)}
            </span>
          </div>
        </div>
      );

    case "tool_result":
      return (
        <div className="slide-in flex gap-3 text-[13px] font-mono leading-relaxed">
          <span className="text-[var(--color-text-dim)] shrink-0 select-none">
            {ts}
          </span>
          <span className="text-[var(--color-teal)] shrink-0 select-none font-medium">
            OK{" "}
          </span>
          <div className="flex-1">
            <span className="text-[var(--color-text-secondary)]">
              {event.summary}
            </span>
            {event.txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-[var(--color-gold-dim)] hover:text-[var(--color-gold)] transition-colors"
              >
                tx:{event.txHash.slice(0, 8)}…
              </a>
            )}
          </div>
        </div>
      );

    case "synthesizing":
      return (
        <div className="slide-in flex gap-3 text-[13px] font-mono leading-relaxed">
          <span className="text-[var(--color-text-dim)] shrink-0 select-none">
            {ts}
          </span>
          <span className="text-[var(--color-gold)] shrink-0 select-none animate-pulse font-medium">
            GEN
          </span>
          <span className="text-[var(--color-text-secondary)]">
            {event.message}
          </span>
        </div>
      );

    case "error":
      return (
        <div className="slide-in flex gap-3 text-[13px] font-mono leading-relaxed">
          <span className="text-[var(--color-text-dim)] shrink-0 select-none">
            {ts}
          </span>
          <span className="text-[var(--color-rose)] shrink-0 select-none font-medium">
            ERR
          </span>
          <span className="text-[var(--color-rose)]">{event.message}</span>
        </div>
      );

    default:
      return null;
  }
}

export default function AgentTimeline({ events, isRunning }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleEvents = events.filter((e) => e.type !== "complete");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleEvents.length]);

  if (visibleEvents.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
          Agent Log
        </span>
        {isRunning && (
          <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--color-gold)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg p-4 max-h-[360px] overflow-y-auto space-y-2.5"
      >
        {visibleEvents.map((event, i) => (
          <LogEntry key={i} event={event} />
        ))}
        {isRunning && (
          <div className="flex gap-3 text-[13px] font-mono">
            <span className="text-[var(--color-text-dim)]">{timestamp()}</span>
            <span className="cursor-blink text-[var(--color-text-dim)]" />
          </div>
        )}
      </div>
    </div>
  );
}
