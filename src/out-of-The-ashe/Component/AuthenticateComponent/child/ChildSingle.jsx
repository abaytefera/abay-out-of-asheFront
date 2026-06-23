import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { faUpload, faDownload, faDeleteLeft } from "@fortawesome/free-solid-svg-icons";

import {
  useGetChildByIDQuery,
  useUpdateChildMutation,
  useUpdateHouseholdMutation,
  useUpdateGuardianMutation,
  useDeleteFileMutation,
  useUploadProfileMutation,
} from "../../../Redux/Childes";

import { APi } from "../../../Redux/CenteralAPI";
import { Spinner } from "./ChildComponent";
import { ChildBody } from "./ChildBody";

const ChildSingle = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [childInfo, setChildInfo]   = useState({});
  const [editMode, setEditMode]     = useState({ child: true, household: true, guardian: true });
  const [saving,   setSaving]       = useState({ child: false, household: false, guardian: false });
  const [imageIndex, setImageIndex] = useState({ child: 0, parent: 0 });
  const [showImage,   setShowImage]  = useState({ child: false, parent: false });
  const [fileUpload, setFileUpload] = useState({ normalFile: [], tempFile: [] });
  const [isProfileControlDisplay, setIsProfileControlDisplay] = useState(false);
  const [isParentControlDisplay,  setParentControlDisplay]    = useState(false);
  const [fileChild,   setFilesChild]  = useState(null);
  const [fileParent, setFilesParent] = useState(null);

  const childInputRef = useRef(null);
  const { register, reset, handleSubmit, formState: { errors } } = useForm();

  // ── RTK Query hooks ──────────────────────────────────────────────────────────
  const { data: serverData, isLoading } = useGetChildByIDQuery(id);

  const [updateChild,     { isLoading: isUpdatingChild }]    = useUpdateChildMutation();
  const [updateHousehold, { isLoading: isUpdatingHH }]       = useUpdateHouseholdMutation();
  const [updateGuardian,  { isLoading: isUpdatingGuardian }] = useUpdateGuardianMutation();
  const [deleteFile,      { isLoading: isDeletingFile }]     = useDeleteFileMutation();
  const [uploadProfile,   { isLoading: isUploadingProfile }] = useUploadProfileMutation();

  // ── Sync server data → local state ──────────────────────────────────────────
  useEffect(() => {
    if (serverData) setChildInfo(serverData.data);
  }, [serverData]);

  // ── Invalidate helper ────────────────────────────────────────────────────────
  const invalidateChild = () =>
    dispatch(APi.util.invalidateTags([{ type: "ChildSearchById", id }]));

  // ── Field change handler ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name.startsWith("hh_")) {
      const key = name.slice(3);
      setChildInfo((p) => ({ ...p, household: { ...p.household, [key]: val } }));
    } else if (/^g\d+_/.test(name)) {
      const idx = parseInt(name.match(/^g(\d+)_/)[1]);
      const key = name.replace(/^g\d+_/, "");
      setChildInfo((p) => {
        const guardians = [...(p.household?.guardians || [])];
        guardians[idx] = { ...guardians[idx], [key]: val };
        return { ...p, household: { ...p.household, guardians } };
      });
    } else {
      setChildInfo((p) => ({ ...p, [name]: val }));
    }
  };

  // ── Save handler (child / household / guardian) ──────────────────────────────
  const onSave = async (section) => {
    setSaving((p) => ({ ...p, [section]: true }));
    try {
      if (section === "child") {
        const payload = {
          firstName:             childInfo.firstName,
          lastName:              childInfo.lastName,
          dateOfBirth:          childInfo.dateOfBirth,
          gender:               childInfo.gender,
          nationality:          childInfo.nationality,
          religion:             childInfo.religion,
          subCity:              childInfo.subCity,
          kebele:               childInfo.kebele,
          admissionDate:        childInfo.admissionDate,
          exitDate:             (childInfo.exitDate ?? ""),
          status:               childInfo.status,
          schoolName:           childInfo.schoolName,
          emergencyContactName: childInfo.emergencyContactName,
          emergencyContactPhone:childInfo.emergencyContactPhone,
          notes:                childInfo.notes,
        };
        await updateChild({ data: payload, id }).unwrap();

      } else if (section === "household") {
        const hh = childInfo.household || {};
        const payload = {
          householdCode:    hh.householdCode,
          address:          hh.address,
          subCity:          hh.subCity,
          kebele:           hh.kebele,
          housingCondition: hh.housingCondition,
          waterAccess:      hh.waterAccess,
          sanitationAccess: hh.sanitationAccess,
          hasDisabledMember:hh.hasDisabledMember,
          numberOfMembers:  hh.numberOfMembers,
        };
        await updateHousehold({ childId: id, data: payload }).unwrap();

      } else if (section === "guardian") {
        const guardian = childInfo.household?.guardians?.[0] || {};
        const payload = {
          firstName:         guardian.firstName,
          lastName:          guardian.lastName,
          relationship:      guardian.relationship,
          phone:             guardian.phone,
          email:             guardian.email,
          occupation:        guardian.occupation,
          educationLevel:    guardian.educationLevel,
          maritalStatus:     guardian.maritalStatus,
          incomeRange:       guardian.incomeRange,
          isEmergencyContact: guardian.isEmergencyContact,
        };
        await updateGuardian({ childId: id, data: payload }).unwrap();
      }

      toast.success("Saved successfully");
      setEditMode((p) => ({ ...p, [section]: true }));
      invalidateChild();

    } catch (err) {
      toast.error(err?.data?.message || err?.data?.msg || "Save failed");
    } finally {
      setSaving((p) => ({ ...p, [section]: false }));
    }
  };

  // ── Profile photo upload ─────────────────────────────────────────────────────
  const handleProfileUpload = async (file, type) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("type", type); 
    
    if (type === "child") {
      formData.append("childPhotos", file);
    } else {
      formData.append("parentPhotos", file);
    }

    try {
      await uploadProfile({ id, formData }).unwrap();
      toast.success("Photo updated successfully");
      setFilesChild(null);
      setFilesParent(null);
      invalidateChild();
    } catch (err) {
      const errorMessage = err?.data?.message || err?.data?.msg || err?.data?.error || "Upload failed";
      toast.error(errorMessage);
    }
  };

  // ── Profile photo / download / delete menu actions ──────────────────────────
  const handleMediaAction = async (imageUrl, public_id, actionType, selectionType) => {
    try {
      if (actionType === "download") {
        const blob = await fetch(imageUrl).then((r) => r.blob());
        const link = Object.assign(document.createElement("a"), {
          href: window.URL.createObjectURL(blob),
          download: `profile-${id}.jpg`,
        });
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

      } else if (actionType === "delet") {
        await deleteFile({ id, public_id, selectionType }).unwrap();
        toast.success("Image removed");
        invalidateChild();

      } else if (actionType === "upload") {
        document
          .getElementById(selectionType === "child" ? "ProfileUpload" : "ProfileUploadParent")
          ?.click();
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.data?.msg || "Action failed");
    }
  };

  // ── Age helper ────────────────────────────────────────────────────────────────
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    return Math.abs(
      new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970
    );
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Spinner />
      </div>
    );

  const isProcessing = isUpdatingChild || isUpdatingHH || isUpdatingGuardian;

  return (
    <ChildBody
      childInfo={childInfo}
      editMode={editMode}
      saving={saving}
      imageIndex={imageIndex}     setImageIndex={setImageIndex}
      showImage={showImage}       setShowImage={setShowImage}
      FileUpload={fileUpload}     setFileUpload={setFileUpload}
      isProfileControlDisplay={isProfileControlDisplay}
      setIsProfileControlDisplay={setIsProfileControlDisplay}
      isParentProfileControlDisplay={isParentControlDisplay}
      setParentControlDisplay={setParentControlDisplay}
      Childupdating={isProcessing}
      uploadProfileLoading={isUploadingProfile}
      fileChild={fileChild}       setFilesChild={setFilesChild}
      fileParent={fileParent}     setFilesParent={setFilesParent}
      register={register}
      handleSubmit={handleSubmit}
      reset={reset}
      childInputRef={childInputRef}
      errors={errors}
      calculateAge={calculateAge}
      handleChange={handleChange}
      handleCancel={(section) => {
        if (serverData) setChildInfo(serverData.data);
        setEditMode((p) => ({ ...p, [section]: true }));
      }}
      handleSave={onSave}
      handleEditToggle={(section, currentlyLocked) => {
        setEditMode((p) => ({ ...p, [section]: !currentlyLocked }));
        if (currentlyLocked && section === "child") {
          setTimeout(() => childInputRef.current?.focus(), 50);
        }
      }}
      handleUpload={handleProfileUpload}
      handleUploadParentFile={handleProfileUpload}
      handleImageIcon={(url, pid, action) => handleMediaAction(url, pid, action, "child")}
      handleImageIconParent={(url, pid, action) => handleMediaAction(url, pid, action, "parent")}
      handleFile={(e) => {
        const f = e.target.files[0];
        if (f) setFileUpload((p) => ({ ...p, tempFile: [...p.tempFile, f] }));
      }}
      ProfileControle={[
        { icon: faUpload,    type: "upload",   text: "Upload",   id: 0 },
        { icon: faDownload,  type: "download", text: "Download", id: 1 },
        { icon: faDeleteLeft, type: "delet",    text: "Delete",   id: 2 },
      ]}
    />
  );
};

export default ChildSingle;