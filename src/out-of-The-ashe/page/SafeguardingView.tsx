import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faHandHoldingHeart, faExclamationCircle,
  faTriangleExclamation, faBolt, faUsers, faFileAlt,
  faRotateLeft, faSearch, faUserShield, faChild,
  faLock, faTrash, faPen, faUserTie, faShieldHalved,
  faNoteSticky, faClockRotateLeft, faCheckDouble,
  faPaperPlane, faTimes, faSpinner, faXmark,
  faCircleCheck, faCircleExclamation, faLink,
  faClipboardList, faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetSafeguardingCasesQuery,
  useUpdateSafeguardingCaseMutation,
  useCloseSafeguardingCaseMutation,
  useDeleteSafeguardingCaseMutation,
  useGrantSafeguardingAccessMutation,
} from '../Redux/safeguardingApi';
import { useGetEmployeesQuery } from '../Redux/Employee';
import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import { useSelector } from 'react-redux';

// ─── Constants ────────────────────────────────────────────────────────────────
const SG_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  OPEN:                { label: 'Open',               color: 'bg-rose-50 text-rose-600 border-rose-200',      icon: faExclamationCircle },
  UNDER_INVESTIGATION: { label: 'Under Investigation', color: 'bg-amber-50 text-amber-600 border-amber-200',   icon: faSearch },
  REFERRED:            { label: 'Referred',            color: 'bg-violet-50 text-violet-600 border-violet-200',icon: faPaperPlane },
  CLOSED:              { label: 'Closed',              color: 'bg-slate-50 text-slate-500 border-slate-200',   icon: faCheckDouble },
  REOPENED:            { label: 'Reopened',            color: 'bg-orange-50 text-orange-600 border-orange-200',icon: faRotateLeft },
};

const INCIDENT_META: Record<string, { label: string; color: string; icon: any }> = {
  ABUSE:           { label: 'Abuse',           color: 'bg-rose-50 text-rose-700',    icon: faHandHoldingHeart },
  NEGLECT:         { label: 'Neglect',         color: 'bg-amber-50 text-amber-700',  icon: faExclamationCircle },
  CHILD_LABOR:     { label: 'Child Labor',     color: 'bg-orange-50 text-orange-700',icon: faTriangleExclamation },
  SCHOOL_VIOLENCE: { label: 'School Violence', color: 'bg-red-50 text-red-700',      icon: faBolt },
  MISSING_CHILD:   { label: 'Missing Child',   color: 'bg-violet-50 text-violet-700',icon: faUsers },
  OTHER:           { label: 'Other',           color: 'bg-slate-50 text-slate-600',  icon: faFileAlt },
};

const STATUS_FLOW = ['OPEN', 'UNDER_INVESTIGATION', 'REFERRED', 'CLOSED'] as const;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ─── Toast Store ──────────────────────────────────────────────────────────────
type ToastType = 'loading' | 'success' | 'error';
interface Toast { id: string; type: ToastType; title: string; message?: string; }
type ToastListener = (t: Toast[]) => void;

let _toasts: Toast[] = [];
let _listeners: ToastListener[] = [];

const toastStore = {
  subscribe: (fn: ToastListener) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  },
  _emit: () => _listeners.forEach(fn => fn([..._toasts])),
  show: (type: ToastType, title: string, message?: string): string => {
    const id = Math.random().toString(36).slice(2);
    _toasts = [..._toasts, { id, type, title, message }];
    toastStore._emit();
    return id;
  },
  update: (id: string, type: ToastType, title: string, message?: string) => {
    _toasts = _toasts.map(t => t.id === id ? { ...t, type, title, message } : t);
    toastStore._emit();
    if (type !== 'loading') setTimeout(() => toastStore.dismiss(id), 3500);
  },
  dismiss: (id: string) => {
    _toasts = _toasts.filter(t => t.id !== id);
    toastStore._emit();
  },
};

const TOAST_CFG: Record<ToastType, { border: string; icon: any; iconColor: string }> = {
  loading: { border: 'border-slate-200',   icon: faSpinner,           iconColor: 'text-primBtn'     },
  success: { border: 'border-emerald-200', icon: faCircleCheck,       iconColor: 'text-emerald-500' },
  error:   { border: 'border-rose-200',    icon: faCircleExclamation, iconColor: 'text-rose-500'    },
};

const ToastItem = ({ toast }: { toast: Toast }) => {
  const cfg = TOAST_CFG[toast.type];
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg shadow-slate-900/8
        bg-white min-w-[280px] max-w-[360px] ${cfg.border}`}
      style={{ animation: 'sgSlideIn 0.22s cubic-bezier(.22,1,.36,1)' }}
    >
      <div className={`shrink-0 mt-0.5 text-base ${cfg.iconColor}`}>
        <FontAwesomeIcon icon={cfg.icon} className={toast.type === 'loading' ? 'animate-spin' : ''} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-800 leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      {toast.type !== 'loading' && (
        <button
          onClick={() => toastStore.dismiss(toast.id)}
          className="shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all"
        >
          <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
        </button>
      )}
    </div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    setToasts(_toasts);
    return toastStore.subscribe(setToasts);
  }, []);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
      <style>{`@keyframes sgSlideIn{from{opacity:0;transform:translateY(8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 pt-0.5">{label}</span>
    <span className="text-sm font-semibold text-slate-800 text-right">{value ?? '—'}</span>
  </div>
);

const SectionCard = ({ title, icon, children, action }: {
  title: string; icon: any; children: React.ReactNode; action?: React.ReactNode;
}) => (
  <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primBtn/10 text-primBtn flex items-center justify-center text-sm">
          <FontAwesomeIcon icon={icon} />
        </div>
        <h3 className="font-black text-slate-900 text-sm tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Status Stepper ───────────────────────────────────────────────────────────
const StatusStepper = ({ current }: { current: string }) => {
  const display = current === 'REOPENED' ? 'OPEN' : current;
  const idx = STATUS_FLOW.indexOf(display as any);
  return (
    <div className="flex items-center gap-0">
      {STATUS_FLOW.map((s, i) => {
        const meta   = SG_STATUS[s];
        const done   = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all
                  ${done   ? 'bg-emerald-500 text-white' :
                    active ? 'bg-primBtn text-white ring-4 ring-primBtn/20' :
                             'bg-slate-100 text-slate-400'}`}
              >
                <FontAwesomeIcon icon={done ? faCheckDouble : meta.icon} />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-wide text-center leading-tight max-w-[60px]
                  ${active ? 'text-primBtn' : done ? 'text-emerald-500' : 'text-slate-300'}`}
              >
                {meta.label}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 mb-5 rounded-full transition-all
                  ${i < idx ? 'bg-emerald-400' : 'bg-slate-100'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Case Status Options ──────────────────────────────────────────────────────
const CASE_STATUS_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: 'OPEN',                label: 'Open',               dot: 'bg-rose-400'   },
  { value: 'UNDER_INVESTIGATION', label: 'Under Investigation', dot: 'bg-amber-400'  },
  { value: 'REFERRED',            label: 'Referred',            dot: 'bg-violet-400' },
  { value: 'CLOSED',              label: 'Closed',              dot: 'bg-slate-400'  },
  { value: 'REOPENED',            label: 'Reopened',            dot: 'bg-orange-400' },
];

// ─── Edit Modal ───────────────────────────────────────────────────────────────
// FIX: Removed misplaced <DashbordNav /> from inside this modal
const EditModal = ({ sg, onClose, onSave, isSaving }: {
  sg: any; onClose: () => void; onSave: (form: any) => void; isSaving: boolean;
}) => {
  const [form, setForm] = useState({
    status:           sg.status           ?? 'OPEN',
    incidentType:     sg.incidentType     ?? 'OTHER',
    incidentDate:     sg.incidentDate     ? new Date(sg.incidentDate).toISOString().slice(0, 10) : '',
    description:      sg.description      ?? '',
    actionPlan:       sg.actionPlan       ?? '',
    followUpNotes:    sg.followUpNotes    ?? '',
    externalReferral: sg.externalReferral ?? '',
  });

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const inputCls =
    'w-full border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primBtn bg-slate-50 resize-none';

  const selectedStatusMeta = CASE_STATUS_OPTIONS.find(o => o.value === form.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      {/* FIX: <DashbordNav /> removed from here — it does not belong inside a modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-black text-slate-900 text-lg tracking-tight">Update Case</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Current status:&nbsp;
              <span className={`font-black ${SG_STATUS[sg.status]?.color.split(' ')[1] ?? 'text-slate-500'}`}>
                {SG_STATUS[sg.status]?.label ?? sg.status}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-all disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-7 space-y-4 overflow-y-auto flex-1">

          {/* Case Status */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Case Status
            </label>
            <div className="relative">
              <select
                value={form.status}
                onChange={set('status')}
                className={`${inputCls} appearance-none pr-10 font-semibold`}
              >
                {CASE_STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1.5">
                {selectedStatusMeta && (
                  <span className={`w-2 h-2 rounded-full ${selectedStatusMeta.dot}`} />
                )}
                <FontAwesomeIcon icon={faChevronDown} className="text-slate-400 text-[10px]" />
              </div>
            </div>
          </div>

          {/* Incident Type */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Incident Type
            </label>
            <select value={form.incidentType} onChange={set('incidentType')} className={`${inputCls} font-semibold`}>
              {Object.entries(INCIDENT_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Incident Date */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Incident Date
            </label>
            <input type="date" value={form.incidentDate} onChange={set('incidentDate')} className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea value={form.description} onChange={set('description')} rows={3} className={inputCls} />
            {form.description.length > 0 && form.description.length < 10 && (
              <p className="text-[10px] text-rose-400 font-bold mt-1">Minimum 10 characters</p>
            )}
          </div>

          {/* Action Plan */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Action Plan
            </label>
            <textarea value={form.actionPlan} onChange={set('actionPlan')} rows={2} className={inputCls} />
          </div>

          {/* Follow-up Notes */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              Follow-up Notes
            </label>
            <textarea value={form.followUpNotes} onChange={set('followUpNotes')} rows={2} className={inputCls} />
          </div>

          {/* External Referral */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              External Referral
            </label>
            <input
              type="text"
              value={form.externalReferral}
              onChange={set('externalReferral')}
              placeholder="e.g. Referred to UNICEF / Police"
              className={inputCls}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 flex gap-3 justify-end shrink-0 border-t border-slate-50 pt-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:border-slate-400 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const payload: any = { ...form };
              if (form.incidentDate) payload.incidentDate = new Date(form.incidentDate).toISOString();
              onSave(payload);
            }}
            disabled={isSaving || (form.description.length > 0 && form.description.length < 10)}
            className="px-6 py-2.5 bg-primBtn text-white rounded-2xl text-sm font-bold hover:bg-Hover transition-all shadow-sm shadow-primBtn/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Grant Access Modal ───────────────────────────────────────────────────────
const GrantAccessModal = ({ onClose, onGrant, existingViewerUserIds, isGranting }: {
  onClose: () => void;
  onGrant: (userIds: string[]) => void;
  existingViewerUserIds: string[];
  isGranting: boolean;
}) => {
  const { data: empData, isLoading } = useGetEmployeesQuery(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const employees: any[] = useMemo(() => {
    const list: any[] = empData?.data ?? [];
    return list.filter((e: any) =>
      e.role !== 'COUNTRY_DIRECTOR' &&
      !existingViewerUserIds.includes(e.id)
    );
  }, [empData, existingViewerUserIds]);

  const toggle = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === employees.length ? [] : employees.map((e: any) => e.id));

  const allSelected  = employees.length > 0 && selectedIds.length === employees.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faUserShield} />
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight text-sm">Grant Case Access</h2>
              <p className="text-[10px] text-violet-500 font-bold mt-0.5">Country Directors always have access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGranting}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-all disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Select All */}
        {!isLoading && employees.length > 0 && (
          <div className="px-7 py-3 border-b border-slate-50 bg-slate-50/60 shrink-0">
            <div onClick={toggleAll} className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                  ${allSelected   ? 'bg-violet-600 border-violet-600' :
                    someSelected  ? 'bg-violet-200 border-violet-400' :
                                    'bg-white border-slate-300 hover:border-violet-400'}`}
              >
                {allSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {someSelected && !allSelected && <div className="w-2 h-0.5 bg-violet-600 rounded-full" />}
              </div>
              <span className="text-xs font-bold text-slate-600">
                {allSelected ? 'Deselect all' : 'Select all'} staff
              </span>
              {selectedIds.length > 0 && (
                <span className="ml-auto text-[10px] font-black px-2 py-0.5 bg-violet-100 text-violet-700 rounded-lg">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <div className="w-5 h-5 border-2 border-primBtn border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Loading staff…</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center px-7">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300 text-xl">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <p className="text-xs text-slate-400 font-bold">All eligible staff already have access</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {employees.map((emp: any) => {
                const checked = selectedIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggle(emp.id)}
                    className={`flex items-center gap-4 px-7 py-3.5 cursor-pointer transition-colors select-none
                      ${checked ? 'bg-violet-50/60' : 'hover:bg-slate-50'}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                        ${checked ? 'bg-violet-600 border-violet-600' : 'bg-white border-slate-300 hover:border-violet-400'}`}
                    >
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {emp.avatarUrl ? (
                      <img
                        src={`http://localhost:5000${emp.avatarUrl}`}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-100 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0
                          ${checked ? 'bg-violet-200 text-violet-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${checked ? 'text-violet-900' : 'text-slate-800'}`}>
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium capitalize truncate">
                        {emp.role?.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-slate-100 flex gap-3 justify-end shrink-0 bg-white">
          <button
            onClick={onClose}
            disabled={isGranting}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:border-slate-400 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            disabled={selectedIds.length === 0 || isGranting}
            onClick={() => onGrant(selectedIds)}
            className="px-6 py-2.5 bg-violet-600 text-white rounded-2xl text-sm font-bold hover:bg-violet-700 transition-all shadow-sm shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGranting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> Granting…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUserShield} /> Grant Access
                {selectedIds.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-lg text-xs">{selectedIds.length}</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ icon, iconBg, title, body, confirmLabel, confirmCls, onCancel, onConfirm, isLoading }: {
  icon: any; iconBg: string; title: string; body: string;
  confirmLabel: string; confirmCls: string;
  onCancel: () => void; onConfirm: () => void; isLoading: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 space-y-4">
      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center text-xl mx-auto`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <h2 className="font-black text-slate-900 text-center">{title}</h2>
      <p className="text-xs text-slate-500 text-center">{body}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:border-slate-400 transition-all disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-2.5 text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${confirmCls}`}
        >
          {isLoading && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
          {isLoading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const SafeguardingView = () => {
  const { id }   = useParams<{ id: string }>();
  const { user } = useSelector((state: any) => state.auth);

  const { data: response, isLoading } = useGetSafeguardingCasesQuery(undefined);
  const caseList: any[] = response?.data ?? [];
  const sg = Array.isArray(caseList) ? caseList.find((c: any) => c.id === id) : null;

  // ── FIX: use?.role consistently — original code had bare `role` which crashes ──
  const isCountryDirector = user?.role === 'COUNTRY_DIRECTOR';

  // FIX: canEditAndClose was defined but never used to gate buttons; now it is.
  // Added COUNTRY_DIRECTOR — they should be able to edit/close too.
  const canEditAndClose =
    isCountryDirector ||
    user?.role === 'ADMIN' ||
    user?.role === 'SOCIAL_WORKER' ||
    user?.role === 'PSYCHOSOCIAL_OFFICER' ||
    user?.role === 'PROGRAM_MANAGER';

  // FIX: canDelete was defined but never used to gate the Delete button; now it is.
  const canDelete = user?.role === 'ADMIN';

  const [updateCase, { isLoading: isUpdating }] = useUpdateSafeguardingCaseMutation();
  const [closeCase,  { isLoading: isClosing }]  = useCloseSafeguardingCaseMutation();
  const [deleteCase, { isLoading: isDeleting }] = useDeleteSafeguardingCaseMutation();
  const [grantAccess,{ isLoading: isGranting }] = useGrantSafeguardingAccessMutation();

  const [editOpen,      setEditOpen]      = useState(false);
  const [grantOpen,     setGrantOpen]     = useState(false);
  const [confirmClose,  setConfirmClose]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const existingViewerUserIds: string[] = useMemo(
    () => (sg?.authorizedViewers ?? []).map((v: any) => v.userId),
    [sg]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = async (form: any) => {
    const tid = toastStore.show('loading', 'Saving changes…', 'Updating case details');
    try {
      await updateCase({ id, ...form }).unwrap();
      toastStore.update(tid, 'success', 'Case updated', 'All changes have been saved.');
      setEditOpen(false);
    } catch (err: any) {
      toastStore.update(tid, 'error', 'Update failed', err?.data?.message ?? 'Could not save. Please try again.');
    }
  };

  const handleClose = async () => {
    const tid = toastStore.show('loading', 'Closing case…', 'Marking the case as resolved');
    try {
      await closeCase(id).unwrap();
      toastStore.update(tid, 'success', 'Case closed', 'The case has been marked as closed.');
      setConfirmClose(false);
    } catch (err: any) {
      toastStore.update(tid, 'error', 'Close failed', err?.data?.message ?? 'Could not close the case.');
    }
  };

  const handleDelete = async () => {
    const tid = toastStore.show('loading', 'Deleting case…', 'This cannot be undone');
    try {
      await deleteCase(id).unwrap();
      toastStore.update(tid, 'success', 'Case deleted', 'The record has been permanently removed.');
      setTimeout(() => window.history.back(), 1200);
    } catch (err: any) {
      toastStore.update(tid, 'error', 'Delete failed', err?.data?.message ?? 'Could not delete. Please try again.');
      setConfirmDelete(false);
    }
  };

  const handleGrant = async (userIds: string[]) => {
    const n = userIds.length;
    const tid = toastStore.show('loading', `Granting access to ${n} staff member${n > 1 ? 's' : ''}…`);
    try {
      await Promise.all(userIds.map(userId => grantAccess({ id, userId }).unwrap()));
      toastStore.update(tid, 'success', 'Access granted',
        `${n} ${n === 1 ? 'person has' : 'people have'} been given case access.`);
      setGrantOpen(false);
    } catch (err: any) {
      toastStore.update(tid, 'error', 'Grant failed', err?.data?.message ?? 'Failed to grant access.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-primBtn border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-400">Loading case…</p>
      </div>
    </div>
  );

  if (!sg) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-2xl text-slate-300">
          <FontAwesomeIcon icon={faShieldHalved} />
        </div>
        <p className="font-black text-slate-400">Case not found</p>
        <Link to="/DashboardPage" className="text-sm text-primBtn font-bold hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const statusMeta   = SG_STATUS[sg.status]           ?? SG_STATUS.OPEN;
  const incidentMeta = INCIDENT_META[sg.incidentType] ?? INCIDENT_META.OTHER;
  const isClosed     = sg.status === 'CLOSED';

  return (
    <>
      <ToastContainer />

      {/* FIX: EditModal no longer contains <DashbordNav /> */}
      {editOpen && canEditAndClose && (
        <EditModal
          sg={sg}
          onClose={() => !isUpdating && setEditOpen(false)}
          onSave={handleSave}
          isSaving={isUpdating}
        />
      )}

      {grantOpen && isCountryDirector && (
        <GrantAccessModal
          onClose={() => !isGranting && setGrantOpen(false)}
          onGrant={handleGrant}
          existingViewerUserIds={existingViewerUserIds}
          isGranting={isGranting}
        />
      )}

      {confirmClose && canEditAndClose && (
        <ConfirmDialog
          icon={faLock} iconBg="bg-amber-50 text-amber-500"
          title="Close this case?"
          body="This will mark the case as closed. You can reopen it later if needed."
          confirmLabel="Close Case" confirmCls="bg-amber-500 hover:bg-amber-600"
          onCancel={() => setConfirmClose(false)}
          onConfirm={handleClose}
          isLoading={isClosing}
        />
      )}

      {confirmDelete && canDelete && (
        <ConfirmDialog
          icon={faTrash} iconBg="bg-rose-50 text-rose-500"
          title="Delete this case?"
          body="This is permanent and cannot be undone. All related access records will also be removed."
          confirmLabel="Delete" confirmCls="bg-rose-500 hover:bg-rose-600"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      )}

      {/* ══ PAGE ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 text-slate-900 antialiased">
        <DashbordNav />

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="bg-white mt-30 border border-slate-100 rounded-3xl px-7 py-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link
              to="/DashboardPage"
              className="w-10 h-10 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primBtn hover:border-primBtn transition-all shrink-0"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Safeguarding Case</h1>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${statusMeta.color}`}>
                  <FontAwesomeIcon icon={statusMeta.icon} className="mr-1.5" />
                  {statusMeta.label}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${incidentMeta.color}`}>
                  <FontAwesomeIcon icon={incidentMeta.icon} className="mr-1.5" />
                  {incidentMeta.label}
                </span>
              </div>
              <p className="text-slate-400 font-medium text-xs">
                Case ID: <span className="font-mono text-slate-500">{sg.id}</span>
                <span className="mx-2">·</span>
                Incident {fmtDate(sg.incidentDate)}
              </p>
            </div>
          </div>

          {/* FIX: All buttons now gated by the correct permission flags */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {canEditAndClose && (
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primBtn text-white rounded-2xl text-xs font-bold hover:bg-Hover transition-all shadow-sm shadow-primBtn/20"
              >
                <FontAwesomeIcon icon={faPen} /> Edit Case
              </button>
            )}

            {canEditAndClose && !isClosed && (
              <button
                onClick={() => setConfirmClose(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl text-xs font-bold hover:bg-amber-100 transition-all"
              >
                <FontAwesomeIcon icon={faLock} /> Close Case
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-500 border border-rose-200 rounded-2xl text-xs font-bold hover:bg-rose-100 transition-all"
              >
                <FontAwesomeIcon icon={faTrash} /> Delete
              </button>
            )}
          </div>
        </header>

        {/* ── STATUS STEPPER ──────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm px-8 py-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Case Progress</p>
          <StatusStepper current={sg.status} />
          {sg.status === 'REOPENED' && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-2xl w-fit">
              <FontAwesomeIcon icon={faRotateLeft} className="text-orange-500 text-xs" />
              <span className="text-[10px] font-black text-orange-600">
                This case was reopened — currently back under investigation
              </span>
            </div>
          )}
        </div>

        {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT — 7 cols */}
          <div className="lg:col-span-7 space-y-6">

            <SectionCard title="Incident Details" icon={faShieldHalved}>
              <InfoRow label="Incident Type" value={
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${incidentMeta.color}`}>
                  <FontAwesomeIcon icon={incidentMeta.icon} className="mr-1.5" />
                  {incidentMeta.label}
                </span>
              } />
              <InfoRow label="Incident Date" value={fmtDate(sg.incidentDate)} />
              <InfoRow label="Reported By"   value={sg.reportedBy ? `${sg.reportedBy.firstName} ${sg.reportedBy.lastName}` : null} />
              <InfoRow label="Reporter Role" value={sg.reportedBy?.role?.replace(/_/g, ' ')} />
              <InfoRow label="Date Logged"   value={fmtDateTime(sg.createdAt)} />
              <InfoRow label="Last Updated"  value={fmtDateTime(sg.updatedAt)} />
              {sg.closedBy && (
                <InfoRow label="Closed By" value={`${sg.closedBy.firstName} ${sg.closedBy.lastName}`} />
              )}
            </SectionCard>

            <SectionCard title="Description" icon={faFileAlt}>
              {sg.description
                ? <p className="text-sm text-slate-700 leading-relaxed font-medium">{sg.description}</p>
                : <p className="text-sm text-slate-400 italic">No description recorded.</p>}
            </SectionCard>

            <SectionCard title="Action Plan" icon={faClipboardList}>
              {sg.actionPlan
                ? <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">{sg.actionPlan}</p>
                : <p className="text-sm text-slate-400 italic">No action plan recorded yet.</p>}
            </SectionCard>

            <SectionCard title="Follow-up Notes" icon={faNoteSticky}>
              {sg.followUpNotes
                ? <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">{sg.followUpNotes}</p>
                : <p className="text-sm text-slate-400 italic">No follow-up notes.</p>}
            </SectionCard>

            {sg.externalReferral && (
              <SectionCard title="External Referral" icon={faLink}>
                <p className="text-sm text-slate-700 font-medium">{sg.externalReferral}</p>
              </SectionCard>
            )}
          </div>

          {/* RIGHT — 5 cols */}
          <div className="lg:col-span-5 space-y-6">

            {/* Child */}
            <SectionCard
              title="Child"
              icon={faChild}
              action={sg.child?.id && (
                <Link to={`/ChildSingle/${sg.child.id}`} className="text-[10px] font-black text-primBtn hover:underline">
                  View Profile →
                </Link>
              )}
            >
              {sg.child ? (
                <div className="flex items-center gap-4">
                  {sg.child.photos?.[0] ? (
                    <img
                      src={`http://localhost:5000${sg.child.photos[0].url}`}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primBtn/10 text-primBtn flex items-center justify-center text-xl shrink-0">
                      <FontAwesomeIcon icon={faChild} />
                    </div>
                  )}
                  <div>
                    <p className="font-black text-slate-900 text-base leading-tight">
                      {sg.child.firstName} {sg.child.lastName}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">#{sg.child.childCode}</p>
                    {sg.child.status && (
                      <span className="mt-1.5 inline-block text-[9px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
                        {sg.child.status}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Child not linked.</p>
              )}
            </SectionCard>

            {/* Reported By */}
            <SectionCard title="Reported By" icon={faUserTie}>
              {sg.reportedBy ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primBtn/10 text-primBtn flex items-center justify-center text-sm font-bold shrink-0">
                    {sg.reportedBy.firstName?.[0]}{sg.reportedBy.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 leading-tight">
                      {sg.reportedBy.firstName} {sg.reportedBy.lastName}
                    </p>
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-primBtn/10 text-primBtn rounded-lg">
                      {sg.reportedBy.role?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Reporter not found.</p>
              )}
            </SectionCard>

            {/* Case Access */}
            <SectionCard
              title="Case Access"
              icon={faUserShield}
              action={isCountryDirector ? (
                <button
                  onClick={() => setGrantOpen(true)}
                  className="text-[10px] font-black text-violet-600 hover:text-violet-800 hover:underline transition-colors"
                >
                  + Grant Access
                </button>
              ) : null}
            >
              <div className="space-y-2">
                {/* Country Director — always implicit */}
                <div className="flex items-center gap-3 py-2 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-xs shrink-0">
                    <FontAwesomeIcon icon={faShieldHalved} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Country Director</p>
                    <p className="text-[9px] text-violet-500 font-bold">Default access · All cases</p>
                  </div>
                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded-lg border border-violet-100 shrink-0">
                    DEFAULT
                  </span>
                </div>

                {(sg.authorizedViewers ?? []).length > 0 ? (
                  (sg.authorizedViewers as any[]).map((v: any) => (
                    <div key={v.userId} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                        <FontAwesomeIcon icon={faUserShield} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 font-mono truncate">{v.userId}</p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          Granted {fmtDate(v.grantedAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic pt-1">
                    No additional staff have been granted access.
                  </p>
                )}
              </div>

              {!isCountryDirector && (
                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <FontAwesomeIcon icon={faLock} className="text-slate-300 text-xs mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Only a Country Director can grant or manage case access.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Timeline */}
            <SectionCard title="Timeline" icon={faClockRotateLeft}>
              <div className="space-y-4">
                {([
                  { label: 'Case Created', date: sg.createdAt, color: 'bg-primBtn'     },
                  { label: 'Last Updated', date: sg.updatedAt, color: 'bg-slate-300'   },
                  sg.closedAt ? { label: 'Case Closed', date: sg.closedAt, color: 'bg-emerald-400' } : null,
                ] as any[]).filter(Boolean).map((item: any, i: number, arr: any[]) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-0.5`} />
                      {i < arr.length - 1 && <div className="w-0.5 h-6 bg-slate-100 rounded-full" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{fmtDateTime(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </>
  );
};

export default SafeguardingView;