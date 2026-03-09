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

function getSessionForTime(timeStr: string, sessionKey: string): boolean {
  const [h, m] = timeStr.split(":").map(Number);
  const mins = h * 60 + m;

  switch (sessionKey) {
    case "11:00": return mins >= 570 && mins <= 665; // 09:30 - 11:05
    case "12:01": return mins > 665 && mins <= 726;  // 11:05 - 12:06
    case "15:00": return mins > 726 && mins <= 905;  // 12:06 - 15:05
    case "16:30": return mins > 905 && mins <= 995;  // 15:05 - 16:35
    default: return false;
  }
}

async function fetchHistoryPage(date: string, page: number, signal: AbortSignal) {
  const apiUrl = `https://api.thaistock2d.com/history?date=${encodeURIComponent(date)}&page=${page}`;
  const response = await fetch(apiUrl, {
    signal,
    headers: {
      "accept": "application/json",
      "user-agent": "KKTech-Dashboard/1.0",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const rawData = await response.json();
  return rawData?.[0]?.child || [];
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

    const sessionKey = openTime.slice(0, 5);
    console.log("Fetching 2D history for date:", date, "session:", sessionKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Fetch up to 5 pages to find the session's data
    let allEntries: { time: string; set: string; value: string; twod: string }[] = [];
    let foundSession = false;

    for (let page = 1; page <= 5; page++) {
      try {
        const entries = await fetchHistoryPage(date, page, controller.signal);
        if (entries.length === 0) break;
        allEntries = allEntries.concat(entries);

        // Check if any entry belongs to our target session
        const hasTarget = entries.some((e: any) => getSessionForTime(e.time, sessionKey));
        if (hasTarget) {
          foundSession = true;
          break;
        }

        // If entries are older than our session, stop
        const oldestTime = entries[entries.length - 1]?.time || "";
        const [oh, om] = oldestTime.split(":").map(Number);
        const oldestMins = oh * 60 + om;
        const sessionMins = sessionKey === "11:00" ? 570 : sessionKey === "12:01" ? 665 : sessionKey === "15:00" ? 726 : 905;
        if (oldestMins < sessionMins) {
          foundSession = true; // We've passed through the session range
          break;
        }
      } catch (err) {
        console.error(`Page ${page} fetch failed:`, err);
        break;
      }
    }
    clearTimeout(timeoutId);

    // Filter entries belonging to this session
    const sessionEntries: HistoryEntry[] = [];
    let result2d = "--";
    let resultTime = "";

    for (const entry of allEntries) {
      if (getSessionForTime(entry.time, sessionKey)) {
        sessionEntries.push({
          time: entry.time,
          set: entry.set,
          value: entry.value,
          twod: entry.twod,
          isResult: false,
        });
      }
    }

    // Sort descending by time
    sessionEntries.sort((a, b) => b.time.localeCompare(a.time));

    // Mark result entry (at/after session close time)
    if (sessionEntries.length > 0) {
      const closeMinute = sessionKey;
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
      if (!foundResult) {
        sessionEntries[0].isResult = true;
        result2d = sessionEntries[0].twod;
        resultTime = sessionEntries[0].time;
      }
    }

    console.log(`Parsed ${sessionEntries.length} entries for session ${sessionKey}, result: ${result2d}`);

    return new Response(
      JSON.stringify({
        data: {
          result2d,
          updatedAt: resultTime,
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
