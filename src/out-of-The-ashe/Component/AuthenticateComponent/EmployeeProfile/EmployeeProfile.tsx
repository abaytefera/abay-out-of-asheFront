import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope, faPhone, faArrowLeft, faTrash,
  faEllipsisV, faKey, faTimes, faEye, faEyeSlash,
  faSearchPlus, faUserShield, faUserXmark,
  faBriefcase, faBuilding, faCalendar, faLock, faUnlock,
  faIdCard, faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";

import {
  useGetEmployeeByIdQuery,
  useDeleteEmployeeMutation,
  useResetEmployeePasswordMutation,
  useGetPermissionsOwnQuery,
  useDeactivateEmployeeMutation,
  useUpdateBackgroundCheckMutation,
} from "../../../Redux/Employee";

import DeleteConfirmationModal from "../DeleteConfirmationModal";
import { InfoCard, CheckItem } from "./SubComponents";
import "react-toastify/dist/ReactToastify.css";
const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const BG_BADGE: Record<string, string> = {
  CLEARED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FLAGGED: "bg-rose-50 text-rose-700 border-rose-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((s: any) => s.auth);
 

  // ── Role-based permission flags ──────────────────────────────────────
 // ── Role-based permission flags ──────────────────────────────────────
const isAdmin = user?.role === "ADMIN";

const canModify         = isAdmin;
const canDeleteEmployee = canModify;
const canResetPassword  = canModify;
const canToggleActive   = canModify;
const canUpdateBgCheck  = isAdmin;   // ← add this line

  // ────────────────────────────────────────────────────────────────────

  // Modal and menu state
  const [isModalOpen,           setIsModalOpen]           = useState(false);
  const [isMenuOpen,            setIsMenuOpen]            = useState(false);
  const [isResetModalOpen,      setIsResetModalOpen]      = useState(false);
  const [isPreviewOpen,         setIsPreviewOpen]         = useState(false);
  const [isBgOpen,              setIsBgOpen]              = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Password form state
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw,          setShowPw]          = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const bgRef   = useRef<HTMLDivElement>(null);

  // Queries & mutations
  const { data: empResp, isLoading } = useGetEmployeeByIdQuery(id);
  const [deleteEmployee,    { isLoading: isDeleting }] = useDeleteEmployeeMutation();
  const [resetEmployeePassword]                        = useResetEmployeePasswordMutation();
  const [deactivateEmployee]                           = useDeactivateEmployeeMutation();
  const [updateBackgroundCheck]                        = useUpdateBackgroundCheckMutation();

  const emp = empResp?.data ?? empResp;

  const fullName  = emp ? `${emp.firstName} ${emp.lastName}` : "Staff Member";
  const avatarSrc = `${API_URL}${emp?.avatarUrl}`;

  const req = {
    length:  newPassword.length >= 8,
    upper:   /[A-Z]/.test(newPassword),
    lower:   /[a-z]/.test(newPassword),
    number:  /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match:   !!newPassword && newPassword === confirmPassword,
  };
  const pwValid = Object.values(req).every(Boolean);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
      if (bgRef.current   && !bgRef.current.contains(e.target as Node))   setIsBgOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleDelete = async () => {
    if (!canDeleteEmployee) return;
    setIsModalOpen(false);
    await toast.promise(deleteEmployee(id).unwrap(), {
      pending: "Deleting employee account…",
      success: "Account removed successfully.",
      error: { render: ({ data }: any) => data?.data?.message || "Delete failed." },
    });
    setTimeout(() => navigate("/AllEmployees"), 1800);
  };

  const handleToggleActive = async () => {
    if (!canToggleActive) return;
    await toast.promise(deactivateEmployee(id).unwrap(), {
      pending: emp?.isActive ? "Deactivating…" : "Reactivating…",
      success: emp?.isActive ? "Account deactivated." : "Account reactivated.",
      error: { render: ({ data }: any) => data?.data?.message || "Failed." },
    });
  };

  const handleBgCheck = async (status: string) => {
    if (!canUpdateBgCheck) return;
    setIsBgOpen(false);
    await toast.promise(
      updateBackgroundCheck({ id, status, remarks: "Updated via profile dashboard." }).unwrap(),
      {
        pending: "Updating background check…",
        success: `Background check set to ${status}`,
        error: { render: ({ data }: any) => data?.data?.message || "Failed." },
      }
    );
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwValid || !canResetPassword) return;
    await toast.promise(
      resetEmployeePassword({ id, newPassword }).unwrap(),
      {
        pending: "Updating credentials…",
        success: "Password reset successfully.",
        error: { render: ({ data }: any) => data?.data?.message || "Failed." },
      }
    );
    setIsResetModalOpen(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
          <p className="text-primBtn font-black uppercase tracking-widest text-xs">Loading Profile…</p>
        </div>
      </div>
    );
  }

  const bgStatus = emp?.backgroundCheckStatus ?? "PENDING";
  const bgBadge  = BG_BADGE[bgStatus] ?? BG_BADGE.PENDING;
  const isActive = emp?.isActive !== false;

  // Whether the actions menu has at least one item to show
  const hasMenuItems = canResetPassword || canToggleActive || canDeleteEmployee;

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-0 relative">
      <ToastContainer position="top-center" theme="colored" autoClose={2000} />

      {/* Delete confirmation modal — only mount when permitted */}
      {canDeleteEmployee && (
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleDelete}
          itemName={fullName}
          isDeleting={isDeleting}
        />
      )}

      {/* Deactivate / Reactivate confirmation modal — only mount when permitted */}
      {canToggleActive && (
        <DeleteConfirmationModal
          isOpen={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          onConfirm={async () => {
            setIsDeactivateModalOpen(false);
            await handleToggleActive();
          }}
          itemName={`${isActive ? "deactivate" : "reactivate"} ${fullName}'s account`}
          isDeleting={false}
        />
      )}

      {/* Avatar preview — available to all roles */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={() => setIsPreviewOpen(false)}>
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <button onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={avatarSrc} alt={fullName}
              className="max-w-sm max-h-[75vh] rounded-[2rem] object-contain shadow-2xl border-4 border-white/10"
              onClick={e => e.stopPropagation()}
            />
            <p className="text-white/60 text-xs font-bold tracking-widest uppercase bg-white/5 px-4 py-1.5 rounded-full">
              {fullName} · Profile Photo
            </p>
          </div>
        </div>
      )}

      {/* Password Reset Modal — only mount when permitted */}
      {isResetModalOpen && canResetPassword && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsResetModalOpen(false)} />
          <div className="relative z-10 bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-7">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <FontAwesomeIcon icon={faKey} />
                </div>
                <h3 className="text-base font-black text-slate-900">Reset Password</h3>
              </div>
              <button onClick={() => { setIsResetModalOpen(false); setNewPassword(""); setConfirmPassword(""); }}
                className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center text-xs">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleResetPw} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" autoFocus
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primBtn focus:bg-white transition-all font-medium text-slate-800 pr-10" />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                    <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white transition-all font-medium text-slate-800 pr-10 ${
                      confirmPassword ? (req.match ? "border-emerald-300 focus:border-emerald-500" : "border-rose-300 focus:border-rose-500") : "border-slate-200 focus:border-primBtn"
                    }`} />
                  <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">
                    <FontAwesomeIcon icon={showConfirmPw ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <CheckItem isMet={req.length}  text="Min 8 Characters" />
                <CheckItem isMet={req.upper}   text="Uppercase (A–Z)" />
                <CheckItem isMet={req.lower}   text="Lowercase (a–z)" />
                <CheckItem isMet={req.number}  text="Number (0–9)" />
                <CheckItem isMet={req.special} text="Special (!@#)" />
                <CheckItem isMet={req.match}   text="Passwords Match" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setIsResetModalOpen(false); setNewPassword(""); setConfirmPassword(""); }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={!pwValid}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                    pwValid ? "bg-primBtn text-white hover:bg-Hover shadow-primBtn/20 cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  }`}>
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex justify-between items-center mb-7">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-primBtn font-bold transition-all group text-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </button>

        {/* Actions menu — only render if user has at least one permitted action */}
        {hasMenuItems && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(p => !p)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primBtn hover:border-primBtn transition-all shadow-sm">
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden min-w-[220px]">

                {/* Reset Password — only if canResetPassword */}
                {canResetPassword && (
                  <button onClick={() => { setIsMenuOpen(false); setIsResetModalOpen(true); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2.5 transition-colors">
                    <FontAwesomeIcon icon={faKey} className="text-slate-400 w-4" />
                    Reset Password
                  </button>
                )}

                {/* Deactivate / Reactivate — only if canToggleActive */}
                {canToggleActive && (
                  <>
                    {canResetPassword && <hr className="border-slate-100 my-1" />}
                    <button onClick={() => { setIsMenuOpen(false); setIsDeactivateModalOpen(true); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                        isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                      }`}>
                      <FontAwesomeIcon icon={isActive ? faUserXmark : faUserCheck} className="w-4" />
                      {isActive ? "Deactivate Account" : "Reactivate Account"}
                    </button>
                  </>
                )}

                {/* Delete — only if canDeleteEmployee */}
                {canDeleteEmployee && (
                  <>
                    {(canResetPassword || canToggleActive) && <hr className="border-slate-100 my-1" />}
                    <button disabled={isDeleting} onClick={() => { setIsMenuOpen(false); setIsModalOpen(true); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-rose-500 hover:bg-rose-50 font-semibold flex items-center gap-2.5 transition-colors">
                      <FontAwesomeIcon icon={faTrash} className="text-rose-400 w-4" />
                      Delete Account
                    </button>
                  </>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-white mb-6">
        <div className="h-28 bg-primBtn" />

        <div className="px-6 md:px-10 pb-10">
          <div className="relative flex flex-col md:flex-row items-center md:items-end gap-5 -mt-14 mb-8">
            <div onClick={() => setIsPreviewOpen(true)} className="relative group cursor-zoom-in shrink-0">
              <img src={avatarSrc} alt={fullName}
                className="w-32 h-32 rounded-[2rem] object-cover border-6 border-white shadow-xl bg-slate-100 group-hover:brightness-90 transition-all duration-300" />
              <div className="absolute inset-0 rounded-[2rem] bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <FontAwesomeIcon icon={faSearchPlus} className="text-white text-lg" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left pb-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">

                {/* Active/Deactivated badge — always visible */}
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  {isActive ? "Active" : "Deactivated"}
                </span>

                {/* Background check badge — clickable only if canUpdateBgCheck */}
                <div className="relative" ref={bgRef}>
                  <button
                    disabled={!canUpdateBgCheck}
                    onClick={() => canUpdateBgCheck && setIsBgOpen(p => !p)}
                    className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${bgBadge} ${
                      canUpdateBgCheck ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <FontAwesomeIcon icon={faUserShield} className="text-[8px]" />
                    BG: {bgStatus}
                    {/* Only show the dropdown arrow if the user can change it */}
                    {canUpdateBgCheck && <span className="text-[7px] opacity-60">▼</span>}
                  </button>

                  {/* Dropdown — only renders if canUpdateBgCheck */}
                  {canUpdateBgCheck && isBgOpen && (
                    <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-40 overflow-hidden">
                      {["PENDING", "CLEARED", "FLAGGED"].map(s => (
                        <button key={s} onClick={() => handleBgCheck(s)}
                          className="w-full px-3 py-1.5 text-left text-[10px] font-black tracking-wider text-slate-600 hover:bg-primBtn/5 hover:text-primBtn transition-colors">
                          SET {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2FA badge — always visible, read-only */}
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  emp?.twoFactorEnabled ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-400 border-slate-200"
                }`}>
                  <FontAwesomeIcon icon={emp?.twoFactorEnabled ? faLock : faUnlock} className="text-[8px]" />
                  2FA {emp?.twoFactorEnabled ? "On" : "Off"}
                </span>
              </div>

              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{fullName}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5">
                <span className="text-[10px] font-black px-2.5 py-1 bg-primBtn/10 text-primBtn rounded-xl uppercase tracking-wider">
                  {emp?.role?.replace(/_/g, " ")}
                </span>
                {emp?.department && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-xl">
                    {emp.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100 mb-7" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <InfoCard icon={faEnvelope}  label="Email"        value={emp?.email}      accent />
            <InfoCard icon={faPhone}     label="Phone"        value={emp?.phone} />
            <InfoCard icon={faBriefcase} label="Job Title"    value={emp?.jobTitle} />
            <InfoCard icon={faBuilding}  label="Department"   value={emp?.department} />
            <InfoCard icon={faCalendar}  label="Hire Date"    value={emp?.hireDate ? fmtDate(emp.hireDate) : null} />
            <InfoCard icon={faIdCard}    label="Member Since" value={fmtDate(emp?.createdAt)} />
          </div>

          {emp?.backgroundCheckDate && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 w-max">
              <FontAwesomeIcon icon={faUserShield} className="text-slate-400" />
              Background check completed: <strong className="text-slate-700">{fmtDate(emp.backgroundCheckDate)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;