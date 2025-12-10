// app/page.tsx
"use client";

import Link from "next/link";

import { useState } from "react";

type AgentMode = "base" | "optimized";

type AgentStepKind = "langgraph" | "dspy";

type AgentStep = {
  name: string;
  kind: AgentStepKind;
  detail: string;
  durationMs?: number; // new
};

type TriageResponse = {
  ticketId: string;
  classification?: string;
  answer: string;
  requiresHuman?: boolean;
  mode: AgentMode;
  steps: AgentStep[];
  totalDurationMs: number; // new
};

export default function HomePage() {
  const [ticketText, setTicketText] = useState("");
  const [mode, setMode] = useState<AgentMode>("base");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setVisibleSteps(0);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketText, mode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const data = (await res.json()) as TriageResponse;
      setResult(data);
      if (data.steps.length > 0) {
        setVisibleSteps(1);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleNextStep() {
    if (!result) return;
    setVisibleSteps((prev) =>
      Math.min(prev + 1, result.steps.length || 0)
    );
  }

  const canShowNextStep =
    !!result && visibleSteps < (result.steps?.length ?? 0);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-slate-50">
      <div className="max-w-3xl w-full bg-white shadow-md rounded-2xl p-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">
            Agentic Support Triage Demo
          </h1>
          <p className="text-sm text-slate-600">
            This demo shows a simple{" "}
            <strong>agentic workflow</strong> built with{" "}
            <strong>LangGraph.js</strong>, with a conceptual{" "}
            <strong>DSPy optimization</strong> step.
            The agent:
            <br />
            1) classifies your ticket, 2) looks up a knowledge base, 3)
            drafts an answer, 4) optionally applies a DSPy-optimized
            module, and 5) decides whether to auto-resolve or send to a
            human.
          </p>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <div className="text-slate-600">
            <span className="font-semibold">API available:</span>{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded">
              POST /api/triage
            </code>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-full px-3 py-1 font-semibold border border-slate-300 bg-white hover:bg-slate-100"
            target="_blank"
          >
            View API docs (Swagger)
          </Link>
        </section>

        {/* Mode selector */}
        <section className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-slate-700">
            Execution mode:
          </span>
          <button
            type="button"
            onClick={() => setMode("base")}
            className={`rounded-full px-3 py-1 border text-xs font-semibold ${
              mode === "base"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-800 border-slate-300"
            }`}
          >
            LangGraph only
          </button>
          <button
            type="button"
            onClick={() => setMode("optimized")}
            className={`rounded-full px-3 py-1 border text-xs font-semibold ${
              mode === "optimized"
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-white text-slate-800 border-slate-300"
            }`}
          >
            LangGraph + DSPy (conceptual)
          </button>
        </section>

        <form onSubmit={handleRun} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Paste a sample support ticket
          </label>
          <textarea
            className="w-full h-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="e.g. I need to update my credit card for billing, the old one expired..."
            value={ticketText}
            onChange={(e) => setTicketText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !ticketText.trim()}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-sky-600 text-white disabled:opacity-50"
            >
              {loading ? "Running agent..." : "Run agent flow"}
            </button>
            {result && result.steps.length > 0 && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!canShowNextStep}
                className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border border-slate-300 bg-white disabled:opacity-40"
              >
                {canShowNextStep ? "Next step in flow" : "All steps shown"}
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg p-3">
            {error}
          </div>
        )}

{result && (
          <section className="space-y-4 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Classification
                </span>
                <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {result.classification ?? "(unknown)"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Human-in-the-loop
                </span>
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    result.requiresHuman
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {result.requiresHuman
                    ? "Needs human review"
                    : "Safe to auto-resolve (demo logic)"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Mode
                </span>
                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                  {result.mode === "optimized"
                    ? "LangGraph + DSPy (simulated)"
                    : "LangGraph only"}
                </div>
              </div>
            </div>

            {/* Observability summary */}
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold">End-to-end latency: </span>
                <span>{result.totalDurationMs} ms</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Per-node timings shown in the execution timeline below.
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Final agent answer</h2>
              <pre className="text-xs whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3">
                {result.answer}
              </pre>
            </div>

            {/* Execution timeline (already present) */}

            {/* Execution timeline */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Execution timeline (LangGraph + DSPy)
              </h3>

              {result.steps.length > 0 && (
                <p className="text-[11px] text-slate-500 mb-1">
                  Showing <strong>{visibleSteps}</strong> of{" "}
                  <strong>{result.steps.length}</strong> steps
                </p>
              )}

              {result.steps.length === 0 && (
                <p className="text-xs text-slate-500">
                  No steps recorded. (This shouldn&apos;t happen in this demo.)
                </p>
              )}

              <ol className="space-y-2 text-xs">
                {result.steps.slice(0, visibleSteps).map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 border-l border-slate-200 pl-3"
                  >
                    <span
                      className={`mt-0.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                        step.kind === "dspy"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
  <div className="font-semibold">
    {step.name}{" "}
    {step.kind === "dspy" && (
      <span className="ml-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
        DSPy
      </span>
    )}
  </div>
  <div className="text-slate-600">{step.detail}</div>
  {typeof step.durationMs === "number" && (
    <div className="text-[10px] text-slate-400 mt-0.5">
      Duration: {step.durationMs} ms
    </div>
  )}
</div>

                  </li>
                ))}
              </ol>

              {result.steps.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  Use{" "}
                  <span className="font-semibold">“Next step in flow”</span>{" "}
                  to walk node-by-node through the LangGraph graph,
                  including the conceptual DSPy optimization step.
                </p>
              )}
            </div>
          </section>
        )}

        <footer className="text-[11px] text-slate-500 border-t pt-3">
          Architecture: Next.js UI → <code>/api/triage</code> →
          LangGraph.js <code>StateGraph</code> →
          SOP nodes (classify, retrieve KB, draft) →
          DSPy optimization node →
          decision node.
        </footer>
      </div>
    </main>
  );
}
