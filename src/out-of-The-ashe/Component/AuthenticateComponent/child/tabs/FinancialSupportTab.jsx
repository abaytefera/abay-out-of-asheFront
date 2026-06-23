import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandHoldingUsd, faPlus, faTrash, faFileInvoiceDollar,
  faTimes, faPaperclip, faCalendarAlt, faCoins, faFolderOpen,
  faFilePdf, faFileWord, faImage,
  faUser, faTag, faGraduationCap, faStickyNote,
  faChevronRight, faPencilAlt, faUpload, faExclamationTriangle,
  faSpinner, faDownload, faEllipsisV, faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  useGetFinancialSupportsQuery,
  useCreateFinancialSupportMutation,
  useUpdateFinancialSupportMutation,
  useDeleteFinancialSupportMutation,
  useDeleteFinancialFileMutation,
  useUploadFinancialFilesMutation,
} from "../../../../Redux/financialApi";
import { TabShell, EmptyState } from "./TabShell";
import { toast } from "react-toastify";

const SERVER_BASE_URL = import.meta.env.VITE_DEFAULT_BACKEND;


// ── Support type config ───────────────────────────────────────────────────────
const SUPPORT_TYPES = {
  SCHOOL_FEES:    { label: "School Fees",    color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500",    icon: faFileInvoiceDollar },
  RENT:           { label: "Rent",           color: "bg-purple-50 text-purple-700 border-purple-200",    dot: "bg-purple-500",  icon: faHandHoldingUsd },
  FOOD:           { label: "Food",           color: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500",   icon: faCoins },
  MEDICAL:        { label: "Medical",        color: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500",    icon: faFileInvoiceDollar },
  EMERGENCY_CASH: { label: "Emergency Cash", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: faCoins },
  OTHER:          { label: "Other",          color: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400",   icon: faFolderOpen },
};

// ── File helpers ──────────────────────────────────────────────────────────────
const getFileMeta = (fileName) => {
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return { icon: faImage,    isImage: true };
  if (ext === "pdf")                                        return { icon: faFilePdf,  isPdf:   true };
  if (["doc", "docx"].includes(ext))                       return { icon: faFileWord, isDoc:   true };
  return { icon: faPaperclip };
};

const fileUrl = (file) =>
  file.url?.startsWith("http") ? file.url : `${SERVER_BASE_URL}${file.url}`;

const toISODate = (val) => (val ? new Date(val).toISOString().split("T")[0] : "");

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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
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

// ── DetailRow ─────────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value, mono = false, accent }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
      <FontAwesomeIcon icon={icon} className="text-slate-400 text-[10px]" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">{label}</p>
      {value ? (
        <p className={`text-sm font-semibold text-slate-800 leading-normal ${mono ? "font-mono" : ""} ${accent || ""}`}>{value}</p>
      ) : (
        <p className="text-sm italic text-slate-300 font-normal">Not recorded</p>
      )}
    </div>
  </div>
);

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ record, onClose, onDelete, onEdit, canEdit, canDelete }) => {
  const [lightbox, setLightbox] = useState(null);
  const [deleteFile, { isLoading: isDeletingFile }] = useDeleteFinancialFileMutation();

  const [confirmFileId, setConfirmFileId]     = useState(null);
  const [confirmRecordId, setConfirmRecordId] = useState(null);

  if (!record) return null;
  const tc = SUPPORT_TYPES[record.supportType] || SUPPORT_TYPES.OTHER;

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "attachment";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "attachment";
      a.target = "_blank";
      a.click();
    }
  };

  const handleFileDeleteSubmit = async () => {
    if (!confirmFileId) return;
    try {
      await deleteFile({ recordId: record.id, fileId: confirmFileId }).unwrap();
      toast.success("File removed successfully");
      if (lightbox?.id === confirmFileId) setLightbox(null);
    } catch (err) {
      toast.error(err?.data?.message || "Could not delete file");
    } finally {
      setConfirmFileId(null);
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
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 ${tc.color.split(" ")[1]}`}>
              {tc.label}
            </span>
            <h2 className="text-white font-black text-lg leading-tight">
              {record.amount?.toLocaleString()} {record.currency || "ETB"}
            </h2>
            <p className="text-sky-100 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
              {new Date(record.disbursedDate).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
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
          {/* Overview */}
          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">
              Transaction Details
            </p>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <DetailRow icon={faTag}           label="Support Type"   value={tc.label} />
              <DetailRow icon={faCoins}         label="Amount"         value={`${record.amount?.toLocaleString()} ${record.currency || "ETB"}`} mono accent="text-primBtn" />
              <DetailRow icon={faCalendarAlt}   label="Date Disbursed" value={new Date(record.disbursedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              <DetailRow icon={faGraduationCap} label="Academic Year"  value={record.academicYear} />
              <DetailRow icon={faUser}          label="Disbursed By"   value={record.disbursedBy ? `${record.disbursedBy.firstName} ${record.disbursedBy.lastName}` : null} />
            </div>
          </div>

          {/* Notes */}
          <div className="px-6">
            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/70 border border-white flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faStickyNote} className="text-amber-500 text-[10px]" />
                </div>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">Notes / Description</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-line">
                {record.notes || <span className="italic text-slate-400 font-normal">No description provided</span>}
              </p>
            </div>
          </div>

          {/* Files grid */}
          {record.files?.length > 0 && (
            <div className="px-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faPaperclip} className="text-purple-400" />
                Attached Files ({record.files.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {record.files.map((file) => {
                  const url      = fileUrl(file);
                  const filename = file.fileName || file.publicId?.split("/").pop() || "attachment";
                  const meta     = getFileMeta(filename);
                  return (
                    <div
                      key={file.id}
                      className="group relative aspect-square rounded-xl overflow-visible border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      {meta.isImage ? (
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover rounded-xl transition duration-200 cursor-pointer"
                          onClick={() => setLightbox({ ...file, url, filename, ...meta })}
                          onError={(e) => { e.target.src = "https://placehold.co/100?text=?"; }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer"
                          onClick={() => setLightbox({ ...file, url, filename, ...meta })}
                        >
                          <FontAwesomeIcon icon={meta.icon} className="text-slate-400 text-2xl" />
                          <p className="text-[9px] text-slate-400 font-semibold truncate px-1 w-full text-center">{filename}</p>
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

          {/* Meta */}
          <div className="px-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between"><span>Record ID</span><span className="font-mono text-slate-500">{record.id?.slice(-8)}</span></div>
              <div className="flex justify-between"><span>Created</span><span>{new Date(record.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Updated</span><span>{new Date(record.updatedAt).toLocaleString()}</span></div>
            </div>
          </div>
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
              onClick={() => setConfirmRecordId(record.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition border border-rose-200"
            >
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
            className="relative mt-20 max-w-4xl max-h-[85vh] rounded-2xl bg-slate-950 p-2 shadow-2xl border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-22 z-20 flex items-center gap-2">
              <FileActionDropdown
                url={lightbox.url}
                filename={lightbox.filename}
                fileId={lightbox.id}
                canDelete={canDelete}
                onTriggerDelete={setConfirmFileId}
                onDownload={handleDownload}
                positionCls="top-0 left-0"
              />
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition z-20 border border-white/10"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>

            {lightbox.isImage && (
              <img
                src={lightbox.url}
                alt="Enlarged attachment"
                className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
              />
            )}
            {lightbox.isPdf && (
              <iframe
                src={`${lightbox.url}#toolbar=0`}
                title="PDF Preview"
                className="w-full min-w-[60vw] h-[75vh] rounded-xl border-0"
              />
            )}
            {!lightbox.isImage && !lightbox.isPdf && (
              <div className="flex flex-col items-center justify-center p-16 gap-4">
                <FontAwesomeIcon icon={lightbox.icon || faPaperclip} className="text-slate-400 text-5xl" />
                <p className="text-slate-300 text-sm font-semibold">{lightbox.filename}</p>
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

      {/* File delete confirmation */}
      <DeleteConfirmationModal
        isOpen={!!confirmFileId}
        onClose={() => setConfirmFileId(null)}
        onConfirm={handleFileDeleteSubmit}
        title="Delete Attached File?"
        message="This action will permanently remove this file attachment from the financial support record."
        isDeleting={isDeletingFile}
      />

      {/* Record delete confirmation */}
      <DeleteConfirmationModal
        isOpen={!!confirmRecordId}
        onClose={() => setConfirmRecordId(null)}
        onConfirm={async () => {
          await onDelete(confirmRecordId);
          setConfirmRecordId(null);
          onClose();
        }}
        title="Delete Financial Record?"
        message="This will permanently remove this disbursement record and all its attachments. Active financial metrics will update immediately."
        isDeleting={false}
      />
    </>
  );
};

// ── Record Card ───────────────────────────────────────────────────────────────
const RecordCard = ({ record, onSelect, active, onDelete, canDelete }) => {
  const tc = SUPPORT_TYPES[record.supportType] || SUPPORT_TYPES.OTHER;
  const [confirmCardDeleteId, setConfirmCardDeleteId] = useState(null);

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
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={tc.icon} className="text-slate-400 text-sm" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tc.color}`}>
                {tc.label}
              </span>
              {record.academicYear && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  {record.academicYear}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-black text-slate-900 font-mono text-base">
                {record.amount?.toLocaleString()}
                <span className="text-xs font-bold text-slate-400">{record.currency || "ETB"}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[9px]" />
                {new Date(record.disbursedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
              {record.disbursedBy && (
                <span className="flex items-center gap-1.5 font-medium">
                  <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[9px]" />
                  {record.disbursedBy.firstName} {record.disbursedBy.lastName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {record.notes || (
                <span className="italic text-slate-300 flex items-center gap-1">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" /> No description provided.
                </span>
              )}
            </p>
            {record.files?.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-purple-500 font-semibold">
                <FontAwesomeIcon icon={faPaperclip} className="text-[9px]" />
                {record.files.length} attachment{record.files.length > 1 ? "s" : ""}
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
                onClick={() => setConfirmCardDeleteId(record.id)}
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
        title="Delete Financial Record?"
        message="This updates active disbursement metrics immediately. Deleted records cannot be restored."
        isDeleting={false}
      />
    </>
  );
};

// ── File upload row ───────────────────────────────────────────────────────────
const FileRow = ({ file, onRemove }) => (
  <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl">
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      {file.preview ? (
        <img src={file.preview} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
      ) : (
        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={getFileMeta(file.name).icon} className="text-slate-400 text-xs" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
        <p className="text-[10px] text-slate-400 font-mono">{file.size}</p>
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
      onClick={() => onRemove(file.id, file.preview)}
      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition ml-2 shrink-0"
    >
      <FontAwesomeIcon icon={faTimes} className="text-xs" />
    </button>
  </div>
);

// ── Record Form (Create / Edit) ───────────────────────────────────────────────
const BLANK_FORM = {
  supportType:   "SCHOOL_FEES",
  amount:        "",
  currency:      "ETB",
  disbursedDate: new Date().toISOString().split("T")[0],
  academicYear:  "",
  notes:         "",
};

const RecordForm = ({ editRecord, childId, onClose, onSaved }) => {
  const isEdit = !!editRecord;

  const [formData, setFormData] = useState(
    isEdit
      ? {
          supportType:   editRecord.supportType,
          amount:        editRecord.amount?.toString() || "",
          currency:      editRecord.currency || "ETB",
          disbursedDate: toISODate(editRecord.disbursedDate),
          academicYear:  editRecord.academicYear || "",
          notes:         editRecord.notes || "",
        }
      : { ...BLANK_FORM }
  );

  const [pendingFiles, setPendingFiles] = useState([]);
  const allReady   = pendingFiles.every((f) => f.progress === 100);
  const hasPending = pendingFiles.length > 0;

  const [createFinancialSupport, { isLoading: isCreating }] = useCreateFinancialSupportMutation();
  const [updateFinancialSupport, { isLoading: isUpdating }] = useUpdateFinancialSupportMutation();
  const [deleteFinancialFile,    { isLoading: isDeletingFile }] = useDeleteFinancialFileMutation();
  const isSaving = isCreating || isUpdating;

  const [confirmExistingFileId, setConfirmExistingFileId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const simulateProgress = (id) => {
    let pct = 0;
    const tick = setInterval(() => {
      pct = Math.min(pct + Math.random() * 30 + 10, 100);
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress: Math.round(pct) } : f))
      );
      if (pct >= 100) clearInterval(tick);
    }, 120);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((f) => ({
      id:       Math.random().toString(36).substr(2, 9),
      file:     f,
      name:     f.name,
      size:     (f.size / (1024 * 1024)).toFixed(2) + " MB",
      preview:  f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      progress: 0,
    }));
    setPendingFiles((prev) => [...prev, ...files]);
    files.forEach((f) => simulateProgress(f.id));
    e.target.value = "";
  };

  const handleRemoveFile = (id, preview) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
    if (preview) URL.revokeObjectURL(preview);
  };

  const handleClose = () => {
    pendingFiles.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setPendingFiles([]);
    onClose();
  };

  const handleDeleteExistingFile = async () => {
    if (!confirmExistingFileId) return;
    try {
      await deleteFinancialFile({ recordId: editRecord.id, fileId: confirmExistingFileId }).unwrap();
      toast.success("File removed");
    } catch (err) {
      toast.error(err?.data?.message || "Could not remove file");
    } finally {
      setConfirmExistingFileId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasPending && !allReady) {
      toast.warn("Please wait — files are still preparing");
      return;
    }

    const fd = new FormData();
    if (!isEdit) fd.append("childId", childId);
    fd.append("supportType",   formData.supportType);
    fd.append("amount",        formData.amount);
    fd.append("currency",      formData.currency);
    fd.append("disbursedDate", new Date(formData.disbursedDate).toISOString());
    if (formData.academicYear) fd.append("academicYear", formData.academicYear);
    if (formData.notes)        fd.append("notes",        formData.notes);
    pendingFiles.forEach((f) => fd.append("files", f.file));

    try {
      if (isEdit) {
        await updateFinancialSupport({ id: editRecord.id, formData: fd }).unwrap();
        toast.success("Record updated");
      } else {
        await createFinancialSupport(fd).unwrap();
        toast.success("Financial support recorded");
      }
      handleClose();
      onSaved?.();
    } catch (err) {
      toast.error(err?.data?.message || "Save failed");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white scale-80 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primBtn rounded-xl flex items-center justify-center text-white">
                <FontAwesomeIcon icon={isEdit ? faPencilAlt : faFileInvoiceDollar} className="text-sm" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isEdit ? "Edit Financial Record" : "Record Disbursement"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEdit ? "Update disbursement details or attach more files" : "Log a new financial support entry"}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  Support Type <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select name="supportType" value={formData.supportType} onChange={handleInputChange} className={inputCls + " appearance-none pr-8"}>
                    {Object.entries(SUPPORT_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  Amount (ETB) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number" name="amount" required min="1" placeholder="0"
                    value={formData.amount} onChange={handleInputChange}
                    className={inputCls + " pr-14 font-mono font-bold"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">ETB</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  Date Disbursed <span className="text-rose-400">*</span>
                </label>
                <input type="date" name="disbursedDate" required value={formData.disbursedDate} onChange={handleInputChange} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Academic Year</label>
                <input type="text" name="academicYear" placeholder="e.g. 2025/2026" value={formData.academicYear} onChange={handleInputChange} className={inputCls} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Notes / Description</label>
              <textarea
                name="notes" rows={3} placeholder="Purpose, reference number, or any audit note…"
                value={formData.notes} onChange={handleInputChange}
                className={inputCls + " resize-none"}
              />
            </div>

            {/* Existing files in edit mode */}
            {isEdit && editRecord.files?.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                  <FontAwesomeIcon icon={faPaperclip} className="text-purple-400" />
                  Attached Files
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {editRecord.files.map((file) => {
                    const url  = fileUrl(file);
                    const meta = getFileMeta(file.fileName);
                    return (
                      <div key={file.id} className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                        {meta.isImage ? (
                          <img src={url} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" onError={(e) => { e.target.src = "https://placehold.co/36"; }} />
                        ) : (
                          <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={meta.icon} className="text-slate-400 text-xs" />
                          </div>
                        )}
                        <p className="text-xs font-semibold text-slate-700 truncate flex-1">{file.fileName || "Attachment"}</p>
                        <a href={url} download className="w-7 h-7 rounded-lg text-slate-400 hover:text-primBtn hover:bg-primBtn/10 flex items-center justify-center transition shrink-0">
                          <FontAwesomeIcon icon={faDownload} className="text-xs" />
                        </a>
                        <button type="button" onClick={() => setConfirmExistingFileId(file.id)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition shrink-0">
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* File upload zone */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <FontAwesomeIcon icon={faPaperclip} />
                {isEdit ? "Attach Additional Files" : "Attach Receipts / Files"}
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-primBtn bg-slate-50 hover:bg-primBtn/5 rounded-2xl p-5 text-center cursor-pointer transition">
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FontAwesomeIcon icon={faUpload} className="text-slate-300 text-2xl mb-1" />
                <p className="text-xs font-semibold text-slate-600">Click to upload files</p>
                <p className="text-[11px] text-slate-400">Images, PDF, or Word documents</p>
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
                ) : isEdit ? (
                  "Update Record"
                ) : (
                  "Save Record"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Existing-file delete confirmation inside form */}
      <DeleteConfirmationModal
        isOpen={!!confirmExistingFileId}
        onClose={() => setConfirmExistingFileId(null)}
        onConfirm={handleDeleteExistingFile}
        title="Remove Attached File?"
        message="This file will be permanently deleted from this financial record and cannot be recovered."
        isDeleting={isDeletingFile}
      />
    </>
  );
};

// ── Main Controller ───────────────────────────────────────────────────────────
const FinancialSupportTab = ({
  childId,
  canCreate = true,
  canEdit   = true,
  canDelete = true,
}) => {
  const { data: responseData, isLoading } = useGetFinancialSupportsQuery(childId, { skip: !childId });
  const [deleteSupport] = useDeleteFinancialSupportMutation();

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);

  const raw     = responseData?.data || responseData || {};
  const records = Array.isArray(raw.records) ? raw.records : Array.isArray(raw) ? raw : [];
  const total   = raw.totalValue ?? records.reduce((s, r) => s + (r.amount || 0), 0);
  const sorted  = [...records].sort((a, b) => new Date(b.disbursedDate) - new Date(a.disbursedDate));

  const byType = records.reduce((acc, r) => {
    acc[r.supportType] = (acc[r.supportType] || 0) + (r.amount || 0);
    return acc;
  }, {});

  const handleDelete = async (id) => {
    try {
      await deleteSupport(id).unwrap();
      toast.success("Financial record deleted");
      if (activeRecord?.id === id) setActiveRecord(null);
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const openEdit = (record) => {
    setActiveRecord(null);
    setEditTarget(record);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <TabShell
      title="Financial Support"
      icon={faHandHoldingUsd}
      actions={canCreate ? [{ label: "Add Record", icon: faPlus, onClick: () => { setEditTarget(null); setShowForm(true); } }] : []}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.18s ease-out forwards; }
        @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scale-up-center { animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      <div className="p-5 space-y-5">
        {/* KPI Ribbon */}
        {sorted.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Disbursed", val: `${total.toLocaleString()} ETB`, cls: "bg-slate-800 text-white" },
              { label: "Records",         val: sorted.length,                   cls: "bg-sky-50 text-sky-700 border border-sky-200" },
              { label: "Support Types",   val: Object.keys(byType).length,      cls: "bg-purple-50 text-purple-700 border border-purple-200" },
              { label: "Latest",          val: new Date(sorted[0]?.disbursedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
            ].map(({ label, val, cls }) => (
              <div key={label} className={`${cls} rounded-2xl p-4 text-center`}>
                <p className="text-xl font-black font-mono">{val}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-70">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Type breakdown chips */}
        {Object.keys(byType).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, amt]) => {
              const tc = SUPPORT_TYPES[type] || SUPPORT_TYPES.OTHER;
              return (
                <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${tc.color}`}>
                  <FontAwesomeIcon icon={tc.icon} className="text-[10px]" />
                  {tc.label}: <span className="font-black font-mono">{amt.toLocaleString()} ETB</span>
                </div>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={faHandHoldingUsd} message="No financial support records yet" />
        ) : (
          <div className="space-y-3">
            {sorted.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onSelect={() => setActiveRecord(record)}
                active={activeRecord?.id === record.id}
                onDelete={handleDelete}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {activeRecord && (
        <DetailPanel
          record={activeRecord}
          onClose={() => setActiveRecord(null)}
          onDelete={handleDelete}
          onEdit={openEdit}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <RecordForm
          editRecord={editTarget}
          childId={childId}
          onClose={closeForm}
          onSaved={() => setActiveRecord(null)}
        />
      )}
    </TabShell>
  );
};

export default FinancialSupportTab;