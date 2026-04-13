"use client";

const EXAMPLE_QUERIES = [
  {
    label: "Crypto + Economics",
    query:
      "What's happening in the crypto market today and how might global economic news affect Bitcoin?",
  },
  {
    label: "Weather + Tech",
    query:
      "What's the weather like in major tech hubs and what's the latest in AI?",
  },
  {
    label: "Security + Blockchain",
    query:
      "Research the latest cybersecurity threats and their potential impact on blockchain",
  },
  {
    label: "Gaming + Entertainment",
    query:
      "How is the gaming industry doing and what are the latest entertainment trends?",
  },
];

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  budget: number;
  onBudgetChange: (budget: number) => void;
  onSubmit: () => void;
  isRunning: boolean;
}

export default function ResearchForm({
  query,
  onQueryChange,
  budget,
  onBudgetChange,
  onSubmit,
  isRunning,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isRunning) return;
    onSubmit();
  };

  const callCount = Math.floor(budget / 0.01);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Query input */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label
            htmlFor="query"
            className="text-xs font-mono font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]"
          >
            Research Directive
          </label>
          <span className="text-[11px] font-mono text-[var(--color-text-dim)]">
            {query.length > 0 ? `${query.length} chars` : ""}
          </span>
        </div>
        <textarea
          id="query"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Describe the intelligence you need..."
          rows={3}
          readOnly={isRunning}
          className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-gold-dim)] focus:ring-1 focus:ring-[var(--color-gold-dim)] resize-none read-only:opacity-70 transition-colors leading-relaxed"
        />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_QUERIES.map((eq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onQueryChange(eq.query)}
            disabled={isRunning}
            className="text-[11px] font-mono px-2.5 py-1 border border-[var(--color-border)] hover:border-[var(--color-gold-dim)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] rounded transition-all disabled:opacity-30 uppercase tracking-wider"
          >
            {eq.label}
          </button>
        ))}
      </div>

      {/* Budget control */}
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs font-mono font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Budget Allocation
          </span>
          <span className="font-mono text-xl font-bold text-[var(--color-gold-bright)]">
            ${budget.toFixed(2)}
            <span className="text-[var(--color-text-secondary)] text-xs ml-1.5 font-medium">
              USDC
            </span>
          </span>
        </div>

        {/* Styled range slider */}
        <div className="relative py-2">
          <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold-dim)] to-[var(--color-gold)]"
              style={{ width: `${((budget - 0.05) / (5 - 0.05)) * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0.05}
            max={5}
            step={0.01}
            value={budget}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            disabled={isRunning}
            className="relative w-full h-2 appearance-none bg-transparent cursor-pointer disabled:opacity-40 z-10
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-gold-bright)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(232,212,139,0.5)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-gold)]
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-gold-bright)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-gold)] [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-track]:bg-transparent"
          />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-[11px] font-mono text-[var(--color-text-dim)]">
            $0.05
          </span>
          <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
            ≈ {callCount} data queries
          </span>
          <span className="text-[11px] font-mono text-[var(--color-text-dim)]">
            $5.00
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!query.trim() || isRunning}
        className="w-full py-3.5 bg-[var(--color-gold)] hover:bg-[var(--color-gold-bright)] hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] active:scale-[0.98] disabled:bg-[var(--color-border)] disabled:shadow-none disabled:scale-100 text-[var(--color-bg)] disabled:text-[var(--color-text-dim)] font-mono text-sm font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <>
            <span className="w-3 h-3 border-2 border-[var(--color-bg)] border-t-transparent rounded-full animate-spin" />
            Agent Running
          </>
        ) : (
          "Deploy Agent"
        )}
      </button>
    </form>
  );
}
