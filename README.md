# SARA - Stellar Autonomous Research Agent

An AI-powered research agent that autonomously discovers, evaluates, and **pays for** data services on the Stellar blockchain using x402 micropayments — all within a user-specified USDC budget.

<img width="1438" height="782" alt="Screenshot 2026-04-13 at 3 50 59 pm" src="https://github.com/user-attachments/assets/d1902ca6-a46c-433f-bc1a-e3eed8e6f09e" />

## What It Does

1. **You ask a research question** (e.g., "What's happening in crypto markets today and how might global news affect Bitcoin?")
2. **You set a USDC budget** (e.g., $0.10)
3. **An AI agent autonomously:**
   - Decomposes your query into data-gathering sub-tasks
   - Discovers available paid data services via the xlm402.com catalog
   - Calls each service by paying USDC via x402 on Stellar testnet
   - Tracks spending against your budget in real-time
   - Synthesizes all findings into a comprehensive research report
4. **You see everything live:** each API call, its cost, the Stellar transaction hash, and the final report

## Why This Matters

Agents can reason and plan — but they still can't pay. x402 on Stellar changes that. SARA demonstrates what happens when AI agents get their own wallet and can make economic decisions: choosing which data to buy, how much to spend, and when to stop — using real stablecoin micropayments on a real blockchain.

## Architecture

```
User (Browser)
  └─> Next.js Frontend
        └─> POST /api/research (SSE stream)
              └─> Orchestrator Agent (OpenAI GPT-5.1, function calling)
                    ├─> Fetches service catalog from xlm402.com
                    ├─> Plans sub-tasks based on query
                    ├─> For each task:
                    │     ├─> Calls x402 endpoint (pays USDC on Stellar)
                    │     └─> Collects results
                    └─> Synthesizes report with cost breakdown
```

### Available Data Services (via xlm402.com testnet)

| Service | Endpoints | Cost/call |
|---------|-----------|-----------|
| Weather | Current, forecast, archive, history summary | $0.01 |
| News | 13 categories (tech, AI, crypto, business, etc.) | $0.01 |
| Crypto | Quote, candles (OHLCV) | $0.01 |
| Web Scrape | Extract content from any public URL | $0.03 |
| Data Collect | Bounded same-origin crawl | $0.08 |

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **AI Orchestration:** OpenAI GPT-5.1 with function calling
- **Payments:** x402 protocol on Stellar testnet (USDC)
- **Blockchain:** Stellar testnet via `@stellar/stellar-sdk`
- **x402 SDK:** `@x402/fetch`, `@x402/stellar`, `@x402/core`
- **Data Services:** xlm402.com (44 paid endpoints)

## Setup

### Prerequisites

- Node.js 18+
- OpenAI API key
- Testnet USDC (free from Circle faucet)

### 1. Install Dependencies

```bash
cd stellar-sara
npm install
```

### 2. Create a Stellar Testnet Wallet

```bash
npx tsx scripts/setup-wallet.ts
```

This generates a new keypair, funds it with testnet XLM via Friendbot, and creates a USDC trustline.

### 3. Fund with Testnet USDC

1. Go to https://faucet.circle.com/
2. Select **Stellar Testnet**
3. Paste your public key from step 2
4. Request testnet USDC

### 4. Configure Environment

Edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-...
STELLAR_PRIVATE_KEY=S...  # Already set by setup script
STELLAR_PUBLIC_KEY=G...   # Already set by setup script
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

## How x402 Payments Work

1. The agent makes a standard HTTP request to a paid endpoint on xlm402.com
2. The server responds with `402 Payment Required` + payment details
3. The x402 SDK automatically signs a USDC payment on Stellar
4. The request is retried with the signed payment header
5. The facilitator verifies and settles the payment on-chain
6. The agent receives the data

All of this happens in a single `fetch()` call thanks to `wrapFetchWithPayment()`.

## Example Research Queries

- **"What's happening in the crypto market today and how might global economic news affect Bitcoin?"**
  - Chains: crypto quote + candles + news/blockchain + news/economics
- **"What's the weather like in major tech hubs and what's the latest in AI?"**
  - Chains: weather/current (multiple cities) + news/tech + news/ai
- **"Research the latest cybersecurity threats and their potential impact on blockchain"**
  - Chains: news/security + news/blockchain + scrape (relevant URLs)

## Key Features

- **Budget-constrained autonomy:** The agent decides what to pay for within your budget
- **Real Stellar transactions:** Every API call is a real USDC payment on Stellar testnet
- **Live cost tracking:** Watch your budget deplete in real-time with transaction links
- **Service discovery:** Agent programmatically discovers available services from the xlm402.com catalog
- **Streaming UI:** Server-Sent Events stream every step of the agent's decision process

## Limitations & Future Work

- Currently uses xlm402.com testnet endpoints only (no mainnet spending)
- AI chat/image services are mainnet-only on xlm402.com, so they're not included
- Could be extended with MPP session mode for high-frequency streaming data
- Budget optimization could be improved with cost/value scoring
