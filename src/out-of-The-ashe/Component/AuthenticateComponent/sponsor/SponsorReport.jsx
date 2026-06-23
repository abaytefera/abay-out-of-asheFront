import React, { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt, faDownload, faSpinner, faChild, faCalendar,
  faHeartPulse, faGraduationCap, faHome,
  faCheckCircle, faSyringe,
  faShieldAlt, faFilter, faChevronDown, faPaperclip,
  faTimesCircle, faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
  primary:   [79,  70, 229],
  primaryDk: [55,  48, 163],
  primaryLt: [238, 242, 255],
  slate900:  [15,  23,  42],
  slate700:  [51,  65,  85],
  slate600:  [71,  85, 105],
  slate400:  [148,163,184],
  slate200:  [226,232,240],
  slate100:  [241,245,249],
  green:     [22, 163,  74],
  amber:     [217,119,  6],
  red:       [220, 38,  38],
  white:     [255,255,255],
  teal:      [13, 148, 136],
  purple:    [124, 58, 237],
};
const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const bmiLabel = (bmi) => {
  if (!bmi) return "—";
  if (bmi < 16)   return `${bmi.toFixed(1)} — Severely underweight`;
  if (bmi < 18.5) return `${bmi.toFixed(1)} — Underweight`;
  if (bmi < 25)   return `${bmi.toFixed(1)} — Normal weight`;
  return `${bmi.toFixed(1)} — Overweight`;
};

const monthName = (m) => new Date(2000, m - 1).toLocaleString("en-GB", { month: "long" });

// ── Filter a date-bearing record array by year and month ─────────────────
const filterByPeriod = (records, dateKey, year, month) => {
  if (!records?.length) return [];
  return records.filter(r => {
    const d = new Date(r[dateKey]);
    if (year  && d.getFullYear() !== Number(year))  return false;
    if (month && d.getMonth() + 1 !== Number(month)) return false;
    return true;
  });
};

// ── Collect evidence file URLs from a set of records ────────────────────
const collectFiles = (records, fileKey = "files") =>
  (records || []).flatMap(r => r[fileKey] || []);

// ─────────────────────────────────────────────────────────────────────────
// PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────
const generatePDF = (sponsor, selectedChildIds, filters) => {
  const { year, month } = filters;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 0;

  const safeText = (s) => (s || "").toString();

  const addFooter = () => {
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(...C.slate400);
      doc.setFont("helvetica", "normal");
      doc.text("Out of the Ashes  ·  Confidential Sponsor Report  ·  Not for redistribution", 14, H - 7);
      doc.text(`Page ${i} of ${pages}`, W - 14, H - 7, { align: "right" });
      // Footer rule
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.3);
      doc.line(14, H - 10, W - 14, H - 10);
    }
  };

  const checkPage = (needed = 50) => {
    if (y + needed > H - 16) { doc.addPage(); y = 20; }
  };

  const sectionTitle = (title, color = C.slate900) => {
    checkPage(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(title.toUpperCase(), 14, y);
    doc.setDrawColor(...C.primary);
    doc.setLineWidth(0.6);
    doc.line(14, y + 1.5, 14 + doc.getTextWidth(title.toUpperCase()), y + 1.5);
    y += 7;
  };

  // ── COVER PAGE ─────────────────────────────────────────────────────────

  // Deep indigo header band
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, 55, "F");

  // Right accent stripe
  doc.setFillColor(...C.primaryDk);
  doc.rect(W - 8, 0, 8, 55, "F");

  // Organisation name
  doc.setTextColor(...C.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Out of the Ashes", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 255);
  doc.text("Child Sponsorship Progress Report", 14, 26);

  // Period badge
  const periodLabel = [
    year  ? `Year: ${year}` : null,
    month ? `Month: ${monthName(month)}` : null,
  ].filter(Boolean).join("  ·  ") || "All periods";

  doc.setFillColor(...C.primaryDk);
  doc.roundedRect(14, 33, doc.getTextWidth(periodLabel) + 12, 9, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(periodLabel, 20, 39);

  // Meta line
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 230);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}   ·   Ref: RPT-${Date.now().toString().slice(-8)}`, 14, 50);

  y = 68;

  // ── SPONSOR INFORMATION ────────────────────────────────────────────────
  sectionTitle("Sponsor Information");

  autoTable(doc, {
    startY: y,
    body: [
      ["Full Name",     `${safeText(sponsor.firstName)} ${safeText(sponsor.lastName)}`],
      ["Email",         safeText(sponsor.email)     || "—"],
      ["Phone",         safeText(sponsor.phone)     || "—"],
      ["Country",       safeText(sponsor.country)   || "—"],
      ["Organization",  safeText(sponsor.organization) || "—"],
      ["Registered",    fmtDate(sponsor.createdAt)],
      ["Active children",
        String((sponsor.sponsorships || []).filter(s => s.isActive).length)],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 } },
    columnStyles: {
      0: { fontStyle: "bold", textColor: C.slate600, cellWidth: 48 },
      1: { textColor: C.slate900 },
    },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 6;

  if (sponsor.notes) {
    checkPage(18);
    doc.setFillColor(...C.primaryLt);
    doc.roundedRect(14, y, W - 28, 0, 2, 2);  // placeholder; height set below
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.primary);
    doc.text("Sponsor Notes", 18, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.slate700);
    const lines = doc.splitTextToSize(safeText(sponsor.notes), W - 36);
    const boxH = 10 + lines.length * 4.2;
    doc.setFillColor(...C.primaryLt);
    doc.roundedRect(14, y, W - 28, boxH, 2, 2, "F");
    doc.text("Sponsor Notes", 18, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.slate700);
    doc.text(lines, 18, y + 12);
    y += boxH + 8;
  }

  // ── PER-CHILD SECTIONS ─────────────────────────────────────────────────
  const activeSpons = (sponsor.sponsorships || []).filter(
    s => s.isActive && selectedChildIds.has(s.childId)
  );

  activeSpons.forEach((sp, index) => {
    const child = sp.child;
    if (!child) return;

    checkPage(40);

    // Child section header
    doc.setFillColor(...C.primary);
    doc.roundedRect(14, y, W - 28, 13, 2, 2, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(`${child.firstName} ${child.lastName}`, 20, y + 9);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 255);
    doc.text(`ID: ${child.childCode || child.id?.slice(-8)}  ·  Since ${new Date(sp.startDate).getFullYear()}`, W - 16, y + 9, { align: "right" });
    y += 18;

    // ── SPONSORSHIP DETAILS ────────────────────────────────────────────
    sectionTitle("Sponsorship Details", C.slate700);

    autoTable(doc, {
      startY: y,
      body: [
        ["Start Date", fmtDate(sp.startDate)],
        ["Status",     sp.isActive ? "Active" : `Ended ${fmtDate(sp.endDate)}`],
      ],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: C.slate600, cellWidth: 48 },
        1: { textColor: C.slate900 },
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── CHILD PROFILE ──────────────────────────────────────────────────
    checkPage(40);
    sectionTitle("Child Profile", C.slate700);

    autoTable(doc, {
      startY: y,
      body: [
        ["Full Name",   `${safeText(child.firstName)} ${safeText(child.lastName)}`],
        ["Date of Birth", fmtDate(child.dateOfBirth)],
        ["Gender",        safeText(child.gender)      || "—"],
        ["Status",        safeText(child.status)      || "—"],
        ["School",        safeText(child.schoolName)  || "—"],
        ["Sub-city",      safeText(child.subCity)     || "—"],
        ["Nationality",   safeText(child.nationality) || "—"],
        ["Religion",      safeText(child.religion)    || "—"],
      ],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: C.slate600, cellWidth: 48 },
        1: { textColor: C.slate900 },
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ── ACADEMIC RECORDS ───────────────────────────────────────────────
    const academic = filterByPeriod(child.academicRecords, "createdAt", year, null);
    if (academic.length) {
      checkPage(50);
      sectionTitle("Academic Progress", C.slate700);

      autoTable(doc, {
        startY: y,
        head: [["Year", "Grade", "School", "Avg Score", "Attendance", "Status"]],
        body: academic.slice(0, 6).map(r => [
          safeText(r.academicYear) || "—",
          safeText(r.grade)        || "—",
          safeText(r.schoolName)   || "—",
          r.averageScore   != null ? `${r.averageScore}%`   : "—",
          r.attendanceRate != null ? `${r.attendanceRate}%` : "—",
          safeText(r.promotionStatus) || "—",
        ]),
        headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 8.5, fontStyle: "bold", cellPadding: 3 },
        bodyStyles: { fontSize: 8.5, textColor: C.slate900, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: C.primaryLt },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;

      // Academic evidence files
      const acadFiles = collectFiles(academic, "files");
      if (acadFiles.length) {
        checkPage(14);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.slate600);
        doc.text("Evidence Files:", 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.primary);
        const fileNames = acadFiles.map(f => f.fileName || f.url?.split("/").pop() || "file").join("  ·  ");
        const fileLines = doc.splitTextToSize(fileNames, W - 28);
        doc.text(fileLines, 14, y + 5);
        y += 5 + fileLines.length * 4.5 + 4;
      }
    }

    // ── NUTRITION & GROWTH ─────────────────────────────────────────────
    const nutrition = filterByPeriod(child.nutritionRecords, "recordDate", year, month);
    if (nutrition.length) {
      checkPage(50);
      sectionTitle("Nutrition & Growth", C.slate700);

      autoTable(doc, {
        startY: y,
        head: [["Date", "Height (cm)", "Weight (kg)", "BMI Assessment", "Notes"]],
        body: nutrition.slice(0, 5).map(r => [
          fmtDate(r.recordDate),
          r.heightCm ?? "—",
          r.weightKg ?? "—",
          bmiLabel(r.bmi),
          r.notes ? safeText(r.notes).slice(0, 55) : "—",
        ]),
        headStyles: { fillColor: C.teal, textColor: C.white, fontSize: 8.5, fontStyle: "bold", cellPadding: 3 },
        bodyStyles: { fontSize: 8.5, textColor: C.slate900, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [236, 253, 245] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    // ── VACCINATIONS ───────────────────────────────────────────────────
    const vaccinations = filterByPeriod(child.vaccinations, "dateGiven", year, month);
    if (vaccinations.length) {
      checkPage(50);
      sectionTitle("Vaccination Record", C.slate700);

      autoTable(doc, {
        startY: y,
        head: [["Vaccine", "Date Given", "Next Due", "Administered By"]],
        body: vaccinations.map(v => [
          safeText(v.vaccineName)    || "—",
          fmtDate(v.dateGiven),
          v.nextDueDate ? fmtDate(v.nextDueDate) : "Complete",
          safeText(v.administeredBy) || "—",
        ]),
        headStyles: { fillColor: C.purple, textColor: C.white, fontSize: 8.5, fontStyle: "bold", cellPadding: 3 },
        bodyStyles: { fontSize: 8.5, textColor: C.slate900, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;

      // Vaccination evidence files
      const vacFiles = collectFiles(vaccinations, "files");
      if (vacFiles.length) {
        checkPage(14);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.slate600);
        doc.text("Evidence Files:", 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.purple);
        const fileNames = vacFiles.map(f => f.fileName || f.url?.split("/").pop() || "file").join("  ·  ");
        const fileLines = doc.splitTextToSize(fileNames, W - 28);
        doc.text(fileLines, 14, y + 5);
        y += 5 + fileLines.length * 4.5 + 4;
      }
    }

    // ── HOME VISITS ────────────────────────────────────────────────────
    const visits = filterByPeriod(child.homeVisits, "visitDate", year, month);
    if (visits.length) {
      checkPage(50);
      sectionTitle("Home Visit Summary", C.slate700);

      autoTable(doc, {
        startY: y,
        head: [["Date", "Purpose", "Follow-up", "Observations"]],
        body: visits.slice(0, 5).map(v => [
          fmtDate(v.visitDate),
          safeText(v.purpose).replace(/_/g, " ") || "—",
          v.isFollowUpDone ? "Done" : (v.followUpDate ? `Due ${fmtDate(v.followUpDate)}` : "—"),
          v.observations ? safeText(v.observations).slice(0, 70) + (safeText(v.observations).length > 70 ? "…" : "") : "—",
        ]),
        headStyles: { fillColor: [245, 158, 11], textColor: C.white, fontSize: 8.5, fontStyle: "bold", cellPadding: 3 },
        bodyStyles: { fontSize: 8.5, textColor: C.slate900, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;

      // Visit photo files
      const visitFiles = collectFiles(visits, "photos");
      if (visitFiles.length) {
        checkPage(14);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.slate600);
        doc.text("Visit Evidence Files:", 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor([245, 158, 11]);
        const fileNames = visitFiles.map(f => f.fileName || f.url?.split("/").pop() || "photo").join("  ·  ");
        const fileLines = doc.splitTextToSize(fileNames, W - 28);
        doc.text(fileLines, 14, y + 5);
        y += 5 + fileLines.length * 4.5 + 4;
      }
    }

    // ── DIVIDER between children ───────────────────────────────────────
    if (index < activeSpons.length - 1) {
      checkPage(20);
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.4);
      doc.line(14, y + 2, W - 14, y + 2);
      y += 12;
    }
  });

  addFooter();

  const periodSuffix = [year, month ? String(month).padStart(2,"0") : null].filter(Boolean).join("-") || "all";
  const fileName = `sponsor-report-${sponsor.firstName}-${sponsor.lastName}-${periodSuffix}-${Date.now()}.pdf`
    .toLowerCase().replace(/\s+/g, "-");
  doc.save(fileName);
};

// ─────────────────────────────────────────────────────────────────────────
// PERIOD FILTER CONTROLS
// ─────────────────────────────────────────────────────────────────────────
const YEARS  = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i).toLocaleString("en-GB", { month: "long" }) }));

const SelectFilter = ({ icon, value, onChange, placeholder, children }) => (
  <div className="relative">
    <FontAwesomeIcon icon={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none" />
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="h-9 pl-8 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer appearance-none"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
    <FontAwesomeIcon icon={faChevronDown} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] pointer-events-none" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// REPORT UI COMPONENT
// ─────────────────────────────────────────────────────────────────────────
const SponsorReport = ({ sponsor }) => {
  const activeSpons = (sponsor?.sponsorships || []).filter(s => s.isActive);
  useEffect(()=>{

    console.log("activeSpons")
    console.log(activeSpons)
  },[activeSpons])

  const [selected,   setSelected]   = useState(() => new Set(activeSpons.map(s => s.childId)));
  const [generating, setGenerating] = useState(false);
  const [year,       setYear]       = useState("");
  const [month,      setMonth]      = useState("");

  const toggle = (childId) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(childId) ? next.delete(childId) : next.add(childId);
      return next;
    });

  const handleGenerate = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    try {
      await toast.promise(
        (async () => {
          await new Promise(r => setTimeout(r, 80));
          generatePDF(sponsor, selected, { year, month });
        })(),
        {
          pending: "Generating report…",
          success: "Report downloaded",
          error: "Failed to generate report",
        }
      );
    } finally {
      setGenerating(false);
    }
  };

  // Count data chips per child in selected period
  const dataSummary = useMemo(() => {
    return activeSpons.map(sp => {
      const c = sp.child;
      return {
        id: sp.childId,
        academic:  filterByPeriod(c?.academicRecords,  "createdAt",  year, null).length,
        nutrition: filterByPeriod(c?.nutritionRecords, "recordDate", year, month).length,
        vaccines:  filterByPeriod(c?.vaccinations,     "dateGiven",  year, month).length,
        visits:    filterByPeriod(c?.homeVisits,       "visitDate",  year, month).length,
      };
    });
  }, [activeSpons, year, month]);

  return (
    <div className="space-y-6">

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
        <FontAwesomeIcon icon={faShieldAlt} className="text-indigo-500 text-sm mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-indigo-700 mb-0.5">Confidential progress report</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            This report includes child profile, academic records, nutrition &amp; growth, vaccination history,
            and home visit summaries — along with all attached evidence files. Financial information is not included.
          </p>
        </div>
      </div>

      {/* ── Period filters ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
            Filter by period
          </p>
          {(year || month) && (
            <button onClick={() => { setYear(""); setMonth(""); }}
              className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold flex items-center gap-1 transition">
              <FontAwesomeIcon icon={faTimesCircle} className="text-[10px]" /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectFilter icon={faCalendar} value={year} onChange={setYear} placeholder="All years">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </SelectFilter>
          <SelectFilter icon={faCalendar} value={month} onChange={v => setMonth(v)} placeholder="All months">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </SelectFilter>

          {(year || month) && (
            <span className="self-center text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              {[year, month ? MONTHS[month-1]?.label : null].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {!year && !month && (
          <p className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1">
            <FontAwesomeIcon icon={faInfoCircle} className="text-[10px]" />
            No filter applied — all recorded data will be included in the report.
          </p>
        )}
      </div>

      {/* ── Select children ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Children to include ({selected.size} / {activeSpons.length})
          </p>
          <div className="flex gap-2 text-xs font-semibold">
            <button onClick={() => setSelected(new Set(activeSpons.map(s => s.childId)))}
              className="text-indigo-600 hover:underline">All</button>
            <span className="text-slate-200">|</span>
            <button onClick={() => setSelected(new Set())}
              className="text-slate-400 hover:underline">None</button>
          </div>
        </div>

        {activeSpons.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            No active sponsorships. Link a child first.
          </div>
        ) : (
          <div className="space-y-2">
            {activeSpons.map((sp, i) => {
              const child = sp.child;
              const isChecked = selected.has(sp.childId);
              const summary = dataSummary[i];

              return (
                <label key={sp.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isChecked
                      ? "bg-indigo-50/60 border-indigo-200 shadow-sm"
                      : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                  }`}>
                  <input
                    type="checkbox" checked={isChecked}
                    onChange={() => toggle(sp.childId)}
                    className="w-4 h-4 accent-indigo-600 shrink-0"
                  />
                  <img
                    src={`${API_URL}/${child?.photos?.[0]?.url}` ||
                      `https://ui-avatars.com/api/?name=${child?.firstName}+${child?.lastName}&background=EEF2FF&color=4F46E5&size=36`}
                    alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{child?.firstName} {child?.lastName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {child?.childCode} · Since {new Date(sp.startDate).getFullYear()}
                    </p>
                  </div>

                  {/* Data chips */}
                  <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
                    {[
                      { icon: faGraduationCap, count: summary?.academic,  bg: "bg-blue-50   text-blue-600"   },
                      { icon: faHeartPulse,    count: summary?.nutrition, bg: "bg-teal-50   text-teal-600"   },
                      { icon: faSyringe,       count: summary?.vaccines,  bg: "bg-purple-50 text-purple-600" },
                      { icon: faHome,          count: summary?.visits,    bg: "bg-amber-50  text-amber-600"  },
                    ].map((c, j) => c.count > 0 && (
                      <span key={j} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${c.bg}`}>
                        <FontAwesomeIcon icon={c.icon} className="text-[9px]" /> {c.count}
                      </span>
                    ))}
                  </div>

                  {isChecked && (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-indigo-500 text-sm shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ── What's included ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          Report sections
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: faChild,         label: "Child profile",      color: "bg-blue-50   text-blue-700",   border: "border-blue-100"   },
            { icon: faGraduationCap, label: "Academic records",   color: "bg-indigo-50 text-indigo-700", border: "border-indigo-100" },
            { icon: faHeartPulse,    label: "Nutrition & growth", color: "bg-teal-50   text-teal-700",   border: "border-teal-100"   },
            { icon: faSyringe,       label: "Vaccinations",       color: "bg-purple-50 text-purple-700", border: "border-purple-100" },
            { icon: faHome,          label: "Home visits",        color: "bg-amber-50  text-amber-700",  border: "border-amber-100"  },
            { icon: faPaperclip,     label: "Evidence files",     color: "bg-slate-50  text-slate-700",  border: "border-slate-200"  },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2 p-3 rounded-xl border ${item.color} ${item.border}`}>
              <FontAwesomeIcon icon={item.icon} className="text-xs shrink-0" />
              <span className="text-xs font-semibold leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Generate button ── */}
      <div className="space-y-2">
        <button
          onClick={handleGenerate}
          disabled={generating || selected.size === 0}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-200"
        >
          {generating ? (
            <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Generating PDF…</>
          ) : (
            <>
              <FontAwesomeIcon icon={faDownload} />
              Download report — {selected.size} child{selected.size !== 1 ? "ren" : ""}
              {(year || month) && <span className="opacity-70 font-normal text-xs ml-1">
                ({[year, month ? MONTHS[month-1]?.label : null].filter(Boolean).join(" · ")})
              </span>}
            </>
          )}
        </button>

        {selected.size === 0 && (
          <p className="text-xs text-center text-slate-400">Select at least one child above to enable the download.</p>
        )}
      </div>
    </div>
  );
};

export default SponsorReport;