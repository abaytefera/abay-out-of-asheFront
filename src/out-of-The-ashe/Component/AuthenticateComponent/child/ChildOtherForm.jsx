import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faTimes, faFileAlt, faFileVideo, faFilePdf } from "@fortawesome/free-solid-svg-icons";

/**
 * ChildOtherForm Component
 * @param {Object} errors - React Hook Form formState errors object ✅ (አዲስ የተጨመረ)
 */
const ChildOtherForm = ({
  register,
  handleSubmit,
  handleform,
  setShowFirstForm,
  handleFile,
  FileUpload,
  setFileUpload,
  errors, // ✅ የፎርም ስህተቶችን ለመያዝ እዚህ ጋ ፕሮፕስ እንቀበላለን
}) => {
  return (
    <div className="w-full fixed flex justify-center backdrop-blur bg-black/30 z-100 align-center pt-25 pb-10 inset-0 animate-in slide-in-from-bottom duration-500">
      <form
        className="bg-white border border-slate-200 overflow-y-auto p-8 rounded-xl shadow-2xl space-y-6"
        onSubmit={handleSubmit(handleform)}
      >
        {/* Form Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faUpload} className="text-primBtn" /> New Data
          </h3>
          <button
            type="button"
            onClick={() => setShowFirstForm(false)}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">
              Title of Record
            </label>
            <input
              type="text"
              className={`w-full h-12 bg-slate-50 border rounded-xl px-4 focus:ring-2 focus:ring-primBtn outline-none transition-all ${
                errors?.title ? "border-red-500 focus:ring-red-500 bg-red-50/30" : "border-slate-200"
              }`}
              placeholder="e.g., Exam Results, Medical Checkup..."
              // ✅ የስህተት መልዕክቱን በትክክል የማስቀመጫ መንገድ፡
              {...register("title", { required: "Please enter title of record" })}
            />
            {/* 🔴 የርዕስ ስህተት ማሳያ */}
            {errors?.title && (
              <p className="text-xs font-semibold text-red-500 ml-1 mt-1 animate-in fade-in duration-200">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center group hover:border-primBtn transition-colors bg-slate-50">
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-white text-primBtn rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <FontAwesomeIcon icon={faUpload} className="text-xl" />
              </div>
              <span className="text-sm font-medium text-slate-500">
                Click to <span className="text-primBtn">browse files</span>
              </span>
            </label>
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={handleFile}
            />

            {/* File Previews */}
            {FileUpload?.tempFile?.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                {FileUpload.tempFile.map((currentFile, index) => {
                  const fileType = currentFile.type;
                  
                  let content;
                  if (fileType.startsWith("image/")) {
                    content = (
                      <img
                        src={URL.createObjectURL(currentFile)}
                        className="w-full h-full object-contain"
                        alt="preview"
                      />
                    );
                  } else if (fileType === "application/pdf") {
                    content = (
                      <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-500">
                        <FontAwesomeIcon icon={faFilePdf} size="lg" />
                        <span className="text-[8px] mt-1 font-bold">PDF</span>
                      </div>
                    );
                  } else if (fileType.startsWith("video/")) {
                    content = (
                      <div className="flex flex-col items-center justify-center h-full bg-blue-50 text-blue-500">
                        <FontAwesomeIcon icon={faFileVideo} size="lg" />
                        <span className="text-[8px] mt-1 font-bold">VIDEO</span>
                      </div>
                    );
                  } else {
                    content = (
                      <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-500">
                        <FontAwesomeIcon icon={faFileAlt} size="lg" />
                        <span className="text-[8px] mt-1 font-bold">DOC</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="relative w-20 h-20 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl overflow-hidden shadow-sm group"
                    >
                      {content}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setFileUpload((prev) => ({
                            ...prev,
                            tempFile: prev.tempFile.filter((_, i) => i !== index),
                          }))
                        }
                        className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                      </button>
                      
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white truncate px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {currentFile.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">
              Detailed Description
            </label>
            <textarea
              // ✅ የሪአክት ሁክ ፎርም ትክክለኛ አጻጻፍ መዋቅር እዚህ ጋ ተስተካክሏል፡
              {...register("description", { required: "Please enter detailed description" })}
              className={`w-full min-h-[120px] bg-slate-50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primBtn outline-none resize-none transition-all ${
                errors?.description ? "border-red-500 focus:ring-red-500 bg-red-50/30" : "border-slate-200"
              }`}
              placeholder="What happened during this period? Provide details here..."
            />
            {/* 🔴 የማብራሪያ ስህተት ማሳያ */}
            {errors?.description && (
              <p className="text-xs font-semibold text-red-500 ml-1 animate-in fade-in duration-200">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
            onClick={() => setShowFirstForm(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] py-3 cursor-pointer bg-primBtn text-white font-bold rounded-xl hover:bg-Hover shadow-md shadow-blue-200 transition-all"
          >
            Submit 
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChildOtherForm;