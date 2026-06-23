import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faMars, faVenus, faHandHoldingHeart, faHandHoldingDollar,
  faCalendarCheck, faUserShield, faHeartPulse, faGraduationCap,
  faTriangleExclamation, faChild, faHome, faCheckCircle,
  faClock, faExclamationCircle, faArrowRight, faChartBar,
  faFileAlt, faCoins, faBrain, faClipboardList,
  faCircleCheck, faHourglass, faBan, faEllipsisH,
  faUserTie, faStethoscope, faBolt, faScaleBalanced,
  faSchool,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import DashboardAuditLog from './DashboardAuditLog';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useSelector } from 'react-redux';
const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

// ─── Types (matching schema + service responses) ─────────────────────────────
interface ChildStats {
  totalActive: number;
  byGender:    { gender: string; _count: { gender: number } }[];
  byStatus:    { status: string; _count: { status: number } }[];
  bySubCity:   { subCity: string; _count: { subCity: number } }[];
  atRiskCount: number;
  openSafeguarding: number;
}

interface Props {
  user:              any;
  childStats:        ChildStats | null;
  recentChildren:    any[];
  employees:         any[];
  safeguardingCases: any[];
  eduAlerts:         any[];
  auditLogs:         any[];
  pendingWorkflows:  any[];
  financialReport:   any;
  nutritionAlerts:   any[];
}

// ─── Permissions ──────────────────────────────────────────────────────────────
const getPermissions = (role: string) => {
  const isAdmin    = role === 'ADMIN';
  const isManager  = role === 'PROGRAM_MANAGER';
  const isDirector = role === 'COUNTRY_DIRECTOR';

  return {
    schoolButton:     { view: isAdmin },
    financeReport:    { view: isAdmin || isManager || isDirector || role === 'FINANCE_OFFICER' },
    educationAlert:   { view: isAdmin || isManager || isDirector || role === 'EDUCATION_OFFICER' },
    employeeList:     { view: isAdmin || isManager || isDirector },
    safeguardingCase: { view: isAdmin || isManager || isDirector || role === 'PSYCHOSOCIAL_OFFICER' || role === 'SOCIAL_WORKER' },
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:      'bg-emerald-50 text-emerald-700',
  GRADUATED:   'bg-blue-50 text-blue-700',
  SUSPENDED:   'bg-amber-50 text-amber-700',
  TRANSFERRED: 'bg-violet-50 text-violet-700',
  DROPPED:     'bg-rose-50 text-rose-700',
};
const SG_STATUS_COLOR: Record<string, string> = {
  OPEN:                'bg-rose-50 text-rose-600 border-rose-200',
  UNDER_INVESTIGATION: 'bg-amber-50 text-amber-600 border-amber-200',
  REFERRED:            'bg-violet-50 text-violet-600 border-violet-200',
  CLOSED:              'bg-slate-50 text-slate-500 border-slate-200',
  REOPENED:            'bg-orange-50 text-orange-600 border-orange-200',
};
const INCIDENT_ICONS: Record<string, any> = {
  ABUSE:           faHandHoldingHeart,
  NEGLECT:         faExclamationCircle,
  CHILD_LABOR:     faTriangleExclamation,
  SCHOOL_VIOLENCE: faBolt,
  MISSING_CHILD:   faUsers,
  OTHER:           faFileAlt,
};
const ALERT_COLORS: Record<string, string> = {
  LOW_GRADE:        'bg-rose-50 text-rose-600',
  HIGH_ABSENTEEISM: 'bg-amber-50 text-amber-600',
  DROPOUT_RISK:     'bg-orange-50 text-orange-600',
};

// ─── Helper components ────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, pulse = false }: any) => (
  <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 group hover:shadow-md transition-all duration-300 ${pulse ? 'ring-1 ring-rose-200' : ''}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base shrink-0 ${color}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value ?? 0}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>}
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, icon, iconColor = 'text-primBtn', children, action, actionTo }: any) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl bg-primBtn/10 flex items-center justify-center text-sm ${iconColor}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-sm tracking-tight">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>
      {action && actionTo && (
        <Link to={actionTo} className="text-[10px] font-black text-primBtn uppercase tracking-wider hover:underline">
          {action} →
        </Link>
      )}
    </div>
    <div>{children}</div>
  </div>
);

const EmptyRow = ({ message }: { message: string }) => (
  <div className="py-10 text-center text-xs font-bold text-slate-400 italic">{message}</div>
);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtDateTime = (d: string) =>
  d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ─── Placeholder trend data (replace with real time-series from backend) ──────
const TREND_DATA = [
  { month: 'Jan', active: 38, graduated: 2, atRisk: 5 },
  { month: 'Feb', active: 41, graduated: 1, atRisk: 4 },
  { month: 'Mar', active: 43, graduated: 3, atRisk: 6 },
  { month: 'Apr', active: 45, graduated: 2, atRisk: 3 },
  { month: 'May', active: 48, graduated: 4, atRisk: 4 },
  { month: 'Jun', active: 52, graduated: 3, atRisk: 2 },
];

// =============================================================================
const DashboardBody = ({
  user, childStats, recentChildren, employees,
  safeguardingCases, eduAlerts, auditLogs,
  pendingWorkflows, financialReport, nutritionAlerts,trendData
}: Props) => {
  const {user:userinfo}=useSelector((state)=>state.auth)

  const perms = useMemo(() => getPermissions(userinfo?.role ?? ''), [userinfo?.role]);

  // Derive initial tab based on what the user is allowed to see
  const getDefaultTab = () => {
    if (perms.safeguardingCase.view) return 'cases';
    if (perms.educationAlert.view)   return 'alerts';
    return 'none';
  };

  const [activeTab, setActiveTab] = useState<'cases' | 'alerts' | 'none'>(getDefaultTab);

  // Reset active tab when role changes (e.g. impersonation / re-login)
  useEffect(() => {
    if (activeTab === 'cases' && !perms.safeguardingCase.view) {
      setActiveTab(perms.educationAlert.view ? 'alerts' : 'none');
    }
    if (activeTab === 'alerts' && !perms.educationAlert.view) {
      setActiveTab(perms.safeguardingCase.view ? 'cases' : 'none');
    }
  }, [user?.role]);

  // ── Derived values from childStats ────────────────────────────────────────
  const totalActive   = childStats?.totalActive ?? 0;
  const maleCount     = childStats?.byGender?.find(g => g.gender === 'MALE')?._count?.gender ?? 0;
  const femaleCount   = childStats?.byGender?.find(g => g.gender === 'FEMALE')?._count?.gender ?? 0;
  const otherCount    = childStats?.byGender?.find(g => g.gender === 'OTHER')?._count?.gender ?? 0;
  const totalChildren = maleCount + femaleCount + otherCount;
  const atRiskCount   = childStats?.atRiskCount ?? 0;
  const openSG        = childStats?.openSafeguarding ?? 0;

  useEffect(() => {
    console.log('render check');
    console.log(childStats);
  }, [childStats]);

  const genderPieData = [
    { name: 'Boys',  value: maleCount,   color: '#3B82F6' },
    { name: 'Girls', value: femaleCount, color: '#EC4899' },
    ...(otherCount ? [{ name: 'Other', value: otherCount, color: '#8B5CF6' }] : []),
  ];

  const statusBarData = childStats?.byStatus?.map(s => ({
    name:  s.status.charAt(0) + s.status.slice(1).toLowerCase(),
    count: s._count?.status ?? 0,
  })) ?? [];

  const subCityData = [...(childStats?.bySubCity ?? [])]
    .sort((a, b) => (b._count?.subCity ?? 0) - (a._count?.subCity ?? 0))
    .slice(0, 5);

  // ── Financial summary ──────────────────────────────────────────────────────
  const recentDisbursements = financialReport?.disbursements ?? [];
  const totalDisbursed      = financialReport?.summary?._sum?.amount ?? 0;

  // ── Alert-centre tabs (only include what the role can see) ─────────────────
  const alertTabs = ([
    {
      key:   'cases'  as const,
      label: 'Safeguarding',
      count: safeguardingCases?.length ?? 0,
      icon:  faHandHoldingHeart,
      show:  perms.safeguardingCase.view,
    },
    {
      key:   'alerts' as const,
      label: 'Education',
      count: eduAlerts?.length ?? 0,
      icon:  faGraduationCap,
      show:  perms.educationAlert.view,
    },
  ]).filter(t => t.show);

  return (
    <div className="space-y-8 text-slate-900 antialiased">

      {/* Welcome line */}
      <div>
        <p className="text-slate-500 font-medium mt-0.5 text-sm">
          Welcome back,{' '}
          <span className="text-primBtn font-bold">
            {user?.firstName ?? 'Operator'} {user?.lastName ?? ''}
          </span>
        </p>
      </div>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-3xl px-7 py-5 shadow-sm">

        <div className="flex gap-3 shrink-0 flex-wrap">

          {/* Always visible */}
          <Link
            to="/ALLChild"
            className="flex items-center gap-2 bg-primBtn hover:bg-Hover text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm shadow-primBtn/30 transition-all hover:scale-[1.02]"
          >
            <FontAwesomeIcon icon={faChild} className="text-xs" />
            Manage Children
          </Link>

          {/* Always visible */}
          <Link
            to="/ALLSponsor"
            className="group flex items-center gap-2 bg-primBtn/10 border border-transparent hover:border-Hover text-primBtn px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
          >
            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-xs" />
            Manage Sponsors
          </Link>

          {/* Staff — Admin / Manager / Director */}
          {perms.employeeList.view && (
            <Link
              to="/ALLEmployees"
              className="group flex items-center gap-2 bg-white border border-slate-200 hover:border-primBtn text-slate-600 hover:text-primBtn px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
            >
              <FontAwesomeIcon icon={faUsers} className="text-xs text-slate-400 group-hover:text-primBtn transition-colors" />
              Staff
            </Link>
          )}

          {/* Schools — Admin only */}
          {perms.schoolButton.view && (
            <Link
              to="/ManageSchools"
              className="group flex items-center gap-2 bg-white border border-slate-200 hover:border-primBtn text-slate-600 hover:text-primBtn px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
            >
              <FontAwesomeIcon icon={faSchool} className="text-xs text-slate-400 group-hover:text-primBtn transition-colors" />
              Schools
            </Link>
          )}

          {/* Analytics — always visible */}
          <Link
            to="/AnalyticsDashboard"
            className="group flex items-center gap-2 bg-white border border-slate-200 hover:border-primBtn text-slate-600 hover:text-primBtn px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
          >
            <FontAwesomeIcon icon={faChartLine} className="text-xs text-slate-400 group-hover:text-primBtn transition-colors" />
            Analytics
          </Link>
        </div>

        <DashboardAuditLog />
      </header>


      {/* ══ KPI STAT CARDS ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard icon={faUsers}               label="Active Children"     value={totalActive}               color="bg-primBtn/10 text-primBtn" />
        <StatCard icon={faMars}                label="Boys"                value={maleCount}                 color="bg-blue-50 text-blue-600" />
        <StatCard icon={faVenus}               label="Girls"               value={femaleCount}               color="bg-rose-50 text-rose-500" />

        {perms.safeguardingCase.view && (
          <StatCard
            icon={faHandHoldingHeart}
            label="Open Safeguarding"
            value={safeguardingCases?.length}
            pulse={openSG > 0}
            color={openSG > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}
          />
        )}

        {perms.educationAlert.view && (
          <StatCard
            icon={faTriangleExclamation}
            label="At-Risk (Education)"
            value={eduAlerts?.length}
            color="bg-amber-50 text-amber-600"
          />
        )}
      </div>


      {/* ══ CHARTS ROW ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Child trend area chart */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900 tracking-tight">Program Growth Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Active, graduated & at-risk children over time</p>
            </div>
            <FontAwesomeIcon icon={faChartBar} className="text-slate-300" />
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-primBtn, #6366f1)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primBtn, #6366f1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.08)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                <Area name="Active"    type="monotone" dataKey="active"    stroke="#6366F1" strokeWidth={2.5} fill="url(#gActive)" />
                <Area name="Graduated" type="monotone" dataKey="graduated" stroke="#10B981" strokeWidth={2.5} fill="url(#gGrad)" />
                <Area name="At Risk"   type="monotone" dataKey="atRisk"    stroke="#F59E0B" strokeWidth={2.5} fill="url(#gRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender + status pie */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-black text-slate-900 tracking-tight">Gender Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Active children by gender</p>
          </div>
          <div className="relative h-[160px]">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-3xl font-black text-slate-900 leading-none">{totalChildren}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderPieData} innerRadius={52} outerRadius={70} paddingAngle={4} dataKey="value">
                  {genderPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {genderPieData.map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl px-3 py-2 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          {statusBarData.length > 0 && (
            <div className="pt-3 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">By Status</p>
              <div className="space-y-1.5">
                {statusBarData.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${STATUS_COLORS[s.name.toUpperCase()] ?? 'bg-slate-50 text-slate-600'}`}>
                      {s.name}
                    </span>
                    <span className="text-xs font-black text-slate-700">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ══ MAIN GRID ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN (8 cols) ─────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Tabbed alert panel — only render if the user can see at least one tab */}
          {alertTabs.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-0 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-sm">
                      <FontAwesomeIcon icon={faHandHoldingHeart} />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm">Alert Centre</h3>
                  </div>
                </div>

                <div className="flex gap-1">
                  {alertTabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
                        activeTab === tab.key
                          ? 'border-primBtn text-primBtn bg-primBtn/5'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <FontAwesomeIcon icon={tab.icon} className="text-[10px]" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                          activeTab === tab.key ? 'bg-primBtn text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">

                {/* ── Safeguarding cases ── */}
                {activeTab === 'cases' && perms.safeguardingCase.view && (
                  safeguardingCases?.length === 0
                    ? <EmptyRow message="No open safeguarding cases — all clear." />
                    : <div className="space-y-3">
                        {safeguardingCases.slice(0, 5).map((c: any) => (
                          <div key={c.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-colors group">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-sm shrink-0">
                              <FontAwesomeIcon icon={INCIDENT_ICONS[c.incidentType] ?? faHandHoldingHeart} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-bold text-slate-800 text-sm truncate">
                                  {c.child?.firstName} {c.child?.lastName}
                                  <span className="text-slate-400 font-normal ml-1.5 text-xs">#{c.child?.childCode}</span>
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${SG_STATUS_COLOR[c.status] ?? ''}`}>
                                  {c.status?.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
                                  {c.incidentType?.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{c.description || 'No description recorded'}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-medium">
                                <span>Reported: {fmtDate(c.incidentDate)}</span>
                                {c.reportedBy && <span>By: {c.reportedBy.firstName} {c.reportedBy.lastName}</span>}
                              </div>
                            </div>
                            <Link to={`/safeguarding/${c.id}`}
                              className="shrink-0 text-[10px] font-black text-primBtn opacity-0 group-hover:opacity-100 transition-opacity">
                              View →
                            </Link>
                          </div>
                        ))}
                      </div>
                )}

                {/* ── Education alerts ── */}
                {activeTab === 'alerts' && perms.educationAlert.view && (
                  eduAlerts?.length === 0
                    ? <EmptyRow message="No unresolved education alerts." />
                    : <div className="space-y-3">
                        {eduAlerts.slice(0, 6).map((a: any) => (
                          <div key={a.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${ALERT_COLORS[a.alertType] ?? 'bg-slate-100 text-slate-500'}`}>
                              <FontAwesomeIcon icon={faGraduationCap} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-bold text-slate-800 text-sm truncate">
                                  {a.academicRecord?.child?.firstName} {a.academicRecord?.child?.lastName}
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${ALERT_COLORS[a.alertType] ?? 'bg-slate-100 text-slate-600'}`}>
                                  {a.alertType?.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{a.message}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                                <span>Grade: {a.academicRecord?.grade}</span>
                                <span>Year: {a.academicRecord?.academicYear}</span>
                                {a.academicRecord?.attendanceRate !== null && (
                                  <span>Attendance: {a.academicRecord?.attendanceRate}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                )}

              </div>
            </div>
          )}

          {/* Recent Disbursements — Finance roles only */}
          {perms.financeReport.view && (
            <SectionCard title="Recent Disbursements" subtitle="Latest financial support records" icon={faHandHoldingDollar} action="Full report" actionTo="/financial">
              {recentDisbursements?.length === 0
                ? <EmptyRow message="No recent disbursements." />
                : <>
                    <div className="mx-6 my-4 p-4 bg-primBtn/5 rounded-2xl border border-primBtn/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Disbursed</p>
                        <p className="text-xl font-black text-primBtn font-mono">{totalDisbursed.toLocaleString()} ETB</p>
                      </div>
                      <FontAwesomeIcon icon={faCoins} className="text-primBtn/30 text-3xl" />
                    </div>

                    <div className="divide-y divide-slate-50">
                      {recentDisbursements.slice(0, 5).map((f: any) => (
                        <div key={f.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                          <div className="w-9 h-9 bg-primBtn/10 text-primBtn rounded-xl flex items-center justify-center text-xs shrink-0">
                            <FontAwesomeIcon icon={faCoins} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">
                                {f.child?.firstName} {f.child?.lastName}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
                                {f.supportType?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(f.disbursedDate)}</p>
                          </div>
                          <span className="font-black text-slate-900 font-mono text-sm shrink-0">
                            {f.amount?.toLocaleString()} {f.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
              }
            </SectionCard>
          )}
        </div>

        {/* ── RIGHT COLUMN (4 cols) ────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Sub-city distribution */}
          {subCityData.length > 0 && (
            <SectionCard title="Children by Sub-City" subtitle="Geographic distribution" icon={faHome}>
              <div className="p-5 space-y-3">
                {subCityData.map((s, i) => {
                  const max = subCityData[0]?._count?.subCity ?? 1;
                  const pct = Math.round(((s._count?.subCity ?? 0) / max) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600">{s.subCity || 'Unknown'}</span>
                        <span className="text-xs font-black text-slate-900">{s._count?.subCity ?? 0}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primBtn rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Staff roster — Admin / Manager / Director */}
          {perms.employeeList.view && (
            <SectionCard title="Staff Roster" subtitle="Active personnel" icon={faUserTie} action="Directory" actionTo="/AllEmployees">
              {employees?.length === 0
                ? <EmptyRow message="No staff records found." />
                : <div className="divide-y divide-slate-50">
                    {employees
                      .filter((e: any) => e.id !== user?.id)
                      .slice(0, 4)
                      .map((emp: any) => (
                        <div key={emp.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                          {emp.avatarUrl
                            ? <img src={`${API_URL}${emp.avatarUrl}`} alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 shrink-0" />
                            : <div className="w-9 h-9 rounded-xl bg-primBtn/10 text-primBtn flex items-center justify-center text-sm font-bold shrink-0">
                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                              </div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-primBtn/10 text-primBtn rounded-lg">
                              {emp.role?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <Link to={`/EmployeeSingle/${emp.id}`}
                            className="text-[10px] font-black text-slate-300 group-hover:text-primBtn transition-colors shrink-0">
                            View →
                          </Link>
                        </div>
                      ))}
                  </div>
              }
            </SectionCard>
          )}

          {/* Recent children — always visible */}
          <SectionCard title="Recent Registrations" subtitle="Latest children admitted" icon={faChild} action="All children" actionTo="/ALLChild">
            {recentChildren?.length === 0
              ? <EmptyRow message="No recent registrations." />
              : <div className="divide-y divide-slate-50">
                  {recentChildren.slice(0, 4).map((child: any) => {
                    const photo = child.photos?.find((p: any) => p.isPrimary) ?? child.photos?.[0];
                    return (
                      <div key={child.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                        {photo
                          ? <img src={`${API_URL}${photo.url}`} alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 shrink-0" />
                          : <div className="w-9 h-9 rounded-xl bg-primBtn/5 text-primBtn/40 flex items-center justify-center text-sm shrink-0">
                              <FontAwesomeIcon icon={faChild} />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                            {child.firstName} {child.lastName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-mono text-slate-400">{child.childCode}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ${STATUS_COLORS[child.status] ?? ''}`}>
                              {child.status}
                            </span>
                          </div>
                        </div>
                        <Link to={`/ChildSingle/${child.id}`}
                          className="text-[10px] font-black text-slate-300 group-hover:text-primBtn transition-colors shrink-0">
                          View →
                        </Link>
                      </div>
                    );
                  })}
                </div>
            }
          </SectionCard>

        </div>
      </div>
    </div>
  );
};

export default DashboardBody;