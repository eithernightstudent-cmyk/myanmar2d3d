const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = "https://api.thaistock2d.com";

function parseNumeric(raw: unknown): number | null {
  const value = Number(String(raw ?? "").replace(/,/g, "").trim());
  return Number.isFinite(value) ? value : null;
}

function getLastDigit(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits ? digits[digits.length - 1] : null;
}

function calculateTwoD(setIndex: unknown, value: unknown): string {
  const setDigit = getLastDigit(setIndex);
  const valueDigit = getLastDigit(value);
  if (!setDigit || !valueDigit) return "--";
  return `${setDigit}${valueDigit}`;
}

function extractDateString(raw: unknown): string {
  const text = String(raw ?? "").trim();
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function sortByStockTime(a: any, b: any): number {
  const left = String(a?.stock_datetime || `${a?.stock_date || ""} ${a?.open_time || ""}`);
  const right = String(b?.stock_datetime || `${b?.stock_date || ""} ${b?.open_time || ""}`);
  return left.localeCompare(right);
}

function normalizeSourcePayload(payload: any) {
  const live = payload?.live && typeof payload.live === "object" ? payload.live : {};
  const result = Array.isArray(payload?.result) ? payload.result : [];
  const holiday = payload?.holiday && typeof payload.holiday === "object" ? payload.holiday : null;

  const serverTime = String(payload?.server_time || "").trim() || new Date().toISOString();
  const currentDate = extractDateString(live?.date) || extractDateString(serverTime);

  const currentDayResults = result
    .filter((entry: any) => String(entry?.stock_date || "") === currentDate)
    .sort(sortByStockTime);

  const sortedAllResults = [...result].sort(sortByStockTime);
  const latestResult = currentDayResults[currentDayResults.length - 1] || sortedAllResults[sortedAllResults.length - 1] || null;

  const liveSetNumeric = parseNumeric(live?.set);
  const liveValueNumeric = parseNumeric(live?.value);

  const setIndex = liveSetNumeric ?? parseNumeric(latestResult?.set);
  const value = liveValueNumeric ?? parseNumeric(latestResult?.value);

  const liveTwoD = String(live?.twod || "").trim();
  const calculated2d = /^\d{2}$/.test(liveTwoD) ? liveTwoD : calculateTwoD(setIndex, value);

  const isLiveFeed = liveSetNumeric !== null && liveValueNumeric !== null && live?.set !== "--" && live?.value !== "--";
  const isHoliday = holiday && String(holiday.status || "") !== "0";
  const connectionStatus = isLiveFeed && !isHoliday ? "Live" : "Closed";

  return {
    serverTime,
    currentDate,
    connectionStatus,
    setIndex,
    value,
    calculated2d,
    live,
    result: sortedAllResults,
    currentDayResults,
    holiday,
    sourceUrl: `${BASE_URL}/live`,
    fetchedAt: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let endpoint = "live";
    let date = "";
    let twod = "";

    const url = new URL(req.url);
    endpoint = url.searchParams.get("endpoint") || "live";
    date = url.searchParams.get("date") || "";
    twod = url.searchParams.get("twod") || "";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        endpoint = body.endpoint || endpoint;
        date = body.date || date;
        twod = body.twod || twod;
      } catch {
        // No body or invalid JSON, use query params
      }
    }

    let apiUrl: string;
    let scrapeMode = false;

    switch (endpoint) {
      case "live":
        apiUrl = `${BASE_URL}/live`;
        break;
      case "2d_result":
        apiUrl = date
          ? `${BASE_URL}/2d_result?date=${encodeURIComponent(date)}`
          : `${BASE_URL}/2d_result`;
        break;
      case "2d_history":
        apiUrl = `${BASE_URL}/2d_history?twod=${encodeURIComponent(twod)}&date=${encodeURIComponent(date)}`;
        break;
      case "history":
        apiUrl = date
          ? `${BASE_URL}/history?date=${encodeURIComponent(date)}`
          : `${BASE_URL}/history`;
        break;
      case "threed_result":
        apiUrl = "https://www.thaistock2d.com/threedResult";
        scrapeMode = true;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Fetching: ${apiUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const fetchHeaders: Record<string, string> = scrapeMode
      ? { "Accept": "application/json", "X-With-Generated-Alt": "true" }
      : { "accept": "application/json", "user-agent": "KKTech-Live-Dashboard/1.0" };
    const response = await fetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
      headers: fetchHeaders,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    // Handle 3D results from Jina reader
    if (scrapeMode) {
      const text = await response.text();
      console.log(`Jina response length: ${text.length}`);
      const results: Array<{ date: string; threed: string }> = [];
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length - 1; i++) {
        const dateMatch = lines[i].match(/^#{1,4}\s*(\d{4}-\d{2}-\d{2})$/);
        if (dateMatch) {
          const threedMatch = lines[i + 1].match(/^#{1,4}\s*(\d{1,3})$/);
          if (threedMatch) {
            results.push({ date: dateMatch[1], threed: threedMatch[1] });
          }
        }
      }
      console.log(`Found ${results.length} 3D results`);
      return new Response(JSON.stringify({ data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    if (endpoint === "live") {
      const normalized = normalizeSourcePayload(data);
      return new Response(JSON.stringify({ data: normalized }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("ThaiStock API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "ThaiStock API request failed", message }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
