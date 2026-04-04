"use client";

import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

// 三区划价格结构
interface CityPrice {
  最新: string;
  近7日区间?: string;
  周环比: string;
  趋势: string;
}

interface RegionProduct {
  最新: string;
  趋势: string;
  周环比: string;
  城市详情?: { [city: string]: CityPrice };
}

interface RegionData {
  液氧: RegionProduct;
  液氮: RegionProduct;
  液氩: RegionProduct;
}

interface PricesSection {
  华北: RegionData;
  华东: RegionData;
  华南: RegionData;
  液氧结论: string;
  液氮结论: string;
  液氩结论: string;
  全国对比: string;
}

interface ReportData {
  status: "ok" | "generating" | "failed";
  date: string;
  generated_at: string;
  author?: string;
  一_核心结论: {
    成本端判断: string;
    需求端判断: string;
    供给端判断: string;
    一句话总结: string;
  };
  二_上游动态: {
    天然气价格: { 状态: string; 详情: string; 趋势: string };
    电价动态: { 状态: string; 详情: string; 趋势: string };
    原油价格: { 状态: string; 详情: string; 趋势: string };
    对空分气影响: string;
    对氢合成气影响: string;
    成本结论: string;
  };
  三_供给侧: {
    盈德气体: { 动态: string; 影响: string };
    杭氧股份: { 动态: string; 影响: string };
    Linde_AirLiquide: { 动态: string; 影响: string };
    其他竞争动态: { 动态: string; 影响: string };
    供给侧结论: string;
  };
  四_下游需求: {
    电子半导体: { 状态: string; 详情: string; 趋势: string };
    钢铁化工: { 状态: string; 详情: string; 趋势: string };
    新能源氢光伏: { 状态: string; 详情: string; 趋势: string };
    医疗: { 状态: string; 详情: string; 趋势: string };
    其他行业: { 状态: string; 详情: string; 趋势: string };
    需求结论: string;
  };
  五_价格动态: PricesSection;
  六_政策技术: {
    氢能政策: { 状态: string; 详情: string };
    碳捕集CCUS: { 状态: string; 详情: string };
    安全监管: { 状态: string; 详情: string };
    政策结论: string;
  };
  七_风险关注: {
    [key: string]: { 等级: string; 详情: string };
  };
  八_行动建议: {
    生产运营: string;
    销售BD: string;
    战略: string;
    管理层: string;
  };
  项目动态: Array<{ title: string; region: string; date: string; summary: string; url?: string; source: string }>;
  竞争动态: Array<{ title: string; company: string; date: string; summary: string; url?: string; source: string }>;
  行业要闻: Array<{ title: string; date: string; source: string; url?: string }>;
  数据说明?: string;
}

type FetchState = "loading" | "ok" | "error";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TREND_COLOR: Record<string, string> = {
  "↑": "#4ade80",
  "↓": "#f87171",
  "→": "#94a3b8",
  up: "#4ade80",
  down: "#f87171",
  flat: "#94a3b8",
};

const RISK_COLOR: Record<string, string> = {
  高: "#f87171",
  中: "#fbbf24",
  低: "#4ade80",
};

function TrendBadge({ t }: { t: string }) {
  const color = TREND_COLOR[t] ?? "#94a3b8";
  return <span style={{ color, fontWeight: 700, fontSize: "0.85rem" }}>{t}</span>;
}

function RiskBadge({ level }: { level: string }) {
  const color = RISK_COLOR[level] ?? "#94a3b8";
  return (
    <span
      style={{
        color: "#0d1117",
        background: color,
        borderRadius: "4px",
        padding: "2px 8px",
        fontSize: "0.72rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "16px",
        borderBottom: "1px solid #30363d",
        paddingBottom: "10px",
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>{icon}</span>
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#58a6ff", margin: 0 }}>{title}</h2>
    </div>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "10px",
        padding: "18px 22px",
        marginBottom: "14px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MiniTag({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: "5px",
        padding: "1px 8px",
        fontSize: "0.72rem",
        color: color ?? "#8b949e",
        marginRight: "6px",
      }}
    >
      {label}：{value}
    </span>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#e6edf3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#1c2128",
          border: "2px solid #f85149",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          marginBottom: 24,
        }}
      >
        ⚠️
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f85149", marginBottom: 12 }}>
        数据获取失败
      </h1>
      <p style={{ fontSize: "1rem", color: "#8b949e", maxWidth: 440, lineHeight: 1.7 }}>
        今日日报尚未生成，请稍后刷新页面。
      </p>
    </div>
  );
}

// ─── Price Table ─────────────────────────────────────────────────────────────

function PriceTable({ prices }: { prices: PricesSection }) {
  const regions = ["华北", "华东", "华南"] as const;
  const products = ["液氧", "液氮", "液氩"] as const;

  return (
    <div>
      {/* 区域价格总表 */}
      <div style={{ overflowX: "auto", marginBottom: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ background: "#0d1117" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", color: "#58a6ff", fontWeight: 700, borderBottom: "1px solid #30363d", whiteSpace: "nowrap" }}>
                区域
              </th>
              {products.map((p) => (
                <th key={p} style={{ padding: "8px 12px", textAlign: "center", color: "#79c0ff", fontWeight: 700, borderBottom: "1px solid #30363d" }}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => {
              const regionData = (prices as any)[region];
              return (
                <tr key={region} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: "10px 12px", color: "#c9d1d9", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {region}
                  </td>
                  {products.map((prod) => {
                    const cell = regionData?.[prod];
                    if (!cell || cell.最新 === "暂无") {
                      return <td key={prod} style={{ padding: "10px 12px", textAlign: "center", color: "#484f58" }}>—</td>;
                    }
                    const trend = cell.趋势 ?? "→";
                    return (
                      <td key={prod} style={{ padding: "10px 12px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                          <span style={{ color: "#c9d1d9", fontWeight: 700 }}>{cell.最新}</span>
                          <span style={{ color: TREND_COLOR[trend] ?? "#94a3b8", fontSize: "0.78rem", fontWeight: 600 }}>
                            {trend}{cell.周环比}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 三区城市明细 */}
      {(["华北", "华东", "华南"] as const).map((region) => {
        const cities = (prices as any)?.[region]?.液氧?.城市详情;
        if (!cities) return null;
        const cityList = Object.keys(cities).filter((c) => cities[c]?.最新 && cities[c].最新 !== "暂无");
        if (!cityList.length) return null;
        const regionColor: Record<string, string> = { 华北: "#58a6ff", 华东: "#4ade80", 华南: "#fbbf24" };
        const col = regionColor[region] ?? "#58a6ff";
        return (
          <div key={region} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 16px", marginBottom: "10px" }}>
            <div style={{ fontSize: "0.78rem", color: col, fontWeight: 700, marginBottom: "10px" }}>{region}城市明细</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cityList.length, 3)}, 1fr)`, gap: "10px" }}>
              {cityList.map((city) => {
                const lox = (prices as any)?.[region]?.液氧?.城市详情?.[city] ?? {};
                const lin = (prices as any)?.[region]?.液氮?.城市详情?.[city] ?? {};
                const lar = (prices as any)?.[region]?.液氩?.城市详情?.[city] ?? {};
                return (
                  <div key={city} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "0.8rem", color: "#79c0ff", fontWeight: 700, marginBottom: "6px" }}>{city}</div>
                    {(Object.entries({液氧: lox, 液氮: lin, 液氩: lar}) as [string, typeof lox][]).map(([prod, d]) => (
                      <div key={prod} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: "0.76rem", borderBottom: "1px solid #21262d" }}>
                        <span style={{ color: "#8b949e" }}>{prod}</span>
                        <span style={{ color: "#c9d1d9", fontWeight: 600 }}>{d.最新 || "—"}</span>
                        <TrendBadge t={d.趋势 || "→"} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 结论 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {([
          ["液氧", prices.液氧结论],
          ["液氮", prices.液氮结论],
          ["液氩", prices.液氩结论],
          ["全国对比", prices.全国对比],
        ] as const).map(([label, text]) =>
          text ? (
            <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "6px", padding: "8px 12px", fontSize: "0.78rem" }}>
              <span style={{ color: "#58a6ff", fontWeight: 700 }}>{label}：</span>
              <span style={{ color: "#8b949e" }}>{text}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GasDailyPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("loading");

  useEffect(() => {
    fetch("./report.json")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json() as Promise<ReportData>;
      })
      .then((data: ReportData) => {
        setReport(data);
        setFetchState(data.status === "ok" ? "ok" : "error");
      })
      .catch(() => setFetchState("error"));
  }, []);

  if (fetchState === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d1117",
          color: "#e6edf3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <span style={{ color: "#58a6ff", fontSize: "1rem" }}>⏳ 加载中…</span>
      </div>
    );
  }

  if (fetchState === "error" || !report || report.status !== "ok") {
    return <ErrorState />;
  }

  const fmtDate = new Date(report.date + "T00:00:00+08:00").toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const fmtGenTime = new Date(report.generated_at).toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
  });

  const core = report.一_核心结论;
  const upstream = report.二_上游动态;
  const supply = report.三_供给侧;
  const demand = report.四_下游需求;
  const prices = report.五_价格动态;
  const policy = report.六_政策技术;
  const risks = report.七_风险关注;
  const actions = report.八_行动建议;

  const riskEntries = Object.entries(risks).filter(([k]) => !k.startsWith("_"));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#e6edf3",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #30363d",
          padding: "18px 24px 14px",
          position: "sticky",
          top: 0,
          background: "#0d1117ee",
          backdropFilter: "blur(10px)",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#58a6ff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <a href="/" style={{ color: "#58a6ff", textDecoration: "none" }}>⚗ 工业气体产业日报</a>
              <a href="/weekly" style={{ fontSize: "0.72rem", color: "#4ade80", textDecoration: "none", background: "#0d1117", border: "1px solid #238636", borderRadius: "4px", padding: "2px 8px", fontWeight: 600 }}>📊 周报</a>
              <a href="/monthly" style={{ fontSize: "0.72rem", color: "#fbbf24", textDecoration: "none", background: "#0d1117", border: "1px solid #9a6a00", borderRadius: "4px", padding: "2px 8px", fontWeight: 600 }}>📅 月报</a>
            </h1>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.9rem", color: "#c9d1d9" }}>{fmtDate}</div>
              <div style={{ fontSize: "0.75rem", color: "#484f58" }}>{report.author ?? "Air Liquide 京津冀业务区"}</div>
            </div>
          </div>
          <p style={{ fontSize: "0.72rem", color: "#484f58", marginTop: 6 }}>
            数据来源：卓创资讯 · 我的钢铁网 · 企业公告 · 生成时间 {fmtGenTime}
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px" }}>

        {/* ══════════════════════════════════════
            一、今日核心结论
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="🧭" title="一、今日核心结论" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "14px" }}>
            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "6px" }}>⚡ 成本端</div>
              <p style={{ fontSize: "0.8rem", color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{core.成本端判断}</p>
            </div>
            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "6px" }}>📈 需求端</div>
              <p style={{ fontSize: "0.8rem", color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{core.需求端判断}</p>
            </div>
            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "6px" }}>🏭 供给端</div>
              <p style={{ fontSize: "0.8rem", color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{core.供给端判断}</p>
            </div>
          </div>
          {/* 一句话总结 */}
          <div
            style={{
              background: "linear-gradient(135deg, #161b22 0%, #1c2128 100%)",
              border: "1px solid #58a6ff",
              borderRadius: "8px",
              padding: "14px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "#58a6ff", fontWeight: 700, marginBottom: "6px" }}>🔥 一句话总结</div>
            <p style={{ fontSize: "0.88rem", color: "#e6edf3", margin: 0, fontWeight: 600, lineHeight: 1.7 }}>
              {core.一句话总结}
            </p>
          </div>
        </Card>

        {/* ══════════════════════════════════════
            二、上游动态（成本端）
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="⚡" title="二、上游动态（成本端）" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            {[
              { label: "天然气", data: upstream.天然气价格 },
              { label: "电价", data: upstream.电价动态 },
              { label: "原油", data: upstream.原油价格 },
            ].map(({ label, data }) => (
              <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.82rem", color: "#79c0ff", fontWeight: 700 }}>{label}</span>
                  <TrendBadge t={data.趋势} />
                </div>
                <div style={{ fontSize: "0.72rem", color: "#4ade80", fontWeight: 600, marginBottom: "4px" }}>{data.状态}</div>
                <p style={{ fontSize: "0.75rem", color: "#8b949e", margin: 0, lineHeight: 1.5 }}>{data.详情}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "6px", padding: "8px 14px", fontSize: "0.8rem" }}>
              <span style={{ color: "#58a6ff", fontWeight: 700 }}>对空分气影响：</span>
              <span style={{ color: "#c9d1d9" }}>{upstream.对空分气影响}</span>
            </div>
            <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "6px", padding: "8px 14px", fontSize: "0.8rem" }}>
              <span style={{ color: "#58a6ff", fontWeight: 700 }}>对氢/合成气影响：</span>
              <span style={{ color: "#c9d1d9" }}>{upstream.对氢合成气影响}</span>
            </div>
            <div
              style={{
                background: "#0d1117",
                border: "1px solid #238636",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "0.8rem",
              }}
            >
              <span style={{ color: "#4ade80", fontWeight: 700 }}>📌 成本结论：</span>
              <span style={{ color: "#c9d1d9" }}>{upstream.成本结论}</span>
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════
            三、供给侧（竞争格局）
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="🏭" title="三、供给侧（竞争格局）" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            {[
              { company: "盈德气体", data: supply.盈德气体 },
              { company: "杭氧股份", data: supply.杭氧股份 },
              { company: "林德 / 液空", data: supply.Linde_AirLiquide },
              { company: "其他竞争者", data: supply.其他竞争动态 },
            ].map(({ company, data }) => (
              <div key={company} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.85rem", color: "#79c0ff", fontWeight: 700, marginBottom: "6px", borderBottom: "1px solid #21262d", paddingBottom: "6px" }}>
                  {company}
                </div>
                <p style={{ fontSize: "0.78rem", color: "#8b949e", margin: "0 0 6px", lineHeight: 1.5 }}>{data.动态}</p>
                <div style={{ fontSize: "0.72rem", color: "#c9d1d9" }}>
                  <span style={{ color: "#58a6ff" }}>影响：</span>{data.影响}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0d1117", border: "1px solid #238636", borderRadius: "6px", padding: "8px 14px", fontSize: "0.8rem" }}>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>📌 供给侧结论：</span>
            <span style={{ color: "#c9d1d9" }}>{supply.供给侧结论}</span>
          </div>
        </Card>

        {/* ══════════════════════════════════════
            四、下游需求
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="🧪" title="四、下游需求" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            {[
              { label: "🔬 电子/半导体", data: demand.电子半导体 },
              { label: "🔩 钢铁/化工", data: demand.钢铁化工 },
              { label: "⚡ 新能源（氢/光伏）", data: demand.新能源氢光伏 },
              { label: "🏥 医疗", data: demand.医疗 },
              { label: "🏗 其他行业", data: demand.其他行业 },
            ].map(({ label, data }) => (
              <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#c9d1d9", fontWeight: 700 }}>{label.replace(/^[^\s]+\s/, "")}</span>
                  <TrendBadge t={data.趋势} />
                </div>
                <div style={{ fontSize: "0.72rem", color: TREND_COLOR[data.趋势] ?? "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>{data.状态}</div>
                <p style={{ fontSize: "0.75rem", color: "#8b949e", margin: 0, lineHeight: 1.5 }}>{data.详情}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#0d1117", border: "1px solid #238636", borderRadius: "6px", padding: "8px 14px", fontSize: "0.8rem" }}>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>📌 需求结论：</span>
            <span style={{ color: "#c9d1d9" }}>{demand.需求结论}</span>
          </div>
        </Card>

        {/* ══════════════════════════════════════
            五、液体气体价格动态
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="💰" title="五、液体气体价格动态" />
          <PriceTable prices={prices} />
        </Card>

        {/* ══════════════════════════════════════
            六、政策 & 技术趋势
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="🌱" title="六、政策 & 技术趋势" />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "💧 氢能政策", data: policy.氢能政策 },
              { label: "🌿 碳捕集（CCUS）", data: policy.碳捕集CCUS },
              { label: "🔒 安全监管", data: policy.安全监管 },
            ].map(({ label, data }) => (
              <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                  <span style={{ fontSize: "0.85rem", color: "#79c0ff", fontWeight: 700 }}>{label}</span>
                  <MiniTag label="状态" value={data.状态} color="#4ade80" />
                </div>
                <p style={{ fontSize: "0.8rem", color: "#8b949e", margin: 0, lineHeight: 1.6 }}>{data.详情}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "12px", background: "#0d1117", border: "1px solid #238636", borderRadius: "6px", padding: "8px 14px", fontSize: "0.8rem" }}>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>📌 政策结论：</span>
            <span style={{ color: "#c9d1d9" }}>{policy.政策结论}</span>
          </div>
        </Card>

        {/* ══════════════════════════════════════
            七、风险与关注点
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="⚠️" title="七、风险与关注点" />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {riskEntries.map(([name, data]) => (
              <div
                key={name}
                style={{
                  background: "#0d1117",
                  border: "1px solid #21262d",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", color: "#c9d1d9", fontWeight: 700, marginBottom: "4px" }}>{name}</div>
                  <p style={{ fontSize: "0.78rem", color: "#8b949e", margin: 0, lineHeight: 1.5 }}>{data.详情}</p>
                </div>
                <RiskBadge level={data.等级} />
              </div>
            ))}
          </div>
        </Card>

        {/* ══════════════════════════════════════
            八、行动建议
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="📌" title="八、给产业人的行动建议" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {[
              { label: "🏭 生产/运营", text: actions.生产运营 },
              { label: "🤝 销售/BD", text: actions.销售BD },
              { label: "🧠 战略", text: actions.战略 },
              { label: "📊 管理层", text: actions.管理层 },
            ].map(({ label, text }) => (
              <div key={label} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "0.8rem", color: "#58a6ff", fontWeight: 700, marginBottom: "8px" }}>{label}</div>
                <p style={{ fontSize: "0.78rem", color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════════════════════════════════════
            全国新项目动态
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="🏗️" title="全国新项目动态" />
          {report.项目动态 && report.项目动态.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {report.项目动态.map((item, i) => (
                <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "7px", padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#58a6ff", textDecoration: "underline", fontSize: "0.82rem", fontWeight: 600, flex: 1 }}>
                        {item.title}
                      </a>
                    ) : (
                      <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600, color: "#c9d1d9" }}>{item.title}</span>
                    )}
                    <span style={{ fontSize: "0.72rem", color: "#484f58", whiteSpace: "nowrap" }}>
                      {item.region} · {item.date}
                    </span>
                  </div>
                  {item.summary && (
                    <p style={{ fontSize: "0.75rem", color: "#8b949e", margin: 0, lineHeight: 1.5 }}>{item.summary}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "#484f58" }}>暂无新项目动态</p>
          )}
        </Card>

        {/* ══════════════════════════════════════
            竞争动态
        ══════════════════════════════════════ */}
        <Card>
          <SectionHeader icon="🔍" title="竞争动态" />
          {report.竞争动态 && report.竞争动态.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {report.竞争动态.map((item, i) => (
                <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "7px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.78rem", color: "#79c0ff", fontWeight: 700 }}>{item.company}</span>
                    <span style={{ fontSize: "0.72rem", color: "#484f58" }}>{item.date}</span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#c9d1d9", margin: "0 0 6px", lineHeight: 1.5, fontWeight: 600 }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#58a6ff", textDecoration: "underline" }}>{item.title}</a>
                    ) : item.title}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#8b949e", margin: 0, lineHeight: 1.5 }}>{item.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "#484f58" }}>暂无竞争动态</p>
          )}
        </Card>

        {/* ══════════════════════════════════════
            行业要闻
        ══════════════════════════════════════ */}
        {report.行业要闻 && report.行业要闻.length > 0 && (
          <Card>
            <SectionHeader icon="📰" title="行业要闻" />
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {report.行业要闻.map((item, i) => (
                <li key={i} style={{ paddingBottom: i < report.行业要闻.length - 1 ? "8px" : 0, borderBottom: i < report.行业要闻.length - 1 ? "1px solid #21262d" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#58a6ff", textDecoration: "underline", fontSize: "0.82rem", flex: 1 }}>
                        {item.title}
                      </a>
                    ) : (
                      <span style={{ flex: 1, fontSize: "0.82rem", color: "#c9d1d9" }}>{item.title}</span>
                    )}
                    <span style={{ fontSize: "0.72rem", color: "#484f58", whiteSpace: "nowrap" }}>
                      {item.source} · {item.date}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 数据说明 */}
        {report.数据说明 && (
          <p
            style={{
              fontSize: "0.72rem",
              color: "#484f58",
              textAlign: "center",
              marginTop: "8px",
              lineHeight: 1.6,
            }}
          >
            {report.数据说明}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #21262d",
          textAlign: "center",
          padding: "20px",
          fontSize: "0.75rem",
          color: "#484f58",
        }}
      >
        Air Liquide 京津冀业务区 · 工业气体产业日报 · {report.date} {fmtGenTime} 生成
      </footer>
    </div>
  );
}
