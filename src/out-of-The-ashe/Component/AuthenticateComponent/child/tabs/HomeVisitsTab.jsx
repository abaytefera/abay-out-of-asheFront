import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faPlus, faTrash,
  faExclamationTriangle, faCheckCircle, faClock,
  faCamera, faTimes, faImages,
  faClipboardList, faHeart, faTasks,
  faUser, faCalendarAlt, faChevronRight, faInfoCircle,
  faPencilAlt, faDownload, faSpinner, faUpload, faEllipsisV,
  faCalendarPlus, faCheck, faNotesMedical,
} from "@fortawesome/free-solid-svg-icons";
import { TabShell, EmptyState } from "./TabShell";
import {
  useGetHomeVisitsByChildQuery,
  useDeleteHomeVisitMutation,
  useCreateHomeVisitMutation,
  useUpdateHomeVisitMutation,
  useDeleteHomeVisitPhotoMutation,
} from "../../../../Redux/homeVisitsApi";
import {
  useAssignAppointmentMutation,
  useGetAppointmentsByVisitQuery,
  useGetActiveSocialWorkersQuery,
  useUpdateAppointmentStatusMutation,
  useDeleteAppointmentMutation,
} from "../../../../Redux/appointmentsApi";
import { toast } from "react-toastify";


const SERVER_BASE_URL =import.meta.env.VITE_DEFAULT_BACKEND;;

const PURPOSE_STYLES = {
  ROUTINE:           { label: "Routine",           color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-500"   },
  FOLLOW_UP:         { label: "Follow-up",         color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-500"  },
  EMERGENCY:         { label: "Emergency",         color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500"    },
  INTAKE_ASSESSMENT: { label: "Intake Assessment", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  EXIT_VISIT:        { label: "Exit Visit",        color: "bg-slate-100 text-slate-600 border-slate-200",   dot: "bg-slate-400"  },
};

// Keys match schema: PENDING | FULFILLED | CANCELED
const APPT_STATUS_STYLE = {
  PENDING:   { cls: "bg-amber-50 text-amber-700 border-amber-200",       label: "Pending"   },
  FULFILLED: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Fulfilled" },
  CANCELED:  { cls: "bg-slate-100 text-slate-500 border-slate-200",      label: "Canceled"  },
};

const photoUrl = (photo) =>
  photo.url?.startsWith("http") ? photo.url : `${SERVER_BASE_URL}${photo.url}`;

const toISODate = (val) =>
  val ? new Date(val).toISOString().split("T")[0] : "";

const inputCls =
  "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition text-sm text-slate-800 bg-white";

// ── Reminder tier badge ───────────────────────────────────────────────────────
const ReminderTierBadge = ({ assignmentDate, appointmentDate }) => {
  const totalDays = Math.round(
    (new Date(appointmentDate) - new Date(assignmentDate)) / 86_400_000
  );
  if (totalDays > 30)
    return (
      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
        Long-Term · T-7 · T-3 · Day-Of
      </span>
    );
  if (totalDays >= 14)
    return (
      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
        Mid-Term · T-3 · Day-Of
      </span>
    );
  return (
    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      Short-Term · Day-Of Only
    </span>
  );
};

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
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            {isDeleting
              ? <><FontAwesomeIcon icon={faSpinner} spin /> Deleting…</>
              : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

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

// ── Photo Dropdown ────────────────────────────────────────────────────────────
const PhotoActionDropdown = ({ url, filename, photoId, canDelete, onTriggerDelete, onDownload, positionCls = "top-2 right-2" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className={`absolute ${positionCls} z-10`} ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition shadow-md border border-white/10"
      >
        <FontAwesomeIcon icon={faEllipsisV} className="text-xs" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-slate-100 shadow-xl py-1 text-left z-20 overflow-hidden animate-fade-in">
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDownload(url, filename); }}
            className="w-full px-3 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-xs font-semibold"
          >
            <FontAwesomeIcon icon={faDownload} className="text-slate-400 w-3" /> Download File
          </button>
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onTriggerDelete(photoId); }}
              className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-bold border-t border-slate-100"
            >
              <FontAwesomeIcon icon={faTrash} className="w-3" /> Delete Photo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── APPOINTMENT ASSIGN PANEL
// Props: childId (required), canAssign
// ─────────────────────────────────────────────────────────────────────────────
const AppointmentAssignPanel = ({ childId, canAssign }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ assignedToId: "", appointmentDate: "", notes: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const { data: apptData, isLoading: loadingAppts } =
    useGetAppointmentsByVisitQuery(childId, { skip: !childId });

  const { data: swData, isLoading: loadingSW } =
    useGetActiveSocialWorkersQuery(undefined, { skip: !showForm });

  const [assignAppointment, { isLoading: isAssigning }] = useAssignAppointmentMutation();
  const [updateStatus]                                   = useUpdateAppointmentStatusMutation();
  const [deleteAppt, { isLoading: isDeletingAppt }]     = useDeleteAppointmentMutation();

  const appointments  = apptData?.data ?? [];
  const socialWorkers = swData?.data   ?? [];
  const todayStr      = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assignedToId || !form.appointmentDate) {
      toast.warn("Please select a social worker and an appointment date");
      return;
    }
    try {
      await assignAppointment({
        childId,
        assignedToId:    form.assignedToId,
        appointmentDate: new Date(form.appointmentDate).toISOString(),
        notes:           form.notes || undefined,
      }).unwrap();
      toast.success("Appointment assigned — social worker notified instantly");
      setForm({ assignedToId: "", appointmentDate: "", notes: "" });
      setShowForm(false);
    } catch (err) {
      toast.error(err?.data?.message || "Assignment failed");
    }
  };

  return (
    <div className="px-6 space-y-3">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendarPlus} className="text-purple-400" />
          Follow-Up Appointments
          {appointments.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black">
              {appointments.length}
            </span>
          )}
        </p>
        {canAssign && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold hover:bg-purple-100 transition"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="text-[10px]" />
            Assign
          </button>
        )}
      </div>

      {/* Assignment form */}
      {showForm && canAssign && (
        <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-purple-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarPlus} className="text-purple-500" />
              New Appointment Assignment
            </p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition">
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Social worker dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                Assign To <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.assignedToId}
                  onChange={(e) => setForm((p) => ({ ...p, assignedToId: e.target.value }))}
                  required
                  disabled={loadingSW}
                  className={inputCls + " appearance-none pr-8"}
                >
                  <option value="">
                    {loadingSW ? "Loading social workers…" : "— Select Social Worker —"}
                  </option>
                  {socialWorkers.map((sw) => (
                    <option key={sw.id} value={sw.id}>
                      {sw.firstName} {sw.lastName}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
              </div>
            </div>

            {/* Appointment date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                Appointment Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                required
                value={form.appointmentDate}
                onChange={(e) => setForm((p) => ({ ...p, appointmentDate: e.target.value }))}
                className={inputCls}
              />
              {form.appointmentDate && (
                <div className="mt-0.5">
                  <ReminderTierBadge
                    assignmentDate={new Date().toISOString()}
                    appointmentDate={form.appointmentDate}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Special instructions for this follow-up visit…"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className={inputCls + " resize-none"}
              />
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-sky-50 border border-sky-200 rounded-xl">
              <FontAwesomeIcon icon={faClock} className="text-sky-500 text-xs shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-700 leading-relaxed">
                The selected social worker will receive an <strong>instant notification</strong>. Automated reminders will fire based on the appointment window (T-7, T-3, or same-day).
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAssigning}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {isAssigning
                  ? <><FontAwesomeIcon icon={faSpinner} spin /> Assigning…</>
                  : <><FontAwesomeIcon icon={faCalendarPlus} /> Assign &amp; Notify</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing appointments */}
      {loadingAppts ? (
        <div className="flex justify-center py-5">
          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-300">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-2xl mb-1.5" />
          <p className="text-xs font-semibold text-slate-400">No appointments scheduled yet</p>
          {canAssign && (
            <p className="text-[11px] text-slate-300 mt-0.5">Use the Assign button above to schedule one</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => {
            const s = APPT_STATUS_STYLE[appt.status] ?? APPT_STATUS_STYLE.PENDING;
            return (
              <div key={appt.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.cls}`}>
                      {s.label}
                    </span>
                    <ReminderTierBadge
                      assignmentDate={appt.createdAt}
                      appointmentDate={appt.appointmentDate}
                    />
                  </div>

                  {/* Action buttons — only visible to PM when PENDING */}
                  {canAssign && appt.status === "PENDING" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          try {
                            await updateStatus({ id: appt.id, status: "FULFILLED" }).unwrap();
                            toast.success("Appointment marked as fulfilled");
                          } catch {
                            toast.error("Failed to update status");
                          }
                        }}
                        title="Mark fulfilled"
                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center text-xs transition border border-emerald-200"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(appt.id)}
                        title="Delete appointment"
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center text-xs transition border border-rose-200"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-primBtn text-xs" />
                  {new Date(appt.appointmentDate).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </p>

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[10px]" />
                  Assigned to:{" "}
                  <span className="font-semibold text-slate-700">
                    {appt.assignedTo?.firstName} {appt.assignedTo?.lastName}
                  </span>
                </p>

                {appt.notes && (
                  <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-2">
                    "{appt.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteAppt(confirmDeleteId).unwrap();
            toast.success("Appointment removed");
          } catch {
            toast.error("Failed to delete");
          } finally {
            setConfirmDeleteId(null);
          }
        }}
        title="Delete Appointment?"
        message="This appointment and its scheduled reminders will be permanently removed."
        isDeleting={isDeletingAppt}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── Detail Panel
// ─────────────────────────────────────────────────────────────────────────────
const DetailPanel = ({ visit, childId, onClose, onDelete, onEdit, canDelete, canEdit, canAssign }) => {
  const [lightbox, setLightbox]             = useState(null);
  const [confirmPhotoId, setConfirmPhotoId] = useState(null);
  const [confirmVisitId, setConfirmVisitId] = useState(null);
  const [deletePhoto, { isLoading: isDeletingPhoto }] = useDeleteHomeVisitPhotoMutation();

  if (!visit) return null;

  const ps        = PURPOSE_STYLES[visit.purpose] ?? PURPOSE_STYLES.ROUTINE;
  const isOverdue = visit.followUpDate && !visit.isFollowUpDone && new Date(visit.followUpDate) < new Date();

  const handlePhotoDeleteSubmit = async () => {
    if (!confirmPhotoId) return;
    try {
      await deletePhoto({ visitId: visit.id, photoId: confirmPhotoId }).unwrap();
      toast.success("Photo removed successfully");
      if (lightbox?.id === confirmPhotoId) setLightbox(null);
    } catch (err) {
      toast.error(err?.data?.message || "Could not delete photo");
    } finally {
      setConfirmPhotoId(null);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const blob    = await fetch(url).then((r) => r.blob());
      const blobUrl = window.URL.createObjectURL(blob);
      const a       = Object.assign(document.createElement("a"), { href: blobUrl, download: filename || "photo.jpg" });
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch {
      Object.assign(document.createElement("a"), { href: url, download: filename || "photo.jpg", target: "_blank" }).click();
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
        <div className="bg-gradient-to-r from-primBtn to-sky-500 px-6 py-5 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${ps.color.split(" ")[1]}`}>
              {ps.label} Visit
            </span>
            {visit.purpose === "EMERGENCY" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 rounded-xl border border-red-400/50 mt-1">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-xs animate-pulse" />
                <span className="text-white text-[11px] font-black tracking-wide">
                  EMERGENCY — Country Director Notified
                </span>
              </div>
            )}
            <h2 className="text-white font-black text-lg leading-tight">
              {new Date(visit.visitDate).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </h2>
            <p className="text-sky-100 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="text-[10px]" />
              Logged by: {visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : "System"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5">

          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Visit Overview</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <DetailRow
                icon={faCalendarAlt}
                label="Execution Date"
                value={new Date(visit.visitDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              />
              <DetailRow
                icon={faClock}
                label="Follow Up Status"
                value={
                  visit.followUpDate ? (
                    <span className={visit.isFollowUpDone ? "text-emerald-600" : isOverdue ? "text-rose-600 font-bold" : "text-amber-600"}>
                      {new Date(visit.followUpDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      {visit.isFollowUpDone ? " (Completed)" : isOverdue ? " (Overdue)" : " (Pending)"}
                    </span>
                  ) : "No follow-up planned"
                }
              />
            </div>
          </div>

          <div className="px-6 space-y-3">
            <DescBlock icon={faClipboardList} label="Observations"            value={visit.observations} bg="bg-sky-50/70 border-sky-100"       iconColor="text-sky-500"     emptyText="No observation descriptions documented." />
            <DescBlock icon={faHeart}         label="Identified Family Needs" value={visit.familyNeeds}  bg="bg-rose-50/70 border-rose-100"      iconColor="text-rose-500"    emptyText="No immediate family needs flagged."     />
            <DescBlock icon={faTasks}         label="Action Items"            value={visit.actionItems}  bg="bg-emerald-50/70 border-emerald-100" iconColor="text-emerald-500" emptyText="No explicit action tasks set."          />
          </div>

          {visit.photos?.length > 0 && (
            <div className="px-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faImages} className="text-purple-400" />
                Captured Documentation ({visit.photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {visit.photos.map((photo) => {
                  const url      = photoUrl(photo);
                  const filename = photo.publicId?.split("/").pop() || "photo.jpg";
                  return (
                    <div key={photo.id} className="group relative aspect-square rounded-xl overflow-visible border border-slate-200 bg-slate-50 shadow-sm">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover rounded-xl transition duration-200 cursor-pointer"
                        onClick={() => setLightbox({ ...photo, url, filename })}
                        onError={(e) => { e.target.src = "https://placehold.co/100?text=?"; }}
                      />
                      <PhotoActionDropdown
                        url={url}
                        filename={filename}
                        photoId={photo.id}
                        canDelete={canDelete}
                        onTriggerDelete={setConfirmPhotoId}
                        onDownload={handleDownload}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AppointmentAssignPanel receives childId (not visitId) */}
          <div className="border-t border-slate-100 pt-5">
            <AppointmentAssignPanel childId={childId} canAssign={canAssign} />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {canEdit && (
            <button
              onClick={() => onEdit(visit)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm hover:bg-sky-100 transition border border-sky-200"
            >
              <FontAwesomeIcon icon={faPencilAlt} className="text-xs" /> Edit Visit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setConfirmVisitId(visit.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete Visit
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] rounded-2xl bg-slate-950 p-2 shadow-2xl border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute mt-10 top-4 right-22 z-20 flex items-center gap-2">
              <PhotoActionDropdown
                url={lightbox.url}
                filename={lightbox.filename}
                photoId={lightbox.id}
                canDelete={canDelete}
                onTriggerDelete={setConfirmPhotoId}
                onDownload={handleDownload}
                positionCls="top-0 left-0"
              />
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute mt-10 top-4 right-4 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition z-20 border border-white/10"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
            <img
              src={lightbox.url}
              alt="Enlarged visual record"
              className="max-w-full mt-10 max-h-[80vh] object-contain rounded-xl select-none"
            />
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!confirmPhotoId}
        onClose={() => setConfirmPhotoId(null)}
        onConfirm={handlePhotoDeleteSubmit}
        title="Delete Documented Photo?"
        message="This action will permanently remove this captured photo from the home visit record."
        isDeleting={isDeletingPhoto}
      />
      <DeleteConfirmationModal
        isOpen={!!confirmVisitId}
        onClose={() => setConfirmVisitId(null)}
        onConfirm={async () => {
          await onDelete(confirmVisitId);
          setConfirmVisitId(null);
          onClose();
        }}
        title="Delete Complete Home Visit Record?"
        message="Are you absolutely sure? This eliminates all logs, recommendations, and stored photos attached to this session."
        isDeleting={false}
      />
    </>
  );
};

// ── Visit Card ────────────────────────────────────────────────────────────────
const VisitCard = ({ visit, onSelect, active, onDelete, canDelete }) => {
  const ps        = PURPOSE_STYLES[visit.purpose] ?? PURPOSE_STYLES.ROUTINE;
  const isOverdue = visit.followUpDate && !visit.isFollowUpDone && new Date(visit.followUpDate) < new Date();

  const statusIcon  = visit.isFollowUpDone ? faCheckCircle : isOverdue ? faExclamationTriangle : visit.followUpDate ? faClock : faCheckCircle;
  const statusColor = visit.isFollowUpDone ? "text-emerald-500" : isOverdue ? "text-red-500" : visit.followUpDate ? "text-amber-500" : "text-slate-400";
  const statusBg    = visit.isFollowUpDone ? "bg-emerald-50"    : isOverdue ? "bg-red-50"    : visit.followUpDate ? "bg-amber-50"    : "bg-slate-50";

  const [confirmCardDeleteId, setConfirmCardDeleteId] = useState(null);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"}`}
      >
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${ps.dot}`} />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className={`w-9 h-9 rounded-xl ${statusBg} flex items-center justify-center shrink-0 mt-0.5`}>
            <FontAwesomeIcon icon={statusIcon} className={`${statusColor} text-sm`} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${ps.color}`}>
                {visit.purpose === "EMERGENCY" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                )}
                {ps.label}
              </span>
              {visit.isFollowUpDone && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Done
                </span>
              )}
              {isOverdue && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-[9px]" /> Overdue
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[9px]" />
                {new Date(visit.visitDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[9px]" />
                {visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : "Staff Assigned"}
              </span>
              {visit.followUpDate && (
                <span className={`flex items-center gap-1.5 font-semibold ${isOverdue ? "text-red-500" : "text-amber-600"}`}>
                  <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                  Follow-up: {new Date(visit.followUpDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {visit.observations || visit.familyNeeds || visit.actionItems || (
                <span className="italic text-slate-300 flex items-center gap-1">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" /> No description details documented.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onSelect}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? "bg-primBtn text-white" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-400"}`}
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
            {canDelete && (
              <button
                onClick={() => setConfirmCardDeleteId(visit.id)}
                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-xs transition"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!confirmCardDeleteId}
        onClose={() => setConfirmCardDeleteId(null)}
        onConfirm={async () => {
          await onDelete(confirmCardDeleteId);
          setConfirmCardDeleteId(null);
        }}
        title="Delete Home Visit Log Entry?"
        message="This updates active target tracking indicators immediately. Deleted records cannot be restored."
        isDeleting={false}
      />
    </>
  );
};

// ── Photo upload row ──────────────────────────────────────────────────────────
const PhotoRow = ({ photo, onRemove }) => (
  <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl">
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      <img src={photo.preview} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 truncate">{photo.name}</p>
        <p className="text-[10px] text-slate-400 font-mono">{photo.size}</p>
        {photo.progress < 100 && (
          <div className="mt-1 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-primBtn transition-all duration-300" style={{ width: `${photo.progress}%` }} />
          </div>
        )}
        {photo.progress === 100 && (
          <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">✓ Ready</p>
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onRemove(photo.id, photo.preview)}
      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition ml-2 shrink-0"
    >
      <FontAwesomeIcon icon={faTimes} className="text-xs" />
    </button>
  </div>
);

// ── Visit Form ────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  visitDate: new Date().toISOString().split("T")[0],
  purpose: "ROUTINE",
  observations: "",
  familyNeeds: "",
  actionItems: "",
  followUpDate: "",
  isFollowUpDone: false,
};

const VisitForm = ({ editVisit, childId, onClose, onSaved }) => {
  const isEdit = !!editVisit;
  const [formData, setFormData] = useState(
    isEdit
      ? {
          visitDate:      toISODate(editVisit.visitDate),
          purpose:        editVisit.purpose,
          observations:   editVisit.observations   || "",
          familyNeeds:    editVisit.familyNeeds    || "",
          actionItems:    editVisit.actionItems    || "",
          followUpDate:   toISODate(editVisit.followUpDate),
          isFollowUpDone: editVisit.isFollowUpDone || false,
        }
      : { ...BLANK_FORM }
  );
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const allReady   = pendingPhotos.every((p) => p.progress === 100);
  const hasPending = pendingPhotos.length > 0;

  const [createHomeVisit, { isLoading: isCreating }] = useCreateHomeVisitMutation();
  const [updateHomeVisit, { isLoading: isUpdating }] = useUpdateHomeVisitMutation();
  const isSaving = isCreating || isUpdating;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const simulateProgress = (id) => {
    let pct = 0;
    const tick = setInterval(() => {
      pct = Math.min(pct + Math.random() * 30 + 10, 100);
      setPendingPhotos((prev) =>
        prev.map((ph) => ph.id === id ? { ...ph, progress: Math.round(pct) } : ph)
      );
      if (pct >= 100) clearInterval(tick);
    }, 120);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files).map((f) => ({
      id:      Math.random().toString(36).substr(2, 9),
      file:    f,
      name:    f.name,
      size:    (f.size / (1024 * 1024)).toFixed(2) + " MB",
      preview: URL.createObjectURL(f),
      progress: 0,
    }));
    setPendingPhotos((prev) => [...prev, ...files]);
    files.forEach((f) => simulateProgress(f.id));
    e.target.value = "";
  };

  const handleRemovePhoto = (id, preview) => {
    setPendingPhotos((prev) => prev.filter((ph) => ph.id !== id));
    URL.revokeObjectURL(preview);
  };

  const handleClose = () => {
    pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPendingPhotos([]);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasPending && !allReady) {
      toast.warn("Please wait — photos are still uploading");
      return;
    }
    const fd = new FormData();
    if (!isEdit) fd.append("childId", childId);
    fd.append("visitDate",      new Date(formData.visitDate).toISOString());
    fd.append("purpose",        formData.purpose);
    fd.append("observations",   formData.observations || "");
    fd.append("familyNeeds",    formData.familyNeeds  || "");
    fd.append("actionItems",    formData.actionItems  || "");
    fd.append("isFollowUpDone", formData.isFollowUpDone);
    if (formData.followUpDate) fd.append("followUpDate", new Date(formData.followUpDate).toISOString());
    pendingPhotos.forEach((p) => fd.append("photos", p.file));
    try {
      if (isEdit) {
        await updateHomeVisit({ id: editVisit.id, formData: fd }).unwrap();
        toast.success("Home visit updated");
      } else {
        await createHomeVisit(fd).unwrap();
        toast.success("Home visit logged");
      }
      handleClose();
      onSaved?.();
    } catch (err) {
      toast.error(err?.data?.message || "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white scale-80 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primBtn rounded-xl flex items-center justify-center text-white">
              <FontAwesomeIcon icon={isEdit ? faPencilAlt : faHome} className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isEdit ? "Edit Home Visit" : "Log New Home Visit"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? "Update visit details or attach more photos" : "Record visit details and attach photos"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Visit Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="visitDate"
                required
                value={formData.visitDate}
                onChange={handleInputChange}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Purpose <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className={inputCls + " appearance-none pr-8"}
                >
                  {Object.entries(PURPOSE_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
              </div>
              {formData.purpose === "EMERGENCY" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-xs shrink-0" />
                  <p className="text-[11px] text-red-700 font-semibold">
                    Country Director will be notified immediately upon submission.
                  </p>
                </div>
              )}
            </div>
          </div>

          {[
            { name: "observations", label: "Observations / Findings",        placeholder: "Describe the child's living conditions…", rows: 3 },
            { name: "familyNeeds",  label: "Identified Family Needs",        placeholder: "Food security, medical care, shelter…",    rows: 2 },
            { name: "actionItems",  label: "Action Items / Recommendations", placeholder: "What immediate steps should be taken?",    rows: 2 },
          ].map(({ name, label, placeholder, rows }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{label}</label>
              <textarea
                name={name}
                rows={rows}
                placeholder={placeholder}
                value={formData[name]}
                onChange={handleInputChange}
                className={inputCls + " resize-none"}
              />
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-700 sm:mt-5">
              <input
                type="checkbox"
                name="isFollowUpDone"
                checked={formData.isFollowUpDone}
                onChange={handleInputChange}
                className="w-4 h-4 accent-primBtn rounded"
              />
              Follow-up Completed
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <FontAwesomeIcon icon={faCamera} /> {isEdit ? "Attach Additional Photos" : "Attach Visit Photos"}
            </label>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-primBtn bg-slate-50 hover:bg-primBtn/5 rounded-2xl p-5 text-center cursor-pointer transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FontAwesomeIcon icon={faUpload} className="text-slate-300 text-2xl mb-1" />
              <p className="text-xs font-semibold text-slate-600">Click to upload photos</p>
              <p className="text-[11px] text-slate-400">PNG, JPG up to 5 MB each</p>
            </div>
            {pendingPhotos.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {pendingPhotos.map((photo) => (
                  <PhotoRow key={photo.id} photo={photo} onRemove={handleRemovePhoto} />
                ))}
              </div>
            )}
            {hasPending && !allReady && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
                <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500" />
                Preparing photos… save will unlock when all are ready.
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || (hasPending && !allReady)}
              className="flex-1 py-3 bg-primBtn hover:bg-Hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {isSaving
                ? <><FontAwesomeIcon icon={faSpinner} spin />{isEdit ? "Updating…" : "Saving…"}</>
                : isEdit ? "Update Record" : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── Main Controller
// Props: childId, canEdit, canDelete, canAssign, canCreate
// ─────────────────────────────────────────────────────────────────────────────
const HomeVisitsTab = ({
  childId,
  canCreate = false,
  canEdit   = false,
  canDelete = false,
  canAssign = false,
}) => {
  const { data: responseData, isLoading } = useGetHomeVisitsByChildQuery(childId, { skip: !childId });
  const [deleteVisit] = useDeleteHomeVisitMutation();

  const [showForm,      setShowForm]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [activeVisit,   setActiveVisit]   = useState(null);
  const [sortedVisits,  setSortedVisits]  = useState([]);

  useEffect(() => {
    const visits = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
        ? responseData.data
        : [];
    setSortedVisits([...visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)));
  }, [responseData]);

  const totalVisits  = sortedVisits.length;
  const pendingCount = sortedVisits.filter((v) => v.followUpDate && !v.isFollowUpDone).length;
  const overdueCount = sortedVisits.filter((v) => v.followUpDate && !v.isFollowUpDone && new Date(v.followUpDate) < new Date()).length;
  const doneCount    = sortedVisits.filter((v) => v.isFollowUpDone).length;
  useEffect(()=>{
console.log("sortedVisits")
console.log(sortedVisits)

  },[sortedVisits])

  const handleDelete = async (id) => {
    try {
      await deleteVisit(id).unwrap();
      toast.success("Home visit deleted cleanly");
      if (activeVisit?.id === id) setActiveVisit(null);
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const openEdit  = (visit) => { setActiveVisit(null); setEditTarget(visit); setShowForm(true); };
  const closeForm = ()      => { setShowForm(false); setEditTarget(null); };

  return (
    <TabShell
      title="Home Visits"
      icon={faHome}
      actions={
        canCreate
          ? [{ label: "Add Visit", icon: faPlus, onClick: () => { setEditTarget(null); setShowForm(true); } }]
          : []
      }
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.18s ease-out forwards; }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .scale-up-center { animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      <div className="p-5 space-y-5">
        {totalVisits > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Visits", val: totalVisits,  cls: "bg-slate-100 text-slate-700" },
              { label: "Pending F/U",  val: pendingCount, cls: "bg-amber-50 text-amber-700 border border-amber-200" },
              { label: "Overdue Logs", val: overdueCount, cls: "bg-red-50 text-red-700 border border-red-200" },
              { label: "Completed",    val: doneCount,    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
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
        ) : sortedVisits.length === 0 ? (
          <EmptyState icon={faHome} message="No home visits recorded yet" />
        ) : (
          <div className="space-y-3">
            {sortedVisits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onSelect={() => setActiveVisit(visit)}
                active={activeVisit?.id === visit.id}
                onDelete={handleDelete}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* childId passed down to DetailPanel → AppointmentAssignPanel */}
      {activeVisit && (
        <DetailPanel
          visit={activeVisit}
          childId={childId}
          onClose={() => setActiveVisit(null)}
          onDelete={handleDelete}
          onEdit={openEdit}
          canDelete={canDelete}
          canEdit={canEdit}
          canAssign={canAssign}
        />
      )}

      {showForm && (
        <VisitForm
          editVisit={editTarget}
          childId={childId}
          onClose={closeForm}
          onSaved={() => setActiveVisit(null)}
        />
      )}
    </TabShell>
  );
};

export default HomeVisitsTab;