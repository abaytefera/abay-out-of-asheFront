import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faCoins, faHeartPulse, faGraduationCap,
  faBrain, faShield, faEdit, faChevronDown, faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

import { useGetPermissionsOwnQuery } from "../../../Redux/Employee";
import { ImageSlider, MyProfileImage, LabelInput, SelectInput, Textarea, SectionTitle } from "./ChildComponent";
import HomeVisitsTab      from "./tabs/HomeVisitsTab";
import FinancialSupportTab from "./tabs/FinancialSupportTab";
import HealthTab          from "./tabs/HealthTab";
import EducationTab       from "./tabs/EducationTab";
import PsychosocialTab    from "./tabs/PsychosocialTab";
import SafeguardingTab    from "./tabs/SafeguardingTab";
import OtherRecordsTab from "./tabs/OtherRecordsTab";
import VulnerabilityAssessmentTab from "./tabs/VulnerabilityAssessmentTab";
// ── Enum options from schema ────────────────────────────────────────────────
const CHILD_STATUS_OPTIONS    = ["ACTIVE","GRADUATED","SUSPENDED","TRANSFERRED","DROPPED"];
const GENDER_OPTIONS          = ["MALE","FEMALE","OTHER"];
const MARITAL_STATUS_OPTIONS  = ["SINGLE","MARRIED","DIVORCED","WIDOWED","SEPARATED"];
const INCOME_RANGE_OPTIONS    = ["NONE","BELOW_500","RANGE_500_1000","RANGE_1001_3000","ABOVE_3000"];
const HOUSING_OPTIONS         = ["OWNED","RENTED","INFORMAL","HOMELESS"];
const WATER_OPTIONS           = ["PIPED","WELL","RIVER","COMMUNAL_TAP","NONE"];
const SANITATION_OPTIONS      = ["PRIVATE_TOILET","SHARED_TOILET","OPEN_DEFECATION","NONE"];



const getPermissions = (role) => {
  const isAdmin = role === "ADMIN";
  const isManager = role === "PROGRAM_MANAGER";
  const isDirector = role === "COUNTRY_DIRECTOR";

  return {
    visits: { view: isManager || isDirector || isAdmin || role === "SOCIAL_WORKER", create: role === "SOCIAL_WORKER", edit: isAdmin || role === "SOCIAL_WORKER", delete: isAdmin,Assiged:isManager },
    finance: { view: isManager || isDirector || isAdmin || role === "FINANCE_OFFICER" , create: role === "FINANCE_OFFICER" , edit: isAdmin, delete: isAdmin },
    health: { view: isManager || isDirector || isAdmin || role === "HEALTH_OFFICER" || role === "SOCIAL_WORKER" , create:  role === "HEALTH_OFFICER" || role === "SOCIAL_WORKER", edit: isAdmin ||  role === "SOCIAL_WORKER", delete: isAdmin },
    education: { view: isManager || isDirector || isAdmin || role === "EDUCATION_OFFICER"   , create: role === "EDUCATION_OFFICER"  , edit: isAdmin || role === "EDUCATION_OFFICER", delete: isAdmin },
    psycho: { view: isManager || isDirector || isAdmin || role === "PSYCHOSOCIAL_OFFICER"  , create: role === "PSYCHOSOCIAL_OFFICER" , edit: isAdmin || role === "PSYCHOSOCIAL_OFFICER", delete: isAdmin },
    safeguard: { view: isManager || isDirector || isAdmin || role === "SOCIAL_WORKER" || role === "PSYCHOSOCIAL_OFFICER", create: role === "SOCIAL_WORKER" || role === "PSYCHOSOCIAL_OFFICER" , edit: isAdmin || role === "SOCIAL_WORKER" || role === "PSYCHOSOCIAL_OFFICER", delete: isAdmin },
    otherfile: { view: true, create: true, edit:true, delete: isAdmin },
    vulnerability: { view: isManager || isDirector || isAdmin || role === "SOCIAL_WORKER" || role === "PSYCHOSOCIAL_OFFICER", create: role === "SOCIAL_WORKER" || role === "PSYCHOSOCIAL_OFFICER", edit: isAdmin || role === "SOCIAL_WORKER" || role === "PSYCHOSOCIAL_OFFICER", delete: isAdmin ,canDecionchange:isAdmin},
    childcontrol:{canedit:isAdmin || role === "SOCIAL_WORKER"  ,candelete:isAdmin}
  };
};
const Collapsible = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</span>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="text-slate-400 text-xs" />
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
};

// ── Edit/Save toolbar ───────────────────────────────────────────────────────
const EditBar = ({ section, editMode, saving, canEdit, handleCancel, handleSave, handleEditToggle, childInputRef }) => (
  <div className="flex gap-2 shrink-0">
    {!editMode[section] ? (
      <>
        <button
          type="button"
          className="text-xs font-bold bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200"
          onClick={() => handleCancel(section)}
        >Cancel</button>
        <button
          type="button"
          className="text-xs font-bold bg-primBtn text-white px-4 py-2 rounded-lg hover:bg-Hover shadow-md shadow-blue-200 disabled:opacity-60"
          onClick={() => handleSave(section)}
          disabled={saving[section]}
        >{saving[section] ? "Saving…" : "Save changes"}</button>
      </>
    ) : canEdit ? (
      <button
        type="button"
        className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:border-primBtn hover:text-primBtn flex items-center gap-2"
        onClick={() => handleEditToggle(section, editMode[section])}
      ><FontAwesomeIcon icon={faEdit} className="text-[10px]" /> Edit</button>
    ) : null}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
export const ChildBody = ({
  childInfo,
  editMode, saving,
  imageIndex, setImageIndex,
  showImage, setShowImage,
  FileUpload, setFileUpload,
  isProfileControlDisplay, setIsProfileControlDisplay,
  isParentProfileControlDisplay, setParentControlDisplay,
  Childupdating, uploadProfileLoading,
  isLoadingChildOtherFile, isLoadingDeleteFile,
  fileChild, setFilesChild,
  fileParent, setFilesParent,
  register, handleSubmit, reset,
  childInputRef,
  errors,
  calculateAge,
  handleChange, handleCancel, handleSave, handleEditToggle,
  handleUpload, handleUploadParentFile,
  handleImageIcon, handleImageIconParent,
  handleFile, handleform,
  ProfileControle,
}) => {
  const [activeTab, setActiveTab] = useState("visits");

 

  const { data: newperm } = useGetPermissionsOwnQuery();
    const { user } = useSelector((state) => state.auth);
const perms = useMemo(() => getPermissions(user?.role), [user?.role]);


  const  canEditChild=true
          const      canDeleteChild=true
const TABS = [
  { id: "visits",    label: "Home visits",      icon: faHome,view:perms.visits.view },
  { id: "finance",   label: "Financial support", icon: faCoins, view:perms.finance.view},
  { id: "health",    label: "Health",            icon: faHeartPulse ,view:perms.health.view},
  { id: "education", label: "Education",         icon: faGraduationCap,view:perms.education.view },
  { id: "psycho",    label: "Psychosocial",      icon: faBrain ,view: perms.psycho.view},
  { id: "safeguard", label: "Safeguarding",      icon: faShield ,view: perms.safeguard.view },
  { id: "otherfile", label: "otherfile",      icon: faShield,view:perms.otherfile.view},
 { id: "VulnerabilityAssessment", label: "VulnerabilityAssessment",      icon: faShield,view:perms.vulnerability.view },
  
];


  const isLoading = Childupdating || uploadProfileLoading || isLoadingChildOtherFile;
useEffect(()=>{

console.log("what happen man")
console.log(childInfo)
},[childInfo])
  // Convenience: child's household object
  const hh = childInfo?.household || {};
  // First guardian (primary)
  const guardian = hh?.guardians?.[0] || {};

  const disabled = { child: editMode.child, household: editMode.household, guardian: editMode.guardian };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">

      {isLoading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-primBtn border-t-white rounded-full animate-spin" />
          <p className="mt-6 text-lg font-semibold text-primBtn animate-pulse">Processing…</p>
        </div>
      )}

      <ToastContainer theme="light" position="top-center" autoClose={3000} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ══════════════════════════════════════════
            PROFILE HERO — photo + status chips
        ══════════════════════════════════════════ */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
            {/* Child photo */}
            <div className="shrink-0">
              <ImageSlider
                type="child"
                uploadProfileLoading={uploadProfileLoading}
                images={(childInfo?.photos || []).slice().reverse()}
                ProfileControle={ProfileControle}
                file={fileChild}
                setFiles={setFilesChild}
                handleUpload={handleUpload}
                currentIndex={imageIndex.child}
                isProfileControlDisplay={isProfileControlDisplay}
                setIsProfileControlDisplay={setIsProfileControlDisplay}
                onPrev={() => setImageIndex(p => ({ ...p, child: Math.max(0, p.child - 1) }))}
                onNext={() => setImageIndex(p => ({ ...p, child: Math.min((childInfo?.photos?.length || 1) - 1, p.child + 1) }))}
                showFull={showImage.child}
                handleImageIcon={handleImageIcon}
                isLoadingDeleteFile={isLoadingDeleteFile}
                toggleShow={() => setShowImage(p => ({ ...p, child: !p.child }))}
                canEditChild={perms.childcontrol.canedit}
                canDeleteChild={perms.childcontrol.candelete}
               
              />
            </div>

            {/* Name + quick chips */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-primBtn text-xs font-bold uppercase tracking-widest">
                Student Profile
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {childInfo?.firstName} {childInfo?.lastName}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm mt-2">
                {[
                  { label: "Child ID",  value: childInfo?.childCode },
                  { label: "Age",       value: calculateAge(childInfo?.dateOfBirth) + " yrs" },
                  { label: "Gender",    value: childInfo?.gender },
                  { label: "Status",    value: childInfo?.status },
                  { label: "School",    value: childInfo?.schoolName },
                ].filter(c => c.value).map((chip, i) => (
                  <div key={i} className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <span className="text-slate-400 mr-1.5">{chip.label}</span>
                    <span className="text-slate-900 font-semibold">{chip.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── CHILD MODEL FIELDS ──────────────────────── */}
          <div className="space-y-4">

            {
            
            perms.childcontrol.canedit &&
            (
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <SectionTitle title="Child details" />
              <EditBar section="child" editMode={editMode} saving={saving} canEdit={canEditChild}
                handleCancel={handleCancel} handleSave={handleSave}
                handleEditToggle={handleEditToggle} childInputRef={childInputRef} />
            </div>
            )
}

            <Collapsible title="Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <LabelInput label="First name *"      name="firstName"    value={childInfo?.firstName    || ""} disabled={editMode.child} onChange={handleChange} ref={childInputRef} />
                <LabelInput label="Last name *"       name="lastName"     value={childInfo?.lastName     || ""} disabled={editMode.child} onChange={handleChange} />
                <LabelInput label="Date of birth *"   name="dateOfBirth"  type="date" value={childInfo?.dateOfBirth?.slice(0,10) || ""} disabled={editMode.child} onChange={handleChange} />
                <SelectInput label="Gender *"         name="gender"       value={childInfo?.gender       || ""} disabled={editMode.child} onChange={handleChange} options={GENDER_OPTIONS} />
                <LabelInput label="Nationality"       name="nationality"  value={childInfo?.nationality  || ""} disabled={editMode.child} onChange={handleChange} />
                <LabelInput label="Religion"          name="religion"     value={childInfo?.religion     || ""} disabled={editMode.child} onChange={handleChange} />
              </div>
            </Collapsible>

            <Collapsible title="Location">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <LabelInput label="Sub-city"  name="subCity" value={childInfo?.subCity || ""} disabled={editMode.child} onChange={handleChange} />
                <LabelInput label="Kebele"    name="kebele"  value={childInfo?.kebele  || ""} disabled={editMode.child} onChange={handleChange} />
              </div>
            </Collapsible>

            <Collapsible title="Programme">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectInput label="Status *"           name="status"        value={childInfo?.status        || ""} disabled={editMode.child} onChange={handleChange} options={CHILD_STATUS_OPTIONS} />
                <LabelInput  label="Admission date *"   name="admissionDate" type="date" value={childInfo?.admissionDate?.slice(0,10) || ""} disabled={editMode.child} onChange={handleChange} />
                <LabelInput  label="Exit date"          name="exitDate"      type="date" value={childInfo?.exitDate?.slice(0,10)      || ""} disabled={editMode.child} onChange={handleChange} />
                <LabelInput  label="School name"        name="schoolName"    value={childInfo?.schoolName    || ""} disabled={editMode.child} onChange={handleChange} />
              </div>
            </Collapsible>

            <Collapsible title="Emergency contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LabelInput label="Emergency contact name"  name="emergencyContactName"  value={childInfo?.emergencyContactName  || ""} disabled={editMode.child} onChange={handleChange} />
                <LabelInput label="Emergency contact phone" name="emergencyContactPhone" value={childInfo?.emergencyContactPhone || ""} disabled={editMode.child} onChange={handleChange} />
              </div>
            </Collapsible>

            <Collapsible title="Notes" defaultOpen={false}>
              <Textarea label="Notes" name="notes" value={childInfo?.notes || ""} disabled={editMode.child} onChange={handleChange} />
            </Collapsible>

          </div>
        </section>

        {/* ══════════════════════════════════════════
            HOUSEHOLD & GUARDIAN CARD
        ══════════════════════════════════════════ */}
        {(hh?.id || guardian?.id || childInfo?.householdId) && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">

            {/* ── Household ── */}
            <div>

                { perms.childcontrol.canedit &&(
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <SectionTitle title="Household" />
                <EditBar section="household" editMode={editMode} saving={saving} canEdit={canEditChild}
                  handleCancel={handleCancel} handleSave={handleSave} handleEditToggle={handleEditToggle} />
              </div>
                )
}

              <Collapsible title="Location & housing">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <LabelInput  label="Household code *"   name="hh_householdCode"     value={hh?.householdCode   || ""} disabled={editMode.household} onChange={handleChange} />
                  <LabelInput  label="Address"            name="hh_address"           value={hh?.address         || ""} disabled={editMode.household} onChange={handleChange} />
                  <LabelInput  label="Sub-city"           name="hh_subCity"           value={hh?.subCity         || ""} disabled={editMode.household} onChange={handleChange} />
                  <LabelInput  label="Kebele"             name="hh_kebele"            value={hh?.kebele          || ""} disabled={editMode.household} onChange={handleChange} />
                  <SelectInput label="Housing condition"  name="hh_housingCondition"  value={hh?.housingCondition|| ""} disabled={editMode.household} onChange={handleChange} options={HOUSING_OPTIONS} />
                  <SelectInput label="Water access"       name="hh_waterAccess"       value={hh?.waterAccess     || ""} disabled={editMode.household} onChange={handleChange} options={WATER_OPTIONS} />
                  <SelectInput label="Sanitation access"  name="hh_sanitationAccess"  value={hh?.sanitationAccess|| ""} disabled={editMode.household} onChange={handleChange} options={SANITATION_OPTIONS} />
                  <LabelInput  label="Number of members"  name="hh_numberOfMembers"   type="number" value={hh?.numberOfMembers ?? ""} disabled={editMode.household} onChange={handleChange} />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="hh_hasDisabledMember"
                    name="hh_hasDisabledMember"
                    checked={hh?.hasDisabledMember || false}
                    disabled={editMode.household}
                    onChange={handleChange}
                    className="w-4 h-4 accent-primBtn"
                  />
                  <label htmlFor="hh_hasDisabledMember" className="text-sm text-slate-700">Household has a member with disability</label>
                </div>
              </Collapsible>

              <Collapsible title="Notes" defaultOpen={false}>
                <Textarea label="Household notes" name="hh_notes" value={hh?.notes || ""} disabled={editMode.household} onChange={handleChange} />
              </Collapsible>

              {/* Income sources */}
              {hh?.incomeSources?.length > 0 && (
                <Collapsible title="Income sources" defaultOpen={false}>
                  <div className="space-y-3">
                    {hh.incomeSources.map((src, i) => (
                      <div key={src.id || i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <LabelInput label="Source"    name={`income_source_${i}`}    value={src.source    || ""} disabled={editMode.household} onChange={handleChange} />
                        <LabelInput label="Amount"    name={`income_amount_${i}`}    type="number" value={src.amount ?? ""} disabled={editMode.household} onChange={handleChange} />
                        <LabelInput label="Frequency" name={`income_frequency_${i}`} value={src.frequency || ""} disabled={editMode.household} onChange={handleChange} />
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )}
            </div>

            {/* ── Guardian(s) ── */}
            {hh?.guardians?.length > 0 && hh.guardians.map((g, gi) => (
              <div key={g.id || gi}>
                {   perms.childcontrol.canedit && 
                (
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <SectionTitle title={`Guardian ${hh.guardians.length > 1 ? gi + 1 : ""} — ${g.relationship || "Guardian"}`} />
                  <EditBar section="guardian" editMode={editMode} saving={saving} canEdit={canEditChild}
                    handleCancel={handleCancel} handleSave={handleSave} handleEditToggle={handleEditToggle} />
                </div>
                )
}

                {/* Guardian photo (first guardian only) */}
                {gi === 0 && (
                  <div className="flex justify-center md:justify-start mb-6">
                    <MyProfileImage
                      type="parent"
                      uploadProfileLoading={uploadProfileLoading}
                      images={(childInfo?.household?.guardians?.[0]?.photos || []).slice().reverse()}
                      currentIndex={imageIndex.parent}
                      ProfileControle={ProfileControle}
                      file={fileParent}
                      setFiles={setFilesParent}
                      handleUploadParentFile={handleUploadParentFile}
                      isProfileControlDisplay={isParentProfileControlDisplay}
                      setIsProfileControlDisplay={setParentControlDisplay}
                      onPrev={() => setImageIndex(p => ({ ...p, parent: Math.max(0, p.parent - 1) }))}
                      onNext={() => setImageIndex(p => ({ ...p, parent: Math.min((childInfo?.household?.guardians?.[0]?.photos?.length || 1) - 1, p.parent + 1) }))}
                      showFull={showImage.parent}
                      handleImageIconParent={handleImageIconParent}
                      isLoadingDeleteFile={isLoadingDeleteFile}
                      toggleShow={() => setShowImage(p => ({ ...p, parent: !p.parent }))}
                      canEditChild={perms.childcontrol.canedit}
                      canDeleteChild={perms.childcontrol.candelete}
                    />
                  </div>
                )}

                <Collapsible title="Personal info">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <LabelInput  label="First name *"    name={`g${gi}_firstName`}    value={g.firstName    || ""} disabled={editMode.guardian} onChange={handleChange} />
                    <LabelInput  label="Last name *"     name={`g${gi}_lastName`}     value={g.lastName     || ""} disabled={editMode.guardian} onChange={handleChange} />
                    <LabelInput  label="Relationship *"  name={`g${gi}_relationship`} value={g.relationship || ""} disabled={editMode.guardian} onChange={handleChange} />
                    <LabelInput  label="Phone"           name={`g${gi}_phone`}        value={g.phone        || ""} disabled={editMode.guardian} onChange={handleChange} />
                    <LabelInput  label="Email"           name={`g${gi}_email`}        type="email" value={g.email || ""} disabled={editMode.guardian} onChange={handleChange} />
                    <SelectInput label="Marital status"  name={`g${gi}_maritalStatus`} value={g.maritalStatus || ""} disabled={editMode.guardian} onChange={handleChange} options={MARITAL_STATUS_OPTIONS} />
                    <LabelInput  label="Occupation"      name={`g${gi}_occupation`}   value={g.occupation     || ""} disabled={editMode.guardian} onChange={handleChange} />
                    <LabelInput  label="Education level" name={`g${gi}_educationLevel`} value={g.educationLevel || ""} disabled={editMode.guardian} onChange={handleChange} />
                    <SelectInput label="Income range"    name={`g${gi}_incomeRange`}  value={g.incomeRange   || ""} disabled={editMode.guardian} onChange={handleChange} options={INCOME_RANGE_OPTIONS} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="checkbox"
                      id={`g${gi}_isEmergencyContact`}
                      name={`g${gi}_isEmergencyContact`}
                      checked={g.isEmergencyContact || false}
                      disabled={editMode.guardian}
                      onChange={handleChange}
                      className="w-4 h-4 accent-primBtn"
                    />
                    <label htmlFor={`g${gi}_isEmergencyContact`} className="text-sm text-slate-700">This guardian is the emergency contact</label>
                  </div>
                </Collapsible>
              </div>
            ))}

          </section>
        )}

        {/* ══════════════════════════════════════════
            MODULE TABS
        ══════════════════════════════════════════ */}
        <section>
          <div className="flex flex-wrap gap-2 mb-4">
  {TABS.map(tab => (
    // Check if tab.view is true before rendering the button
    tab.view && (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all
          ${activeTab === tab.id
            ? "bg-primBtn text-white border-transparent shadow-md shadow-blue-200"
            : "bg-white text-slate-600 border-slate-200 hover:border-primBtn hover:text-primBtn"}`}
      >
        <FontAwesomeIcon icon={tab.icon} className="text-xs" />
        {tab.label}
      </button>
    )
  ))}
</div>

         <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
  {(activeTab === "visits" && perms.visits.view) && (
    <HomeVisitsTab childId={childInfo?.id} canCreate={perms.visits.create} canEdit={perms.visits.edit} canDelete={perms.visits.delete} canAssign={perms.visits.Assiged} />
  )}
  {activeTab === "finance" && perms.finance.view && (
    <FinancialSupportTab childId={childInfo?.id} canCreate={perms.finance.create} canEdit={perms.finance.edit} canDelete={perms.finance.delete} />
  )}
  {activeTab === "health" && perms.health.view && (
    <HealthTab childId={childInfo?.id} canCreate={perms.health.create} canEdit={perms.health.edit} canDelete={perms.health.delete} />
  )}
  {activeTab === "education" && perms.education.view && (
    <EducationTab childId={childInfo?.id} canCreate={perms.education.create} canEdit={perms.education.edit} canDelete={perms.education.delete} />
  )}
  {activeTab === "psycho" && perms.psycho.view && (
    <PsychosocialTab childId={childInfo?.id} canCreate={perms.psycho.create} canEdit={perms.psycho.edit} canDelete={perms.psycho.delete} />
  )}
  {activeTab === "safeguard" && perms.safeguard.view && (
    <SafeguardingTab childId={childInfo?.id} canCreate={perms.safeguard.create} canEdit={perms.safeguard.edit} canDelete={perms.safeguard.delete} />
  )}
  {activeTab === "otherfile" && perms.otherfile.view && (
    <OtherRecordsTab childId={childInfo?.id} canCreate={perms.otherfile.create} canEdit={perms.otherfile.edit} canDelete={perms.otherfile.delete} />
  )}
  {activeTab === "VulnerabilityAssessment" && perms.vulnerability.view && (
    <VulnerabilityAssessmentTab childId={childInfo?.id} canCreate={perms.vulnerability.create} canEdit={perms.vulnerability.edit} canDelete={perms.vulnerability.delete} canDecionchange={perms.vulnerability.canDecionchange}/>
  )}
</div>

        </section>
 
      </div>
    </div>
  );
};
