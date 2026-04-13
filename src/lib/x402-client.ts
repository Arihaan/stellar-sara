import { x402Client } from "@x402/fetch";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const BASE_URL = "https://xlm402.com";
const NETWORK = "stellar:testnet";
const RPC_URL = "https://soroban-testnet.stellar.org";

let paidFetch: typeof globalThis.fetch | null = null;

function getPaidFetch(): typeof globalThis.fetch {
  if (paidFetch) return paidFetch;

  const privateKey = process.env.STELLAR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("STELLAR_PRIVATE_KEY not set in environment");
  }

  const signer = createEd25519Signer(privateKey, NETWORK);
  const client = new x402Client().register(
    "stellar:*",
    new ExactStellarScheme(signer, { url: RPC_URL }),
  );

  paidFetch = wrapFetchWithPayment(globalThis.fetch, client);
  return paidFetch;
}

export interface PaidCallResult {
  data: unknown;
  cost: number;
  txHash: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Mutex to ensure only one x402 payment is in-flight at a time.
// Stellar sequence numbers conflict when concurrent txs are built
// against the same account.
let paymentQueue: Promise<void> = Promise.resolve();

async function callWithRetry(
  fn: () => Promise<Response>,
  retries = 2,
  delayMs = 3000,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fn();

    if (response.ok) return response;

    const text = await response.text();
    const isSettlementFailure =
      response.status === 402 && text.includes("settlement_failed");

    if (isSettlementFailure && attempt < retries) {
      console.log(
        `x402 settlement failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})`,
      );
      await sleep(delayMs);
      continue;
    }

    throw new Error(
      `x402 call failed: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  throw new Error("x402 call failed: max retries exceeded");
}

export async function callPaidService(
  endpointPath: string,
  params?: Record<string, string>,
  body?: unknown,
  method: string = "GET",
): Promise<PaidCallResult> {
  // Serialize all payments through the queue
  const result = await new Promise<PaidCallResult>((resolve, reject) => {
    paymentQueue = paymentQueue.then(async () => {
      try {
        const payFetch = getPaidFetch();

        let url = `${BASE_URL}${endpointPath}`;
        if (params && method === "GET") {
          const qs = new URLSearchParams(params).toString();
          if (qs) url += `?${qs}`;
        }

        const init: RequestInit = { method };
        if (body && method === "POST") {
          init.headers = { "Content-Type": "application/json" };
          init.body = JSON.stringify(body);
        }

        const response = await callWithRetry(() => payFetch(url, init));

        const txHash =
          response.headers.get("x-payment-tx-hash") ||
          response.headers.get("x-transaction-hash") ||
          null;

        const data = await response.json();

        let cost = 0.01;
        if (endpointPath.includes("/scrape/")) cost = 0.03;
        if (endpointPath.includes("/collect/")) cost = 0.08;

        await sleep(300);

        resolve({ data, cost, txHash });
      } catch (err) {
        reject(err);
      }
    });
  });

  return result;
}

export function getPublicKey(): string {
  const privateKey = process.env.STELLAR_PRIVATE_KEY;
  if (!privateKey) throw new Error("STELLAR_PRIVATE_KEY not set");
  const signer = createEd25519Signer(privateKey, NETWORK);
  return signer.address;
}
