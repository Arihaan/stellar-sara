import { NextRequest } from "next/server";
import { runResearch } from "@/lib/orchestrator";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { query, budget } = await req.json();

  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
    });
  }

  const budgetUsd = Math.min(Math.max(Number(budget) || 0.1, 0.01), 5.0);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runResearch(query, budgetUsd)) {
          const data = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Unknown error";
        const data = `event: error\ndata: ${JSON.stringify({ type: "error", message: errMsg })}\n\n`;
        controller.enqueue(encoder.encode(data));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
