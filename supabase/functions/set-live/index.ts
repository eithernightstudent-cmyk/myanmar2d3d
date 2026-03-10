const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const THAISTOCK_BASE = "https://api.thaistock2d.com";
const RAPIDAPI_BASE = "https://thai-lotto-new-api.p.rapidapi.com/api/v1";
const RAPIDAPI_HOST = "thai-lotto-new-api.p.rapidapi.com";
const FINAL_SESSION_TIMES = ["11:00", "12:01", "15:00", "16:30"] as const;
const FINAL_SESSION_TIME_SET = new Set(FINAL_SESSION_TIMES);

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

function toSessionKey(raw: unknown): string {
  const text = String(raw ?? "").trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function toSessionTime(raw: unknown): string {
  const key = toSessionKey(raw);
  return key ? `${key}:00` : String(raw ?? "").trim();
}

function normalizeResultEntry(entry: any) {
  if (!entry || typeof entry !== "object") return null;
  const normalizedTime = toSessionTime(entry.time ?? entry.open_time);
  return {
    ...entry,
    time: normalizedTime,
    open_time: normalizedTime,
    set: String(entry.set ?? "").trim(),
    value: String(entry.value ?? "").trim(),
    twod: String(entry.twod ?? "").trim(),
  };
}

function normalizeSessionChild(rawEntries: any): any[] {
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const byTime = new Map<string, any>();

  for (const entry of entries) {
    const key = toSessionKey(entry?.time ?? entry?.open_time);
    if (!FINAL_SESSION_TIME_SET.has(key as (typeof FINAL_SESSION_TIMES)[number])) continue;
    const normalized = normalizeResultEntry(entry);
    if (normalized) byTime.set(key, normalized);
  }

  return FINAL_SESSION_TIMES
    .map((time) => byTime.get(time))
    .filter(Boolean);
}

function normalize2DResultDays(payload: any): any[] {
  const root = payload?.data ?? payload;
  const sourceDays = (() => {
    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.data)) return root.data;
    if (root && typeof root === "object" && Array.isArray(root?.child)) return [root];
    if (root?.data && typeof root.data === "object" && Array.isArray(root.data?.child)) return [root.data];
    return [];
  })();

  const normalized = sourceDays
    .map((day: any) => {
      const child = normalizeSessionChild(day?.child ?? day?.result ?? []);
      const date = extractDateString(day?.date || day?.stock_date || child?.[0]?.stock_date || "");
      if (!date || child.length === 0) return null;
      return { ...day, date, child };
    })
    .filter(Boolean);

  normalized.sort((a: any, b: any) => String(b?.date || "").localeCompare(String(a?.date || "")));
  return normalized;
}

function parsePositiveInteger(raw: string, fallbackValue: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallbackValue;
  const value = Math.floor(parsed);
  return value > 0 ? value : fallbackValue;
}

function paginateDays(days: any[], pageRaw: string, limitRaw: string): any[] {
  const pageValue = parsePositiveInteger(pageRaw, 1);
  const limitValue = parsePositiveInteger(limitRaw, 7);
  const start = (pageValue - 1) * limitValue;
  return days.slice(start, start + limitValue);
}

function normalizeThaistock(payload: any, source: string = "thaistock2d") {
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

  let holidayName: string | null = null;
  if (isHoliday && holiday?.name) {
    holidayName = holiday.name;
  } else if (!isLiveFeed) {
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
    source,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Normalize RapidAPI /live response to match our standard shape.
 * RapidAPI returns: { data: { live: {...}, result: [...], holiday: {...} } }
 */
function normalizeRapidApiLive(payload: any) {
  // RapidAPI has similar shape, reuse normalizer
  return normalizeThaistock(payload, "rapidapi-fallback");
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 10000) {
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

    // ===== LIVE endpoint: thaistock2d PRIMARY, RapidAPI FALLBACK =====
    if (endpoint === "live") {
      // Try PRIMARY: thaistock2d
      try {
        console.log("Fetching PRIMARY: thaistock2d/live");
        const data = await fetchWithTimeout(`${THAISTOCK_BASE}/live`, {
          "accept": "application/json",
          "user-agent": "KKTech-Live-Dashboard/1.0",
        }, 8000);
        const normalized = normalizeThaistock(data);
        console.log("PRIMARY OK — status:", normalized.connectionStatus, "2D:", normalized.calculated2d);
        return new Response(JSON.stringify({ data: normalized }), {
          headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
        });
      } catch (primaryErr) {
        console.error("PRIMARY (thaistock2d) failed:", primaryErr);
      }

      // Try FALLBACK: RapidAPI
      if (hasRapidKey) {
        try {
          console.log("Fetching FALLBACK: RapidAPI /live");
          const data = await fetchWithTimeout(`${RAPIDAPI_BASE}/live`, rapidHeaders, 10000);
          const normalized = normalizeRapidApiLive(data);
          console.log("FALLBACK OK — status:", normalized.connectionStatus, "2D:", normalized.calculated2d);
          return new Response(JSON.stringify({ data: normalized }), {
            headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
          });
        } catch (fallbackErr) {
          console.error("FALLBACK (RapidAPI) also failed:", fallbackErr);
          throw fallbackErr;
        }
      }

      throw new Error("Primary API failed and no fallback API key configured");
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
              headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.log("RapidAPI /threed returned no usable data");
        } catch (err) {
          console.error("RapidAPI /threed failed:", err);
        }
      }
      return new Response(JSON.stringify({ data: [] }), {
        headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== 2D final-result endpoint (official source) =====
    if (endpoint === "2d_result") {
      const apiUrl = date
        ? `${THAISTOCK_BASE}/2d_result?date=${encodeURIComponent(date)}`
        : `${THAISTOCK_BASE}/2d_result`;
      console.log(`Fetching official 2d_result: ${apiUrl}`);
      const rawData = await fetchWithTimeout(apiUrl, {
        "accept": "application/json",
        "user-agent": "KKTech-Live-Dashboard/1.0",
      });
      const normalizedDays = normalize2DResultDays(rawData);
      return new Response(JSON.stringify({ data: normalizedDays }), {
        headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== Calendar endpoint =====
    if (endpoint === "calendar") {
      if (hasRapidKey) {
        try {
          console.log(`Fetching RapidAPI: /calendar?page=${page}&limit=${limit}`);
          const rawData = await fetchWithTimeout(
            `${RAPIDAPI_BASE}/calendar?page=${page}&limit=${limit}`,
            rapidHeaders,
            20000
          );

          const calendarData = normalize2DResultDays(rawData);
          if (calendarData.length > 0) {
            return new Response(JSON.stringify({ data: paginateDays(calendarData, page, limit) }), {
              headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.log("RapidAPI /calendar returned empty data");
        } catch (err) {
          console.error("RapidAPI /calendar failed:", err);
        }
      }

      const apiUrl = date
        ? `${THAISTOCK_BASE}/2d_result?date=${encodeURIComponent(date)}`
        : `${THAISTOCK_BASE}/2d_result`;
      console.log(`Fetching fallback: ${apiUrl}`);
      const rawData = await fetchWithTimeout(apiUrl, {
        "accept": "application/json",
        "user-agent": "KKTech-Live-Dashboard/1.0",
      });
      const normalizedDays = normalize2DResultDays(rawData);
      return new Response(JSON.stringify({ data: paginateDays(normalizedDays, page, limit) }), {
        headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
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
          { status: 400, headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Fetching: ${apiUrl}`);
    const data = await fetchWithTimeout(apiUrl, {
      "accept": "application/json",
      "user-agent": "KKTech-Live-Dashboard/1.0",
    });

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "API request failed", message }),
      { status: 502, headers: { ...corsHeaders, ...noCacheHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
