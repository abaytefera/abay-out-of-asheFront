import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrain, faComments, faUsers, faPuzzlePiece,
  faCalendar, faUser, faSpinner,
  faClipboardList, faLightbulb, faBullseye, faHeartPulse,
  faTimes, faSave, faTrash, faChevronRight,
  faExclamationTriangle, faPencilAlt, faInfoCircle,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { TabShell, EmptyState, SubSection } from "./TabShell";
import {
  useGetPsychosocialSessionsQuery,
  useGetTBRIActivitiesQuery,
  useCreatePsychosocialSessionMutation,
  useUpdatePsychosocialSessionMutation,
  useDeletePsychosocialSessionMutation,
  useCreateTBRIActivityMutation,
  useUpdateTBRIActivityMutation,
  useDeleteTBRIActivityMutation,
} from "../../../../Redux/psychosocialApi";
import { toast } from "react-toastify";

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_TYPES = ["Individual", "Group", "Family"];

const PILLAR_STYLES = {
  CONNECTING: { label: "Connecting", color: "bg-teal-50 text-teal-700 border-teal-200",   dot: "bg-teal-400",   gradient: "from-teal-600 to-cyan-500" },
  EMPOWERING: { label: "Empowering", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400",  gradient: "from-amber-500 to-orange-400" },
  CORRECTING: { label: "Correcting", color: "bg-rose-50 text-rose-700 border-rose-200",   dot: "bg-rose-400",   gradient: "from-rose-600 to-pink-500" },
};

const STATE_STYLES = {
  REGULATED:     { label: "Regulated",     color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  HYPER_AROUSAL: { label: "Hyper-Arousal", color: "bg-orange-50 text-orange-700 border-orange-200" },
  HYPO_AROUSAL:  { label: "Hypo-Arousal",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  UNREGULATED:   { label: "Unregulated",   color: "bg-red-50 text-red-700 border-red-200" },
};

const SESSION_TYPE_CONFIG = {
  Individual: { icon: faComments, color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", gradient: "from-purple-600 to-indigo-500" },
  Group:      { icon: faUsers,    color: "bg-sky-50 text-sky-700 border-sky-200",           dot: "bg-sky-500",    gradient: "from-sky-600 to-blue-500" },
  Family:     { icon: faUsers,    color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", gradient: "from-emerald-600 to-teal-500" },
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  : null;
const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : null;
const toInputDateTime = (d) => d ? new Date(d).toISOString().slice(0, 16) : "";

const inputCls =
  "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition text-sm text-slate-800 bg-white";

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
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
          <button type="button" disabled={isDeleting} onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition">
            Cancel
          </button>
          <button type="button" disabled={isDeleting} onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5">
            {isDeleting ? <><FontAwesomeIcon icon={faSpinner} spin /> Deleting…</> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── DetailRow ─────────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
      <FontAwesomeIcon icon={icon} className="text-slate-400 text-[10px]" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">{label}</p>
      {value
        ? <p className="text-sm font-semibold text-slate-800 leading-normal">{value}</p>
        : <p className="text-sm italic text-slate-300 font-normal">Not recorded</p>}
    </div>
  </div>
);

// ── DescBlock ─────────────────────────────────────────────────────────────────
const DescBlock = ({ icon, label, value, bg, iconColor, emptyText }) => (
  <div className={`${bg} rounded-2xl p-4 border flex flex-col gap-2`}>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-white/70 border border-white flex items-center justify-center shrink-0">
        <FontAwesomeIcon icon={icon} className={`${iconColor} text-[10px]`} />
      </div>
      <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">{label}</p>
    </div>
    <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-line">
      {value || <span className="italic text-slate-400 font-normal">{emptyText}</span>}
    </p>
  </div>
);

// ── Session Detail Panel ──────────────────────────────────────────────────────
const SessionDetailPanel = ({ session, onClose, onEdit, onDelete, canEdit, canDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!session) return null;

  const tc = SESSION_TYPE_CONFIG[session.sessionType] || SESSION_TYPE_CONFIG.Individual;
  const hasNext = !!session.nextSessionDate;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed mt-10 scale-80 right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${tc.gradient} px-6 py-5 flex items-start justify-between shrink-0`}>
          <div className="space-y-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${tc.color.split(" ")[1]}`}>
              {session.sessionType || "Individual"} Session
            </span>
            <h2 className="text-white font-black text-lg leading-tight">
              {fmtDateTime(session.sessionDate) || "—"}
            </h2>
            <p className="text-white/70 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="text-[10px]" />
              {session.counselor ? `${session.counselor.firstName} ${session.counselor.lastName}` : "System"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5">
          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Session Overview</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <DetailRow icon={faCalendar} label="Session Date"    value={fmtDateTime(session.sessionDate)} />
              <DetailRow icon={faComments} label="Session Type"    value={session.sessionType} />
              <DetailRow icon={faCalendar} label="Next Session"    value={hasNext ? fmtDateTime(session.nextSessionDate) : "No follow-up scheduled"} />
              <DetailRow icon={faUser}     label="Counselor"       value={session.counselor ? `${session.counselor.firstName} ${session.counselor.lastName}` : null} />
            </div>
          </div>

          <div className="px-6 space-y-3">
            <DescBlock icon={faHeartPulse}    label="Behavioral Concerns"  value={session.behavioralConcerns}  bg="bg-rose-50/70 border-rose-100"   iconColor="text-rose-500"   emptyText="No behavioral concerns noted." />
            <DescBlock icon={faClipboardList} label="Trauma Assessment"    value={session.traumaAssessment}    bg="bg-amber-50/70 border-amber-100"  iconColor="text-amber-500"  emptyText="No trauma assessment recorded." />
            <DescBlock icon={faLightbulb}     label="Progress Notes"       value={session.progressNotes}       bg="bg-sky-50/70 border-sky-100"      iconColor="text-sky-500"    emptyText="No progress notes documented." />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {canEdit && (
            <button onClick={() => onEdit(session)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm hover:bg-sky-100 transition border border-sky-200">
              <FontAwesomeIcon icon={faPencilAlt} className="text-xs" /> Edit Session
            </button>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDelete(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200">
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
            </button>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(session); onClose(); }}
        title="Delete Session?"
        message="This will permanently remove the counselling session record and all associated notes."
        isDeleting={false}
      />
    </>
  );
};

// ── TBRI Detail Panel ─────────────────────────────────────────────────────────
const TBRIDetailPanel = ({ activity, onClose, onEdit, onDelete, canEdit, canDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!activity) return null;

  const pillar = PILLAR_STYLES[activity.tbriPillar] || PILLAR_STYLES.CONNECTING;
  const state  = STATE_STYLES[activity.initialState];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed mt-10 scale-80 right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${pillar.gradient} px-6 py-5 flex items-start justify-between shrink-0`}>
          <div className="space-y-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${pillar.color.split(" ")[1]}`}>
              {pillar.label} Pillar
            </span>
            <h2 className="text-white font-black text-lg leading-tight">{activity.activityName}</h2>
            <p className="text-white/70 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendar} className="text-[10px]" />
              {fmtDateTime(activity.startDate || activity.activityDate) || "—"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5">
          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Activity Overview</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <DetailRow icon={faPuzzlePiece} label="Activity Name"    value={activity.activityName} />
              <DetailRow icon={faBrain}       label="TBRI Pillar"      value={pillar.label} />
              <DetailRow icon={faCalendar}    label="Activity Date"    value={fmtDateTime(activity.startDate || activity.activityDate)} />
              <DetailRow icon={faUser}        label="Facilitator"      value={activity.facilitator ? `${activity.facilitator.firstName} ${activity.facilitator.lastName}` : null} />
            </div>
          </div>

          {/* Initial state chip */}
          {state && (
            <div className="px-6">
              <div className={`${state.color} rounded-2xl p-4 border flex items-center gap-3`}>
                <div className="w-3 h-3 rounded-full bg-current opacity-60" />
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase opacity-70">Initial Behavioral State</p>
                  <p className="text-sm font-bold">{state.label}</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 space-y-3">
            <DescBlock icon={faClipboardList} label="Baseline Observations" value={activity.observations} bg="bg-slate-50/70 border-slate-100"   iconColor="text-slate-500"  emptyText="No observations recorded." />
            <DescBlock icon={faBullseye}      label="Target Outcomes"       value={activity.outcomes}     bg="bg-teal-50/70 border-teal-100"     iconColor="text-teal-500"   emptyText="No outcomes documented." />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {canEdit && (
            <button onClick={() => onEdit(activity)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm hover:bg-sky-100 transition border border-sky-200">
              <FontAwesomeIcon icon={faPencilAlt} className="text-xs" /> Edit Activity
            </button>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDelete(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200">
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
            </button>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(activity); onClose(); }}
        title="Delete TBRI Activity?"
        message="This will permanently remove the TBRI activity and all its progress logs. This action cannot be undone."
        isDeleting={false}
      />
    </>
  );
};

// ── Session Card ──────────────────────────────────────────────────────────────
const SessionCard = ({ sess, onSelect, active, onDelete, canDelete }) => {
  const tc = SESSION_TYPE_CONFIG[sess.sessionType] || SESSION_TYPE_CONFIG.Individual;
  const hasNext = !!sess.nextSessionDate;
  const [confirmCardDelete, setConfirmCardDelete] = useState(false);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${
          active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${tc.dot}`} />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(var(--primBtn-rgb,79,70,229),0.08)" }}>
            <FontAwesomeIcon icon={tc.icon} className="text-primBtn text-sm" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tc.color}`}>
                {sess.sessionType || "Individual"} Session
              </span>
              {hasNext ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Next: {fmtDate(sess.nextSessionDate)}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Cycle complete
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FontAwesomeIcon icon={faCalendar} className="text-slate-400 text-[9px]" />
                {fmtDateTime(sess.sessionDate) || "—"}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[9px]" />
                {sess.counselor ? `${sess.counselor.firstName} ${sess.counselor.lastName}` : "Counselor"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {sess.progressNotes || sess.behavioralConcerns || (
                <span className="italic text-slate-300 flex items-center gap-1">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" /> No notes documented.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={onSelect}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? "bg-primBtn text-white" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-400"}`}>
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
            {canDelete && (
              <button onClick={() => setConfirmCardDelete(true)}
                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs transition">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={confirmCardDelete}
        onClose={() => setConfirmCardDelete(false)}
        onConfirm={async () => { await onDelete(sess); setConfirmCardDelete(false); }}
        title="Delete Session?"
        message="This will permanently remove the counselling session record and all associated notes."
        isDeleting={false}
      />
    </>
  );
};

// ── TBRI Card ─────────────────────────────────────────────────────────────────
const TBRICard = ({ act, onSelect, active, onDelete, canDelete }) => {
  const pillar = PILLAR_STYLES[act.tbriPillar] || PILLAR_STYLES.CONNECTING;
  const state  = STATE_STYLES[act.initialState];
  const [confirmCardDelete, setConfirmCardDelete] = useState(false);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${
          active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${pillar.dot}`} />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={faPuzzlePiece} className="text-primBtn text-sm" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${pillar.color}`}>
                {pillar.label}
              </span>
              {state && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${state.color}`}>
                  {state.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
                {act.activityName}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faCalendar} className="text-slate-400 text-[9px]" />
                {fmtDateTime(act.startDate || act.activityDate) || "—"}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[9px]" />
                {act.facilitator ? `${act.facilitator.firstName} ${act.facilitator.lastName}` : "Facilitator"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {act.observations || act.outcomes || (
                <span className="italic text-slate-300 flex items-center gap-1">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" /> No observations recorded.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={onSelect}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? "bg-primBtn text-white" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-400"}`}>
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
            {canDelete && (
              <button onClick={() => setConfirmCardDelete(true)}
                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs transition">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={confirmCardDelete}
        onClose={() => setConfirmCardDelete(false)}
        onConfirm={async () => { await onDelete(act); setConfirmCardDelete(false); }}
        title="Delete TBRI Activity?"
        message="This will permanently remove the TBRI activity and all its progress logs."
        isDeleting={false}
      />
    </>
  );
};

// ── Form Modal ────────────────────────────────────────────────────────────────
const FormModal = ({ type, editItem = null, onClose, onSubmit, isSubmitting }) => {
  const isSession = type === "session";
  const isEditing = !!editItem;

  const [fields, setFields] = useState(() => {
    if (isEditing && isSession) {
      return {
        sessionDate:        toInputDateTime(editItem.sessionDate),
        sessionType:        editItem.sessionType || "Individual",
        behavioralConcerns: editItem.behavioralConcerns || "",
        traumaAssessment:   editItem.traumaAssessment   || "",
        progressNotes:      editItem.progressNotes      || "",
        nextSessionDate:    toInputDateTime(editItem.nextSessionDate),
      };
    }
    if (isEditing && !isSession) {
      return {
        activityName: editItem.activityName || "",
        tbriPillar:   editItem.tbriPillar   || "CONNECTING",
        initialState: editItem.initialState || "REGULATED",
        startDate:    toInputDateTime(editItem.startDate || editItem.activityDate),
        observations: editItem.observations || "",
        outcomes:     editItem.outcomes     || "",
      };
    }
    return isSession
      ? { sessionDate: new Date().toISOString().slice(0, 16), sessionType: "Individual", behavioralConcerns: "", traumaAssessment: "", progressNotes: "", nextSessionDate: "" }
      : { startDate: new Date().toISOString().slice(0, 16), tbriPillar: "CONNECTING", initialState: "REGULATED", activityName: "", observations: "", outcomes: "" };
  });

  const change = useCallback((e) => {
    const { name, value } = e.target;
    setFields((p) => ({ ...p, [name]: value }));
  }, []);

  const headerIcon     = isSession ? faComments : faPuzzlePiece;
  const headerGradient = isSession ? "bg-purple-600" : "bg-blue-600";
  const title = isEditing
    ? (isSession ? "Edit Counselling Session" : "Edit TBRI Activity")
    : (isSession ? "Record Counselling Session" : "Add TBRI Activity");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white scale-80 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${headerGradient} rounded-xl flex items-center justify-center text-white`}>
              <FontAwesomeIcon icon={isEditing ? faPencilAlt : headerIcon} className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-400">
                {isSession ? "Psychosocial support module" : "Trust-based relational intervention"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Form */}
        <form
          id="psyForm"
          onSubmit={(e) => { e.preventDefault(); onSubmit(fields); }}
          className="p-6 overflow-y-auto space-y-4 flex-1"
        >
          {isSession ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Session Date <span className="text-rose-400">*</span></label>
                  <input required type="datetime-local" name="sessionDate" value={fields.sessionDate || ""} onChange={change} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Session Type <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <select name="sessionType" value={fields.sessionType || "Individual"} onChange={change} className={inputCls + " appearance-none pr-8"}>
                      {SESSION_TYPES.map((t) => <option key={t} value={t}>{t} Session</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                  </div>
                </div>
              </div>
              {[
                { name: "behavioralConcerns", label: "Behavioral Concerns",   placeholder: "Describe manifest anxieties, hyper-vigilance, etc…", rows: 2 },
                { name: "traumaAssessment",   label: "Trauma Assessment",     placeholder: "Observations regarding processing triggers…",        rows: 2 },
                { name: "progressNotes",      label: "Progress Notes",        placeholder: "Core milestone evaluations, session summary…",       rows: 3 },
              ].map(({ name, label, placeholder, rows }) => (
                <div key={name} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{label}</label>
                  <textarea name={name} rows={rows} placeholder={placeholder} value={fields[name] || ""} onChange={change} className={inputCls + " resize-none"} />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Next Session Date</label>
                <input type="datetime-local" name="nextSessionDate" value={fields.nextSessionDate || ""} onChange={change} className={inputCls} />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Activity Name <span className="text-rose-400">*</span></label>
                <input required type="text" name="activityName" value={fields.activityName || ""} onChange={change} placeholder="e.g. Sensory Regulation Sequence" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">TBRI Pillar <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <select name="tbriPillar" value={fields.tbriPillar || "CONNECTING"} onChange={change} className={inputCls + " appearance-none pr-8"}>
                      {Object.entries(PILLAR_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label} Pillar</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Initial State <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <select name="initialState" value={fields.initialState || "REGULATED"} onChange={change} className={inputCls + " appearance-none pr-8"}>
                      {Object.entries(STATE_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Activation Date <span className="text-rose-400">*</span></label>
                <input required type="datetime-local" name="startDate" value={fields.startDate || ""} onChange={change} className={inputCls} />
              </div>
              {[
                { name: "observations", label: "Baseline Observations", placeholder: "Log reactions or defensive posturing…",       rows: 2 },
                { name: "outcomes",     label: "Target Outcomes",       placeholder: "How did the child respond to strategies?",    rows: 2 },
              ].map(({ name, label, placeholder, rows }) => (
                <div key={name} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{label}</label>
                  <textarea name={name} rows={rows} placeholder={placeholder} value={fields[name] || ""} onChange={change} className={inputCls + " resize-none"} />
                </div>
              ))}
            </>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition">
            Cancel
          </button>
          <button type="submit" form="psyForm" disabled={isSubmitting}
            className="flex-1 py-3 bg-primBtn hover:bg-Hover disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
            {isSubmitting
              ? <><FontAwesomeIcon icon={faSpinner} spin /> Saving…</>
              : isEditing ? "Update Record" : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Tab ──────────────────────────────────────────────────────────────────
const PsychosocialTab = ({ childId, canCreate = true, canEdit = true, canDelete = true }) => {
  const { data: sessData, isLoading: loadingSess, refetch: refetchSess } = useGetPsychosocialSessionsQuery(childId, { skip: !childId });
  const { data: tbriData, isLoading: loadingTBRI, refetch: refetchTBRI } = useGetTBRIActivitiesQuery(childId, { skip: !childId });

  const [createSession, { isLoading: creatingSession }] = useCreatePsychosocialSessionMutation();
  const [updateSession, { isLoading: updatingSession }] = useUpdatePsychosocialSessionMutation();
  const [deleteSession]                                  = useDeletePsychosocialSessionMutation();
  const [createTBRI,    { isLoading: creatingTBRI }]    = useCreateTBRIActivityMutation();
  const [updateTBRI,    { isLoading: updatingTBRI }]    = useUpdateTBRIActivityMutation();
  const [deleteTBRI]                                    = useDeleteTBRIActivityMutation();

  const [activeForm,  setActiveForm]  = useState(null);  // { type, item }
  const [activePanel, setActivePanel] = useState(null);  // { type: "session"|"tbri", data }

  const sessions   = useMemo(() => [...(Array.isArray(sessData) ? sessData : sessData?.data || [])].sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate)), [sessData]);
  const activities = useMemo(() => [...(Array.isArray(tbriData) ? tbriData : tbriData?.data || [])].sort((a, b) => new Date(b.startDate || b.activityDate) - new Date(a.startDate || a.activityDate)), [tbriData]);
  const isLoading    = loadingSess || loadingTBRI;
  const isSubmitting = creatingSession || updatingSession || creatingTBRI || updatingTBRI;

  // KPIs
  const totalSessions   = sessions.length;
  const totalActivities = activities.length;
  const sessWithNext    = sessions.filter((s) => !!s.nextSessionDate).length;

  const handleSubmit = async (fields) => {
    const { type, item } = activeForm;
    const isEditing = !!item;
    try {
      if (type === "session") {
        const payload = {
          ...(!isEditing && { childId }),
          ...(isEditing  && { id: item.id || item._id, childId }),
          ...fields,
          sessionDate:     new Date(fields.sessionDate).toISOString(),
          nextSessionDate: fields.nextSessionDate ? new Date(fields.nextSessionDate).toISOString() : null,
        };
        if (isEditing) { await updateSession(payload).unwrap(); toast.success("Session updated"); }
        else           { await createSession(payload).unwrap(); toast.success("Session recorded"); }
        refetchSess();
      } else {
        const payload = {
          ...(!isEditing && { childId }),
          ...(isEditing  && { id: item.id || item._id, childId }),
          ...fields,
          startDate: new Date(fields.startDate).toISOString(),
        };
        if (isEditing) { await updateTBRI(payload).unwrap(); toast.success("TBRI activity updated"); }
        else           { await createTBRI(payload).unwrap(); toast.success("TBRI activity saved"); }
        refetchTBRI();
      }
      setActiveForm(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save record");
    }
  };

  const handleDeleteSession = async (sess) => {
    try {
      await deleteSession(sess.id || sess._id).unwrap();
      toast.success("Session deleted");
      refetchSess();
      if (activePanel?.data?.id === (sess.id || sess._id)) setActivePanel(null);
    } catch (err) { toast.error(err?.data?.message || "Delete failed"); }
  };

  const handleDeleteTBRI = async (act) => {
    try {
      await deleteTBRI(act.id || act._id).unwrap();
      toast.success("TBRI activity deleted");
      refetchTBRI();
      if (activePanel?.data?.id === (act.id || act._id)) setActivePanel(null);
    } catch (err) { toast.error(err?.data?.message || "Delete failed"); }
  };

  const openEditSession = (sess) => { setActivePanel(null); setActiveForm({ type: "session", item: sess }); };
  const openEditTBRI    = (act)  => { setActivePanel(null); setActiveForm({ type: "tbri",    item: act  }); };

  return (
    <TabShell
      title="Psychosocial Support"
      icon={faBrain}
      actions={canCreate ? [
        { label: "Add Session",       icon: faComments,    onClick: () => setActiveForm({ type: "session", item: null }) },
        { label: "Add TBRI Activity", icon: faPuzzlePiece, onClick: () => setActiveForm({ type: "tbri",    item: null }) },
      ] : []}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.18s ease-out forwards; }
        @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scale-up-center { animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      <div className="p-5 space-y-8">
        {/* KPI Ribbon */}
        {(totalSessions + totalActivities) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Sessions",        val: totalSessions,                   cls: "bg-purple-50 text-purple-700 border border-purple-200" },
              { label: "TBRI Activities", val: totalActivities,                 cls: "bg-blue-50 text-blue-700 border border-blue-200" },
              { label: "Follow-ups",      val: sessWithNext,                    cls: "bg-amber-50 text-amber-700 border border-amber-200" },
              { label: "Total Records",   val: totalSessions + totalActivities, cls: "bg-slate-100 text-slate-700" },
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
        ) : (
          <>
            {/* Counselling Sessions */}
            <div>
              <SubSection title="Counselling Sessions" />
              {sessions.length === 0 ? (
                <EmptyState icon={faComments} message="No counselling sessions recorded yet" />
              ) : (
                <div className="space-y-3 mt-3">
                  {sessions.map((sess) => (
                    <SessionCard
                      key={sess.id || sess._id}
                      sess={sess}
                      onSelect={() => setActivePanel({ type: "session", data: sess })}
                      active={activePanel?.data?.id === (sess.id || sess._id) && activePanel?.type === "session"}
                      onDelete={handleDeleteSession}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* TBRI Activities */}
            <div>
              <SubSection title="TBRI Intervention Activities" />
              {activities.length === 0 ? (
                <EmptyState icon={faPuzzlePiece} message="No TBRI activities recorded yet" />
              ) : (
                <div className="space-y-3 mt-3">
                  {activities.map((act) => (
                    <TBRICard
                      key={act.id || act._id}
                      act={act}
                      onSelect={() => setActivePanel({ type: "tbri", data: act })}
                      active={activePanel?.data?.id === (act.id || act._id) && activePanel?.type === "tbri"}
                      onDelete={handleDeleteTBRI}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail Panels */}
      {activePanel?.type === "session" && (
        <SessionDetailPanel
          session={activePanel.data}
          onClose={() => setActivePanel(null)}
          onEdit={openEditSession}
          onDelete={handleDeleteSession}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
      {activePanel?.type === "tbri" && (
        <TBRIDetailPanel
          activity={activePanel.data}
          onClose={() => setActivePanel(null)}
          onEdit={openEditTBRI}
          onDelete={handleDeleteTBRI}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* Form Modal */}
      {activeForm && (
        <FormModal
          type={activeForm.type}
          editItem={activeForm.item}
          onClose={() => setActiveForm(null)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </TabShell>
  );
};

export default PsychosocialTab;