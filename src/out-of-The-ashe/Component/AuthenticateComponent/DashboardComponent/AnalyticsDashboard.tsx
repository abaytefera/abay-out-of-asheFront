import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoneyBillWave, faHouseChimneyUser, faGraduationCap,
  faBrain, faShieldHalved, faFolderOpen, faClipboardCheck,
  faTriangleExclamation, faSyringe, faWeightScale, faStethoscope,
  faSpinner, faClock, faFilter, faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";


import { useGetDashboardAnalyticsQuery } from "../../../Redux/Analytivsl";
import DashbordNav from "./DashbordNav";

// ── Palette ───────────────────────────────────────────────────────────────
const COLORS = {
  emerald: "#10b981", sky: "#0ea5e9", purple: "#a855f7", amber: "#f59e0b",
  rose: "#f43f5e", indigo: "#6366f1", slate: "#94a3b8", teal: "#14b8a6",
  orange: "#f97316", red: "#ef4444",
};
const PIE_COLORS = [COLORS.emerald, COLORS.sky, COLORS.purple, COLORS.amber, COLORS.rose, COLORS.indigo, COLORS.teal];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmtMoney = (n, currency = "ETB") =>
  `${currency} ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// ── Small building blocks ────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, tone = "slate" }) => {
  const toneCls = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sky:     "bg-sky-50 text-sky-700 border-sky-200",
    purple:  "bg-purple-50 text-purple-700 border-purple-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    rose:    "bg-rose-50 text-rose-700 border-rose-200",
    indigo:  "bg-indigo-50 text-indigo-700 border-indigo-200",
    slate:   "bg-slate-50 text-slate-700 border-slate-200",
  }[tone];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${toneCls}`}>
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 font-mono leading-none">{value}</p>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
};

const PanelCard = ({ icon, title, tone = "slate", action, children }) => {
  const toneCls = {
    emerald: "from-emerald-600 to-teal-500",
    sky:     "from-sky-600 to-blue-500",
    purple:  "from-purple-600 to-indigo-500",
    amber:   "from-amber-500 to-orange-500",
    rose:    "from-rose-600 to-pink-500",
    indigo:  "from-indigo-600 to-blue-600",
    slate:   "from-slate-600 to-slate-500",
  }[tone];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className={`px-5 py-3.5 flex items-center justify-between bg-gradient-to-r ${toneCls}`}>
        <div className="flex items-center gap-2.5">
          <FontAwesomeIcon icon={icon} className="text-white text-sm" />
          <h3 className="text-white font-black text-sm">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
};

const Empty = ({ message = "No data yet" }) => (
  <div className="flex items-center justify-center py-10 text-xs text-slate-400 font-semibold">{message}</div>
);

// ── Filter bar ───────────────────────────────────────────────────────────
const FilterBar = ({ year, month, onYearChange, onMonthChange, onReset, isFetching }) => {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => currentYear - i), [currentYear]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest pr-1">
        <FontAwesomeIcon icon={faFilter} />
        Filter
      </div>

      <select
        value={year ?? ""}
        onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : undefined)}
        className="text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <option value="">All time</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select
        value={month ?? ""}
        disabled={!year}
        onChange={(e) => onMonthChange(e.target.value ? Number(e.target.value) : undefined)}
        title={!year ? "Pick a year first" : undefined}
        className="text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <option value="">All months</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>

      {(year || month) && (
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-2"
        >
          <FontAwesomeIcon icon={faRotateRight} /> Reset
        </button>
      )}

      {isFetching && (
        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 ml-auto">
          <FontAwesomeIcon icon={faSpinner} spin /> Updating…
        </span>
      )}
    </div>
  );
};

// ── Main Dashboard ───────────────────────────────────────────────────────
const AnalyticsDashboard = () => {
  const [year, setYear] = useState(undefined);
  const [month, setMonth] = useState(undefined);

  const { data, isLoading, isFetching } = useGetDashboardAnalyticsQuery({ year, month });

  const handleYearChange = (y) => {
    setYear(y);
    if (!y) setMonth(undefined); // backend requires a year whenever month is set
  };

  const handleReset = () => {
    setYear(undefined);
    setMonth(undefined);
  };

  // Safe defaults so the JSX below never has to optional-chain everywhere
  const kpis         = data?.kpis         ?? {};
  const financial     = data?.financial     ?? { byType: [], monthlyTrend: [], totalDisbursed: 0 };
  const homeVisits     = data?.homeVisits     ?? { byPurpose: [], totalVisits: 0, pendingFollowUps: 0 };
  const health        = data?.health        ?? { totalRecords: 0 };
  const vaccinations  = data?.vaccinations  ?? { total: 0, overdue: 0, dueSoon: 0 };
  const nutrition     = data?.nutrition     ?? { bmiBuckets: [] };
  const education     = data?.education     ?? { promotionBreakdown: [], totalRecords: 0, avgAttendance: null };
  const psychosocial  = data?.psychosocial  ?? { sessionsByType: [], tbriByPillar: [] };
  const safeguarding  = data?.safeguarding  ?? { byStatus: [], byType: [], openCases: 0 };
  const vulnerability = data?.vulnerability ?? { decisionBreakdown: [], avgVulnerabilityScore: null, pendingAssessments: 0 };
  const otherRecords  = data?.otherRecords  ?? { total: 0 };

  if (isLoading) {
    return (
      <div className="space-y-8 p-5">
        <DashbordNav />
        <div className="flex items-center justify-center py-32 text-slate-300">
          <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-5">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
      <DashbordNav></DashbordNav>

      <div className="mt-30">
        <FilterBar
          year={year}
          month={month}
          onYearChange={handleYearChange}
          onMonthChange={setMonth}
          onReset={handleReset}
          isFetching={isFetching}
        />
      </div>

      {/* ── Top KPI Ribbon ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={faMoneyBillWave}    label="Disbursed"            value={fmtMoney(kpis.totalDisbursed)} tone="emerald" />
        <StatCard icon={faHouseChimneyUser} label="Follow-ups Due"       value={kpis.pendingFollowUps ?? 0} tone="amber" />
        <StatCard icon={faSyringe}          label="Overdue Boosters"     value={kpis.overdueVaccinations ?? 0} tone={(kpis.overdueVaccinations ?? 0) > 0 ? "rose" : "slate"} />
        <StatCard icon={faGraduationCap}    label="Avg Attendance"       value={kpis.avgAttendance != null ? `${kpis.avgAttendance}%` : "—"} tone="sky" />
        <StatCard icon={faShieldHalved}     label="Open Safeguarding"    value={kpis.openSafeguardingCases ?? 0} tone={(kpis.openSafeguardingCases ?? 0) > 0 ? "rose" : "slate"} />
        <StatCard icon={faClipboardCheck}   label="Pending Assessments"  value={kpis.pendingAssessments ?? 0} tone="purple" />
      </div>

      {/* ── Financial ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PanelCard icon={faMoneyBillWave} title="Financial Support — Monthly Disbursement" tone="emerald">
          {financial.monthlyTrend.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={financial.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmtMoney(v)} />
                <Line type="monotone" dataKey="amount" stroke={COLORS.emerald} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </PanelCard>

        <PanelCard icon={faMoneyBillWave} title="Financial Support — By Type" tone="emerald">
          {financial.byType.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={financial.byType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.emerald} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PanelCard>
      </div>

      {/* ── Home Visits ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PanelCard icon={faHouseChimneyUser} title="Home Visits — By Purpose" tone="amber">
          {homeVisits.byPurpose.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={homeVisits.byPurpose} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {homeVisits.byPurpose.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </PanelCard>

        <PanelCard icon={faClock} title="Home Visits — Follow-up Status" tone="amber">
          <div className="grid grid-cols-2 gap-4 h-full items-center">
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-3xl font-black text-amber-700 font-mono">{homeVisits.pendingFollowUps}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-1">Due / Overdue</p>
            </div>
            <div className="text-center bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <p className="text-3xl font-black text-slate-700 font-mono">{homeVisits.totalVisits}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Visits</p>
            </div>
          </div>
        </PanelCard>
      </div>

      {/* ── Health & Nutrition ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <PanelCard icon={faStethoscope} title="Health Records" tone="sky">
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-4xl font-black text-sky-700 font-mono">{health.totalRecords}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Records</p>
          </div>
        </PanelCard>

        <PanelCard icon={faSyringe} title="Vaccination Status" tone="purple">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: "Overdue", value: vaccinations.overdue },
              { name: "Upcoming", value: vaccinations.dueSoon },
              { name: "Total", value: vaccinations.total },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                <Cell fill={COLORS.rose} />
                <Cell fill={COLORS.amber} />
                <Cell fill={COLORS.purple} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>

        <PanelCard icon={faWeightScale} title="Nutrition — BMI Distribution" tone="sky">
          {nutrition.bmiBuckets.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={nutrition.bmiBuckets} dataKey="value" nameKey="name" outerRadius={75} paddingAngle={2}>
                  {nutrition.bmiBuckets.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </PanelCard>
      </div>

      {/* ── Education ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PanelCard icon={faGraduationCap} title="Education — Promotion Status" tone="indigo">
          {education.promotionBreakdown.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={education.promotionBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.indigo} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PanelCard>

        <PanelCard icon={faGraduationCap} title="Education — Snapshot" tone="indigo">
          <div className="grid grid-cols-2 gap-4 h-full items-center">
            <div className="text-center bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
              <p className="text-3xl font-black text-indigo-700 font-mono">{education.avgAttendance != null ? `${education.avgAttendance}%` : "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mt-1">Avg Attendance</p>
            </div>
            <div className="text-center bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <p className="text-3xl font-black text-slate-700 font-mono">{education.totalRecords}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Records</p>
            </div>
          </div>
        </PanelCard>
      </div>

      {/* ── Psychosocial ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PanelCard icon={faBrain} title="Psychosocial — Sessions by Type" tone="purple">
          {psychosocial.sessionsByType.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={psychosocial.sessionsByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.purple} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PanelCard>

        <PanelCard icon={faBrain} title="TBRI Activities — By Pillar" tone="purple">
          {psychosocial.tbriByPillar.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={psychosocial.tbriByPillar} dataKey="value" nameKey="name" outerRadius={75} paddingAngle={2}>
                  {psychosocial.tbriByPillar.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </PanelCard>
      </div>

      {/* ── Safeguarding ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PanelCard
          icon={faShieldHalved}
          title="Safeguarding — Case Status"
          tone="rose"
          action={safeguarding.openCases > 0 && (
            <span className="text-[10px] font-black text-white bg-rose-700/40 px-2.5 py-1 rounded-full flex items-center gap-1">
              <FontAwesomeIcon icon={faTriangleExclamation} /> {safeguarding.openCases} Open
            </span>
          )}
        >
          {safeguarding.byStatus.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={safeguarding.byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.rose} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PanelCard>

        <PanelCard icon={faShieldHalved} title="Safeguarding — Incident Type" tone="rose">
          {safeguarding.byType.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={safeguarding.byType} dataKey="value" nameKey="name" outerRadius={75} paddingAngle={2}>
                  {safeguarding.byType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </PanelCard>
      </div>

      {/* ── Vulnerability Assessment + Other Files ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <PanelCard icon={faClipboardCheck} title="Vulnerability Assessment — Committee Decision" tone="indigo">
          {vulnerability.decisionBreakdown.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={vulnerability.decisionBreakdown} dataKey="value" nameKey="name" outerRadius={75} paddingAngle={2}>
                  {vulnerability.decisionBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </PanelCard>

        <PanelCard icon={faClipboardCheck} title="Vulnerability — Snapshot" tone="indigo">
          <div className="grid grid-cols-1 gap-3 h-full content-center">
            <div className="text-center bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <p className="text-2xl font-black text-indigo-700 font-mono">{vulnerability.avgVulnerabilityScore ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mt-1">Avg Vulnerability Score</p>
            </div>
            <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-2xl font-black text-amber-700 font-mono">{vulnerability.pendingAssessments}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-1">Pending Committee Review</p>
            </div>
          </div>
        </PanelCard>

        <PanelCard icon={faFolderOpen} title="Other Records" tone="slate">
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-4xl font-black text-slate-700 font-mono">{otherRecords.total}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Miscellaneous Files Logged</p>
          </div>
        </PanelCard>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;