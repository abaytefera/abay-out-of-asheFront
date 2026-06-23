import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch, faUser, faBriefcase, faEnvelope, faPhone,
  faShieldHalved, faCircle, faArrowRight, faUsers,
  faFilter, faChevronDown, faUserCheck, faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useGetEmployeesQuery } from "../../Redux/Employee";

import DashbordNav from "../../Component/AuthenticateComponent/DashboardComponent/DashbordNav";
import { useSelector } from "react-redux";
const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;
// ── Constants ─────────────────────────────────────────────────────────────
const ROLE_STYLES = {
  ADMIN:            { label: "Admin",             color: "bg-purple-50 text-purple-700 border-purple-200" },
  COUNTRY_DIRECTOR: { label: "Country Director",  color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  PROGRAM_MANAGER:  { label: "Program Manager",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  SOCIAL_WORKER:    { label: "Social Worker",     color: "bg-teal-50 text-teal-700 border-teal-200" },
  EDUCATION_OFFICER:{ label: "Education Officer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FINANCE_OFFICER:  { label: "Finance Officer",   color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const ALL_ROLES = Object.keys(ROLE_STYLES);

// ── Helpers ───────────────────────────────────────────────────────────────
const initials = (f, l) =>
  `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase() || "?";

const avatarBg = (name = "") => {
  const palette = [
    "bg-indigo-500","bg-violet-500","bg-blue-500","bg-teal-500",
    "bg-emerald-500","bg-amber-500","bg-rose-500","bg-pink-500",
  ];
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return palette[n % palette.length];
};

// ── Chip ──────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const s = ROLE_STYLES[role] || { label: role?.replace(/_/g," "), color: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${s.color}`}>
      {s.label}
    </span>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = "md" }) => {
  const sz = {
    sm:  "w-9 h-9 text-sm",
    md:  "w-11 h-11 text-base",
    lg:  "w-14 h-14 text-lg",
    xl:  "w-20 h-20 text-2xl",
  }[size] || "w-11 h-11 text-base";

  if (user?.avatarUrl) {
    return (
      <img
        src={`${API_URL}${user.avatarUrl}`}
        alt={`${user.firstName} ${user.lastName}`}
        className={`${sz} rounded-2xl object-cover ring-2 ring-white shadow-md shrink-0`}
      />
    );
  }
  return (
    <div className={`${sz} ${avatarBg(`${user?.firstName}${user?.lastName}`)} rounded-2xl flex items-center justify-center font-black text-white shadow-md shrink-0`}>
      {initials(user?.firstName, user?.lastName)}
    </div>
  );
};

// ── Stat pill ─────────────────────────────────────────────────────────────
const StatPill = ({ icon, value, label, color }) => (
  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border ${color}`}>
    <FontAwesomeIcon icon={icon} className="text-sm" />
    <div>
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{label}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// EMPLOYEE CARD — grid view
// ─────────────────────────────────────────────────────────────────────────
const EmployeeCard = ({ emp,user, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group ${emp.id===user?.id &&("hidden")} w-full text-left bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-primBtn/20 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primBtn/30`}
  >
    {/* Top: avatar + status dot */}
    <div className="flex items-start justify-between mb-4">
      <div className="relative">
        <Avatar user={emp} size="lg" />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${emp.isActive ? "bg-green-400" : "bg-slate-300"}`} />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <RoleBadge role={emp.role} />
        {emp.department && (
          <span className="text-[10px] font-medium text-slate-400">{emp.department}</span>
        )}
      </div>
    </div>

    {/* Name + title */}
    <div className="mb-3">
      <h3 className="text-sm font-bold text-slate-900 group-hover:text-primBtn transition-colors">
        {emp.firstName} {emp.lastName}
      </h3>
      <p className="text-xs text-slate-400 mt-0.5 truncate">
        {emp.jobTitle || emp.role?.replace(/_/g, " ")}
      </p>
    </div>

    {/* Contact */}
    <div className="space-y-1.5 mb-4">
      {emp.email && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FontAwesomeIcon icon={faEnvelope} className="text-slate-300 text-[10px] shrink-0" />
          <span className="truncate">{emp.email}</span>
        </div>
      )}
      {emp.phone && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FontAwesomeIcon icon={faPhone} className="text-slate-300 text-[10px] shrink-0" />
          <span>{emp.phone}</span>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
      <span className={`flex items-center gap-1.5 text-[11px] font-bold ${emp.isActive ? "text-green-600" : "text-slate-400"}`}>
        <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
        {emp.isActive ? "Active" : "Inactive"}
      </span>
      <span className="flex items-center gap-1 text-[11px] font-bold text-primBtn opacity-0 group-hover:opacity-100 transition-opacity">
        View profile <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
      </span>
    </div>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────
// EMPLOYEE ROW — table view
// ─────────────────────────────────────────────────────────────────────────
const EmployeeRow = ({ emp,user,onClick }) => (
  <tr
    onClick={onClick}
    className={`group ${emp.id===user?.id &&("hidden")} cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0`}
  >
    <td className="px-6 py-3.5">
      <div className="flex items-center gap-3">
        <Avatar user={emp} size="sm" />
        <div>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-primBtn transition-colors">
            {emp.firstName} {emp.lastName}
          </p>
          <p className="text-xs text-slate-400">{emp.jobTitle || "—"}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-3.5"><RoleBadge role={emp.role} /></td>
    <td className="px-6 py-3.5 text-xs text-slate-500">{emp.department || "—"}</td>
    <td className="px-6 py-3.5 text-xs text-slate-500">{emp.email || "—"}</td>
    <td className="px-6 py-3.5 text-xs text-slate-500">{emp.phone || "—"}</td>
    <td className="px-6 py-3.5">
      <span className={`flex items-center gap-1.5 w-fit text-[11px] font-bold ${emp.isActive ? "text-green-600" : "text-slate-400"}`}>
        <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
        {emp.isActive ? "Active" : "Inactive"}
      </span>
    </td>
    <td className="px-6 py-3.5">
      <span className="opacity-0 group-hover:opacity-100 text-primBtn transition-opacity">
        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
      </span>
    </td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────
const EmployeesPage = () => {
  const navigate = useNavigate();
  const { data: empRes, isLoading } = useGetEmployeesQuery();
  const {user}=useSelector((state)=>state.auth)
  

  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("");
  const [status,  setStatus]  = useState("");  // "" | "active" | "inactive"
  const [view,    setView]    = useState("grid"); // "grid" | "table"

  const employees = useMemo(() =>
    Array.isArray(empRes) ? empRes : empRes?.data || [],
  [empRes]);
 

  const filtered = useMemo(() => {
    let s = employees;
    if (search) {
      const q = search.toLowerCase();
      s = s.filter(e =>
        `${e.firstName} ${e.lastName} ${e.email || ""} ${e.jobTitle || ""} ${e.department || ""}`.toLowerCase().includes(q)
      );
    }
    if (role)   s = s.filter(e => e.role === role);
    if (status === "active")   s = s.filter(e => e.isActive);
    if (status === "inactive") s = s.filter(e => !e.isActive);
    return s;
  }, [employees, search, role, status]);

  // Stats
  const stats = useMemo(() => ({
    total:    employees.length,
    active:   employees.filter(e => e.isActive).length,
    inactive: employees.filter(e => !e.isActive).length,
  }), [employees]);

  const handleClick = (emp) => navigate(`/EmployeeSingle/${emp.id}`);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashbordNav></DashbordNav>
      <div className="max-w-7xl mt-20 mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team directory</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {filtered.length} staff member{filtered.length !== 1 ? "s" : ""}
              {role && ` · ${ROLE_STYLES[role]?.label || role}`}
              {search && ` matching "${search}"`}
            </p>
          </div>
          {/* Stats pills */}
          <div className="flex gap-2 flex-wrap">
            <StatPill icon={faUsers}     value={stats.total}    label="Total"    color="bg-slate-50 text-slate-700 border-slate-200" />
            <StatPill icon={faUserCheck} value={stats.active}   label="Active"   color="bg-green-50 text-green-700 border-green-200" />
            <StatPill icon={faUserSlash} value={stats.inactive} label="Inactive" color="bg-slate-50 text-slate-500 border-slate-200" />
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, department…"
              className="w-full pl-10 pr-4 h-10 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition">
                ×
              </button>
            )}
          </div>

          {/* Role filter */}
          <div className="relative">
            <FontAwesomeIcon icon={faShieldHalved} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="pl-8 pr-8 h-10 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition appearance-none"
            >
              <option value="">All roles</option>
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_STYLES[r]?.label || r}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="pl-8 pr-8 h-10 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition appearance-none"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden ml-auto">
            {["grid","table"].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 h-10 text-xs font-bold transition-colors ${view === v ? "bg-primBtn text-white" : "text-slate-500 hover:text-slate-800"}`}
              >
                {v === "grid" ? "⊞ Grid" : "≡ Table"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading team directory…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-slate-100">
            <FontAwesomeIcon icon={faUser} className="text-5xl text-slate-200" />
            <p className="text-base font-bold text-slate-400">No staff members found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(emp => (
              <EmployeeCard key={emp.id} emp={emp} user={user}  onClick={() => handleClick(emp)}  />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Employee","Role","Department","Email","Phone","Status",""].map((h, i) => (
                      <th key={i} className="text-left px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    
                    <EmployeeRow key={emp.id}  emp={emp} user={user} onClick={() => handleClick(emp)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
