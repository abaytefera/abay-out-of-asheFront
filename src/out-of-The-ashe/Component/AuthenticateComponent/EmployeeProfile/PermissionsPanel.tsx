import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { PermPill } from "./SubComponents";

interface PermissionsPanelProps {
  perm: any;
  isCD: boolean;
  permissionGroups: any[];
  setIsPermModalOpen: (open: boolean) => void;
}

export const PermissionsPanel = ({ perm, isCD, permissionGroups, setIsPermModalOpen }: PermissionsPanelProps) => {
  if (!perm && !isCD) return null;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-7 md:p-9 border border-slate-100 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primBtn/10 text-primBtn flex items-center justify-center text-sm">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 tracking-tight">Access Permissions</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {perm ? "Assigned via Permission model" : "No permissions assigned yet"}
            </p>
          </div>
        </div>
        {isCD && (
          <button onClick={() => setIsPermModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primBtn/10 hover:bg-primBtn text-primBtn hover:text-white rounded-xl text-xs font-bold transition-all">
            <FontAwesomeIcon icon={faPenToSquare} className="text-[10px]" />
            Edit
          </button>
        )}
      </div>

      {perm ? (
        <div className="space-y-5">
          {permissionGroups.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${group.color}`}>
                  <FontAwesomeIcon icon={group.icon} />
                </div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-wider">{group.label}</p>
              </div>
              <div className="flex flex-wrap gap-2 ml-9">
                {group.keys.map(({ key, label }: any) => (
                  <PermPill key={key} label={label} granted={!!perm[key]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <FontAwesomeIcon icon={faShieldHalved} className="text-slate-300 text-2xl mb-2" />
          <p className="text-sm font-bold text-slate-500">No permissions assigned</p>
          <p className="text-xs text-slate-400 mt-0.5">This role inherits default access only.</p>
        </div>
      )}
    </div>
  );
};