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

function extractSpanDigits(html: string): string {
  return (html.match(/<span>([^<]*)<\/span>/g) || [])
    .map((s: string) => s.replace(/<\/?span>/g, "").trim())
    .join("");
}

function parseHistoryHtml(html: string): { result2d: string; updatedAt: string; entries: HistoryEntry[] } {
  // Extract the main 2D result
  const resultMatch = html.match(/<h2 class="static"><span>(\d{2})<\/span><\/h2>/);
  const result2d = resultMatch?.[1] || "--";

  // Extract updated timestamp
  const updatedMatch = html.match(/Updated:<\/span>\s*<span>([^<]+)<\/span>/);
  const updatedAt = updatedMatch?.[1]?.trim() || "";

  // Extract rows - match each row div
  const entries: HistoryEntry[] = [];
  const rowRegex = /<div class="row el-row(?: active_bgNumber)?"[^>]*>([\s\S]*?)<\/div><\/div><\/div>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const rowHtml = match[0];
    const isResult = rowHtml.includes("active_bgNumber");

    // Extract time
    const timeMatch = rowHtml.match(/<h4>(\d{2}:\d{2}:\d{2})<\/h4>/);
    if (!timeMatch) continue;
    const time = timeMatch[1];

    // Extract set_data
    const setMatch = rowHtml.match(/<div class="set_data[^"]*">([\s\S]*?)<\/div>/);
    const setVal = setMatch ? extractSpanDigits(setMatch[1]) : "";

    // Extract value_data
    const valueMatch = rowHtml.match(/<div class="value_data[^"]*">([\s\S]*?)<\/div>/);
    const valueVal = valueMatch ? extractSpanDigits(valueMatch[1]) : "";

    // Extract 2D number - last el-col span with the bold style
    const twodMatch = rowHtml.match(/<div class="el-col el-col-6"><span[^>]*>[\s\S]*?(\d{2})[\s\S]*?<\/span><\/div>/);
    // Fallback: just get the last bold number
    const twodFallback = rowHtml.match(/font-weight:\s*bold[^>]*>\s*(\d{2})\s*<\/span>/);
    const twod = (twodMatch?.[1] || twodFallback?.[1] || "").trim();

    if (time && twod) {
      entries.push({ time, set: setVal, value: valueVal, twod, isResult });
    }
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
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log("HTML length:", html.length, "Last 1000 chars:", html.substring(html.length - 1000));
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
