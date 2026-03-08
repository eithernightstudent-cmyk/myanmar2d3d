import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      colorTheme: document.documentElement.classList.contains("dark") ? "dark" : "light",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: "100%",
      tabs: [
        {
          title: "SET Index",
          symbols: [
            { s: "SET:SET", d: "SET Index" },
            { s: "SET:SET50", d: "SET50 Index" },
            { s: "SET:SET100", d: "SET100 Index" },
            { s: "SET:MAI", d: "MAI Index" },
          ],
          originalTitle: "SET Index",
        },
      ],
    });

    containerRef.current.appendChild(script);
  }, []);

  // Re-render on theme change
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";

      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
      script.async = true;
      script.type = "text/javascript";
      script.innerHTML = JSON.stringify({
        colorTheme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        dateRange: "1D",
        showChart: true,
        locale: "en",
        largeChartUrl: "",
        isTransparent: true,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        width: "100%",
        height: "100%",
        tabs: [
          {
            title: "SET Index",
            symbols: [
              { s: "SET:SET", d: "SET Index" },
              { s: "SET:SET50", d: "SET50 Index" },
              { s: "SET:SET100", d: "SET100 Index" },
              { s: "SET:MAI", d: "MAI Index" },
            ],
            originalTitle: "SET Index",
          },
        ],
      });

      containerRef.current.appendChild(script);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="rounded-3xl border border-border bg-card/90 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md overflow-hidden"
    >
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-display text-base font-bold tracking-wide text-foreground">
          TradingView — SET Market Overview
        </h3>
        <p className="mt-0.5 font-display text-[0.7rem] text-muted-foreground">
          Live chart powered by TradingView
        </p>
      </div>
      <div
        ref={containerRef}
        className="tradingview-widget-container h-[420px] w-full"
      />
    </motion.article>
  );
}
