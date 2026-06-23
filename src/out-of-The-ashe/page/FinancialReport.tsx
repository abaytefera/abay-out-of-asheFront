import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCoins, faHandHoldingDollar, faChild,
  faCalendarCheck, faFilter, faSearch, faDownload,
  faChartBar, faChevronDown, faChevronUp, faFileAlt,
  faSortAmountDown, faSortAmountUp, faReceipt,
  faCircleCheck, faClock, faBan, faEllipsisH
} from '@fortawesome/free-solid-svg-icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import { useGetFinancialReportQuery } from '../Redux/Dashboard';

// ─── Constants ────────────────────────────────────────────────────────────────
const SUPPORT_COLORS: Record<string, string> = {
  EDUCATION:   'bg-blue-50 text-blue-700 border-blue-100',
  HEALTH:      'bg-emerald-50 text-emerald-700 border-emerald-100',
  NUTRITION:   'bg-amber-50 text-amber-700 border-amber-100',
  CLOTHING:    'bg-violet-50 text-violet-700 border-violet-100',
  SHELTER:     'bg-orange-50 text-orange-700 border-orange-100',
  OTHER:       'bg-slate-50 text-slate-600 border-slate-100',
};

const STATUS_COLORS: Record<string, string> = {
  DISBURSED:  'bg-emerald-50 text-emerald-700',
  PENDING:    'bg-amber-50 text-amber-600',
  CANCELLED:  'bg-rose-50 text-rose-600',
  PROCESSING: 'bg-blue-50 text-blue-600',
};

const STATUS_ICONS: Record<string, any> = {
  DISBURSED:  faCircleCheck,
  PENDING:    faClock,
  CANCELLED:  faBan,
  PROCESSING: faEllipsisH,
};

const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#64748B'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtAmt = (n: number, currency = 'ETB') =>
  `${(n ?? 0).toLocaleString()} ${currency}`;

// ─── Sub-components ───────────────────────────────────────────────────────────
const SummaryCard = ({ icon, label, value, sub, color }: any) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base shrink-0 ${color}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FinancialReport = () => {
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState<number[]>([]);
  const [sortAsc, setSortAsc]       = useState(false);
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 10;

  const { data: report, isLoading } = useGetFinancialReportQuery(undefined);

  const disbursements: any[] = report?.data?.disbursements ?? [];
  const totalDisbursed       = report?.data?.summary?._sum?.amount ?? 0;
  const totalCount           = report?.data?.summary?._count?.id ?? disbursements.length;

  useEffect(() => {
    console.log("update filter");
    console.log(report);
  }, [report]);

  // ── Date filter helper ─────────────────────────────────────────────────────
  const matchesDateFilter = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const y = d.getFullYear().toString();
    const m = d.getMonth() + 1;
    if (yearFilter !== 'ALL' && y !== yearFilter) return false;
    if (monthFilter.length > 0 && !monthFilter.includes(m)) return false;
    return true;
  };

  // ── Derived year options from actual data ──────────────────────────────────
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(
      disbursements
        .map(d => d.disbursedDate ? new Date(d.disbursedDate).getFullYear().toString() : null)
        .filter(Boolean)
    )) as string[];
    return years.sort((a, b) => +b - +a);
  }, [disbursements]);

  // ── Derived stats (respect date filter) ───────────────────────────────────
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    disbursements.forEach(d => {
      if (!matchesDateFilter(d.disbursedDate)) return;
      const t = d.supportType ?? 'OTHER';
      map[t] = (map[t] ?? 0) + (d.amount ?? 0);
    });
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
  }, [disbursements, yearFilter, monthFilter]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    disbursements.forEach(d => {
      if (!matchesDateFilter(d.disbursedDate)) return;
      const m = d.disbursedDate
        ? new Date(d.disbursedDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
        : 'Unknown';
      map[m] = (map[m] ?? 0) + (d.amount ?? 0);
    });
    return Object.entries(map).map(([month, amount]) => ({ month, amount }));
  }, [disbursements, yearFilter, monthFilter]);

  const uniqueTypes = ['ALL', ...Array.from(new Set(disbursements.map(d => d.supportType ?? 'OTHER')))];

  // ── Filtered / sorted / paginated list ────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = disbursements.filter(d => {
      const name = `${d.child?.firstName ?? ''} ${d.child?.lastName ?? ''}`.toLowerCase();
      const code = (d.child?.childCode ?? '').toLowerCase();
      const q    = search.toLowerCase();
      const matchSearch = !q || name.includes(q) || code.includes(q);
      const matchType   = typeFilter === 'ALL' || d.supportType === typeFilter;
      const matchDate   = matchesDateFilter(d.disbursedDate);
      return matchSearch && matchType && matchDate;
    });
    rows = [...rows].sort((a, b) => {
      const diff = (a.amount ?? 0) - (b.amount ?? 0);
      return sortAsc ? diff : -diff;
    });
    return rows;
  }, [disbursements, search, typeFilter, yearFilter, monthFilter, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Toggle month in multi-select ──────────────────────────────────────────
  const toggleMonth = (m: number) => {
    setMonthFilter(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
    setPage(1);
  };

  const clearDateFilters = () => {
    setYearFilter('ALL');
    setMonthFilter([]);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primBtn border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-400">Loading financial report…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-900 antialiased">
      <DashbordNav></DashbordNav>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="bg-white border mt-30 border-slate-100 rounded-3xl px-7 py-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/DashboardPage"
            className="w-10 h-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primBtn hover:border-primBtn transition-all">
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Report</h1>
            <p className="text-slate-400 font-medium text-sm mt-0.5">Full disbursement history &amp; analytics</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primBtn/10 text-primBtn hover:bg-primBtn hover:text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all">
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
          Export
        </button>
      </header>

      {/* ══ DATE FILTERS ════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm px-6 py-5">
        <div className="flex flex-col gap-4">

          {/* Row 1: Year + clear */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-14 shrink-0">Year</span>
            <div className="flex flex-wrap gap-2">
              {['ALL', ...availableYears].map(y => (
                <button
                  key={y}
                  onClick={() => { setYearFilter(y); setPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    yearFilter === y
                      ? 'bg-primBtn text-white border-primBtn'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primBtn hover:text-primBtn'
                  }`}>
                  {y === 'ALL' ? 'All years' : y}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Month pills */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-14 shrink-0">Month</span>
            <div className="flex flex-wrap gap-2">
              {MONTH_NAMES.map((name, i) => {
                const m = i + 1;
                const active = monthFilter.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggleMonth(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-primBtn text-white border-primBtn'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primBtn hover:text-primBtn'
                    }`}>
                    {name}
                  </button>
                );
              })}
            </div>

            {/* Clear button */}
            {(yearFilter !== 'ALL' || monthFilter.length > 0) && (
              <button
                onClick={clearDateFilters}
                className="ml-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1">
                <FontAwesomeIcon icon={faBan} className="text-[10px]" />
                Clear
              </button>
            )}
          </div>

          {/* Active filter summary */}
          {(yearFilter !== 'ALL' || monthFilter.length > 0) && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-primBtn text-xs" />
              <p className="text-xs font-semibold text-slate-500">
                Showing:&nbsp;
                {yearFilter !== 'ALL' && <span className="text-primBtn font-black">{yearFilter}</span>}
                {yearFilter !== 'ALL' && monthFilter.length > 0 && <span className="text-slate-400"> · </span>}
                {monthFilter.length > 0 && (
                  <span className="text-primBtn font-black">
                    {monthFilter.sort((a,b)=>a-b).map(m => MONTH_NAMES[m-1]).join(', ')}
                  </span>
                )}
                <span className="text-slate-400 ml-1">({filtered.length} records)</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ KPI CARDS ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={faCoins}
          label="Total Disbursed"
          value={fmtAmt(totalDisbursed)}
          color="bg-primBtn/10 text-primBtn"
        />
        <SummaryCard
          icon={faReceipt}
          label="Total Records"
          value={totalCount}
          sub="across all children"
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          icon={faChild}
          label="Children Supported"
          value={new Set(disbursements.map(d => d.child?.id)).size}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          icon={faHandHoldingDollar}
          label="Support Types"
          value={byType.length}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* ══ CHARTS ROW ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Monthly bar chart */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm p-6">
          <div className="mb-5">
            <h3 className="font-black text-slate-900 tracking-tight">Monthly Disbursements</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Total amount disbursed per month (ETB)
              {yearFilter !== 'ALL' && ` · ${yearFilter}`}
              {monthFilter.length > 0 && ` · ${monthFilter.map(m => MONTH_NAMES[m-1]).join(', ')}`}
            </p>
          </div>
          <div className="h-[220px]">
            {byMonth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 font-bold italic">No data for selected period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip
                    formatter={(v: number) => [fmtAmt(v), 'Amount']}
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="amount" fill="var(--color-primBtn, #6366f1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* By-type pie */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-black text-slate-900 tracking-tight">By Support Type</h3>
            <p className="text-xs text-slate-400 mt-0.5">Breakdown of disbursements</p>
          </div>
          {byType.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400 font-bold italic">No data</div>
          ) : (
            <>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byType} innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                      {byType.map((entry, i) => (
                        <Cell key={i} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtAmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {byType.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-semibold text-slate-600">{item.name.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 font-mono">{fmtAmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ TABLE ════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">

        {/* Table header / filters */}
        <div className="px-6 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-xl bg-primBtn/10 text-primBtn flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faHandHoldingDollar} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm tracking-tight">Disbursement Records</h3>
              <p className="text-[10px] text-slate-400 font-medium">{filtered.length} records</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
              <input
                type="text"
                placeholder="Search child…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-primBtn bg-slate-50 w-40"
              />
            </div>

            {/* Type filter */}
            <div className="relative">
              <FontAwesomeIcon icon={faFilter}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                className="pl-8 pr-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-primBtn bg-slate-50 appearance-none">
                {uniqueTypes.map(t => (
                  <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Sort toggle */}
            <button
              onClick={() => setSortAsc(s => !s)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:border-primBtn hover:text-primBtn transition-all bg-slate-50">
              <FontAwesomeIcon icon={sortAsc ? faSortAmountUp : faSortAmountDown} />
              {sortAsc ? 'Low → High' : 'High → Low'}
            </button>
          </div>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <div className="py-14 text-center text-sm font-bold text-slate-400 italic">
            No records match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Child', 'Support Type', 'Amount', 'Date', 'Status', 'Notes'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Child */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {f.child?.photos?.[0]
                          ? <img src={`http://localhost:5000${f.child.photos[0].url}`} alt=""
                              className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-100 shrink-0" />
                          : <div className="w-8 h-8 rounded-xl bg-primBtn/10 text-primBtn flex items-center justify-center text-xs font-bold shrink-0">
                              {f.child?.firstName?.[0]}{f.child?.lastName?.[0]}
                            </div>
                        }
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">
                            {f.child?.firstName} {f.child?.lastName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">{f.child?.childCode}</p>
                        </div>
                      </div>
                    </td>

                    {/* Support type */}
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${SUPPORT_COLORS[f.supportType] ?? SUPPORT_COLORS.OTHER}`}>
                        {(f.supportType ?? 'OTHER').replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-3.5 font-black text-slate-900 font-mono whitespace-nowrap">
                      {fmtAmt(f.amount, f.currency)}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {fmtDate(f.disbursedDate)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      {f.status ? (
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-lg ${STATUS_COLORS[f.status] ?? 'bg-slate-50 text-slate-600'}`}>
                          <FontAwesomeIcon icon={STATUS_ICONS[f.status] ?? faFileAlt} className="text-[8px]" />
                          {f.status}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>

                    {/* Notes */}
                    <td className="px-6 py-3.5 text-xs text-slate-400 max-w-[180px] truncate">
                      {f.notes || <span className="italic">No notes</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400">
              Page {page} of {totalPages} · {filtered.length} records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:border-primBtn hover:text-primBtn transition-all">
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:border-primBtn hover:text-primBtn transition-all">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReport;