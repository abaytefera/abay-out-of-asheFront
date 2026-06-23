import React, { useEffect, useState } from 'react';
import SidebarActions from '../Component/AuthenticateComponent/StudentManagement/SidebarActions';
import ChildrenTable from '../Component/AuthenticateComponent/StudentManagement/ChildrenTable';
import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import { useGetAllChildQuery } from '../Redux/Childes';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const ExportWarningToast = () => (
  <div
    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-lg text-sm font-semibold bg-amber-50 border-amber-200 text-amber-700"
    style={{ animation: 'toastUp .25s cubic-bezier(.34,1.56,.64,1) both' }}
  >
    <FontAwesomeIcon icon={faExclamationCircle} className="text-amber-500 text-base shrink-0" />
    Please select at least one student to export.
    <style>{`
      @keyframes toastUp {
        from { opacity:0; transform:translateX(-50%) translateY(12px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
    `}</style>
  </div>
);

const StudentManagement = () => {
  // ── existing filter state ─────────────────────────────────
  const [searchTerm,       setSearchTerm]       = useState('');
  const [gradeFilter,      setGradeFilter]      = useState('All');
  const [genderFilter,     setGenderFilter]     = useState('All');
  const [schoolNameFilter, setSchoolNameFilter] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('All');

  // ── new filter state ──────────────────────────────────────
  const [hasSafeguardCase,         setHasSafeguardCase]         = useState(false);
  const [classRank,                setClassRank]                = useState('');
  const [academicYear,             setAcademicYear]             = useState('');
  const [avgScoreMin,              setAvgScoreMin]              = useState('');
  const [avgScoreMax,              setAvgScoreMax]              = useState('');
  const [hasVulnerableAssignment,  setHasVulnerableAssignment]  = useState(false);
  const [hasApprovedVulnerability, setHasApprovedVulnerability] = useState(false);

  // ── selection & ui state ──────────────────────────────────
  const [selectedIds,   setSelectedIds]   = useState([]);
  const [showWarnToast, setShowWarnToast] = useState(false);

  const { isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // ── RTK Query — pass all server-side params ───────────────
  const { data: apiResponse, isLoading, isError } = useGetAllChildQuery({
    search:                   searchTerm       || undefined,
    gender:                   genderFilter !== 'All'     ? genderFilter.toUpperCase()  : undefined,
    schoolType:               schoolTypeFilter !== 'All' ? schoolTypeFilter            : undefined,
    hasSafeguardCase:         hasSafeguardCase           ? 'true'                      : undefined,
    classRank:                classRank        || undefined,
    academicYear:             academicYear     || undefined,
    avgScoreMin:              avgScoreMin      || undefined,
    avgScoreMax:              avgScoreMax      || undefined,
    hasVulnerableAssignment:  hasVulnerableAssignment    ? 'true'                      : undefined,
    hasApprovedVulnerability: hasApprovedVulnerability   ? 'true'                      : undefined,
  });

  // ── normalise API response to array ──────────────────────
  const childrenArray = Array.isArray(apiResponse)
    ? apiResponse
    : apiResponse?.data || apiResponse?.children || [];

  // ── select all on initial load ────────────────────────────
  useEffect(() => {
    if (childrenArray.length > 0) {
      setSelectedIds(childrenArray.map((c) => c.id));
    }
  }, [apiResponse]);

  // ── client-side filtering ─────────────────────────────────
  const filteredChildren = childrenArray.filter((child) => {
    if (!child) return false;

    // Search
    const fullName = `${child.firstName || ''} ${child.lastName || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (child.childCode || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Gender
    const matchesGender =
      genderFilter === 'All' ||
      child.gender?.toUpperCase() === genderFilter.toUpperCase();

    // Grade (client-only)
    const matchesGrade =
      gradeFilter === 'All' ||
      (child.schoolName || '').toLowerCase().includes(gradeFilter.toLowerCase());

    // School name (client-only)
    const matchesSchoolName =
      schoolNameFilter === '' ||
      (child.schoolName || '').toLowerCase() === schoolNameFilter.toLowerCase();

    // School type
    const matchesSchoolType =
      schoolTypeFilter === 'All' ||
      (child.schoolType || '').toUpperCase() === schoolTypeFilter.toUpperCase();

    // ── Safeguard ─────────────────────────────────────────
    // Adjust field name to match your API response shape
    const matchesSafeguard =
      !hasSafeguardCase ||
      (Array.isArray(child.safeguardCases) &&
        child.safeguardCases.some((c) => c.status === 'OPEN'));

    // ── Education / rank / score ──────────────────────────
    // Tries latestEducation object first, then flat fields as fallback
    const childRank  = child.latestEducation?.classRank  ?? child.classRank;
    const childYear  = child.latestEducation?.academicYear ?? child.academicYear;
    const childScore = child.latestEducation?.avgScore   ?? child.avgScore ?? child.averageScore;

    const matchesClassRank =
      classRank === '' || Number(childRank) === Number(classRank);

    const matchesAcademicYear =
      academicYear === '' || String(childYear) === String(academicYear);

    const matchesAvgScoreMin =
      avgScoreMin === '' || (childScore != null && Number(childScore) >= Number(avgScoreMin));

    const matchesAvgScoreMax =
      avgScoreMax === '' || (childScore != null && Number(childScore) <= Number(avgScoreMax));

    // ── Vulnerability ─────────────────────────────────────
    // Adjust field name to match your API response shape
    const matchesVulnerableAssignment =
      !hasVulnerableAssignment ||
      (Array.isArray(child.vulnerabilities) && child.vulnerabilities.length > 0);

    const matchesApprovedVulnerability =
      !hasApprovedVulnerability ||
      (Array.isArray(child.vulnerabilities) &&
        child.vulnerabilities.some((v) => v.status === 'APPROVED'));

    return (
      matchesSearch &&
      matchesGender &&
      matchesGrade &&
      matchesSchoolName &&
      matchesSchoolType &&
      matchesSafeguard &&
      matchesClassRank &&
      matchesAcademicYear &&
      matchesAvgScoreMin &&
      matchesAvgScoreMax &&
      matchesVulnerableAssignment &&
      matchesApprovedVulnerability
    );
  });

  // ── selection helpers ─────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleAll = (ids) => {
    const allChecked = ids.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allChecked
        ? prev.filter((x) => !ids.includes(x))
        : [...new Set([...prev, ...ids])]
    );
  };

  // ── re-select all visible rows whenever any filter changes ─
  useEffect(() => {
    if (!filteredChildren.length) { setSelectedIds([]); return; }
    setSelectedIds(filteredChildren.map((c) => c.id));
  }, [
    searchTerm, gradeFilter, genderFilter, schoolNameFilter, schoolTypeFilter,
    hasSafeguardCase, classRank, academicYear, avgScoreMin, avgScoreMax,
    hasVulnerableAssignment, hasApprovedVulnerability,
    apiResponse,
  ]);

  // ── export helpers ────────────────────────────────────────
  const exportData = filteredChildren.filter((c) => selectedIds.includes(c.id));

  const warnNoSelection = () => {
    setShowWarnToast(true);
    setTimeout(() => setShowWarnToast(false), 3500);
  };

  const handleExportPDF = () => {
    if (!exportData.length) { warnNoSelection(); return; }
    const doc = new jsPDF();
    const generateTable = autoTable.default || autoTable;
    if (typeof generateTable === 'function') {
      generateTable(doc, {
        head: [['Code', 'Full Name', 'School Name', 'Gender', 'Emergency Contact']],
        body: exportData.map((c) => [
          c.childCode || 'N/A',
          `${c.firstName || ''} ${c.lastName || ''}`,
          c.schoolName || 'N/A',
          c.gender || 'N/A',
          c.emergencyContactPhone || 'N/A',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
        styles: { fontSize: 9 },
      });
      doc.save(`Student_Report_${new Date().toLocaleDateString().replaceAll('/', '-')}.pdf`);
    }
  };

  const handleExportExcel = () => {
    if (!exportData.length) { warnNoSelection(); return; }
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        exportData.map((c) => ({
          'Code':            c.childCode || 'N/A',
          'First Name':      c.firstName || '',
          'Last Name':       c.lastName  || '',
          'School Name':     c.schoolName || 'N/A',
          'Gender':          c.gender || 'N/A',
          'Emergency Phone': c.emergencyContactPhone || 'N/A',
        }))
      );
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 18 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      XLSX.writeFile(workbook, `Student_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Excel export error:', err);
    }
  };

  // ── guards ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticate) navigate('/loginpage');
  }, [isAuthenticate, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── loading / error states ────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primBtn rounded-full mb-4" />
          <p className="text-slate-500 font-medium">Loading Student Registry...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 font-semibold">
        Error loading data. Please check your network connection.
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {showWarnToast && <ExportWarningToast />}
      <DashbordNav />

      <div className="max-w-7xl pt-20 mx-auto flex flex-col gap-8">

        {/* Filters + export */}
        <div className="w-full">
          <SidebarActions
            // existing
            searchTerm={searchTerm}             setSearchTerm={setSearchTerm}
            gradeFilter={gradeFilter}           setGradeFilter={setGradeFilter}
            genderFilter={genderFilter}         setGenderFilter={setGenderFilter}
            schoolNameFilter={schoolNameFilter} setSchoolNameFilter={setSchoolNameFilter}
            schoolTypeFilter={schoolTypeFilter} setSchoolTypeFilter={setSchoolTypeFilter}
            // new
            hasSafeguardCase={hasSafeguardCase}
            setHasSafeguardCase={setHasSafeguardCase}
            classRank={classRank}
            setClassRank={setClassRank}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            avgScoreMin={avgScoreMin}
            setAvgScoreMin={setAvgScoreMin}
            avgScoreMax={avgScoreMax}
            setAvgScoreMax={setAvgScoreMax}
            hasVulnerableAssignment={hasVulnerableAssignment}
            setHasVulnerableAssignment={setHasVulnerableAssignment}
            hasApprovedVulnerability={hasApprovedVulnerability}
            setHasApprovedVulnerability={setHasApprovedVulnerability}
            // export
            selectedCount={selectedIds.length}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        </div>

        {/* Table */}
        <div className="w-full transition-all duration-300">
          <div className="mb-4 flex justify-between items-center px-2">
            <h2 className="text-xl font-bold text-slate-800">
              Student List{' '}
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({filteredChildren.length} records found)
              </span>
            </h2>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-600 font-semibold">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>

          <ChildrenTable
            childrenData={filteredChildren}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleAll={handleToggleAll}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;