const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface HistoryEntry {
  time: string;
  set: string;
  value: string;
  twod: string;
  isResult: boolean;
}

async function fetchWithTimeout(url: string, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept": "application/json",
        "user-agent": "KKTech-Dashboard/1.0",
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Session time ranges: entries within these windows belong to that session
const SESSION_RANGES: { key: string; startMinute: number; endMinute: number }[] = [
  { key: "11:00", startMinute: 570, endMinute: 660 },   // 09:30 - 11:00
  { key: "12:01", startMinute: 661, endMinute: 721 },   // 11:01 - 12:01
  { key: "15:00", startMinute: 722, endMinute: 900 },   // 12:02 - 15:00
  { key: "16:30", startMinute: 901, endMinute: 990 },   // 15:01 - 16:30
];

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function getSessionForTime(timeStr: string): string | null {
  const m = timeToMinutes(timeStr.slice(0, 5));
  for (const range of SESSION_RANGES) {
    if (m >= range.startMinute && m <= range.endMinute) return range.key;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let date = url.searchParams.get("date") || "";
    let openTime = url.searchParams.get("open_time") || "";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        date = body.date || date;
        openTime = body.open_time || openTime;
      } catch { /* no body */ }
    }

    if (!date) {
      return new Response(
        JSON.stringify({ error: "date is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestedOpenKey = (openTime || "").trim().slice(0, 5);
    console.log("Fetching 2D history for date:", date, "session:", requestedOpenKey);

    // Format date for /2d_result (needs DD-MM-YYYY)
    const dateParts = date.split("-");
    const dateForApi = dateParts.length === 3 && dateParts[0].length === 4
      ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
      : date;

    // Fetch both endpoints in parallel:
    // 1. /2d_result for official session results
    // 2. /history for timeline tick data
    const [resultData, historyData] = await Promise.allSettled([
      fetchWithTimeout(`https://api.thaistock2d.com/2d_result?date=${encodeURIComponent(dateForApi)}`),
      fetchWithTimeout(`https://api.thaistock2d.com/history?date=${encodeURIComponent(date)}`),
    ]);

    // Extract official result for the requested session from /2d_result
    let result2d = "--";
    let resultUpdatedAt = "";

    if (resultData.status === "fulfilled") {
      const days = Array.isArray(resultData.value) ? resultData.value : [];
      for (const day of days) {
        const children = day?.child || [];
        for (const child of children) {
          const childTime = String(child.time || "").trim().slice(0, 5);
          if (childTime === requestedOpenKey) {
            const twod = String(child.twod || "").trim();
            if (/^\d{2}$/.test(twod)) {
              result2d = twod;
              resultUpdatedAt = child.time || "";
            }
            break;
          }
        }
        if (result2d !== "--") break;
      }
    }

    // Extract timeline entries from /history, filtered to the requested session
    let entries: HistoryEntry[] = [];

    if (historyData.status === "fulfilled") {
      const raw = historyData.value;
      const allRaw: { time: string; set: string; value: string; twod: string }[] =
        raw?.[0]?.child || (Array.isArray(raw) ? raw : []);

      // Filter entries to the requested session's time range
      entries = allRaw
        .filter(e => {
          const session = getSessionForTime(e.time);
          return session === requestedOpenKey;
        })
        .map(e => {
          const minuteKey = e.time.slice(0, 5);
          const isResult = minuteKey === requestedOpenKey;
          return { time: e.time, set: e.set, value: e.value, twod: e.twod, isResult };
        });

      // Sort descending by time (most recent first)
      entries.sort((a, b) => b.time.localeCompare(a.time));
    }

    // If we have a result but no timeline entry marked, mark the closest one
    if (result2d !== "--" && entries.length > 0 && !entries.some(e => e.isResult)) {
      entries[entries.length - 1].isResult = true;
    }

    const updatedAt = resultUpdatedAt || (entries.length > 0 ? entries[0].time : "");

    console.log(`Session ${requestedOpenKey}: ${entries.length} entries, result2d: ${result2d}`);

    return new Response(
      JSON.stringify({ data: { result2d, updatedAt, entries } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("2D History error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to fetch 2D history", message }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
