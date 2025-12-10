// lib/kb.ts
export type KBArticle = {
    id: number;
    title: string;
    content: string;
  };
  
  export const KB: KBArticle[] = [
    {
      id: 1,
      title: "Updating billing information",
      content:
        "To update your billing information, go to Settings > Billing > Payment Method and click 'Edit'.",
    },
    {
      id: 2,
      title: "Resetting your password",
      content:
        "Click 'Forgot password' on the login page and follow the instructions in the email.",
    },
  ];
  
  export function retrieveKB(ticketText: string): KBArticle[] {
    const lower = ticketText.toLowerCase();
  
    // Very simple keyword-based retrieval for demo purposes
    const matches: KBArticle[] = [];
  
    if (lower.includes("billing") || lower.includes("card") || lower.includes("invoice")) {
      matches.push(KB[0]);
    }
    if (lower.includes("password") || lower.includes("login")) {
      matches.push(KB[1]);
    }
  
    return matches;
  }
  