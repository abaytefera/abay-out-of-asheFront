import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle, faUpload, faChild, faUserFriends,
  faArrowRight, faArrowLeft, faCheckCircle, faCamera,
  faHome, faShieldAlt, faHospital,
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";

import { useGetSchoolsDropdownQuery } from "../../../Redux/Schools";
import { useCreateChildMutation } from "../../../Redux/Childes";
const STEPS = [
  { id: 1, label: "Child Info",     icon: faChild },
  { id: 2, label: "Household",      icon: faHome },
  { id: 3, label: "Guardian",       icon: faUserFriends },
  { id: 4, label: "Health & Notes", icon: faHospital },
];

const GENDER_OPTIONS      = ["MALE", "FEMALE"];
const HOUSING_OPTIONS     = ["OWNED", "RENTED", "INFORMAL", "HOMELESS"];
const WATER_OPTIONS       = ["PIPED", "WELL", "RIVER", "COMMUNAL_TAP", "NONE"];
const SANITATION_OPTIONS  = ["PRIVATE_TOILET", "SHARED_TOILET", "OPEN_DEFECATION", "NONE"];
const MARITAL_OPTIONS     = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED"];
const INCOME_OPTIONS      = ["NONE", "BELOW_500", "RANGE_500_1000", "RANGE_1001_3000", "ABOVE_3000"];
const RELIGION_OPTIONS    = ["Christianity", "Islam", "Other", "Prefer not to say"];
const NATIONALITY_OPTIONS = ["Ethiopian", "Other"];

const getStepFields = (noGuardian) => ({
  1: ["firstName", "lastName", "dateOfBirth", "gender", "admissionDate"],
  2: ["householdCode", "housingCondition", "waterAccess", "sanitationAccess"],
  3: noGuardian ? [] : ["guardianFirstName", "guardianLastName", "relationship", "guardianPhone", "maritalStatus", "incomeRange"],
  4: [],
});

// ── Shared styles (primBtn focus rings everywhere) ────────────────────────────
const inputCls    = "h-11 px-4 rounded-xl bg-white border border-slate-200 focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none transition-all text-slate-800 text-sm placeholder:text-slate-300 shadow-sm";
const selectCls   = inputCls + " cursor-pointer appearance-none";
const textareaCls = "w-full p-4 rounded-xl bg-white border border-slate-200 focus:border-primBtn focus:ring-2 focus:ring-primBtn/20 outline-none resize-none transition-all text-slate-800 text-sm placeholder:text-slate-300 shadow-sm";

const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold tracking-widest uppercase text-slate-500 ml-0.5">
      {label}{required && <span className="text-rose-400 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <span className="text-rose-500 text-xs font-medium flex items-center gap-1">
        <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
        {error}
      </span>
    )}
  </div>
);

const SelectField = ({ label, id, required, register: reg, errors, options, rules }) => (
  <Field label={label} error={errors[id]?.message} required={required}>
    <div className="relative">
      <select {...reg(id, rules)} className={selectCls}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
    </div>
  </Field>
);

// ── Stepper — active = primBtn, done = primBtn/10 ─────────────────────────────
const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-0 mb-10">
    {STEPS.map((s, i) => (
      <div key={s.id} className="flex items-center">
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all duration-500 ${
          s.id === currentStep
            ? "bg-primBtn text-white shadow-lg shadow-primBtn/30"
            : s.id < currentStep
            ? "bg-primBtn/10 text-primBtn"
            : "bg-slate-100 text-slate-400"
        }`}>
          <FontAwesomeIcon icon={s.id < currentStep ? faCheckCircle : s.icon} className="text-[11px]" />
          <span className="hidden sm:inline">{s.label}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`w-6 h-0.5 mx-1 rounded-full transition-all duration-500 ${
            currentStep > s.id ? "bg-primBtn/40" : "bg-slate-200"
          }`} />
        )}
      </div>
    ))}
  </div>
);

// ── Photo uploader — primBtn accent ───────────────────────────────────────────
const PhotoUploader = ({ label, files, setFiles, accept = "image/*", icon = faCamera }) => {
  const [temp, setTemp] = useState([]);
  const ref = useRef();

  const add    = () => { setFiles(f => [...f, ...temp]); setTemp([]); };
  const remove = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  return (
    <div className="bg-primBtn/5 rounded-2xl border-2 border-dashed border-primBtn/20 hover:border-primBtn/50 transition-colors p-6">
      <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => ref.current?.click()}>
        <div className="w-12 h-12 bg-white shadow-md rounded-2xl flex items-center justify-center text-primBtn">
          <FontAwesomeIcon icon={icon} />
        </div>
        <p className="font-bold text-slate-600 text-sm">{label}</p>
        <p className="text-xs text-slate-400">Click to browse</p>
      </div>
      <input ref={ref} type="file" className="hidden" multiple onChange={e => setTemp(Array.from(e.target.files))} accept={accept} />

      {temp.length > 0 && (
        <div className="flex gap-3 mt-4 justify-center">
          <button type="button" onClick={add}
            className="bg-primBtn text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-Hover transition-colors">
            Add {temp.length} file{temp.length > 1 ? "s" : ""}
          </button>
          <button type="button" onClick={() => setTemp([])}
            className="bg-slate-200 text-slate-600 px-5 py-2 rounded-xl text-xs font-bold">
            Clear
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {files.map((file, idx) => (
            <div key={idx} className="relative group">
              <img src={URL.createObjectURL(file)} className="w-20 h-20 rounded-xl object-cover ring-2 ring-primBtn/30 shadow-md" alt="preview" />
              <button type="button" onClick={() => remove(idx)}
                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow">
                <FontAwesomeIcon icon={faTimesCircle} className="text-[9px]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Section header — primBtn left bar ─────────────────────────────────────────
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6 flex items-start gap-3">
    <span className="w-1 h-10 rounded-full bg-primBtn shrink-0 mt-0.5" />
    <div>
      <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// =============================================================================
const RegisterChild = () => {
  const [step, setStep]                   = useState(1);
  const [childFiles, setChildFiles]       = useState([]);
  const [guardianFiles, setGuardianFiles] = useState([]);
  const [noGuardian, setNoGuardian]       = useState(false);

  const [createChild, { isLoading }] = useCreateChildMutation();
  const { register, handleSubmit, reset, trigger, formState: { errors } } = useForm();
const { data: schoolOptions = [], isLoading: schoolsLoading } = useGetSchoolsDropdownQuery();
  const goNext = async () => {
    const fields = getStepFields(noGuardian)[step];
    const valid  = await trigger(fields);
    if (!valid) return;
    if (step === 1 && childFiles.length === 0) { toast.warning("Please upload at least one child photo."); return; }
    setStep(s => s + 1);
  };

  const onFormSubmit = async (data) => {
    const payload = {
      child: {
        firstName: data.firstName, lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        gender: data.gender,
        admissionDate: new Date(data.admissionDate).toISOString(),
        nationality: data.nationality || null, religion: data.religion || null,
        subCity: data.subCity || null, kebele: data.kebele || null,
        schoolName: data.schoolName || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        notes: data.childNotes || null,
      },
      household: {
        householdCode: data.householdCode,
        address: data.address || null, subCity: data.subCity || null, kebele: data.kebele || null,
        housingCondition: data.housingCondition || null, waterAccess: data.waterAccess || null,
        sanitationAccess: data.sanitationAccess || null,
        numberOfMembers: data.numberOfMembers ? Number(data.numberOfMembers) : null,
        hasDisabledMember: data.hasDisabledMember === "true",
        incomeSource: data.incomeSource || null,
        incomeAmount: data.incomeAmount ? Number(data.incomeAmount) : null,
        incomeFrequency: data.incomeFrequency || null,
      },
      guardian: noGuardian ? null : {
        firstName: data.guardianFirstName, lastName: data.guardianLastName,
        relationship: data.relationship, phone: data.guardianPhone || null,
        email: data.guardianEmail || null, occupation: data.occupation || null,
        educationLevel: data.educationLevel || null,
        maritalStatus: data.maritalStatus || null, incomeRange: data.incomeRange || null,
        isEmergencyContact: data.isEmergencyContact === "true",
      },
    };

    const formData = new FormData();
    formData.append("Data", JSON.stringify(payload));
    childFiles.forEach(f => formData.append("childPhotos", f));
    if (!noGuardian) guardianFiles.forEach(f => formData.append("guardianPhotos", f));

    try {
      const result = await createChild(formData).unwrap();
      toast.success(result.message || "Child registered successfully!");
      reset(); setChildFiles([]); setGuardianFiles([]); setStep(1); setNoGuardian(false);
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <ToastContainer position="top-right" theme="colored" />

      {isLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-primBtn border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* NO onSubmit on the form — prevents accidental submission */}
      <form>
        <div className="bg-white shadow-xl shadow-slate-200 rounded-3xl border border-slate-100 overflow-hidden">

          {/* ── Header band — solid primBtn ── */}
          <div className="bg-primBtn px-8 py-6">
            <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-sm">
                <FontAwesomeIcon icon={faChild} />
              </span>
              Child Registration
            </h2>
            <p className="text-white/70 text-xs mt-1">Complete all steps to register a new child into the program</p>
          </div>

          <div className="px-8 pt-8 pb-10 space-y-8">
            <Stepper currentStep={step} />

            {/* ════ STEP 1 ════ */}
            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                <SectionHeader title="Child Information" subtitle="Core identity fields from the Child record" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="First Name" error={errors.firstName?.message} required>
                    <input {...register("firstName", { required: "Required" })} className={inputCls} placeholder="e.g. Sara" />
                  </Field>
                  <Field label="Last Name" error={errors.lastName?.message} required>
                    <input {...register("lastName", { required: "Required" })} className={inputCls} placeholder="e.g. Ahmed" />
                  </Field>
                  <Field label="Date of Birth" error={errors.dateOfBirth?.message} required>
                    <input type="date" {...register("dateOfBirth", { required: "Required", validate: v => new Date(v) < new Date() || "Must be a past date" })} className={inputCls} />
                  </Field>
                  <Field label="Admission Date" error={errors.admissionDate?.message} required>
                    <input type="date" {...register("admissionDate", { required: "Required", validate: v => new Date(v) <= new Date() || "Cannot be in the future" })} className={inputCls} />
                  </Field>
                  <SelectField label="Nationality" id="nationality" register={register} errors={errors} options={NATIONALITY_OPTIONS} />
                  <SelectField label="Religion"    id="religion"    register={register} errors={errors} options={RELIGION_OPTIONS} />
                  <Field label="Sub-City"><input {...register("subCity")} className={inputCls} placeholder="e.g. Bole" /></Field>
                  <Field label="Kebele"><input {...register("kebele")} className={inputCls} placeholder="e.g. 03" /></Field>
       <Field label="School Name">
  <div className="relative">
    <select
      {...register("schoolName")}
      className={selectCls}
      disabled={schoolsLoading}
    >
      <option value="">
        {schoolsLoading ? "Loading schools…" : "Select a school…"}
      </option>
      {schoolOptions.map((school) => (
        <option key={school.id} value={school.name}>
          {school.name} ({school.type === "PRIVATE" ? "Private" : "Government"})
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
      {schoolsLoading ? "…" : "▼"}
    </span>
  </div>
</Field>
                  <Field label="Emergency Contact Name"><input {...register("emergencyContactName")} className={inputCls} placeholder="Full name" /></Field>
                  <Field label="Emergency Contact Phone"><input {...register("emergencyContactPhone")} className={inputCls} placeholder="0912345678" /></Field>
                </div>

                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-3">Gender <span className="text-rose-400">*</span></p>
                  <div className="flex gap-3">
                    {GENDER_OPTIONS.map(g => (
                      <label key={g} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold border-slate-200 has-[:checked]:border-primBtn has-[:checked]:bg-primBtn/5 has-[:checked]:text-primBtn">
                        <input type="radio" {...register("gender", { required: "Gender is required" })} value={g} className="hidden" />
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </label>
                    ))}
                  </div>
                  {errors.gender && <span className="text-rose-500 text-xs mt-1.5 block">{errors.gender.message}</span>}
                </div>

                <PhotoUploader label="Upload Child Profile Photo" files={childFiles} setFiles={setChildFiles} icon={faCamera} />
              </div>
            )}

            {/* ════ STEP 2 ════ */}
            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <SectionHeader title="Household Information" subtitle="Living conditions and household details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Field label="Household Code" error={errors.householdCode?.message} required>
                    <input {...register("householdCode", { required: "Required" })} className={inputCls} placeholder="e.g. HH-0042" />
                  </Field>
                  <Field label="Full Address"><input {...register("address")} className={inputCls} placeholder="Street / area" /></Field>
                  <Field label="Number of Members"><input type="number" min={1} {...register("numberOfMembers")} className={inputCls} placeholder="e.g. 5" /></Field>
                  <SelectField label="Housing Condition" id="housingCondition" required register={register} errors={errors} options={HOUSING_OPTIONS}    rules={{ required: "Required" }} />
                  <SelectField label="Water Access"      id="waterAccess"      required register={register} errors={errors} options={WATER_OPTIONS}      rules={{ required: "Required" }} />
                  <SelectField label="Sanitation Access" id="sanitationAccess" required register={register} errors={errors} options={SANITATION_OPTIONS} rules={{ required: "Required" }} />
                  <Field label="Disabled member in household?">
                    <div className="flex gap-4 h-11 items-center">
                      {["Yes","No"].map(v => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                          <input type="radio" {...register("hasDisabledMember")} value={v === "Yes" ? "true" : "false"} className="accent-primBtn" /> {v}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="p-5 bg-primBtn/5 rounded-2xl border border-primBtn/10">
                  <p className="text-xs font-bold tracking-widest uppercase text-primBtn mb-4">Income Source</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Source"><input {...register("incomeSource")} className={inputCls} placeholder="e.g. Daily labor" /></Field>
                    <Field label="Amount (ETB)"><input type="number" {...register("incomeAmount")} className={inputCls} placeholder="e.g. 1500" /></Field>
                    <Field label="Frequency"><input {...register("incomeFrequency")} className={inputCls} placeholder="e.g. Monthly" /></Field>
                  </div>
                </div>
              </div>
            )}

            {/* ════ STEP 3 ════ */}
            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <SectionHeader title="Guardian Information" subtitle="Primary caregiver details" />
                <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 cursor-pointer">
                  <input type="checkbox" checked={noGuardian} onChange={() => setNoGuardian(v => !v)} className="w-4 h-4 accent-primBtn" />
                  <span className="text-sm font-bold text-amber-800">Child does not have a registered guardian</span>
                </label>

                {!noGuardian ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <Field label="First Name" error={errors.guardianFirstName?.message} required>
                        <input {...register("guardianFirstName", { required: !noGuardian ? "Required" : false })} className={inputCls} placeholder="First name" />
                      </Field>
                      <Field label="Last Name" error={errors.guardianLastName?.message} required>
                        <input {...register("guardianLastName", { required: !noGuardian ? "Required" : false })} className={inputCls} placeholder="Last name" />
                      </Field>
                      <Field label="Relationship" error={errors.relationship?.message} required>
                        <input {...register("relationship", { required: !noGuardian ? "Required" : false })} className={inputCls} placeholder="e.g. Mother, Uncle" />
                      </Field>
                      <Field label="Phone" error={errors.guardianPhone?.message} required>
                        <input {...register("guardianPhone", { required: !noGuardian ? "Required" : false })} className={inputCls} placeholder="0912345678" />
                      </Field>
                      <Field label="Email"><input type="email" {...register("guardianEmail")} className={inputCls} placeholder="optional@email.com" /></Field>
                      <Field label="Occupation"><input {...register("occupation")} className={inputCls} placeholder="e.g. Small trader" /></Field>
                      <Field label="Education Level"><input {...register("educationLevel")} className={inputCls} placeholder="e.g. Primary, Secondary" /></Field>
                      <SelectField label="Marital Status" id="maritalStatus" required register={register} errors={errors} options={MARITAL_OPTIONS} rules={{ required: !noGuardian ? "Required" : false }} />
                      <SelectField label="Income Range"   id="incomeRange"   required register={register} errors={errors} options={INCOME_OPTIONS}  rules={{ required: !noGuardian ? "Required" : false }} />
                      <Field label="Is Emergency Contact?">
                        <div className="flex gap-4 h-11 items-center">
                          {["Yes","No"].map(v => (
                            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                              <input type="radio" {...register("isEmergencyContact")} value={v === "Yes" ? "true" : "false"} className="accent-primBtn" /> {v}
                            </label>
                          ))}
                        </div>
                      </Field>
                    </div>
                    <PhotoUploader label="Upload Guardian ID / Photo" files={guardianFiles} setFiles={setGuardianFiles} icon={faUpload} />
                  </>
                ) : (
                  <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FontAwesomeIcon icon={faUserFriends} className="text-slate-300 text-3xl mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No guardian information will be collected.</p>
                  </div>
                )}
              </div>
            )}

            {/* ════ STEP 4 ════ */}
            {step === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <SectionHeader title="Additional Notes" subtitle="Initial health observations and program notes" />
                <Field label="Program / Intake Notes">
                  <textarea {...register("childNotes")} rows={4} className={textareaCls} placeholder="Behavior, special needs, hobbies, or other intake observations…" />
                </Field>
                <div className="p-5 bg-primBtn/5 border border-primBtn/15 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-primBtn text-sm" />
                    <p className="text-sm font-bold text-primBtn">Registration Summary</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    By submitting, you confirm that all information is accurate and collected with proper consent.
                    A vulnerability assessment and committee review will be scheduled separately.
                    This record will be logged in the audit trail.
                  </p>
                </div>
              </div>
            )}

            {/* ════ NAVIGATION ════ */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 text-slate-500 hover:text-primBtn font-bold text-sm transition-colors">
                  <FontAwesomeIcon icon={faArrowLeft} /> Back
                </button>
              ) : <span />}

              {step < STEPS.length ? (
                <button type="button" onClick={goNext}
                  className="bg-primBtn hover:bg-Hover text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primBtn/25 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm">
                  Continue <FontAwesomeIcon icon={faArrowRight} />
                </button>
              ) : (
                <button type="button" disabled={isLoading} onClick={handleSubmit(onFormSubmit)}
                  className="bg-primBtn hover:bg-Hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-primBtn/25 hover:scale-[1.02] transition-all flex items-center gap-2 text-sm">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Finalize Registration
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterChild;
