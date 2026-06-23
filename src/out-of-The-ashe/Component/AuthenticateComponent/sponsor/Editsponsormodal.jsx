import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faXmark, faChevronDown, faSave, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { useUpdateSponsorMutation } from "../../../Redux/Sponsors";

// NOTE: this assumes a `useUpdateSponsorMutation` hook exists in Redux/Sponsors,
// pointing at PATCH /sponsors/:id (already implemented in sponsorship.router.ts).
// If your Sponsors api slice doesn't have it yet, add an endpoint like:
//
// updateSponsor: builder.mutation({
//   query: ({ id, ...body }) => ({ url: `/sponsors/${id}`, method: "PATCH", body }),
//   invalidatesTags: ["Sponsors"],
// }),

const COUNTRIES = [
  "Ethiopia","United States","United Kingdom","Canada","Germany","Australia",
  "Netherlands","Sweden","Norway","Denmark","Switzerland","France","Italy",
  "Spain","Japan","South Korea","Singapore","UAE","Saudi Arabia","Other",
];

const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {label}{required && <span className="text-rose-400 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-rose-400 inline-block" />
        {error}
      </p>
    )}
  </div>
);

const inputCls =
  "h-10 w-full px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition";

const EditSponsorModal = ({ sponsor, onClose }) => {
  const [updateSponsor, { isLoading }] = useUpdateSponsorMutation();

  const [form, setForm] = useState({
    firstName: sponsor.firstName || "",
    lastName: sponsor.lastName || "",
    email: sponsor.email || "",
    phone: sponsor.phone || "",
    country: sponsor.country || "",
    organization: sponsor.organization || "",
    notes: sponsor.notes || "",
  });
  const [errors, setErrors] = useState({});

  const change = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email address";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      await updateSponsor({ id: sponsor.id, ...form }).unwrap();
      toast.success("Sponsor details updated");
      onClose();
    } catch (err) {
      toast.error(err?.data?.msg || err?.data?.message || "Failed to update sponsor");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primBtn/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-primBtn text-sm" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit sponsor</h3>
              <p className="text-xs text-slate-400 mt-0.5">Update this sponsor's contact details</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Body */}
        <form id="editSponsorForm" onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName} required>
              <input name="firstName" value={form.firstName} onChange={change} className={inputCls} placeholder="John" />
            </Field>
            <Field label="Last name" error={errors.lastName} required>
              <input name="lastName" value={form.lastName} onChange={change} className={inputCls} placeholder="Smith" />
            </Field>
          </div>

          <Field label="Email address" error={errors.email}>
            <input type="email" name="email" value={form.email} onChange={change} className={inputCls} placeholder="john@example.com" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input name="phone" value={form.phone} onChange={change} className={inputCls} placeholder="+1 234 567 890" />
            </Field>
            <Field label="Country">
              <div className="relative">
                <select name="country" value={form.country} onChange={change}
                  className={inputCls + " pr-9 appearance-none cursor-pointer"}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <FontAwesomeIcon icon={faChevronDown}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
              </div>
            </Field>
          </div>

          <Field label="Organization / Church">
            <input name="organization" value={form.organization} onChange={change} className={inputCls} placeholder="Hope Church, UNICEF, etc." />
          </Field>

          <Field label="Notes">
            <textarea name="notes" value={form.notes} onChange={change} rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition resize-none"
              placeholder="Any additional context about this sponsor…" />
          </Field>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" form="editSponsorForm" disabled={isLoading}
            className="flex-[2] py-2.5 bg-primBtn text-white font-semibold rounded-xl text-sm hover:bg-Hover active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            {isLoading
              ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Saving…</>
              : <><FontAwesomeIcon icon={faSave} className="text-xs" /> Save changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSponsorModal;