"use client";

import { useEffect, useState } from "react";

interface MonthlyReport {
  status: "ok" | "generating" | "failed";
  month_start: string;
  month_end: string;
  generated_at: string;
  author?: string;
  一_本月总结: {
    核心结论: string;
    成本端: string;
    需求端: string;
    供给端: string;
  };
  二_价格月环比: {
    华北: { [product: string]: MoMCell };
    华东: { [product: string]: MoMCell };
    华南: { [product: string]: MoMCell };
    全国亮点: MoMHighlight[];
  };
  三_供需分析: {
    成本: string;
    供给: string;
    需求: string;
    政策: string;
  };
  四_风险评级: {
    [key: string]: string;
  };
  五_供给侧动态: { 动态: string; 影响: string }[];
  六_行动建议: {
    生产运营: string;
    销售BD: string;
    战略: string;
    管理层: string;
  };
  六_下月展望: string;
  数据说明?: string;
}

interface MoMCell {
  本月价格: string;
  上月价格: string;
  变化额: string;
  变化率: string;
  趋势: "↑" | "↓" | "→";
}

interface MoMHighlight {
  产品: string;
  地区: string;
  描述: string;
  变化率: string;
}

type FetchState = "loading" | "ok" | "error";

const TREND_COLOR: Record<string, string> = { "↑": "#4ade80", "↓": "#f87171", "→": "#94a3b8" };
const RISK_COLOR: Record<string, string> = { 高: "#f87171", 中: "#fbbf24", 低: "#4ade80" };

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

function MoMBadge({ t }: { t: string }) {
  return <span style={{ color: TREND_COLOR[t] ?? "#94a3b8", fontWeight: 700, fontSize: "0.85rem" }}>{t}</span>;
}

function RiskBadge({ level }: { level: string }) {
  return (
    <span style={{
      color: "#0d1117",
      background: RISK_COLOR[level] ?? "#94a3b8",
      borderRadius: "4px", padding: "2px 8px",
      fontSize: "0.72rem", fontWeight: 700,
    }}>{level}</span>
  );
}

function MoMCard({ cell }: { cell: MoMCell }) {
  const tc = TREND_COLOR[cell.趋势] ?? "#94a3b8";
  return (
    <div style={{ background: "#0d1117", border: `1px solid ${tc}40`, borderRadius: "8px", padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "8px" }}>{cell.本月价格}</div>
      <div style={{ fontSize: "0.7rem", color: "#484f58", marginBottom: "6px" }}>上月：{cell.上月价格}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
        <MoMBadge t={cell.趋势} />
        <span style={{ color: tc, fontWeight: 700, fontSize: "0.85rem" }}>{cell.变化额}</span>
      </div>
      <div style={{ fontSize: "0.72rem", color: "#484f58" }}>{cell.变化率}</div>
    </div>
  );
}

export default function MonthlyPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("loading");

  useEffect(() => {
    fetch("./monthly_report.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() as Promise<MonthlyReport>; })
      .then((data: MonthlyReport) => { setReport(data); setFetchState(data.status === "ok" ? "ok" : "error"); })
      .catch(() => setFetchState("error"));
  }, []);

  if (fetchState === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <span style={{ color: "#58a6ff" }}>⏳ 加载月报中…</span>
      </div>
    );
  }

  if (fetchState === "error" || !report || report.status !== "ok") {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1c2128", border: "2px solid #f85149", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", marginBottom: 24 }}>⚠️</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f85149", marginBottom: 12 }}>月报尚未生成</h1>
        <p style={{ fontSize: "1rem", color: "#8b949e", maxWidth: 440 }}>每月最后一天自动生成，或手动运行 `bash run_daily.sh --monthly`</p>
      </div>
    );
  }

  const fmtDate = (d: string) => new Date(d + "T00:00:00+08:00").toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" });
  const core = report.一_本月总结;
  const supply = report.三_供需分析;
  const risks = report.四_风险评级;
  const actions = report.六_行动建议;

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "ui-sans-serif, system-ui, sans-serif", paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #30363d", padding: "18px 24px 14px", position: "sticky", top: 0, background: "#0d1117ee", backdropFilter: "blur(10px)", zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#58a6ff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <a href="/" style={{ color: "#58a6ff", textDecoration: "none" }}>⚗ 日报</a>
              <span style={{ color: "#4ade80", fontSize: "1.1rem" }}>📅</span>
              <span>工业气体产业月报</span>
              <a href="/weekly" style={{ fontSize: "0.72rem", color: "#fbbf24", textDecoration: "none", background: "#0d1117", border: "1px solid #9a6a00", borderRadius: "4px", padding: "2px 8px", fontWeight: 600 }}>📊 周报</a>
            </h1>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.9rem", color: "#c9d1d9" }}>{fmtDate(report.month_start)} — {fmtDate(report.month_end)}</div>
              <div style={{ fontSize: "0.75rem", color: "#484f58" }}>{report.author ?? "Air Liquide 京津冀业务区"}</div>
            </div>
          </div>
          <p style={{ fontSize: "0.72rem", color: "#484f58", marginTop: 6 }}>
            生成时间 {new Date(report.generated_at).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px" }}>

        {/* 一、本月总结 */}
        <Card>
          <SectionHeader icon="🧭" title="一、本月核心结论" />
          <div style={{ background: "linear-gradient(135deg, #161b22 0%, #1c2128 100%)", border: "1px solid #4ade80", borderRadius: "8px", padding: "14px 18px", textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "0.72rem", color: "#4ade80", fontWeight: 700, marginBottom: "6px" }}>本月一句话</div>
            <p style={{ fontSize: "0.95rem", color: "#e6edf3", margin: 0, fontWeight: 600, lineHeight: 1.7 }}>{core.核心结论}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {[
              { label: "成本端", text: core.成本端 },
              { label: "需求端", text: core.需求端 },
              { label: "供给端", text: core.供给端 },
            ].map(({ label, text }) => (
              <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "6px" }}>{label}</div>
                <p style={{ fontSize: "0.8rem", color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 二、价格月环比 */}
        <Card>
          <SectionHeader icon="📈" title="二、本月价格变化（环比上月）" />
          {(["华北", "华东", "华南"] as const).map((region) => {
            const regionData = (report.二_价格月环比 as any)[region];
            if (!regionData) return null;
            const regionColor: Record<string, string> = { 华北: "#58a6ff", 华东: "#4ade80", 华南: "#fbbf24" };
            return (
              <div key={region} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.82rem", color: regionColor[region], fontWeight: 700, marginBottom: "10px" }}>{region}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {(Object.entries(regionData) as [string, MoMCell][]).map(([prod, cell]) => (
                    <MoMCard key={prod} cell={cell} />
                  ))}
                </div>
              </div>
            );
          })}

          {report.二_价格月环比.全国亮点?.length > 0 && (
            <div style={{ marginTop: "16px", background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ fontSize: "0.78rem", color: "#58a6ff", fontWeight: 700, marginBottom: "10px" }}>🔥 本月全国亮点</div>
              {report.二_价格月环比.全国亮点.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < report.二_价格月环比.全国亮点.length - 1 ? "1px solid #21262d" : "none" }}>
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

        {/* 三、供需分析 */}
        <Card>
          <SectionHeader icon="🔬" title="三、供需格局分析" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {[
              { label: "成本端", text: supply.成本 },
              { label: "供给侧", text: supply.供给 },
              { label: "需求侧", text: supply.需求 },
              { label: "政策面", text: supply.政策 },
            ].map(({ label, text }) => (
              <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "6px" }}>{label}</div>
                <p style={{ fontSize: "0.78rem", color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 四、风险评级 */}
        <Card>
          <SectionHeader icon="⚠️" title="四、本月风险评级" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            {Object.entries(risks).map(([name, level]) => (
              <div key={name} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "#c9d1d9", fontWeight: 600 }}>{name}</span>
                <RiskBadge level={level} />
              </div>
            ))}
          </div>
        </Card>

        {/* 五、供给侧动态 */}
        {report.五_供给侧动态?.length > 0 && (
          <Card>
            <SectionHeader icon="🏭" title="五、本月供给侧动态" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {report.五_供给侧动态.map((s, i) => (
                <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                  <p style={{ fontSize: "0.8rem", color: "#8b949e", margin: 0, lineHeight: 1.5 }}>{s.动态}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 六、行动建议 */}
        <Card>
          <SectionHeader icon="📌" title="六、下月行动建议" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {[
              { label: "生产运营", text: actions.生产运营 },
              { label: "销售BD", text: actions.销售BD },
              { label: "战略", text: actions.战略 },
              { label: "管理层", text: actions.管理层 },
            ].map(({ label, text }) => (
              <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.78rem", color: "#58a6ff", fontWeight: 700, marginBottom: "8px" }}>{label}</div>
                <p style={{ fontSize: "0.78rem", color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </Card>

        {report.数据说明 && (
          <p style={{ fontSize: "0.72rem", color: "#484f58", textAlign: "center", marginTop: "8px" }}>{report.数据说明}</p>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #21262d", textAlign: "center", padding: "20px", fontSize: "0.75rem", color: "#484f58" }}>
        Air Liquide 京津冀业务区 · 工业气体产业月报 · {report.month_start} 至 {report.month_end}
      </footer>
    </div>
  );
}
