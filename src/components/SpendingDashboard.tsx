"use client";

import { TransactionRecord } from "@/lib/types";

interface Props {
  budget: number;
  spent: number;
  transactions: TransactionRecord[];
}

export default function SpendingDashboard({
  budget,
  spent,
  transactions,
}: Props) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - spent, 0);

  return (
    <div className="space-y-5">
      {/* Main balance display */}
      <div className="text-center py-4">
        <div className="text-xs font-mono font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mb-3">
          Budget Consumed
        </div>
        <div className="font-mono">
          <span className="text-3xl font-bold text-[var(--color-gold)] count-update">
            {spent.toFixed(2)}
          </span>
          <span className="text-lg text-[var(--color-text-secondary)] mx-1">/</span>
          <span className="text-lg text-[var(--color-text)]">
            {budget.toFixed(2)}
          </span>
          <span className="text-sm text-[var(--color-text-secondary)] ml-1.5">
            USDC
          </span>
        </div>

        {/* Bar */}
        <div className="mt-4 mx-auto max-w-[200px]">
          <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background:
                  pct < 60
                    ? "var(--color-gold)"
                    : pct < 85
                      ? "#f59e0b"
                      : "var(--color-rose)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] font-mono text-[var(--color-text-secondary)]">
            <span>{pct.toFixed(0)}%</span>
            <span>${remaining.toFixed(2)} left</span>
          </div>
        </div>
      </div>

      {/* Transaction ledger */}
      {transactions.length > 0 && (
        <div>
          <div className="text-xs font-mono font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mb-2">
            Transaction Ledger
          </div>
          <div className="space-y-px">
            {transactions.map((tx, i) => (
              <div
                key={i}
                className="slide-in flex items-center justify-between py-2.5 px-3 bg-[var(--color-bg)] border-b border-[var(--color-border-subtle)] first:rounded-t-lg last:rounded-b-lg last:border-0 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] shrink-0" />
                  <span className="text-xs font-mono text-[var(--color-text)] truncate">
                    {tx.tool.replace(/_/g, ".")}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-[var(--color-gold)]">
                    −${tx.cost.toFixed(2)}
                  </span>
                  {tx.txHash ? (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-[var(--color-text-dim)] hover:text-[var(--color-gold)] transition-colors"
                      title={tx.txHash}
                    >
                      {tx.txHash.slice(0, 6)}…
                    </a>
                  ) : (
                    <span className="text-[11px] font-mono text-[var(--color-border)]">
                      ------
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-[var(--color-border-subtle)] rounded-lg overflow-hidden">
        <div className="bg-[var(--color-surface)] p-3 text-center">
          <div className="text-[11px] font-mono uppercase text-[var(--color-text-secondary)] mb-1">
            Calls
          </div>
          <div className="text-base font-mono font-bold text-[var(--color-text)]">
            {transactions.length}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] p-3 text-center">
          <div className="text-[11px] font-mono uppercase text-[var(--color-text-secondary)] mb-1">
            Avg Cost
          </div>
          <div className="text-base font-mono font-bold text-[var(--color-text)]">
            $
            {transactions.length > 0
              ? (spent / transactions.length).toFixed(3)
              : "0.000"}
          </div>
        </div>
      </div>
    </div>
  );
}
