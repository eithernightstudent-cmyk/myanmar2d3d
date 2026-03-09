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

function parseHistoryHtml(html: string): { result2d: string; updatedAt: string; entries: HistoryEntry[] } {
  // Extract the main 2D result
  const resultMatch = html.match(/<h2 class="static"><span>(\d{2})<\/span><\/h2>/);
  const result2d = resultMatch?.[1] || "--";

  // Extract updated timestamp
  const updatedMatch = html.match(/Updated:(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
  const updatedAt = updatedMatch?.[1]?.trim() || "";

  // Extract rows
  const entries: HistoryEntry[] = [];
  const rowRegex = /<div class="row el-row(?: active_bgNumber)?"[^>]*>.*?<h4>(\d{2}:\d{2}:\d{2})<\/h4>.*?<div class="set_data[^"]*">(.*?)<\/div>\s*<div class="value_data[^"]*">(.*?)<\/div>\s*<div class="el-col[^"]*">.*?>([\s\S]*?)<\/span>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const time = match[1];
    const setSpans = match[2];
    const valueSpans = match[3];
    const twod = match[4].trim();

    // Extract digits from spans
    const setVal = (setSpans.match(/<span>([^<]+)<\/span>/g) || [])
      .map((s: string) => s.replace(/<\/?span>/g, ""))
      .join("");
    const valueVal = (valueSpans.match(/<span>([^<]+)<\/span>/g) || [])
      .map((s: string) => s.replace(/<\/?span>/g, ""))
      .join("");

    const isResult = match[0].includes("active_bgNumber");

    entries.push({ time, set: setVal, value: valueVal, twod, isResult });
  }

  return { result2d, updatedAt, entries };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let historyId = "";

    const url = new URL(req.url);
    historyId = url.searchParams.get("history_id") || "";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        historyId = body.history_id || historyId;
      } catch { /* no body */ }
    }

    if (!historyId) {
      return new Response(
        JSON.stringify({ error: "history_id is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Fetching 2D history for:", historyId);

    const pageUrl = `https://www.thaistock2d.com/twodHistory_ByResult?history_id=${encodeURIComponent(historyId)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; KKTech-Dashboard/1.0)",
        "accept": "text/html",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const parsed = parseHistoryHtml(html);

    console.log(`Parsed ${parsed.entries.length} entries, result: ${parsed.result2d}`);

    return new Response(
      JSON.stringify({ data: parsed }),
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
