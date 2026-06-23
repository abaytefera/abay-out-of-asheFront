// =============================================================================
// AuditLogPage.tsx — Full audit log page, powered by Redux RTK Query
//
// COUNTRY_DIRECTOR → sees all logs + user column + search filter
// All other roles  → sees only their own logs (server-enforced)
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserShield,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faRotateRight,
  faCalendarDays,
  faBolt,
  faUser,
  faChild,
  faLock,
  faClock,
  faTriangleExclamation,
  faCheckCircle,
  faXmark,
  faArrowUpRightFromSquare,
  faLayerGroup,
  faDatabase,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetAuditLogsQuery,
  useGetAuditResourcesQuery,
  useGetAuditActionsQuery,
} from '../Redux/auditLogSlice';import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
;



// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatarUrl?: string;
  };
}
 interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user: AuditLogUser;
  child?: AuditLogChild | null;
}

 interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}
 
 interface AuditLogChild {
  id: string;
  childCode: string;
  firstName: string;
  lastName: string;
}
// ─── Action styling maps ──────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  LOGIN:  'bg-violet-50 text-violet-700 border-violet-200',
  LOGOUT: 'bg-slate-100 text-slate-600 border-slate-200',
  VIEW:   'bg-amber-50 text-amber-700 border-amber-200',
  EXPORT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

const ACTION_ICONS: Record<string, any> = {
  CREATE: faCheckCircle,
  UPDATE: faBolt,
  DELETE: faTriangleExclamation,
  LOGIN:  faUser,
  LOGOUT: faLock,
  VIEW:   faArrowUpRightFromSquare,
  EXPORT: faDatabase,
};

const getActionStyle = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toUpperCase().includes(k)
  );
  return key ? ACTION_COLORS[key] : 'bg-slate-50 text-slate-600 border-slate-200';
};

const getActionIcon = (action: string) => {
  const key = Object.keys(ACTION_ICONS).find((k) =>
    action.toUpperCase().includes(k)
  );
  return key ? ACTION_ICONS[key] : faBolt;
};

// ─── Date / time helpers ──────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const fmtDateTime = (d: string) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—';

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Small sub-components ─────────────────────────────────────────────────────
const FilterBadge = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primBtn/10 text-primBtn rounded-xl text-xs font-bold border border-primBtn/20">
    {label}
    <button onClick={onRemove} className="hover:text-rose-500 transition-colors">
      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
    </button>
  </span>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-6 py-4 animate-pulse border-b border-slate-50">
    <div className="w-9 h-9 bg-slate-100 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
      <div className="h-2 bg-slate-50 rounded-lg w-1/2" />
    </div>
    <div className="w-20 h-6 bg-slate-50 rounded-lg" />
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <FontAwesomeIcon icon={faUserShield} className="text-slate-300 text-xl" />
    </div>
    <p className="font-black text-slate-600 text-sm">No activity found</p>
    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or date range</p>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-400" />
    </div>
    <p className="text-sm font-bold text-slate-700">Failed to load audit logs</p>
    <button
      onClick={onRetry}
      className="text-xs font-black text-primBtn hover:underline flex items-center gap-1"
    >
      <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
      Retry
    </button>
  </div>
);

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================
const AuditLogPage = ({ user }: Props) => {
  const isCD = user?.role === 'COUNTRY_DIRECTOR';

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch]       = useState('');
  const [resource, setResource]   = useState('');
  const [action, setAction]       = useState('');
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');
  const [page, setPage]           = useState(1);
  const [showDates, setShowDates] = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);

  // ── RTK Query hooks ─────────────────────────────────────────────────────────
  const logsQuery = useGetAuditLogsQuery(
    {
      page,
      limit: 20,
      ...(isCD && search ? { search } : {}),
      ...(resource ? { resource } : {}),
      ...(action   ? { action }   : {}),
      ...(from     ? { from }     : {}),
      ...(to       ? { to }       : {}),
    },
    { refetchOnMountOrArgChange: true }
  );

const { data: rawResourceList} = useGetAuditResourcesQuery();
const { data: rawActionList } = useGetAuditActionsQuery();


  const resourceList = Array.isArray(rawResourceList) ? rawResourceList : [];
const actionList = Array.isArray(rawActionList) ? rawActionList : [];
  

  const logs      = logsQuery.data?.data ?? [];
  const meta      = logsQuery.data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };
  const isLoading = logsQuery.isLoading;
  const isError   = logsQuery.isError;
  const isFetching = logsQuery.isFetching;

  // ── Filter helpers ───────────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearch('');
    setResource('');
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const changePage = (p: number) => {
    setPage(p);
    setExpanded(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(()=>{

  console.log("update data resourceList")
  console.log(resourceList)
  console.log("update data actionList")
  console.log(actionList)
  },[resourceList,actionList])

  const activeFilters = [
    isCD && search   ? { label: `Search: "${search}"`,     clear: () => { setSearch('');   setPage(1); } } : null,
    resource         ? { label: `Resource: ${resource}`,   clear: () => { setResource(''); setPage(1); } } : null,
    action           ? { label: `Action: ${action}`,       clear: () => { setAction('');   setPage(1); } } : null,
    from             ? { label: `From: ${fmtDate(from)}`,  clear: () => { setFrom('');     setPage(1); } } : null,
    to               ? { label: `To: ${fmtDate(to)}`,      clear: () => { setTo('');       setPage(1); } } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  // Quick-stat counts from current page
  const actionCounts = logs.reduce<Record<string, number>>((acc, l) => {
    const key =
      Object.keys(ACTION_COLORS).find((k) => l.action.toUpperCase().includes(k)) ??
      'OTHER';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Page number window (show up to 5 page buttons)
  const pageWindow = () => {
    const total = meta.totalPages;
    const cur   = meta.page;
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  };

  // =============================================================================
  return (
    <div className="space-y-6 text-slate-900 antialiased pb-10">
<DashbordNav></DashbordNav>
      {/* ════ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="bg-primBtn  mt-30 rounded-3xl px-7 py-6 text-white shadow-xl relative overflow-hidden">
        {/* Glows */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primBtn/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Title row */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-white/10">
              <FontAwesomeIcon icon={faUserShield} className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {isCD ? 'Security Audit Log' : 'My Activity History'}
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-0.5">
                {isCD
                  ? `Full system audit trail · ${meta.total.toLocaleString()} records`
                  : `Your personal activity history · ${meta.total.toLocaleString()} records`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCD && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FULL ACCESS
              </span>
            )}
            <span
              className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                isFetching
                  ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                  : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isFetching ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              {isFetching ? 'LOADING…' : 'LIVE'}
            </span>
            <button
              onClick={() => logsQuery.refetch()}
              title="Refresh"
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all active:scale-95"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={`text-sm ${isFetching ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Action stat pills */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {Object.entries(ACTION_COLORS).map(([key, cls]) => (
            <button
              key={key}
              onClick={() => {
                setAction((prev) => (prev === key ? '' : key));
                setPage(1);
              }}
              className={`rounded-2xl px-4 py-2 text-center border transition-all hover:scale-105 active:scale-95 ${
                action === key ? 'ring-2 ring-white/40 scale-105' : 'opacity-70 hover:opacity-100'
              } ${cls}`}
            >
              <span className="text-base font-black leading-none block">
                {actionCounts[key] ?? 0}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-80 block">
                {key}
              </span>
            </button>
          ))}
          <div className="ml-auto flex items-center">
            <span className="text-[10px] text-slate-500 font-medium">
              Showing page {meta.page} of {meta.totalPages} ({meta.total.toLocaleString()} total)
            </span>
          </div>
        </div>
      </header>

      {/* ════ SCOPE NOTICE (non-CD only) ═══════════════════════════════════════ */}
      {!isCD && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faLock} className="text-amber-600 text-xs" />
          </div>
          <p className="text-xs font-medium text-amber-700">
            <span className="font-black">Viewing your activity only.</span>{' '}
            Scope is enforced server-side. Contact your Country Director to review system-wide logs.
          </p>
        </div>
      )}

      {/* ════ FILTERS ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3">

          {/* Search — CD only */}
          {isCD && (
            <div className="relative flex-1 min-w-[200px]">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primBtn/30 focus:border-primBtn transition"
              />
            </div>
          )}

          {/* Resource filter */}
          <select
            value={resource}
            onChange={(e) => {
              setResource(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primBtn/30 focus:border-primBtn transition min-w-[140px]"
          >
            <option value="">All Resources</option>
            {resourceList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Action filter */}
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primBtn/30 focus:border-primBtn transition min-w-[140px]"
          >
            <option value="">All Actions</option>
            {actionList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Date range toggle */}
          <button
            onClick={() => setShowDates((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all ${
              showDates || from || to
                ? 'bg-primBtn text-white border-primBtn'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primBtn hover:text-primBtn'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarDays} className="text-xs" />
            Date Range
            {(from || to) && (
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            )}
          </button>

          {/* Clear all */}
          {activeFilters.length > 0 && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-2xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
              Clear All
            </button>
          )}
        </div>

        {/* Date range inputs */}
        {showDates && (
          <div className="flex flex-wrap gap-4 items-center pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primBtn/30 focus:border-primBtn transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primBtn/30 focus:border-primBtn transition"
              />
            </div>
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom('');
                  setTo('');
                  setPage(1);
                }}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Clear dates
              </button>
            )}
          </div>
        )}

        {/* Active filter badges */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {activeFilters.map((f, i) => (
              <FilterBadge key={i} label={f.label} onRemove={f.clear} />
            ))}
          </div>
        )}
      </div>

      {/* ════ LOG TABLE ════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">

        {/* Column headers */}
        <div
          className={`hidden md:grid gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest ${
            isCD
              ? 'grid-cols-[2.5fr_1.8fr_1.5fr_1.2fr_80px]'
              : 'grid-cols-[2.5fr_1.5fr_1.2fr_80px]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faBolt} className="text-[9px]" /> Action / Resource
          </span>
          {isCD && (
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="text-[9px]" /> User
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faChild} className="text-[9px]" /> Child
          </span>
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="text-[9px]" /> Time
          </span>
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faLayerGroup} className="text-[9px]" />
          </span>
        </div>

        {/* Body */}
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => logsQuery.refetch()} />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((log: AuditLog) => {
              const isOpen      = expanded === log.id;
              const actionStyle = getActionStyle(log.action);
              const actionIcon  = getActionIcon(log.action);

              return (
                <div
                  key={log.id}
                  className={`group transition-colors ${
                    isOpen ? 'bg-slate-50/60' : 'hover:bg-slate-50/40'
                  }`}
                >
                  {/* ── Row ── */}
                  <div
                    className={`grid gap-4 px-6 py-4 items-center ${
                      isCD
                        ? 'grid-cols-1 md:grid-cols-[2.5fr_1.8fr_1.5fr_1.2fr_80px]'
                        : 'grid-cols-1 md:grid-cols-[2.5fr_1.5fr_1.2fr_80px]'
                    }`}
                  >
                    {/* Action + resource */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 border ${actionStyle}`}
                      >
                        <FontAwesomeIcon icon={actionIcon} />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border inline-block mb-1 ${actionStyle}`}
                        >
                          {log.action}
                        </span>
                        <p className="text-xs font-bold text-slate-700 truncate leading-snug">
                          {log.resource}
                        </p>
                        {log.resourceId && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                            #{log.resourceId.slice(0, 12)}…
                          </p>
                        )}
                      </div>
                    </div>

                    {/* User — CD only */}
                    {isCD && (
                      <div className="flex items-center gap-2.5 min-w-0">
                        {log.user?.avatarUrl ? (
                          <img
                            src={log.user.avatarUrl}
                            className="w-8 h-8 rounded-xl object-cover shrink-0 ring-2 ring-slate-100"
                            alt=""
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-primBtn/10 text-primBtn flex items-center justify-center text-xs font-black shrink-0">
                            {log.user?.firstName?.[0]}
                            {log.user?.lastName?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                            {log.user?.firstName} {log.user?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate leading-tight">
                            {log.user?.email}
                          </p>
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-primBtn/10 text-primBtn rounded-lg leading-none inline-block mt-0.5">
                            {log.user?.role?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Child */}
                    <div className="flex items-center min-w-0">
                      {log.child ? (
                        <Link
                          to={`/ChildSingle/${log.child.id}`}
                          className="flex items-center gap-2 group/child hover:text-primBtn transition-colors min-w-0"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">
                            <FontAwesomeIcon icon={faChild} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 group-hover/child:text-primBtn truncate leading-tight transition-colors">
                              {log.child.firstName} {log.child.lastName}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 leading-tight">
                              #{log.child.childCode}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">—</span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 leading-tight">
                        {timeAgo(log.createdAt)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {fmtDate(log.createdAt)}
                      </p>
                      {log.ipAddress && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                          {log.ipAddress}
                        </p>
                      )}
                    </div>

                    {/* Details toggle */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setExpanded(isOpen ? null : log.id)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                          isOpen
                            ? 'bg-primBtn text-white border-primBtn'
                            : 'bg-white text-slate-400 border-slate-200 hover:border-primBtn hover:text-primBtn md:opacity-0 md:group-hover:opacity-100'
                        }`}
                      >
                        {isOpen ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded panel ── */}
                  {isOpen && (
                    <div className="px-6 pb-5">
                      <div className="bg-slate-900 rounded-2xl p-5 space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Full Entry
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-slate-500 font-medium mb-0.5">Timestamp</p>
                            <p className="font-mono text-slate-200 text-[11px]">
                              {fmtDateTime(log.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium mb-0.5">Resource</p>
                            <p className="font-mono text-slate-200 text-[11px]">{log.resource}</p>
                          </div>
                          {log.resourceId && (
                            <div>
                              <p className="text-slate-500 font-medium mb-0.5">Resource ID</p>
                              <p className="font-mono text-slate-200 text-[11px] break-all">
                                {log.resourceId}
                              </p>
                            </div>
                          )}
                          {log.ipAddress && (
                            <div>
                              <p className="text-slate-500 font-medium mb-0.5">IP Address</p>
                              <p className="font-mono text-slate-200 text-[11px]">
                                {log.ipAddress}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500 font-medium mb-0.5">User</p>
                            <p className="font-mono text-slate-200 text-[11px]">
                              {log.user?.firstName} {log.user?.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium mb-0.5">Role</p>
                            <p className="font-mono text-primBtn/80 text-[11px]">
                              {log.user?.role?.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>

                        {log.userAgent && (
                          <div>
                            <p className="text-slate-500 text-[10px] font-medium mb-1">
                              User Agent
                            </p>
                            <p className="font-mono text-slate-500 text-[10px] break-all leading-relaxed">
                              {log.userAgent}
                            </p>
                          </div>
                        )}

                        {log.metadata && (
                          <div>
                            <p className="text-slate-500 text-[10px] font-medium mb-1">
                              Metadata
                            </p>
                            <pre className="bg-black/40 rounded-xl p-3 text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ PAGINATION ═════════════════════════════════════════════════════ */}
        {!isLoading && !isError && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-medium">
              Page{' '}
              <span className="font-black text-slate-700">{meta.page}</span> of{' '}
              <span className="font-black text-slate-700">{meta.totalPages}</span>
              <span className="mx-2 text-slate-200">·</span>
              {meta.total.toLocaleString()} records
            </p>

            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                onClick={() => changePage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:border-primBtn hover:text-primBtn disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>

              {/* Page numbers */}
              {pageWindow().map((p) => (
                <button
                  key={p}
                  onClick={() => changePage(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                    p === meta.page
                      ? 'bg-primBtn text-white border border-primBtn shadow-sm shadow-primBtn/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-primBtn hover:text-primBtn'
                  }`}
                >
                  {p}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() => changePage(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:border-primBtn hover:text-primBtn disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;