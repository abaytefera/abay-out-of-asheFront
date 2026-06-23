import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faEnvelope, faPhone, faGlobe, faBuilding, faLink,
  faFileAlt, faChild, faCalendar, faPlus, faTimes,
  faChevronLeft, faSpinner, faSave, faSearch, faXmark,
  faCircleCheck, faTriangleExclamation,
  faHeartPulse, faGraduationCap, faHome, faSyringe, faCoins,
  faUserGroup, faNoteSticky, faTrash, faCamera,
  faEllipsisVertical, faPen, faDownload, faEye,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import {
  useGetSponsorByIdQuery,
  useCreateSponsorshipMutation,
  useEndSponsorshipMutation,
  useGetChildsQuery,
  useDeleteSponsorMutation,
  useUploadSponsorPhotosMutation,
  useDeleteSponsorPhotoMutation,
} from "../../../Redux/Sponsors";
import SponsorReport from "./SponsorReport";
import DashbordNav from "../DashboardComponent/DashbordNav";

import ConfirmDeleteModal from "./Confirmdeletemodal";
import EditSponsorModal from "./Editsponsormodal";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const avatar = (firstName, lastName, bg = "EEF2FF", color = "4F46E5") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + " " + lastName)}&background=${bg}&color=${color}&size=40&font-size=0.4&bold=true`;

// ── Detail row ─────────────────────────────────────────────────────────────
const DetailRow = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <FontAwesomeIcon icon={icon} className="text-slate-400 text-xs" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm text-slate-800 font-medium leading-snug">{value}</p>
      </div>
    </div>
  );
};

// ── Quick stat ─────────────────────────────────────────────────────────────
const QuickStat = ({ value, label }) => (
  <div className="text-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 min-w-[70px]">
    <p className="text-xl font-black text-slate-900">{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-tight">{label}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// SPONSOR ACTIONS DROPDOWN  (Edit / Download report / Delete)
// ─────────────────────────────────────────────────────────────────────────
const SponsorActionsMenu = ({ onEdit, onDownloadReport, onDelete, deleting }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only include items where the handler is provided (non-null = permission granted)
  const items = [
    onEdit           && { label: "Edit sponsor",    icon: faPen,      onClick: onEdit,           danger: false },
    onDownloadReport && { label: "Download report", icon: faDownload, onClick: onDownloadReport, danger: false },
    onDelete         && { label: "Delete sponsor",  icon: faTrash,    onClick: onDelete,         danger: true  },
  ].filter(Boolean);

  // If no items are available, don't render the menu at all
  if (items.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={deleting}
        title="More actions"
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-primBtn hover:border-primBtn/30 hover:bg-primBtn/5 flex items-center justify-center transition disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="text-sm" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { setOpen(false); item.onClick(); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition text-left ${
                item.danger
                  ? "text-rose-500 hover:bg-rose-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primBtn"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-xs w-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// PHOTO ACTIONS DROPDOWN  (View / Download / Delete) — used per thumbnail
// ─────────────────────────────────────────────────────────────────────────
const PhotoActionsMenu = ({ onView, onDownload, onDelete, light = false }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    ...(onView ? [{ label: "View",     icon: faEye,       onClick: onView,     danger: false }] : []),
    { label: "Download", icon: faDownload, onClick: onDownload, danger: false },
    ...(onDelete ? [{ label: "Delete", icon: faTrash,     onClick: onDelete,   danger: true  }] : []),
  ];

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Photo actions"
        className={`w-6 h-6 rounded-full flex items-center justify-center transition text-[10px] ${
          light
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80"
        }`}
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 overflow-hidden">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { setOpen(false); item.onClick(); }}
              className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition text-left ${
                item.danger
                  ? "text-rose-500 hover:bg-rose-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primBtn"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-[10px] w-3" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// PHOTO GALLERY  (view, add, delete sponsor photos)
// ─────────────────────────────────────────────────────────────────────────
const PhotoGallery = ({ sponsor, canManagePhotos }) => {
  const [uploadPhotos, { isLoading: uploading }] = useUploadSponsorPhotosMutation();
  const [deletePhoto,  { isLoading: deletingPhoto }] = useDeleteSponsorPhotoMutation();
  const fileRef = useRef();
  const [lightbox, setLightbox] = useState(null);
  const [pendingPhotoDelete, setPendingPhotoDelete] = useState(null);

  const photos = sponsor.photos || [];

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photos", file);
    try {
      await toast.promise(uploadPhotos({ sponsorId: sponsor.id, formData: fd }).unwrap(), {
        pending: "Uploading photo…",
        success: "Photo added",
        error: "Failed to upload photo",
      });
    } catch {
      // error toast already shown
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleConfirmedDelete = async () => {
    if (!pendingPhotoDelete) return;
    try {
      await toast.promise(deletePhoto({ sponsorId: sponsor.id, photoId: pendingPhotoDelete }).unwrap(), {
        pending: "Deleting photo…",
        success: "Photo deleted",
        error: "Failed to delete photo",
      });
      setLightbox(null);
      setPendingPhotoDelete(null);
    } catch {
      // error toast already shown
    }
  };

  const handleDownload = async (photo) => {
    try {
      await toast.promise(
        (async () => {
          const url = `${API_URL}${photo.url}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("Download failed");
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = photo.publicId || photo.url?.split("/").pop() || "photo.jpg";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);
        })(),
        {
          pending: "Preparing download…",
          success: "Photo downloaded",
          error: "Failed to download photo",
        }
      );
    } catch {
      // error toast already shown
    }
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
        <FontAwesomeIcon icon={faCamera} className="text-[10px]" />
        Photos ({photos.length})
      </p>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
        {photos.map(p => (
          <div key={p.id} className="relative group aspect-square">
            <img
              src={`${API_URL}${p.url}`} alt="" onClick={() => setLightbox(p)}
              className="w-full h-full object-contain rounded-xl ring-1 ring-slate-100 cursor-pointer"
            />
            <div className="absolute top-1 right-1">
              <PhotoActionsMenu
                onView={() => setLightbox(p)}
                onDownload={() => handleDownload(p)}
                // Only show delete option if user has permission
                onDelete={canManagePhotos ? () => setPendingPhotoDelete(p.id) : null}
              />
            </div>
          </div>
        ))}

        {/* Only show upload button if user has permission */}
        {canManagePhotos && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-primBtn/30 bg-primBtn/5 hover:bg-primBtn/10 flex flex-col items-center justify-center gap-1 text-primBtn/60 hover:text-primBtn transition disabled:opacity-50"
          >
            <FontAwesomeIcon icon={uploading ? faSpinner : faPlus} className={uploading ? "animate-spin" : ""} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
      </div>

      {photos.length === 0 && (
        <p className="mt-2 text-[11px] text-slate-400">
          {canManagePhotos ? 'No photos yet — tap "Add" to upload one.' : "No photos yet."}
        </p>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <div className="absolute top-4 right-16" onClick={(e) => e.stopPropagation()}>
            <PhotoActionsMenu
              onDownload={() => handleDownload(lightbox)}
              onDelete={canManagePhotos ? () => setPendingPhotoDelete(lightbox.id) : null}
              light
            />
          </div>
          <img
            src={`${API_URL}${lightbox.url}`} alt=""
            className="max-w-full max-h-full object-contain rounded-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {canManagePhotos && (
        <ConfirmDeleteModal
          open={!!pendingPhotoDelete}
          title="Delete photo"
          message="Delete this photo? This cannot be undone."
          loading={deletingPhoto}
          onConfirm={handleConfirmedDelete}
          onClose={() => setPendingPhotoDelete(null)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// LINK CHILDREN TAB
// ─────────────────────────────────────────────────────────────────────────
const LinkChildrenTab = ({ sponsor, canLink, canDisLink }) => {
  const [createSponsorship, { isLoading: linking }] = useCreateSponsorshipMutation();
  const [endSponsorship,    { isLoading: ending }]  = useEndSponsorshipMutation();
  const { data: allChildren } = useGetChildsQuery();

  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [showPicker,setShowPicker]= useState(false);
  const [pendingEnd, setPendingEnd] = useState(null);

  const children = Array.isArray(allChildren) ? allChildren : (allChildren?.data || []);

  const linkedIds = useMemo(
    () => new Set((sponsor?.sponsorships || []).filter(s => s.isActive).map(s => s.childId)),
    [sponsor]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return children.filter(c =>
      !linkedIds.has(c.id) &&
      c.status === "ACTIVE" &&
      (`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
       c.childCode?.toLowerCase().includes(q))
    );
  }, [children, search, linkedIds]);

  const handleLink = async () => {
    if (!selected) return;
    try {
      await toast.promise(
        createSponsorship({
          childId:   selected.id,
          sponsorId: sponsor.id,
          startDate: new Date(startDate).toISOString(),
          isActive:  true,
        }).unwrap(),
        {
          pending: "Linking child…",
          success: `${selected.firstName} ${selected.lastName} linked successfully`,
          error: {
            render({ data }) {
              return data?.data?.msg || "Failed to link child";
            },
          },
        }
      );
      setSelected(null); setShowPicker(false); setSearch("");
    } catch (err) {
      // error toast already shown
    }
  };

  const handleConfirmedEnd = async () => {
    if (!pendingEnd) return;
    try {
      await toast.promise(
        endSponsorship({ sponsorshipId: pendingEnd, endDate: new Date().toISOString() }).unwrap(),
        {
          pending: "Ending sponsorship…",
          success: "Sponsorship ended",
          error: "Could not end sponsorship",
        }
      );
      setPendingEnd(null);
    } catch {
      // error toast already shown
    }
  };

  const activeSpons = (sponsor?.sponsorships || []).filter(s => s.isActive);

  // If user has no link or dislink permissions, show read-only view
  if (!canLink && !canDisLink) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Active links</p>
            <span className="text-[11px] font-bold bg-primBtn/10 text-primBtn px-2 py-0.5 rounded-full border border-primBtn/20">
              {activeSpons.length}
            </span>
          </div>
          {activeSpons.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FontAwesomeIcon icon={faChild} className="text-slate-200 text-3xl mb-3" />
              <p className="text-sm text-slate-400 font-medium">No children linked yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeSpons.map(sp => (
                <div key={sp.id}
                  className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition">
                  <img
                    src={`${API_URL}${sp.child?.photos?.[0]?.url}` ||
                      avatar(sp.child?.firstName || "?", sp.child?.lastName || "?", "DBEAFE", "1D4ED8")}
                    alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{sp.child?.firstName} {sp.child?.lastName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-mono">{sp.child?.childCode}</span>
                      {" · "}Since {fmtDate(sp.startDate)}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Active sponsorships */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Active links</p>
            <span className="text-[11px] font-bold bg-primBtn/10 text-primBtn px-2 py-0.5 rounded-full border border-primBtn/20">
              {activeSpons.length}
            </span>
          </div>
          {/* Only show "Link child" button if user has canLink permission */}
          {canLink && !showPicker && (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-primBtn bg-primBtn/10 hover:bg-primBtn/20 px-3.5 py-2 rounded-xl transition border border-primBtn/20"
            >
              <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> Link child
            </button>
          )}
        </div>

        {activeSpons.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FontAwesomeIcon icon={faChild} className="text-slate-200 text-3xl mb-3" />
            <p className="text-sm text-slate-400 font-medium">No children linked yet</p>
            {canLink && (
              <p className="text-xs text-slate-400 mt-1">Use "Link child" above to add a sponsorship.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {activeSpons.map(sp => (
              <div key={sp.id}
                className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition group">
                <img
                  src={`${API_URL}${sp.child?.photos?.[0]?.url}` ||
                    avatar(sp.child?.firstName || "?", sp.child?.lastName || "?", "DBEAFE", "1D4ED8")}
                  alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{sp.child?.firstName} {sp.child?.lastName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-mono">{sp.child?.childCode}</span>
                    {" · "}Since {fmtDate(sp.startDate)}
                  </p>
                </div>
                <span className="text-[11px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                  Active
                </span>
                {/* Only show end-sponsorship button if user has canDisLink permission */}
                {canDisLink && (
                  <button
                    onClick={() => setPendingEnd(sp.id)}
                    disabled={ending}
                    className="w-8 h-8 rounded-lg border border-slate-100 text-slate-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition text-xs opacity-0 group-hover:opacity-100"
                    title="End sponsorship"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Child picker — only shown when canLink and user clicked "Link child" */}
      {canLink && showPicker && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">Link a new child</p>
            <button onClick={() => { setShowPicker(false); setSelected(null); setSearch(""); }}
              className="w-6 h-6 rounded-lg bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center text-xs transition">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search active children by name or ID…"
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition placeholder:text-slate-300"
            />
          </div>

          {/* Results */}
          {search && (
            <div className="max-h-52 overflow-y-auto space-y-1 border border-slate-100 rounded-xl bg-white p-2 shadow-sm">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No matching active children found</p>
              ) : filtered.slice(0, 8).map(c => (
                <button
                  key={c.id} type="button"
                  onClick={() => { setSelected(c); setSearch(""); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition hover:bg-primBtn/5 ${
                    selected?.id === c.id ? "bg-primBtn/10 border border-primBtn/20" : ""
                  }`}
                >
                  <img
                    src={`${API_URL}${c.photos?.[0]?.url}` || avatar(c.firstName, c.lastName)}
                    alt="" className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.firstName} {c.lastName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{c.childCode}</p>
                  </div>
                  {selected?.id === c.id &&
                    <FontAwesomeIcon icon={faCircleCheck} className="ml-auto text-primBtn text-sm" />}
                </button>
              ))}
            </div>
          )}

          {/* Selected child preview */}
          {selected && (
            <div className="flex items-center gap-2.5 p-3 bg-primBtn/10 border border-primBtn/20 rounded-xl">
              <img
                src={`${API_URL}${selected.photos?.[0]?.url}` || avatar(selected.firstName, selected.lastName)}
                alt="" className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
              <span className="text-sm font-bold text-primBtn flex-1">
                {selected.firstName} {selected.lastName}
              </span>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 transition">
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </div>
          )}

          {/* Start date only */}
          <div className="max-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
              Start date
            </label>
            <input
              type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn transition"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowPicker(false); setSelected(null); setSearch(""); }}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition">
              Cancel
            </button>
            <button onClick={handleLink} disabled={!selected || linking}
              className="flex-[2] py-2.5 bg-primBtn text-white font-semibold rounded-xl text-sm hover:bg-Hover active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
              {linking
                ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Linking…</>
                : <><FontAwesomeIcon icon={faLink} className="text-xs" /> Confirm link</>}
            </button>
          </div>
        </div>
      )}

      {/* End sponsorship confirm — only reachable if canDisLink */}
      {canDisLink && (
        <ConfirmDeleteModal
          open={!!pendingEnd}
          title="End sponsorship"
          message="End this sponsorship? This action cannot be undone."
          confirmLabel="End sponsorship"
          loading={ending}
          onConfirm={handleConfirmedEnd}
          onClose={() => setPendingEnd(null)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MAIN SPONSOR SINGLE PAGE
// ─────────────────────────────────────────────────────────────────────────
const SponsorSingle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  const { data: sponsor, isLoading } = useGetSponsorByIdQuery(id, { skip: !id });
  const [deleteSponsor, { isLoading: deletingSponsor }] = useDeleteSponsorMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);

  const { user } = useSelector((state) => state.auth);

  // ── Role-based permission flags ──────────────────────────────────────
  const isAdmin          = user?.role === "ADMIN";
  const isProgramManager = user?.role === "PROGRAM_MANAGER";

  const canEdit          = isAdmin;
  const canDelete        = isAdmin;
  const canManagePhotos  = isAdmin;
  const canLink          = isAdmin || isProgramManager;   // can add new sponsorships
  const canDisLink       = isAdmin;                       // can end existing sponsorships
  const canViewLinkTab   = isAdmin || isProgramManager;   // can see the "Link children" tab
  // ────────────────────────────────────────────────────────────────────

  // Build tabs dynamically based on permissions
  const TABS = [
    { id: "overview", label: "Overview",        icon: faUser },
    ...(canViewLinkTab ? [{ id: "link", label: "Link children", icon: faLink }] : []),
    { id: "report",   label: "Generate report", icon: faFileAlt },
  ];

  // Guard: if the current tab is no longer available (e.g. role changed), fall back to overview
  useEffect(() => {
    const tabIds = TABS.map(t => t.id);
    if (!tabIds.includes(activeTab)) setActiveTab("overview");
  }, [activeTab, canViewLinkTab]);

  const handleConfirmedDelete = async () => {
    if (!sponsor || !canDelete) return;
    try {
      await toast.promise(deleteSponsor(sponsor.id).unwrap(), {
        pending: "Deleting sponsor…",
        success: "Sponsor deleted",
        error: {
          render({ data }) {
            return (
              data?.data?.message ||
              data?.data?.msg ||
              "Could not delete sponsor — end active sponsorships first"
            );
          },
        },
      });
      navigate("/ALLSponsor");
    } catch (err) {
      setShowDeleteConfirm(false);
    }
  };

  const handleDownloadReport = () => setActiveTab("report");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading sponsor…</p>
        </div>
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-slate-300 text-xl" />
          </div>
          <p className="text-slate-600 font-semibold">Sponsor not found</p>
          <button onClick={() => navigate("/ALLSponsor")}
            className="text-primBtn text-sm font-bold hover:underline flex items-center gap-1.5 mx-auto">
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" /> Back to sponsors
          </button>
        </div>
      </div>
    );
  }

  const activeCount = (sponsor.sponsorships || []).filter(s => s.isActive).length;
  const reportCount = (sponsor.sponsorships || []).flatMap(s => s.donorReports || []).length;
  const sinceYear   = new Date(sponsor.createdAt).getFullYear();

  return (
    <div className="min-h-screen bg-slate-50">
      <DashbordNav />

      <ToastContainer position="top-right" autoClose={3000} newestOnTop theme="light" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6 mt-16">

        {/* Back + actions dropdown */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/ALLSponsor")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-primBtn font-medium transition group">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 group-hover:border-primBtn/20 group-hover:bg-primBtn/5 flex items-center justify-center transition">
              <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            </div>
            All sponsors
          </button>

          <SponsorActionsMenu
            onEdit={canEdit ? () => setShowEditModal(true) : null}
            onDownloadReport={handleDownloadReport}
            onDelete={canDelete ? () => setShowDeleteConfirm(true) : null}
            deleting={deletingSponsor}
          />
        </div>

        {/* ── Profile card ── */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primBtn to-Hover" />

          <div className="p-6 flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative">
              <img
                src={`${API_URL}${sponsor.photos?.[0]?.url}` ||
                  `https://ui-avatars.com/api/?name=${sponsor.firstName}+${sponsor.lastName}&background=EEF2FF&color=4F46E5&size=80&font-size=0.35&bold=true`}
                alt=""
                className="w-20 h-20 rounded-2xl object-contain ring-4 ring-primBtn/10 shrink-0"
              />
              <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white ${activeCount > 0 ? "bg-green-500" : "bg-slate-300"}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {sponsor.firstName} {sponsor.lastName}
              </h1>
              <p className="text-sm text-slate-400 font-mono mt-0.5">
                #{sponsor.id?.slice(-8).toUpperCase()}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {sponsor.country && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
                    <FontAwesomeIcon icon={faGlobe} className="text-[10px]" /> {sponsor.country}
                  </span>
                )}
                {sponsor.organization && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
                    <FontAwesomeIcon icon={faBuilding} className="text-[10px]" /> {sponsor.organization}
                  </span>
                )}
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  activeCount > 0
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  <FontAwesomeIcon icon={faUserGroup} className="text-[10px]" />
                  {activeCount} active {activeCount === 1 ? "child" : "children"}
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col gap-3 shrink-0">
              <QuickStat value={activeCount} label="Linked" />
              <QuickStat value={reportCount} label="Reports" />
              <QuickStat value={sinceYear}   label="Since" />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === tab.id
                  ? "bg-primBtn text-white border-transparent shadow-lg shadow-blue-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-primBtn/20 hover:text-primBtn hover:bg-primBtn/5"
              }`}>
              <FontAwesomeIcon icon={tab.icon} className="text-xs" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                    Contact details
                  </p>
                  <div>
                    <DetailRow icon={faEnvelope} label="Email"        value={sponsor.email} />
                    <DetailRow icon={faPhone}    label="Phone"        value={sponsor.phone} />
                    <DetailRow icon={faGlobe}    label="Country"      value={sponsor.country} />
                    <DetailRow icon={faBuilding} label="Organization" value={sponsor.organization} />
                    <DetailRow icon={faCalendar} label="Registered"   value={fmtDate(sponsor.createdAt)} />
                  </div>

                  {sponsor.notes && (
                    <div className="mt-5 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1.5 flex items-center gap-1">
                        <FontAwesomeIcon icon={faNoteSticky} className="text-[10px]" /> Notes
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{sponsor.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faChild} className="text-[10px]" />
                    Sponsorships
                  </p>

                  {(sponsor.sponsorships || []).length === 0 ? (
                    <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <FontAwesomeIcon icon={faChild} className="text-slate-200 text-3xl mb-3" />
                      <p className="text-sm text-slate-400 font-medium">No sponsorships yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sponsor.sponsorships.map(sp => (
                        <div key={sp.id}
                          className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition">
                          <img
                            src={`${API_URL}${sp.child?.photos?.[0]?.url}` ||
                              avatar(sp.child?.firstName || "?", sp.child?.lastName || "?", "DBEAFE", "1D4ED8")}
                            alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {sp.child?.firstName} {sp.child?.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {fmtDate(sp.startDate)}{sp.endDate ? ` – ${fmtDate(sp.endDate)}` : " – Present"}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            sp.isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            {sp.isActive ? "Active" : "Ended"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeCount > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Data on file</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { icon: faGraduationCap, label: "Academic",  color: "bg-blue-50   text-blue-600"   },
                          { icon: faHeartPulse,    label: "Nutrition", color: "bg-teal-50   text-teal-600"   },
                          { icon: faSyringe,       label: "Vaccines",  color: "bg-purple-50 text-purple-600" },
                          { icon: faHome,          label: "Visits",    color: "bg-amber-50  text-amber-600"  },
                          { icon: faCoins,         label: "Financial", color: "bg-green-50  text-green-600"  },
                        ].map((item, i) => (
                          <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${item.color}`}>
                            <FontAwesomeIcon icon={item.icon} className="text-[9px]" /> {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo gallery */}
              <div className="pt-6 border-t border-slate-100">
                <PhotoGallery sponsor={sponsor} canManagePhotos={canManagePhotos} />
              </div>
            </div>
          )}

          {/* LINK CHILDREN — only rendered if user has permission */}
          {activeTab === "link" && (
            canViewLinkTab
              ? <LinkChildrenTab
                  sponsor={sponsor}
                  canLink={canLink}
                  canDisLink={canDisLink}
                />
              : <div className="py-16 text-center">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-slate-200 text-3xl mb-3" />
                  <p className="text-sm text-slate-400 font-medium">You don't have permission to manage sponsorships.</p>
                </div>
          )}

          {/* REPORT */}
          {activeTab === "report" && <SponsorReport sponsor={sponsor} />}
        </div>
      </div>

      {/* Edit modal — only mount if permitted */}
      {showEditModal && canEdit && (
        <EditSponsorModal sponsor={sponsor} onClose={() => setShowEditModal(false)} />
      )}

      {/* Delete confirm modal — only mount if permitted */}
      {showDeleteConfirm && canDelete && (
        <ConfirmDeleteModal
          open={showDeleteConfirm}
          title="Delete sponsor"
          message={`Delete ${sponsor.firstName} ${sponsor.lastName}? This cannot be undone.`}
          loading={deletingSponsor}
          onConfirm={handleConfirmedDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default SponsorSingle;