import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  faShield, faPlus, faTriangleExclamation, faLock, faTimes,
  faCalendarAlt, faUserShield, faCheckCircle, faFileText, faUserPlus,
  faSpinner, faPencilAlt, faTrash, faChevronRight, faInfoCircle,
  faExclamationTriangle, faUser, faUserMinus, faCheckDouble,
  faTimesCircle, faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TabShell, EmptyState } from "./TabShell";
import { useSelector } from "react-redux";
import {
  useGetSafeguardingCasesQuery,
  useCreateSafeguardingCaseMutation,
  useUpdateSafeguardingCaseMutation,
  useCloseSafeguardingCaseMutation,
  useDeleteSafeguardingCaseMutation,
  useGrantSafeguardingAccessMutation,
  useRevokeSafeguardingAccessMutation,
} from "../../../../Redux/safeguardingApi";
import { useGetEmployeesQuery } from "../../../../Redux/Employee";

// ── Constants ─────────────────────────────────────────────────────────────────
const INCIDENT_STYLES = {
  ABUSE:           { label: "Abuse",           color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500"    },
  NEGLECT:         { label: "Neglect",         color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  CHILD_LABOR:     { label: "Child Labour",    color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500"  },
  SCHOOL_VIOLENCE: { label: "School Violence", color: "bg-rose-50 text-rose-700 border-rose-200",       dot: "bg-rose-500"   },
  MISSING_CHILD:   { label: "Missing Child",   color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  OTHER:           { label: "Other",           color: "bg-slate-100 text-slate-600 border-slate-200",   dot: "bg-slate-400"  },
};

const STATUS_STYLES = {
  OPEN:                { label: "Open",                color: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400"   },
  UNDER_INVESTIGATION: { label: "Under Investigation", color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500"    },
  REFERRED:            { label: "Referred",            color: "bg-violet-50 text-violet-700 border-violet-200",    dot: "bg-violet-500"  },
  CLOSED:              { label: "Closed",              color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  REOPENED:            { label: "Reopened",            color: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500"    },
};

const ALL_STATUSES       = ["OPEN", "UNDER_INVESTIGATION", "REFERRED", "CLOSED", "REOPENED"];
const COUNTRY_DIRECTOR_ROLE = "COUNTRY_DIRECTOR";
const MANAGEMENT_ROLES      = ["PROGRAM_MANAGER", "COUNTRY_DIRECTOR", "ADMIN"];
const AUTHORIZED_ROLES      = ["SOCIAL_WORKER","PSYCHOSOCIAL_OFFICER", ...MANAGEMENT_ROLES];

const inputCls =
  "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition text-sm text-slate-800 bg-white";

// ── Toast System ──────────────────────────────────────────────────────────────
const TOAST_TYPES = {
  success: { icon: faCheckDouble,       bg: "bg-emerald-600", border: "border-emerald-700" },
  error:   { icon: faTimesCircle,       bg: "bg-rose-600",    border: "border-rose-700"    },
  info:    { icon: faInfoCircle,        bg: "bg-sky-600",     border: "border-sky-700"     },
  warning: { icon: faExclamationCircle, bg: "bg-amber-500",   border: "border-amber-600"   },
};

let _toastId = 0;
let _setToastsGlobal = null;

export const toast = {
  show: (message, type = "info", duration = 3500) => {
    if (!_setToastsGlobal) return;
    const id = ++_toastId;
    _setToastsGlobal((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      _setToastsGlobal((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  },
  success: (msg) => toast.show(msg, "success"),
  error:   (msg) => toast.show(msg, "error"),
  info:    (msg) => toast.show(msg, "info"),
  warning: (msg) => toast.show(msg, "warning"),
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  _setToastsGlobal = setToasts;
  const dismiss = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => {
        const cfg = TOAST_TYPES[t.type] || TOAST_TYPES.info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${cfg.bg} ${cfg.border} text-white max-w-xs`}
            style={{ animation: "slideUpFade 0.22s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <FontAwesomeIcon icon={cfg.icon} className="text-sm shrink-0 opacity-90" />
            <p className="text-xs font-bold leading-snug flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
              <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const canViewCase = (caseItem, userId, isManagement) => {
  if (isManagement) return true;
  if (caseItem.reportedById === userId) return true;
  return (caseItem.authorizedViewers || []).some((v) => v.userId === userId);
};

// ── DeleteConfirmationModal ───────────────────────────────────────────────────
const DeleteConfirmationModal = ({
  isOpen, onClose, onConfirm, title, message, isDeleting,
  confirmLabel = "Yes, Delete",
  confirmCls = "bg-rose-600 hover:bg-rose-700",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 scale-up-center text-center">
        <div className="mx-auto w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg" />
        </div>
        <h4 className="text-base font-black text-slate-900 mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className={`flex-1 py-2.5 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 ${confirmCls}`}
          >
            {isDeleting
              ? <><FontAwesomeIcon icon={faSpinner} spin /> Working…</>
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── DetailRow ─────────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value, badge, badgeColor }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
      <FontAwesomeIcon icon={icon} className="text-slate-400 text-[10px]" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">{label}</p>
      {badge
        ? <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>{value}</span>
        : value
          ? <p className="text-sm font-semibold text-slate-800 leading-normal">{value}</p>
          : <p className="text-sm italic text-slate-300 font-normal">Not recorded</p>}
    </div>
  </div>
);

// ── DescBlock ─────────────────────────────────────────────────────────────────
const DescBlock = ({ icon, label, bg, iconColor, children }) => (
  <div className={`${bg} rounded-2xl p-4 border flex flex-col gap-2`}>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-white/70 border border-white flex items-center justify-center shrink-0">
        <FontAwesomeIcon icon={icon} className={`${iconColor} text-[10px]`} />
      </div>
      <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">{label}</p>
    </div>
    {children}
  </div>
);

// ── GrantRevokeModal ──────────────────────────────────────────────────────────
const GrantRevokeModal = ({ onClose, onGrant, onRevoke, existingViewers, allEmployees, isGranting, isRevoking }) => {
  const [tab, setTab] = useState("grant");
  const existingViewerUserIds = existingViewers.map((v) => v.userId);
  const [selectedGrantIds,  setSelectedGrantIds]  = useState([]);
  const [selectedRevokeIds, setSelectedRevokeIds] = useState([]);

  const grantableEmployees = useMemo(
    () => (allEmployees || []).filter((e) => e.role !== "COUNTRY_DIRECTOR" && !existingViewerUserIds.includes(e.id)),
    [allEmployees, existingViewerUserIds]
  );

  const toggleGrant  = (id) => setSelectedGrantIds((p)  => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleRevoke = (id) => setSelectedRevokeIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const allGrantSelected  = grantableEmployees.length > 0 && selectedGrantIds.length === grantableEmployees.length;
  const someGrantSelected = selectedGrantIds.length > 0 && !allGrantSelected;
  const toggleAllGrant    = () => setSelectedGrantIds(allGrantSelected ? [] : grantableEmployees.map((e) => e.id));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faUserShield} />
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight text-sm">Manage Case Access</h2>
              <p className="text-[10px] text-violet-500 font-bold mt-0.5">Country Director only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGranting || isRevoking}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-all disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 pb-0 shrink-0 flex gap-1 border-b border-slate-100">
          {["grant", "revoke"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-t-xl transition-colors ${
                tab === t
                  ? t === "grant"
                    ? "bg-violet-50 text-violet-700 border-b-2 border-violet-600"
                    : "bg-rose-50 text-rose-700 border-b-2 border-rose-500"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t === "grant" ? "Grant Access" : "Revoke Access"}
            </button>
          ))}
        </div>

        {/* Grant tab */}
        {tab === "grant" && (
          <>
            {grantableEmployees.length > 0 && (
              <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/60 shrink-0">
                <div onClick={toggleAllGrant} className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                      allGrantSelected  ? "bg-violet-600 border-violet-600"
                      : someGrantSelected ? "bg-violet-200 border-violet-400"
                      : "bg-white border-slate-300 hover:border-violet-400"
                    }`}
                  >
                    {allGrantSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {someGrantSelected && !allGrantSelected && <div className="w-2 h-0.5 bg-violet-600 rounded-full" />}
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {allGrantSelected ? "Deselect all" : "Select all"} staff
                  </span>
                  {selectedGrantIds.length > 0 && (
                    <span className="ml-auto text-[10px] font-black px-2 py-0.5 bg-violet-100 text-violet-700 rounded-lg">
                      {selectedGrantIds.length} selected
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="overflow-y-auto flex-1">
              {grantableEmployees.length === 0 ? (
                <div className="py-12 text-center px-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300 text-xl">
                    <FontAwesomeIcon icon={faUserShield} />
                  </div>
                  <p className="text-xs text-slate-400 font-bold">All eligible staff already have access</p>
                </div>
              ) : (
                <EmployeePickerList employees={grantableEmployees} selectedIds={selectedGrantIds} onToggle={toggleGrant} />
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end shrink-0 bg-white">
              <button
                onClick={onClose}
                disabled={isGranting}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:border-slate-400 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                disabled={selectedGrantIds.length === 0 || isGranting}
                onClick={() => onGrant(selectedGrantIds)}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-2xl text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGranting
                  ? <><FontAwesomeIcon icon={faSpinner} spin className="text-xs" /> Granting…</>
                  : (
                    <>
                      <FontAwesomeIcon icon={faUserPlus} /> Grant Access
                      {selectedGrantIds.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-lg text-xs">{selectedGrantIds.length}</span>
                      )}
                    </>
                  )}
              </button>
            </div>
          </>
        )}

        {/* Revoke tab */}
        {tab === "revoke" && (
          <>
            <div className="overflow-y-auto flex-1">
              {existingViewers.length === 0 ? (
                <div className="py-12 text-center px-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300 text-xl">
                    <FontAwesomeIcon icon={faUserMinus} />
                  </div>
                  <p className="text-xs text-slate-400 font-bold">No viewers have been granted access yet</p>
                </div>
              ) : (
                <ViewerRevokeList
                  viewers={existingViewers}
                  allEmployees={allEmployees || []}
                  selectedIds={selectedRevokeIds}
                  onToggle={toggleRevoke}
                />
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end shrink-0 bg-white">
              <button
                onClick={onClose}
                disabled={isRevoking}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:border-slate-400 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                disabled={selectedRevokeIds.length === 0 || isRevoking}
                onClick={() => onRevoke(selectedRevokeIds)}
                className="px-6 py-2.5 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRevoking
                  ? <><FontAwesomeIcon icon={faSpinner} spin className="text-xs" /> Revoking…</>
                  : (
                    <>
                      <FontAwesomeIcon icon={faUserMinus} /> Revoke Access
                      {selectedRevokeIds.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-lg text-xs">{selectedRevokeIds.length}</span>
                      )}
                    </>
                  )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const EmployeePickerList = ({ employees, selectedIds, onToggle }) => (
  <div className="divide-y divide-slate-50">
    {employees.map((emp) => {
      const checked = selectedIds.includes(emp.id);
      return (
        <div
          key={emp.id}
          onClick={() => onToggle(emp.id)}
          className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors select-none ${
            checked ? "bg-violet-50/60" : "hover:bg-slate-50"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
              checked ? "bg-violet-600 border-violet-600" : "bg-white border-slate-300 hover:border-violet-400"
            }`}
          >
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {emp.avatarUrl
            ? <img src={`http://localhost:5000${emp.avatarUrl}`} alt="" className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-100 shrink-0" />
            : (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  checked ? "bg-violet-200 text-violet-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {emp.firstName?.[0]}{emp.lastName?.[0]}
              </div>
            )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate ${checked ? "text-violet-900" : "text-slate-800"}`}>
              {emp.firstName} {emp.lastName}
            </p>
            <p className="text-[10px] text-slate-400 font-medium capitalize truncate">
              {emp.role?.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
        </div>
      );
    })}
  </div>
);

const ViewerRevokeList = ({ viewers, allEmployees, selectedIds, onToggle }) => (
  <div className="divide-y divide-slate-50">
    {viewers.map((viewer) => {
      const emp     = allEmployees.find((e) => e.id === viewer.userId);
      const checked = selectedIds.includes(viewer.userId);
      return (
        <div
          key={viewer.userId}
          onClick={() => onToggle(viewer.userId)}
          className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors select-none ${
            checked ? "bg-rose-50/60" : "hover:bg-slate-50"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
              checked ? "bg-rose-500 border-rose-500" : "bg-white border-slate-300 hover:border-rose-400"
            }`}
          >
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {emp?.avatarUrl
            ? <img src={`http://localhost:5000${emp.avatarUrl}`} alt="" className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-100 shrink-0" />
            : (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  checked ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {emp ? `${emp.firstName?.[0]}${emp.lastName?.[0]}` : "?"}
              </div>
            )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate ${checked ? "text-rose-900" : "text-slate-800"}`}>
              {emp ? `${emp.firstName} ${emp.lastName}` : viewer.userId}
            </p>
            {emp && (
              <p className="text-[10px] text-slate-400 font-medium capitalize truncate">
                {emp.role?.replace(/_/g, " ").toLowerCase()}
              </p>
            )}
            {viewer.grantedAt && (
              <p className="text-[9px] text-slate-300 font-medium mt-0.5">
                Granted {new Date(viewer.grantedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// ── EditableTextBlock ─────────────────────────────────────────────────────────
// FIX: receives `disabled` from canEdit prop — edit pencil only shown when canEdit=true AND case not closed
const EditableTextBlock = ({ label, icon, bg, iconColor, fieldName, value, placeholder, disabled, onSave, isSaving }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value || "");
  const areaRef = useRef(null);

  useEffect(() => { setDraft(value || ""); }, [value]);
  useEffect(() => { if (editing && areaRef.current) areaRef.current.focus(); }, [editing]);

  const handleSave = async () => {
    try {
      await onSave({ [fieldName]: draft });
      setEditing(false);
    } catch { /* toast handled by caller */ }
  };
  const handleCancel = () => { setDraft(value || ""); setEditing(false); };

  return (
    <DescBlock icon={icon} label={label} bg={bg} iconColor={iconColor}>
      {!editing ? (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-line flex-1">
            {draft || <span className="italic text-slate-400 font-normal">Not recorded.</span>}
          </p>
          {/* FIX: only show edit button when canEdit is true (disabled=false) */}
          {!disabled && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 w-6 h-6 rounded-lg bg-white/70 border border-white hover:border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all"
              title={`Edit ${label}`}
            >
              <FontAwesomeIcon icon={faPencilAlt} className="text-[9px]" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            ref={areaRef}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className={inputCls + " resize-none mt-1"}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-[10px] font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition flex items-center gap-1 disabled:opacity-50"
            >
              {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin /> Saving…</> : "Save"}
            </button>
          </div>
        </div>
      )}
    </DescBlock>
  );
};

// ── DetailPanel ───────────────────────────────────────────────────────────────
// FIX: canEdit and canDelete are now respected for all buttons/actions inside the panel
const DetailPanel = ({
  caseItem,
  onClose,
  onEdit,
  onDelete,
  canEdit,           // from perms.safeguard.edit
  canDelete,         // from perms.safeguard.delete
  isManagement,
  isCountryDirector,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose,  setConfirmClose]  = useState(false);
  const [grantOpen,     setGrantOpen]     = useState(false);

  const [updateCase,   { isLoading: isUpdating }] = useUpdateSafeguardingCaseMutation();
  const [closeCase,    { isLoading: isClosing }]  = useCloseSafeguardingCaseMutation();
  const [grantAccess,  { isLoading: isGranting }] = useGrantSafeguardingAccessMutation();
  const [revokeAccess, { isLoading: isRevoking }] = useRevokeSafeguardingAccessMutation();
  const [deleteCase,   { isLoading: isDeleting }] = useDeleteSafeguardingCaseMutation();

  const { data: empData } = useGetEmployeesQuery(undefined);
  const allEmployees = empData?.data ?? [];

  if (!caseItem) return null;

  const incident = INCIDENT_STYLES[caseItem.incidentType] || INCIDENT_STYLES.OTHER;
  const status   = STATUS_STYLES[caseItem.status]          || STATUS_STYLES.OPEN;
  const isClosed = caseItem.status === "CLOSED";

  const existingViewers       = caseItem.authorizedViewers || [];
  const existingViewerUserIds = existingViewers.map((v) => v.userId);

  const handleFieldSave = async (fields) => {
    try {
      await updateCase({ id: caseItem.id, ...fields }).unwrap();
      toast.success("Case notes saved.");
    } catch {
      toast.error("Failed to save. Please try again.");
      throw new Error("save failed");
    }
  };

  const handleCloseCase = async () => {
    try {
      await closeCase(caseItem.id).unwrap();
      toast.success("Case resolved and closed.");
      setConfirmClose(false);
      onClose();
    } catch {
      toast.error("Could not close the case.");
    }
  };

  const handleGrant = async (userIds) => {
    try {
      await Promise.all(userIds.map((userId) => grantAccess({ id: caseItem.id, userId }).unwrap()));
      toast.success(`Access granted to ${userIds.length} staff member${userIds.length !== 1 ? "s" : ""}.`);
      setGrantOpen(false);
    } catch {
      toast.error("Failed to grant access.");
    }
  };

  const handleRevoke = async (userIds) => {
    try {
      await Promise.all(userIds.map((userId) => revokeAccess({ id: caseItem.id, userId }).unwrap()));
      toast.success(`Access revoked from ${userIds.length} staff member${userIds.length !== 1 ? "s" : ""}.`);
      setGrantOpen(false);
    } catch {
      toast.error("Failed to revoke access.");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCase(caseItem.id).unwrap();
      toast.success("Case permanently deleted.");
      setConfirmDelete(false);
      onClose();
    } catch {
      toast.error("Failed to delete the case.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="fixed mt-10 scale-80 right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Header */}
        <div className="bg-primBtn px-6 py-5 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${incident.color.split(" ")[1]}`}>
              {incident.label}
            </span>
            <h2 className="text-white font-black text-lg leading-tight">
              {new Date(caseItem.incidentDate).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </h2>
            <p className="text-rose-100 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="text-[10px]" />
              Reported by:{" "}
              {caseItem.reportedBy
                ? `${caseItem.reportedBy.firstName} ${caseItem.reportedBy.lastName}`
                : "Staff"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Confidential banner */}
        <div className="bg-rose-50 border-b border-rose-100 px-5 py-2.5 flex items-center gap-2 shrink-0">
          <FontAwesomeIcon icon={faUserShield} className="text-rose-400 text-xs" />
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            Confidential — Authorized Access Only
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5">

          {/* Case Overview */}
          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Case Overview</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <DetailRow
                icon={faCalendarAlt}
                label="Incident Date"
                value={new Date(caseItem.incidentDate).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              />
              <DetailRow icon={faTriangleExclamation} label="Incident Type" value={incident.label} badge badgeColor={incident.color} />
              <DetailRow icon={faCheckCircle}         label="Case Status"   value={status.label}   badge badgeColor={status.color}   />
              <DetailRow
                icon={faUser}
                label="Reported By"
                value={caseItem.reportedBy ? `${caseItem.reportedBy.firstName} ${caseItem.reportedBy.lastName}` : null}
              />
              {caseItem.externalReferral && (
                <DetailRow icon={faUserPlus} label="External Referral" value={caseItem.externalReferral} />
              )}
              {isClosed && caseItem.closedAt && (
                <DetailRow
                  icon={faCheckCircle}
                  label="Closed On"
                  value={new Date(caseItem.closedAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                />
              )}
            </div>
          </div>

          {/* Incident description — always read-only */}
          <div className="px-6">
            <DescBlock icon={faFileText} label="Incident Description" bg="bg-rose-50/70 border-rose-100" iconColor="text-rose-500">
              <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-line">
                {caseItem.description || <span className="italic text-slate-400">No description recorded.</span>}
              </p>
            </DescBlock>
          </div>

          {/* Action Plan — FIX: edit pencil only shown when canEdit=true AND case not closed */}
          <div className="px-6">
            <EditableTextBlock
              label="Action Plan & Countermeasures"
              icon={faShield}
              bg="bg-sky-50/70 border-sky-100"
              iconColor="text-sky-500"
              fieldName="actionPlan"
              value={caseItem.actionPlan}
              placeholder="Specify protection actions planned…"
              disabled={!canEdit || isClosed}
              onSave={handleFieldSave}
              isSaving={isUpdating}
            />
          </div>

          {/* Follow-up Notes — FIX: same canEdit gate */}
          <div className="px-6">
            <EditableTextBlock
              label="Follow-up Notes & Updates"
              icon={faInfoCircle}
              bg="bg-amber-50/70 border-amber-100"
              iconColor="text-amber-500"
              fieldName="followUpNotes"
              value={caseItem.followUpNotes}
              placeholder="Append chronological updates…"
              disabled={!canEdit || isClosed}
              onSave={handleFieldSave}
              isSaving={isUpdating}
            />
          </div>

          {/* Management Controls — Close button gated by canEdit (edit permission covers closing) */}
          {isManagement && (
            <div className="px-6 space-y-3">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Management Controls</p>

              {/* FIX: Close button only shown when canEdit is true */}
              {canEdit && !isClosed && (
                <button
                  onClick={() => setConfirmClose(true)}
                  disabled={isClosing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition border border-emerald-700 disabled:opacity-50"
                >
                  {isClosing
                    ? <><FontAwesomeIcon icon={faSpinner} spin /> Closing…</>
                    : <><FontAwesomeIcon icon={faCheckCircle} className="text-xs" /> Resolve & Close File</>}
                </button>
              )}

              {isClosed && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500" />
                  Resolved &amp; closed on{" "}
                  {caseItem.closedAt ? new Date(caseItem.closedAt).toLocaleDateString() : "—"}.
                </div>
              )}

              {/* Grant / Revoke — COUNTRY_DIRECTOR only (no canEdit dependency — access management is separate) */}
              {isCountryDirector && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Case Access</p>
                    <button
                      onClick={() => setGrantOpen(true)}
                      className="text-[10px] font-black text-violet-600 hover:text-violet-800 hover:underline transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faUserShield} className="text-[9px]" />
                      Manage Access
                    </button>
                  </div>
                  {existingViewerUserIds.length > 0 ? (
                    <p className="text-xs text-slate-500 font-medium">
                      <span className="font-black text-slate-700">{existingViewerUserIds.length}</span>{" "}
                      staff member{existingViewerUserIds.length !== 1 ? "s" : ""} have been granted access.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No additional staff have been granted access yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — FIX: Edit button gated by canEdit, Delete button gated by canDelete */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {canEdit && (
            <button
              onClick={() => onEdit(caseItem)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm hover:bg-sky-100 transition border border-sky-200"
            >
              <FontAwesomeIcon icon={faPencilAlt} className="text-xs" /> Edit Case
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete Case
            </button>
          )}
        </div>
      </div>

      {grantOpen && isCountryDirector && (
        <GrantRevokeModal
          onClose={() => !(isGranting || isRevoking) && setGrantOpen(false)}
          onGrant={handleGrant}
          onRevoke={handleRevoke}
          existingViewers={existingViewers}
          allEmployees={allEmployees}
          isGranting={isGranting}
          isRevoking={isRevoking}
        />
      )}

      <DeleteConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete This Safeguarding Case?"
        message="This will permanently erase the case record, all notes, and associated viewer access. This action is irreversible and will be audit-logged."
        isDeleting={isDeleting}
      />

      <DeleteConfirmationModal
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={handleCloseCase}
        title="Resolve & Close Case File?"
        message="This will mark the case as resolved and close the file. No further edits will be possible after closing."
        isDeleting={isClosing}
        confirmLabel="Yes, Close Case"
        confirmCls="bg-emerald-600 hover:bg-emerald-700"
      />
    </>
  );
};

// ── CaseCard ──────────────────────────────────────────────────────────────────
// FIX: Delete button on the card gated by canDelete prop
const CaseCard = ({ caseItem, onSelect, active, onDelete, canDelete }) => {
  const incident = INCIDENT_STYLES[caseItem.incidentType] || INCIDENT_STYLES.OTHER;
  const status   = STATUS_STYLES[caseItem.status]          || STATUS_STYLES.OPEN;
  const isClosed = caseItem.status === "CLOSED";
  const [confirmCardDelete, setConfirmCardDelete] = useState(false);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${
          active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${incident.dot}`} />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className={`text-sm ${isClosed ? "text-slate-400" : "text-rose-500"}`}
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${incident.color}`}>
                {incident.label}
              </span>
              <span className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[9px]" />
                {new Date(caseItem.incidentDate).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[9px]" />
                {caseItem.reportedBy
                  ? `${caseItem.reportedBy.firstName} ${caseItem.reportedBy.lastName}`
                  : "Staff"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {caseItem.description || (
                <span className="italic text-slate-300 flex items-center gap-1">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" /> No description provided.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onSelect}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                active
                  ? "bg-primBtn text-white"
                  : "bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-400"
              }`}
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
            {/* FIX: canDelete gates the trash button on the card */}
            {canDelete && (
              <button
                onClick={() => setConfirmCardDelete(true)}
                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs transition"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={confirmCardDelete}
        onClose={() => setConfirmCardDelete(false)}
        onConfirm={async () => { await onDelete(caseItem); setConfirmCardDelete(false); }}
        title="Delete Safeguarding Case?"
        message="This will permanently erase the case record, all notes, and associated viewer access."
        isDeleting={false}
      />
    </>
  );
};

// ── CaseForm ──────────────────────────────────────────────────────────────────
// FIX: Status field in edit mode only shown when canEdit=true AND isManagement=true
const CaseForm = ({ editItem = null, childId, onClose, isManagement = false, canEdit = false }) => {
  const isEditing = !!editItem;
  const [createCase, { isLoading: isCreating }] = useCreateSafeguardingCaseMutation();
  const [updateCase, { isLoading: isUpdating }] = useUpdateSafeguardingCaseMutation();
  const isSaving = isCreating || isUpdating;

  const [formData, setFormData] = useState({
    incidentDate:     new Date().toISOString().split("T")[0],
    incidentType:     "OTHER",
    description:      "",
    actionPlan:       "",
    externalReferral: "",
    status:           "OPEN",
  });

  useEffect(() => {
    if (editItem) {
      setFormData({
        incidentDate:     editItem.incidentDate
          ? new Date(editItem.incidentDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        incidentType:     editItem.incidentType     || "OTHER",
        description:      editItem.description      || "",
        actionPlan:       editItem.actionPlan        || "",
        externalReferral: editItem.externalReferral  || "",
        status:           editItem.status            || "OPEN",
      });
    }
  }, [editItem]);

  const change = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateCase({
          id:               editItem.id,
          incidentDate:     new Date(formData.incidentDate).toISOString(),
          incidentType:     formData.incidentType,
          description:      formData.description,
          actionPlan:       formData.actionPlan       || undefined,
          externalReferral: formData.externalReferral || undefined,
          // FIX: only pass status if management AND canEdit
          ...(isManagement && canEdit ? { status: formData.status } : {}),
        }).unwrap();
        toast.success("Case updated successfully.");
      } else {
        await createCase({
          childId,
          incidentDate:     new Date(formData.incidentDate).toISOString(),
          incidentType:     formData.incidentType,
          description:      formData.description,
          actionPlan:       formData.actionPlan       || undefined,
          externalReferral: formData.externalReferral || undefined,
        }).unwrap();
        toast.success("Safeguarding case reported.");
      }
      onClose();
    } catch {
      toast.error(isEditing ? "Failed to update case." : "Failed to submit case.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white scale-80 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primBtn rounded-xl flex items-center justify-center text-white">
              <FontAwesomeIcon icon={isEditing ? faPencilAlt : faShield} className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isEditing ? "Edit Safeguarding Case" : "Report Confidential Case"}
              </h3>
              <p className="text-xs text-slate-400">Restricted — authorized personnel only</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Incident Date <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="date"
                name="incidentDate"
                value={formData.incidentDate}
                onChange={change}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Incident Type <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={change}
                  className={inputCls + " appearance-none pr-8"}
                >
                  {Object.entries(INCIDENT_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
              </div>
            </div>
          </div>

          {/* FIX: Status dropdown in edit mode only for management WITH canEdit permission */}
          {isEditing && isManagement && canEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Case Status</label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={change}
                  className={inputCls + " appearance-none pr-8"}
                >
                  {ALL_STATUSES.map((key) => (
                    <option key={key} value={key}>{STATUS_STYLES[key].label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
              </div>
              {formData.status && STATUS_STYLES[formData.status] && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[formData.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[formData.status].dot}`} />
                    {STATUS_STYLES[formData.status].label}
                  </span>
                  {formData.status !== editItem?.status && (
                    <span className="text-[10px] text-slate-400 italic">
                      Changed from{" "}
                      <span className="font-bold text-slate-600">
                        {STATUS_STYLES[editItem?.status]?.label ?? editItem?.status}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              Incident Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              name="description"
              rows={4}
              minLength={10}
              value={formData.description}
              onChange={change}
              placeholder="Provide factual details regarding observations, disclosures, or risk indicators…"
              className={inputCls + " resize-none"}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Initial Action Plan</label>
            <textarea
              name="actionPlan"
              rows={2}
              value={formData.actionPlan}
              onChange={change}
              placeholder="Immediate safety arrangements or steps planned…"
              className={inputCls + " resize-none"}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">External Referral Agency</label>
            <input
              type="text"
              name="externalReferral"
              value={formData.externalReferral}
              onChange={change}
              placeholder="e.g. Local Child Protection Unit, Police"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-primBtn hover:bg-Hover disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {isSaving
                ? <><FontAwesomeIcon icon={faSpinner} spin /> {isEditing ? "Updating…" : "Saving…"}</>
                : isEditing ? "Update Case" : "Submit Secure Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main SafeguardingTab ──────────────────────────────────────────────────────
// Permissions flow:
//   canCreate → "Report Case" button + CaseForm open
//   canEdit   → Edit button in DetailPanel footer, EditableTextBlock pencil, Close button, Status dropdown in form
//   canDelete → Trash button on CaseCard, Delete button in DetailPanel footer
const SafeguardingTab = ({
  childId,
  canCreate = false,
  canEdit   = false,
  canDelete = false,
}) => {
  const { user }          = useSelector((state) => state.auth);
  const isAuthorized      = AUTHORIZED_ROLES.includes(user.role);
  const isManagement      = MANAGEMENT_ROLES.includes(user.role);
  const isCountryDirector = user.role === COUNTRY_DIRECTOR_ROLE;

  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [activeCase, setActiveCase] = useState(null);

  const [deleteCase] = useDeleteSafeguardingCaseMutation();

  const { data, isLoading } = useGetSafeguardingCasesQuery(childId, {
    skip: !childId || !isAuthorized,
  });

  const allCases = [...(data?.data || [])].sort(
    (a, b) => new Date(b.incidentDate) - new Date(a.incidentDate)
  );

  const visibleCases = allCases.filter((c) => canViewCase(c, user.id, isManagement));

  const totalCases  = visibleCases.length;
  const openCases   = visibleCases.filter((c) => c.status === "OPEN").length;
  const closedCases = visibleCases.filter((c) => c.status === "CLOSED").length;

  const syncedActive = activeCase
    ? visibleCases.find((c) => c.id === activeCase.id) || null
    : null;

  const handleDelete = async (caseItem) => {
    try {
      await deleteCase(caseItem.id).unwrap();
      toast.success("Case deleted.");
      if (activeCase?.id === caseItem.id) setActiveCase(null);
    } catch {
      toast.error("Failed to delete the case.");
    }
  };

  // FIX: openEdit only reachable when canEdit is true (button is hidden otherwise)
  const openEdit = (caseItem) => {
    setActiveCase(null);
    setEditTarget(caseItem);
    setShowForm(true);
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <FontAwesomeIcon icon={faLock} className="text-red-500 text-2xl" />
        </div>
        <h4 className="text-lg font-bold text-slate-900">Access Restricted</h4>
        <p className="text-sm text-slate-500 max-w-xs">
          Safeguarding case records are restricted to authorized personnel only.
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <TabShell
        title="Safeguarding Cases"
        icon={faShield}
        warning="These records are confidential. Access is logged and restricted to authorized personnel only."
        actions={
        
          canCreate
            ? [{ label: "Report Case", icon: faPlus, onClick: () => { setEditTarget(null); setShowForm(true); } }]
            : []
        }
      >
        <style>{`
          @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
          @keyframes slideUpFade  { from { transform: translateY(12px); opacity:0; } to { transform: translateY(0); opacity:1; } }
          .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
          @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fadeIn 0.18s ease-out forwards; }
          @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .scale-up-center { animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        `}</style>

        <div className="p-5 space-y-5">
          {totalCases > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Cases",  val: totalCases,  cls: "bg-slate-100 text-slate-700" },
                { label: "Open Cases",   val: openCases,   cls: openCases > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600" },
                { label: "Closed Cases", val: closedCases, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
                { label: "Case Types",   val: new Set(visibleCases.map((c) => c.incidentType)).size, cls: "bg-rose-50 text-rose-700 border border-rose-200" },
              ].map(({ label, val, cls }) => (
                <div key={label} className={`${cls} rounded-2xl p-4 text-center`}>
                  <p className="text-2xl font-black font-mono">{val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-70">{label}</p>
                </div>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visibleCases.length === 0 ? (
            <EmptyState icon={faShield} message="No safeguarding cases recorded" />
          ) : (
            <div className="space-y-3">
              {visibleCases.map((c) => (
                <CaseCard
                  key={c.id}
                  caseItem={c}
                  onSelect={() => setActiveCase(c)}
                  active={syncedActive?.id === c.id}
                  onDelete={handleDelete}
                  canDelete={canDelete}  
                />
              ))}
            </div>
          )}
        </div>

        {syncedActive && (
          <DetailPanel
            caseItem={syncedActive}
            onClose={() => setActiveCase(null)}
            onEdit={openEdit}
            onDelete={handleDelete}
            canEdit={canEdit}      
            canDelete={canDelete}  
            isManagement={isManagement}
            isCountryDirector={isCountryDirector}
          />
        )}

        {/* FIX: CaseForm only opens when canCreate or canEdit is true (controlled by the buttons that open it) */}
        {showForm && (
          <CaseForm
            editItem={editTarget}
            childId={childId}
            onClose={() => { setShowForm(false); setEditTarget(null); }}
            isManagement={isManagement}
            canEdit={canEdit} 
          />
        )}
      </TabShell>
    </>
  );
};

export default SafeguardingTab;