// ============================================================
// pages/ManageSchools.jsx
// Full school registration + listing + edit + delete page
// ============================================================
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSchool, faPlus, faSearch, faTimes, faPen,
  faTrash, faCheckCircle, faFilter, faSpinner,
  faBuilding, faUniversity, faXmark,
} from "@fortawesome/free-solid-svg-icons";

import {
  useGetSchoolsQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
} from "../Redux/Schools";
import DashbordNav from "../Component/AuthenticateComponent/DashboardComponent/DashbordNav";


// ── Shared style tokens ────────────────────────────────────
const inputCls =
  "h-11 px-4 rounded-xl bg-white border border-slate-200 focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition-all text-slate-800 text-sm placeholder:text-slate-300 shadow-sm w-full";
const selectCls = inputCls + " cursor-pointer appearance-none";

// ── Type badge ─────────────────────────────────────────────
const TypeBadge = ({ type }) =>
  type === "PRIVATE" ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold tracking-wide">
      <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
      Private
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold tracking-wide">
      <FontAwesomeIcon icon={faUniversity} className="text-[10px]" />
      Government
    </span>
  );

// ── Modal ──────────────────────────────────────────────────
const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
};

// ── Confirm Dialog ─────────────────────────────────────────
const ConfirmDelete = ({ school, onConfirm, onCancel, isLoading }) => (
  <Modal open onClose={onCancel}>
    <div className="bg-rose-500 px-6 py-5">
      <p className="text-white font-black text-lg">Delete School?</p>
      <p className="text-white/70 text-xs mt-1">This action cannot be undone.</p>
    </div>
    <div className="p-6 space-y-4">
      <p className="text-slate-700 text-sm">
        Are you sure you want to delete{" "}
        <span className="font-bold text-slate-900">"{school.name}"</span>?
        Students linked to this school will retain their records.
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 h-11 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <>
              <FontAwesomeIcon icon={faTrash} /> Delete
            </>
          )}
        </button>
      </div>
    </div>
  </Modal>
);

// ── School Form (Create / Edit) ────────────────────────────
const SchoolForm = ({ editTarget, onClose }) => {
  const isEdit = !!editTarget;
  const [createSchool, { isLoading: creating }] = useCreateSchoolMutation();
  const [updateSchool, { isLoading: updating }] = useUpdateSchoolMutation();
  const isLoading = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: editTarget
      ? { name: editTarget.name, type: editTarget.type }
      : { type: "GOVERMENT" },
  });

  useEffect(() => {
    if (editTarget) reset({ name: editTarget.name, type: editTarget.type });
    else reset({ name: "", type: "GOVERMENT" });
  }, [editTarget, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit && editTarget) {
        await updateSchool({ id: editTarget.id, ...data }).unwrap();
        toast.success("School updated successfully!");
      } else {
        await createSchool(data).unwrap();
        toast.success("School registered successfully!");
      }
      onClose();
    } catch (err) {
      const msg = err?.data?.message || "Something went wrong.";
      toast.error(msg);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <div className="bg-primBtn px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-white font-black text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faSchool} />
            {isEdit ? "Edit School" : "Register New School"}
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            {isEdit ? "Update school details" : "Add a school to the system"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold tracking-widest uppercase text-slate-500">
            School Name <span className="text-rose-400">*</span>
          </label>
          <input
            {...register("name", {
              required: "School name is required.",
              minLength: { value: 2, message: "Name too short." },
              maxLength: { value: 100, message: "Max 100 characters." },
            })}
            className={inputCls}
            placeholder="e.g. Bole Primary School"
          />
          {errors.name && (
            <span className="text-rose-500 text-xs font-medium">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold tracking-widest uppercase text-slate-500">
            School Type <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["GOVERMENT", "PRIVATE"].map((t) => (
              <label
                key={t}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all has-[:checked]:border-primBtn has-[:checked]:bg-primBtn/5"
              >
                <input
                  type="radio"
                  {...register("type", { required: true })}
                  value={t}
                  className="hidden"
                />
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all has-checked:border-primBtn"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-primBtn opacity-0 group-has-[:checked]:opacity-100" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-700">
                    {t === "GOVERMENT" ? "Government" : "Private"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t === "GOVERMENT" ? "Public / state-funded" : "Independent / fee-paying"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 rounded-2xl bg-primBtn text-white font-bold text-sm hover:bg-Hover disabled:opacity-60 transition-all shadow-lg shadow-primBtn/25 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <>
                <FontAwesomeIcon icon={isEdit ? faCheckCircle : faPlus} />
                {isEdit ? "Save Changes" : "Register School"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const ManageSchools = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [debouncedSearch, setDebounced] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [deleteSchool, { isLoading: deleting }] = useDeleteSchoolMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: schools = [], isLoading, isFetching } = useGetSchoolsQuery({
    search: debouncedSearch || undefined,
    type: typeFilter,
  });

  const openCreate = () => { setEditTarget(null); setShowForm(true); };
  const openEdit = (s) => { setEditTarget(s); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchool(deleteTarget.id).unwrap();
      toast.success("School deleted.");
      setDeleteTarget(null);
    } catch (err) {
      const msg = err?.data?.message || "Delete failed.";
      toast.error(msg);
    }
  };

  const isFiltered = debouncedSearch !== "" || typeFilter !== "ALL";

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <ToastContainer position="top-right" theme="colored" />
      <DashbordNav></DashbordNav>

      <div className="flex  mt-30 items-center justify-between mb-8">
        <div className="flex items-start gap-3">
          <span className="w-1 h-12 rounded-full bg-primBtn shrink-0 mt-0.5" />
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Schools
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage registered schools used across the program
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="bg-primBtn hover:bg-Hover text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primBtn/25 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add School
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="relative sm:col-span-2">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-3.5 text-slate-400 text-sm"
            />
            <input
              type="text"
              placeholder="Search school name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition-all text-slate-800 text-sm placeholder:text-slate-300 shadow-sm w-full"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

          <div className="relative">
            <FontAwesomeIcon
              icon={faFilter}
              className="absolute left-3.5 top-3.5 text-slate-400 text-sm pointer-events-none"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={selectCls + " pl-10"}
            >
              <option value="ALL">All Types</option>
              <option value="GOVERMENT">Government</option>
              <option value="PRIVATE">Private</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-3.5 text-slate-400 text-xs">
              ▼
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {isFetching ? (
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faSpinner} spin className="text-primBtn" />
                Loading…
              </span>
            ) : (
              <span>
                <span className="font-bold text-slate-700">{schools.length}</span>{" "}
                school{schools.length !== 1 ? "s" : ""}{" "}
                {isFiltered ? "match your filters" : "registered"}
              </span>
            )}
          </span>
          {isFiltered && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("ALL"); }}
              className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faTimes} /> Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-primBtn text-2xl" />
            <p className="text-sm">Loading schools…</p>
          </div>
        ) : schools.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl text-slate-300">
              <FontAwesomeIcon icon={faSchool} />
            </div>
            <p className="font-bold text-slate-500 text-sm">
              {isFiltered ? "No schools match your filters." : "No schools registered yet."}
            </p>
            {!isFiltered && (
              <button
                onClick={openCreate}
                className="mt-2 bg-primBtn text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-Hover transition-colors"
              >
                Add the first school
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-4 text-xs font-black tracking-widest uppercase text-slate-400">
                  #
                </th>
                <th className="text-left px-6 py-4 text-xs font-black tracking-widest uppercase text-slate-400">
                  School Name
                </th>
                <th className="text-left px-6 py-4 text-xs font-black tracking-widest uppercase text-slate-400">
                  Type
                </th>
                <th className="text-right px-6 py-4 text-xs font-black tracking-widest uppercase text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schools.map((school, idx) => (
                <tr
                  key={school.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                          school.type === "PRIVATE"
                            ? "bg-violet-100 text-violet-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={school.type === "PRIVATE" ? faBuilding : faUniversity}
                        />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {school.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={school.type} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(school)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-primBtn/10 hover:text-primBtn text-slate-500 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(school)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-500 text-slate-500 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <SchoolForm editTarget={editTarget} onClose={closeForm} />
      )}

      {deleteTarget && (
        <ConfirmDelete
          school={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleting}
        />
      )}
    </div>
  );
};

export default ManageSchools;