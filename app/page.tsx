"use client";

import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PriceItem {
  price:  string;
  trend:  string;
  change: string;
}

interface PriceTrends {
  [city: string]: {
    [product: string]: PriceItem;
  };
}

interface NewsItem {
  title:  string;
  source?: string;
  date?:  string;
  region?: string;
  url?:    string;
  summary?: string;
}

interface ReportData {
  status:               "ok" | "generating" | "failed";
  date:                 string;
  generated_at:         string;
  price_trends:         PriceTrends;
  national_avg_comment: string;
  project_news:         NewsItem[];
  competitor_news:      NewsItem[];
  policy_news:          NewsItem[];
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

function TrendBadge({ change, trend }: { change: string; trend: string }) {
  const color = TREND_COLOR[trend] ?? "#94a3b8";
  const icon  = TREND_ICON[trend]  ?? "—";
  return (
    <span style={{ color, fontWeight: 700, fontSize: "0.8rem" }}>
      {icon}{change}
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
        marginBottom:  "16px",
      }}
    >
      <h2
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "8px",
          fontSize:     "1rem",
          fontWeight:   700,
          color:        "#58a6ff",
          marginBottom: "14px",
          borderBottom: "1px solid #30363d",
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

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState({ generatedAt }: { generatedAt: string | null }) {
  const label = generatedAt
    ? `生成时间：每天 9:30（仅工作日）｜最近尝试：${new Date(generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`
    : "生成时间：每天 9:30（仅工作日）";

  return (
    <div
      style={{
        minHeight:       "100vh",
        background:      "#0d1117",
        color:           "#e6edf3",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        fontFamily:      "ui-sans-serif, system-ui, sans-serif",
        padding:         "40px 20px",
        textAlign:       "center",
      }}
    >
      <div
        style={{
          width:         72,
          height:        72,
          borderRadius:  "50%",
          background:    "#1c2128",
          border:        "2px solid #f85149",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          fontSize:      "32px",
          marginBottom:  24,
        }}
      >
        ⚠️
      </div>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f85149", marginBottom: 12 }}>
        数据获取失败
      </h1>
      <p style={{ fontSize: "1rem", color: "#8b949e", maxWidth: 440, lineHeight: 1.7, marginBottom: 8 }}>
        今日日报尚未生成，请稍后刷新页面。
      </p>
      <p style={{ fontSize: "0.85rem", color: "#484f58", marginTop: 4 }}>
        {label}
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop:     28,
          padding:       "10px 28px",
          background:    "#238636",
          color:         "#ffffff",
          border:        "none",
          borderRadius:  6,
          fontSize:      "0.9rem",
          fontWeight:    600,
          cursor:        "pointer",
        }}
        onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "#2ea043")}
        onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "#238636")}
      >
        🔄 重新加载
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GasDailyPage() {
  const [report,     setReport]     = useState<ReportData | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("loading");

  useEffect(() => {
    fetch("/gasdaily/report.json")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json() as Promise<ReportData>;
      })
      .then((data: ReportData) => {
        setReport(data);
        // status !== 'ok' → 显示刷新提示（不展示旧数据兜底）
        setFetchState(data.status === "ok" ? "ok" : "error");
      })
      .catch(() => {
        setFetchState("error");
      });
  }, []);

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
        <span style={{ color: "#58a6ff", fontSize: "1rem" }}>⏳ 加载中…</span>
      </div>
    );
  }

  if (fetchState === "error" || !report) {
    return <ErrorState generatedAt={null} />;
  }

  if (report.status !== "ok") {
    return <ErrorState generatedAt={report.generated_at ?? null} />;
  }

  // ── Normal view ──
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
        minHeight:  "100vh",
        background: "#0d1117",
        color:      "#e6edf3",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        paddingBottom: 60,
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom:   "1px solid #30363d",
          padding:        "20px 24px 16px",
          position:      "sticky",
          top:            0,
          background:     "#0d1117ee",
          backdropFilter: "blur(8px)",
          zIndex:         10,
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            style={{
              display:         "flex",
              alignItems:     "baseline",
              justifyContent: "space-between",
              flexWrap:       "wrap",
              gap:            8,
            }}
          >
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#58a6ff", margin: 0 }}>
              🏭 工业气体日报
            </h1>
            <span style={{ fontSize: "0.85rem", color: "#8b949e" }}>{fmtDate}</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "#484f58", marginTop: 4 }}>
            数据来源：卓创资讯 · 我的钢铁网 · 隆众资讯 · 生成时间 {fmtGenTime}
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 24px" }}>

        {/* ── Section 1: 京津冀价格行情 ── */}
        <SectionCard icon="📊" title="京津冀价格行情">
          <div
            style={{
              display:           "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap:               16,
              marginBottom:      12,
            }}
          >
            {cities.map((city) => (
              <div
                key={city}
                style={{
                  background:  "#0d1117",
                  border:      "1px solid #30363d",
                  borderRadius: 8,
                  padding:     "14px 16px",
                }}
              >
                <h3
                  style={{
                    fontSize:     "0.9rem",
                    fontWeight:   700,
                    color:        "#79c0ff",
                    marginBottom: 10,
                    borderBottom: "1px solid #21262d",
                    paddingBottom: 6,
                  }}
                >
                  {city}
                </h3>
                {Object.entries(report.price_trends[city]).map(([prod, item]) => (
                  <div
                    key={prod}
                    style={{
                      display:        "flex",
                      justifyContent: "space-between",
                      alignItems:     "center",
                      padding:        "5px 0",
                      borderBottom:   "1px solid #21262d",
                      fontSize:       "0.82rem",
                    }}
                  >
                    <span style={{ color: "#c9d1d9" }}>{prod}</span>
                    <span style={{ color: "#8b949e", fontSize: "0.75rem" }}>{item.price}</span>
                    <TrendBadge change={item.change} trend={item.trend} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 全国均价对比 */}
          {report.national_avg_comment && (
            <div
              style={{
                background:  "#0d1117",
                border:      "1px solid #30363d",
                borderRadius: 8,
                padding:     "12px 16px",
                fontSize:    "0.85rem",
                color:       "#c9d1d9",
              }}
            >
              <span style={{ color: "#58a6ff", fontWeight: 700 }}>全国均价对比：</span>
              {report.national_avg_comment}
            </div>
          )}
        </SectionCard>

        {/* ── Section 2: 全国新项目动态 ── */}
        <SectionCard icon="🏗️" title="全国新项目动态">
          {report.project_news.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {report.project_news.map((item, i) => (
                <li key={i} style={{padding: "10px 0", borderBottom: i < report.project_news.length - 1 ? "1px solid #21262d" : "none"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom: item.summary ? 4 : 0}}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{color:"#58a6ff",textDecoration:"underline",flex:1,fontSize:"0.88rem",fontWeight:600}}>{item.title}</a>
                    ) : (
                      <span style={{flex:1,fontSize:"0.88rem",fontWeight:600,color:"#c9d1d9"}}>{item.title}</span>
                    )}
                    <span style={{color:"#484f58",fontSize:"0.75rem",flexShrink:0,whiteSpace:"nowrap"}}>
                      {item.region && `${item.region} · `}{item.date}
                    </span>
                  </div>
                  {item.summary && <p style={{fontSize:"0.8rem",color:"#8b949e",lineHeight:1.5,margin:"2px 0 0",paddingLeft:0}}>{item.summary}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "0.88rem", color: "#484f58", margin: 0 }}>暂无</p>
          )}
        </SectionCard>

        {/* ── Section 3: 竞争动态 ── */}
        <SectionCard icon="🔍" title="竞争动态">
          <div
            style={{
              display:   "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap:       12,
            }}
          >
            {report.competitor_news.length > 0 ? (
              report.competitor_news.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background:   "#0d1117",
                    border:       "1px solid #21262d",
                    borderRadius: 6,
                    padding:      "12px 14px",
                  }}
                >
                  <p style={{fontSize:"0.85rem",color:"#c9d1d9",margin:"0 0 4px",lineHeight:1.5,fontWeight:600}}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{color:"#79c0ff",textDecoration:"underline"}}>{item.title}</a>
                    ) : (
                      item.title
                    )}
                  </p>
                  {item.summary && <p style={{fontSize:"0.78rem",color:"#8b949e",lineHeight:1.5,margin:"0 0 6px"}}>{item.summary}</p>}
                  <p style={{fontSize:"0.75rem",color:"#484f58",margin:0}}>
                    {item.source && `来源：${item.source}`}
                    {item.source && item.date && " · "}
                    {item.date}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "0.88rem", color: "#484f58", margin: 0, gridColumn: "1/-1" }}>暂无</p>
            )}
          </div>

          {/* 竞品图例 */}
          {report.competitor_news.length > 0 && (
            <div
              style={{
                marginTop:  12,
                fontSize:   "0.75rem",
                color:      "#484f58",
                display:    "flex",
                flexWrap:   "wrap",
                gap:        "4px 16px",
              }}
            >
              <span>🔵 林德</span>
              <span>🔵 液空</span>
              <span>🔵 空气化工</span>
              <span>🔵 杭氧</span>
              <span>🔵 金宏</span>
              <span>🔵 赢德</span>
            </div>
          )}
        </SectionCard>

        {/* ── Section 4: 政策与行业动态（无内容则跳过）── */}
        {report.policy_news && report.policy_news.length > 0 && (
          <SectionCard icon="📋" title="政策与行业动态">
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
                    justifyContent: "space-between",
                    flexWrap:     "wrap",
                    gap:          4,
                  }}
                >
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{color: "#58a6ff", textDecoration: "underline", flex: 1}}>{item.title}</a>
                  ) : (
                    <span style={{flex: 1}}>{item.title}</span>
                  )}
                  <span style={{ color: "#484f58", fontSize: "0.75rem", flexShrink: 0 }}>
                    {item.source && `${item.source} · `}{item.date}
                    {item.url && <> · <a href={item.url} target="_blank" rel="noopener noreferrer" style={{color: "#58a6ff"}}>🔗</a></>}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop:  "1px solid #21262d",
          textAlign:  "center",
          padding:    "20px",
          fontSize:   "0.75rem",
          color:      "#484f58",
        }}
      >
        Air Liquide 京津冀业务区 · 工业气体日报 · {report.date} {fmtGenTime} 生成
      </footer>
    </div>
  );
}
