"use client";

import { useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface Props {
  report: string;
  totalSpent: number;
  transactionCount: number;
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold text-[var(--color-text)] mt-0 mb-4 pb-2 border-b border-[var(--color-border)]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <div className="mt-6 mb-3">
      <h2 className="text-base font-semibold text-[var(--color-gold)] flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] shrink-0" />
        {children}
      </h2>
      <div className="h-px bg-[var(--color-border-subtle)] mt-2" />
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-medium text-[var(--color-text)] mt-4 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-dim)] mt-3 mb-1.5">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[var(--color-text-secondary)] leading-[1.75] my-2">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 space-y-1.5 text-sm text-[var(--color-text-secondary)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 space-y-1.5 text-sm text-[var(--color-text-secondary)] list-decimal list-inside">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 leading-[1.7]">
      <span className="text-[var(--color-gold-dim)] mt-[7px] shrink-0 text-[6px]">
        ◆
      </span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="text-[var(--color-text)] font-medium">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-[var(--color-text-secondary)] italic">{children}</em>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg p-4 text-xs font-mono text-[var(--color-text-secondary)] overflow-x-auto my-3">
          {children}
        </code>
      );
    }
    return (
      <code className="font-mono text-[0.85em] text-[var(--color-gold)] bg-[var(--color-surface-raised)] px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--color-gold-dim)] pl-4 my-3 text-sm text-[var(--color-text-dim)] italic">
      {children}
    </blockquote>
  ),
  hr: () => (
    <div className="my-6 h-px bg-gradient-to-r from-[var(--color-border-subtle)] via-[var(--color-border)] to-[var(--color-border-subtle)]" />
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-teal)] hover:text-[var(--color-teal)]/80 underline underline-offset-2 decoration-[var(--color-teal)]/30"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => <pre className="my-3">{children}</pre>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-[var(--color-border-subtle)]">
      <table className="w-full text-xs font-mono">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--color-surface-raised)] text-[var(--color-text-dim)] uppercase tracking-wider">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[var(--color-text-secondary)] border-t border-[var(--color-border-subtle)]">
      {children}
    </td>
  ),
};

export default function ResearchReport({
  report,
  totalSpent,
  transactionCount,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = useCallback(async () => {
    const el = contentRef.current;
    if (!el) return;

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [12, 16, 12, 16] as [number, number, number, number],
      filename: `sara-report-${Date.now()}.pdf`,
      image: { type: "jpeg" as const, quality: 0.95 },
      html2canvas: {
        scale: 2,
        backgroundColor: "#0c0b09",
        useCORS: true,
      },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    };

    html2pdf().set(opt).from(el).save();
  }, []);

  if (!report) return null;

  return (
    <div>
      {/* Report header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs font-mono font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mb-1">
            Research Output
          </div>
          <div className="text-[11px] font-mono text-[var(--color-text-dim)]">
            Synthesized from {transactionCount} paid data source
            {transactionCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right shrink-0">
            <div className="font-mono text-base font-bold text-[var(--color-gold)]">
              ${totalSpent.toFixed(2)}
            </div>
            <div className="text-[11px] font-mono text-[var(--color-text-dim)]">
              USDC spent
            </div>
          </div>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-[var(--color-border)] hover:border-[var(--color-gold-dim)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] rounded-lg transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Gold top rule */}
      <div className="h-px bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-gold-dim)] to-transparent mb-6" />

      {/* Report content — ref'd for PDF capture */}
      <div ref={contentRef} className="min-w-0">
        <ReactMarkdown components={mdComponents}>{report}</ReactMarkdown>
      </div>

      {/* Footer rule */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent mt-8 mb-4" />
      <div className="text-center">
        <span className="text-[9px] font-mono text-[var(--color-text-dim)] uppercase tracking-[0.3em]">
          End of Report
        </span>
      </div>
    </div>
  );
}
