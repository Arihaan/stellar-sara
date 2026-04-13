import { Catalog, ServiceEndpoint } from "./types";

const CATALOG_URL = "https://xlm402.com/api/catalog";

let cachedCatalog: Catalog | null = null;

export async function fetchCatalog(): Promise<Catalog> {
  if (cachedCatalog) return cachedCatalog;

  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch catalog: ${res.status}`);
  }
  const data = await res.json();
  cachedCatalog = data as Catalog;
  return cachedCatalog;
}

export function getTestnetEndpoints(catalog: Catalog): ServiceEndpoint[] {
  return catalog.endpoints.filter((e) => e.network === "testnet");
}

export function getEndpointByPath(
  catalog: Catalog,
  path: string,
): ServiceEndpoint | undefined {
  return catalog.endpoints.find((e) => e.path === path);
}

export function buildCatalogSummary(catalog: Catalog): string {
  const testnet = getTestnetEndpoints(catalog);
  const byService: Record<string, ServiceEndpoint[]> = {};
  for (const ep of testnet) {
    if (!byService[ep.service]) byService[ep.service] = [];
    byService[ep.service].push(ep);
  }

  const lines: string[] = [
    "Available x402 paid data services (Stellar testnet, paid in USDC):",
  ];

  for (const [svc, endpoints] of Object.entries(byService)) {
    const info = catalog.services.find((s) => s.id === svc);
    const name = info?.name ?? svc;
    lines.push(`\n## ${name}`);
    if (info?.tagline) lines.push(info.tagline);
    for (const ep of endpoints) {
      lines.push(
        `  - ${ep.method} ${ep.path} ($${ep.price_usd}) — ${ep.description}`,
      );
    }
  }

  return lines.join("\n");
}
