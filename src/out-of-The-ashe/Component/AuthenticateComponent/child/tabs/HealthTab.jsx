import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeartPulse, faPlus, faTrash, faStethoscope,
  faSyringe, faWeightScale, faTimes, faUpload,
  faCalendarAlt, faUser, faHospital, faSpinner,
  faNotesMedical, faTriangleExclamation, faDownload,
  faFileMedical, faFileImage, faFilePdf, faPencilAlt,
  faExclamationTriangle, faEllipsisV, faChevronRight,
  faInfoCircle, faFileWord, faFile,
} from "@fortawesome/free-solid-svg-icons";
import { TabShell, EmptyState, SubSection } from "./TabShell";
import {
  useGetHealthRecordsQuery,
  useGetVaccinationsQuery,
  useGetNutritionRecordsQuery,
  useCreateHealthRecordMutation,
  useAddVaccinationMutation,
  useAddNutritionRecordMutation,
  useUpdateHealthRecordMutation,
  useUpdateVaccinationMutation,
  useUpdateNutritionRecordMutation,
  useDeleteHealthRecordMutation,
  useDeleteVaccinationMutation,
  useDeleteNutritionRecordMutation,
  useDeleteHealthFileMutation,
} from "../../../../Redux/healthApi";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_DEFAULT_BACKEND;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const isImageFile = (url = "") => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url);
const isPdfFile   = (url = "") => /\.pdf$/i.test(url);
const isDocFile   = (url = "") => /\.(docx?|odt|rtf)$/i.test(url);

const fileFullUrl = (file) =>
  file.url?.startsWith("http") ? file.url : `${API_BASE}${file.url}`;

// Returns { isImg, isPdf, isDoc } flags for a given file url string
const getFileFlags = (url = "") => ({
  isImg: isImageFile(url),
  isPdf: isPdfFile(url),
  isDoc: isDocFile(url),
});

const bmiStatus = (bmi) => {
  if (!bmi) return null;
  if (bmi < 16)   return { label: "Severely underweight", color: "bg-red-50 text-red-700 border-red-200",    dot: "bg-red-500" };
  if (bmi < 18.5) return { label: "Underweight",          color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
  if (bmi < 25)   return { label: "Normal weight",        color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
  return               { label: "Overweight",            color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" };
};

const fmtSize = (bytes) => {
  if (!bytes) return "";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + ["B", "KB", "MB"][i];
};

const inputCls =
  "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition text-sm text-slate-800 bg-white";

// ── Section configs ───────────────────────────────────────────────────────────
const SECTION_CONFIG = {
  health: {
    label: "Health Record",
    icon: faStethoscope,
    dot: "bg-emerald-500",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-500",
    gradient: "from-emerald-600 to-teal-500",
  },
  nutrition: {
    label: "Nutrition Log",
    icon: faWeightScale,
    dot: "bg-sky-500",
    color: "bg-sky-50 text-sky-700 border-sky-200",
    iconColor: "text-sky-500",
    gradient: "from-sky-600 to-blue-500",
  },
  vaccine: {
    label: "Vaccination",
    icon: faSyringe,
    dot: "bg-purple-500",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    iconColor: "text-purple-500",
    gradient: "from-purple-600 to-indigo-500",
  },
};

// ── File type icon helper ─────────────────────────────────────────────────────
const FileTypeIcon = ({ url = "", className = "text-2xl" }) => {
  if (isImageFile(url)) return <FontAwesomeIcon icon={faFileImage} className={`text-sky-400 ${className}`} />;
  if (isPdfFile(url))   return <FontAwesomeIcon icon={faFilePdf}   className={`text-rose-400 ${className}`} />;
  if (isDocFile(url))   return <FontAwesomeIcon icon={faFileWord}  className={`text-blue-400 ${className}`} />;
  return <FontAwesomeIcon icon={faFile} className={`text-slate-400 ${className}`} />;
};

// ── Lightbox content renderer ─────────────────────────────────────────────────
// Handles images (native), PDFs (iframe), and Word/doc files (Google Docs viewer)
const LightboxContent = ({ url, filename, isImg, isPdf, isDoc, onDownload }) => {
  const [iframeError, setIframeError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (isImg) {
    return (
      <img
        src={url}
        alt={filename}
        className="max-w-full max-h-[60vh] object-contain rounded-xl select-none"
      />
    );
  }

  if (isPdf) {
    return (
      <div className="w-full h-[60vh] relative rounded-xl overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 rounded-xl">
            <FontAwesomeIcon icon={faSpinner} spin className="text-slate-400 text-2xl" />
            <p className="text-slate-400 text-xs font-semibold">Loading PDF…</p>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full rounded-xl border-0"
          title={filename}
          onLoad={() => setLoaded(true)}
          onError={() => setIframeError(true)}
        />
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 rounded-xl">
            <FontAwesomeIcon icon={faFilePdf} className="text-rose-400 text-4xl" />
            <p className="text-slate-300 text-xs font-semibold text-center px-4">{filename}</p>
            <button
              onClick={() => onDownload(url, filename)}
              className="flex items-center gap-2 px-4 py-2 bg-primBtn hover:bg-Hover text-white rounded-xl font-bold text-xs transition"
            >
              <FontAwesomeIcon icon={faDownload} /> Download PDF
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isDoc) {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <div className="w-full h-[60vh] relative rounded-xl overflow-hidden">
        {!loaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 rounded-xl">
            <FontAwesomeIcon icon={faSpinner} spin className="text-slate-400 text-2xl" />
            <p className="text-slate-400 text-xs font-semibold">Loading document…</p>
          </div>
        )}
        {!iframeError && (
          <iframe
            src={viewerUrl}
            className="w-full h-full rounded-xl border-0"
            title={filename}
            onLoad={() => setLoaded(true)}
            onError={() => setIframeError(true)}
          />
        )}
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 rounded-xl">
            <FontAwesomeIcon icon={faFileWord} className="text-blue-400 text-4xl" />
            <p className="text-slate-300 text-xs font-semibold text-center px-4">{filename}</p>
            <p className="text-slate-500 text-[10px] text-center px-6">Preview unavailable — download to view</p>
            <button
              onClick={() => onDownload(url, filename)}
              className="flex items-center gap-2 px-4 py-2 bg-primBtn hover:bg-Hover text-white rounded-xl font-bold text-xs transition"
            >
              <FontAwesomeIcon icon={faDownload} /> Download File
            </button>
          </div>
        )}
      </div>
    );
  }

  // Unknown file type — just download
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-3">
      <FontAwesomeIcon icon={faFile} className="text-slate-400 text-4xl" />
      <p className="text-slate-300 text-xs font-semibold text-center px-4">{filename}</p>
      <button
        onClick={() => onDownload(url, filename)}
        className="flex items-center gap-2 px-4 py-2 bg-primBtn hover:bg-Hover text-white rounded-xl font-bold text-xs transition"
      >
        <FontAwesomeIcon icon={faDownload} /> Download File
      </button>
    </div>
  );
};

// ── Lightbox Action Dropdown ──────────────────────────────────────────────────
const LightboxActionDropdown = ({ url, filename, fileId, canDelete, onTriggerDelete, onDownload, onClose }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition border border-white/10"
      >
        <FontAwesomeIcon icon={faEllipsisV} className="text-xs" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-2xl border border-slate-100 shadow-2xl py-1.5 z-30 overflow-hidden animate-fade-in">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDownload(url, filename); }}
            className="w-full px-4 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-xs font-semibold"
          >
            <span className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faDownload} className="text-sky-500 text-[10px]" />
            </span>
            Download File
          </button>
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onClose(); onTriggerDelete(fileId); }}
              className="w-full px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-3 text-xs font-bold border-t border-slate-100"
            >
              <span className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faTrash} className="text-rose-500 text-[10px]" />
              </span>
              Delete File
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Lightbox Modal wrapper ────────────────────────────────────────────────────
const LightboxModal = ({ lightbox, onClose, canDelete, onTriggerDelete, onDownload, zIndex = "z-[60]" }) => {
  if (!lightbox) return null;
  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-slate-950 p-2 shadow-2xl border border-white/5 overflow-hidden flex flex-col"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox header */}
        <div className="flex items-center justify-between px-2 py-1.5 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileTypeIcon url={lightbox.url} className="text-base shrink-0" />
            <p className="text-[11px] font-semibold text-slate-300 truncate">{lightbox.filename}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <LightboxActionDropdown
              url={lightbox.url}
              filename={lightbox.filename}
              fileId={lightbox.id}
              canDelete={canDelete}
              onTriggerDelete={onTriggerDelete}
              onDownload={onDownload}
              onClose={onClose}
            />
            <button
              onClick={onClose}
              className="w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition border border-white/10"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>
        </div>

        {/* Lightbox body */}
        <div className="flex-1 overflow-auto flex items-center justify-center rounded-xl min-h-0 p-1">
          <LightboxContent
            url={lightbox.url}
            filename={lightbox.filename}
            isImg={lightbox.isImg}
            isPdf={lightbox.isPdf}
            isDoc={lightbox.isDoc}
            onDownload={onDownload}
          />
        </div>
      </div>
    </div>
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
            {isDeleting ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Deleting…</>
            ) : (
              "Yes, Delete"
            )}
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
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

// ── DetailRow ────────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
      <FontAwesomeIcon icon={icon} className="text-slate-400 text-[10px]" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">{label}</p>
      {value ? (
        <p className="text-sm font-semibold text-slate-800 leading-normal">{value}</p>
      ) : (
        <p className="text-sm italic text-slate-300 font-normal">Not recorded</p>
      )}
    </div>
  </div>
);

// ── DescBlock ────────────────────────────────────────────────────────────────
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

// ── Detail Panel ─────────────────────────────────────────────────────────────
const DetailPanel = ({ record, onClose, onEdit, onDelete, canEdit, canDelete }) => {
  const [lightbox, setLightbox]           = useState(null);
  const [confirmFileId, setConfirmFileId] = useState(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(false);
  const [deleteHealthFile, { isLoading: isDeletingFile }] = useDeleteHealthFileMutation();
  const [removedFileIds, setRemovedFileIds] = useState(() => new Set());

  if (!record) return null;
  const { type, data } = record;
  const cfg = SECTION_CONFIG[type];

  const heroTitle = {
    health:    data.hospitalVisitReason || "Health Check",
    nutrition: `${data.heightCm ? data.heightCm + " cm" : ""}${data.heightCm && data.weightKg ? " · " : ""}${data.weightKg ? data.weightKg + " kg" : ""}`,
    vaccine:   data.vaccineName || "Vaccination",
  }[type];

  const heroSub = {
    health:    data.hospitalName || "General visit",
    nutrition: data.bmi ? `BMI ${data.bmi?.toFixed(1)}` : "Growth measurement",
    vaccine:   `Given: ${fmtDate(data.dateGiven)}`,
  }[type];

  const handleDownload = async (url, filename) => {
    const tId = toast.loading("Preparing download…");
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = filename || "file";
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(blobUrl); document.body.removeChild(a);
      toast.update(tId, { render: "Download started", type: "success", isLoading: false, autoClose: 2000 });
    } catch {
      try {
        const a = document.createElement("a");
        a.href = url; a.download = filename || "file"; a.target = "_blank"; a.click();
        toast.update(tId, { render: "Download started", type: "success", isLoading: false, autoClose: 2000 });
      } catch {
        toast.update(tId, { render: "Could not download file", type: "error", isLoading: false, autoClose: 3000 });
      }
    }
  };

  const handleFileDeleteSubmit = async () => {
    if (!confirmFileId) return;
    const idToDelete = confirmFileId;
    setConfirmFileId(null);
    setRemovedFileIds((prev) => new Set(prev).add(idToDelete));
    if (lightbox?.id === idToDelete) setLightbox(null);

    const tId = toast.loading("Deleting file…");
    try {
      await deleteHealthFile({ fileId: idToDelete, context: type }).unwrap();
      toast.update(tId, { render: "File removed successfully", type: "success", isLoading: false, autoClose: 2500 });
    } catch (err) {
      setRemovedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(idToDelete);
        return next;
      });
      toast.update(tId, { render: err?.data?.message || "Could not delete file", type: "error", isLoading: false, autoClose: 3500 });
    }
  };

  // Opens a file in the lightbox with the correct flags
  const openLightbox = (file) => {
    const url      = fileFullUrl(file);
    const filename = file.fileName || "document";
    const flags    = getFileFlags(file.url || "");
    setLightbox({ ...file, url, filename, ...flags });
  };

  const files = (data.files || []).filter((f) => !removedFileIds.has(f.id));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="fixed mt-10 scale-80 right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${cfg.gradient} px-6 py-5 flex items-start justify-between shrink-0`}>
          <div className="space-y-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${cfg.color.split(" ")[1]}`}>
              {cfg.label}
            </span>
            <h2 className="text-white font-black text-lg leading-tight">{heroTitle}</h2>
            <p className="text-white/70 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
              {heroSub}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5">

          {type === "health" && (
            <>
              <div className="px-6">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Visit Overview</p>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
                  <DetailRow icon={faCalendarAlt} label="Record Date"       value={fmtDate(data.recordDate)} />
                  <DetailRow icon={faHospital}    label="Hospital / Clinic" value={data.hospitalName} />
                  <DetailRow icon={faUser}        label="Recorded By"       value={data.recordedBy ? `${data.recordedBy.firstName} ${data.recordedBy.lastName}` : null} />
                </div>
              </div>
              <div className="px-6 space-y-3">
                <DescBlock icon={faTriangleExclamation} label="Visit Reason"       value={data.hospitalVisitReason} bg="bg-emerald-50/70 border-emerald-100" iconColor="text-emerald-500" emptyText="No reason documented." />
                <DescBlock icon={faTriangleExclamation} label="Known Disabilities" value={data.knownDisabilities}   bg="bg-rose-50/70 border-rose-100"     iconColor="text-rose-500"    emptyText="None noted." />
                <DescBlock icon={faNotesMedical}         label="Clinical Notes"     value={data.notes}               bg="bg-sky-50/70 border-sky-100"       iconColor="text-sky-500"     emptyText="No notes recorded." />
              </div>
            </>
          )}

          {type === "nutrition" && (
            <>
              <div className="px-6">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Measurements</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Height", value: data.heightCm ? `${data.heightCm} cm` : null },
                    { label: "Weight", value: data.weightKg ? `${data.weightKg} kg` : null },
                    { label: "BMI",    value: data.bmi ? data.bmi.toFixed(1) : null },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">{label}</p>
                      <p className="text-base font-black text-slate-800 font-mono">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
              {bmiStatus(data.bmi) && (
                <div className="px-6">
                  <div className={`${bmiStatus(data.bmi).color} rounded-2xl p-4 border flex items-center gap-3`}>
                    <div className={`w-3 h-3 rounded-full ${bmiStatus(data.bmi).dot}`} />
                    <div>
                      <p className="text-[10px] font-black tracking-widest uppercase opacity-70">Growth Status</p>
                      <p className="text-sm font-bold">{bmiStatus(data.bmi).label}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="px-6">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
                  <DetailRow icon={faCalendarAlt} label="Measurement Date" value={fmtDate(data.recordDate)} />
                  <DetailRow icon={faUser}        label="Measured By"      value={data.recordedBy ? `${data.recordedBy.firstName} ${data.recordedBy.lastName}` : null} />
                </div>
              </div>
              {data.notes && (
                <div className="px-6">
                  <DescBlock icon={faNotesMedical} label="Assessment Notes" value={data.notes} bg="bg-sky-50/70 border-sky-100" iconColor="text-sky-500" emptyText="" />
                </div>
              )}
            </>
          )}

          {type === "vaccine" && (
            <>
              <div className="px-6">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Vaccination Details</p>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
                  <DetailRow icon={faSyringe}     label="Vaccine Name"    value={data.vaccineName} />
                  <DetailRow icon={faCalendarAlt} label="Date Given"      value={fmtDate(data.dateGiven)} />
                  <DetailRow icon={faCalendarAlt} label="Next Booster"    value={data.nextDueDate ? fmtDate(data.nextDueDate) : "No booster cycle"} />
                  <DetailRow icon={faUser}        label="Administered By" value={data.administeredBy} />
                </div>
              </div>
              {data.notes && (
                <div className="px-6">
                  <DescBlock icon={faNotesMedical} label="Notes" value={data.notes} bg="bg-purple-50/70 border-purple-100" iconColor="text-purple-500" emptyText="" />
                </div>
              )}
            </>
          )}

          {/* Files grid */}
          {files.length > 0 && (
            <div className="px-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileMedical} className="text-purple-400" />
                Attached Documents ({files.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {files.map((file) => {
                  const url      = fileFullUrl(file);
                  const filename = file.fileName || "document";
                  const flags    = getFileFlags(file.url || "");
                  return (
                    <div
                      key={file.id}
                      className="group relative aspect-square rounded-xl overflow-visible border border-slate-200 bg-slate-50 shadow-sm cursor-pointer hover:border-primBtn hover:shadow-md transition-all"
                      onClick={() => openLightbox(file)}
                    >
                      {flags.isImg ? (
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover rounded-xl transition duration-200"
                          onError={(e) => { e.target.src = "https://placehold.co/100?text=?"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2">
                          <FileTypeIcon url={file.url || ""} className="text-2xl" />
                          <p className="text-[9px] text-slate-400 font-semibold truncate px-1 w-full text-center leading-tight">{filename}</p>
                          {/* small "click to preview" hint */}
                          <span className="text-[8px] text-slate-300 font-medium">tap to open</span>
                        </div>
                      )}

                      <FileActionDropdown
                        url={url}
                        filename={filename}
                        fileId={file.id}
                        canDelete={canDelete}
                        onTriggerDelete={setConfirmFileId}
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
            <button
              onClick={() => onEdit(record)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm hover:bg-sky-100 transition border border-sky-200"
            >
              <FontAwesomeIcon icon={faPencilAlt} className="text-xs" /> Edit Record
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setConfirmDeleteRecord(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete Record
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <LightboxModal
        lightbox={lightbox}
        onClose={() => setLightbox(null)}
        canDelete={canDelete}
        onTriggerDelete={(id) => { setLightbox(null); setConfirmFileId(id); }}
        onDownload={handleDownload}
        zIndex="z-[60]"
      />

      {/* File delete confirmation */}
      <DeleteConfirmationModal
        isOpen={!!confirmFileId}
        onClose={() => setConfirmFileId(null)}
        onConfirm={handleFileDeleteSubmit}
        title="Delete Attached Document?"
        message="This file will be permanently removed from this health record and cannot be recovered."
        isDeleting={false}
      />

      {/* Record delete confirmation */}
      <DeleteConfirmationModal
        isOpen={confirmDeleteRecord}
        onClose={() => setConfirmDeleteRecord(false)}
        onConfirm={() => { setConfirmDeleteRecord(false); onDelete(record); onClose(); }}
        title={`Delete ${cfg.label}?`}
        message="This record and all its attached documents will be permanently deleted. This action cannot be undone."
        isDeleting={false}
      />
    </>
  );
};

// ── Record Card ───────────────────────────────────────────────────────────────
const RecordCard = ({ type, data, onSelect, active, onDelete, canDelete }) => {
  const cfg = SECTION_CONFIG[type];
  const [confirmCardDelete, setConfirmCardDelete] = useState(false);

  const title = {
    health:    data.hospitalVisitReason || "General health check",
    nutrition: [data.heightCm && `↕ ${data.heightCm} cm`, data.weightKg && `⚖ ${data.weightKg} kg`].filter(Boolean).join("  ·  ") || "Measurement",
    vaccine:   data.vaccineName || "Vaccination",
  }[type];

  const sub = {
    health:    data.hospitalName || null,
    nutrition: data.bmi ? `BMI ${data.bmi.toFixed(1)} — ${bmiStatus(data.bmi)?.label || ""}` : null,
    vaccine:   `Given: ${fmtDate(data.dateGiven)}`,
  }[type];

  const isOverdue = type === "vaccine" && data.nextDueDate && new Date(data.nextDueDate) <= new Date();
  const isDueSoon = type === "vaccine" && data.nextDueDate && new Date(data.nextDueDate) > new Date();

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${
          active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${cfg.dot}`} />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={cfg.icon} className={`${cfg.iconColor} text-sm`} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.color}`}>
                {cfg.label}
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-[9px]" /> Booster Overdue
                </span>
              )}
              {isDueSoon && !isOverdue && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Booster Due
                </span>
              )}
              {type === "nutrition" && bmiStatus(data.bmi) && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${bmiStatus(data.bmi).color}`}>
                  {bmiStatus(data.bmi).label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[9px]" />
                {fmtDate(data.recordDate || data.dateGiven)}
              </span>
              {sub && (
                <span className="flex items-center gap-1.5 font-medium text-slate-500">
                  {sub}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-semibold text-slate-800">
              {title}
            </p>
            {(data.notes || data.knownDisabilities) && (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-1">
                {data.notes || data.knownDisabilities}
              </p>
            )}
            {data.files?.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-purple-500 font-semibold">
                <FontAwesomeIcon icon={faFileMedical} className="text-[9px]" />
                {data.files.length} document{data.files.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onSelect}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                active ? "bg-primBtn text-white" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-400"
              }`}
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
        onConfirm={async () => { await onDelete({ type, data }); setConfirmCardDelete(false); }}
        title={`Delete ${cfg.label}?`}
        message="This record will be permanently removed. This action cannot be undone."
        isDeleting={false}
      />
    </>
  );
};

// ── File upload row ───────────────────────────────────────────────────────────
const FileRow = ({ file, onRemove }) => (
  <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl">
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
        <FileTypeIcon url={file.name} className="text-xs" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
        <p className="text-[10px] text-slate-400 font-mono">{fmtSize(file.size)}</p>
        {file.progress < 100 && (
          <div className="mt-1 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-primBtn transition-all duration-300" style={{ width: `${file.progress}%` }} />
          </div>
        )}
        {file.progress === 100 && (
          <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">✓ Ready</p>
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onRemove(file.id)}
      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition ml-2 shrink-0"
    >
      <FontAwesomeIcon icon={faTimes} className="text-xs" />
    </button>
  </div>
);

// ── Record Form ───────────────────────────────────────────────────────────────
const BLANK_FIELDS = {
  recordDate: new Date().toISOString().slice(0, 10),
  dateGiven:  new Date().toISOString().slice(0, 10),
  hospitalName: "", hospitalVisitReason: "", knownDisabilities: "", notes: "",
  vaccineName: "", nextDueDate: "", administeredBy: "",
  heightCm: "", weightKg: "",
};

const RecordForm = ({ type, editRecord, childId, onClose, onSaved }) => {
  const isEdit = !!editRecord;

  const [fields, setFields] = useState(() => {
    if (!editRecord) return { ...BLANK_FIELDS };
    const r = editRecord;
    return {
      recordDate:          toInputDate(r.recordDate),
      dateGiven:           toInputDate(r.dateGiven),
      hospitalName:        r.hospitalName        || "",
      hospitalVisitReason: r.hospitalVisitReason || "",
      knownDisabilities:   r.knownDisabilities   || "",
      notes:               r.notes               || "",
      vaccineName:         r.vaccineName         || "",
      nextDueDate:         toInputDate(r.nextDueDate),
      administeredBy:      r.administeredBy      || "",
      heightCm:            r.heightCm != null ? String(r.heightCm) : "",
      weightKg:            r.weightKg != null ? String(r.weightKg) : "",
    };
  });

  const [pendingFiles, setPendingFiles] = useState([]);
  const allReady   = pendingFiles.every((f) => f.progress === 100);
  const hasPending = pendingFiles.length > 0;

  const [createHealthRecord, { isLoading: isCreatingH }] = useCreateHealthRecordMutation();
  const [addVaccination,     { isLoading: isCreatingV }] = useAddVaccinationMutation();
  const [addNutritionRecord, { isLoading: isCreatingN }] = useAddNutritionRecordMutation();
  const [updateHealthRecord, { isLoading: isUpdatingH }] = useUpdateHealthRecordMutation();
  const [updateVaccination,  { isLoading: isUpdatingV }] = useUpdateVaccinationMutation();
  const [updateNutritionRecord, { isLoading: isUpdatingN }] = useUpdateNutritionRecordMutation();
  const [deleteHealthFile]                               = useDeleteHealthFileMutation();

  const isSaving = isCreatingH || isCreatingV || isCreatingN || isUpdatingH || isUpdatingV || isUpdatingN;

  const [confirmExistingFileId, setConfirmExistingFileId] = useState(null);
  const [removedExistingFileIds, setRemovedExistingFileIds] = useState(() => new Set());
  const [previewFile, setPreviewFile] = useState(null);

  const cfg = SECTION_CONFIG[type];

  const change = (e) => setFields((p) => ({ ...p, [e.target.name]: e.target.value }));

  const simulateProgress = (id) => {
    let pct = 0;
    const tick = setInterval(() => {
      pct = Math.min(pct + Math.random() * 30 + 10, 100);
      setPendingFiles((prev) => prev.map((f) => f.id === id ? { ...f, progress: Math.round(pct) } : f));
      if (pct >= 100) clearInterval(tick);
    }, 120);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((f) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f, name: f.name, size: f.size, progress: 0,
    }));
    setPendingFiles((prev) => [...prev, ...files]);
    files.forEach((f) => simulateProgress(f.id));
    e.target.value = "";
  };

  const handleRemoveFile  = (id) => setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  const handleClose       = () => { setPendingFiles([]); onClose(); };

  const handleDeleteExistingFile = async () => {
    if (!confirmExistingFileId) return;
    const idToDelete = confirmExistingFileId;
    setConfirmExistingFileId(null);
    setRemovedExistingFileIds((prev) => new Set(prev).add(idToDelete));
    if (previewFile?.id === idToDelete) setPreviewFile(null);

    const tId = toast.loading("Removing file…");
    try {
      await deleteHealthFile({ fileId: idToDelete, context: type }).unwrap();
      toast.update(tId, { render: "File removed", type: "success", isLoading: false, autoClose: 2500 });
    } catch (err) {
      setRemovedExistingFileIds((prev) => {
        const next = new Set(prev);
        next.delete(idToDelete);
        return next;
      });
      toast.update(tId, { render: err?.data?.message || "Could not remove file", type: "error", isLoading: false, autoClose: 3500 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasPending && !allReady) { toast.warn("Please wait — files are still preparing"); return; }

    const fd = new FormData();
    fd.append("childId", childId);
    pendingFiles.forEach((f) => fd.append("files", f.file));

    if (type === "health") {
      fd.append("recordDate", new Date(fields.recordDate).toISOString());
      if (fields.hospitalName)        fd.append("hospitalName",        fields.hospitalName);
      if (fields.hospitalVisitReason) fd.append("hospitalVisitReason", fields.hospitalVisitReason);
      if (fields.knownDisabilities)   fd.append("knownDisabilities",   fields.knownDisabilities);
      if (fields.notes)               fd.append("notes",               fields.notes);
    } else if (type === "vaccine") {
      fd.append("vaccineName", fields.vaccineName);
      fd.append("dateGiven",   new Date(fields.dateGiven).toISOString());
      if (fields.nextDueDate)    fd.append("nextDueDate",    new Date(fields.nextDueDate).toISOString());
      if (fields.administeredBy) fd.append("administeredBy", fields.administeredBy);
      if (fields.notes)          fd.append("notes",          fields.notes);
    } else {
      fd.append("recordDate", new Date(fields.recordDate).toISOString());
      if (fields.heightCm) fd.append("heightCm", fields.heightCm);
      if (fields.weightKg) fd.append("weightKg", fields.weightKg);
      if (fields.notes)    fd.append("notes",    fields.notes);
    }

    const tId = toast.loading(isEdit ? "Updating record…" : "Saving record…");
    try {
      if (type === "health") {
        if (isEdit) await updateHealthRecord({ id: editRecord.id, formData: fd }).unwrap();
        else        await createHealthRecord(fd).unwrap();
      } else if (type === "vaccine") {
        if (isEdit) await updateVaccination({ id: editRecord.id, formData: fd }).unwrap();
        else        await addVaccination(fd).unwrap();
      } else {
        if (isEdit) await updateNutritionRecord({ id: editRecord.id, formData: fd }).unwrap();
        else        await addNutritionRecord(fd).unwrap();
      }
      toast.update(tId, { render: isEdit ? `${cfg.label} updated` : `${cfg.label} saved`, type: "success", isLoading: false, autoClose: 2500 });
      handleClose();
      onSaved?.();
    } catch (err) {
      toast.update(tId, { render: err?.data?.message || "Save failed", type: "error", isLoading: false, autoClose: 3500 });
    }
  };

  // Open existing file in lightbox with correct flags
  const openPreview = (file) => {
    const url   = fileFullUrl(file);
    const flags = getFileFlags(file.url || "");
    setPreviewFile({ ...file, url, filename: file.fileName || "Attachment", ...flags });
  };

  const existingFiles = (editRecord?.files || []).filter((f) => !removedExistingFileIds.has(f.id));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white scale-80 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${cfg.gradient}`}>
                <FontAwesomeIcon icon={isEdit ? faPencilAlt : cfg.icon} className="text-sm" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isEdit ? `Edit ${cfg.label}` : `Add ${cfg.label}`}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEdit ? "Update record details or attach more documents" : "Record new entry"}
                </p>
              </div>
            </div>
            <button type="button" onClick={handleClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">

            {type === "health" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Record Date <span className="text-rose-400">*</span></label>
                    <input required type="date" name="recordDate" value={fields.recordDate} onChange={change} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Hospital / Clinic</label>
                    <input type="text" name="hospitalName" value={fields.hospitalName} onChange={change} placeholder="e.g. Black Lion Hospital" className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Visit Reason <span className="text-rose-400">*</span></label>
                  <input required type="text" name="hospitalVisitReason" value={fields.hospitalVisitReason} onChange={change} placeholder="e.g. Routine checkup, fever" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Known Disabilities</label>
                  <input type="text" name="knownDisabilities" value={fields.knownDisabilities} onChange={change} placeholder="Leave blank if none" className={inputCls} />
                </div>
              </>
            )}

            {type === "vaccine" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Vaccine Name <span className="text-rose-400">*</span></label>
                  <input required type="text" name="vaccineName" value={fields.vaccineName} onChange={change} placeholder="e.g. BCG, Hepatitis B, OPV" className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Date Given <span className="text-rose-400">*</span></label>
                    <input required type="date" name="dateGiven" value={fields.dateGiven} onChange={change} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Next Due Date</label>
                    <input type="date" name="nextDueDate" value={fields.nextDueDate} onChange={change} className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Administered By</label>
                  <input type="text" name="administeredBy" value={fields.administeredBy} onChange={change} placeholder="Doctor / clinic name" className={inputCls} />
                </div>
              </>
            )}

            {type === "nutrition" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Measurement Date <span className="text-rose-400">*</span></label>
                  <input required type="date" name="recordDate" value={fields.recordDate} onChange={change} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Height (cm) <span className="text-rose-400">*</span></label>
                    <input required type="number" step="0.1" name="heightCm" value={fields.heightCm} onChange={change} placeholder="e.g. 110.5" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Weight (kg) <span className="text-rose-400">*</span></label>
                    <input required type="number" step="0.1" name="weightKg" value={fields.weightKg} onChange={change} placeholder="e.g. 18.2" className={inputCls} />
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Notes</label>
              <textarea name="notes" rows={3} value={fields.notes} onChange={change} placeholder="Any additional observations…" className={inputCls + " resize-none"} />
            </div>

            {/* Existing files in edit mode */}
            {isEdit && type !== "nutrition" && existingFiles.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileMedical} className="text-purple-400" />
                  Attached Documents
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {existingFiles.map((file) => {
                    const url   = fileFullUrl(file);
                    const flags = getFileFlags(file.url || "");
                    return (
                      <div
                        key={file.id}
                        onClick={() => openPreview(file)}
                        className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition"
                      >
                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                          <FileTypeIcon url={file.url || ""} className="text-xs" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 truncate flex-1">{file.fileName || "Attachment"}</p>
                        <a
                          href={url}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-primBtn hover:bg-primBtn/10 flex items-center justify-center transition shrink-0"
                        >
                          <FontAwesomeIcon icon={faDownload} className="text-xs" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmExistingFileId(file.id); }}
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

            {/* File upload zone */}
            {type !== "nutrition" && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileMedical} />
                  {isEdit ? "Attach Additional Documents" : type === "vaccine" ? "Immunization Card / Certificate" : "Medical Documents"}
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-primBtn bg-slate-50 hover:bg-primBtn/5 rounded-2xl p-5 text-center cursor-pointer transition">
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <FontAwesomeIcon icon={faUpload} className="text-slate-300 text-2xl mb-1" />
                  <p className="text-xs font-semibold text-slate-600">Click to upload documents</p>
                  <p className="text-[11px] text-slate-400">PDF, Word, PNG or JPG — max 10 MB each</p>
                </div>

                {pendingFiles.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {pendingFiles.map((file) => (
                      <FileRow key={file.id} file={file} onRemove={handleRemoveFile} />
                    ))}
                  </div>
                )}

                {hasPending && !allReady && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500" />
                    Preparing files… save will unlock when all are ready.
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={handleClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || (hasPending && !allReady)}
                className="flex-1 py-3 bg-primBtn hover:bg-Hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> {isEdit ? "Updating…" : "Saving…"}</>
                ) : isEdit ? "Update Record" : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview lightbox for existing files in form */}
      <LightboxModal
        lightbox={previewFile}
        onClose={() => setPreviewFile(null)}
        canDelete={true}
        onTriggerDelete={(id) => { setPreviewFile(null); setConfirmExistingFileId(id); }}
        onDownload={(url, filename) => {
          const a = document.createElement("a");
          a.href = url; a.download = filename; a.target = "_blank"; a.click();
        }}
        zIndex="z-[110]"
      />

      {/* Existing-file delete confirmation */}
      <DeleteConfirmationModal
        isOpen={!!confirmExistingFileId}
        onClose={() => setConfirmExistingFileId(null)}
        onConfirm={handleDeleteExistingFile}
        title="Remove Attached Document?"
        message="This document will be permanently deleted from this health record and cannot be recovered."
        isDeleting={false}
      />
    </>
  );
};

// ── Main HealthTab ────────────────────────────────────────────────────────────
const HealthTab = ({ childId, canCreate = true, canEdit = true, canDelete = true }) => {
  const { data: healthData,    isLoading: lh } = useGetHealthRecordsQuery(childId,    { skip: !childId });
  const { data: vaccData,      isLoading: lv } = useGetVaccinationsQuery(childId,     { skip: !childId });
  const { data: nutritionData, isLoading: ln } = useGetNutritionRecordsQuery(childId, { skip: !childId });

  const [deleteHealthRecord]    = useDeleteHealthRecordMutation();
  const [deleteVaccination]     = useDeleteVaccinationMutation();
  const [deleteNutritionRecord] = useDeleteNutritionRecordMutation();

  const [showForm,      setShowForm]      = useState(false);
  const [formType,      setFormType]      = useState(null);
  const [editTarget,    setEditTarget]    = useState(null);
  const [activeRecord,  setActiveRecord]  = useState(null);
  const [removedRecordIds, setRemovedRecordIds] = useState(() => new Set());

  const healthRecords = useMemo(
    () => (Array.isArray(healthData) ? healthData : (healthData?.data || [])).filter((r) => !removedRecordIds.has(r.id)),
    [healthData, removedRecordIds]
  );
  const vaccinations = useMemo(
    () => (Array.isArray(vaccData) ? vaccData : (vaccData?.data || [])).filter((r) => !removedRecordIds.has(r.id)),
    [vaccData, removedRecordIds]
  );
  const nutritionRecs = useMemo(
    () => (Array.isArray(nutritionData) ? nutritionData : (nutritionData?.data || [])).filter((r) => !removedRecordIds.has(r.id)),
    [nutritionData, removedRecordIds]
  );
  const isLoading = lh || lv || ln;

  const overdueVaccines = vaccinations.filter((v) => v.nextDueDate && new Date(v.nextDueDate) <= new Date()).length;

  const handleDelete = async ({ type, data }) => {
    setRemovedRecordIds((prev) => new Set(prev).add(data.id));
    if (activeRecord?.data?.id === data.id) setActiveRecord(null);

    const cfg = SECTION_CONFIG[type];
    const tId = toast.loading(`Deleting ${cfg.label.toLowerCase()}…`);
    try {
      if (type === "health")    await deleteHealthRecord({ id: data.id, childId }).unwrap();
      if (type === "vaccine")   await deleteVaccination({ id: data.id, childId }).unwrap();
      if (type === "nutrition") await deleteNutritionRecord({ id: data.id, childId }).unwrap();
      toast.update(tId, { render: "Record deleted", type: "success", isLoading: false, autoClose: 2500 });
    } catch (err) {
      setRemovedRecordIds((prev) => {
        const next = new Set(prev);
        next.delete(data.id);
        return next;
      });
      toast.update(tId, { render: err?.data?.message || "Delete failed", type: "error", isLoading: false, autoClose: 3500 });
    }
  };

  const openAdd  = (type) => { setFormType(type); setEditTarget(null); setShowForm(true); };
  const openEdit = ({ type, data }) => { setActiveRecord(null); setFormType(type); setEditTarget(data); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setFormType(null); setEditTarget(null); };

  return (
    <TabShell
      title="Health & Nutrition"
      icon={faHeartPulse}
      actions={canCreate ? [
        { label: "Health Record", icon: faStethoscope, onClick: () => openAdd("health") },
        { label: "Nutrition Log", icon: faWeightScale,  onClick: () => openAdd("nutrition") },
        { label: "Vaccination",   icon: faSyringe,      onClick: () => openAdd("vaccine") },
      ] : []}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.18s ease-out forwards; }
        @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scale-up-center { animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      <div className="p-5 space-y-8">
        {(healthRecords.length + vaccinations.length + nutritionRecs.length) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Health Records",   val: healthRecords.length, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
              { label: "Vaccinations",     val: vaccinations.length,  cls: "bg-purple-50 text-purple-700 border border-purple-200" },
              { label: "Nutrition Logs",   val: nutritionRecs.length, cls: "bg-sky-50 text-sky-700 border border-sky-200" },
              { label: "Overdue Boosters", val: overdueVaccines,      cls: overdueVaccines > 0 ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-100 text-slate-600" },
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
            <div>
              <SubSection title="Health Records" />
              {healthRecords.length === 0 ? (
                <EmptyState icon={faStethoscope} message="No health records yet" />
              ) : (
                <div className="space-y-3 mt-3">
                  {[...healthRecords].sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate)).map((r) => (
                    <RecordCard key={r.id} type="health" data={r}
                      onSelect={() => setActiveRecord({ type: "health", data: r })}
                      active={activeRecord?.data?.id === r.id && activeRecord?.type === "health"}
                      onDelete={handleDelete} canDelete={canDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <SubSection title="Vaccinations" />
              {vaccinations.length === 0 ? (
                <EmptyState icon={faSyringe} message="No vaccination records yet" />
              ) : (
                <div className="space-y-3 mt-3">
                  {[...vaccinations].sort((a, b) => new Date(b.dateGiven) - new Date(a.dateGiven)).map((v) => (
                    <RecordCard key={v.id} type="vaccine" data={v}
                      onSelect={() => setActiveRecord({ type: "vaccine", data: v })}
                      active={activeRecord?.data?.id === v.id && activeRecord?.type === "vaccine"}
                      onDelete={handleDelete} canDelete={canDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <SubSection title="Nutrition & Growth" />
              {nutritionRecs.length === 0 ? (
                <EmptyState icon={faWeightScale} message="No nutrition records yet" />
              ) : (
                <div className="space-y-3 mt-3">
                  {[...nutritionRecs].sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate)).map((r) => (
                    <RecordCard key={r.id} type="nutrition" data={r}
                      onSelect={() => setActiveRecord({ type: "nutrition", data: r })}
                      active={activeRecord?.data?.id === r.id && activeRecord?.type === "nutrition"}
                      onDelete={handleDelete} canDelete={canDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {activeRecord && (
        <DetailPanel
          record={activeRecord}
          onClose={() => setActiveRecord(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {showForm && formType && (
        <RecordForm
          type={formType}
          editRecord={editTarget}
          childId={childId}
          onClose={closeForm}
          onSaved={() => setActiveRecord(null)}
        />
      )}
    </TabShell>
  );
};

export default HealthTab;