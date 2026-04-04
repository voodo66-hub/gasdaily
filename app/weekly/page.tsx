"use client";

import { useEffect, useState } from "react";

interface WeeklyReport {
  status: "ok" | "generating" | "failed";
  week_start: string;
  week_end: string;
  generated_at: string;
  author?: string;
  一_核心结论: {
    本周总结: string;
    上周同期: string;
    变化点评: string;
  };
  二_价格变化: {
    华北: { [product: string]: WoWCell };
    华东: { [product: string]: WoWCell };
    华南: { [product: string]: WoWCell };
    全国亮点: WoWHighlight[];
  };
  三_供给侧: { 动态: string; 影响: string }[];
  四_需求侧: { 行业: string; 状态: string; 变化: string }[];
  五_行动建议: { 维度: string; 建议: string; 优先级: "高" | "中" | "低" }[];
  六_下周展望: string;
  数据说明?: string;
}

interface WoWCell {
  当前价格: string;
  上周价格: string;
  变化额: string;
  变化率: string;
  趋势: "↑" | "↓" | "→";
}

interface WoWHighlight {
  产品: string;
  地区: string;
  描述: string;
  变化率: string;
}

type FetchState = "loading" | "ok" | "error";

const TREND_COLOR: Record<string, string> = { "↑": "#4ade80", "↓": "#f87171", "→": "#94a3b8" };
const PRIORITY_COLOR: Record<string, string> = { 高: "#f87171", 中: "#fbbf24", 低: "#4ade80" };

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", borderBottom: "1px solid #30363d", paddingBottom: "10px" }}>
      <span style={{ fontSize: "1.2rem" }}>{icon}</span>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#58a6ff", margin: 0 }}>{title}</h2>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "10px", padding: "18px 22px", marginBottom: "14px", ...style }}>
      {children}
    </div>
  );
}

function WoWBadge({ t }: { t: string }) {
  return <span style={{ color: TREND_COLOR[t] ?? "#94a3b8", fontWeight: 700, fontSize: "0.85rem" }}>{t}</span>;
}

function PriceChangeCard({ 当前价格, 上周价格, 变化额, 变化率, 趋势 }: WoWCell) {
  const tc = TREND_COLOR[趋势] ?? "#94a3b8";
  return (
    <div style={{ background: "#0d1117", border: `1px solid ${tc}40`, borderRadius: "8px", padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "8px" }}>{当前价格}</div>
      <div style={{ fontSize: "0.7rem", color: "#484f58", marginBottom: "6px" }}>上周：{上周价格}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
        <WoWBadge t={趋势} />
        <span style={{ color: tc, fontWeight: 700, fontSize: "0.85rem" }}>{变化额}</span>
      </div>
      <div style={{ fontSize: "0.72rem", color: "#484f58" }}>{变化率}</div>
    </div>
  );
}

export default function WeeklyPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("loading");

  useEffect(() => {
    fetch("./weekly_report.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() as Promise<WeeklyReport>; })
      .then((data: WeeklyReport) => { setReport(data); setFetchState(data.status === "ok" ? "ok" : "error"); })
      .catch(() => setFetchState("error"));
  }, []);

  if (fetchState === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <span style={{ color: "#58a6ff" }}>⏳ 加载周报中…</span>
      </div>
    );
  }

  if (fetchState === "error" || !report || report.status !== "ok") {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1c2128", border: "2px solid #f85149", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", marginBottom: 24 }}>⚠️</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f85149", marginBottom: 12 }}>周报尚未生成</h1>
        <p style={{ fontSize: "1rem", color: "#8b949e", maxWidth: 440 }}>周五 9:30 后刷新，或手动运行 `bash run_daily.sh --weekly`</p>
      </div>
    );
  }

  const fmtDate = (d: string) => new Date(d + "T00:00:00+08:00").toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric" });
  const core = report.一_核心结论;

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "ui-sans-serif, system-ui, sans-serif", paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #30363d", padding: "18px 24px 14px", position: "sticky", top: 0, background: "#0d1117ee", backdropFilter: "blur(10px)", zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#58a6ff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <a href="/weekly" style={{ color: "#58a6ff", textDecoration: "none" }}>📊 工业气体产业周报</a>
              <a href="/" style={{ fontSize: "0.72rem", color: "#58a6ff", textDecoration: "none", background: "#0d1117", border: "1px solid #30363d", borderRadius: "4px", padding: "2px 8px", fontWeight: 600 }}>⚗ 日报</a>
              <a href="/monthly" style={{ fontSize: "0.72rem", color: "#fbbf24", textDecoration: "none", background: "#0d1117", border: "1px solid #9a6a00", borderRadius: "4px", padding: "2px 8px", fontWeight: 600 }}>📅 月报</a>
            </h1>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.9rem", color: "#c9d1d9" }}>{fmtDate(report.week_start)} — {fmtDate(report.week_end)}</div>
              <div style={{ fontSize: "0.75rem", color: "#484f58" }}>{report.author ?? "Air Liquide 京津冀业务区"}</div>
            </div>
          </div>
          <p style={{ fontSize: "0.72rem", color: "#484f58", marginTop: 6 }}>数据来源：卓创资讯 · 空分之家 · 企业公告 · 生成时间 {new Date(report.generated_at).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px" }}>

        {/* 一、核心结论 */}
        <Card>
          <SectionHeader icon="🧭" title="一、本周核心结论" />
          <div style={{ background: "linear-gradient(135deg, #161b22 0%, #1c2128 100%)", border: "1px solid #58a6ff", borderRadius: "8px", padding: "14px 18px", textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "6px" }}>本周一句话</div>
            <p style={{ fontSize: "0.95rem", color: "#e6edf3", margin: 0, fontWeight: 600, lineHeight: 1.7 }}>{core.本周总结}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ fontSize: "0.72rem", color: "#484f58", fontWeight: 700, marginBottom: "6px" }}>上周同期</div>
              <p style={{ fontSize: "0.8rem", color: "#8b949e", margin: 0, lineHeight: 1.6 }}>{core.上周同期}</p>
            </div>
            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ fontSize: "0.72rem", color: "#484f58", fontWeight: 700, marginBottom: "6px" }}>变化点评</div>
              <p style={{ fontSize: "0.8rem", color: "#8b949e", margin: 0, lineHeight: 1.6 }}>{core.变化点评}</p>
            </div>
          </div>
        </Card>

        {/* 二、价格变化 */}
        <Card>
          <SectionHeader icon="📈" title="二、本周价格变化（环比上周）" />
          {(["华北", "华东", "华南"] as const).map((region) => {
            const regionData = (report.二_价格变化 as any)[region];
            if (!regionData) return null;
            const regionColor: Record<string, string> = { 华北: "#58a6ff", 华东: "#4ade80", 华南: "#fbbf24" };
            return (
              <div key={region} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.82rem", color: regionColor[region], fontWeight: 700, marginBottom: "10px" }}>{region}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {(Object.entries(regionData) as [string, WoWCell][]).map(([prod, cell]) => (
                    <PriceChangeCard key={prod} {...cell} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* 全国亮点 */}
          {report.二_价格变化.全国亮点?.length > 0 && (
            <div style={{ marginTop: "16px", background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ fontSize: "0.78rem", color: "#58a6ff", fontWeight: 700, marginBottom: "10px" }}>🔥 全国亮点</div>
              {report.二_价格变化.全国亮点.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < report.二_价格变化.全国亮点.length - 1 ? "1px solid #21262d" : "none" }}>
                  <span style={{ color: "#f87171", fontWeight: 700, fontSize: "0.78rem", whiteSpace: "nowrap" }}>{h.变化率}</span>
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "#c9d1d9", fontWeight: 600 }}>{h.产品} · {h.地区}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8b949e", marginTop: "2px" }}>{h.描述}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 三、供给侧 */}
        {report.三_供给侧?.length > 0 && (
          <Card>
            <SectionHeader icon="🏭" title="三、本周供给侧动态" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {report.三_供给侧.map((s, i) => (
                <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                  <p style={{ fontSize: "0.8rem", color: "#8b949e", margin: "0 0 6px", lineHeight: 1.5 }}>{s.动态}</p>
                  {s.影响 && <div style={{ fontSize: "0.75rem", color: "#c9d1d9" }}><span style={{ color: "#58a6ff" }}>影响：</span>{s.影响}</div>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 四、需求侧 */}
        {report.四_需求侧?.length > 0 && (
          <Card>
            <SectionHeader icon="🧪" title="四、本周需求侧变化" />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {report.四_需求侧.map((d, i) => (
                <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "10px 14px", display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "#79c0ff", fontWeight: 700, minWidth: "90px" }}>{d.行业}</span>
                  <span style={{ fontSize: "0.78rem", color: "#c9d1d9", flex: 1 }}>{d.状态}</span>
                  <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>{d.变化}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 五、行动建议 */}
        {report.五_行动建议?.length > 0 && (
          <Card>
            <SectionHeader icon="📌" title="五、下周行动建议" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {report.五_行动建议.map((a, i) => (
                <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ color: PRIORITY_COLOR[a.优先级 ?? "中"], fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap", minWidth: "24px" }}>{a.优先级}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", color: "#58a6ff", fontWeight: 700, marginBottom: "4px" }}>{a.维度}</div>
                    <div style={{ fontSize: "0.78rem", color: "#c9d1d9", lineHeight: 1.6 }}>{a.建议}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 六、下周展望 */}
        {report.六_下周展望 && (
          <Card>
            <SectionHeader icon="🔭" title="六、下周展望" />
            <p style={{ fontSize: "0.85rem", color: "#c9d1d9", lineHeight: 1.7, margin: 0 }}>{report.六_下周展望}</p>
          </Card>
        )}

        {report.数据说明 && (
          <p style={{ fontSize: "0.72rem", color: "#484f58", textAlign: "center", marginTop: "8px" }}>{report.数据说明}</p>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #21262d", textAlign: "center", padding: "20px", fontSize: "0.75rem", color: "#484f58" }}>
        Air Liquide 京津冀业务区 · 工业气体产业周报 · {report.week_start} 至 {report.week_end}
      </footer>
    </div>
  );
}
