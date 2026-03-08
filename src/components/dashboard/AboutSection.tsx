import { motion } from "framer-motion";
import { Clock, BarChart3, Database, Globe, Sunrise, Sun, CloudSun, Sunset } from "lucide-react";
import { tap } from "@/lib/haptic";

const SESSIONS = [
  { time: "11:00 AM", label: "Morning", Icon: Sunrise, anim: "anim-float", gradient: "from-amber-400 to-orange-500" },
  { time: "12:00 PM", label: "Noon", Icon: Sun, anim: "anim-pulse-glow", gradient: "from-yellow-400 to-amber-500" },
  { time: "3:00 PM", label: "Afternoon", Icon: CloudSun, anim: "anim-cloud-drift", gradient: "from-sky-400 to-blue-500" },
  { time: "4:30 PM", label: "Closing", Icon: Sunset, anim: "anim-float", gradient: "from-orange-400 to-rose-500" },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "SET Official Data",
    desc: "Thai Stock Exchange (SET) official index data မှ တိုက်ရိုက် ရယူထားပါသည်။",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    desc: "Market ဖွင့်ချိန်တွင် 20 စက္ကန့်တိုင်း auto-refresh ဖြစ်ပါသည်။",
  },
  {
    icon: Database,
    title: "100+ Records",
    desc: "SET index historical data များကို ပြန်လည်ကြည့်ရှုနိုင်ပါသည်။",
  },
  {
    icon: Globe,
    title: "Myanmar Time",
    desc: "အချိန်များကို Myanmar Standard Time (UTC+6:30) ဖြင့် ပြသပါသည်။",
  },
];

export function AboutSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mt-10"
    >
      {/* Section Header */}
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl font-bold" style={{ color: "hsl(var(--text-strong))" }}>
          About Myanmar 2D Live
        </h2>
        <p className="mt-2 font-body text-sm max-w-xl mx-auto" style={{ color: "hsl(var(--text-secondary))" }}>
          Thai Stock Exchange (SET) official index data ကို အခြေခံ၍ နေ့စဉ် 2D ရလဒ်များကို real-time ပေးပို့သော app ဖြစ်ပါသည်။
        </p>
      </div>

      {/* 4 Sessions with animated icons */}
      <div className="mb-8">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground text-center mb-4">
          Daily 2D Sessions (Myanmar Time)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SESSIONS.map((s) => (
            <div
              key={s.time}
              onTouchStart={() => tap()}
              className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg active:scale-95 transition-transform duration-150"
            >
              {/* Animated 3D-style icon */}
              <div className={`${s.anim} relative`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} shadow-lg`}>
                  <s.Icon className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.2} />
                </div>
              </div>
              <span className="font-display text-lg font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                {s.time}
              </span>
              <span className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            onTouchStart={() => tap()}
            className="flex items-start gap-4 rounded-2xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg active:scale-[0.98] transition-transform duration-150"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                {f.title}
              </h4>
              <p className="mt-1 font-body text-xs leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Source Note */}
      <p className="mt-6 text-center font-body text-[0.7rem] text-muted-foreground">
        Data Source:{" "}
        <a
          href="https://www.set.or.th/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Stock Exchange of Thailand (SET)
        </a>
        {" "}| API Provider:{" "}
        <span className="font-semibold">RapidAPI (thai-lotto-new-api)</span>
        {" "}& <span className="font-semibold">api.thaistock2d.com</span>
      </p>
    </motion.section>
  );
}
