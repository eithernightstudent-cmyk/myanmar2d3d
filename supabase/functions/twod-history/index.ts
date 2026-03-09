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

// Session closing times to identify which session a row belongs to
const SESSION_TIMES = [
  { close: "11:00", label: "11:00 AM" },
  { close: "12:01", label: "12:01 PM" },
  { close: "15:00", label: "03:00 PM" },
  { close: "16:30", label: "04:30 PM" },
];

function getSessionForTime(timeStr: string): string | null {
  const [h, m] = timeStr.split(":").map(Number);
  const mins = h * 60 + m;

  // 09:30 - 11:05 → 11:00
  if (mins >= 570 && mins <= 665) return "11:00";
  // 11:05 - 12:06 → 12:01
  if (mins > 665 && mins <= 726) return "12:01";
  // 12:06 - 15:05 → 15:00
  if (mins > 726 && mins <= 905) return "15:00";
  // 15:05 - 16:35 → 16:30
  if (mins > 905 && mins <= 995) return "16:30";

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

    if (!date || !openTime) {
      return new Response(
        JSON.stringify({ error: "date and open_time are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize open_time to HH:MM
    const sessionKey = openTime.slice(0, 5);

    console.log("Fetching 2D history for date:", date, "session:", sessionKey);

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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rawData = await response.json();
    console.log("Raw API response type:", typeof rawData, "isArray:", Array.isArray(rawData), "length:", rawData?.length, "first:", JSON.stringify(rawData?.[0])?.substring(0, 300));

    // rawData is an array with one element: { date, child: [...] }
    const allEntries: { time: string; set: string; value: string; twod: string }[] =
      rawData?.[0]?.child || [];
    console.log("All entries count:", allEntries.length, "first entry:", JSON.stringify(allEntries[0]));

    // Filter entries belonging to this session
    const sessionEntries: HistoryEntry[] = [];
    let result2d = "--";
    let resultTime = "";

    for (const entry of allEntries) {
      const entrySession = getSessionForTime(entry.time);
      if (entrySession === sessionKey) {
        sessionEntries.push({
          time: entry.time,
          set: entry.set,
          value: entry.value,
          twod: entry.twod,
          isResult: false,
        });
      }
    }

    // The first entry (latest time) closest to the session close is the result
    // Find the entry at the exact session close time (or the latest one)
    if (sessionEntries.length > 0) {
      // Sort by time descending (they should already be)
      sessionEntries.sort((a, b) => b.time.localeCompare(a.time));

      // Mark the first entry (closest to close time) as the result
      // Actually, the result is the entry at exactly the session close time
      // The entries from the API at close time (e.g. 11:00:03) are the result
      const closeMinute = sessionKey; // "11:00", "12:01", etc.
      let foundResult = false;
      for (const entry of sessionEntries) {
        if (entry.time.startsWith(closeMinute)) {
          if (!foundResult) {
            entry.isResult = true;
            result2d = entry.twod;
            resultTime = entry.time;
            foundResult = true;
          }
        }
      }

      // If no entry at exact close time, use the latest one
      if (!foundResult && sessionEntries.length > 0) {
        sessionEntries[0].isResult = true;
        result2d = sessionEntries[0].twod;
      }
    }

    console.log(`Parsed ${sessionEntries.length} entries for session ${sessionKey}, result: ${result2d}`);

    return new Response(
      JSON.stringify({
        data: {
          result2d,
          updatedAt: resultTime || (sessionEntries.length > 0 ? sessionEntries[0].time : ""),
          entries: sessionEntries,
        },
      }),
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
