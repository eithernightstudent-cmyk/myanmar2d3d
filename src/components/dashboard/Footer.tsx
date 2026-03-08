import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp, BarChart3, Clock, Database, Globe, Sunrise, Sun, CloudSun, Sunset, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tap } from "@/lib/haptic";

interface FooterProps {
  ownerName: string;
}

const SESSIONS = [
  { time: "11:00 AM", label: "Morning", Icon: Sunrise, gradient: "from-amber-400 to-orange-500" },
  { time: "12:00 PM", label: "Noon", Icon: Sun, gradient: "from-yellow-400 to-amber-500" },
  { time: "3:00 PM", label: "Afternoon", Icon: CloudSun, gradient: "from-sky-400 to-blue-500" },
  { time: "4:30 PM", label: "Closing", Icon: Sunset, gradient: "from-orange-400 to-rose-500" },
];

const FEATURES = [
  { icon: BarChart3, title: "SET Official Data", desc: "Thai Stock Exchange (SET) official index data မှ တိုက်ရိုက် ရယူထားပါသည်။" },
  { icon: Clock, title: "Real-time Updates", desc: "Market ဖွင့်ချိန်တွင် 20 စက္ကန့်တိုင်း auto-refresh ဖြစ်ပါသည်။" },
  { icon: Database, title: "100+ Records", desc: "SET index historical data များကို ပြန်လည်ကြည့်ရှုနိုင်ပါသည်။" },
  { icon: Globe, title: "Myanmar Time", desc: "အချိန်များကို Myanmar Standard Time (UTC+6:30) ဖြင့် ပြသပါသည်။" },
];

export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ ownerName }, ref) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <footer ref={ref} className="mt-auto border-t border-border pb-7 pt-5">
        <div className="mx-auto w-[min(100%-1.5rem,72rem)]">
          {/* Info Toggle Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => { tap(); setShowInfo(!showInfo); }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-[hsl(var(--card-glass))] px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-lg transition-all hover:text-foreground hover:border-primary/30 active:scale-95"
            >
              <Info className="h-3.5 w-3.5" />
              <span>About & Data Source</span>
              {showInfo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-border bg-[hsl(var(--card-glass))] p-5 backdrop-blur-lg shadow-[var(--shadow-panel)] mb-5">
                  {/* Title */}
                  <h3 className="font-display text-base font-bold text-center mb-1" style={{ color: "hsl(var(--text-strong))" }}>
                    About Myanmar 2D Live
                  </h3>
                  <p className="text-center font-body text-xs mb-5" style={{ color: "hsl(var(--text-secondary))" }}>
                    Thai Stock Exchange (SET) official index data ကို အခြေခံ၍ နေ့စဉ် 2D ရလဒ်များကို real-time ပေးပို့သော app ဖြစ်ပါသည်။
                  </p>

                  {/* Sessions */}
                  <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground text-center mb-3">
                    Daily 2D Sessions (Myanmar Time)
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {SESSIONS.map((s) => (
                      <div key={s.time} className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background/50 p-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${s.gradient} shadow`}>
                          <s.Icon className="h-4 w-4 text-white" strokeWidth={2.2} />
                        </div>
                        <span className="font-display text-[0.65rem] font-bold" style={{ color: "hsl(var(--text-strong))" }}>{s.time}</span>
                        <span className="font-display text-[0.55rem] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {FEATURES.map((f) => (
                      <div key={f.title} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <f.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-display text-xs font-bold" style={{ color: "hsl(var(--text-strong))" }}>{f.title}</h4>
                          <p className="mt-0.5 font-body text-[0.65rem] leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Data Source */}
                  <div className="rounded-xl border border-border/50 bg-background/50 p-3 text-center">
                    <p className="font-body text-[0.65rem] text-muted-foreground">
                      Data Source:{" "}
                      <a href="https://www.set.or.th/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                        Stock Exchange of Thailand (SET) <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      {" "}| API:{" "}
                      <span className="font-semibold">RapidAPI</span>
                      {" "}& <span className="font-semibold">api.thaistock2d.com</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center font-display text-[0.7rem] font-medium text-muted-foreground sm:text-[0.75rem]">
            © 2026 {ownerName} 2D/3D Live
          </p>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";
