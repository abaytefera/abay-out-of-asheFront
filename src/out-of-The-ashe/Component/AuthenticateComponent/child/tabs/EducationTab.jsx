import React, { useState, useRef, useEffect } from "react";
import {
  faGraduationCap, faPlus, faTrash, faChartBar,
  faSchool, faTriangleExclamation, faBriefcase,
  faCalendarAlt, faFileDownload, faCheckCircle,
  faTimes, faNotesMedical, faCloudUploadAlt, faSpinner,
  faExclamationTriangle, faXmark, faChevronRight,
  faPencilAlt, faInfoCircle, faEllipsisV, faDownload,
  faUser, faFilePdf, faFileWord, faFileImage, faEye,
  faTrophy, faMedal, faRankingStar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TabShell, EmptyState, SubSection } from "./TabShell";
import {
  useGetAcademicRecordsQuery,
  useGetMaterialSupportsQuery,
  useCreateAcademicRecordMutation,
  useUpdateAcademicRecordMutation,
  useDeleteAcademicRecordMutation,
  useDeleteAcademicRecordFileMutation,
  useCreateMaterialSupportMutation,
  useUpdateMaterialSupportMutation,
  useDeleteMaterialSupportMutation,
} from "../../../../Redux/educationApi";

const SERVER_BASE_URL = import.meta.env.VITE_DEFAULT_BACKEND;

// ── Status configs ─────────────────────────────────────────────────────────────
const PROMOTION_STYLES = {
  PROMOTED:    { label: "Promoted",    color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  REPEATED:    { label: "Repeated",    color: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500" },
  PENDING:     { label: "Pending",     color: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
  GRADUATED:   { label: "Graduated",   color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  DROPPED_OUT: { label: "Dropped out", color: "bg-amber-50 text-amber-800 border-amber-200",       dot: "bg-amber-500" },
};

const MATERIAL_STYLES = {
  SCHOOL_FEES: { label: "School Fees",  color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  UNIFORM:     { label: "Uniform",      color: "bg-purple-50 text-purple-700 border-purple-200",    dot: "bg-purple-500" },
  SUPPLIES:    { label: "Supplies",     color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  TUTORING:    { label: "Tutoring",     color: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  BOOTCAMP:    { label: "Bootcamp",     color: "bg-pink-50 text-pink-700 border-pink-200",          dot: "bg-pink-500" },
};

const inputCls =
  "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition text-sm text-slate-800 bg-white";

// ── Rank helpers ──────────────────────────────────────────────────────────────
const ordinal = (n) => {
  if (n == null) return null;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Small rank badge — top-3 get trophy colours */
const RankBadge = ({ rank, className = "" }) => {
  if (rank == null) return null;
  const top3 = {
    1: "bg-amber-50 text-amber-700 border-amber-300",
    2: "bg-slate-100 text-slate-600 border-slate-300",
    3: "bg-orange-50 text-orange-700 border-orange-300",
  };
  const style = top3[rank] || "bg-indigo-50 text-indigo-700 border-indigo-200";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${style} ${className}`}>
      <FontAwesomeIcon icon={faTrophy} className="text-[9px]" />
      {ordinal(rank)}
    </span>
  );
};

// ── File type detection ───────────────────────────────────────────────────────
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const DOC_EXTS   = ["doc", "docx"];

const getFileKind = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (DOC_EXTS.includes(ext)) return "doc";
  return "other";
};

const FILE_KIND_META = {
  image: { icon: faFileImage,    color: "text-emerald-500" },
  pdf:   { icon: faFilePdf,      color: "text-rose-500" },
  doc:   { icon: faFileWord,     color: "text-blue-500" },
  other: { icon: faFileDownload, color: "text-slate-400" },
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
            type="button" disabled={isDeleting} onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button" disabled={isDeleting} onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            {isDeleting ? <><FontAwesomeIcon icon={faSpinner} spin /> Deleting…</> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── File Action Dropdown ──────────────────────────────────────────────────────
const FileActionDropdown = ({ url, filename, fileId, canDelete, onTriggerDelete, onDownload, positionCls = "top-2 right-2" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
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
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onTriggerDelete(fileId); }}
              className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-bold border-t border-slate-100"
            >
              <FontAwesomeIcon icon={faTrash} className="w-3" /> Delete File
            </button>
          )}
        </div>
      )}
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

// ── Stat Tile ─────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, suffix = "%", danger, raw }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">{label}</p>
    <p className={`text-2xl font-black font-mono ${danger ? "text-rose-600" : "text-slate-800"}`}>
      {value != null ? (raw ? value : `${value}${suffix}`) : "—"}
    </p>
    {value != null && !raw && (
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${danger ? "bg-rose-500" : "bg-emerald-500"}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    )}
  </div>
);

// ── Rank Tile (for detail panel) ──────────────────────────────────────────────
const RankTile = ({ rank }) => {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const medal = medals[rank] || null;
  return (
    <div className={`border rounded-2xl p-4 text-center ${rank <= 3 ? "bg-amber-50 border-amber-200" : "bg-indigo-50 border-indigo-200"}`}>
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Class Rank</p>
      <p className={`text-2xl font-black font-mono ${rank <= 3 ? "text-amber-700" : "text-indigo-700"}`}>
        {medal ? `${medal} ` : ""}{ordinal(rank)}
      </p>
    </div>
  );
};

// ── Detail Panel (Academic) ───────────────────────────────────────────────────
const AcademicDetailPanel = ({ record, onClose, onEdit, onDelete, canEdit, canDelete }) => {
  const [lightbox, setLightbox]                 = useState(null);
  const [confirmFileId, setConfirmFileId]       = useState(null);
  const [confirmFileLabel, setConfirmFileLabel] = useState("");
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(false);
  const [hiddenFileIds, setHiddenFileIds]       = useState(() => new Set());
  const [deleteAcademicRecordFile, { isLoading: isDeletingFile }] = useDeleteAcademicRecordFileMutation();

  if (!record) return null;

  const promo        = PROMOTION_STYLES[record.promotionStatus] || PROMOTION_STYLES.PENDING;
  const visibleFiles = (record.files || []).filter((f) => !hiddenFileIds.has(f.id));

  const handleDownload = async (url, filename) => {
    try {
      const resp    = await fetch(`${SERVER_BASE_URL}${url}`);
      const blob    = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a       = document.createElement("a");
      a.href = blobUrl; a.download = filename || "file";
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(blobUrl); document.body.removeChild(a);
    } catch {
      const a = document.createElement("a");
      a.href = `${SERVER_BASE_URL}${url}`; a.download = filename || "file"; a.target = "_blank"; a.click();
    }
  };

  const handleTriggerFileDelete = (fileId) => {
    const file = record.files?.find((f) => f.id === fileId);
    setConfirmFileId(fileId);
    setConfirmFileLabel(file?.fileName || "this file");
  };

  const handleFileDeleteSubmit = async () => {
    if (!confirmFileId) return;
    const fileId = confirmFileId;
    setHiddenFileIds((prev) => new Set(prev).add(fileId));
    if (lightbox?.fileId === fileId) setLightbox(null);
    setConfirmFileId(null);
    setConfirmFileLabel("");
    try {
      await deleteAcademicRecordFile({ recordId: record.id, fileId, childId: record.childId }).unwrap();
    } catch {
      setHiddenFileIds((prev) => { const next = new Set(prev); next.delete(fileId); return next; });
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
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-5 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${promo.color.split(" ")[1]}`}>
                {promo.label}
              </span>
              {record.rank != null && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 text-amber-700 border-amber-300 flex items-center gap-1">
                  <FontAwesomeIcon icon={faTrophy} className="text-[9px]" /> {ordinal(record.rank)}
                </span>
              )}
            </div>
            <h2 className="text-white font-black text-lg leading-tight">
              {record.grade} · {record.academicYear}
              {record.semester ? ` · ${record.semester}` : ""}
            </h2>
            <p className="text-sky-100 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faSchool} className="text-[10px]" />
              {record.schoolName}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5">
          {/* Overview */}
          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Academic Overview</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <DetailRow icon={faSchool}        label="School"           value={record.schoolName} />
              <DetailRow icon={faCalendarAlt}   label="Academic Year"    value={record.academicYear} />
              <DetailRow icon={faGraduationCap} label="Grade / Level"    value={record.grade} />
              {record.semester && <DetailRow icon={faCalendarAlt} label="Semester / Term" value={record.semester} />}
              <DetailRow icon={faTrophy}        label="Class Rank"       value={record.rank != null ? ordinal(record.rank) : null} />
              <DetailRow icon={faUser}          label="Recorded By"      value={record.recordedBy ? `${record.recordedBy.firstName} ${record.recordedBy.lastName}` : null} />
            </div>
          </div>

          {/* Scores + Rank tiles */}
          <div className={`px-6 grid gap-3 ${record.rank != null ? "grid-cols-3" : "grid-cols-2"}`}>
            <StatTile label="Average Score"   value={record.averageScore}   danger={record.averageScore != null && record.averageScore < 50} />
            <StatTile label="Attendance Rate" value={record.attendanceRate} danger={record.attendanceRate != null && record.attendanceRate < 70} />
            {record.rank != null && <RankTile rank={record.rank} />}
          </div>

          {/* Promotion status */}
          <div className="px-6">
            <div className={`rounded-2xl p-4 border flex items-center gap-3 ${promo.color}`}>
              <div className={`w-3 h-3 rounded-full ${promo.dot}`} />
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase opacity-70">Promotion Status</p>
                <p className="text-sm font-bold">{promo.label}</p>
              </div>
            </div>
          </div>

          {/* Teacher notes */}
          {record.teacherNotes && (
            <div className="px-6">
              <DescBlock icon={faNotesMedical} label="Evaluator Notes" value={record.teacherNotes} bg="bg-sky-50/70 border-sky-100" iconColor="text-sky-500" emptyText="" />
            </div>
          )}

          {/* Alerts */}
          {record.alerts?.length > 0 && (
            <div className="px-6 space-y-2">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Risk Alerts</p>
              {record.alerts.map((alert) => (
                <div key={alert.id} className={`p-3.5 rounded-2xl border flex items-start gap-3 ${alert.isResolved ? "bg-emerald-50/70 border-emerald-100" : "bg-rose-50/70 border-rose-100"}`}>
                  <FontAwesomeIcon icon={alert.isResolved ? faCheckCircle : faTriangleExclamation} className={`mt-0.5 shrink-0 ${alert.isResolved ? "text-emerald-500" : "text-rose-500"}`} />
                  <div>
                    <p className="text-xs font-bold text-slate-700">{alert.alertType}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Files grid */}
          {visibleFiles.length > 0 && (
            <div className="px-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileDownload} className="text-purple-400" />
                Attached Documents ({visibleFiles.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {visibleFiles.map((file) => {
                  const url      = file.url;
                  const filename = file.fileName || "document";
                  const kind     = getFileKind(filename);
                  const meta     = FILE_KIND_META[kind];
                  return (
                    <div key={file.id} className="group relative aspect-square rounded-xl overflow-visible border border-slate-200 bg-slate-50 shadow-sm">
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xl overflow-hidden"
                        onClick={() => setLightbox({ url, filename, fileId: file.id, kind })}
                      >
                        {kind === "image" ? (
                          <img
                            src={`${SERVER_BASE_URL}${url}`}
                            alt={filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={meta.icon} className={`${meta.color} text-2xl`} />
                            <p className="text-[9px] text-slate-400 font-semibold truncate px-1 w-full text-center">{filename}</p>
                          </>
                        )}
                        {kind === "image" && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <FontAwesomeIcon icon={faEye} className="text-white text-sm" />
                          </div>
                        )}
                      </div>
                      <FileActionDropdown
                        url={url}
                        filename={filename}
                        fileId={file.id}
                        canDelete={canDelete}
                        onTriggerDelete={handleTriggerFileDelete}
                        onDownload={handleDownload}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {canEdit && (
            <button onClick={() => onEdit(record)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm hover:bg-sky-100 transition border border-sky-200">
              <FontAwesomeIcon icon={faPencilAlt} className="text-xs" /> Edit Record
            </button>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDeleteRecord(true)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200">
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete Record
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
            className="relative max-w-4xl w-full max-h-[85vh] rounded-2xl bg-slate-950 p-2 shadow-2xl border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-25 mt-15 z-20">
              <FileActionDropdown
                url={lightbox.url}
                filename={lightbox.filename}
                fileId={lightbox.fileId}
                canDelete={canDelete}
                onTriggerDelete={handleTriggerFileDelete}
                onDownload={handleDownload}
                positionCls="top-0 left-0"
              />
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute mt-15 top-4 right-6 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition z-20 border border-white/10"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>

            {lightbox.kind === "image" ? (
              <img
                src={`${SERVER_BASE_URL}${lightbox.url}`}
                alt={lightbox.filename}
                className="max-h-[80vh] w-auto mx-auto rounded-xl object-contain"
              />
            ) : lightbox.kind === "pdf" ? (
              <div className="flex mt-10 flex-col gap-2 p-2">
                <iframe
                  title={lightbox.filename}
                  src={`${SERVER_BASE_URL}${lightbox.url}`}
                  className="w-full h-[75vh] rounded-xl bg-white border-0"
                />
                <p className="text-center text-slate-400 text-[11px] font-semibold pb-1">{lightbox.filename}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 gap-4">
                <FontAwesomeIcon
                  icon={FILE_KIND_META[lightbox.kind]?.icon || faFileDownload}
                  className={`${FILE_KIND_META[lightbox.kind]?.color || "text-slate-400"} text-5xl`}
                />
                <p className="text-slate-300 text-sm font-semibold">{lightbox.filename}</p>
                <p className="text-slate-500 text-xs">Preview isn't available for this file type</p>
                <button
                  onClick={() => handleDownload(lightbox.url, lightbox.filename)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primBtn hover:bg-Hover text-white rounded-xl font-bold text-xs transition"
                >
                  <FontAwesomeIcon icon={faDownload} /> Download File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!confirmFileId}
        onClose={() => { setConfirmFileId(null); setConfirmFileLabel(""); }}
        onConfirm={handleFileDeleteSubmit}
        title="Delete Attached File?"
        message={`"${confirmFileLabel}" will be permanently removed from this record.`}
        isDeleting={isDeletingFile}
      />
      <DeleteConfirmationModal
        isOpen={confirmDeleteRecord}
        onClose={() => setConfirmDeleteRecord(false)}
        onConfirm={() => { setConfirmDeleteRecord(false); onDelete(record); onClose(); }}
        title="Delete Academic Record?"
        message="This will permanently delete this academic record, its attached files, and any related alerts."
        isDeleting={false}
      />
    </>
  );
};

// ── Detail Panel (Material) ───────────────────────────────────────────────────
const MaterialDetailPanel = ({ record, onClose, onEdit, onDelete, canEdit, canDelete }) => {
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(false);
  if (!record) return null;
  const ms = MATERIAL_STYLES[record.type] || MATERIAL_STYLES.SUPPLIES;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed mt-10 scale-80 right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)" }}
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-500 px-6 py-5 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${ms.color.split(" ")[1]}`}>
              {ms.label}
            </span>
            <h2 className="text-white font-black text-lg leading-tight">
              {ms.label}{record.quantity ? ` — Qty ${record.quantity}` : ""}
            </h2>
            <p className="text-purple-100 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
              {new Date(record.distributeDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-5 py-5">
          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Distribution Details</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <DetailRow icon={faBriefcase}   label="Support Type"      value={ms.label} />
              <DetailRow icon={faCalendarAlt} label="Distribution Date" value={new Date(record.distributeDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              <DetailRow icon={faChartBar}    label="Quantity"          value={record.quantity ? String(record.quantity) : null} />
              <DetailRow icon={faCalendarAlt} label="Academic Year"     value={record.academicYear} />
              <DetailRow icon={faUser}        label="Distributed By"    value={record.distributedBy ? `${record.distributedBy.firstName} ${record.distributedBy.lastName}` : null} />
            </div>
          </div>
          {record.description && (
            <div className="px-6">
              <DescBlock icon={faNotesMedical} label="Fulfillment Notes" value={record.description} bg="bg-purple-50/70 border-purple-100" iconColor="text-purple-500" emptyText="" />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {canEdit && (
            <button onClick={() => onEdit(record)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm hover:bg-sky-100 transition border border-sky-200">
              <FontAwesomeIcon icon={faPencilAlt} className="text-xs" /> Edit Record
            </button>
          )}
          {canDelete && (
            <button onClick={() => setConfirmDeleteRecord(true)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200">
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete Record
            </button>
          )}
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={confirmDeleteRecord}
        onClose={() => setConfirmDeleteRecord(false)}
        onConfirm={() => { setConfirmDeleteRecord(false); onDelete(record); onClose(); }}
        title="Delete Material Support Entry?"
        message="This will permanently delete this material support entry. This action cannot be undone."
        isDeleting={false}
      />
    </>
  );
};

// ── Academic Card ─────────────────────────────────────────────────────────────
const AcademicCard = ({ rec, onSelect, active, onDelete, canDelete }) => {
  const promo    = PROMOTION_STYLES[rec.promotionStatus] || PROMOTION_STYLES.PENDING;
  const hasAlert = rec.alerts?.some((a) => !a.isResolved);
  const [confirmCardDelete, setConfirmCardDelete] = useState(false);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"}`}
      >
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${promo.dot}`} />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={hasAlert ? faTriangleExclamation : faGraduationCap} className={hasAlert ? "text-amber-500 text-sm" : "text-blue-500 text-sm"} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${promo.color}`}>
                {promo.label}
              </span>
              {rec.rank != null && <RankBadge rank={rec.rank} />}
              {hasAlert && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-[9px]" /> Alert
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                {rec.grade}
                <span className="text-xs font-bold text-slate-400">· {rec.academicYear}</span>
              </span>
              {rec.semester && <span className="flex items-center gap-1.5 font-medium">{rec.semester}</span>}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{rec.schoolName}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              {rec.averageScore != null && (
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  Avg: <span className={rec.averageScore < 50 ? "text-rose-600" : "text-emerald-600"}>{rec.averageScore}%</span>
                </span>
              )}
              {rec.attendanceRate != null && (
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  Attend: <span className={rec.attendanceRate < 70 ? "text-rose-600" : "text-emerald-600"}>{rec.attendanceRate}%</span>
                </span>
              )}
              {rec.files?.length > 0 && (
                <span className="flex items-center gap-1 text-purple-500 font-semibold">
                  <FontAwesomeIcon icon={faFileDownload} className="text-[9px]" />
                  {rec.files.length} doc{rec.files.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
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
        onConfirm={async () => { await onDelete(rec); setConfirmCardDelete(false); }}
        title="Delete Academic Record?"
        message="This will permanently delete this academic record, its attached files, and any related alerts."
        isDeleting={false}
      />
    </>
  );
};

// ── Material Card ─────────────────────────────────────────────────────────────
const MaterialCard = ({ mat, onSelect, active, onDelete, canDelete }) => {
  const ms = MATERIAL_STYLES[mat.type] || MATERIAL_STYLES.SUPPLIES;
  const [confirmCardDelete, setConfirmCardDelete] = useState(false);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"}`}
      >
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${ms.dot}`} />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={faBriefcase} className="text-purple-500 text-sm" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${ms.color}`}>
                {ms.label}
              </span>
              {mat.academicYear && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{mat.academicYear}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[9px]" />
                {new Date(mat.distributeDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              {mat.quantity && <span className="font-medium">Qty: {mat.quantity}</span>}
            </div>
            {mat.description && (
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{mat.description}</p>
            )}
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
        onConfirm={async () => { await onDelete(mat); setConfirmCardDelete(false); }}
        title="Delete Material Entry?"
        message="This material support entry will be permanently deleted."
        isDeleting={false}
      />
    </>
  );
};

// ── File upload row ───────────────────────────────────────────────────────────
const FileRow = ({ file, onRemove }) => {
  const kind = getFileKind(file.name);
  const meta = FILE_KIND_META[kind];
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (kind !== "image") return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          {previewUrl
            ? <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
            : <FontAwesomeIcon icon={meta.icon} className={`${meta.color} text-xs`} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      </div>
      <button
        type="button" onClick={onRemove}
        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition ml-2 shrink-0"
      >
        <FontAwesomeIcon icon={faTimes} className="text-xs" />
      </button>
    </div>
  );
};

// ── Academic Record Form ──────────────────────────────────────────────────────
const AcademicForm = ({ editRecord, childId, onClose }) => {
  const isEdit = !!editRecord;
  const [deleteAcademicRecordFile, { isLoading: isDeletingFile }] = useDeleteAcademicRecordFileMutation();
  const [createAcademicRecord, { isLoading: isCreating }]         = useCreateAcademicRecordMutation();
  const [updateAcademicRecord, { isLoading: isUpdating }]         = useUpdateAcademicRecordMutation();
  const isSaving = isCreating || isUpdating;

  const [form, setForm] = useState(() => ({
    schoolName:      editRecord?.schoolName || "",
    academicYear:    editRecord?.academicYear || new Date().getFullYear().toString(),
    grade:           editRecord?.grade || "",
    semester:        editRecord?.semester || "",
    rank:            editRecord?.rank != null ? String(editRecord.rank) : "",
    averageScore:    editRecord?.averageScore != null ? String(editRecord.averageScore) : "",
    attendanceRate:  editRecord?.attendanceRate != null ? String(editRecord.attendanceRate) : "",
    promotionStatus: editRecord?.promotionStatus || "PENDING",
    teacherNotes:    editRecord?.teacherNotes || "",
  }));
  const [selectedFiles, setSelectedFiles]       = useState([]);
  const [confirmFileId, setConfirmFileId]       = useState(null);
  const [confirmFileLabel, setConfirmFileLabel] = useState("");
  const [hiddenFileIds, setHiddenFileIds]       = useState(() => new Set());
  const visibleExistingFiles = (editRecord?.files || []).filter((f) => !hiddenFileIds.has(f.id));

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    setSelectedFiles((p) => [...p, ...Array.from(e.target.files)]);
    e.target.value = "";
  };

  const handleDeleteExistingFile = async () => {
    if (!confirmFileId) return;
    const fileId = confirmFileId;
    setHiddenFileIds((prev) => new Set(prev).add(fileId));
    setConfirmFileId(null);
    setConfirmFileLabel("");
    try {
      await deleteAcademicRecordFile({ recordId: editRecord.id, fileId, childId }).unwrap();
    } catch {
      setHiddenFileIds((prev) => { const next = new Set(prev); next.delete(fileId); return next; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (!isEdit) fd.append("childId", childId);
    fd.append("schoolName",      form.schoolName);
    fd.append("academicYear",    form.academicYear);
    fd.append("grade",           form.grade);
    if (form.semester)       fd.append("semester",       form.semester);
    if (form.rank !== "")    fd.append("rank",           form.rank);
    if (form.averageScore)   fd.append("averageScore",   form.averageScore);
    if (form.attendanceRate) fd.append("attendanceRate", form.attendanceRate);
    fd.append("promotionStatus", form.promotionStatus);
    if (form.teacherNotes)   fd.append("teacherNotes",  form.teacherNotes);
    selectedFiles.forEach((f) => fd.append("files", f));

    try {
      if (isEdit) await updateAcademicRecord({ recordId: editRecord.id, formData: fd, childId }).unwrap();
      else        await createAcademicRecord(fd).unwrap();
      onClose();
    } catch { /* toast handled by RTK */ }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white scale-80 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <FontAwesomeIcon icon={isEdit ? faPencilAlt : faGraduationCap} className="text-sm" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{isEdit ? "Edit Academic Record" : "Add Academic Record"}</h3>
                <p className="text-xs text-slate-400">School performance & promotion</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">School Name <span className="text-rose-400">*</span></label>
                <input required type="text" name="schoolName" value={form.schoolName} onChange={change} placeholder="e.g. Wachamo Secondary School" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Academic Year <span className="text-rose-400">*</span></label>
                <input required type="text" name="academicYear" value={form.academicYear} onChange={change} placeholder="e.g. 2026" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Grade / Level <span className="text-rose-400">*</span></label>
                <input required type="text" name="grade" value={form.grade} onChange={change} placeholder="e.g. Grade 9" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Semester / Term</label>
                <input type="text" name="semester" value={form.semester} onChange={change} placeholder="e.g. Semester 1" className={inputCls} />
              </div>

              {/* Rank field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTrophy} className="text-amber-400 text-[10px]" />
                  Class Rank
                </label>
                <input
                  type="number" min="1" step="1"
                  name="rank" value={form.rank} onChange={change}
                  placeholder="e.g. 3"
                  className={inputCls}
                />
                <p className="text-[10px] text-slate-400">Position in class (1 = top)</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Promotion Status</label>
                <div className="relative">
                  <select name="promotionStatus" value={form.promotionStatus} onChange={change} className={inputCls + " appearance-none pr-8"}>
                    {Object.entries(PROMOTION_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Average Score (%)</label>
                <input type="number" min="0" max="100" step="0.01" name="averageScore" value={form.averageScore} onChange={change} placeholder="0 – 100" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Attendance Rate (%)</label>
                <input type="number" min="0" max="100" step="0.01" name="attendanceRate" value={form.attendanceRate} onChange={change} placeholder="0 – 100" className={inputCls} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Teacher Notes / Evaluation</label>
              <textarea name="teacherNotes" rows={3} value={form.teacherNotes} onChange={change} placeholder="Behaviour summary or bottleneck feedback…" className={inputCls + " resize-none"} />
            </div>

            {/* Existing files */}
            {isEdit && visibleExistingFiles.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileDownload} className="text-purple-400" /> Attached Documents
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {visibleExistingFiles.map((file) => {
                    const filename = file.fileName || "Attachment";
                    const kind     = getFileKind(filename);
                    const meta     = FILE_KIND_META[kind];
                    const fileUrl  = `${SERVER_BASE_URL}${file.url}`;
                    return (
                      <div key={file.id} className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {kind === "image"
                            ? <img src={fileUrl} alt={filename} className="w-full h-full object-cover" />
                            : <FontAwesomeIcon icon={meta.icon} className={`${meta.color} text-xs`} />}
                        </div>
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-700 truncate flex-1 hover:text-primBtn transition">{filename}</a>
                        <button
                          type="button"
                          onClick={() => { setConfirmFileId(file.id); setConfirmFileLabel(filename); }}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition shrink-0"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New file upload */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <FontAwesomeIcon icon={faCloudUploadAlt} />
                {isEdit ? "Add More Documents" : "Report Cards & Verification Files"}
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-primBtn bg-slate-50 hover:bg-primBtn/5 rounded-2xl p-5 text-center cursor-pointer transition">
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-slate-300 text-2xl mb-1" />
                <p className="text-xs font-semibold text-slate-600">Click to upload report card</p>
                <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 15 MB</p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedFiles.map((f, i) => (
                    <FileRow key={i} file={f} onRemove={() => setSelectedFiles((p) => p.filter((_, j) => j !== i))} />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition">Cancel</button>
              <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-primBtn hover:bg-Hover disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin /> {isEdit ? "Updating…" : "Saving…"}</> : isEdit ? "Update Record" : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!confirmFileId}
        onClose={() => { setConfirmFileId(null); setConfirmFileLabel(""); }}
        onConfirm={handleDeleteExistingFile}
        title="Remove Attached File?"
        message={`"${confirmFileLabel}" will be permanently deleted from this record.`}
        isDeleting={isDeletingFile}
      />
    </>
  );
};

// ── Material Support Form ─────────────────────────────────────────────────────
const MaterialForm = ({ editMaterial, childId, onClose }) => {
  const isEdit = !!editMaterial;
  const [createMaterialSupport, { isLoading: isCreating }] = useCreateMaterialSupportMutation();
  const [updateMaterialSupport, { isLoading: isUpdating }] = useUpdateMaterialSupportMutation();
  const isSaving = isCreating || isUpdating;

  const [form, setForm] = useState({
    type:           editMaterial?.type || "SUPPLIES",
    quantity:       editMaterial?.quantity != null ? String(editMaterial.quantity) : "1",
    distributeDate: editMaterial?.distributeDate
      ? new Date(editMaterial.distributeDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    academicYear:   editMaterial?.academicYear || new Date().getFullYear().toString(),
    description:    editMaterial?.description || "",
  });

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      type: form.type,
      quantity: Number(form.quantity),
      distributeDate: new Date(form.distributeDate).toISOString(),
      academicYear: form.academicYear,
      description: form.description,
    };
    try {
      if (isEdit) await updateMaterialSupport({ materialId: editMaterial.id, data, childId }).unwrap();
      else        await createMaterialSupport({ childId, ...data }).unwrap();
      onClose();
    } catch { /* handled */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white scale-80 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
              <FontAwesomeIcon icon={isEdit ? faPencilAlt : faBriefcase} className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{isEdit ? "Edit Distribution" : "Log Material Distribution"}</h3>
              <p className="text-xs text-slate-400">Material & resource allocation</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Support Category <span className="text-rose-400">*</span></label>
            <div className="relative">
              <select name="type" value={form.type} onChange={change} className={inputCls + " appearance-none pr-8"}>
                {Object.entries(MATERIAL_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Quantity <span className="text-rose-400">*</span></label>
              <input required type="number" min="1" name="quantity" value={form.quantity} onChange={change} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Academic Year</label>
              <input type="text" name="academicYear" value={form.academicYear} onChange={change} placeholder="e.g. 2026" className={inputCls} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Distribution Date <span className="text-rose-400">*</span></label>
            <input required type="date" name="distributeDate" value={form.distributeDate} onChange={change} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Fulfillment Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={change} placeholder="Provide extra contextual specifics…" className={inputCls + " resize-none"} />
          </div>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-primBtn hover:bg-Hover disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
              {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin /> {isEdit ? "Updating…" : "Saving…"}</> : isEdit ? "Update Record" : "Log Distribution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main EducationTab ─────────────────────────────────────────────────────────
const EducationTab = ({ childId, canCreate = true, canEdit = true, canDelete = true }) => {
  const { data: academicsRaw = [], isLoading: loadingAc }  = useGetAcademicRecordsQuery(childId, { skip: !childId });
  const { data: materialsRaw = [], isLoading: loadingMat } = useGetMaterialSupportsQuery(childId, { skip: !childId });
  const [deleteAcademicRecord]  = useDeleteAcademicRecordMutation();
  const [deleteMaterialSupport] = useDeleteMaterialSupportMutation();

  const academics = Array.isArray(academicsRaw) ? academicsRaw : (academicsRaw?.data || []);
  const materials = Array.isArray(materialsRaw) ? materialsRaw : (materialsRaw?.data || []);
  const isLoading = loadingAc || loadingMat;

  const [activePanel,      setActivePanel]      = useState(null);
  const [showAcademicForm, setShowAcademicForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editAcademic,     setEditAcademic]     = useState(null);
  const [editMaterial,     setEditMaterial]     = useState(null);

  // KPI
  const overdueAlerts = academics.filter((r) => r.alerts?.some((a) => !a.isResolved)).length;
  const promoted      = academics.filter((r) => r.promotionStatus === "PROMOTED").length;
  const topRanked     = academics.filter((r) => r.rank != null && r.rank <= 3).length;

  const handleDeleteAcademic = async (rec) => {
    try {
      await deleteAcademicRecord({ recordId: rec.id, childId }).unwrap();
      if (activePanel?.data?.id === rec.id) setActivePanel(null);
    } catch { /* handled */ }
  };

  const handleDeleteMaterial = async (mat) => {
    try {
      await deleteMaterialSupport({ materialId: mat.id, childId }).unwrap();
      if (activePanel?.data?.id === mat.id) setActivePanel(null);
    } catch { /* handled */ }
  };

  const openEditAcademic = (rec) => { setActivePanel(null); setEditAcademic(rec); setShowAcademicForm(true); };
  const openEditMaterial = (mat) => { setActivePanel(null); setEditMaterial(mat); setShowMaterialForm(true); };

  return (
    <TabShell
      title="Education & Material Support"
      icon={faGraduationCap}
      actions={canCreate ? [
        { label: "Academic Record", icon: faChartBar,  onClick: () => { setEditAcademic(null); setShowAcademicForm(true); } },
        { label: "Material",        icon: faBriefcase, onClick: () => { setEditMaterial(null); setShowMaterialForm(true); } },
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
        {(academics.length + materials.length) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Academic Records", val: academics.length, cls: "bg-blue-50 text-blue-700 border border-blue-200" },
              { label: "Material Entries", val: materials.length, cls: "bg-purple-50 text-purple-700 border border-purple-200" },
              { label: "Promoted",         val: promoted,         cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
              { label: "Top-3 Ranked",     val: topRanked,        cls: topRanked > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600" },
              { label: "Active Alerts",    val: overdueAlerts,    cls: overdueAlerts > 0 ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-100 text-slate-600" },
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
            {/* Academic Records */}
            <div>
              <SubSection title="Academic Records" />
              {academics.length === 0 ? (
                <EmptyState icon={faGraduationCap} message="No academic records yet" />
              ) : (
                <div className="space-y-3 mt-3">
                  {[...academics]
                    .sort((a, b) => (b.academicYear || "").localeCompare(a.academicYear || ""))
                    .map((rec) => (
                      <AcademicCard
                        key={rec.id}
                        rec={rec}
                        onSelect={() => setActivePanel({ type: "academic", data: rec })}
                        active={activePanel?.data?.id === rec.id && activePanel?.type === "academic"}
                        onDelete={handleDeleteAcademic}
                        canDelete={canDelete}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Material Support */}
            <div>
              <SubSection title="Material Support" />
              {materials.length === 0 ? (
                <EmptyState icon={faBriefcase} message="No material support records yet" />
              ) : (
                <div className="space-y-3 mt-3">
                  {[...materials]
                    .sort((a, b) => new Date(b.distributeDate) - new Date(a.distributeDate))
                    .map((mat) => (
                      <MaterialCard
                        key={mat.id}
                        mat={mat}
                        onSelect={() => setActivePanel({ type: "material", data: mat })}
                        active={activePanel?.data?.id === mat.id && activePanel?.type === "material"}
                        onDelete={handleDeleteMaterial}
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
      {activePanel?.type === "academic" && (
        <AcademicDetailPanel
          record={activePanel.data}
          onClose={() => setActivePanel(null)}
          onEdit={openEditAcademic}
          onDelete={handleDeleteAcademic}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
      {activePanel?.type === "material" && (
        <MaterialDetailPanel
          record={activePanel.data}
          onClose={() => setActivePanel(null)}
          onEdit={openEditMaterial}
          onDelete={handleDeleteMaterial}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* Forms */}
      {showAcademicForm && (
        <AcademicForm
          editRecord={editAcademic}
          childId={childId}
          onClose={() => { setShowAcademicForm(false); setEditAcademic(null); }}
        />
      )}
      {showMaterialForm && (
        <MaterialForm
          editMaterial={editMaterial}
          childId={childId}
          onClose={() => { setShowMaterialForm(false); setEditMaterial(null); }}
        />
      )}
    </TabShell>
  );
};

export default EducationTab;