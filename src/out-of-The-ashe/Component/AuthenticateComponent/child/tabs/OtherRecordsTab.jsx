import React, { useState, useMemo, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen, faPlus, faTrash,
  faFileAlt, faFileVideo, faFilePdf, faImages,
  faUpload, faTimes, faSearch, faDownload,
  faUser, faCalendarAlt, faChevronRight,
  faAlignLeft, faInfoCircle, faFile,
  faPencilAlt, faSave, faSpinner,
  faExclamationTriangle, faEllipsisV, faEye,
} from "@fortawesome/free-solid-svg-icons";
import { TabShell, EmptyState } from "./TabShell";
import {
  useGetOtherRecordsQuery,
  useCreateChildOtherFileMutation,
  useEditOtherRecordMutation,
  useDeleteOtherRecordMutation,
  useDeleteOtherRecordFileMutation,
  useUploadOtherRecordFilesMutation,
} from "../../../../Redux/otherFilesApi";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";

// ── Use env var instead of hardcoded URL ──────────────────────────────────────
const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

// ── File type / name helpers ──────────────────────────────────────────────────
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTS = ["mp4", "mov", "avi", "webm", "mkv", "m4v"];

const getExtension = (file) => {
  const source = file?.url || file?.publicId || file?.public_id || file?.originalName || file?.name || "";
  const match = source.match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  return match ? match[1].toLowerCase() : "";
};

const getFileType = (file) => {
  const mime = file?.mimeType || file?.type || file?.mimetype || "";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  const ext = getExtension(file);
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (VIDEO_EXTS.includes(ext)) return "video";
  return "doc";
};

const getDisplayName = (file) => {
  if (file?.originalName) return file.originalName;
  if (file?.name) return file.name;
  const source = file?.publicId || file?.public_id || file?.url || "";
  const basename = source.split("/").pop();
  return basename || "file";
};

const FILE_META = {
  pdf:   { icon: faFilePdf,   bg: "bg-red-50",   color: "text-red-500",   label: "PDF" },
  video: { icon: faFileVideo, bg: "bg-blue-50",  color: "text-blue-500",  label: "VIDEO" },
  doc:   { icon: faFileAlt,   bg: "bg-slate-50", color: "text-slate-500", label: "DOC" },
};

const resolveUrl = (url) =>
  !url ? "" : url.startsWith("http") ? url : `${API_URL}${url}`;

const inputCls =
  "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition text-sm text-slate-800 bg-white";

const FieldLabel = ({ children, required }) => (
  <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
    {children} {required && <span className="text-rose-400">*</span>}
  </label>
);

// ── Toast helper ──────────────────────────────────────────────────────────────
const runWithToast = async (action, { loading, success, error }) => {
  const id = toast.loading(loading);
  try {
    const result = await action();
    toast.update(id, { render: success, type: "success", isLoading: false, autoClose: 2500 });
    return result;
  } catch (err) {
    toast.update(id, {
      render: err?.data?.message || error,
      type: "error",
      isLoading: false,
      autoClose: 3500,
    });
    throw err;
  }
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

// ── File Action Dropdown ──────────────────────────────────────────────────────
// Delete always visible when canDelete=true — no edit mode gate
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

// ── Upload Progress Bar ───────────────────────────────────────────────────────
const UploadProgress = ({ progress, label }) => (
  <div className="px-6 py-3 bg-sky-50 border-t border-sky-100">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs font-semibold text-sky-700 flex items-center gap-1.5">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[10px]" />
        {label || "Uploading…"}
      </span>
      <span className="text-xs font-mono text-sky-600">{progress}%</span>
    </div>
    <div className="w-full bg-sky-200 rounded-full h-1.5 overflow-hidden">
      <div className="h-full bg-primBtn rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ record, childId, onClose, onDeleteRecord, canDelete, canEdit }) => {
  const [lightbox,       setLightbox]       = useState(null); // { url, filename, fileId, type }
  const [editMode,       setEditMode]       = useState(false);
  const [editTitle,      setEditTitle]      = useState(record.title || "");
  const [editDesc,       setEditDesc]       = useState(record.description || "");
  const [newFiles,       setNewFiles]       = useState([]);
  const [newFileUrls,    setNewFileUrls]    = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,    setIsUploading]    = useState(false);
  const [removedFileIds, setRemovedFileIds] = useState([]);

  const [confirmFileId,       setConfirmFileId]       = useState(null);
  const [confirmFilePublicId, setConfirmFilePublicId] = useState(null);
  const [confirmFileLabel,    setConfirmFileLabel]    = useState("");
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(false);

  const [editRecord, { isLoading: isSaving }]             = useEditOtherRecordMutation();
  const [deleteFile, { isLoading: isDeletingFile }]       = useDeleteOtherRecordFileMutation();
  const [uploadFiles]                                     = useUploadOtherRecordFilesMutation();

  if (!record) return null;
  const files        = record.files || record.attachments || [];
  const visibleFiles = files.filter((f) => !removedFileIds.includes(f.id));

  const prevId = useRef(record.id);
  if (prevId.current !== record.id) {
    prevId.current = record.id;
    setEditTitle(record.title || "");
    setEditDesc(record.description || "");
    setRemovedFileIds([]);
  }

  const handleDownload = async (url, filename) => {
    try {
      const resp    = await fetch(url);
      const blob    = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a       = document.createElement("a");
      a.href = blobUrl; a.download = filename || "file";
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(blobUrl); document.body.removeChild(a);
    } catch {
      const a = document.createElement("a");
      a.href = url; a.download = filename || "file"; a.target = "_blank"; a.click();
    }
  };

  const handleTriggerFileDelete = (fileId) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    const publicId = file.public_id || file.publicId;
    setConfirmFileId(fileId);
    setConfirmFilePublicId(publicId);
    setConfirmFileLabel(getDisplayName(file));
  };

  const handleFileDeleteSubmit = async () => {
    if (!confirmFilePublicId) return;
    const fileId   = confirmFileId;
    const publicId = confirmFilePublicId;
    setRemovedFileIds((prev) => [...prev, fileId]);
    if (lightbox?.fileId === fileId) setLightbox(null);
    setConfirmFileId(null);
    setConfirmFilePublicId(null);
    setConfirmFileLabel("");
    try {
      await runWithToast(
        () => deleteFile({ childId, recordId: record.id, public_id: publicId }).unwrap(),
        { loading: "Removing file…", success: "File removed successfully", error: "Could not delete file" }
      );
    } catch {
      setRemovedFileIds((prev) => prev.filter((id) => id !== fileId));
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return toast.error("Title is required");
    try {
      await runWithToast(
        async () => {
          await editRecord({ childId, recordId: record.id, title: editTitle.trim(), description: editDesc.trim() }).unwrap();
          if (newFiles.length > 0) {
            setIsUploading(true); setUploadProgress(10);
            const fd     = new FormData();
            newFiles.forEach((f) => fd.append("files", f));
            const ticker = setInterval(() => setUploadProgress((p) => Math.min(p + 12, 88)), 300);
            try {
              await uploadFiles({ childId, recordId: record.id, formData: fd }).unwrap();
              setUploadProgress(100);
            } finally {
              clearInterval(ticker);
              setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 600);
            }
            newFileUrls.forEach((u) => u && URL.revokeObjectURL(u));
            setNewFiles([]); setNewFileUrls([]);
          }
        },
        { loading: "Saving changes…", success: "Record updated", error: "Update failed" }
      );
      setEditMode(false);
    } catch {
      setIsUploading(false); setUploadProgress(0);
    }
  };

  const cancelEdit = () => {
    newFileUrls.forEach((u) => u && URL.revokeObjectURL(u));
    setEditTitle(record.title || ""); setEditDesc(record.description || "");
    setNewFiles([]); setNewFileUrls([]); setEditMode(false);
  };

  const handleAddNewFiles = (e) => {
    const picked = Array.from(e.target.files);
    const urls   = picked.map((f) => f.type?.startsWith("image/") ? URL.createObjectURL(f) : null);
    setNewFiles((p)    => [...p, ...picked]);
    setNewFileUrls((p) => [...p, ...urls]);
    e.target.value = "";
  };

  const handleRemoveNewFile = (i) => {
    if (newFileUrls[i]) URL.revokeObjectURL(newFileUrls[i]);
    setNewFiles((p)    => p.filter((_, j) => j !== i));
    setNewFileUrls((p) => p.filter((_, j) => j !== i));
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={editMode ? undefined : onClose} />

      <div
        className="fixed mt-10 scale-80 right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primBtn to-sky-500 px-6 py-5 flex items-start justify-between shrink-0">
          <div className="space-y-1.5 min-w-0 flex-1 pr-3">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/90 text-primBtn">
              Other Record
            </span>
            {editMode ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-white font-black text-base bg-white/20 border border-white/40 rounded-xl px-3 py-1.5 outline-none placeholder:text-white/60 focus:bg-white/30"
                placeholder="Record title…"
              />
            ) : (
              <h2 className="text-white font-black text-lg leading-tight truncate">{record.title}</h2>
            )}
            <p className="text-sky-100 text-xs flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} className="text-[10px]" />
              {record.staff ? `${record.staff.firstName} ${record.staff.lastName}` : "System"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all"
              >
                <FontAwesomeIcon icon={faPencilAlt} className="text-xs" />
              </button>
            )}
            <button
              onClick={editMode ? cancelEdit : onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>
        </div>

        {isUploading && <UploadProgress progress={uploadProgress} label="Uploading files…" />}

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-5">

          {/* Date */}
          <div className="px-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 divide-y divide-slate-100">
              <div className="flex items-start gap-3 py-3">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[10px]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">Date Added</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {record.createdAt
                      ? new Date(record.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "Not recorded"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6">
            <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/70 border border-white flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faAlignLeft} className="text-sky-500 text-[10px]" />
                </div>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">Description</p>
              </div>
              {editMode ? (
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Describe this record…"
                  className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primBtn resize-none transition"
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-line">
                  {record.description || <span className="italic text-slate-400">No description provided.</span>}
                </p>
              )}
            </div>
          </div>

          {/* ── Files Grid — lightbox on click, 3-dot dropdown always shows delete ── */}
          <div className="px-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2.5 flex items-center gap-2">
              <FontAwesomeIcon icon={faImages} className="text-purple-400" />
              Attached Files ({visibleFiles.length}{newFiles.length > 0 ? ` + ${newFiles.length} pending` : ""})
            </p>

            {visibleFiles.length === 0 && newFiles.length === 0 ? (
              <p className="text-xs italic text-slate-300 text-center py-4">No files attached.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {/* Saved files */}
                {visibleFiles.map((file, i) => {
                  const type     = getFileType(file);
                  const url      = resolveUrl(file.url || file.secure_url);
                  const filename = getDisplayName(file);
                  const cfg      = FILE_META[type] || FILE_META.doc;
                  const isImage  = type === "image";

                  return (
                    <div
                      key={file.id || file.publicId || i}
                      className="group relative aspect-square rounded-xl overflow-visible border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xl overflow-hidden"
                        onClick={() => setLightbox({ url, filename, fileId: file.id, type })}
                      >
                        {isImage ? (
                          <img
                            src={url}
                            alt={filename}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "https://placehold.co/100?text=?"; }}
                          />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={cfg.icon} className={`${cfg.color} text-2xl`} />
                            <span className={`text-[9px] font-black ${cfg.color}`}>{cfg.label}</span>
                            <p className="text-[9px] text-slate-400 font-semibold truncate px-1 w-full text-center">{filename}</p>
                          </>
                        )}
                        {isImage && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
                            <FontAwesomeIcon icon={faEye} className="text-white text-sm" />
                          </div>
                        )}
                      </div>

                      {/* 3-dot dropdown — delete always shown when canDelete */}
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

                {/* Pending new files (edit mode only) */}
                {editMode && newFiles.map((f, i) => {
                  const isImg = f.type?.startsWith("image/");
                  const type  = f.type === "application/pdf" ? "pdf" : f.type?.startsWith("video/") ? "video" : "doc";
                  const cfg   = FILE_META[type] || FILE_META.doc;
                  return (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-primBtn/40 bg-primBtn/5 flex flex-col items-center justify-center gap-1">
                      {isImg ? (
                        <img src={newFileUrls[i]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={cfg.icon} className={`${cfg.color} text-xl`} />
                          <span className="text-[8px] font-bold text-primBtn truncate px-1 w-full text-center">{f.name}</span>
                        </>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-primBtn/80 text-[7px] text-white text-center py-0.5 font-bold uppercase tracking-wide">Pending</div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add more files (edit mode) */}
            {editMode && (
              <label className="mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-primBtn rounded-xl py-3 cursor-pointer transition bg-slate-50 hover:bg-primBtn/5 text-xs font-semibold text-slate-500 hover:text-primBtn">
                <FontAwesomeIcon icon={faUpload} className="text-sm" />
                Add more files
                <input type="file" multiple className="hidden" onChange={handleAddNewFiles} />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {editMode ? (
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primBtn text-white font-bold text-sm hover:bg-Hover transition disabled:opacity-50"
            >
              {(isSaving || isUploading)
                ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> Saving…</>
                : <><FontAwesomeIcon icon={faSave} className="text-xs" /> Save Changes</>}
            </button>
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={() => setEditMode(true)}
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
            </>
          )}
        </div>
      </div>

      {/* ── Full Lightbox (same as EducationTab / VulnerabilityTab) ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative mt-20 max-w-4xl w-full max-h-[85vh] rounded-2xl bg-slate-950 p-2 shadow-2xl border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dropdown inside lightbox — delete always shown when canDelete */}
            <div className="absolute top-4 right-23 z-20">
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
              className="absolute top-4 right-6 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition z-20 border border-white/10"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>

            {lightbox.type === "image" ? (
              <img
                src={lightbox.url}
                alt={lightbox.filename}
                className="max-h-[80vh] w-auto mx-auto rounded-xl object-contain"
                onError={(e) => { e.target.src = "https://placehold.co/400?text=?"; }}
              />
            ) : lightbox.type === "pdf" ? (
              <div className="flex mt-10 flex-col gap-2 p-2">
                <iframe
                  title={lightbox.filename}
                  src={lightbox.url}
                  className="w-full h-[75vh] rounded-xl bg-white border-0"
                />
                <p className="text-center text-slate-400 text-[11px] font-semibold pb-1">{lightbox.filename}</p>
              </div>
            ) : lightbox.type === "video" ? (
              <div className="flex mt-10 flex-col gap-2 p-2">
                <video
                  src={lightbox.url}
                  controls
                  className="max-h-[75vh] w-full rounded-xl"
                />
                <p className="text-center text-slate-400 text-[11px] font-semibold pb-1">{lightbox.filename}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 gap-4">
                <FontAwesomeIcon
                  icon={FILE_META[lightbox.type]?.icon || faFile}
                  className={`${FILE_META[lightbox.type]?.color || "text-slate-400"} text-5xl`}
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

      {/* File delete confirmation */}
      <DeleteConfirmationModal
        isOpen={!!confirmFileId}
        onClose={() => { setConfirmFileId(null); setConfirmFilePublicId(null); setConfirmFileLabel(""); }}
        onConfirm={handleFileDeleteSubmit}
        title="Remove Attached File?"
        message={`"${confirmFileLabel}" will be permanently removed from this record and cannot be recovered.`}
        isDeleting={isDeletingFile}
      />

      {/* Record delete confirmation */}
      <DeleteConfirmationModal
        isOpen={confirmDeleteRecord}
        onClose={() => setConfirmDeleteRecord(false)}
        onConfirm={() => {
          setConfirmDeleteRecord(false);
          onDeleteRecord(record);
          onClose();
        }}
        title="Delete Record?"
        message="This will permanently delete the record and all its attached files. This action cannot be undone."
        isDeleting={false}
      />
    </>
  );
};

// ── Record Card ───────────────────────────────────────────────────────────────
const RecordCard = ({ record, onSelect, active, onDeleteRequest, canDelete }) => {
  const files = record.files || record.attachments || [];
  const [confirmCardDelete, setConfirmCardDelete] = useState(false);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md relative ${
          active ? "border-primBtn shadow-md ring-1 ring-primBtn/30" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-primBtn/60" />
        <div className="pl-3 flex items-start justify-between gap-4">
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 mt-0.5">
            <FontAwesomeIcon icon={faFile} className="text-primBtn text-sm" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                Other Record
              </span>
              {files.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-purple-500 font-bold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                  <FontAwesomeIcon icon={faImages} className="text-[9px]" />
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[9px]" />
                {record.createdAt
                  ? new Date(record.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                  : "—"}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faUser} className="text-slate-400 text-[9px]" />
                {record.staff ? `${record.staff.firstName} ${record.staff.lastName}` : "Staff"}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate">{record.title}</p>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {record.description || (
                <span className="italic text-slate-300 flex items-center gap-1">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" /> No description provided.
                </span>
              )}
            </p>
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
        onConfirm={() => { onDeleteRequest(record); setConfirmCardDelete(false); }}
        title="Delete Record?"
        message={`"${record.title}" and all its attached files will be permanently deleted. This action cannot be undone.`}
        isDeleting={false}
      />
    </>
  );
};

// ── File row for add-form queue ───────────────────────────────────────────────
const FileRow = ({ file, preview, onRemove }) => {
  const isImg = file.type?.startsWith("image/");
  const type  = file.type === "application/pdf" ? "pdf" : file.type?.startsWith("video/") ? "video" : "doc";
  const cfg   = FILE_META[type] || FILE_META.doc;
  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {isImg ? (
          <img src={preview} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
        ) : (
          <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
            <FontAwesomeIcon icon={cfg.icon} className={`${cfg.color} text-sm`} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition ml-2 shrink-0"
      >
        <FontAwesomeIcon icon={faTimes} className="text-xs" />
      </button>
    </div>
  );
};

// ── Add Record Form ───────────────────────────────────────────────────────────
const AddRecordForm = ({ childId, onClose, isCreating, onCreate }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [files,          setFiles]          = useState([]);
  const [previewUrls,    setPreviewUrls]    = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading,    setIsUploading]    = useState(false);

  const handleFile = (e) => {
    const picked = Array.from(e.target.files);
    const urls   = picked.map((f) => f.type?.startsWith("image/") ? URL.createObjectURL(f) : null);
    setFiles((p)       => [...p, ...picked]);
    setPreviewUrls((p) => [...p, ...urls]);
    e.target.value = "";
  };

  const handleRemoveFile = (i) => {
    if (previewUrls[i]) URL.revokeObjectURL(previewUrls[i]);
    setFiles((p)       => p.filter((_, j) => j !== i));
    setPreviewUrls((p) => p.filter((_, j) => j !== i));
  };

  const handleClose = () => {
    previewUrls.forEach((u) => u && URL.revokeObjectURL(u));
    reset(); setFiles([]); setPreviewUrls([]);
    onClose();
  };

  const onSubmit = async (data) => {
    const fd = new FormData();
    fd.append("title",       data.title);
    fd.append("description", data.description || "");
    files.forEach((f) => fd.append("otherFile", f));

    if (files.length > 0) {
      setIsUploading(true); setUploadProgress(15);
      const ticker = setInterval(() => setUploadProgress((p) => Math.min(p + 10, 85)), 300);
      try {
        await onCreate(fd); setUploadProgress(100);
        setTimeout(handleClose, 400);
      } finally {
        clearInterval(ticker); setIsUploading(false);
      }
    } else {
      await onCreate(fd); handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl scale-80 w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primBtn rounded-xl flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faUpload} className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Add New Record</h3>
              <p className="text-xs text-slate-400">Attach files and describe the record</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
            <FontAwesomeIcon icon={faTimes} className="text-xs" />
          </button>
        </div>

        {isUploading && <UploadProgress progress={uploadProgress} label="Saving record…" />}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Title of Record</FieldLabel>
            <input
              type="text"
              placeholder="e.g., Exam Results, Medical Checkup…"
              className={inputCls + (errors?.title ? " border-red-400 bg-red-50/30" : "")}
              {...register("title", { required: "Please enter a title" })}
            />
            {errors?.title && <p className="text-xs font-semibold text-red-500">{errors.title.message}</p>}
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Attach Files</FieldLabel>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-primBtn bg-slate-50 hover:bg-primBtn/5 rounded-2xl p-5 text-center cursor-pointer transition">
              <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} />
              <FontAwesomeIcon icon={faUpload} className="text-slate-300 text-2xl mb-1" />
              <p className="text-xs font-semibold text-slate-600">Click to browse files</p>
              <p className="text-[11px] text-slate-400">Images, PDF, Video, Docs — max 20 MB each</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <FileRow key={i} file={f} preview={previewUrls[i]} onRemove={() => handleRemoveFile(i)} />
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Detailed Description</FieldLabel>
            <textarea
              rows={3}
              placeholder="What happened during this period? Provide details here…"
              className={inputCls + " resize-none" + (errors?.description ? " border-red-400 bg-red-50/30" : "")}
              {...register("description", { required: "Please enter a description" })}
            />
            {errors?.description && <p className="text-xs font-semibond text-red-500">{errors.description.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={handleClose} disabled={isCreating || isUploading} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isCreating || isUploading} className="flex-1 py-3 bg-primBtn hover:bg-Hover disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
              {(isCreating || isUploading)
                ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> Saving…</>
                : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Tab ──────────────────────────────────────────────────────────────────
const OtherRecordsTab = ({ childId, canCreate = true, canEdit = true, canDelete = true }) => {
  const { data: childData, isLoading } = useGetOtherRecordsQuery(childId, { skip: !childId });
  const [createRecord] = useCreateChildOtherFileMutation();
  const [deleteRecord] = useDeleteOtherRecordMutation();

  const [showForm,     setShowForm]     = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [removedRecordIds, setRemovedRecordIds] = useState([]);

  const records = useMemo(() => {
    const raw = childData?.data || [];
    return [...raw]
      .filter((r) => !removedRecordIds.includes(r.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [childData, removedRecordIds]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? records.filter((r) => r.title?.toLowerCase().includes(q)) : records;
  }, [records, searchQuery]);

  const syncedActive = useMemo(() =>
    activeRecord ? records.find((r) => r.id === activeRecord.id) || null : null,
  [records, activeRecord]);

  const totalCount = records.length;
  const withFiles  = records.filter((r) => (r.files || r.attachments || []).length > 0).length;

  const handleCreate = async (fd) => {
    if (!childId) return toast.error("Child ID missing");
    try {
      await runWithToast(
        () => createRecord({ id: childId, formData: fd }).unwrap(),
        { loading: "Saving record…", success: "Record saved", error: "Save failed" }
      );
    } catch { /* handled */ }
  };

  const handleDeleteRecord = async (record) => {
    setRemovedRecordIds((prev) => [...prev, record.id]);
    if (activeRecord?.id === record.id) setActiveRecord(null);
    try {
      await runWithToast(
        () => deleteRecord({ childId, recordId: record.id }).unwrap(),
        { loading: "Deleting record…", success: "Record deleted", error: "Delete failed" }
      );
    } catch {
      setRemovedRecordIds((prev) => prev.filter((id) => id !== record.id));
    }
  };

  return (
    <TabShell
      title="Other Records"
      icon={faFolderOpen}
      actions={canCreate ? [{ label: "Add Record", icon: faPlus, onClick: () => setShowForm(true) }] : []}
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
        {totalCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Records", val: totalCount, cls: "bg-slate-100 text-slate-700" },
              { label: "With Files",    val: withFiles,  cls: "bg-purple-50 text-purple-700 border border-purple-200" },
            ].map(({ label, val, cls }) => (
              <div key={label} className={`${cls} rounded-2xl p-4 text-center`}>
                <p className="text-2xl font-black font-mono">{val}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-70">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {totalCount > 0 && (
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title…"
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition text-sm text-slate-800"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            )}
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalCount === 0 ? (
          <EmptyState icon={faFolderOpen} message="No records added yet" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400 gap-2">
            <FontAwesomeIcon icon={faSearch} className="text-2xl" />
            <p className="text-sm font-semibold">No records match &ldquo;{searchQuery}&rdquo;</p>
            <button onClick={() => setSearchQuery("")} className="text-xs text-primBtn font-bold hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onSelect={() => setActiveRecord(record)}
                active={syncedActive?.id === record.id}
                onDeleteRequest={handleDeleteRecord}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail / Edit Panel */}
      {syncedActive && (
        <DetailPanel
          record={syncedActive}
          childId={childId}
          onClose={() => setActiveRecord(null)}
          onDeleteRecord={handleDeleteRecord}
          canDelete={canDelete}
          canEdit={canEdit}
        />
      )}

      {/* Add Modal */}
      {showForm && canCreate && (
        <AddRecordForm
          childId={childId}
          onClose={() => setShowForm(false)}
          isCreating={false}
          onCreate={handleCreate}
        />
      )}
    </TabShell>
  );
};

export default OtherRecordsTab;