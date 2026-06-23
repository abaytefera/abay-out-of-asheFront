import React, { forwardRef, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical, faXmark, faCamera,
  faChevronLeft, faChevronRight, faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

// ── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="w-10 h-10 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
);

// ── SectionTitle ─────────────────────────────────────────────────────────────
export const SectionTitle = ({ title }) => (
  <h2 className="text-base font-bold text-slate-900">{title}</h2>
);

// ── LabelInput ───────────────────────────────────────────────────────────────
export const LabelInput = forwardRef(({ label, ...props }, ref) => (
  <div className="flex flex-col w-full">
    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-1.5">
      {label}
    </label>
    <input
      {...props}
      ref={ref}
      className="h-11 rounded-xl px-4 border border-slate-200 bg-white text-slate-800 shadow-sm transition-all
        focus:outline-none focus:ring-2 focus:ring-primBtn focus:border-primBtn
        disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
    />
  </div>
));

// ── SelectInput ──────────────────────────────────────────────────────────────
export const SelectInput = ({ label, options = [], ...props }) => (
  <div className="flex flex-col w-full">
    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-1.5">
      {label}
    </label>
    <select
      {...props}
      className="h-11 rounded-xl px-4 border border-slate-200 bg-white text-slate-800 shadow-sm transition-all
        focus:outline-none focus:ring-2 focus:ring-primBtn focus:border-primBtn
        disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
    >
      <option value="">— select —</option>
      {options.map(o => (
        <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
      ))}
    </select>
  </div>
);

// ── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ label, ...props }, ref) => {
  const innerRef = useRef(null);

  const setRefs = (node) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const handleAutoResize = (e) => {
    const t = e.target;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  };

  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.style.height = "auto";
      innerRef.current.style.height = `${innerRef.current.scrollHeight}px`;
    }
  }, [props.value, props.defaultValue]);

  return (
    <div className="flex flex-col w-full">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-1.5">
        {label}
      </label>
      <textarea
        {...props}
        ref={setRefs}
        onInput={handleAutoResize}
        style={{ overflowY: "hidden" }}
        className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm transition-all
          focus:outline-none focus:ring-2 focus:ring-primBtn focus:border-primBtn
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed resize-none"
      />
    </div>
  );
});

// ── ImageSlider ───────────────────────────────────────────────────────────────
export const ImageSlider = ({
  type, uploadProfileLoading, images, ProfileControle,
  file, setFiles, handleUpload, isProfileControlDisplay,
  setIsProfileControlDisplay, currentIndex, onPrev, onNext,
  showFull, handleImageIcon, isLoadingDeleteFile, toggleShow,
  canEditChild, canDeleteChild,
}) => {
  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[currentIndex] : null;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteData, setPendingDeleteData] = useState(null);
  console.log("update")
  console.log(images)

  const canUpload     = canEditChild;
  const canDeleteFile = canDeleteChild;

  const visibleControls = (ProfileControle || []).filter((c) => {
    if (c.type === "delet")  return canDeleteFile;
    if (c.type === "upload") return canUpload;
    return true;
  });

  const inputId = type === "parent" ? "ProfileUploadParent" : "ProfileUpload";

  // Empty state
  if (!hasImages) {
    return (
      <div className="w-48 h-48 md:w-56 md:h-56 mx-auto relative">
        {canUpload ? (
          <label htmlFor={inputId}
            className="flex flex-col items-center justify-center w-full h-full rounded-3xl border-4 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-primBtn transition-all"
          >
            <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-blue-50 text-primBtn">
              <FontAwesomeIcon icon={faCamera} className="text-xl" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Click to upload</p>
            <input type="file" id={inputId} className="hidden" accept="image/*" onChange={(e) => { if (e.target.files[0]) setFiles(e.target.files[0]); }} />
          </label>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full rounded-3xl border-4 border-dashed border-slate-200 bg-slate-50">
            <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <FontAwesomeIcon icon={faCamera} className="text-xl" />
            </div>
            <p className="text-xs font-bold text-slate-300">No photo</p>
          </div>
        )}
        {file && <UploadPreviewModal file={file} setFiles={setFiles} uploadProfileLoading={uploadProfileLoading} handleUpload={handleUpload} type={type} />}
      </div>
    );
  }

  return (
    <div className={`transition-all duration-500 ease-in-out ${
      showFull
        ? "fixed inset-0 p-4 md:p-10 bg-black/60 backdrop-blur-xl z-[999] flex items-center justify-center"
        : "w-48 h-48 md:w-56 md:h-56 mx-auto relative"
    }`}>
      <div className={`relative group w-full h-full overflow-hidden shadow-2xl transition-all duration-300 ${
        showFull ? "max-w-4xl max-h-[90vh] rounded-3xl" : "rounded-3xl border-4 border-white"
      }`}>
        <img
          src={`${API_URL}${currentImage?.url}`}
          alt="Profile"
          onClick={toggleShow}
          className="w-full h-full cursor-pointer transition-transform duration-700 hover:scale-105 object-contain"
        />

        {!showFull && <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />}

        {/* Nav buttons */}
        {images.length > 1 && currentIndex > 0 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/50 transition-all">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        )}
        {images.length > 1 && currentIndex < images.length - 1 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/50 transition-all">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}

        {/* Menu */}
        {(canUpload || canDeleteFile || true) && (
          <div className="absolute top-3 right-3 z-30 flex gap-2">
            <button type="button"
              onClick={(e) => { e.stopPropagation(); setIsProfileControlDisplay(!isProfileControlDisplay); }}
              className="w-9 h-9 rounded-full bg-primBtn text-white hover:bg-Hover cursor-pointer transition-all flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </button>
            {showFull && (
              <button onClick={toggleShow}
                className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center">
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            )}
          </div>
        )}

        {!(canUpload || canDeleteFile) && showFull && (
          <button onClick={toggleShow}
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center">
            <FontAwesomeIcon icon={faXmark} className="text-xl" />
          </button>
        )}

        {/* Dropdown */}
        {isProfileControlDisplay && visibleControls.length > 0 && (
          <div className="absolute right-3 top-14 z-50 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl w-44 overflow-hidden">
            {visibleControls.map((control) => (
              <button key={control.id} type="button"
                onClick={() => {
                  if (control.type === "delet") {
                    setPendingDeleteData({ mediaurl: currentImage?.mediaurl, public_id: currentImage?.publicId, controlType: control.type, itemType: type });
                    setIsDeleteModalOpen(true);
                  } else {
                    handleImageIcon(currentImage?.mediaurl, currentImage?.public_id, control.type, type);
                  }
                  setIsProfileControlDisplay(false);
                }}
                className={`w-full flex px-4 py-3 items-center gap-3 transition-all text-sm font-bold
                  ${control.type === "delet" ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-primBtn hover:text-white"}`}>
                <FontAwesomeIcon icon={control.icon} className="w-4 opacity-70" />
                {control.text}
              </button>
            ))}
          </div>
        )}

        {/* Delete confirm modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600 mb-4">
                <FontAwesomeIcon icon={faTrash} className="text-xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Permanently delete file?</h3>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setPendingDeleteData(null); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all w-full">
                  Cancel
                </button>
                <button type="button"
                  onClick={() => {
                    if (pendingDeleteData) {
                      handleImageIcon(pendingDeleteData.mediaurl, pendingDeleteData.public_id, pendingDeleteData.controlType, pendingDeleteData.itemType);
                    }
                    setIsDeleteModalOpen(false);
                    setPendingDeleteData(null);
                  }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all w-full">
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoadingDeleteFile && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white text-[10px] font-black mt-3 uppercase tracking-widest">Deleting…</span>
          </div>
        )}
      </div>

      {canUpload && (
        <input type="file" id={inputId} className="hidden" accept="image/*"
          onChange={(e) => { if (e.target.files[0]) { setFiles(e.target.files[0]); setIsProfileControlDisplay(false); } }}
        />
      )}

      {file && <UploadPreviewModal file={file} setFiles={setFiles} uploadProfileLoading={uploadProfileLoading} handleUpload={handleUpload} type={type} />}
    </div>
  );
};

// ── UploadPreviewModal ────────────────────────────────────────────────────────
const UploadPreviewModal = ({ file, setFiles, uploadProfileLoading, handleUpload, type }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[1000] p-6">
    <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl">
      <h3 className="text-2xl font-black text-slate-900 text-center mb-6">Preview photo</h3>
      <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-8 ring-8 ring-slate-50 shadow-inner">
        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
        {uploadProfileLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="flex gap-4">
        <button disabled={uploadProfileLoading} onClick={() => setFiles(null)}
          className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">
          Cancel
        </button>
        <button disabled={uploadProfileLoading} onClick={() => handleUpload(file, type)}
          className="flex-[2] py-4 bg-primBtn text-white font-bold rounded-2xl shadow-xl">
          {uploadProfileLoading ? "Saving…" : "Save photo"}
        </button>
      </div>
    </div>
  </div>
);

// ── MyProfileImage ────────────────────────────────────────────────────────────
export const MyProfileImage = (props) => (
  <ImageSlider
    {...props}
    type="parent"
    handleUpload={props.handleUploadParentFile}
    handleImageIcon={props.handleImageIconParent}
  />
);
