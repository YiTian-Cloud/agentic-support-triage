// lib/openapi.ts

export const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Agentic Support Triage API",
      version: "1.0.0",
      description:
        "API for an agentic support triage workflow built with LangGraph.js and a conceptual DSPy optimization step.",
    },
    servers: [
      {
        url: "/",
        description: "Same-origin server",
      },
    ],
    paths: {
      "/api/triage": {
        post: {
          summary: "Run triage agent on a support ticket",
          description:
            "Runs the LangGraph-based agent to classify a ticket, retrieve knowledge base context, draft an answer, optionally apply a DSPy-style optimization, and decide whether a human review is required.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ticketId: {
                      type: "string",
                      example: "T-12345",
                      description:
                        "Optional ticket identifier. If omitted, a default will be used.",
                    },
                    ticketText: {
                      type: "string",
                      example:
                        "I need to update my credit card for billing, the old one expired.",
                      description: "Full text of the support ticket.",
                    },
                    mode: {
                      type: "string",
                      enum: ["base", "optimized"],
                      default: "base",
                      description:
                        "`base` runs only the LangGraph flow; `optimized` includes the DSPy-style optimization step.",
                    },
                  },
                  required: ["ticketText"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful triage response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ticketId: {
                        type: "string",
                        example: "T-12345",
                      },
                      classification: {
                        type: "string",
                        description:
                          "Classification label inferred by the agent, e.g. billing / bug / how_to / other.",
                        example: "billing",
                      },
                      answer: {
                        type: "string",
                        description:
                          "Draft answer proposed by the agent, possibly refined by the DSPy-style optimization step.",
                      },
                      requiresHuman: {
                        type: "boolean",
                        description:
                          "Whether this ticket should be escalated to a human agent.",
                        example: false,
                      },
                      mode: {
                        type: "string",
                        enum: ["base", "optimized"],
                      },
                      steps: {
                        type: "array",
                        description:
                          "Execution trace of the agentic workflow (each node in the LangGraph).",
                        items: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              example: "Classify ticket",
                            },
                            kind: {
                              type: "string",
                              enum: ["langgraph", "dspy"],
                              example: "langgraph",
                            },
                            detail: {
                              type: "string",
                              example: "Classified as: billing",
                            },
                          },
                          required: ["name", "kind", "detail"],
                        },
                      },
                    },
                    required: ["ticketId", "answer", "mode", "steps"],
                  },
                },
              },
            },
            "400": {
              description: "Invalid input (e.g. missing ticketText).",
            },
            "500": {
              description: "Internal server error.",
            },
          },
        },
      },
    },
  } as const;
  