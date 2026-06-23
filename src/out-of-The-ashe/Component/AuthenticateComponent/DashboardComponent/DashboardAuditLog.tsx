// =============================================================================
// Dashboard — Audit Log Widget
// Drop-in replacement for the inline audit log panel in DashboardBody.tsx
//
// Behavior:
//   COUNTRY_DIRECTOR → sees ALL users' logs (full system feed)
//   All other roles  → sees ONLY their own logs (server-enforced too)
// =============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserShield, faCircle, faArrowRight,
  faTriangleExclamation, faCheckCircle, faBolt,
  faUser, faLock,
} from '@fortawesome/free-solid-svg-icons';

import { useGetAuditLogsQuery } from '../../../Redux/auditLogSlice';
// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-emerald-400',
  UPDATE: 'text-blue-400',
  DELETE: 'text-rose-400',
  LOGIN:  'text-violet-400',
  LOGOUT: 'text-slate-400',
  VIEW:   'text-amber-400',
};

const ACTION_ICON: Record<string, any> = {
  CREATE: faCheckCircle,
  UPDATE: faBolt,
  DELETE: faTriangleExclamation,
  LOGIN:  faUser,
  LOGOUT: faLock,
};

const getColor = (action: string) => {
  const key = Object.keys(ACTION_COLOR).find(k => action.toUpperCase().includes(k));
  return key ? ACTION_COLOR[key] : 'text-slate-400';
};

const getIcon = (action: string) => {
  const key = Object.keys(ACTION_ICON).find(k => action.toUpperCase().includes(k));
  return key ? ACTION_ICON[key] : faBolt;
};

const fmtDateTime = (d: string) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
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

// =============================================================================
// COMPONENT
// =============================================================================
const DashboardAuditLog = ({ user }: Props) => {
  const isCD = user?.role === 'COUNTRY_DIRECTOR';

  // For non-CD roles, server already scopes to their own logs.
  // We pass no userId filter — scoping is 100% server-side.
  const { data=[], isLoading, isFetching } = useGetAuditLogsQuery(
    { page: 1, limit: 6 },
    { pollingInterval: 30_000 } // auto-refresh every 30 s
  );

  const logs = data?.data ?? [];

  return (
    <div className="bg-slate-900 max-h-[300px]  overflow-y-auto   rounded-xl p-6 text-white shadow-xl overflow-hidden relative h-full flex flex-col">
      {/* Ambient glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-primBtn/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-5 relative">
        <div className="w-7 h-7 bg-white/10 rounded-xl flex items-center justify-center text-xs shrink-0">
          <FontAwesomeIcon icon={faUserShield} className="text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm tracking-tight leading-none">
            {isCD ? 'Security Audit Log' : 'My Recent Activity'}
          </h3>
          {!isCD && (
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Your actions only</p>
          )}
        </div>

        {/* Live indicator */}
        <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isFetching ? 'animate-ping' : 'animate-pulse'}`} />
          LIVE
        </span>
      </div>

      {/* Log entries */}
      <div className="space-y-3.5 flex-1 relative">
        {isLoading ? (
          // Skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-0.5 bg-white/10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-white/10 rounded w-2/3" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-6">No recent activity.</p>
        ) : (
          logs.map((log: any, i: number) => (
            <div key={log.id ?? i} className="flex gap-3 group">
              {/* Timeline bar */}
              <div className="flex flex-col items-center shrink-0 pt-1">
                <FontAwesomeIcon
                  icon={getIcon(log.action)}
                  className={`text-[10px] ${getColor(log.action)}`}
                />
                {i < logs.length - 1 && (
                  <div className="w-px flex-1 bg-white/10 mt-1.5" />
                )}
              </div>

              <div className="min-w-0 pb-3">
                <p className="text-xs font-bold text-slate-200 leading-snug">
                  <span className={`${getColor(log.action)} font-black`}>
                    {log.action}
                  </span>
                  {' '}
                  <span className="text-slate-400">on</span>
                  {' '}
                  <span className="text-slate-300">{log.resource}</span>
                </p>

                <div className="flex items-center flex-wrap gap-x-2 mt-0.5">
                  {/* Show user info only for CD */}
                  {isCD && log.user && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {log.user.firstName} {log.user.lastName}
                      <span className="mx-1 text-slate-600">·</span>
                      <span className="text-primBtn/70 text-[9px] font-black uppercase">
                        {log.user.role?.replace(/_/g, ' ')}
                      </span>
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{timeAgo(log.createdAt)}</span>
                  <span className="text-[9px] text-slate-600">{fmtDateTime(log.createdAt)}</span>
                </div>

                {/* Child reference if present */}
                {log.child && (
                  <Link
                    to={`/ChildSingle/${log.child.id}`}
                    className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors font-medium"
                  >
                    #{log.child.childCode} · {log.child.firstName} {log.child.lastName}
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer link */}
      <Link
        to="/audit-logs"
        className="mt-4 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black tracking-wider uppercase text-center flex items-center justify-center gap-2 transition-all group"
      >
        {isCD ? 'Full System History' : 'My Full History'}
        <FontAwesomeIcon icon={faArrowRight} className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

export default DashboardAuditLog;