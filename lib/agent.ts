// lib/agent.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import type { RunnableLike } from "@langchain/core/runnables";
import { retrieveKB, KBArticle } from "./kb";

export type AgentMode = "base" | "optimized";

export type AgentStepKind = "langgraph" | "dspy";

export type AgentStep = {
  name: string;
  kind: AgentStepKind;
  detail: string;
  durationMs?: number; // observability: how long this node took
};

export type TicketState = {
  ticketId: string;
  ticketText: string;
  classification?: string;
  kbResults?: KBArticle[];
  draftAnswer?: string;
  requiresHuman?: boolean;
  mode: AgentMode;
  steps: AgentStep[];
};

// ---------- SOP helpers ----------

function classifyTicket(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("invoice") || lower.includes("card")) return "billing";
  if (lower.includes("error") || lower.includes("bug")) return "bug";
  if (lower.includes("how do i") || lower.includes("how to")) return "how_to";
  return "other";
}

// Totally free "mock model" – no external API needed
async function mockDraftAnswer(
  ticketText: string,
  kb: KBArticle[]
): Promise<string> {
  const kbText = kb.map((k) => `• ${k.title}: ${k.content}`).join("\n");
  return [
    "This is a demo draft answer from a mock model.",
    "",
    "Ticket:",
    ticketText,
    "",
    "Relevant knowledge:",
    kbText || "(no matching articles, so this is mostly generic guidance.)",
  ].join("\n");
}

// Conceptual “DSPy-compiled” optimizer (simple version)
// Conceptual “DSPy-compiled” optimizer
function dspyOptimizeAnswer(draft: string | undefined, mode: AgentMode): string {
    if (!draft) return "";
  
    // In base mode, just return the raw mock LLM answer.
    if (mode === "base") return draft;
  
    const lower = draft.toLowerCase();
  
    // Very simple intent detection based on keywords
    const isBilling =
      lower.includes("billing") ||
      lower.includes("credit card") ||
      lower.includes("payment");
    const isPassword =
      lower.includes("password") || lower.includes("login") || lower.includes("reset");
  
    if (isBilling) {
      return [
        "✅ DSPy-Optimized Answer — Billing / Credit Card",
        "",
        "1. Summary",
        "You can update your credit card from the Billing section in your account settings.",
        "",
        "2. Steps to Resolve",
        "1) Open the app or web portal and sign in to your account.",
        "2) Go to **Settings** (usually under your profile or account menu).",
        "3) Open **Billing** or **Payment Method**.",
        "4) Click **Edit** or **Update card**.",
        "5) Enter your new card details and save the changes.",
        "",
        "3. What to Check",
        "- Make sure there are no error messages after you save.",
        "- Confirm that your next invoice shows the updated card.",
        "",
        "4. When to Contact Support",
        "- You don’t see a Billing or Payment Method section.",
        "- The card is declined or you get repeated errors when saving.",
        "- The account is managed by an admin or a billing contact.",
      ].join("\n");
    }
  
    if (isPassword) {
      return [
        "✅ DSPy-Optimized Answer — Password / Login",
        "",
        "1. Summary",
        "You can reset your password using the 'Forgot password' link on the login screen.",
        "",
        "2. Steps to Resolve",
        "1) Go to the login page.",
        "2) Click **Forgot password**.",
        "3) Enter the email address associated with your account.",
        "4) Open the reset email and click the link.",
        "5) Choose a new password and confirm.",
        "",
        "3. What to Check",
        "- The reset email may take a few minutes to arrive.",
        "- Check your spam/junk folder if you don’t see it.",
        "",
        "4. When to Contact Support",
        "- You no longer have access to the email on the account.",
        "- The reset link is expired or doesn’t work.",
      ].join("\n");
    }
  
    // Generic fallback for other intents
    return [
      "✅ DSPy-Optimized Answer — General Support Request",
      "",
      "1. Summary",
      "Here is a concise, structured response based on your request and our internal guidance.",
      "",
      "2. Next Steps",
      "- Follow the instructions provided above.",
      "- If anything doesn’t match what you see on screen, capture a screenshot if possible.",
      "",
      "3. When to Contact Support",
      "- You tried the recommended steps and the issue persists.",
      "- The impact is high (e.g., you can’t access the product or data is at risk).",
    ].join("\n");
  }
  

// ---------- LangGraph nodes ----------
// Each node returns only the fields it changes (delta),
// and we let the channels config merge them into the state.
// We now also track `durationMs` for each node.

async function classifyNode(
  state: TicketState
): Promise<Partial<TicketState>> {
  const startedAt = Date.now();

  const classification = classifyTicket(state.ticketText);

  const durationMs = Date.now() - startedAt;
  const step: AgentStep = {
    name: "Classify ticket",
    kind: "langgraph",
    detail: `Classified as: ${classification}`,
    durationMs,
  };

  return {
    classification,
    steps: [step],
  };
}

async function retrieveNode(
  state: TicketState
): Promise<Partial<TicketState>> {
  const startedAt = Date.now();

  const kbResults = retrieveKB(state.ticketText);

  const durationMs = Date.now() - startedAt;
  const step: AgentStep = {
    name: "Retrieve KB",
    kind: "langgraph",
    detail: `Found ${kbResults.length} relevant KB article(s).`,
    durationMs,
  };

  return {
    kbResults,
    steps: [step],
  };
}

async function draftAnswerNode(
  state: TicketState
): Promise<Partial<TicketState>> {
  const startedAt = Date.now();

  const kb = state.kbResults ?? [];
  const draftAnswer = await mockDraftAnswer(state.ticketText, kb);

  const durationMs = Date.now() - startedAt;
  const step: AgentStep = {
    name: "Draft answer (LLM)",
    kind: "langgraph",
    detail: "Generated an initial answer using the mock model.",
    durationMs,
  };

  return {
    draftAnswer,
    steps: [step],
  };
}

// Conceptual DSPy step in the graph
async function dspyOptimizeNode(
  state: TicketState
): Promise<Partial<TicketState>> {
  const startedAt = Date.now();

  const optimized = dspyOptimizeAnswer(state.draftAnswer, state.mode);

  const durationMs = Date.now() - startedAt;
  const step: AgentStep = {
    name: "DSPy optimization",
    kind: "dspy",
    detail:
      state.mode === "optimized"
        ? "Applied DSPy-optimized module to restructure and harden the answer."
        : "Skipped optimization (base mode).",
    durationMs,
  };

  return {
    draftAnswer: optimized,
    steps: [step],
  };
}

async function decisionNode(
  state: TicketState
): Promise<Partial<TicketState>> {
  const startedAt = Date.now();

  const classification = state.classification ?? "other";
  const requiresHuman = classification === "bug" || classification === "other";

  const durationMs = Date.now() - startedAt;
  const step: AgentStep = {
    name: "Decide auto vs human",
    kind: "langgraph",
    detail: requiresHuman
      ? "Ticket requires human-in-the-loop."
      : "Safe to auto-resolve (demo logic).",
    durationMs,
  };

  return {
    requiresHuman,
    steps: [step],
  };
}

async function finalizeNode(
  _state: TicketState
): Promise<Partial<TicketState>> {
  const startedAt = Date.now();

  // In a real system, you might log state, emit metrics, etc.

  const durationMs = Date.now() - startedAt;
  const step: AgentStep = {
    name: "Finalize",
    kind: "langgraph",
    detail: "Final state ready to return to the caller.",
    durationMs,
  };

  return {
    steps: [step],
  };
}

// ---------- Build & compile graph using channels ----------

let compiledGraph: RunnableLike<TicketState, TicketState> | null = null;

export function getCompiledGraph(): RunnableLike<TicketState, TicketState> {
  if (compiledGraph) return compiledGraph;

  const builder = new StateGraph({
    channels: {
      ticketId: {
        default: () => "",
        value: (_prev: string, next: string) => next,
      },
      ticketText: {
        default: () => "",
        value: (_prev: string, next: string) => next,
      },
      classification: {
        default: () => undefined as string | undefined,
        value: (_prev: string | undefined, next: string | undefined) => next,
      },
      kbResults: {
        default: () => [] as KBArticle[],
        value: (_prev: KBArticle[], next: KBArticle[]) => next,
      },
      draftAnswer: {
        default: () => "",
        value: (_prev: string, next: string) => next,
      },
      requiresHuman: {
        default: () => false,
        value: (_prev: boolean, next: boolean) => next,
      },
      mode: {
        default: () => "base" as AgentMode,
        value: (_prev: AgentMode, next: AgentMode) => next,
      },
      steps: {
        default: () => [] as AgentStep[],
        value: (prev: AgentStep[], next: AgentStep[]) => [...prev, ...next],
      },
    },
  });

  builder.addNode("classify", classifyNode);
  builder.addNode("retrieve", retrieveNode);
  builder.addNode("draft", draftAnswerNode);
  builder.addNode("dspyOptimize", dspyOptimizeNode);
  builder.addNode("decide", decisionNode);
  builder.addNode("finalize", finalizeNode);

  builder.addEdge(START, "classify");
  builder.addEdge("classify", "retrieve");
  builder.addEdge("retrieve", "draft");
  builder.addEdge("draft", "dspyOptimize");
  builder.addEdge("dspyOptimize", "decide");
  builder.addEdge("decide", "finalize");
  builder.addEdge("finalize", END);

  compiledGraph = builder.compile();
  return compiledGraph;
}
