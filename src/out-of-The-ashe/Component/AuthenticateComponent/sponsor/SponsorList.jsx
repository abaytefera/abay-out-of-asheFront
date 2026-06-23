import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch, faPlus, faUser, faGlobe, faEnvelope,
  faPhone, faBuilding, faLink, faFileAlt, faEye,
  faXmark, faChevronDown, faSave, faSpinner,
  faChevronLeft, faChevronRight, faTimes,
  faUsersLine, faFilterCircleXmark, faCamera,
  faTrash, faChild, faFileExcel, faDownload,
  faUpload, faCheckCircle, faExclamationTriangle,
  faTimesCircle, faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  useGetSponsorsQuery,
  useCreateSponsorMutation,
  useDeleteSponsorMutation,
} from "../../../Redux/Sponsors";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DashbordNav from "../DashboardComponent/DashbordNav";
import ConfirmDeleteModal from "./ConfirmDeletemodal";

// ── Constants ─────────────────────────────────────────────────────────────────
const COUNTRIES = [
  "Ethiopia","United States","United Kingdom","Canada","Germany","Australia",
  "Netherlands","Sweden","Norway","Denmark","Switzerland","France","Italy",
  "Spain","Japan","South Korea","Singapore","UAE","Saudi Arabia","Other",
];
const PAGE_SIZES = [10, 25, 50];
const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

// Bulk Excel columns
const REQUIRED_COLS = ["firstName", "lastName", "email"];
const OPTIONAL_COLS = ["phone", "country", "organization", "notes"];
const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];
const SAMPLE_ROW = [
  "Jane", "Smith", "jane.smith@hopechurch.org",
  "+1 234 567 890", "United States", "Hope Church", "Long-time supporter since 2018",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const extractError = (err) =>
  err?.data?.message || err?.data?.msg || err?.message || "Something went wrong";

const avatar = (firstName, lastName) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + " " + lastName)}&background=EEF2FF&color=4F46E5&size=80&font-size=0.4&bold=true`;

// ── Field wrapper ─────────────────────────────────────────────────────────────
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

// ── Stat chip ─────────────────────────────────────────────────────────────────
const StatChip = ({ value, label, color = "bg-slate-50 text-slate-700" }) => (
  <div className={`flex flex-col items-center px-4 py-3 rounded-2xl border border-slate-100 ${color}`}>
    <span className="text-xl font-black">{value}</span>
    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-0.5 whitespace-nowrap">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER SPONSOR MODAL (single)
// ─────────────────────────────────────────────────────────────────────────────
const RegisterModal = ({ onClose }) => {
  const [createSponsor, { isLoading }] = useCreateSponsorMutation();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    country: "", organization: "", notes: "",
  });
  const [errors, setErrors]       = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef();

  const change = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim())  errs.lastName  = "Last name is required";
    if (!form.email.trim())     errs.email     = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email address";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const toastId = toast.loading("Registering sponsor…");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) fd.append(key, value);
      });
      if (photoFile) fd.append("photos", photoFile);
      await createSponsor(fd).unwrap();
      toast.update(toastId, { render: "Sponsor registered successfully", type: "success", isLoading: false, autoClose: 3000 });
      onClose();
    } catch (err) {
      toast.update(toastId, { render: extractError(err), type: "error", isLoading: false, autoClose: 4000 });
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
              <h3 className="text-base font-bold text-slate-900">Register sponsor</h3>
              <p className="text-xs text-slate-400 mt-0.5">Fill in contact details and upload a photo</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Body */}
        <form id="sponsorForm" onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="relative">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-primBtn/30 bg-primBtn/5 hover:bg-primBtn/10 cursor-pointer flex items-center justify-center overflow-hidden transition group"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-primBtn/60 group-hover:text-primBtn transition">
                    <FontAwesomeIcon icon={faCamera} className="text-2xl" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Photo</span>
                  </div>
                )}
              </div>
              {photoPreview && (
                <button type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow text-xs hover:bg-rose-600 transition">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 text-center">
              {photoPreview ? "Tap × to remove" : "Click to upload a photo (optional)"}
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName} required>
              <input name="firstName" value={form.firstName} onChange={change} className={inputCls} placeholder="John" />
            </Field>
            <Field label="Last name" error={errors.lastName} required>
              <input name="lastName" value={form.lastName} onChange={change} className={inputCls} placeholder="Smith" />
            </Field>
          </div>
          <Field label="Email address" error={errors.email} required>
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
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
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
          <button type="submit" form="sponsorForm" disabled={isLoading}
            className="flex-[2] py-2.5 bg-primBtn text-white font-semibold rounded-xl text-sm hover:bg-Hover active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            {isLoading
              ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Saving…</>
              : <><FontAwesomeIcon icon={faSave} className="text-xs" /> Register sponsor</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK SPONSOR REGISTER MODAL
// ─────────────────────────────────────────────────────────────────────────────

// ── Bulk: row validation ──
const validateBulkRow = (row) => {
  const errors = [];
  REQUIRED_COLS.forEach((col) => {
    if (!row[col] || String(row[col]).trim() === "") errors.push(`"${col}" is required`);
  });
  if (row.email && !/\S+@\S+\.\S+/.test(String(row.email).trim()))
    errors.push(`"email" must be a valid email address`);
  if (row.country && !COUNTRIES.includes(String(row.country).trim()))
    errors.push(`"country" must be one of the accepted values (or leave blank)`);
  return errors;
};

// ── Bulk: template download ──
const downloadBulkTemplate = async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sponsors");
  ws.addRow(ALL_COLS);
  ws.addRow(SAMPLE_ROW);
  const req = new Set(REQUIRED_COLS);
  ALL_COLS.forEach((col, i) => {
    const cell = ws.getRow(1).getCell(i + 1);
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: req.has(col) ? "FFFFD6D6" : "FFD6E8FF" },
    };
    ws.getColumn(i + 1).width = 26;
  });
  const countryColIdx = ALL_COLS.indexOf("country") + 1;
  for (let r = 2; r <= 500; r++) {
    ws.getCell(r, countryColIdx).dataValidation = {
      type: "list", allowBlank: true,
      formulae: [`"${COUNTRIES.join(",")}"`],
      showErrorMessage: true, errorTitle: "Invalid country",
      error: "Please select a country from the list",
    };
  }
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), "sponsor_registration_template.xlsx");
};

// ── Bulk: status badge ──
const BulkStatusBadge = ({ status }) => {
  const map = {
    valid:   { cls: "bg-emerald-50 text-emerald-600",            label: "Valid" },
    error:   { cls: "bg-rose-50 text-rose-600",                  label: "Errors" },
    loading: { cls: "bg-sky-50 text-sky-600",                    label: "Saving…" },
    success: { cls: "bg-emerald-100 text-emerald-700 font-bold", label: "✓ Registered" },
    failed:  { cls: "bg-rose-100 text-rose-700 font-bold",       label: "✗ Failed" },
  };
  const s = map[status] || map.valid;
  return (
    <span className={`text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
};

const BulkRegisterModal = ({ onClose }) => {
  const [createSponsor] = useCreateSponsorMutation();
  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const inputRef = useRef();

  const handleDownloadTemplate = async () => {
    try { setTemplateLoading(true); await downloadBulkTemplate(); }
    catch { toast.error("Could not generate the template."); }
    finally { setTemplateLoading(false); }
  };

  const parseFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Please upload an .xlsx, .xls, or .csv file."); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (raw.length === 0) { toast.warning("The file is empty."); return; }
        const normalised = raw.map((r) => {
          const out = {};
          Object.keys(r).forEach((k) => { out[k.trim()] = r[k]; });
          return out;
        });
        const missing = REQUIRED_COLS.filter((c) => !(c in normalised[0]));
        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(", ")}. Download the template.`); return;
        }
        const processed = normalised.map((row, i) => {
          Object.keys(row).forEach((k) => { if (typeof row[k] === "string") row[k] = row[k].trim(); });
          const errors = validateBulkRow(row);
          return { id: i, data: row, errors, status: errors.length === 0 ? "valid" : "error", serverMsg: "" };
        });
        setRows(processed);
        const errCount = processed.filter((r) => r.status === "error").length;
        errCount > 0
          ? toast.warning(`${processed.length} rows parsed — ${errCount} have validation errors.`)
          : toast.success(`${processed.length} valid sponsor records ready to register!`);
      } catch {
        toast.error("Could not read the file. Make sure it matches the template format.");
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const onFileChange = (e) => parseFile(e.target.files[0]);
  const onDrop = (e) => { e.preventDefault(); setDragging(false); parseFile(e.dataTransfer.files[0]); };
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const submitRow = async (row) => {
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "loading" } : r));
    const fd = new FormData();
    Object.entries(row.data).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) fd.append(key, value);
    });
    try {
      await createSponsor(fd).unwrap();
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "success", serverMsg: "Registered!" } : r));
    } catch (err) {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "failed", serverMsg: extractError(err) } : r));
    }
  };

  const submitAll = async () => {
    const toSubmit = rows.filter((r) => r.status === "valid");
    if (toSubmit.length === 0) { toast.warning("No valid rows to submit."); return; }
    toast.info(`Registering ${toSubmit.length} sponsors…`);
    for (const row of toSubmit) await submitRow(row);
    toast.success("Bulk registration complete!");
  };

  const validCount   = rows.filter((r) => r.status === "valid").length;
  const errorCount   = rows.filter((r) => r.status === "error").length;
  const successCount = rows.filter((r) => r.status === "success").length;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8">
      <div className="max-w-5xl mx-auto pt-4 pb-12">
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow transition">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-sm">
                  <FontAwesomeIcon icon={faFileExcel} />
                </span>
                Bulk Sponsor Registration
              </h2>
              <p className="text-xs text-slate-400 mt-1 ml-1">
                Upload a spreadsheet to register multiple sponsors at once.
              </p>
            </div>
            <button onClick={handleDownloadTemplate} disabled={templateLoading}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-md transition-all text-sm whitespace-nowrap">
              <FontAwesomeIcon icon={templateLoading ? faSpinner : faDownload} spin={templateLoading} />
              {templateLoading ? "Generating…" : "Download Template"}
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-[2rem] border-2 border-dashed p-12 flex flex-col items-center gap-4 transition-all duration-300
              ${dragging ? "border-sky-400 bg-sky-50 scale-[1.01]" : "border-slate-200 bg-slate-50 hover:border-primBtn hover:bg-sky-50/40"}`}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
            <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center text-primBtn">
              <FontAwesomeIcon icon={faUpload} size="lg" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700">Drag & drop your sponsor spreadsheet here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse — .xlsx, .xls, .csv supported</p>
            </div>
          </div>

          {/* Stats */}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Rows",  val: rows.length,    cls: "bg-slate-100 text-slate-700" },
                { label: "Valid",       val: validCount,      cls: "bg-emerald-50 text-emerald-700" },
                { label: "Errors",      val: errorCount,      cls: "bg-rose-50 text-rose-700" },
                { label: "Registered",  val: successCount,    cls: "bg-sky-50 text-sky-700" },
              ].map(({ label, val, cls }) => (
                <div key={label} className={`${cls} rounded-2xl p-4 flex flex-col items-center`}>
                  <span className="text-3xl font-black">{val}</span>
                  <span className="text-xs font-medium mt-1">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {rows.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["#", "Name", "Email", "Phone", "Country", "Organization", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-slate-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <React.Fragment key={row.id}>
                        <tr className={`transition-colors ${
                          row.status === "success" ? "bg-emerald-50/40"
                          : row.status === "failed" ? "bg-rose-50/40"
                          : "hover:bg-slate-50"
                        }`}>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {row.data.firstName} {row.data.lastName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.data.email || "—"}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{row.data.phone || "—"}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{row.data.country || "—"}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{row.data.organization || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <BulkStatusBadge status={row.status} />
                              {row.serverMsg && <span className="text-xs text-slate-500">{row.serverMsg}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {row.errors.length > 0 && (
                                <button onClick={() => setExpandedErrors(expandedErrors === row.id ? null : row.id)}
                                  title="Show errors"
                                  className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors">
                                  <FontAwesomeIcon icon={faExclamationTriangle} size="xs" />
                                </button>
                              )}
                              {(row.status === "valid" || row.status === "failed") && (
                                <button onClick={() => submitRow(row)} title="Register this sponsor"
                                  className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 hover:bg-sky-200 flex items-center justify-center transition-colors">
                                  <FontAwesomeIcon icon={faCheckCircle} size="xs" />
                                </button>
                              )}
                              {row.status === "loading" && (
                                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faSpinner} spin className="text-sky-500 text-xs" />
                                </div>
                              )}
                              {row.status !== "loading" && row.status !== "success" && (
                                <button onClick={() => removeRow(row.id)} title="Remove row"
                                  className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 hover:bg-rose-200 flex items-center justify-center transition-colors">
                                  <FontAwesomeIcon icon={faTrash} size="xs" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedErrors === row.id && (
                          <tr className="bg-rose-50">
                            <td colSpan={8} className="px-6 py-3">
                              <p className="text-xs font-bold text-rose-700 mb-1">Validation errors:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {row.errors.map((e, ei) => (
                                  <li key={ei} className="text-xs text-rose-600">{e}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <button onClick={() => { setRows([]); if (inputRef.current) inputRef.current.value = ""; }}
                  className="flex items-center gap-2 text-slate-500 hover:text-rose-500 font-bold transition-colors text-sm">
                  <FontAwesomeIcon icon={faTimesCircle} /> Clear All
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{validCount} of {rows.length} ready to register</span>
                  <button onClick={submitAll} disabled={validCount === 0}
                    className="bg-primBtn disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-sky-200 hover:bg-Hover hover:scale-105 transition-all flex items-center gap-3">
                    <FontAwesomeIcon icon={faUsers} />
                    Register All ({validCount})
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Column guide */}
          <details className="rounded-2xl border border-slate-200 overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer font-bold text-slate-600 text-sm bg-slate-50 hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
              <span>📋 Column Reference</span>
              <span className="text-xs font-normal text-slate-400">Toggle</span>
            </summary>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {REQUIRED_COLS.map((c) => (
                  <div key={c} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <code className="bg-slate-100 px-2 py-1 rounded-lg text-slate-700 font-mono">{c}</code>
                    <span className="text-rose-500 text-[10px]">required</span>
                  </div>
                ))}
                {OPTIONAL_COLS.map((c) => (
                  <div key={c} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <code className="bg-slate-100 px-2 py-1 rounded-lg text-slate-700 font-mono">{c}</code>
                    <span className="text-slate-400 text-[10px]">optional</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                <strong>Accepted country values:</strong> {COUNTRIES.join(", ")}
                <span className="block mt-1 text-slate-400">
                  The "country" column in the downloaded template has a built-in dropdown with these values.
                </span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SPONSOR LIST PAGE
// ─────────────────────────────────────────────────────────────────────────────
const SponsorList = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading } = useGetSponsorsQuery();
  const [deleteSponsor, { isLoading: deleting }] = useDeleteSponsorMutation();
  const { user } = useSelector((state) => state.auth);

  const sponsors = Array.isArray(rawData) ? rawData : (rawData?.data || []);
  const canEdit   = user.role === "ADMIN";
  const canDelete = user.role === "ADMIN";
  const canCreate = user.role === "ADMIN";

  const [search,        setSearch]        = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [showRegister,  setShowRegister]  = useState(false);
  const [showBulk,      setShowBulk]      = useState(false);
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [pendingDelete, setPendingDelete] = useState(null);

  const countryOptions = useMemo(() =>
    [...new Set(sponsors.map(s => s.country).filter(Boolean))],
    [sponsors]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const country = countryFilter;
    return sponsors.filter(s => {
      const matchCountry = !country || s.country === country;
      if (!q) return matchCountry;
      const sponsorMatch =
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.organization || "").toLowerCase().includes(q);
      const childMatch = (s.sponsorships || []).some(sp => {
        const c = sp.child;
        if (!c) return false;
        return (
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          (c.childCode || "").toLowerCase().includes(q)
        );
      });
      return matchCountry && (sponsorMatch || childMatch);
    });
  }, [sponsors, search, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = sponsors.filter(s => (s.sponsorships || []).some(sp => sp.isActive)).length;

  const onSearch  = useCallback((e) => { setSearch(e.target.value); setPage(1); }, []);
  const onCountry = useCallback((e) => { setCountryFilter(e.target.value); setPage(1); }, []);
  const clearFilters = () => { setSearch(""); setCountryFilter(""); setPage(1); };
  const hasFilters = search || countryFilter;

  const requestDelete = (e, sponsor) => { e.stopPropagation(); setPendingDelete(sponsor); };

  const handleConfirmedDelete = async () => {
    if (!pendingDelete) return;
    const toastId = toast.loading("Deleting sponsor…");
    try {
      await deleteSponsor(pendingDelete.id).unwrap();
      toast.update(toastId, { render: "Sponsor deleted successfully", type: "success", isLoading: false, autoClose: 3000 });
      setPendingDelete(null);
      setPage(p => (paginated.length === 1 && p > 1 ? p - 1 : p));
    } catch (err) {
      toast.update(toastId, { render: extractError(err), type: "error", isLoading: false, autoClose: 4000 });
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1,2,3,4,5,"…",totalPages];
    if (page >= totalPages - 3) return [1,"…",totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,"…",page-1,page,page+1,"…",totalPages];
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <DashbordNav />
      <ToastContainer position="top-right" autoClose={3000} newestOnTop theme="light" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-primBtn flex items-center justify-center">
                <FontAwesomeIcon icon={faUsersLine} className="text-white text-sm" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sponsors</h1>
            </div>
            <p className="text-sm text-slate-500 ml-10">Manage and track all sponsor relationships</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              <StatChip value={sponsors.length} label="Total" color="bg-white text-slate-700" />
              <StatChip value={activeCount} label="Active" color="bg-green-50 text-green-700" />
            </div>
            {canCreate && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRegister(true)}
                  className="flex items-center gap-2 bg-primBtn hover:bg-Hover active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all">
                  <FontAwesomeIcon icon={faPlus} className="text-xs" /> Register sponsor
                </button>
                <button onClick={() => setShowBulk(true)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-primBtn hover:text-primBtn text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
                  <FontAwesomeIcon icon={faFileExcel} className="text-xs text-emerald-600" /> Bulk Upload
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
            <input type="search" value={search} onChange={onSearch}
              placeholder="Search by sponsor name, email, or child name…"
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition bg-slate-50 placeholder:text-slate-300" />
          </div>
          <div className="relative min-w-[180px]">
            <FontAwesomeIcon icon={faGlobe} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none" />
            <select value={countryFilter} onChange={onCountry}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition cursor-pointer appearance-none">
              <option value="">All countries</option>
              {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none" />
          </div>
          <div className="relative">
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-10 pl-4 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition cursor-pointer appearance-none">
              {PAGE_SIZES.map(s => <option key={s} value={s}>Show {s}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-500 hover:border-rose-200 text-sm font-medium flex items-center gap-2 transition shrink-0">
              <FontAwesomeIcon icon={faFilterCircleXmark} className="text-xs" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Loading sponsors…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
                <FontAwesomeIcon icon={faUser} className="text-2xl text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {hasFilters ? "No sponsors match your filters" : "No sponsors yet"}
              </p>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="mt-1 text-xs text-primBtn font-bold hover:underline flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTimes} className="text-[10px]" /> Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Sponsor","Email","Phone","Country","Organization","Children",""].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap bg-slate-50/80">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((sponsor, idx) => {
                    const childCount = (sponsor.sponsorships || []).filter(s => s.isActive).length;
                    return (
                      <tr key={sponsor.id}
                        onClick={() => navigate(`/sponsors/${sponsor.id}`)}
                        className={`group border-b border-slate-50 last:border-0 hover:bg-primBtn/5 transition-colors cursor-pointer ${idx % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={sponsor.photos?.[0]?.url ? `${API_URL}${sponsor.photos[0].url}` : avatar(sponsor.firstName, sponsor.lastName)}
                              alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 whitespace-nowrap">
                                {sponsor.firstName} {sponsor.lastName}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                #{sponsor.id?.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                            <FontAwesomeIcon icon={faEnvelope} className="text-slate-300 text-xs shrink-0" />
                            <span className="truncate max-w-[180px] text-sm">{sponsor.email || <span className="text-slate-300">—</span>}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faPhone} className="text-slate-300 text-xs shrink-0" />
                            <span className="text-sm">{sponsor.phone || <span className="text-slate-300">—</span>}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {sponsor.country
                            ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg"><FontAwesomeIcon icon={faGlobe} className="text-slate-400 text-[10px]" />{sponsor.country}</span>
                            : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {sponsor.organization
                            ? <div className="flex items-center gap-1.5 text-slate-600"><FontAwesomeIcon icon={faBuilding} className="text-slate-300 text-xs shrink-0" /><span className="truncate max-w-[150px] text-sm">{sponsor.organization}</span></div>
                            : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${childCount > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                            <FontAwesomeIcon icon={faChild} className="text-[10px]" />
                            {childCount} {childCount === 1 ? "child" : "children"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/sponsors/${sponsor.id}`); }} title="View sponsor"
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primBtn hover:border-primBtn/40 hover:bg-primBtn/5 flex items-center justify-center transition text-xs">
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/sponsors/${sponsor.id}?tab=link`); }} title="Link to child"
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primBtn hover:border-primBtn/40 hover:bg-primBtn/5 flex items-center justify-center transition text-xs">
                              <FontAwesomeIcon icon={faLink} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/sponsors/${sponsor.id}?tab=report`); }} title="Generate report"
                              className="w-8 h-8 rounded-lg border border-primBtn/20 bg-primBtn/5 text-primBtn hover:bg-primBtn hover:text-white flex items-center justify-center transition text-xs">
                              <FontAwesomeIcon icon={faFileAlt} />
                            </button>
                            {canDelete && (
                              <button onClick={(e) => requestDelete(e, sponsor)} disabled={deleting} title="Delete sponsor"
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition text-xs disabled:opacity-50">
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-slate-400 font-medium">
                {Math.min((page-1)*pageSize+1, filtered.length)}–{Math.min(page*pageSize, filtered.length)} of {filtered.length} sponsors
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primBtn hover:border-primBtn/40 flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed text-xs">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                {pageNumbers.map((p, i) =>
                  p === "…"
                    ? <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-300 text-xs">…</span>
                    : <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition border ${p===page ? "bg-primBtn text-white border-primBtn shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-primBtn/40 hover:text-primBtn"}`}>
                        {p}
                      </button>
                )}
                <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primBtn hover:border-primBtn/40 flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed text-xs">
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Single register modal */}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}

      {/* Bulk register modal */}
      {showBulk && <BulkRegisterModal onClose={() => setShowBulk(false)} />}

      {/* Confirm delete modal */}
      <ConfirmDeleteModal
        open={!!pendingDelete}
        title="Delete sponsor"
        message={pendingDelete ? `Delete ${pendingDelete.firstName} ${pendingDelete.lastName}? This cannot be undone.` : ""}
        loading={deleting}
        onConfirm={handleConfirmedDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default SponsorList;