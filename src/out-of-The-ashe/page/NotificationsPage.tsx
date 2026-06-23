import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell, faCheckDouble, faTrash, faFilter,
  faShieldHalved, faMoneyBillWave, faHouseChimneyUser,
  faGraduationCap, faTriangleExclamation, faCircleInfo,
  faBullhorn, faClipboardList, faCalendarCheck, faClock,
  faCalendarDay, faXmark, faInbox
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '../Redux/Notification';
import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'SAFEGUARDING_ALERT', label: 'Safeguarding' },
  { value: 'FINANCIAL_APPROVAL_REQUEST', label: 'Financial' },
  { value: 'HOME_VISIT_DUE', label: 'Home Visit' },
  { value: 'ACADEMIC_ALERT', label: 'Academic' },
  { value: 'SYSTEM_ANNOUNCEMENT', label: 'Announcements' },
  // FIX: these five types are actually created by the backend
  // (notifyOnVisitCreated / notifyAppointmentAssigned / processNightlyReminders)
  // but were missing from the filter entirely.
  { value: 'NEW_VISIT_LOGGED', label: 'Visit Logged' },
  { value: 'NEW_APPOINTMENT_ASSIGNED', label: 'Appointment Assigned' },
  { value: 'UPCOMING_REMINDER', label: 'Upcoming Reminder' },
  { value: 'TODAY_VISIT_ALERT', label: "Today's Visit" },
  { value: 'EMERGENCY_ALERT', label: 'Emergency' },
  { value: 'DATA_CREATE', label: 'Created' },
  { value: 'DATA_UPDATE', label: 'Updated' },
  { value: 'DATA_DELETE', label: 'Deleted' },
  { value: 'SECURITY_WARNING', label: 'Security' },
];

const TYPE_LABELS: Record<string, string> = TYPE_OPTIONS.reduce(
  (acc, opt) => (opt.value ? { ...acc, [opt.value]: opt.label } : acc),
  {}
);

// FIX: aligned with DashbordNav's getNotifMeta so the same notification type
// always shows the same icon everywhere in the app (safeguarding no longer
// shares an icon with security warnings).
const getNotifMeta = (type: string) => {
  switch (type) {
    case 'SAFEGUARDING_ALERT':
      return { icon: faShieldHalved, color: 'text-rose-500', bg: 'bg-rose-50' };
    case 'FINANCIAL_APPROVAL_REQUEST':
      return { icon: faMoneyBillWave, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'HOME_VISIT_DUE':
      return { icon: faHouseChimneyUser, color: 'text-amber-500', bg: 'bg-amber-50' };
    case 'ACADEMIC_ALERT':
      return { icon: faGraduationCap, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'SYSTEM_ANNOUNCEMENT':
      return { icon: faBullhorn, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    case 'NEW_VISIT_LOGGED':
      return { icon: faClipboardList, color: 'text-sky-500', bg: 'bg-sky-50' };
    case 'NEW_APPOINTMENT_ASSIGNED':
      return { icon: faCalendarCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    case 'UPCOMING_REMINDER':
      return { icon: faClock, color: 'text-amber-500', bg: 'bg-amber-50' };
    case 'TODAY_VISIT_ALERT':
      return { icon: faCalendarDay, color: 'text-orange-500', bg: 'bg-orange-50' };
    case 'EMERGENCY_ALERT':
      return { icon: faTriangleExclamation, color: 'text-red-600', bg: 'bg-red-50' };
    case 'SECURITY_WARNING':
      return { icon: faTriangleExclamation, color: 'text-red-600', bg: 'bg-red-50' };
    case 'DATA_CREATE':
    case 'DATA_UPDATE':
    case 'DATA_DELETE':
      return { icon: faCircleInfo, color: 'text-violet-500', bg: 'bg-violet-50' };
    default:
      return { icon: faCircleInfo, color: 'text-slate-500', bg: 'bg-slate-50' };
  }
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'text-rose-600 bg-rose-50',
  HIGH: 'text-amber-600 bg-amber-50',
};

const timeAgo = (date: string) => {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const SkeletonRow = () => (
  <div className="flex items-start gap-4 p-4 md:p-5 animate-pulse">
    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2 pt-1">
      <div className="h-3 w-1/3 bg-slate-100 rounded-full" />
      <div className="h-3 w-2/3 bg-slate-100 rounded-full" />
      <div className="h-2.5 w-16 bg-slate-100 rounded-full mt-2" />
    </div>
  </div>
);

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);

  // FIX: `type` is now sent to the server alongside `isRead`, instead of being
  // applied client-side after the server already paginated the response.
  // Previously, filtering by type against a paginated list produced a
  // mismatched count and broken pagination (e.g. "Page 1 of 3" while only
  // 2 items matching the filter were ever shown).
  const { data: response, isFetching, isLoading } = useGetMyNotificationsQuery({
    page,
    ...(filterRead !== 'all' && { isRead: filterRead === 'read' }),
    ...(filterType && { type: filterType }),
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = response?.data ?? [];
  const total = response?.total ?? 0;
  const limit = response?.limit ?? 20;
  const totalPages = response?.totalPages || 1;
  const unreadCount = response?.unreadCount ?? 0;

  const hasActiveFilters = filterType !== '' || filterRead !== 'all';
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  const resetFilters = () => {
    setFilterType('');
    setFilterRead('all');
    setPage(1);
  };

  const emptyMessage = (() => {
    if (filterRead === 'unread') return "You're all caught up — no unread notifications.";
    if (filterType) return `No ${TYPE_LABELS[filterType]?.toLowerCase() ?? ''} notifications match this filter.`;
    if (filterRead === 'read') return "Nothing's been marked as read yet.";
    return "Nothing here yet — we'll let you know the moment something needs your attention.";
  })();

  const handleNotifClick = (notif: any) => {
    if (!notif.isRead) markAsRead(notif.id);

    switch (notif.entityType) {
      case 'SAFEGUARDING_CASE': navigate(`/SafeguardingCase/${notif.relatedId}`); break;
      case 'FINANCIAL_SUPPORT': navigate(`/FinancialSupport/${notif.relatedId}`); break;
      case 'HOME_VISIT': navigate(`/HomeVisit/${notif.relatedId}`); break;
      case 'ACADEMIC_RECORD': navigate(`/AcademicRecord/${notif.relatedId}`); break;
      case 'CHILD': navigate(`/ChildSingle/${notif.relatedId}`); break;
      case 'APPOINTMENT': navigate(`/HomeVisit/${notif.relatedId}`); break;
      default: break;
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <div className="pt-28 px-4 md:px-8 pb-12 max-w-4xl mx-auto">
      <DashbordNav />

      {/* Header */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primBtn/10 via-primBtn/5 to-transparent border border-slate-100 p-5 md:p-6 mb-6">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primBtn/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primBtn text-white flex items-center justify-center shadow-lg shadow-primBtn/20">
              <FontAwesomeIcon icon={faBell} size="lg" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">Notifications</h1>
              <p className="text-xs font-bold text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread of ${total}`
                  : total > 0 ? `${total} total · all caught up` : 'No notifications yet'}
              </p>
            </div>
          </div>

          <button
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll || unreadCount === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-primBtn text-white text-xs font-bold shadow-lg shadow-primBtn/20 disabled:opacity-40 disabled:shadow-none transition-all hover:bg-Hover"
          >
            <FontAwesomeIcon icon={faCheckDouble} /> Mark all as read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 flex-1">
          <FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs flex-shrink-0" />
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="flex-1 outline-none text-sm font-bold text-slate-700 bg-transparent"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex bg-white border border-slate-100 rounded-2xl p-1">
          {(['all', 'unread', 'read'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setFilterRead(tab); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all
              ${filterRead === tab ? 'bg-primBtn text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Result count / reset */}
      <div className="flex items-center justify-between mb-4 px-1 min-h-[20px]">
        <p className="text-[11px] font-bold text-slate-400">
          {total > 0 && !isLoading ? `Showing ${rangeStart}–${rangeEnd} of ${total}` : ''}
        </p>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-primBtn hover:text-Hover"
          >
            <FontAwesomeIcon icon={faXmark} className="text-[10px]" /> Clear filters
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faInbox} className="text-2xl" />
            </div>
            <p className="text-sm font-bold text-slate-500">{emptyMessage}</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 text-xs font-bold text-primBtn hover:text-Hover"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={`divide-y divide-slate-50 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
            {notifications?.map((notif: any) => {
              const meta = getNotifMeta(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex items-start gap-4 p-4 md:p-5 cursor-pointer transition-all group
                  ${!notif.isRead ? 'bg-blue-50/40 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-11 h-11 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                    <FontAwesomeIcon icon={meta.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-sm text-slate-800">{notif.title}</p>
                      {!notif.isRead && <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{notif.message}</p>
                    <div className="flex items-center flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] font-bold text-slate-400">{timeAgo(notif.createdAt)}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                        {TYPE_LABELS[notif.type] ?? notif.type}
                      </span>
                      {PRIORITY_BADGE[notif.priority] && (
                        <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md ${PRIORITY_BADGE[notif.priority]}`}>
                          {notif.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* FIX: was opacity-0 + group-hover only, which never triggers on
                      touch devices — the delete button was effectively impossible
                      to use on mobile. Now visible at low opacity always, full
                      opacity on hover/focus. */}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    aria-label="Delete notification"
                    className="opacity-40 sm:opacity-0 sm:group-hover:opacity-100 w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex-shrink-0"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;