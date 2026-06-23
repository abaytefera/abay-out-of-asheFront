import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChild, faFileExcel, faArrowRight } from "@fortawesome/free-solid-svg-icons";


import RegisterChild from "../Component/AuthenticateComponent/ChildRegisterComponent/RegisterChild";

import BulkRegisterChildren from "../Component/AuthenticateComponent/ChildRegisterComponent/BulkRegisterChildren";
import DashbordNav from "../Component/AuthenticateComponent/DashboardComponent/DashbordNav";

const RegisterChildPage = () => {
  const [mode, setMode] = useState(null); // null | "single" | "bulk"

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Navigation - Always Top */}
      <DashbordNav />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto mt-8">
        
        {/* SINGLE CHILD MODE */}
        {mode === "single" && (
          <div className="flex flex-col items-start mt-20 hidden-state-animation">
            <BackButton onClick={() => setMode(null)} />
            <div className="w-full  rounded-3xl p-6  border border-slate-100">
              <RegisterChild />
            </div>
          </div>
        )}

        {/* BULK MODE */}
        {mode === "bulk" && (
          <div className="flex flex-col items-start mt-20 hidden-state-animation">
            <BackButton onClick={() => setMode(null)} />
            <div className="w-full  rounded-3xl p-6  border border-slate-100">
              <BulkRegisterChildren />
            </div>
          </div>
        )}

        {/* SELECTION MODE */}
        {mode === null && (
          <div className="flex flex-col mt- items-center justify-center mt-20 w-full">
            {/* Title */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                Register Children
              </h1>
              <p className="text-slate-500 mt-3 text-base">
                Choose how you'd like to register
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              
              {/* Single Button */}
              <button
                onClick={() => setMode("single")}
                className="group relative bg-white border-2 border-slate-200 hover:border-primBtn rounded-[2rem] p-8 text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-sky-100 group-hover:bg-primBtn rounded-2xl flex items-center justify-center transition-all duration-300 mb-5">
                  <FontAwesomeIcon icon={faChild} className="text-primBtn group-hover:text-white text-xl transition-all" />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Single Child</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Register one child at a time with a detailed step-by-step form including photos and parent info.
                </p>
                <div className="mt-6 flex items-center gap-2 text-primBtn font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Get started <FontAwesomeIcon icon={faArrowRight} />
                </div>
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-sky-200 group-hover:bg-primBtn transition-colors duration-300" />
              </button>

              {/* Bulk Button */}
              <button
                onClick={() => setMode("bulk")}
                className="group relative bg-white border-2 border-slate-200 hover:border-primBtn rounded-[2rem] p-8 text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-emerald-100 group-hover:bg-emerald-600 rounded-2xl flex items-center justify-center transition-all duration-300 mb-5">
                  <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600 group-hover:text-white text-xl transition-all" />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Bulk via Excel</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Upload an Excel or CSV file to register many children at once. Download our template to get started.
                </p>
                <div className="mt-6 flex items-center gap-2 text-primBtn font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Upload file <FontAwesomeIcon icon={faArrowRight} />
                </div>
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-200 group-hover:bg-emerald-500 transition-colors duration-300" />
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Small back button ──────────────────────────────────────────────────────────
const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm font-bold text-sm transition-all hover:scale-105 active:scale-95"
  >
    ← Back to selection
  </button>
);

export default RegisterChildPage;