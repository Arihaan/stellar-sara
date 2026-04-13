"use client";

import { useState, useCallback, useRef } from "react";
import ResearchForm from "@/components/ResearchForm";
import AgentTimeline from "@/components/AgentTimeline";
import SpendingDashboard from "@/components/SpendingDashboard";
import ResearchReport from "@/components/ResearchReport";
import { ResearchEvent, TransactionRecord } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [report, setReport] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [activeBudget, setActiveBudget] = useState(1.0);
  const [currentSpent, setCurrentSpent] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(() => {
    if (!query.trim() || isRunning) return;

    setIsRunning(true);
    setEvents([]);
    setReport("");
    setTotalSpent(0);
    setTransactions([]);
    setActiveBudget(budget);
    setCurrentSpent(0);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), budget }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const dataLine = part
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;

            try {
              const event: ResearchEvent = JSON.parse(
                dataLine.slice("data: ".length),
              );
              setEvents((prev) => [...prev, event]);

              if (event.type === "tool_result") {
                setCurrentSpent((prev) => prev + event.cost);
                setTransactions((prev) => [
                  ...prev,
                  {
                    tool: event.tool,
                    endpoint: "",
                    cost: event.cost,
                    txHash: event.txHash,
                    timestamp: Date.now(),
                  },
                ]);
              }

              if (event.type === "complete") {
                setReport(event.report);
                setTotalSpent(event.totalSpent);
                setTransactions(event.transactions);
                setCurrentSpent(event.totalSpent);
              }
            } catch {
              // skip malformed
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setEvents((prev) => [
            ...prev,
            { type: "error", message: error.message },
          ]);
        }
      } finally {
        setIsRunning(false);
      }
    })();
  }, [query, budget, isRunning]);

  const hasActivity = events.length > 0;

  const formProps = {
    query,
    onQueryChange: setQuery,
    budget,
    onBudgetChange: setBudget,
    onSubmit: handleSubmit,
    isRunning,
  };

  return (
    <div className="min-h-screen relative noise">
      {/* Top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />

      {/* Header */}
      <header className="border-b border-[var(--color-border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-wide text-[var(--color-text)]">
            SARA{" "}
            <span className="text-[var(--color-text-secondary)] font-normal text-base hidden sm:inline">
              Stellar Autonomous Research Agent
            </span>
          </span>
          <span className="text-sm font-mono text-[var(--color-text-secondary)] uppercase tracking-widest">
            Powered by x402 on Stellar Testnet
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {/* Landing — two-column: info left, form right */}
        {!hasActivity && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-160px)] py-12">
            {/* Left: info */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--color-gold)] mb-6">
                Stellar Autonomous Research Agent
              </div>
              <h1 className="text-4xl sm:text-5xl font-light tracking-tight leading-[1.1] mb-6">
                The future of research
                <br />
                <span className="text-[var(--color-gold)] font-normal">
                  is autonomous.
                </span>
              </h1>
              <p className="text-[15px] text-[var(--color-text-secondary)] max-w-md leading-relaxed font-light mb-8">
                Deploy an AI agent that autonomously purchases real-time data
                from paid APIs on the Stellar blockchain — weather, markets,
                news, web content — using x402 micropayments in USDC.
                Set a budget, ask a question, and watch it work.
              </p>

              <div className="flex flex-col gap-4 text-[13px] text-[var(--color-text-secondary)]">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[var(--color-gold)] mt-px text-sm">01</span>
                  <span>Agent decomposes your query into data-gathering sub-tasks</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[var(--color-gold)] mt-px text-sm">02</span>
                  <span>Each task calls a paid API — real USDC moves on Stellar per call</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[var(--color-gold)] mt-px text-sm">03</span>
                  <span>Results are synthesized into a comprehensive research report</span>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-6 text-[11px] font-mono text-[var(--color-text-dim)] uppercase tracking-widest">
                <span>Weather</span>
                <span className="text-[var(--color-border)]">·</span>
                <span>News</span>
                <span className="text-[var(--color-border)]">·</span>
                <span>Markets</span>
                <span className="text-[var(--color-border)]">·</span>
                <span>Web Data</span>
              </div>
            </div>

            {/* Right: form */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-6 dot-grid">
              <ResearchForm {...formProps} />
            </div>
          </div>
        )}

        {/* Active state: form + log + sidebar */}
        {hasActivity && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 py-8">
            <div className="space-y-6 min-w-0">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                <ResearchForm {...formProps} />
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-5">
                <AgentTimeline events={events} isRunning={isRunning} />
              </div>

              {report && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-6 sm:p-8">
                  <ResearchReport
                    report={report}
                    totalSpent={totalSpent}
                    transactionCount={transactions.length}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-5 sticky top-4">
                <SpendingDashboard
                  budget={activeBudget}
                  spent={currentSpent}
                  transactions={transactions}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-subtle)] mt-8">
        <div className="max-w-7xl mx-auto px-6 py-5 text-center text-[11px] text-[var(--color-text-dim)] tracking-wide">
          SARA: Stellar Autonomous Research Agent
        </div>
      </footer>
    </div>
  );
}
