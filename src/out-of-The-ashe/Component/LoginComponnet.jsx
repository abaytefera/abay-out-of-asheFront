import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck, faEye, faEyeSlash,
  faSpinner, faCircleExclamation, faShieldHalved,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LoginUser, Verify2FA, clearError, logout } from "../Redux/auth";


// ─── Redirect overlay (unchanged visuals) ─────────────────────────────────────
const RedirectOverlay = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [popped,   setPopped]   = useState(false);
  const [swept,    setSwept]    = useState(false);
  const [visible,  setVisible]  = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    setBarWidth(60);
    const t1 = setTimeout(() => {
      setBarWidth(85); setSwept(true);
      const t2 = setTimeout(() => {
        setBarWidth(100); setVisible(true);
        const t3 = setTimeout(() => {
          setPopped(true);
          const dur = 2200; const start = performance.now();
          const tick = (now) => {
            const pct = Math.min(Math.round(((now - start) / dur) * 100), 100);
            setProgress(pct);
            if (pct < 100) requestAnimationFrame(tick); else onDone();
          };
          requestAnimationFrame(tick);
        }, 300);
        return () => clearTimeout(t3);
      }, 420);
      return () => clearTimeout(t2);
    }, 600);
    return () => clearTimeout(t1);
  }, [onDone]);

  return (
    <>
      <div style={{ position:"fixed", top:0, left:0, height:"3px", width:`${barWidth}%`, background:"#9325ae", zIndex:9999, transition: barWidth===60?"width 0.6s ease":barWidth===85?"width 0.2s ease":"width 0.15s ease" }} />
      <div style={{ position:"fixed", inset:0, background:"#EAF3DE", zIndex:9997, transform:swept?"scaleX(1)":"scaleX(0)", transformOrigin:"left", transition:"transform 0.45s cubic-bezier(0.4,0,0.2,1)" }} />
      <div style={{ position:"fixed", inset:0, background:"white", zIndex:9998, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", opacity:visible?1:0, transition:"opacity 0.35s ease" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"#EAF3DE", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.5rem", transform:popped?"scale(1)":"scale(0)", transition:"transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <FontAwesomeIcon icon={faCheck} style={{ fontSize:"2rem", color:"#921c80" }} />
        </div>
        <h2 style={{ fontSize:"1.25rem", fontWeight:600, color:"#111827", marginBottom:"0.5rem", opacity:popped?1:0, transform:popped?"translateY(0)":"translateY(10px)", transition:"opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s" }}>Login successful</h2>
        <p style={{ fontSize:"0.875rem", color:"#c209aa", marginBottom:"2rem", opacity:popped?1:0, transition:"opacity 0.3s ease 0.35s" }}>Taking you to your dashboard...</p>
        <div style={{ width:240, height:3, background:"#E5E7EB", borderRadius:4, overflow:"hidden", opacity:popped?1:0, transition:"opacity 0.2s ease 0.45s" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"#811646", borderRadius:4, transition:"none" }} />
        </div>
        <p style={{ fontSize:"0.75rem", color:"#9CA3AF", marginTop:"0.6rem", opacity:popped?1:0, transition:"opacity 0.2s ease 0.45s" }}>{progress}%</p>
      </div>
    </>
  );
};

// ─── OTP Input — 6 individual digit boxes ─────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const boxes = Array(6).fill("");
  const digits = value.padEnd(6, "").split("");

  const handleKey = (e, idx) => {
    const el = e.currentTarget;
    if (e.key === "Backspace") {
      const next = value.slice(0, idx) + value.slice(idx + 1);
      onChange(next);
      if (idx > 0) {
        const prev = el.parentElement?.children[idx - 1];
        prev?.focus();
      }
    } else if (/^\d$/.test(e.key)) {
      const next = value.slice(0, idx) + e.key + value.slice(idx + 1);
      onChange(next.slice(0, 6));
      if (idx < 5) {
        const nextEl = el.parentElement?.children[idx + 1];
        nextEl?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {boxes.map((_, idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] === " " ? "" : digits[idx]}
          readOnly
          onKeyDown={(e) => handleKey(e, idx)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2
                     border-slate-200 bg-slate-50 focus:border-primBtn focus:bg-white
                     outline-none transition-all caret-transparent"
        />
      ))}
    </div>
  );
};

// ─── Main Login Component ──────────────────────────────────────────────────────
const LoginComponent = () => {
  const [formData, setFormData]         = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidation] = useState("");
  const [showRedirect, setShowRedirect] = useState(false);
  const [otpValue, setOtpValue]         = useState("");
  const [otpError, setOtpError]         = useState("");

  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const {
    isAuthenticate,
    isloading,
    error,
    requiresTwoFactor,
    pendingUserId,
    user,
  } = useSelector((s) => s.auth);

  // Clear server error when user types
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationError) setValidation("");
    if (error) dispatch(clearError());
  };

  // ── Step 1: email + password submit ────────────────────────────────────────
  const onLogin = (e) => {
    e.preventDefault();
    if (!formData.email)    return setValidation("Please enter your email");
    if (!formData.password) return setValidation("Please enter your password");
    dispatch(LoginUser(formData));
  };

  // ── Step 2: OTP submit ─────────────────────────────────────────────────────
  const onVerify2FA = async (e) => {
    e.preventDefault();
    if (otpValue.length < 6) return setOtpError("Enter all 6 digits");
    if (!pendingUserId) return;
    setOtpError("");
    dispatch(Verify2FA({ userId: pendingUserId, token: otpValue }));
  };

  // Trigger redirect overlay once authenticated
  useEffect(() => {
    if (isAuthenticate) setShowRedirect(true);
  }, [isAuthenticate]);

  const handleRedirectDone = useCallback(() => navigate("/DashboardPage"), [navigate]);

  // ── Error display: prefer validationError, then server error ───────────────
  const displayError = validationError || error;

  return (
    <>
      {showRedirect && <RedirectOverlay onDone={handleRedirectDone} />}

      <div className="flex justify-center items-center py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">

          {/* ── Header ── */}
          <div className="text-center mb-10">
            {requiresTwoFactor ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-primBtn text-2xl" />
                </div>
                <h1 className="text-2xl font-bold text-primBtn">Two-Factor Authentication</h1>
                <p className="text-slate-500 mt-2 text-sm">
                  Open your authenticator app and enter the 6-digit code
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-primBtn">Welcome Back</h1>
                <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
              </>
            )}
          </div>

          {/* ── Status Banner ── */}
          <div className="mb-6 min-h-[3rem]">
            {isloading && (
              <div className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl animate-pulse">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                <span className="font-medium">
                  {requiresTwoFactor ? "Verifying code…" : "Authenticating…"}
                </span>
              </div>
            )}

            {(displayError || otpError) && !isloading && (
              <div className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-3 rounded-xl border border-red-100">
                <FontAwesomeIcon icon={faCircleExclamation} />
                <span className="text-sm font-semibold">{otpError || displayError}</span>
              </div>
            )}

            {isAuthenticate && !showRedirect && (
              <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-xl border border-green-100">
                <FontAwesomeIcon icon={faCheck} />
                <span className="font-bold">Login Successful! Redirecting…</span>
              </div>
            )}
          </div>

          {/* ════════════════ FORM: Password Login ════════════════ */}
          {!requiresTwoFactor && (
            <form onSubmit={onLogin} className="space-y-5">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-sm ml-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                             outline-none focus:ring-2 focus:ring-primBtn focus:bg-white transition-all"
                />
              </div>

              <div className="relative">
                <label className="block text-slate-700 font-bold mb-1 text-sm ml-1">
                  Password
                </label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                             outline-none focus:ring-2 focus:ring-primBtn focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>

              <button
                type="submit"
                disabled={isloading}
                className="w-full py-3.5 bg-primBtn text-white rounded-xl font-bold text-lg
                           shadow-lg shadow-blue-200 hover:bg-Hover hover:-translate-y-0.5
                           transition-all active:scale-95
                           disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0"
              >
                {isloading ? "Checking…" : "Sign In"}
              </button>
            </form>
          )}

          {/* ════════════════ FORM: 2FA OTP ════════════════ */}
          {requiresTwoFactor && (
            <form onSubmit={onVerify2FA} className="space-y-6">
              <div>
                <p className="text-center text-sm text-slate-500 mb-4">
                  Enter the 6-digit code from your authenticator app
                </p>
                <OtpInput value={otpValue} onChange={setOtpValue} />
              </div>

              <button
                type="submit"
                disabled={isloading || otpValue.length < 6}
                className="w-full py-3.5 bg-primBtn text-white rounded-xl font-bold text-lg
                           shadow-lg shadow-purple-200 hover:bg-Hover hover:-translate-y-0.5
                           transition-all active:scale-95
                           disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0"
              >
                {isloading ? (
                  <span className="flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Verifying…
                  </span>
                ) : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  dispatch(logout())
                }}
                className="w-full flex items-center justify-center gap-2 text-slate-400
                           hover:text-primBtn text-sm font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} size="xs" /> Back to login
              </button>
            </form>
          )}

          {/* ── Greeting when authenticated (brief flash before redirect) ── */}
          {isAuthenticate && user && (
            <p className="text-center text-sm text-slate-400 mt-6">
              Signed in as <span className="font-semibold text-slate-600">{user.firstName} {user.lastName}</span>
              {" "}·{" "}
              <span className="text-primBtn font-medium">{user.role.replace(/_/g, " ")}</span>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginComponent;