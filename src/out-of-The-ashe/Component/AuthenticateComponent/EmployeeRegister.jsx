import React, { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faEyeSlash, faUser, faEnvelope, faPhone,
  faLock, faBriefcase, faArrowRight, faBuilding, faCalendarAlt,
  faCheckCircle, faCircle, faFileExcel, faDownload, faUpload,
  faTrash, faExclamationTriangle, faSpinner, faTimesCircle,
  faUserPlus, faUsers
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useCreateEmployeeMutation } from "../../Redux/Employee";
import { toast, ToastContainer } from "react-toastify";

// ─── Excel bulk helpers (Mapped to Prisma User Schema) ────────────────────────
const REQUIRED_COLS = ["firstName", "lastName", "email", "password", "role"];
const OPTIONAL_COLS = ["phone", "jobTitle", "department", "hireDate"];
const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];

// Exact matches for Prisma enum UserRole
const VALID_ROLES = [
  "SOCIAL_WORKER",
  "EDUCATION_OFFICER",
  "FINANCE_OFFICER",
  "PROGRAM_MANAGER",
  "HEALTH_OFFICER",
  "PSYCHOSOCIAL_OFFICER",
  "COUNTRY_DIRECTOR",
  "ADMIN"
];

// Helper to format role text for display UI
const formatRoleLabel = (role) => {
  return role.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

// ─── Password strength checker ────────────────────────────────────────────────
const checkPassword = (pwd) => {
  const p = String(pwd || "");
  return {
    length:  p.length >= 8,
    upper:   /[A-Z]/.test(p),
    lower:   /[a-z]/.test(p),
    number:  /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
};

const isPasswordStrong = (pwd) => {
  if (!pwd) return false;
  return Object.values(checkPassword(pwd)).every(Boolean);
};

const PasswordStrengthBox = ({ password, confirmPassword }) => {
  const r = checkPassword(password);
  const match = password && password === confirmPassword;
  const items = [
    { met: r.length,  text: "Min 8 characters" },
    { met: r.upper,   text: "Uppercase (A-Z)" },
    { met: r.lower,   text: "Lowercase (a-z)" },
    { met: r.number,  text: "Number (0-9)" },
    { met: r.special, text: "Special char (!@#…)" },
    { met: match,     text: "Passwords match" },
  ];
  if (!password) return null;
  return (
    <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Password Requirements</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {items.map(({ met, text }) => (
          <div key={text} className={`flex items-center gap-2 text-xs font-medium transition-colors ${met ? "text-emerald-600" : "text-slate-400"}`}>
            <FontAwesomeIcon icon={met ? faCheckCircle : faCircle} className={met ? "text-xs text-emerald-500" : "text-[6px] opacity-50"} />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

const validateBulkRow = (row) => {
  const errors = [];
  REQUIRED_COLS.forEach((col) => {
    if (!row[col] || String(row[col]).trim() === "") errors.push(`"${col}" is required`);
  });
  if (row.role && !VALID_ROLES.includes(String(row.role).toUpperCase().trim())) {
    errors.push(`"role" must be one of: ${VALID_ROLES.join(", ")}`);
  }
  if (row.password && String(row.password).trim() !== "" && !isPasswordStrong(row.password)) {
    errors.push(`"password" must have 8+ chars, uppercase, lowercase, number & special character`);
  }
  return errors;
};

// ─── Template download (with real in-cell role dropdown via ExcelJS) ──────────
const SAMPLE_ROW = [
  "John", "Doe", "john.doe@outoftheashes.org", "SecureP@ss123", "SOCIAL_WORKER",
  "+251911000000", "Social Worker", "Programs", "2026-06-01",
];

const buildDropdownList = (values) => `"${values.join(",")}"`;

const downloadTemplate = async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Employees");

  // Header + sample row
  ws.addRow(ALL_COLS);
  ws.addRow(SAMPLE_ROW);

  // Style header (required = light red, optional = light blue)
  const req = new Set(REQUIRED_COLS);
  ALL_COLS.forEach((col, i) => {
    const cell = ws.getRow(1).getCell(i + 1);
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: req.has(col) ? "FFFFD6D6" : "FFD6E8FF" },
    };
    ws.getColumn(i + 1).width = 22;
  });

  const colIndex = (name) => ALL_COLS.indexOf(name) + 1; // 1-based
  const LAST_ROW = 500; // pre-apply dropdown down to row 500 for bulk entry

  // ── Role dropdown (Prisma UserRole enum) ──
  const roleCol = colIndex("role");
  for (let r = 2; r <= LAST_ROW; r++) {
    ws.getCell(r, roleCol).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [buildDropdownList(VALID_ROLES)],
      showErrorMessage: true,
      errorTitle: "Invalid role",
      error: `Please choose one of: ${VALID_ROLES.join(", ")}`,
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    "employee_registration_template.xlsx"
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    valid:   { cls: "bg-emerald-50 text-emerald-600", label: "Valid" },
    error:   { cls: "bg-rose-50 text-rose-600",       label: "Errors" },
    loading: { cls: "bg-sky-50 text-sky-600",         label: "Submitting…" },
    success: { cls: "bg-emerald-100 text-emerald-700 font-bold", label: "✓ Created" },
    failed:  { cls: "bg-rose-100 text-rose-700 font-bold",       label: "✗ Failed" },
  };
  const s = map[status] || map.valid;
  return (
    <span className={`text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ─── Reusable Input ───────────────────────────────────────────────────────────
const InputGroup = ({ id, label, type = "text", icon, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primBtn transition-colors">
        <FontAwesomeIcon icon={icon} />
      </div>
      <input
        id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primBtn focus:ring-1 focus:ring-sky-50 outline-none transition-all font-medium text-slate-700"
      />
    </div>
  </div>
);

// ─── Reusable Select ──────────────────────────────────────────────────────────
const SelectGroup = ({ id, label, icon, value, onChange, options }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primBtn transition-colors">
        <FontAwesomeIcon icon={icon} />
      </div>
      <select
        id={id} value={value} onChange={onChange}
        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primBtn outline-none transition-all font-bold text-slate-700 appearance-none"
      >
        <option value="">Choose {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{formatRoleLabel(opt)}</option>)}
      </select>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE REGISTER
// ═══════════════════════════════════════════════════════════════════════════════
const SingleRegister = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "", role: "", jobTitle: "", department: "", hireDate: ""
  });

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const validateStep1 = () => {
    const { firstName, lastName, email, password, confirmPassword } = form;
    if (!firstName || !lastName || !email || !password)
      return toast.error("Please complete all core profile details");
    if (!isPasswordStrong(password))
      return toast.error("Password must be 8+ chars with uppercase, lowercase, number & special character");
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.role) return toast.error("Please assign a structural user role");
    
    // Construct database payload matching the schema precisely
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      role: form.role,
      phone: form.phone || null,
      jobTitle: form.jobTitle || null,
      department: form.department || null,
      hireDate: form.hireDate ? new Date(form.hireDate).toISOString() : null
    };

    try {
      await createEmployee(payload).unwrap();
      toast.success("Employee account successfully created");
      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", role: "", jobTitle: "", department: "", hireDate: "" });
      setStep(1);
    } catch (error) {
      console.log(error)
      toast.error(error?.data?.message || "Failed to create account");
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white p-8 md:p-12">
      {/* Stepper */}
      <div className="mb-10 flex justify-center gap-4">
        {[{ n: 1, label: "Account Info" }, { n: 2, label: "HR Placement" }].map(({ n, label }) => (
          <div key={n} className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold transition-all ${step === n ? "bg-primBtn text-white shadow-lg shadow-sky-200" : "bg-slate-100 text-slate-400"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{n}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {step === 1 ? (
          <>
            <InputGroup id="firstName"       label="First Name"       icon={faUser}          value={form.firstName}       onChange={handleChange} placeholder="John" />
            <InputGroup id="lastName"        label="Last Name"        icon={faUser}          value={form.lastName}        onChange={handleChange} placeholder="Doe" />
            <InputGroup id="email"           label="Email Address"    type="email" icon={faEnvelope}      value={form.email}           onChange={handleChange} placeholder="john@outoftheashes.org" />
            <InputGroup id="phone"           label="Phone Number"     type="tel"   icon={faPhone}        value={form.phone}           onChange={handleChange} placeholder="+251..." />
            <div className="relative">
              <InputGroup id="password"      label="Password"         type={showPassword ? "text" : "password"} icon={faLock} value={form.password} onChange={handleChange} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-11 text-slate-400 hover:text-sky-500 transition-colors">
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <div className="relative">
              <InputGroup id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? "text" : "password"} icon={faLock} value={form.confirmPassword} onChange={handleChange} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-11 text-slate-400 hover:text-sky-500 transition-colors">
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <PasswordStrengthBox password={form.password} confirmPassword={form.confirmPassword} />
          </>
        ) : (
          <>
            <SelectGroup id="role"          label="System Access Role" icon={faBriefcase}   value={form.role}            onChange={handleChange} options={VALID_ROLES} />
            <InputGroup id="jobTitle"       label="Official Job Title" icon={faBriefcase}   value={form.jobTitle}        onChange={handleChange} placeholder="Senior Social Worker" />
            <InputGroup id="department"     label="Assigned Department" icon={faBuilding}   value={form.department}      onChange={handleChange} placeholder="Social Services" />
            <InputGroup id="hireDate"       label="Employment Hire Date" type="date" icon={faCalendarAlt} value={form.hireDate}  onChange={handleChange} />
          </>
        )}
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
        {step === 2 ? (
          <button onClick={() => setStep(1)} className="text-slate-500 cursor-pointer font-bold flex items-center gap-2 hover:text-slate-800 transition-all">
            Back to Account Info
          </button>
        ) : <div />}

        <button
          disabled={isLoading}
          onClick={step === 1 ? validateStep1 : handleSubmit}
          className={`px-10 py-4 rounded-2xl font-black text-white shadow-xl flex items-center gap-3 transition-all active:scale-95 ${
            isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-primBtn hover:bg-Hover cursor-pointer shadow-sky-200"
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {step === 1 ? "HR Placement Details" : "Register Employee"}
              <FontAwesomeIcon icon={step === 1 ? faArrowRight : faCheckCircle} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BULK REGISTER (Excel)
// ═══════════════════════════════════════════════════════════════════════════════
const BulkRegister = () => {
  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const inputRef = useRef();
  const [createEmployee] = useCreateEmployeeMutation();

  const handleDownloadTemplate = async () => {
    try {
      setTemplateLoading(true);
      await downloadTemplate();
    } catch {
      toast.error("Could not generate the template. Please try again.");
    } finally {
      setTemplateLoading(false);
    }
  };

  const parseFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Please upload an .xlsx, .xls, or .csv file.");
      return;
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

        const firstRow = normalised[0];
        const missing = REQUIRED_COLS.filter((c) => !(c in firstRow));
        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(", ")}. Download the layout template.`);
          return;
        }

        const processed = normalised.map((row, i) => {
          // Normalize role strings from excel to uppercase enums
          if (row.role) row.role = String(row.role).toUpperCase().trim().replace(" ", "_");
          
          const errors = validateBulkRow(row);
          return { id: i, data: row, errors, status: errors.length === 0 ? "valid" : "error", serverMsg: "" };
        });

        setRows(processed);
        const errCount = processed.filter((r) => r.status === "error").length;
        errCount > 0
          ? toast.warning(`${processed.length} entries parsed — ${errCount} records failed compliance layout rules.`)
          : toast.success(`${processed.length} valid employee records clear for ingestion!`);
      } catch {
        toast.error("Could not process spreadsheet. Please deploy the baseline structure model.");
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const onFileChange = (e) => parseFile(e.target.files[0]);
  const onDrop = (e) => { e.preventDefault(); setDragging(false); parseFile(e.dataTransfer.files[0]); };

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const submitRow = async (row) => {
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "loading" } : r));
    
    const payload = {
      firstName: row.data.firstName,
      lastName: row.data.lastName,
      email: row.data.email,
      password: row.data.password,
      role: row.data.role,
      phone: row.data.phone || null,
      jobTitle: row.data.jobTitle || null,
      department: row.data.department || null,
      hireDate: row.data.hireDate ? new Date(row.data.hireDate).toISOString() : null
    };

    try {
      const result = await createEmployee(payload).unwrap();
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "success", serverMsg: result.msg || "Onboarded!" } : r));
    } catch (err) {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "failed", serverMsg: err?.data?.msg || "Provisioning error" } : r));
    }
  };

  const submitAll = async () => {
    const toSubmit = rows.filter((r) => r.status === "valid");
    if (toSubmit.length === 0) { toast.warning("No valid operations available."); return; }
    toast.info(`Ingesting data for ${toSubmit.length} profiles…`);
    for (const row of toSubmit) await submitRow(row);
    toast.success("Batch operations complete!");
  };

  const validCount   = rows.filter((r) => r.status === "valid").length;
  const errorCount   = rows.filter((r) => r.status === "error").length;
  const successCount = rows.filter((r) => r.status === "success").length;

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white p-8 md:p-12 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faFileExcel} />
            </span>
            Bulk Registry Management
          </h2>
          <p className="text-xs text-slate-400 mt-1 ml-1">Upload matching spreadsheets to execute batch staff provisioning operations.</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          disabled={templateLoading}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-md transition-all text-sm whitespace-nowrap"
        >
          <FontAwesomeIcon icon={templateLoading ? faSpinner : faDownload} spin={templateLoading} />
          {templateLoading ? "Generating…" : "Layout Template"}
        </button>
      </div>

      {/* Drop Zone */}
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
          <p className="font-bold text-slate-700">Drag & drop your matrix worksheet here</p>
          <p className="text-xs text-slate-500 mt-1">or click to scan local folders — .xlsx, .xls, .csv supported</p>
        </div>
      </div>

      {/* Stats */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Rows",  val: rows.length,   cls: "bg-slate-100 text-slate-700" },
            { label: "Compliant",   val: validCount,     cls: "bg-emerald-50 text-emerald-700" },
            { label: "Violations",  val: errorCount,     cls: "bg-rose-50 text-rose-700" },
            { label: "Provisioned", val: successCount,   cls: "bg-sky-50 text-sky-700" },
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
                  {["#", "Full Name", "Email Identity", "Database Role", "Title / Dept", "State", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <React.Fragment key={row.id}>
                    <tr className={`transition-colors ${row.status === "success" ? "bg-emerald-50/40" : row.status === "failed" ? "bg-rose-50/40" : "hover:bg-slate-50"}`}>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {row.data.firstName} {row.data.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.data.email || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {row.data.role ? <span className="bg-slate-100 px-2 py-1 rounded">{row.data.role}</span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <div className="text-xs font-medium">{row.data.jobTitle || "—"}</div>
                        <div className="text-[10px] text-slate-400">{row.data.department || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={row.status} />
                          {row.serverMsg && <span className="text-xs text-slate-500">{row.serverMsg}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.errors.length > 0 && (
                            <button
                              onClick={() => setExpandedErrors(expandedErrors === row.id ? null : row.id)}
                              title="Inspect structural validation layout"
                              className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center transition-colors"
                            >
                              <FontAwesomeIcon icon={faExclamationTriangle} size="xs" />
                            </button>
                          )}
                          {(row.status === "valid" || row.status === "failed") && (
                            <button
                              onClick={() => submitRow(row)}
                              title="Commit entry to server"
                              className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 hover:bg-sky-200 flex items-center justify-center transition-colors"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} size="xs" />
                            </button>
                          )}
                          {row.status === "loading" && (
                            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                              <FontAwesomeIcon icon={faSpinner} spin className="text-sky-500 text-xs" />
                            </div>
                          )}
                          {row.status !== "loading" && row.status !== "success" && (
                            <button
                              onClick={() => removeRow(row.id)}
                              title="Drop node row"
                              className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 hover:bg-rose-200 flex items-center justify-center transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} size="xs" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedErrors === row.id && (
                      <tr className="bg-rose-50">
                        <td colSpan={7} className="px-6 py-3">
                          <p className="text-xs font-bold text-rose-700 mb-1">Validation tracking traces:</p>
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

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => { setRows([]); if (inputRef.current) inputRef.current.value = ""; }}
              className="flex items-center gap-2 text-slate-500 hover:text-rose-500 font-bold transition-colors text-sm"
            >
              <FontAwesomeIcon icon={faTimesCircle} /> Clear Table Matrix
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">{validCount} of {rows.length} operations verified</span>
              <button
                onClick={submitAll}
                disabled={errorCount > 0 || validCount === 0}
                className="bg-primBtn disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-sky-200 hover:bg-Hover hover:scale-105 transition-all flex items-center gap-3"
              >
                <FontAwesomeIcon icon={faCheckCircle} /> Execute Structural Ingestion ({validCount})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Column Guide */}
      <details className="rounded-2xl border border-slate-200 overflow-hidden">
        <summary className="px-5 py-4 cursor-pointer font-bold text-slate-600 text-sm bg-slate-50 hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
          <span>📋 Compliance Engine Target Parameters</span>
          <span className="text-xs font-normal text-slate-400">Toggle info layout grid</span>
        </summary>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {REQUIRED_COLS.map((c) => (
              <div key={c} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                <code className="bg-slate-100 px-2 py-1 rounded-lg text-slate-700 font-mono">{c}</code>
                <span className="text-rose-500 text-[10px]">required</span>
              </div>
            ))}
            {OPTIONAL_COLS.map((c) => (
              <div key={c} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                <code className="bg-slate-100 px-2 py-1 rounded-lg text-slate-700 font-mono">{c}</code>
                <span className="text-slate-400 text-[10px]">optional</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
            <strong>Accepted structural roles (enum):</strong> {VALID_ROLES.join(", ")}
            <span className="block mt-1 text-slate-400">The "role" column in the downloaded template has a built-in dropdown with these exact values.</span>
          </div>
        </div>
      </details>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WRAPPER — tab switcher
// ═══════════════════════════════════════════════════════════════════════════════
const EmployeeRegister = () => {
  const [mode, setMode] = useState("single"); // "single" | "bulk"

  return (
    <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
      <ToastContainer position="top-center" theme="colored" />

      {/* Mode Switcher */}
      <div className="flex items-center mt-10 justify-center mb-8">
        <div className="flex bg-white/80 backdrop-blur-sm border border-slate-200 p-1.5 rounded-[20px] shadow-sm gap-1">
          <button
            onClick={() => setMode("single")}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
              mode === "single"
                ? "bg-primBtn text-white shadow-lg shadow-sky-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Single Provisioning
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
              mode === "bulk"
                ? "bg-primBtn text-white shadow-lg shadow-sky-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <FontAwesomeIcon icon={faUsers} />
            Matrix Bulk Upload
          </button>
        </div>
      </div>

      {/* Render active mode */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" key={mode}>
        {mode === "single" ? <SingleRegister /> : <BulkRegister />}
      </div>
    </div>
  );
};

export default EmployeeRegister;