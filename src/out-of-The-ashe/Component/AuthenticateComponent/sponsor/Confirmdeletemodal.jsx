import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faSpinner } from "@fortawesome/free-solid-svg-icons";

/**
 * Generic confirmation modal for destructive actions.
 *
 * Usage:
 *   const [pending, setPending] = useState(null); // holds the record to delete
 *   <ConfirmDeleteModal
 *     open={!!pending}
 *     title="Delete sponsor"
 *     message={`Delete ${pending?.firstName} ${pending?.lastName}? This cannot be undone.`}
 *     loading={deleting}
 *     onConfirm={handleConfirmedDelete}
 *     onClose={() => setPending(null)}
 *   />
 */
const ConfirmDeleteModal = ({
  open,
  title = "Delete item",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-rose-500 text-lg" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;