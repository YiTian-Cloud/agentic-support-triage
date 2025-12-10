# Agentic Support Triage Demo

![CI](https://github.com/YiTian-Cloud/agentic-support-triage/actions/workflows/ci.yml/badge.svg)

A fully self-contained **agentic workflow demo** built with:

- **Next.js (App Router)**
- **LangGraph.js** — state machine for multi-step agent workflows  
- **DSPy (simulated)** — shows how offline optimization modules can refine an LLM’s output  
- **TypeScript**
- **Zero external services** (no paid APIs)

This project was designed to showcase modern **Agentic AI** patterns suitable for enterprise low-code platforms like **OutSystems**.

---

## 🚀 **Live Demo**

👉 **https://agentic-support-triage.vercel.app**  
*(Replace with your real Vercel URL after deployment)*

Try submitting a ticket such as:

> _"I need to update my credit card for billing, the old one expired…"_

Then compare:

- **LangGraph only**  
- **LangGraph + DSPy (optimized)**  

Use the **“Next step in flow”** button to reveal each node in the agent’s execution graph.

---

## 🧠 **What This Demo Shows**

### **1. Agentic Workflow (LangGraph)**
A multi-step graph-based agent:
Classify → Retrieve KB → Draft Answer → DSPy Optimize → Decision → Finalize


Each node writes to the shared state and records a timeline event.

### **2. DSPy Optimization (Simulated)**
This demo simulates a DSPy-compiled module that:

- Takes the raw draft answer  
- Produces a cleaner, safer, more structured response  

This is how you would train an agent to become **self-improving** over time.

### **3. Human-in-the-Loop Logic**
Basic decisioning:

- Billing & How-To → auto-resolve  
- Bug & Other → require human review  

The design can easily be expanded to multi-agent routing, safety scoring, etc.

---

## 🏛 **Architecture Overview**

Next.js UI
↓
API Route (/api/triage)
↓
LangGraph StateGraph
• classify
• retrieveKB
• draftAnswer
• dspyOptimize (conceptual DSPy)
• decide
• finalize
↓
Return response + step-by-step execution trace

All logic is local — lightweight, cheap, reliable, perfect for demos.

---

## 📂 **Project Structure**

app/
page.tsx ← UI + step-through timeline
api/
triage/
route.ts ← serverless agent execution
lib/
agent.ts ← LangGraph StateGraph + DSPy mock
kb.ts ← in-memory KB retrieval
public/
... ← static assets
