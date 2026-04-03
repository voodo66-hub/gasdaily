"use client";

import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PriceItem {
  range: string;
  today: string;
  trend: "up" | "down" | "flat";
  change: string;
}

interface PriceTrends {
  [city: string]: {
    [product: string]: PriceItem;
  };
}

interface NewsItem {
  title: string;
  source?: string;
  date?: string;
  url?: string;
  region?: string;
}

interface ReportData {
  status: "ok" | "generating" | "failed";
  date: string;
  generated_at: string;
  price_trends: PriceTrends;
  industry_news: NewsItem[];
  project_news: NewsItem[];
  policy_news: NewsItem[];
  market_commentary: string;
}

type FetchState = "loading" | "ok" | "error";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TREND_ICON: Record<string, string> = {
  up:   "↑",
  down: "↓",
  flat: "—",
};

const TREND_COLOR: Record<string, string> = {
  up:   "#4ade80",
  down: "#f87171",
  flat: "#94a3b8",
};

function TrendBadge({ item }: { item: PriceItem }) {
  const color = TREND_COLOR[item.trend] ?? "#94a3b8";
  const icon  = TREND_ICON[item.trend] ?? "—";
  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           "2px",
        color,
        fontWeight:    700,
        fontSize:      "0.8rem",
      }}
    >
      {icon}{item.change}
    </span>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background:    "#161b22",
        border:        "1px solid #30363d",
        borderRadius:  "10px",
        padding:       "20px 24px",
        marginBottom: "16px",
      }}
    >
      <h2
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         "8px",
          fontSize:    "1rem",
          fontWeight:  700,
          color:       "#58a6ff",
          marginBottom:"14px",
          borderBottom:"1px solid #30363d",
          paddingBottom:"8px",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Error State Component ───────────────────────────────────────────────────

function ErrorState({ generatedAt }: { generatedAt: string | null }) {
  const label = generatedAt
    ? `生成时间：每天 9:30（仅工作日）｜最近尝试：${new Date(generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`
    : "生成时间：每天 9:30（仅工作日）";

  return (
    <div
      style={{
        minHeight:   "100vh",
        background:  "#0d1117",
        color:       "#e6edf3",
        display:     "flex",
        flexDirection:"column",
        alignItems:  "center",
        justifyContent:"center",
        fontFamily:  "ui-sans-serif, system-ui, sans-serif",
        padding:     "40px 20px",
        textAlign:   "center",
      }}
    >
      {/* Logo / Icon */}
      <div
        style={{
          width:        72,
          height:       72,
          borderRadius: "50%",
          background:   "#1c2128",
          border:       "2px solid #f85149",
          display:      "flex",
          alignItems:   "center",
          justifyContent:"center",
          fontSize:     "32px",
          marginBottom: 24,
        }}
      >
        ⚠️
      </div>

      <h1
        style={{
          fontSize:     "1.5rem",
          fontWeight:   700,
          color:        "#f85149",
          marginBottom: 12,
        }}
      >
        数据获取失败
      </h1>

      <p
        style={{
          fontSize:     "1rem",
          color:        "#8b949e",
          maxWidth:     440,
          lineHeight:   1.7,
          marginBottom: 8,
        }}
      >
        今日日报尚未生成，请稍后刷新页面。
      </p>

      <p
        style={{
          fontSize:     "0.85rem",
          color:        "#484f58",
          marginTop:    4,
        }}
      >
        {label}
      </p>

      {/* Refresh button */}
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop:   28,
          padding:     "10px 28px",
          background:  "#238636",
          color:       "#ffffff",
          border:      "none",
          borderRadius:6,
          fontSize:    "0.9rem",
          fontWeight:  600,
          cursor:      "pointer",
          transition:  "background 0.2s",
        }}
        onMouseEnter={(e) =>
          ((e.target as HTMLButtonElement).style.background = "#2ea043")
        }
        onMouseLeave={(e) =>
          ((e.target as HTMLButtonElement).style.background = "#238636")
        }
      >
        🔄 重新加载
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GasDailyPage() {
  const [report,    setReport]    = useState<ReportData | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("loading");

  useEffect(() => {
    fetch("/report.json")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json() as Promise<ReportData>;
      })
      .then((data: ReportData) => {
        setReport(data);
        // status !== 'ok' 也按 error 处理，显示刷新提示
        setFetchState(data.status === "ok" ? "ok" : "error");
      })
      .catch(() => {
        setFetchState("error");
      });
  }, []);

  // ── Error / Loading states ──
  if (fetchState === "loading") {
    return (
      <div
        style={{
          minHeight:  "100vh",
          background: "#0d1117",
          color:      "#e6edf3",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <span style={{ color: "#58a6ff", fontSize: "1rem" }}>
          ⏳ 加载中…
        </span>
      </div>
    );
  }

  if (fetchState === "error" || !report) {
    return <ErrorState generatedAt={null} />;
  }

  // 兜底：status 字段不是 ok 也显示错误状态
  if (report.status !== "ok") {
    return <ErrorState generatedAt={report.generated_at ?? null} />;
  }

  // ── Normal data view ──
  const fmtDate = new Date(report.date + "T00:00:00+08:00").toLocaleDateString(
    "zh-CN",
    { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" }
  );

  const fmtGenTime = new Date(report.generated_at).toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour:   "2-digit",
    minute: "2-digit",
  });

  const cities = Object.keys(report.price_trends);

  return (
    <div
      style={{
        minHeight:   "100vh",
        background:  "#0d1117",
        color:       "#e6edf3",
        fontFamily:  "ui-sans-serif, system-ui, sans-serif",
        paddingBottom: 60,
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          borderBottom: "1px solid #30363d",
          padding:      "20px 24px 16px",
          position:     "sticky",
          top:          0,
          background:   "#0d1117ee",
          backdropFilter:"blur(8px)",
          zIndex:       10,
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            style={{
              display:     "flex",
              alignItems:  "baseline",
              justifyContent:"space-between",
              flexWrap:    "wrap",
              gap:         8,
            }}
          >
            <h1
              style={{
                fontSize:   "1.4rem",
                fontWeight: 800,
                color:      "#58a6ff",
                margin:      0,
              }}
            >
              🏭 工业气体日报
            </h1>
            <span
              style={{
                fontSize:   "0.85rem",
                color:      "#8b949e",
              }}
            >
              {fmtDate}
            </span>
          </div>
          <p
            style={{
              fontSize:   "0.78rem",
              color:      "#484f58",
              marginTop:  4,
            }}
          >
            数据来源：卓创资讯 · 我的钢铁网 · 隆众资讯 · 生成时间 {fmtGenTime}
          </p>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 24px" }}>

        {/* Price Trends */}
        <SectionCard icon="📊" title="价格行情">
          <div
            style={{
              display:   "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap:       16,
            }}
          >
            {cities.map((city) => (
              <div
                key={city}
                style={{
                  background:  "#0d1117",
                  border:      "1px solid #30363d",
                  borderRadius:8,
                  padding:     "14px 16px",
                }}
              >
                <h3
                  style={{
                    fontSize:   "0.9rem",
                    fontWeight: 700,
                    color:      "#79c0ff",
                    marginBottom:10,
                    borderBottom:"1px solid #21262d",
                    paddingBottom:6,
                  }}
                >
                  {city}
                </h3>
                {Object.entries(report.price_trends[city]).map(
                  ([product, item]) => (
                    <div
                      key={product}
                      style={{
                        display:        "flex",
                        justifyContent: "space-between",
                        alignItems:     "center",
                        padding:        "5px 0",
                        borderBottom:   "1px solid #21262d",
                        fontSize:       "0.82rem",
                      }}
                    >
                      <span style={{ color: "#c9d1d9" }}>{product}</span>
                      <span style={{ color: "#8b949e", fontSize: "0.75rem" }}>
                        {item.today}
                      </span>
                      <TrendBadge item={item} />
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Industry News */}
        <SectionCard icon="📰" title="行业动态">
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {report.industry_news.map((item, i) => (
              <li
                key={i}
                style={{
                  padding:      "10px 0",
                  borderBottom: i < report.industry_news.length - 1 ? "1px solid #21262d" : "none",
                }}
              >
                <a
                  href={item.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color:          "#58a6ff",
                    textDecoration: "none",
                    fontSize:       "0.88rem",
                    fontWeight:     600,
                    lineHeight:     1.5,
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLAnchorElement).style.textDecoration =
                      "underline")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLAnchorElement).style.textDecoration =
                      "none")
                  }
                >
                  {item.title}
                </a>
                <div style={{ fontSize: "0.75rem", color: "#484f58", marginTop: 2 }}>
                  {item.source} {item.date ? `· ${item.date}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Project News */}
        {report.project_news.length > 0 && (
          <SectionCard icon="🏭" title="项目动态">
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {report.project_news.map((item, i) => (
                <li
                  key={i}
                  style={{
                    padding:      "8px 0",
                    borderBottom: i < report.project_news.length - 1 ? "1px solid #21262d" : "none",
                    fontSize:     "0.88rem",
                    color:        "#c9d1d9",
                    display:      "flex",
                    justifyContent:"space-between",
                    flexWrap:     "wrap",
                    gap:          4,
                  }}
                >
                  <span>{item.title}</span>
                  <span style={{ color: "#484f58", fontSize: "0.75rem" }}>
                    {item.region} {item.date ? `· ${item.date}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Policy News */}
        {report.policy_news.length > 0 && (
          <SectionCard icon="📋" title="政策&标准">
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {report.policy_news.map((item, i) => (
                <li
                  key={i}
                  style={{
                    padding:      "8px 0",
                    borderBottom: i < report.policy_news.length - 1 ? "1px solid #21262d" : "none",
                    fontSize:     "0.88rem",
                    color:        "#c9d1d9",
                    display:      "flex",
                    justifyContent:"space-between",
                    flexWrap:     "wrap",
                    gap:          4,
                  }}
                >
                  <span>{item.title}</span>
                  <span style={{ color: "#484f58", fontSize: "0.75rem" }}>
                    {item.source} {item.date ? `· ${item.date}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Market Commentary */}
        {report.market_commentary && (
          <SectionCard icon="💡" title="市场简评">
            <p
              style={{
                fontSize:   "0.92rem",
                color:      "#c9d1d9",
                lineHeight: 1.8,
                margin:      0,
              }}
            >
              {report.market_commentary}
            </p>
          </SectionCard>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop:   "1px solid #21262d",
          textAlign:   "center",
          padding:     "20px",
          fontSize:    "0.75rem",
          color:       "#484f58",
        }}
      >
        Air Liquide 京津冀业务区 · 工业气体日报 ·{" "}
        {report.date} {fmtGenTime} 生成
      </footer>
    </div>
  );
}
