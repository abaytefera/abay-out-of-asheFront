import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVideo, faFilePdf, faFileAlt, faDownload,
  faTrash, faTimes, faFileWord, faFileArchive,
  faChevronLeft, faChevronRight, faCloudUploadAlt,
  faPlus, faExpand
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';

export const FileGallery = ({ data = { files: [] }, setFileUpload, onDeleteFile, onUploadFiles ,  canDeleteChild,canEditChild}) => {
  const [previewIndex, setPreviewIndex]   = useState(null);
  const [dragOver, setDragOver]           = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null); // fil object pending confirmation
  const [deleteLoading, setDeleteLoading] = useState(false);
  const inputRef                          = useRef(null);
 const { role } = useSelector((state) => state.auth);
  const files = data.files || [];

  /* ── Escape: close confirmation first, then preview ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) setDeleteTarget(null);
      else setPreviewIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteTarget]);

  /* ── file helpers ── */
  const getFileType = (fil) => {
    const url = (fil?.mediaurl || '').toLowerCase();
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(mp4|webm|ogg|mov)$/))          return 'video';
    if (url.endsWith('.pdf'))                         return 'pdf';
    if (url.match(/\.(doc|docx)$/))                  return 'word';
    if (url.match(/\.(zip|rar|7z)$/))                return 'archive';
    return 'other';
  };

  const typeIcon  = { video: faVideo, pdf: faFilePdf, word: faFileWord, archive: faFileArchive };
  const getIcon   = (type) => typeIcon[type] || faFileAlt;

  const typeStyle = {
    image:   { bg: 'bg-violet-50', text: 'text-violet-500', label: 'IMG'   },
    video:   { bg: 'bg-slate-900', text: 'text-white',      label: 'VIDEO' },
    pdf:     { bg: 'bg-red-50',    text: 'text-red-500',    label: 'PDF'   },
    word:    { bg: 'bg-blue-50',   text: 'text-blue-500',   label: 'DOC'   },
    archive: { bg: 'bg-amber-50',  text: 'text-amber-500',  label: 'ZIP'   },
    other:   { bg: 'bg-slate-100', text: 'text-slate-400',  label: 'FILE'  },
  };

  const downloadFile = (url, name) => {
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const a = Object.assign(document.createElement('a'), {
          href: window.URL.createObjectURL(blob),
          download: name || 'download',
        });
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(a.href);
      })
      .catch(() => window.open(url, '_blank'));
  };

  const shortName = (fil) => {
    const name = fil?.filename || fil?.mediaurl?.split('/').pop() || 'this file';
    return name.length > 30 ? name.slice(0, 27) + '…' : name;
  };

  /* ── confirmed delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (onDeleteFile) {
        await onDeleteFile(deleteTarget);
      } else {
        setFileUpload?.(prev => ({
          ...prev,
          files: (prev.files || []).filter(f => f.mediaurl !== deleteTarget.mediaurl),
        }));
      }
      if (previewIndex !== null) {
        const remaining = files.length - 1;
        if (remaining === 0) setPreviewIndex(null);
        else setPreviewIndex(i => Math.min(i, remaining - 1));
      }
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleUploadPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length && onUploadFiles) onUploadFiles(picked);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length && onUploadFiles) onUploadFiles(dropped);
  };

  const prevFile = () => setPreviewIndex(i => (i - 1 + files.length) % files.length);
  const nextFile = () => setPreviewIndex(i => (i + 1) % files.length);

  /* ═══════════════════════════════════════════
     DELETE CONFIRMATION MODAL
  ═══════════════════════════════════════════ */
  const DeleteConfirmModal = () => {
    if (!deleteTarget) return null;
    const type = getFileType(deleteTarget);
    const { bg, text } = typeStyle[type] || typeStyle.other;

    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        />

        {/* dialog */}
        <div
          className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-[320px] overflow-hidden"
          style={{ animation: 'dgUp .22s cubic-bezier(.34,1.56,.64,1) both' }}
        >
          {/* red top strip */}
          <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-600 w-full" />

          <div className="p-7 flex flex-col items-center gap-5">
            {/* icon stack */}
            <div className="relative mt-1">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-red-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTrash} className="text-red-500 text-[22px]" />
                </div>
              </div>
              {/* file type badge */}
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center ${bg} ${text}`}>
                <FontAwesomeIcon icon={getIcon(type)} className="text-[11px]" />
              </div>
            </div>

            {/* text */}
            <div className="text-center space-y-1.5">
              <h3 className="text-[17px] font-extrabold text-slate-900 tracking-tight">Delete this file?</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed px-2">
                <span className="font-semibold text-slate-700 break-all">"{shortName(deleteTarget)}"</span>
                {' '}will be permanently removed and cannot be recovered.
              </p>
            </div>

            {/* file name pill */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-full justify-center">
              <FontAwesomeIcon icon={getIcon(type)} className={`text-xs ${text}`} />
              <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                {shortName(deleteTarget)}
              </span>
            </div>

            {/* divider */}
            <div className="w-full border-t border-slate-100" />

            {/* buttons */}
            <div className="flex gap-3 w-full">
              <button
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-100 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete</>
                }
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes dgUp {
            from { opacity:0; transform:translateY(18px) scale(.96); }
            to   { opacity:1; transform:translateY(0)    scale(1);   }
          }
        `}</style>
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     EMPTY STATE
  ═══════════════════════════════════════════ */
  if (files.length === 0) {
    return (
      <>
        <DeleteConfirmModal />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            w-full cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
            flex flex-col items-center justify-center gap-3 py-8 px-4 select-none
            ${dragOver
              ? 'border-primBtn bg-blue-50 scale-[1.01]'
              : 'border-slate-200 bg-slate-50 hover:border-primBtn hover:bg-blue-50/40'}
          `}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
            ${dragOver ? 'bg-primBtn text-white' : 'bg-white border border-slate-200 text-primBtn'}`}>
            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 text-sm">
              {dragOver ? 'Drop files here' : 'Upload attachments'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Drag & drop or <span className="text-primBtn font-semibold">browse</span> — images, videos, PDFs, docs
            </p>
          </div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUploadPick} />
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════
     THUMBNAIL CARD
  ═══════════════════════════════════════════ */
  const Thumbnail = ({ fil, idx, type }) => {
    const { bg, text, label } = typeStyle[type] || typeStyle.other;
    return (
      <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 hover:shadow-md hover:scale-105 transition-all cursor-pointer">
        <div className="w-full h-full" onClick={() => setPreviewIndex(idx)}>
          {type === 'image' ? (
            <img src={fil.mediaurl} alt="attachment" className="w-full h-full object-cover" />
          ) : type === 'video' ? (
            <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
              <video className="w-full h-full object-cover opacity-30"><source src={fil.mediaurl} /></video>
              <FontAwesomeIcon icon={faVideo} className="absolute text-white text-xl" />
            </div>
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${bg} ${text}`}>
              <FontAwesomeIcon icon={getIcon(type)} className="text-xl" />
              <span className="text-[9px] font-bold">{label}</span>
            </div>
          )}
        </div>

        {/* hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewIndex(idx); }}
            className="w-7 h-7 rounded-full bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition-all"
            title="Preview"
          >
            <FontAwesomeIcon icon={faExpand} className="text-xs" />
          </button>
          {/* ← opens confirmation, NOT direct delete */}
          {canDeleteChild &&
          (
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(fil); }}
            className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
    )
  }
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     MAIN RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="w-full">

      <DeleteConfirmModal />

      {/* thumbnail grid */}
      <div className="flex flex-wrap gap-3 items-start">
        {files.map((fil, idx) => (
          <Thumbnail key={idx} fil={fil} idx={idx} type={getFileType(fil)} />
        ))}

        {/* add-more tile */}
        {canEditChild &&(

      
        <button
          onClick={() => inputRef.current?.click()}
          className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-primBtn hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primBtn transition-all shrink-0"
          title="Add more files"
        >
          <FontAwesomeIcon icon={faPlus} className="text-lg" />
          <span className="text-[9px] font-bold uppercase">Add</span>
        </button>
        )}
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUploadPick} />
      </div>

      {/* ── Preview modal ── */}
      {previewIndex !== null && (() => {
        const fil  = files[previewIndex];
        const type = getFileType(fil);
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <div className="absolute inset-0" onClick={() => setPreviewIndex(null)} />

            <div className="relative z-10 w-full max-w-5xl flex flex-col" style={{ maxHeight: '90vh' }}>

              {/* top bar */}
              <div className="flex items-center justify-between text-white mb-3 px-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium truncate max-w-[220px]">
                    {fil.filename || `File ${previewIndex + 1}`}
                  </span>
                  <span className="text-[10px] uppercase bg-white/10 px-2 py-0.5 rounded-full">{type}</span>
                  <span className="text-xs text-white/50">{previewIndex + 1} / {files.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile(fil.mediaurl, fil.filename)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    title="Download"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                  {/* ← confirmation, not direct delete */}
                  {canDeleteChild &&(
                  <button
                    onClick={() => setDeleteTarget(fil)}
                    className="w-9 h-9 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center transition-all"
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  )
      }
                  <button
                    onClick={() => setPreviewIndex(null)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    title="Close"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              {/* content */}
              <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: 0 }}>
                {files.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); prevFile(); }}
                    className="absolute left-0 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                )}

                <div className="w-full flex items-center justify-center px-12" style={{ maxHeight: '75vh' }}>
                  {type === 'image' && (
                    <img src={fil.mediaurl} alt="preview" className="max-w-full rounded-xl object-contain" style={{ maxHeight: '75vh' }} />
                  )}
                  {type === 'video' && (
                    <video controls autoPlay className="max-w-full rounded-xl" style={{ maxHeight: '75vh' }}>
                      <source src={fil.mediaurl} />
                    </video>
                  )}
                  {type === 'pdf' && (
                    <iframe src={`${fil.mediaurl}#toolbar=0&navpanes=0`} className="w-full rounded-xl bg-white" style={{ height: '75vh' }} title="PDF preview" />
                  )}
                  {!['image', 'video', 'pdf'].includes(type) && (
                    <div className="flex flex-col items-center gap-4 text-white">
                      <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
                        <FontAwesomeIcon icon={getIcon(type)} className="text-4xl" />
                      </div>
                      <p className="text-sm text-white/70">Preview not available</p>
                      <button
                        onClick={() => downloadFile(fil.mediaurl, fil.filename)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primBtn rounded-xl text-sm font-bold hover:bg-Hover transition-all"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        Download File
                      </button>
                    </div>
                  )}
                </div>

                {files.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); nextFile(); }}
                    className="absolute right-0 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                )}
              </div>

              {/* dot indicators */}
              {files.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {files.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewIndex(i)}
                      className={`rounded-full transition-all ${
                        i === previewIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        );
      })()}
    </div>
  );
};