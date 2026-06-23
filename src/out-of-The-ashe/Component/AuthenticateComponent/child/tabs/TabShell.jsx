import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

/**
 * TabShell — common wrapper for all module tabs.
 * Props:
 * title       string
 * icon        FontAwesome icon
 * actions     array of { label, icon, onClick }
 * children    tab body
 * warning     optional string shown as an amber alert banner
 */
export const TabShell = ({ title, icon, actions = [], children, warning }) => (
  <div className="p-4 sm:p-6 md:p-8 space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        {icon && <FontAwesomeIcon icon={icon} className="text-primBtn" />}
        {title}
      </h3>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action, i) => (
            <button
              key={action.label || i}
              onClick={action.onClick}
              className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:border-primBtn hover:text-primBtn transition-all active:scale-95"
            >
              <FontAwesomeIcon icon={action.icon || faPlus} className="text-[10px]" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Optional warning banner */}
    {warning && (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-sm font-medium animate-fade-in">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5 text-amber-500 shrink-0" />
        <div>{warning}</div>
      </div>
    )}

    <div className="w-full">{children}</div>
  </div>
);

/**
 * RecordRow — single list row for any module.
 * Props:
 * icon        FontAwesome icon
 * iconColor   tailwind bg class, e.g. "bg-blue-50 text-blue-600"
 * title       string
 * subtitle    string
 * meta        array of { label?, value, badge?, badgeColor? }
 * actions     array of { icon, onClick, title }
 */
export const RecordRow = ({ icon, iconColor = "bg-blue-50 text-primBtn", title, subtitle, meta = [], actions = [] }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
    
    {/* Left Identity Section: Icon + Text */}
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {/* Icon */}
      {icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
      )}

      {/* Main text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 line-clamp-2 sm:truncate">{subtitle}</p>}
      </div>
    </div>

    {/* Right Meta and Actions Section */}
    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60">
      
      {/* Meta chips (💡 ፊክስ፡ በሞባይል ላይ እንዳይደበቅ ወደ ተለዋዋጭ flex ተቀይሯል) */}
      {meta.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {meta.map((m, i) =>
            m?.badge ? (
              <span key={i} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${m.badgeColor || "bg-slate-100 text-slate-600"}`}>
                {m.value}
              </span>
            ) : (
              <span key={i} className="text-xs text-slate-500 whitespace-nowrap">
                {m?.label && <span className="text-slate-400 mr-1">{m.label}</span>}
                {m?.value}
              </span>
            )
          )}
        </div>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex items-center gap-1.5">
          {actions.map((a, i) => (
            a?.icon && (
              <button
                key={a.title || i}
                title={a.title}
                onClick={a.onClick}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:text-primBtn hover:border-primBtn transition-all active:scale-90"
              >
                <FontAwesomeIcon icon={a.icon} className="text-xs" />
              </button>
            )
          ))}
        </div>
      )}
      
    </div>
  </div>
);

/**
 * EmptyState — shown when a tab has no records yet.
 */
export const EmptyState = ({ icon, message = "No records yet" }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
    {icon && <FontAwesomeIcon icon={icon} className="text-4xl text-slate-200" />}
    <p className="text-sm font-medium text-slate-400">{message}</p>
  </div>
);

/**
 * SubSection — light heading separator inside a tab panel.
 */
export const SubSection = ({ title }) => (
  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 mb-2">{title}</p>
);