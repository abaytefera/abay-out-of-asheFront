import { useEffect, useState } from "react";
import { useUpdatePermissionsMutation, useGetPermissionsQuery } from "../../Redux/Employee";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUnlockKeyhole } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { data } from "react-router-dom";

// IMPORTANT: Double-check your database! 
// These keys must match the exact names of columns/fields coming from your database.
const PERMISSION_FIELDS = [
  { key: "childRegister",    label: "Register Child",    group: "child" },
  { key: "childUpdate",      label: "Update Child",      group: "child" },
  { key: "childDelete",      label: "Delete Child",      group: "child" },
  { key: "employeeRegister", label: "Register Employee", group: "employee" },
  { key: "employeeUpdate",   label: "Update Employee",   group: "employee" },
  { key: "employeeDelete",   label: "Delete Employee",   group: "employee" },
];

export const PermissionsModal = ({ empId, empName, onClose }) => {
  const { data: currentPerms, isLoading } = useGetPermissionsQuery(empId);
  const [updatePermissions, { isLoading: isSaving }] = useUpdatePermissionsMutation();
  const [perms, setPerms] = useState(null);

  useEffect(() => {
    if (currentPerms) {
      // 1. If your DB sends data wrapped inside an object like { status: 200, data: { childRegister: true } }
      // change this line to: setPerms({ ...currentPerms.data });
      
      // 2. If your DB sends data wrapped inside a permissions object like { permissions: { childRegister: true } }
      // change this line to: setPerms({ ...currentPerms.permissions });

      setPerms({ ...currentPerms.data });
    }
   
  }, [currentPerms]);

  const toggle = (key) => {
    setPerms((prev) => ({
      ...prev,
      [key]: !Boolean(prev?.[key]), // Safely flips the value
    }));
  };

  const handleSave = async () => {
    try {
      await toast.promise(
        updatePermissions({ id: empId, ...perms }).unwrap(),
        {
          pending: "Saving permissions...",
          success: "Permissions updated! ✅",
          error: {
            render({ data: err }) {
              return err?.data?.msg || "Failed to update.";
            },
          },
        }
      );
      onClose();
    } catch (error) {
      console.error("Failed to save permissions:", error);
    }
  };

  const childPerms = PERMISSION_FIELDS.filter((f) => f.group === "child");
  const employeePerms = PERMISSION_FIELDS.filter((f) => f.group === "employee");

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-primBtn flex items-center justify-center">
              <FontAwesomeIcon icon={faUnlockKeyhole} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">Manage Permissions</h3>
              <p className="text-[10px] text-slate-400 font-bold capitalize">{empName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {isLoading || !perms ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Child Permissions */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Child Actions</p>
              <div className="space-y-2">
                {childPerms.map(({ key, label }) => (
                  <PermToggle 
                    key={key} 
                    label={label} 
                    // This forces checking truthy values from database (handles boolean, "true", 1)
                    value={Boolean(perms?.[key]) == true} 
                    onToggle={() => toggle(key)} 
                  />
                ))}
              </div>
            </div>

            {/* Employee Permissions */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Employee Actions</p>
              <div className="space-y-2">
                {employeePerms.map(({ key, label }) => (
                  <PermToggle 
                    key={key} 
                    label={label} 
                    // This forces checking truthy values from database (handles boolean, "true", 1)
                    value={Boolean(perms?.[key]) == true} 
                    onToggle={() => toggle(key)} 
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button 
                onClick={onClose} 
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-primBtn text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-100 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PermToggle = ({ label, value, onToggle }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className={`text-sm font-bold transition-colors ${value ? "text-slate-700" : "text-slate-400"}`}>
      {label}
    </span>
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${value ? "bg-primBtn" : "bg-slate-200"}`}
    >
      {/* Visual background handles active status */}
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  </div>
);