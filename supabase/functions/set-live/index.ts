const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SET_HOME_URL = "https://www.set.or.th/en/home";
const UPSTREAM_TIMEOUT_MS = 12000;

function parseNumeric(raw: string | number | null | undefined): number | null {
  const value = Number(String(raw ?? "").replace(/,/g, "").trim());
  return Number.isFinite(value) ? value : null;
}

function getLastDigit(raw: string | number | null | undefined): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits ? digits[digits.length - 1] : null;
}

function calculateTwoD(setIndex: number | string, value: number | string): string {
  const setDigit = getLastDigit(setIndex);
  const valueDigit = getLastDigit(value);
  if (!setDigit || !valueDigit) return "--";
  return `${setDigit}${valueDigit}`;
}

function extractNuxtExpression(html: string): string | null {
  const marker = "window.__NUXT__=";
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;

  const scriptOpenIndex = html.lastIndexOf("<script", markerIndex);
  const scriptCloseIndex = html.indexOf("</script>", markerIndex);
  if (scriptOpenIndex === -1 || scriptCloseIndex === -1) return null;

  const scriptBodyStart = html.indexOf(">", scriptOpenIndex);
  if (scriptBodyStart === -1 || scriptBodyStart > scriptCloseIndex) return null;

  const scriptBody = html.slice(scriptBodyStart + 1, scriptCloseIndex).trim();
  const assignIndex = scriptBody.indexOf(marker);
  if (assignIndex === -1) return null;

  let expression = scriptBody.slice(assignIndex + marker.length).trim();
  if (expression.endsWith(";")) {
    expression = expression.slice(0, -1).trim();
  }

  return expression || null;
}

// Safe JSON-like evaluation using Function constructor (no vm module in Deno)
function evaluateNuxtExpression(expression: string): any {
  try {
    // The NUXT payload is typically a function call or object literal
    // Wrap in parentheses to handle object literals, and use Function for safe eval
    const fn = new Function(`return (${expression});`);
    return fn();
  } catch {
    // Try as a statement
    try {
      const fn = new Function(`var window = {}; window.__NUXT__ = ${expression}; return window.__NUXT__;`);
      return fn();
    } catch {
      return null;
    }
  }
}

interface SetRecord {
  last?: number;
  index?: number;
  price?: number;
  value?: number;
  turnover?: number;
  totalValue?: number;
  marketStatus?: string;
  status?: string;
  marketDateTime?: string;
  datetime?: string;
  dateTime?: string;
  symbol?: string;
}

function pickSetRecord(records: any): SetRecord | null {
  if (!records) return null;
  if (!Array.isArray(records) && typeof records === "object") return records;
  if (!Array.isArray(records)) return null;

  const match = records.find((item: any) => String(item?.symbol || "").toUpperCase() === "SET");
  return match || records[0] || null;
}

function normalizeSetRecord(record: SetRecord | null) {
  if (!record || typeof record !== "object") return null;

  const setIndex = parseNumeric(record.last ?? record.index ?? record.price);
  const value = parseNumeric(record.value ?? record.turnover ?? record.totalValue);
  if (setIndex === null || value === null) return null;

  const marketStatus = String(record.marketStatus ?? record.status ?? "").trim() || "Unknown";
  const marketDateTime = String(record.marketDateTime ?? record.datetime ?? record.dateTime ?? "").trim() || null;

  return {
    setIndex,
    value,
    marketStatus,
    marketDateTime,
    sourceSymbol: String(record.symbol ?? "SET"),
  };
}

function extractSnapshotFromNuxt(nuxt: any) {
  const fetchRoot = nuxt?.fetch;
  if (!fetchRoot) return null;

  // Try MarketUpdate:0 -> indexInfo
  const indexInfoRecord = pickSetRecord(fetchRoot?.["MarketUpdate:0"]?.indexInfo);
  const normalizedIndexInfo = normalizeSetRecord(indexInfoRecord);
  if (normalizedIndexInfo) return normalizedIndexInfo;

  // Try MarketUpdateChartSET:0 -> setData
  const chartSetRecord = pickSetRecord(fetchRoot?.["MarketUpdateChartSET:0"]?.setData);
  const normalizedChartSet = normalizeSetRecord(chartSetRecord);
  if (normalizedChartSet) return normalizedChartSet;

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    const response = await fetch(SET_HOME_URL, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`SET upstream returned ${response.status}`);
    }

    const html = await response.text();
    const nuxtExpression = extractNuxtExpression(html);
    if (!nuxtExpression) {
      throw new Error("Unable to find window.__NUXT__ payload in SET page");
    }

    const nuxt = evaluateNuxtExpression(nuxtExpression);
    const snapshot = extractSnapshotFromNuxt(nuxt);
    if (!snapshot) {
      throw new Error("Unable to locate SET index/value fields in payload");
    }

    const result = {
      ...snapshot,
      calculated2d: calculateTwoD(snapshot.setIndex, snapshot.value),
      sourceUrl: SET_HOME_URL,
      fetchedAt: new Date().toISOString(),
    };

    console.log("SET snapshot fetched:", {
      setIndex: result.setIndex,
      value: result.value,
      calculated2d: result.calculated2d,
      marketStatus: result.marketStatus,
    });

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("SET scrape error:", error);
    const message = error instanceof Error ? error.message : "Unknown SET proxy error";
    return new Response(
      JSON.stringify({ error: "SET upstream request failed", message }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
