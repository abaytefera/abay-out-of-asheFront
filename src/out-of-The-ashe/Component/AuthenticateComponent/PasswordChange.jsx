import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock, faEye, faEyeSlash, faShieldHalved, faCheckCircle,
  faCircle, faSpinner, faKey, faXmarkCircle, faQrcode,
  faShieldVirus, faMobileScreen, faRotateRight, faXmark,
  faCopy, faCheck, faToggleOn, faToggleOff, faArrowRight,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

import {
  useSetup2FAMutation,
  useVerify2FAMutation,
  useGetMeQuery,
  useChangePasswordMutation,
  useDisable2FAMutation, // ✅ FIXED: Added missing import
} from "../../Redux/User";

// ── Password strength rules ─────────────────────────────────────────────
const RULES = [
  { key: "length",  label: "At least 8 characters",    test: (v) => v.length >= 8 },
  { key: "upper",   label: "Uppercase letter (A–Z)",    test: (v) => /[A-Z]/.test(v) },
  { key: "lower",   label: "Lowercase letter (a–z)",    test: (v) => /[a-z]/.test(v) },
  { key: "number",  label: "At least one number",       test: (v) => /[0-9]/.test(v) },
  { key: "special", label: "Special character (!@#…)",  test: (v) => /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/\\]/.test(v) },
];

const strengthLevel = (n) => [
  { label: "Very weak",   bar: "w-1/5",  color: "bg-red-400",    text: "text-red-500"    },
  { label: "Weak",        bar: "w-2/5",  color: "bg-orange-400", text: "text-orange-500" },
  { label: "Fair",        bar: "w-3/5",  color: "bg-amber-400",  text: "text-amber-500"  },
  { label: "Strong",      bar: "w-4/5",  color: "bg-blue-400",   text: "text-blue-500"   },
  { label: "Very strong", bar: "w-full", color: "bg-green-500",  text: "text-green-600"  },
][Math.max(0, Math.min(n - 1, 4))];

// ── Shared helpers ──────────────────────────────────────────────────────
const inputBase =
  "w-full h-12 pl-10 pr-12 border-2 rounded-2xl text-sm font-medium transition-all focus:outline-none";

const PasswordInput = ({ label, name, value, onChange, error, hint, autoFocus }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">{label}</label>
      <div className="relative">
        <FontAwesomeIcon icon={faLock} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
          className={`${inputBase} ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-400"
              : value
              ? "border-primBtn/40 bg-primBtn/5 focus:border-primBtn"
              : "border-slate-200 bg-slate-50 focus:border-primBtn focus:bg-white"
          }`}
        />
        <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
          <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-red-500 ml-1">{error}</p>}
      {hint && !error && <p className="text-[11px] text-slate-400 ml-1">{hint}</p>}
    </div>
  );
};

const RuleItem = ({ met, label }) => (
  <div className={`flex items-center gap-2 transition-all duration-200 ${met ? "text-green-600" : "text-slate-400"}`}>
    <FontAwesomeIcon icon={met ? faCheckCircle : faCircle}
      className={`text-sm transition-all ${met ? "text-green-500 scale-110" : "text-slate-300"}`} />
    <span className="text-xs font-semibold">{label}</span>
  </div>
);

// ── OTP digit input ─────────────────────────────────────────────────────
const OTPInput = ({ value, onChange, disabled }) => {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[i]) { next[i] = ""; }
      else if (i > 0) { next[i - 1] = ""; refs[i - 1].current?.focus(); }
      onChange(next.join(""));
    } else if (e.key === "ArrowLeft"  && i > 0) refs[i - 1].current?.focus();
    else if  (e.key === "ArrowRight" && i < 5) refs[i + 1].current?.focus();
  };

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const next = [...digits];
    next[i] = char;
    onChange(next.join(""));
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(text.padEnd(6, "").slice(0, 6));
    refs[Math.min(text.length, 5)].current?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={d} disabled={disabled}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-11 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all
            ${d ? "border-primBtn bg-primBtn/5 text-primBtn" : "border-slate-200 bg-slate-50 text-slate-900"}
            focus:border-primBtn focus:bg-primBtn/5 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
};

// ── Section card ────────────────────────────────────────────────────────
const SectionCard = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-100 rounded-3xl shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, iconBg, title, subtitle, right }) => (
  <div className="flex items-center justify-between px-7 py-5 border-b border-slate-50">
    <div className="flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${iconBg}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// 2FA SETUP MODAL
// ═══════════════════════════════════════════════════════════════
const TwoFASetupModal = ({ onClose, onComplete }) => {
  const { user } = useSelector(s => s.auth);
  const [setup2FA,  { isLoading: setting  }] = useSetup2FAMutation();
  const [verify2FA, { isLoading: verifying }] = useVerify2FAMutation();

  // "init" | "scan" | "verify" | "done"
  const [phase,    setPhase]    = useState("init");
  const [qrData,   setQrData]   = useState(null);   // { secret, otpAuthUrl }
  const [code,     setCode]     = useState("");
  const [copied,   setCopied]   = useState(false);

  const handleBegin = async () => {
    try {
      const res = await setup2FA().unwrap();
      setQrData(res?.data ?? res);
      setPhase("scan");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to generate 2FA secret");
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length !== 6) return;
    try {
      await verify2FA({ userId: user.id, token }).unwrap();
      setPhase("done");
      setTimeout(() => { onComplete(); onClose(); }, 1800);
    } catch (err) {
      console.log(err)
      toast.error(err?.data?.message || "Invalid code — please try again");
      setCode("");
    }
  };

  // Auto-submit when 6 digits entered
  useEffect(() => { if (code.length === 6 && phase === "verify") handleVerify(); }, [code]);

  const copySecret = () => {
    if (!qrData?.secret) return;
    navigator.clipboard.writeText(qrData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primBtn to-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldVirus} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Set up two-factor authentication</h3>
              <p className="text-blue-200 text-xs mt-0.5">
                {phase === "init" && "Secure your account with an authenticator app"}
                {phase === "scan" && "Step 1 of 2 — Scan the QR code"}
                {phase === "verify" && "Step 2 of 2 — Enter verification code"}
                {phase === "done" && "2FA enabled successfully!"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Step progress */}
        {(phase === "scan" || phase === "verify") && (
          <div className="flex px-6 py-3 gap-2 bg-slate-50 border-b border-slate-100">
            {["Scan QR", "Verify code"].map((s, i) => {
              const active = (phase === "scan" && i === 0) || (phase === "verify" && i === 1);
              const done   = phase === "verify" && i === 0;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center
                    ${done ? "bg-green-500 text-white" : active ? "bg-primBtn text-white" : "bg-slate-200 text-slate-500"}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${active ? "text-primBtn" : done ? "text-green-600" : "text-slate-400"}`}>{s}</span>
                  {i === 0 && <div className={`w-6 h-0.5 rounded-full mx-1 ${done ? "bg-green-400" : "bg-slate-200"}`} />}
                </div>
              );
            })}
          </div>
        )}

        <div className="px-6 py-6 space-y-5">

          {/* INIT PHASE */}
          {phase === "init" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-primBtn/10 flex items-center justify-center mx-auto">
                <FontAwesomeIcon icon={faMobileScreen} className="text-primBtn text-3xl" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  Two-factor authentication adds a second layer of security to your account.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You'll need an authenticator app like <strong className="text-slate-600">Google Authenticator</strong> or <strong className="text-slate-600">Authy</strong> on your phone.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {["Install app","Scan QR code","Enter 6-digit code"].map((s, i) => (
                  <div key={s} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <div className="w-7 h-7 bg-primBtn/10 text-primBtn rounded-xl flex items-center justify-center mx-auto mb-2 text-xs font-black">{i + 1}</div>
                    <p className="text-[11px] font-semibold text-slate-600">{s}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleBegin} disabled={setting}
                className="w-full h-11 bg-primBtn hover:bg-Hover text-white font-bold rounded-2xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {setting ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Generating…</> : <>Get started <FontAwesomeIcon icon={faArrowRight} className="text-xs" /></>}
              </button>
            </div>
          )}

          {/* SCAN PHASE */}
          {phase === "scan" && qrData && (
            <div className="space-y-5">
              <p className="text-sm text-slate-600 font-medium text-center">
                Open your authenticator app and scan this QR code.
              </p>

              {/* QR code — rendered as a white-background iframe of the otpauth URL via a QR API */}
              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData.otpAuthUrl || qrData.otpauthUrl || "")}`}
                    alt="2FA QR code"
                    className="w-44 h-44 rounded-xl"
                  />
                </div>
              </div>

              {/* Manual entry secret */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Can't scan? Enter this code manually
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 break-all">
                    {qrData.secret}
                  </code>
                  <button onClick={copySecret}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primBtn hover:border-primBtn flex items-center justify-center transition shrink-0">
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`text-xs ${copied ? "text-green-500" : ""}`} />
                  </button>
                </div>
                {copied && <p className="text-[11px] text-green-600 font-semibold mt-1.5 ml-1">Copied to clipboard!</p>}
              </div>

              <button onClick={() => setPhase("verify")}
                className="w-full h-11 bg-primBtn hover:bg-Hover text-white font-bold rounded-2xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2">
                I've scanned the code <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </button>
            </div>
          )}

          {/* VERIFY PHASE */}
          {phase === "verify" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  Enter the 6-digit code shown in your authenticator app.
                </p>
                <p className="text-xs text-slate-400">The code refreshes every 30 seconds.</p>
              </div>

              <OTPInput value={code} onChange={setCode} disabled={verifying} />

              {/* Progress dots */}
              <div className="flex gap-1.5 justify-center">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i < code.length ? "w-5 bg-primBtn" : "w-3 bg-slate-200"}`} />
                ))}
              </div>

              <button type="submit" disabled={code.length !== 6 || verifying}
                className="w-full h-11 bg-primBtn hover:bg-Hover text-white font-bold rounded-2xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {verifying ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Verifying…</> : <><FontAwesomeIcon icon={faKey} /> Verify & enable</>}
              </button>

              <button type="button" onClick={() => setPhase("scan")}
                className="w-full text-xs font-semibold text-slate-400 hover:text-primBtn transition-colors">
                ← Back to QR code
              </button>
            </form>
          )}

          {/* DONE PHASE */}
          {phase === "done" && (
            <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-3xl bg-green-500 flex items-center justify-center shadow-xl shadow-green-200">
                <FontAwesomeIcon icon={faCheckCircle} className="text-white text-3xl" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-black text-slate-900">2FA enabled!</h4>
                <p className="text-sm text-slate-500 mt-1">Your account is now protected with two-factor authentication.</p>
              </div>
              <div className="w-6 h-6 border-3 border-primBtn border-t-transparent rounded-full animate-spin" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 2FA DISABLE CONFIRM MODAL
// ═══════════════════════════════════════════════════════════════
const TwoFADisableModal = ({ onClose, onComplete }) => {
  // ✅ FIXED: Use useDisable2FAMutation instead of useVerify2FAMutation
  const [disable2FA, { isLoading }] = useDisable2FAMutation();
  const [code, setCode] = useState("");

  const handleDisable = async (e) => {
    e?.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length !== 6) return;
    try {
      // ✅ FIXED: Only send { token } — backend reads user ID from JWT via req.user!.id
      // No longer incorrectly calling verify2FA or sending userId in the body
      await disable2FA({ token }).unwrap();
      toast.success("Two-factor authentication disabled");
      onComplete();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Invalid code");
      setCode("");
    }
  };

  useEffect(() => { if (code.length === 6) handleDisable(); }, [code]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

        {/* Warning header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Disable 2FA</h3>
              <p className="text-red-200 text-xs">This will reduce account security</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition">
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        </div>

        <form onSubmit={handleDisable} className="px-6 py-6 space-y-5">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm text-red-700 font-semibold leading-relaxed">
              Enter your current authenticator code to confirm you want to disable two-factor authentication.
            </p>
          </div>

          <OTPInput value={code} onChange={setCode} disabled={isLoading} />

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition text-sm">
              Cancel
            </button>
            <button type="submit" disabled={code.length !== 6 || isLoading}
              className="flex-[2] h-11 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-red-200">
              {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs" />}
              {isLoading ? "Verifying…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PASSWORD CHANGE SECTION
// ═══════════════════════════════════════════════════════════════
const PasswordSection = () => {
  const { id } = useSelector(s => s.auth);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [form, setForm]       = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors]   = useState({});
  const [metRules, setMetRules] = useState({});
  const [showMeter, setShowMeter] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!form.newPassword) { setMetRules({}); setShowMeter(false); return; }
    setShowMeter(true);
    const met = {};
    RULES.forEach(r => { met[r.key] = r.test(form.newPassword); });
    setMetRules(met);
  }, [form.newPassword]);

  const metCount = Object.values(metRules).filter(Boolean).length;
  const strength = form.newPassword ? strengthLevel(metCount) : null;
  const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;

  const change = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = "Current password is required";
    if (!form.newPassword) e.newPassword = "New password is required";
    else if (metCount < 5) e.newPassword = "Password doesn't meet all requirements";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm new password";
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword)
      e.newPassword = "New password must differ from current";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }).unwrap();
      setSuccess(true);
      toast.success("Password updated successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMetRules({}); setShowMeter(false);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const msg = err?.data?.message || err?.data?.msg || "Failed to update password";
      if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("incorrect")) {
        setErrors(p => ({ ...p, currentPassword: msg }));
      } else {
        toast.error(msg);
      }
    }
  };

  const canSubmit = form.currentPassword && metCount === 5 && passwordsMatch && !isLoading;

  return (
    <SectionCard>
      <SectionHeader
        icon={faLock}
        iconBg="bg-primBtn"
        title="Change password"
        subtitle="Update your login credentials"
      />
      <div className="px-7 py-6 space-y-5">

        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 animate-in slide-in-from-top-2 duration-300">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-lg shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">Password updated successfully!</p>
              <p className="text-xs text-green-600">Your new password is now active.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordInput
            label="Current password" name="currentPassword" value={form.currentPassword}
            onChange={change} error={errors.currentPassword} autoFocus />

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400">New password</span>
            </div>
          </div>

          <PasswordInput
            label="New password" name="newPassword" value={form.newPassword}
            onChange={change} error={errors.newPassword} hint="Must meet all 5 requirements" />

          {/* Strength meter */}
          {showMeter && (
            <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Strength</span>
                  <span className={`text-[11px] font-black ${strength?.text}`}>{strength?.label}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${strength?.color} ${strength?.bar}`} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {RULES.map(r => <RuleItem key={r.key} met={!!metRules[r.key]} label={r.label} />)}
              </div>
            </div>
          )}

          <PasswordInput
            label="Confirm new password" name="confirmPassword" value={form.confirmPassword}
            onChange={change} error={errors.confirmPassword} />

          {form.confirmPassword && form.newPassword && (
            <div className={`flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200 ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
              <FontAwesomeIcon icon={passwordsMatch ? faCheckCircle : faXmarkCircle} />
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </div>
          )}

          <button type="submit" disabled={!canSubmit}
            className="w-full h-12 bg-primBtn hover:bg-Hover text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 mt-1">
            {isLoading
              ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Updating…</>
              : <><FontAwesomeIcon icon={faKey} /> Update password</>}
          </button>
        </form>
      </div>
    </SectionCard>
  );
};

// ═══════════════════════════════════════════════════════════════
// 2FA MANAGEMENT SECTION
// ═══════════════════════════════════════════════════════════════
const TwoFASection = () => {
  const { data: meRes, refetch } = useGetMeQuery();
  const me = meRes?.data ?? meRes;

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetup,    setShowSetup]    = useState(false);
  const [showDisable,  setShowDisable]  = useState(false);

  useEffect(() => {
    if (me?.twoFactorEnabled != null) setIs2FAEnabled(me.twoFactorEnabled);
  }, [me]);

  const onSetupComplete  = () => { setIs2FAEnabled(true);  refetch(); };
  const onDisableComplete = () => { setIs2FAEnabled(false); refetch(); };

  return (
    <>
      <SectionCard>
        <SectionHeader
          icon={faShieldVirus}
          iconBg={is2FAEnabled ? "bg-green-500" : "bg-slate-400"}
          title="Two-factor authentication"
          subtitle="Add a second layer of security to your sign-in"
          right={
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
              is2FAEnabled ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
              {is2FAEnabled ? "Enabled" : "Disabled"}
            </div>
          }
        />

        <div className="px-7 py-6 space-y-5">

          {/* Status explanation card */}
          <div className={`flex items-start gap-4 p-4 rounded-2xl border ${
            is2FAEnabled ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
          }`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              is2FAEnabled ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
            }`}>
              <FontAwesomeIcon icon={is2FAEnabled ? faCheckCircle : faTriangleExclamation} className="text-lg" />
            </div>
            <div>
              <p className={`text-sm font-bold ${is2FAEnabled ? "text-green-800" : "text-amber-800"}`}>
                {is2FAEnabled ? "Your account is protected" : "Your account is not fully protected"}
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${is2FAEnabled ? "text-green-700" : "text-amber-700"}`}>
                {is2FAEnabled
                  ? "Two-factor authentication is active. You'll need your authenticator app to sign in."
                  : "Enable 2FA to require a code from your phone during sign-in, adding a strong extra layer of security."}
              </p>
            </div>
          </div>

          {/* How it works — shown when disabled */}
          {!is2FAEnabled && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "1", label: "Install app",       desc: "Google Authenticator or Authy",  icon: faMobileScreen  },
                { step: "2", label: "Scan QR code",      desc: "Link your account to the app",   icon: faQrcode        },
                { step: "3", label: "Verify code",       desc: "Confirm with a 6-digit code",    icon: faKey           },
              ].map(item => (
                <div key={item.step} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <div className="w-9 h-9 bg-primBtn/10 text-primBtn rounded-xl flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon icon={item.icon} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* When enabled — show change option */}
          {is2FAEnabled && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Linked authenticator</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primBtn/10 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faMobileScreen} className="text-primBtn text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Authenticator app</p>
                  <p className="text-xs text-slate-400">TOTP — refreshes every 30 seconds</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {!is2FAEnabled ? (
              <button onClick={() => setShowSetup(true)}
                className="flex-1 h-12 bg-primBtn hover:bg-Hover text-white font-bold rounded-2xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5">
                <FontAwesomeIcon icon={faShieldVirus} /> Enable two-factor authentication
              </button>
            ) : (
              <>
                <button onClick={() => setShowSetup(true)}
                  className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 hover:border-primBtn hover:text-primBtn font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm">
                  <FontAwesomeIcon icon={faRotateRight} className="text-xs" /> Change authenticator
                </button>
                <button onClick={() => setShowDisable(true)}
                  className="flex-1 h-11 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm">
                  <FontAwesomeIcon icon={faToggleOff} className="text-xs" /> Disable 2FA
                </button>
              </>
            )}
          </div>

        </div>
      </SectionCard>

      {showSetup   && <TwoFASetupModal   onClose={() => setShowSetup(false)}   onComplete={onSetupComplete}   />}
      {showDisable && <TwoFADisableModal onClose={() => setShowDisable(false)} onComplete={onDisableComplete} />}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAGE ROOT
// ═══════════════════════════════════════════════════════════════
const PasswordChangePage = () => (
  <div className="min-h-screen bg-[#F8FAFC]">
    <ToastContainer position="top-center" theme="light" />
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your password and two-factor authentication</p>
      </div>

      {/* Password section */}
      <PasswordSection />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-[#F8FAFC] text-xs font-bold uppercase tracking-widest text-slate-400">
            Two-factor authentication
          </span>
        </div>
      </div>

      {/* 2FA section */}
      <TwoFASection />

    </div>
  </div>
);

export default PasswordChangePage;