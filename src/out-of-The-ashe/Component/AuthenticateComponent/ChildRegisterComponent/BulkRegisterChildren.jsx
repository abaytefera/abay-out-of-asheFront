import { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel, faDownload, faTrash, faCheckCircle,
  faExclamationTriangle, faSpinner, faUpload,
  faTimesCircle, faChevronDown, faChevronUp, faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";

import { useCreateChildMutation } from "../../../Redux/Childes";
import { useGetSchoolsDropdownQuery } from "../../../Redux/Schools";

// =============================================================================
// COLUMN DEFINITIONS — mirrors Prisma schema exactly
// =============================================================================

const CHILD_REQUIRED = [
  "firstName", "lastName", "dateOfBirth", "gender", "admissionDate",
];

const CHILD_OPTIONAL = [
  "nationality", "religion", "subCity", "kebele",
  "schoolName", "emergencyContactName", "emergencyContactPhone", "childNotes",
];

const HOUSEHOLD_REQUIRED = [
  "householdCode", "housingCondition", "waterAccess", "sanitationAccess",
];

const HOUSEHOLD_OPTIONAL = [
  "householdAddress", "numberOfMembers", "hasDisabledMember",
  "incomeSource", "incomeAmount", "incomeFrequency",
];

const GUARDIAN_OPTIONAL = [
  "guardianFirstName", "guardianLastName", "relationship",
  "guardianPhone", "guardianEmail", "occupation", "educationLevel",
  "maritalStatus", "incomeRange", "isEmergencyContact",
];

const HEALTH_OPTIONAL = [
  "knownDisabilities", "healthNotes",
];

const REQUIRED_COLUMNS = [...CHILD_REQUIRED, ...HOUSEHOLD_REQUIRED];
const ALL_COLUMNS = [
  ...CHILD_REQUIRED, ...CHILD_OPTIONAL,
  ...HOUSEHOLD_REQUIRED, ...HOUSEHOLD_OPTIONAL,
  ...GUARDIAN_OPTIONAL,
  ...HEALTH_OPTIONAL,
];

// =============================================================================
// VALID ENUM VALUES — mirrors Prisma enums
// =============================================================================
const VALID = {
  gender:           ["MALE", "FEMALE", "OTHER"],
  housingCondition: ["OWNED", "RENTED", "INFORMAL", "HOMELESS"],
  waterAccess:      ["PIPED", "WELL", "RIVER", "COMMUNAL_TAP", "NONE"],
  sanitationAccess: ["PRIVATE_TOILET", "SHARED_TOILET", "OPEN_DEFECATION", "NONE"],
  maritalStatus:    ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED"],
  incomeRange:      ["NONE", "BELOW_500", "RANGE_500_1000", "RANGE_1001_3000", "ABOVE_3000"],
  hasDisabledMember:["true", "false", "yes", "no", "1", "0"],
  isEmergencyContact:["true", "false", "yes", "no", "1", "0"],
};

const NATIONALITY_OPTIONS = ["Ethiopian", "Other"];
const RELIGION_OPTIONS    = ["Christianity", "Islam", "Other", "Prefer not to say"];

// =============================================================================
// DATE UTILITIES
// =============================================================================
const parseToDate = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number" && value > 1 && value < 2958466) {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) return new Date(d.y, d.m - 1, d.d);
    return null;
  }
  const str = String(value).trim();
  if (!str) return null;
  const iso = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) { const d = new Date(+iso[1], +iso[2]-1, +iso[3]); return isNaN(d.getTime()) ? null : d; }
  const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) { const d = new Date(+dmy[3], +dmy[2]-1, +dmy[1]); return isNaN(d.getTime()) ? null : d; }
  const fb = new Date(str);
  return isNaN(fb.getTime()) ? null : fb;
};

const fmtISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
};

// =============================================================================
// VALIDATION
// =============================================================================
const validateRow = (row) => {
  const errors = [];
  const today = new Date(); today.setHours(0,0,0,0);

  // Required child fields
  CHILD_REQUIRED.forEach(col => {
    const v = row[col];
    if (v === undefined || v === null || String(v).trim() === "")
      errors.push(`"${col}" is required`);
  });

  // Required household fields
  HOUSEHOLD_REQUIRED.forEach(col => {
    const v = row[col];
    if (v === undefined || v === null || String(v).trim() === "")
      errors.push(`"${col}" is required`);
  });

  // Enum validations
  const enumChecks = [
    ["gender", "gender"],
    ["housingCondition", "housingCondition"],
    ["waterAccess", "waterAccess"],
    ["sanitationAccess", "sanitationAccess"],
  ];
  enumChecks.forEach(([col, key]) => {
    const v = row[col];
    if (v && !VALID[key].includes(String(v).toUpperCase())) {
      errors.push(`"${col}" must be one of: ${VALID[key].join(", ")}`);
    }
  });

  // Optional enum validations
  const optEnums = [
    ["maritalStatus","maritalStatus"],
    ["incomeRange","incomeRange"],
  ];
  optEnums.forEach(([col, key]) => {
    const v = row[col];
    if (v && String(v).trim() && !VALID[key].includes(String(v).toUpperCase())) {
      errors.push(`"${col}" must be one of: ${VALID[key].join(", ")}`);
    }
  });

  // Date: dateOfBirth — must exist and be past
  if (row.dateOfBirth) {
    const bd = parseToDate(row.dateOfBirth);
    if (!bd) errors.push(`"dateOfBirth" is not a valid date (use YYYY-MM-DD)`);
    else if (bd >= today) errors.push(`"dateOfBirth" must be a past date`);
  }

  // Date: admissionDate — must exist and not be future
  if (row.admissionDate) {
    const ad = parseToDate(row.admissionDate);
    if (!ad) errors.push(`"admissionDate" is not a valid date (use YYYY-MM-DD)`);
    else if (ad > today) errors.push(`"admissionDate" cannot be a future date`);
  }

  // numberOfMembers — must be positive integer if provided
  if (row.numberOfMembers !== undefined && row.numberOfMembers !== "") {
    const n = Number(row.numberOfMembers);
    if (isNaN(n) || n < 1 || !Number.isInteger(n))
      errors.push(`"numberOfMembers" must be a positive whole number`);
  }

  return errors;
};

// =============================================================================
// TEMPLATE DOWNLOAD — generated with ExcelJS so real in-cell dropdowns work
// =============================================================================
const SAMPLE_ROW = [
  // CHILD_REQUIRED
  "Sara", "Ahmed", "2018-03-22", "FEMALE", "2025-01-15",
  // CHILD_OPTIONAL
  "Ethiopian", "Christianity", "Bole", "03",
  "Bole Primary School", "Fatuma Ahmed", "0912345678", "Active and healthy child",
  // HOUSEHOLD_REQUIRED
  "HH-0042", "RENTED", "PIPED", "SHARED_TOILET",
  // HOUSEHOLD_OPTIONAL
  "Bole Sub-city Woreda 3", "5", "false",
  "Daily labor", "1500", "Monthly",
  // GUARDIAN_OPTIONAL
  "Fatuma", "Ahmed", "Mother",
  "0911111111", "fatuma@email.com", "Small trader", "Primary",
  "MARRIED", "RANGE_500_1000", "true",
  // HEALTH_OPTIONAL
  "None", "Generally healthy; no known chronic conditions",
];

const colIndex = (name) => ALL_COLUMNS.indexOf(name) + 1; // 1-based for ExcelJS

const downloadTemplate = async (schoolOptions = []) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Children");

  // Header + sample row
  ws.addRow(ALL_COLUMNS);
  ws.addRow(SAMPLE_ROW);

  // Style header — required = light red, optional = light blue
  const req = new Set(REQUIRED_COLUMNS);
  ALL_COLUMNS.forEach((col, i) => {
    const cell = ws.getRow(1).getCell(i + 1);
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: req.has(col) ? "FFFFD6D6" : "FFD6E8FF" },
    };
    ws.getColumn(i + 1).width = 22;
  });

  const lastRow = 500; // allow up to 500 data rows for bulk entry

  // Hidden helper sheet — holds the live School list (can exceed the
  // ~255-char limit of an inline dropdown formula)
  const schoolNames = (schoolOptions || []).map((s) => s.name).filter(Boolean);
  let schoolListRef = null;
  if (schoolNames.length > 0) {
    const listSheet = wb.addWorksheet("Lists");
    listSheet.state = "veryHidden";
    schoolNames.forEach((name, i) => {
      listSheet.getCell(`A${i + 1}`).value = name;
    });
    schoolListRef = `Lists!$A$1:$A$${schoolNames.length}`;
  }

  // Simple enum-backed dropdowns
  const dropdowns = [
    { col: "nationality",      values: NATIONALITY_OPTIONS },
    { col: "religion",         values: RELIGION_OPTIONS },
    { col: "gender",           values: VALID.gender },
    { col: "waterAccess",      values: VALID.waterAccess },
    { col: "sanitationAccess", values: VALID.sanitationAccess },
    { col: "housingCondition", values: VALID.housingCondition },
    { col: "maritalStatus",    values: VALID.maritalStatus },
    { col: "incomeRange",      values: VALID.incomeRange },
  ];

  dropdowns.forEach(({ col, values }) => {
    const c = colIndex(col);
    if (!c) return;
    const formula = `"${values.join(",")}"`;
    for (let r = 2; r <= lastRow; r++) {
      ws.getCell(r, c).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: "Invalid value",
        error: `Please choose one of: ${values.join(", ")}`,
      };
    }
  });

  // School Name dropdown — pulled live from the API via hidden sheet
  if (schoolListRef) {
    const c = colIndex("schoolName");
    for (let r = 2; r <= lastRow; r++) {
      ws.getCell(r, c).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [schoolListRef],
        showErrorMessage: true,
        errorTitle: "Invalid school",
        error: "Please select a school from the dropdown list.",
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    "child_bulk_registration_template.xlsx"
  );
};

// =============================================================================
// STATUS BADGE
// =============================================================================
const StatusBadge = ({ status }) => {
  const map = {
    pending: { cls: "bg-slate-100 text-slate-500",              label: "Pending" },
    valid:   { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "✓ Valid" },
    error:   { cls: "bg-rose-50 text-rose-600 border border-rose-200",          label: "⚠ Errors" },
    loading: { cls: "bg-sky-50 text-sky-600 border border-sky-200",             label: "Submitting…" },
    success: { cls: "bg-emerald-100 text-emerald-800 font-bold",                label: "✓ Registered" },
    failed:  { cls: "bg-rose-100 text-rose-700 font-bold",                      label: "✗ Failed" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
};

// =============================================================================
// COLUMN GROUP GUIDE
// =============================================================================
const COL_GROUPS = [
  { label: "Child — Required",   cols: CHILD_REQUIRED,    color: "bg-rose-400",    badge: "required" },
  { label: "Child — Optional",   cols: CHILD_OPTIONAL,    color: "bg-slate-300",   badge: "optional" },
  { label: "Household — Required", cols: HOUSEHOLD_REQUIRED, color: "bg-rose-400", badge: "required" },
  { label: "Household — Optional", cols: HOUSEHOLD_OPTIONAL, color: "bg-slate-300", badge: "optional" },
  { label: "Guardian — Optional",  cols: GUARDIAN_OPTIONAL,  color: "bg-slate-300", badge: "optional" },
  { label: "Health — Optional",    cols: HEALTH_OPTIONAL,    color: "bg-slate-300", badge: "optional" },
];

const ENUM_GUIDE = [
  { col: "gender",           values: VALID.gender },
  { col: "housingCondition", values: VALID.housingCondition },
  { col: "waterAccess",      values: VALID.waterAccess },
  { col: "sanitationAccess", values: VALID.sanitationAccess },
  { col: "maritalStatus",    values: VALID.maritalStatus },
  { col: "incomeRange",      values: VALID.incomeRange },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const BulkRegisterChildren = () => {
  const [rows, setRows]         = useState([]);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState({}); // rowId → bool (show error detail)
  const inputRef = useRef();

  const [createChild] = useCreateChildMutation();
  const { data: schoolOptions = [], isLoading: schoolsLoading } = useGetSchoolsDropdownQuery();

  // ── Download template (with live school list + dropdowns) ─────────────────
  const handleDownloadTemplate = async () => {
    if (schoolsLoading) {
      toast.info("Schools are still loading, please wait a moment…");
      return;
    }
    try {
      toast.info("Generating template…");
      await downloadTemplate(schoolOptions);
    } catch {
      toast.error("Could not generate the template. Please try again.");
    }
  };

  // ── Parse uploaded file ────────────────────────────────────────────────────
  const parseFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext)) {
      toast.error("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wbk = XLSX.read(e.target.result, { type: "binary", cellDates: true });
        const ws  = wbk.Sheets[wbk.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (raw.length === 0) { toast.warning("The file is empty."); return; }

        // Normalise keys (trim whitespace)
        const normalised = raw.map(r => {
          const out = {};
          Object.keys(r).forEach(k => { out[k.trim()] = r[k]; });
          return out;
        });

        // Check required columns are present
        const missing = REQUIRED_COLUMNS.filter(c => !(c in normalised[0]));
        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(", ")}. Download the template.`);
          return;
        }

        // Parse dates
        const withDates = normalised.map(row => {
          const r = { ...row };
          const bd = parseToDate(r.dateOfBirth);
          if (bd) r.dateOfBirth = fmtISO(bd);
          const ad = parseToDate(r.admissionDate);
          if (ad) r.admissionDate = fmtISO(ad);
          // Normalise enums to uppercase
          ["gender","housingCondition","waterAccess","sanitationAccess","maritalStatus","incomeRange"]
            .forEach(k => { if (r[k]) r[k] = String(r[k]).toUpperCase().trim(); });
          return r;
        });

        const processed = withDates.map((row, i) => {
          const errors = validateRow(row);
          return { id: i, data: row, errors, status: errors.length === 0 ? "valid" : "error", serverMsg: "" };
        });

        setRows(processed);
        setExpanded({});
        const errCount = processed.filter(r => r.status === "error").length;
        if (errCount > 0)
          toast.warning(`${processed.length} rows loaded — ${errCount} have validation errors.`);
        else
          toast.success(`${processed.length} valid rows ready to submit!`);
      } catch {
        toast.error("Could not read the file. Please use the provided template.");
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const onFileChange = e => parseFile(e.target.files[0]);
  const onDrop = e => { e.preventDefault(); setDragging(false); parseFile(e.dataTransfer.files[0]); };

  // ── Submit single row ──────────────────────────────────────────────────────
  const submitRow = async (row) => {
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: "loading" } : r));

    // Build structured payload matching RegisterChild shape
    const d = row.data;
    const payload = {
      child: {
        firstName:            d.firstName,
        lastName:             d.lastName,
        dateOfBirth:          d.dateOfBirth,
        gender:               d.gender,
        admissionDate:        d.admissionDate,
        nationality:          d.nationality || null,
        religion:             d.religion || null,
        subCity:              d.subCity || null,
        kebele:               d.kebele || null,
        schoolName:           d.schoolName || null,
        emergencyContactName: d.emergencyContactName || null,
        emergencyContactPhone:d.emergencyContactPhone || null,
        notes:                d.childNotes || null,
      },
      household: {
        householdCode:    d.householdCode,
        address:          d.householdAddress || null,
        housingCondition: d.housingCondition,
        waterAccess:      d.waterAccess,
        sanitationAccess: d.sanitationAccess,
        numberOfMembers:  d.numberOfMembers ? Number(d.numberOfMembers) : null,
        hasDisabledMember:["true","yes","1"].includes(String(d.hasDisabledMember).toLowerCase()),
      },
      guardian: (d.guardianFirstName || d.guardianLastName) ? {
        firstName:        d.guardianFirstName || null,
        lastName:         d.guardianLastName || null,
        relationship:     d.relationship || null,
        phone:            d.guardianPhone || null,
        email:            d.guardianEmail || null,
        occupation:       d.occupation || null,
        educationLevel:   d.educationLevel || null,
        maritalStatus:    d.maritalStatus || null,
        incomeRange:      d.incomeRange || null,
        isEmergencyContact:["true","yes","1"].includes(String(d.isEmergencyContact).toLowerCase()),
      } : null,
      healthRecord: {
        knownDisabilities: d.knownDisabilities || null,
        notes:             d.healthNotes || null,
      },
    };

    const formData = new FormData();
    formData.append("Data", JSON.stringify(payload));
    try {
      const result = await createChild(formData).unwrap();
      setRows(prev => prev.map(r =>
        r.id === row.id ? { ...r, status: "success", serverMsg: result.msg || "Registered!" } : r
      ));
    } catch (err) {
      setRows(prev => prev.map(r =>
        r.id === row.id ? { ...r, status: "failed", serverMsg: err?.data?.msg || "Failed" } : r
      ));
    }
  };

  const submitAll = async () => {
    const toSubmit = rows.filter(r => r.status === "valid");
    if (toSubmit.length === 0) { toast.warning("No valid rows to submit."); return; }
    toast.info(`Submitting ${toSubmit.length} children…`);
    for (const row of toSubmit) await submitRow(row);
    toast.success("Batch submission complete!");
  };

  const removeRow  = id => setRows(prev => prev.filter(r => r.id !== id));
  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const clearAll   = () => { setRows([]); setExpanded({}); if (inputRef.current) inputRef.current.value = ""; };

  const validCount   = rows.filter(r => r.status === "valid").length;
  const errorCount   = rows.filter(r => r.status === "error").length;
  const successCount = rows.filter(r => r.status === "success").length;
  const loadingCount = rows.filter(r => r.status === "loading").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <ToastContainer position="top-right" theme="colored" />

      <div className="bg-white shadow-xl shadow-slate-200 rounded-3xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faFileExcel} className="text-sm" />
              </span>
              Bulk Register via Excel
            </h2>
            <p className="text-emerald-100 text-xs mt-1">
              Upload an Excel/CSV to register multiple children — all schema fields supported
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={schoolsLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all whitespace-nowrap border border-white/30"
          >
            <FontAwesomeIcon icon={schoolsLoading ? faSpinner : faDownload} spin={schoolsLoading} />
            {schoolsLoading ? "Loading schools…" : "Download Template"}
          </button>
        </div>

        <div className="px-8 py-8 space-y-8">

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 transition-all duration-300
              ${dragging
                ? "border-emerald-400 bg-emerald-50 scale-[1.01]"
                : "border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40"}`}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
            <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center text-emerald-500">
              <FontAwesomeIcon icon={faUpload} size="lg" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 text-sm">Drag & drop your Excel / CSV here</p>
              <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv — use the template for correct column names</p>
            </div>
          </div>

          {/* Stats */}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total",      val: rows.length,    cls: "bg-slate-100 text-slate-700" },
                { label: "Valid",      val: validCount,     cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
                { label: "Errors",     val: errorCount,     cls: "bg-rose-50 text-rose-700 border border-rose-200" },
                { label: "Processing", val: loadingCount,   cls: "bg-sky-50 text-sky-700 border border-sky-200" },
                { label: "Registered", val: successCount,   cls: "bg-teal-50 text-teal-700 border border-teal-200" },
              ].map(({ label, val, cls }) => (
                <div key={label} className={`${cls} rounded-2xl p-4 flex flex-col items-center`}>
                  <span className="text-2xl font-black">{val}</span>
                  <span className="text-xs font-semibold mt-0.5 opacity-70">{label}</span>
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
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left w-10">#</th>
                      <th className="px-4 py-3 text-left">Child Name</th>
                      <th className="px-4 py-3 text-left">DOB</th>
                      <th className="px-4 py-3 text-left">Gender</th>
                      <th className="px-4 py-3 text-left">School</th>
                      <th className="px-4 py-3 text-left">Household</th>
                      <th className="px-4 py-3 text-left">Guardian</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                      <>
                        {/* Data row */}
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            row.status === "success" ? "bg-emerald-50/50" :
                            row.status === "failed"  ? "bg-rose-50/50" :
                            row.errors.length > 0   ? "bg-rose-50/30" :
                            "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i+1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {row.data.firstName} {row.data.lastName}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                            {row.data.dateOfBirth || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {row.data.gender || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {row.data.schoolName || <span className="text-slate-300 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            <span className="font-mono">{row.data.householdCode || "—"}</span>
                            {row.data.housingCondition && (
                              <span className="ml-1 text-slate-400">({row.data.housingCondition})</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {row.data.guardianFirstName
                              ? `${row.data.guardianFirstName} ${row.data.guardianLastName || ""}`.trim()
                              : <span className="text-slate-300 italic">None</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={row.status} />
                              {row.serverMsg && (
                                <span className="text-xs text-slate-400">{row.serverMsg}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {/* Toggle error details */}
                              {row.errors.length > 0 && (
                                <button
                                  onClick={() => toggleExpand(row.id)}
                                  title="Show errors"
                                  className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                >
                                  <FontAwesomeIcon icon={expanded[row.id] ? faChevronUp : faChevronDown} className="text-xs" />
                                </button>
                              )}
                              {/* Submit single */}
                              {(row.status === "valid" || row.status === "failed") && (
                                <button
                                  onClick={() => submitRow(row)}
                                  title="Submit this row"
                                  className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 flex items-center justify-center transition-colors"
                                >
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                                </button>
                              )}
                              {/* Loading spinner */}
                              {row.status === "loading" && (
                                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                                  <FontAwesomeIcon icon={faSpinner} spin className="text-sky-400 text-xs" />
                                </div>
                              )}
                              {/* Remove */}
                              {row.status !== "loading" && row.status !== "success" && (
                                <button
                                  onClick={() => removeRow(row.id)}
                                  title="Remove row"
                                  className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-colors"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Error detail row — collapsible */}
                        {row.errors.length > 0 && expanded[row.id] && (
                          <tr key={`err-${row.id}`} className="bg-rose-50 border-b-2 border-rose-100">
                            <td colSpan={9} className="px-6 py-3">
                              <div className="flex flex-wrap gap-2">
                                {row.errors.map((e, ei) => (
                                  <span
                                    key={ei}
                                    className="inline-flex items-center gap-1.5 text-xs bg-white border border-rose-200 text-rose-600 px-2.5 py-1 rounded-lg shadow-sm"
                                  >
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-rose-400 text-[9px]" />
                                    {e}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold transition-colors text-sm"
                >
                  <FontAwesomeIcon icon={faTimesCircle} /> Clear All
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">
                    {validCount} of {rows.length} rows ready
                  </span>
                  <button
                    onClick={submitAll}
                    disabled={validCount === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-emerald-200 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Register All ({validCount})
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Column Reference Guide ── */}
          <details className="rounded-2xl border border-slate-200 overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer font-bold text-slate-600 text-sm bg-slate-50 hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-sky-400" />
                Column Reference &amp; Accepted Values
              </span>
              <span className="text-xs font-normal text-slate-400">click to expand</span>
            </summary>

            <div className="p-6 space-y-6">
              {/* Column groups */}
              {COL_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.cols.map(c => (
                      <div key={c} className="flex items-center gap-1.5 text-xs">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${group.color}`}></span>
                        <code className="bg-slate-100 px-2 py-1 rounded-lg text-slate-700 font-mono">{c}</code>
                        {group.badge === "required" && (
                          <span className="text-rose-500 text-[10px] font-bold">required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Enum values */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Accepted Enum Values</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ENUM_GUIDE.map(({ col, values }) => (
                    <div key={col} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <code className="text-xs font-bold text-slate-700">{col}</code>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {values.map(v => (
                          <span key={v} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boolean fields note */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Boolean fields</strong> (<code>hasDisabledMember</code>, <code>isEmergencyContact</code>):
                accept <code>true</code>, <code>false</code>, <code>yes</code>, <code>no</code>, <code>1</code>, or <code>0</code>.
              </div>

              {/* Dropdown note */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-800">
                <strong>Dropdowns in the downloaded template:</strong> School Name, Nationality, Religion,
                Water Access, Sanitation Access, Housing Condition, Marital Status, and Income Range
                all come with clickable in-cell dropdown lists (School Name is pulled live from the system).
              </div>
            </div>
          </details>

        </div>
      </div>
    </div>
  );
};

export default BulkRegisterChildren;