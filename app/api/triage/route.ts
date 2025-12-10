// app/api/triage/route.ts
import { NextResponse } from "next/server";
import {
  getCompiledGraph,
  type TicketState,
  type AgentMode,
  type AgentStep,
} from "@/lib/agent";

type TriageResponse = {
  ticketId: string;
  classification?: string;
  answer: string;
  requiresHuman?: boolean;
  mode: AgentMode;
  steps: AgentStep[];
  totalDurationMs: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ticketId = "T-demo", ticketText, mode } = body as {
      ticketId?: string;
      ticketText?: string;
      mode?: AgentMode;
    };

    if (!ticketText || typeof ticketText !== "string") {
      return NextResponse.json(
        { error: "ticketText is required" },
        { status: 400 }
      );
    }

    const safeMode: AgentMode = mode === "optimized" ? "optimized" : "base";

    const graph = getCompiledGraph();
    const initialState: TicketState = {
      ticketId,
      ticketText,
      mode: safeMode,
      steps: [],
    };

    const startedAt = Date.now();
    const result = await graph.invoke(initialState);
    const totalDurationMs = Date.now() - startedAt;

    const response: TriageResponse = {
      ticketId,
      classification: result.classification,
      answer: result.draftAnswer ?? "",
      requiresHuman: result.requiresHuman,
      mode: safeMode,
      steps: result.steps ?? [],
      totalDurationMs,
    };

    // Basic structured log for observability
    console.log(
      JSON.stringify(
        {
          event: "triage_completed",
          ticketId,
          mode: safeMode,
          classification: result.classification,
          requiresHuman: result.requiresHuman,
          totalDurationMs,
          stepSummary: (result.steps ?? []).map((s: AgentStep) => ({
            name: s.name,
            kind: s.kind,
            durationMs: s.durationMs,
          })),
        },
        null,
        2
      )
    );

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Error in /api/triage:", err);
    return NextResponse.json(
      {
        error: "Internal server error in /api/triage",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
