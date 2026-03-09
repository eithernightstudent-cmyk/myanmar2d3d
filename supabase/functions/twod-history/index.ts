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

    console.log("Fetching 2D history for date:", date);

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

    // Convert to HistoryEntry, mark session close times as results
    const sessionCloses = ["11:00", "12:01", "15:00", "16:30"];
    const markedSessions = new Set<string>();

    const entries: HistoryEntry[] = allRaw.map(e => {
      const minuteKey = e.time.slice(0, 5);
      let isResult = false;
      if (sessionCloses.includes(minuteKey) && !markedSessions.has(minuteKey)) {
        isResult = true;
        markedSessions.add(minuteKey);
      }
      return { time: e.time, set: e.set, value: e.value, twod: e.twod, isResult };
    });

    // Find the result for the requested session
    const sessionKey = openTime?.slice(0, 5) || "";
    const resultEntry = entries.find(e => e.isResult && e.time.startsWith(sessionKey));
    const result2d = resultEntry?.twod || (entries.length > 0 ? entries[0].twod : "--");
    const updatedAt = resultEntry?.time || (entries.length > 0 ? entries[0].time : "");

    console.log(`Returned ${entries.length} entries, result2d: ${result2d}`);

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
