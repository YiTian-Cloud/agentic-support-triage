// app/docs/page.tsx
"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl bg-white shadow-md rounded-2xl p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">
            Agentic Support Triage API Docs
          </h1>
          <p className="text-sm text-slate-600">
            OpenAPI documentation for the LangGraph-based triage agent,
            including the conceptual DSPy optimization step. Use the Swagger UI
            below to explore and test the <code>/api/triage</code> endpoint.
          </p>
        </header>

        <div className="border rounded-xl overflow-hidden">
          <SwaggerUI url="/api/openapi" />
        </div>
      </div>
    </main>
  );
}
