import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarPlus, faUser, faCalendarAlt,
  faNotesMedical, faSpinner, faTimes, faCheck,
  faTrash, faClock, faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import {
  useAssignAppointmentMutation,
  useGetAppointmentsByVisitQuery,
  useGetActiveSocialWorkersQuery,
  useUpdateAppointmentStatusMutation,
  useDeleteAppointmentMutation,
} from "../../../../Redux/notificationsApi";
import { toast } from "react-toastify";

const STATUS_STYLE = {
  PENDING:   { cls: "bg-amber-50 text-amber-700 border-amber-200",   label: "Pending"   },
  COMPLETED: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed" },
  CANCELLED: { cls: "bg-slate-100 text-slate-500 border-slate-200",  label: "Cancelled" },
};

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
        Long-Term · T-7, T-3, Day-Of alerts
      </span>
    );
  if (totalDays >= 14)
    return (
      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
        Mid-Term · T-3, Day-Of alerts
      </span>
    );
  return (
    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
      Short-Term · Day-Of alert only
    </span>
  );
};

// ── Existing appointments list ────────────────────────────────────────────────
const AppointmentRow = ({ appt, canManage }) => {
  const [updateStatus] = useUpdateAppointmentStatusMutation();
  const [deleteAppt]   = useDeleteAppointmentMutation();
  const s = STATUS_STYLE[appt.status] || STATUS_STYLE.PENDING;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.cls}`}>
              {s.label}
            </span>
            <ReminderTierBadge
              assignmentDate={appt.createdAt}
              appointmentDate={appt.appointmentDate}
            />
          </div>
          <p className="text-sm font-bold text-slate-800">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-primBtn text-xs mr-1.5" />
            {new Date(appt.appointmentDate).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
          <p className="text-xs text-slate-500">
            <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[10px] mr-1" />
            Assigned to:{" "}
            <span className="font-semibold text-slate-700">
              {appt.assignedTo.firstName} {appt.assignedTo.lastName}
            </span>
          </p>
          {appt.notes && (
            <p className="text-xs text-slate-400 italic">"{appt.notes}"</p>
          )}
        </div>

        {canManage && appt.status === "PENDING" && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={async () => {
                try {
                  await updateStatus({ id: appt.id, status: "COMPLETED" }).unwrap();
                  toast.success("Appointment marked completed");
                } catch { toast.error("Failed to update"); }
              }}
              className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center text-xs transition border border-emerald-200"
              title="Mark as completed"
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button
              onClick={async () => {
                try {
                  await deleteAppt(appt.id).unwrap();
                  toast.success("Appointment removed");
                } catch { toast.error("Failed to delete"); }
              }}
              className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center text-xs transition border border-rose-200"
              title="Delete appointment"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────
const AppointmentAssignPanel = ({ visitId, canAssign = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ assignedToId: "", appointmentDate: "", notes: "" });

  const { data: apptData, isLoading: loadingAppts } =
    useGetAppointmentsByVisitQuery(visitId, { skip: !visitId });

  const { data: swData, isLoading: loadingSW } =
    useGetActiveSocialWorkersQuery(undefined, { skip: !showForm });

  const [assignAppointment, { isLoading: isAssigning }] = useAssignAppointmentMutation();

  const appointments   = apptData?.data  ?? [];
  const socialWorkers  = swData?.data    ?? [];

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assignedToId || !form.appointmentDate) {
      toast.warn("Please select a social worker and appointment date");
      return;
    }
    try {
      await assignAppointment({
        homeVisitId:     visitId,
        assignedToId:    form.assignedToId,
        appointmentDate: new Date(form.appointmentDate).toISOString(),
        notes:           form.notes || undefined,
      }).unwrap();
      toast.success("Appointment assigned — social worker notified");
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
        </p>
        {canAssign && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold hover:bg-purple-100 transition"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="text-[10px]" />
            Assign Appointment
          </button>
        )}
      </div>

      {/* Assignment form */}
      {showForm && canAssign && (
        <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-black text-purple-800">New Appointment Assignment</p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition">
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Social Worker dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                Assign To <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.assignedToId}
                  onChange={(e) => setForm((p) => ({ ...p, assignedToId: e.target.value }))}
                  required
                  className={inputCls + " appearance-none pr-8"}
                  disabled={loadingSW}
                >
                  <option value="">
                    {loadingSW ? "Loading workers…" : "Select Social Worker"}
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

            {/* Date picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                Appointment Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={form.appointmentDate}
                onChange={(e) => setForm((p) => ({ ...p, appointmentDate: e.target.value }))}
                required
                className={inputCls}
              />
              {/* Show reminder tier preview in real-time */}
              {form.appointmentDate && (
                <div className="mt-1">
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
                Notes (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Any special instructions for this follow-up…"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className={inputCls + " resize-none"}
              />
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-700">
              <FontAwesomeIcon icon={faClock} className="shrink-0 mt-0.5 text-sky-500" />
              <span>
                The assigned social worker will receive an instant notification. Automated reminders will be sent based on the appointment window.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
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
                {isAssigning ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Assigning…</>
                ) : (
                  <><FontAwesomeIcon icon={faCalendarPlus} /> Assign & Notify</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing appointments */}
      {loadingAppts ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center py-5 text-slate-300 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-2xl mb-1.5" />
          <p className="text-xs font-semibold text-slate-400">No appointments scheduled yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => (
            <AppointmentRow key={appt.id} appt={appt} canManage={canAssign} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentAssignPanel;