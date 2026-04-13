import OpenAI from "openai";
import { callPaidService, PaidCallResult } from "./x402-client";
import { fetchCatalog, buildCatalogSummary } from "./catalog";
import { ResearchEvent, TransactionRecord } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const NEWS_CATEGORIES = [
  "tech", "ai", "global", "economics", "blockchain",
  "politics", "sports", "business", "science",
  "entertainment", "gaming", "security", "health",
] as const;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Get current weather conditions for a location. Costs $0.01 USDC.",
      parameters: {
        type: "object",
        properties: {
          latitude: { type: "number", description: "Latitude coordinate" },
          longitude: { type: "number", description: "Longitude coordinate" },
          location_name: { type: "string", description: "Human-readable name for the location" },
        },
        required: ["latitude", "longitude", "location_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_forecast",
      description:
        "Get weather forecast for a location. Costs $0.01 USDC.",
      parameters: {
        type: "object",
        properties: {
          latitude: { type: "number", description: "Latitude" },
          longitude: { type: "number", description: "Longitude" },
          location_name: { type: "string", description: "Human-readable name" },
        },
        required: ["latitude", "longitude", "location_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_news",
      description: `Get latest news stories for a category. Categories: ${NEWS_CATEGORIES.join(", ")}. Costs $0.01 USDC.`,
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [...NEWS_CATEGORIES],
            description: "News category",
          },
        },
        required: ["category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crypto_quote",
      description:
        "Get current crypto price quote. Symbol must be in BASE-QUOTE format like BTC-USD, ETH-USD, XLM-USD. Costs $0.01 USDC.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Crypto pair in BASE-QUOTE format, e.g. BTC-USD, ETH-USD, XLM-USD" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crypto_candles",
      description:
        "Get crypto price candles (OHLCV). Symbol must be in BASE-QUOTE format like BTC-USD. Costs $0.01 USDC.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Crypto pair in BASE-QUOTE format, e.g. BTC-USD" },
          interval: {
            type: "string",
            enum: ["1m", "5m", "15m", "1h", "4h", "1d"],
            description: "Candle interval",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scrape_url",
      description:
        "Extract structured content from a public webpage URL. Costs $0.03 USDC.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Public URL to scrape" },
        },
        required: ["url"],
      },
    },
  },
];

function getToolCost(toolName: string): number {
  if (toolName === "scrape_url") return 0.03;
  if (toolName === "collect_data") return 0.08;
  return 0.01;
}

async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<PaidCallResult> {
  switch (name) {
    case "get_weather":
      return callPaidService("/testnet/weather/current", {
        latitude: String(args.latitude),
        longitude: String(args.longitude),
      });

    case "get_forecast":
      return callPaidService("/testnet/weather/forecast", {
        latitude: String(args.latitude),
        longitude: String(args.longitude),
      });

    case "get_news":
      return callPaidService(`/testnet/news/${args.category}`);

    case "get_crypto_quote": {
      let sym = String(args.symbol).toUpperCase();
      if (!sym.includes("-")) sym = `${sym}-USD`;
      return callPaidService("/testnet/markets/crypto/quote", { symbol: sym });
    }

    case "get_crypto_candles": {
      let sym = String(args.symbol).toUpperCase();
      if (!sym.includes("-")) sym = `${sym}-USD`;
      return callPaidService("/testnet/markets/crypto/candles", {
        symbol: sym,
        ...(args.interval ? { interval: String(args.interval) } : {}),
      });
    }

    case "scrape_url":
      return callPaidService(
        "/testnet/scrape/extract",
        undefined,
        { url: args.url },
        "POST",
      );

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function truncateData(data: unknown, maxLength = 2000): string {
  const str = JSON.stringify(data, null, 2);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "\n... (truncated)";
}

export async function* runResearch(
  query: string,
  budgetUsd: number,
): AsyncGenerator<ResearchEvent> {
  const catalog = await fetchCatalog();
  const catalogSummary = buildCatalogSummary(catalog);

  let spent = 0;
  const transactions: TransactionRecord[] = [];

  const systemPrompt = `You are SARA (Stellar Autonomous Research Agent). You have a budget of $${budgetUsd.toFixed(2)} USDC to spend on paid data services via x402 on the Stellar blockchain.

Your job:
1. Analyze the user's research question
2. Decide which data services to call to gather relevant information
3. Call the tools (each call costs real USDC on Stellar testnet)
4. Synthesize your findings into a well-structured research report

BUDGET RULES:
- You have $${budgetUsd.toFixed(2)} USDC total
- Each tool call costs real money. Be strategic about which calls provide the most value.
- Do NOT exceed the budget. Stop gathering data when budget is low.
- Prefer diverse data sources — don't call the same endpoint twice unless necessary.

When you have gathered enough data (or budget is running low), stop calling tools and provide your final analysis as a markdown report.

REPORT FORMAT — follow this structure strictly:
- Start with a concise **# Title** (no date in title)
- Use **## Section Headings** to separate major findings by topic area
- Under each section, write **concise paragraphs** (3-5 sentences max). Do NOT dump raw data.
- Highlight key numbers using **bold** (e.g. **$70,906**)
- Use bullet points sparingly for lists of discrete items, not for long paragraphs
- End with a ## Key Takeaways section: 3-5 bullet points of the most actionable insights
- Keep the entire report under 800 words. Be concise and insight-driven, not data-dump-driven.
- Do NOT include a data sources/costs section — the UI handles that separately.

${catalogSummary}`;

  yield { type: "planning", message: "Analyzing your research question and planning data collection strategy..." };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Research question: "${query}"\n\nBudget: $${budgetUsd.toFixed(2)} USDC. Plan which services to query, then execute your plan by calling the tools. Be strategic with the budget.`,
    },
  ];

  let maxIterations = 15;
  while (maxIterations-- > 0) {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages,
      tools,
      tool_choice: spent >= budgetUsd ? "none" : "auto",
    });

    const choice = completion.choices[0];
    if (!choice.message) break;

    messages.push(choice.message);

    if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
      // No more tool calls — the model is done and providing final report
      if (choice.message.content) {
        yield {
          type: "complete",
          report: choice.message.content,
          totalSpent: spent,
          transactions,
        };
      }
      break;
    }

    for (const toolCall of choice.message.tool_calls) {
      if (toolCall.type !== "function") continue;
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const toolCost = getToolCost(toolName);

      if (spent + toolCost > budgetUsd) {
        yield {
          type: "error",
          message: `Skipping ${toolName} — would exceed budget ($${(spent + toolCost).toFixed(2)} > $${budgetUsd.toFixed(2)})`,
        };
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: `ERROR: This call would exceed the budget. Remaining budget: $${(budgetUsd - spent).toFixed(2)}. Please synthesize your report with the data you have.`,
        });
        continue;
      }

      yield {
        type: "tool_call",
        tool: toolName,
        params: toolArgs,
        cost: toolCost,
        budgetRemaining: budgetUsd - spent - toolCost,
      };

      try {
        const result = await executeToolCall(toolName, toolArgs);
        spent += result.cost;

        const record: TransactionRecord = {
          tool: toolName,
          endpoint: getEndpointForTool(toolName, toolArgs),
          cost: result.cost,
          txHash: result.txHash,
          timestamp: Date.now(),
        };
        transactions.push(record);

        yield {
          type: "tool_result",
          tool: toolName,
          summary: summarizeResult(toolName, result.data),
          txHash: result.txHash,
          cost: result.cost,
        };

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: truncateData(result.data),
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        yield { type: "error", message: `${toolName} failed: ${errMsg}` };
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: `ERROR: ${errMsg}`,
        });
      }
    }

    if (spent >= budgetUsd) {
      messages.push({
        role: "user",
        content:
          "Budget exhausted. Please synthesize your research report now with the data you have collected.",
      });
      yield {
        type: "synthesizing",
        message: "Budget reached. Synthesizing final report...",
      };
    }
  }
}

function getEndpointForTool(
  tool: string,
  args: Record<string, unknown>,
): string {
  switch (tool) {
    case "get_weather":
      return "/testnet/weather/current";
    case "get_forecast":
      return "/testnet/weather/forecast";
    case "get_news":
      return `/testnet/news/${args.category}`;
    case "get_crypto_quote":
      return "/testnet/markets/crypto/quote";
    case "get_crypto_candles":
      return "/testnet/markets/crypto/candles";
    case "scrape_url":
      return "/testnet/scrape/extract";
    default:
      return tool;
  }
}

function countItems(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") {
    for (const val of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(val)) return val.length;
    }
  }
  return 0;
}

function summarizeResult(tool: string, data: unknown): string {
  try {
    if (tool === "get_news") {
      const count = countItems(data);
      return `${count} news stories fetched`;
    }
    if (tool === "get_weather" || tool === "get_forecast") {
      return "Weather data received";
    }
    if (tool === "get_crypto_quote") {
      const d = data as Record<string, unknown>;
      const price = d.price ?? d.last ?? d.bid;
      return price ? `Quote: $${price}` : "Quote data received";
    }
    if (tool === "get_crypto_candles") {
      const count = countItems(data);
      return `${count} candles received`;
    }
    if (tool === "scrape_url") {
      return "Page content extracted";
    }
    return "Data received";
  } catch {
    return "Data received";
  }
}
