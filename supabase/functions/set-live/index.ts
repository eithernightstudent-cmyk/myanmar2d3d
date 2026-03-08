const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const THAISTOCK_BASE = "https://api.thaistock2d.com";
const RAPIDAPI_BASE = "https://thai-lotto-new-api.p.rapidapi.com/api/v1";
const RAPIDAPI_HOST = "thai-lotto-new-api.p.rapidapi.com";

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

function getRapidHeaders(): Record<string, string> {
  const key = Deno.env.get("RAPIDAPI_KEY") || "";
  return {
    "x-rapidapi-key": key,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "accept": "application/json",
  };
}

/**
 * Normalize thaistock2d /live response.
 * Shape: { live: { set, value, twod, date, time }, result: [...], holiday: { status, date, name } | null, server_time }
 */
function normalizeThaistock(payload: any) {
  const data = payload?.data || payload;

  const live = data?.live && typeof data.live === "object" ? data.live : {};
  const result = Array.isArray(data?.result) ? data.result : [];
  const holiday = data?.holiday && typeof data.holiday === "object" ? data.holiday : null;

  const serverTime = String(data?.server_time || "").trim() || new Date().toISOString();
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

  // Holiday name - use API holiday name, or derive day name if weekend
  let holidayName: string | null = null;
  if (isHoliday && holiday?.name) {
    holidayName = holiday.name;
  } else if (!isLiveFeed) {
    // Check if it's a weekend
    const now = new Date(serverTime || Date.now());
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0) holidayName = "Sunday";
    else if (dayOfWeek === 6) holidayName = "Saturday";
  }

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
    holiday: isHoliday ? holiday : (holidayName ? { status: "1", date: currentDate, name: holidayName } : null),
    holidayName,
    source: "thaistock2d",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let endpoint = "live";
    let date = "";
    let twod = "";
    let page = "1";
    let limit = "5";

    const url = new URL(req.url);
    endpoint = url.searchParams.get("endpoint") || "live";
    date = url.searchParams.get("date") || "";
    twod = url.searchParams.get("twod") || "";
    page = url.searchParams.get("page") || "1";
    limit = url.searchParams.get("limit") || "5";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        endpoint = body.endpoint || endpoint;
        date = body.date || date;
        twod = body.twod || twod;
        page = body.page || page;
        limit = body.limit || limit;
      } catch {
        // No body or invalid JSON
      }
    }

    const rapidHeaders = getRapidHeaders();
    const hasRapidKey = !!rapidHeaders["x-rapidapi-key"];

    // ===== LIVE endpoint: thaistock2d PRIMARY =====
    if (endpoint === "live") {
      try {
        console.log("Fetching PRIMARY: thaistock2d/live");
        const data = await fetchWithTimeout(`${THAISTOCK_BASE}/live`, {
          "accept": "application/json",
          "user-agent": "KKTech-Live-Dashboard/1.0",
        });
        const normalized = normalizeThaistock(data);
        console.log("thaistock2d OK — status:", normalized.connectionStatus, "2D:", normalized.calculated2d);
        return new Response(JSON.stringify({ data: normalized }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error("thaistock2d/live failed:", err);
        // Could add RapidAPI fallback here if needed
        throw err;
      }
    }

    // ===== 3D endpoint: RapidAPI primary, DB fallback =====
    if (endpoint === "threed_result") {
      if (hasRapidKey) {
        try {
          console.log("Fetching RapidAPI: /threed");
          const rawData = await fetchWithTimeout(`${RAPIDAPI_BASE}/threed`, rapidHeaders);
          console.log("RapidAPI /threed raw:", JSON.stringify(rawData).slice(0, 500));
          
          let threedResults: any[] = [];
          if (Array.isArray(rawData?.data)) {
            threedResults = rawData.data;
          } else if (Array.isArray(rawData)) {
            threedResults = rawData;
          } else if (rawData?.data && typeof rawData.data === "object" && !Array.isArray(rawData.data)) {
            if (rawData.data.threed || rawData.data.three_d || rawData.data["3d"]) {
              threedResults = [rawData.data];
            }
          }

          if (threedResults.length > 0) {
            return new Response(JSON.stringify({ data: threedResults }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.log("RapidAPI /threed returned no usable data");
        } catch (err) {
          console.error("RapidAPI /threed failed:", err);
        }
      }
      return new Response(JSON.stringify({ data: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== Calendar/History endpoint =====
    if (endpoint === "2d_result" || endpoint === "calendar") {
      if (hasRapidKey) {
        try {
          console.log(`Fetching RapidAPI: /calendar?page=${page}&limit=${limit}`);
          const rawData = await fetchWithTimeout(
            `${RAPIDAPI_BASE}/calendar?page=${page}&limit=${limit}`,
            rapidHeaders,
            20000
          );
          
          const calendarData = rawData?.data || rawData;
          if (Array.isArray(calendarData) && calendarData.length > 0) {
            return new Response(JSON.stringify({ data: calendarData }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.log("RapidAPI /calendar returned empty data");
        } catch (err) {
          console.error("RapidAPI /calendar failed:", err);
        }
      }

      // Fallback to thaistock2d
      const apiUrl = date
        ? `${THAISTOCK_BASE}/2d_result?date=${encodeURIComponent(date)}`
        : `${THAISTOCK_BASE}/2d_result`;
      console.log(`Fetching fallback: ${apiUrl}`);
      const data = await fetchWithTimeout(apiUrl, {
        "accept": "application/json",
        "user-agent": "KKTech-Live-Dashboard/1.0",
      });
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== Other endpoints =====
    let apiUrl: string;
    switch (endpoint) {
      case "2d_history":
        apiUrl = `${THAISTOCK_BASE}/2d_history?twod=${encodeURIComponent(twod)}&date=${encodeURIComponent(date)}`;
        break;
      case "history":
        apiUrl = date
          ? `${THAISTOCK_BASE}/history?date=${encodeURIComponent(date)}`
          : `${THAISTOCK_BASE}/history`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Fetching: ${apiUrl}`);
    const data = await fetchWithTimeout(apiUrl, {
      "accept": "application/json",
      "user-agent": "KKTech-Live-Dashboard/1.0",
    });

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "API request failed", message }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
