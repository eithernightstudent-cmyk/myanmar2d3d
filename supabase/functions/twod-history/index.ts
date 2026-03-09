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

// Session time ranges: [start, close]
const SESSION_RANGES: { open: string; start: string; close: string }[] = [
  { open: "11:00", start: "09:30", close: "11:00" },
  { open: "12:01", start: "11:00", close: "12:01" },
  { open: "15:00", start: "14:30", close: "15:00" },
  { open: "16:30", start: "15:00", close: "16:30" },
];

function timeToMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
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

    const apiUrl = `https://api.thaistock2d.com/history?date=${encodeURIComponent(date)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        "accept": "application/json",
        "user-agent": "KKTech-Dashboard/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawData = await response.json();
    const allRaw: { time: string; set: string; value: string; twod: string }[] =
      rawData?.[0]?.child || [];

    // Find the session range for the requested open_time
    const session = SESSION_RANGES.find(s => s.open === requestedOpenKey);
    const startMins = session ? timeToMinutes(session.start) : 0;
    const closeMins = session ? timeToMinutes(session.close) : 24 * 60;
    // Add 2 minutes buffer after close to capture post-close entries
    const endMins = closeMins + 2;

    // Filter entries to this session's time range
    const sessionCloses = ["11:00", "12:01", "15:00", "16:30"];
    const markedSessions = new Set<string>();

    const entries: HistoryEntry[] = [];
    for (const e of allRaw) {
      const minuteKey = e.time.slice(0, 5);
      const entryMins = timeToMinutes(e.time);

      // Only include entries within the session range
      if (session && (entryMins < startMins || entryMins > endMins)) continue;

      let isResult = false;
      if (sessionCloses.includes(minuteKey) && !markedSessions.has(minuteKey)) {
        isResult = true;
        markedSessions.add(minuteKey);
      }
      entries.push({ time: e.time, set: e.set, value: e.value, twod: e.twod, isResult });
    }

    // Find the result for the requested session
    const resultEntry = entries.find(e => e.isResult && e.time.startsWith(requestedOpenKey));
    const result2d = resultEntry?.twod || (entries.length > 0 ? entries[0].twod : "--");
    const updatedAt = resultEntry?.time || (entries.length > 0 ? entries[0].time : "");

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
