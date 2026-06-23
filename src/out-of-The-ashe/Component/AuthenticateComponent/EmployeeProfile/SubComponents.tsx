import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faCircle } from "@fortawesome/free-solid-svg-icons";

// Check item with dynamic status icons
export const CheckItem = ({ isMet, text }: { isMet: boolean; text: string }) => (
  <div className={`flex items-center gap-2 font-medium transition-colors ${isMet ? "text-emerald-600" : "text-slate-400"}`}>
    <FontAwesomeIcon icon={isMet ? faCheckCircle : faCircle} className={isMet ? "text-xs" : "text-[6px] opacity-60"} />
    <span>{text}</span>
  </div>
);

// Single profile info property cell
export const InfoCard = ({ icon, label, value, accent = false }: any) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-3 p-5 bg-slate-50/50 rounded-[1.75rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${accent ? "bg-primBtn text-white" : "bg-white text-primBtn"}`}>
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className={`font-bold break-words leading-relaxed text-sm ${accent ? "text-primBtn" : "text-slate-700"}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

// Permission indicator pill
export const PermPill = ({ label, granted }: { label: string; granted: boolean }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black transition-all ${
    granted
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-400 border-slate-200"
  }`}>
    <FontAwesomeIcon icon={granted ? faCheckCircle : faCircle} className={granted ? "text-emerald-500 text-[9px]" : "text-[6px] opacity-40"} />
    {label}
  </div>
);