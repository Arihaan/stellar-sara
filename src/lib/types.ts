export interface ServiceEndpoint {
  id: string;
  service: string;
  method: string;
  path: string;
  network: string;
  price_usd: string;
  payment_assets: string[];
  response_type: string;
  description: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  availability: string[];
}

export interface Catalog {
  services: ServiceInfo[];
  endpoints: ServiceEndpoint[];
}

export interface ToolCallEvent {
  type: "tool_call";
  tool: string;
  params: Record<string, unknown>;
  cost: number;
  budgetRemaining: number;
}

export interface ToolResultEvent {
  type: "tool_result";
  tool: string;
  summary: string;
  txHash: string | null;
  cost: number;
}

export interface PlanningEvent {
  type: "planning";
  message: string;
}

export interface SynthesizingEvent {
  type: "synthesizing";
  message: string;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export interface CompleteEvent {
  type: "complete";
  report: string;
  totalSpent: number;
  transactions: TransactionRecord[];
}

export interface TransactionRecord {
  tool: string;
  endpoint: string;
  cost: number;
  txHash: string | null;
  timestamp: number;
}

export type ResearchEvent =
  | PlanningEvent
  | ToolCallEvent
  | ToolResultEvent
  | SynthesizingEvent
  | ErrorEvent
  | CompleteEvent;
