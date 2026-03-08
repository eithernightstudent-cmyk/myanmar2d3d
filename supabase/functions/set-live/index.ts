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
      case "threed_result": {
        // 3D results - source site requires JS rendering, so we fetch and parse the HTML
        // trying multiple approaches
        const threedResults: Array<{ date: string; threed: string }> = [];
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 10000);
          const res = await fetch("https://www.thaistock2d.com/threedResult", {
            signal: ctrl.signal,
            headers: {
              "accept": "text/html,application/xhtml+xml",
              "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          clearTimeout(tid);
          const html = await res.text();
          // Try parsing threed_result_item divs
          const regex = /(\d{4}-\d{2}-\d{2})<\/h4>[\s\S]*?<h4[^>]*>(\d{1,3})<\/h4>/g;
          let m;
          while ((m = regex.exec(html)) !== null) {
            threedResults.push({ date: m[1], threed: m[2] });
          }
          // Also try __NUXT__ data
          if (threedResults.length === 0) {
            const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*(.+?);<\/script>/s);
            if (nuxtMatch) {
              console.log("Found __NUXT__ data");
              // Try to extract date/threed pairs
              const dateMatches = [...html.matchAll(/(\d{4}-\d{2}-\d{2})/g)].map(m => m[1]);
              const threedMatches = [...html.matchAll(/(\d{3})/g)].map(m => m[1]);
              console.log(`Dates: ${dateMatches.length}, 3Ds: ${threedMatches.length}`);
            }
          }
        } catch (e) {
          console.error("3D fetch error:", e);
        }
        return new Response(JSON.stringify({ data: threedResults }), {
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
