const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const THAISTOCK_API = "https://api.thaistock2d.com/live";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(THAISTOCK_API, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "accept": "application/json",
        "user-agent": "KKTech-Live-Dashboard/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log("ThaiStock API response:", JSON.stringify(apiData).slice(0, 500));

    const live = apiData?.live;
    const result = apiData?.result;
    const holiday = apiData?.holiday;
    const serverTime = apiData?.server_time;

    // Determine market status
    let marketStatus = "Unknown";
    if (holiday?.status === "3") {
      marketStatus = `Closed (${holiday.name || "Holiday"})`;
    } else if (live?.set && live.set !== "--") {
      marketStatus = "Open";
    } else if (result && result.length > 0) {
      marketStatus = "Closed";
    }

    // Use live data if available, otherwise use latest result
    let setIndex: number | null = null;
    let value: number | null = null;
    let twod = "--";
    let marketDateTime = serverTime || null;

    if (live?.set && live.set !== "--") {
      // Market is open - use live data
      setIndex = parseFloat(String(live.set).replace(/,/g, ""));
      value = parseFloat(String(live.value).replace(/,/g, ""));
      twod = live.twod || "--";
      marketDateTime = live.time ? `${live.date} ${live.time}` : serverTime;
      marketStatus = "Open (Live)";
    } else if (result && result.length > 0) {
      // Market closed - use latest result
      const latest = result[result.length - 1];
      setIndex = parseFloat(String(latest.set).replace(/,/g, ""));
      value = parseFloat(String(latest.value).replace(/,/g, ""));
      twod = latest.twod || "--";
      marketDateTime = latest.stock_datetime || serverTime;
    }

    const payload = {
      data: {
        setIndex,
        value,
        calculated2d: twod,
        marketStatus,
        marketDateTime,
        serverTime,
        fetchedAt: new Date().toISOString(),
        live: live,
        results: result || [],
        holiday: holiday || null,
      },
    };

    return new Response(JSON.stringify(payload), {
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

function parseNumeric(raw: unknown): number | null {
  const val = Number(String(raw ?? "").replace(/,/g, "").trim());
  return Number.isFinite(val) ? val : null;
}
