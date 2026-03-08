const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_URL = "https://api.thaistock2d.com";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "live";
    const date = url.searchParams.get("date") || "";
    const twod = url.searchParams.get("twod") || "";

    let apiUrl: string;

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
      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Fetching: ${apiUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(apiUrl, {
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

    const data = await response.json();

    // For the live endpoint, enrich the response
    if (endpoint === "live") {
      const live = data?.live;
      const result = data?.result;
      const holiday = data?.holiday;

      let marketStatus = "Unknown";
      if (holiday?.status === "3") {
        marketStatus = `Closed (${holiday.name || "Holiday"})`;
      } else if (live?.set && live.set !== "--") {
        marketStatus = "Open (Live)";
      } else if (result && result.length > 0) {
        marketStatus = "Closed";
      }

      let setIndex: number | null = null;
      let value: number | null = null;
      let calculatedTwod = "--";
      let marketDateTime = data?.server_time || null;

      if (live?.set && live.set !== "--") {
        setIndex = parseFloat(String(live.set).replace(/,/g, ""));
        value = parseFloat(String(live.value).replace(/,/g, ""));
        calculatedTwod = live.twod || "--";
        marketDateTime = live.time || data?.server_time;
      } else if (result && result.length > 0) {
        const latest = result[result.length - 1];
        setIndex = parseFloat(String(latest.set).replace(/,/g, ""));
        value = parseFloat(String(latest.value).replace(/,/g, ""));
        calculatedTwod = latest.twod || "--";
        marketDateTime = latest.stock_datetime || data?.server_time;
      }

      return new Response(JSON.stringify({
        data: {
          setIndex,
          value,
          calculated2d: calculatedTwod,
          marketStatus,
          marketDateTime,
          serverTime: data?.server_time,
          fetchedAt: new Date().toISOString(),
          live,
          results: result || [],
          holiday: holiday || null,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For all other endpoints, pass through the data
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
