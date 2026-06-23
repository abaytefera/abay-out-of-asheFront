import React, { useState } from "react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl transform animate-in zoom-in-95 duration-300">
        <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Account?</h3>
        <p className="text-slate-500 mb-6 leading-relaxed">
          This action is irreversible. It will permanently remove <span className="font-bold text-slate-800">{itemName}</span> from the system.
        </p>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Type <span className="text-red-500 select-all font-bold">{itemName}</span> to confirm
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Match name exactly"
            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-400 focus:outline-none transition-all font-bold text-slate-700"
          />
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => { setInputValue(""); onClose(); }}
            className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            disabled={inputValue !== itemName || isDeleting}
            onClick={onConfirm}
            className={`flex-[2] py-4 rounded-2xl font-bold text-white transition-all shadow-lg
              ${inputValue === itemName 
                ? "bg-red-500 hover:bg-red-600 shadow-red-200" 
                : "bg-slate-300 cursor-not-allowed shadow-none"}`}
          >
            {isDeleting ? "Processing..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;