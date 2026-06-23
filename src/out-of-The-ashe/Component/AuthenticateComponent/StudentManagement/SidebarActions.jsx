import React from 'react';
import {
  FaFilePdf, FaFileExcel, FaTimes, FaSearch,
  FaFilter, FaBuilding, FaUniversity,
  FaShieldAlt, FaGraduationCap, FaChartLine,
  FaExclamationTriangle, FaCheckDouble,
} from 'react-icons/fa';
import { useGetSchoolsDropdownQuery } from '../../../Redux/Schools';

// ── shared style strings (unchanged) ─────────────────────
const inputCls =
  'w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl ' +
  'focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn outline-none ' +
  'transition-all bg-white text-slate-700 placeholder:text-slate-400';

const selectCls =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl ' +
  'focus:ring-2 focus:ring-primBtn/20 focus:border-primBtn outline-none ' +
  'transition-all bg-white text-slate-700 cursor-pointer appearance-none';

const TypePill = ({ value, current, onClick, icon: Icon, label, color }) => {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
        border transition-all ${
          active
            ? `${color} border-transparent shadow-sm`
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
        }`}
    >
      {Icon && <Icon className="text-[10px]" />}
      {label}
    </button>
  );
};

const TogglePill = ({ active, onClick, icon: Icon, label, color }) => (
  <button
    type="button"
    onClick={() => onClick(!active)}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
      border transition-all ${
        active
          ? `${color} border-transparent shadow-sm`
          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
      }`}
  >
    {Icon && <Icon className="text-[10px]" />}
    {label}
  </button>
);

const ActiveChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
    bg-primBtn/10 text-primBtn text-xs font-semibold">
    {label}
    <button onClick={onRemove} className="ml-0.5 hover:text-primBtn/60">
      <FaTimes className="text-[9px]" />
    </button>
  </span>
);

// ── section label ─────────────────────────────────────────
const SectionLabel = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
    <Icon className="text-[10px]" />
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────
const SidebarActions = ({
  // existing props
  searchTerm,        setSearchTerm,
  gradeFilter,       setGradeFilter,
  genderFilter,      setGenderFilter,
  schoolNameFilter,  setSchoolNameFilter,
  schoolTypeFilter,  setSchoolTypeFilter,

  // ── NEW props ──────────────────────────────────────────
  hasSafeguardCase,         setHasSafeguardCase,
  classRank,                setClassRank,
  academicYear,             setAcademicYear,
  avgScoreMin,              setAvgScoreMin,
  avgScoreMax,              setAvgScoreMax,
  hasVulnerableAssignment,  setHasVulnerableAssignment,
  hasApprovedVulnerability, setHasApprovedVulnerability,

  selectedCount,
  onExportPDF,
  onExportExcel,
}) => {
  const { data: schoolOptions = [], isLoading: schoolsLoading } = useGetSchoolsDropdownQuery();

  const isFiltered =
    searchTerm !== '' ||
    gradeFilter !== 'All' ||
    genderFilter !== 'All' ||
    schoolNameFilter !== '' ||
    schoolTypeFilter !== 'All' ||
    hasSafeguardCase ||
    classRank !== '' ||
    academicYear !== '' ||
    avgScoreMin !== '' ||
    avgScoreMax !== '' ||
    hasVulnerableAssignment ||
    hasApprovedVulnerability;

  const activeChips = [
    searchTerm              && { label: `"${searchTerm}"`,             clear: () => setSearchTerm('') },
    gradeFilter !== 'All'   && { label: gradeFilter,                   clear: () => setGradeFilter('All') },
    genderFilter !== 'All'  && { label: genderFilter,                  clear: () => setGenderFilter('All') },
    schoolNameFilter        && { label: `School: ${schoolNameFilter}`, clear: () => setSchoolNameFilter('') },
    schoolTypeFilter !== 'All' && { label: schoolTypeFilter,           clear: () => setSchoolTypeFilter('All') },
    hasSafeguardCase        && { label: 'Open Safeguard Case',         clear: () => setHasSafeguardCase(false) },
    classRank               && { label: `Rank: ${classRank}`,          clear: () => setClassRank('') },
    academicYear            && { label: `Year: ${academicYear}`,       clear: () => setAcademicYear('') },
    avgScoreMin             && { label: `Score ≥ ${avgScoreMin}`,      clear: () => setAvgScoreMin('') },
    avgScoreMax             && { label: `Score ≤ ${avgScoreMax}`,      clear: () => setAvgScoreMax('') },
    hasVulnerableAssignment  && { label: 'Vulnerable Assignment',      clear: () => setHasVulnerableAssignment(false) },
    hasApprovedVulnerability && { label: 'Approved Vulnerability',     clear: () => setHasApprovedVulnerability(false) },
  ].filter(Boolean);

  const handleClearAll = () => {
    setSearchTerm('');        setGradeFilter('All');
    setGenderFilter('All');   setSchoolNameFilter('');
    setSchoolTypeFilter('All');
    setHasSafeguardCase(false);
    setClassRank('');         setAcademicYear('');
    setAvgScoreMin('');       setAvgScoreMax('');
    setHasVulnerableAssignment(false);
    setHasApprovedVulnerability(false);
  };

  const SelectionBadge = () =>
    selectedCount > 0 ? (
      <span className="ml-1.5 inline-flex items-center justify-center
        bg-primBtn text-white text-[9px] font-bold px-1.5 py-0.5
        rounded-full leading-none">
        {selectedCount}
      </span>
    ) : null;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start w-full">

      {/* ══════════════════════════════════════════════
          FILTER CARD
      ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm
        p-5 w-full lg:w-3/4 flex flex-col gap-5">

        {/* ── Row 1: search + grade + gender (unchanged) ── */}
        <div>
          <SectionLabel icon={FaSearch}>Search & Basic Filters</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search name or code…"
                className={inputCls}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            <div className="relative">
              <FaFilter className="absolute left-3 top-3.5 text-slate-400 text-xs pointer-events-none" />
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={selectCls + ' pl-9'}>
                <option value="All">All education levels</option>
                <optgroup label="General">
                  <option value="Under 8">Under grade 8</option>
                  <option value="9-12">Grade 9–12</option>
                  <option value="University">University / college</option>
                </optgroup>
                <optgroup label="Specific grade">
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>Grade {i + 1}</option>
                  ))}
                </optgroup>
              </select>
              <span className="pointer-events-none absolute right-3 top-3 text-slate-400 text-xs">▼</span>
            </div>

            <div className="relative">
              <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className={selectCls}>
                <option value="All">All genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-3 text-slate-400 text-xs">▼</span>
            </div>
          </div>
        </div>

        {/* ── Row 2: school name + type (unchanged) ── */}
        <div>
          <SectionLabel icon={FaUniversity}>School</SectionLabel>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 min-w-0">
              <FaUniversity className="absolute left-3 top-3.5 text-slate-400 text-xs pointer-events-none z-10" />
              <select
                value={schoolNameFilter}
                onChange={(e) => setSchoolNameFilter(e.target.value)}
                className={selectCls + ' pl-9'}
                disabled={schoolsLoading}
              >
                <option value="">{schoolsLoading ? 'Loading…' : 'All schools'}</option>
                {schoolOptions.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} — {s.type === 'PRIVATE' ? 'Private' : 'Government'}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-3 text-slate-400 text-xs">
                {schoolsLoading ? '…' : '▼'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-semibold mr-1">Type:</span>
              {[
                { value: 'All',       label: 'All',        color: 'bg-slate-800 text-white' },
                { value: 'GOVERMENT', label: 'Government', icon: FaUniversity, color: 'bg-emerald-100 text-emerald-800' },
                { value: 'PRIVATE',   label: 'Private',    icon: FaBuilding,   color: 'bg-violet-100 text-violet-800' },
              ].map((p) => (
                <TypePill key={p.value} {...p} current={schoolTypeFilter} onClick={setSchoolTypeFilter} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Safeguard ── NEW ── */}
        <div className="border-t border-slate-100 pt-4">
          <SectionLabel icon={FaShieldAlt}>Safeguard Cases</SectionLabel>
          <div className="flex items-center gap-3">
            <TogglePill
              active={hasSafeguardCase}
              onClick={setHasSafeguardCase}
              icon={FaShieldAlt}
              label="Open safeguard cases only"
              color="bg-red-100 text-red-700"
            />
            {hasSafeguardCase && (
              <span className="text-xs text-red-500 font-medium">
                Showing children with at least one open case
              </span>
            )}
          </div>
        </div>

        {/* ── Row 4: Education / Rank / Score ── NEW ── */}
        <div className="border-t border-slate-100 pt-4">
          <SectionLabel icon={FaGraduationCap}>Education Record</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Class rank */}
            <div className="relative">
              <FaGraduationCap className="absolute left-3 top-3.5 text-slate-400 text-xs pointer-events-none" />
              <input
                type="number"
                min="1"
                placeholder="Class rank (e.g. 1)"
                className={inputCls}
                value={classRank}
                onChange={(e) => setClassRank(e.target.value)}
              />
              {classRank && (
                <button onClick={() => setClassRank('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* Academic year */}
            <div className="relative">
              <FaChartLine className="absolute left-3 top-3.5 text-slate-400 text-xs pointer-events-none" />
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={selectCls + ' pl-9'}>
                <option value="">All years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-3 text-slate-400 text-xs">▼</span>
            </div>

            {/* Avg score min */}
            <div className="relative">
              <input
                type="number"
                min="0" max="100" step="0.5"
                placeholder="Min avg score"
                className={inputCls + ' pl-3'}
                value={avgScoreMin}
                onChange={(e) => setAvgScoreMin(e.target.value)}
              />
              {avgScoreMin && (
                <button onClick={() => setAvgScoreMin('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* Avg score max */}
            <div className="relative">
              <input
                type="number"
                min="0" max="100" step="0.5"
                placeholder="Max avg score"
                className={inputCls + ' pl-3'}
                value={avgScoreMax}
                onChange={(e) => setAvgScoreMax(e.target.value)}
              />
              {avgScoreMax && (
                <button onClick={() => setAvgScoreMax('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 5: Vulnerabilities ── NEW ── */}
        <div className="border-t border-slate-100 pt-4">
          <SectionLabel icon={FaExclamationTriangle}>Vulnerability</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            <TogglePill
              active={hasVulnerableAssignment}
              onClick={setHasVulnerableAssignment}
              icon={FaExclamationTriangle}
              label="Has vulnerable assignment"
              color="bg-amber-100 text-amber-800"
            />
            <TogglePill
              active={hasApprovedVulnerability}
              onClick={setHasApprovedVulnerability}
              icon={FaCheckDouble}
              label="Approved vulnerability"
              color="bg-emerald-100 text-emerald-800"
            />
          </div>
        </div>

        {/* ── Active chips + clear all (unchanged logic, extended) ── */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {activeChips.length > 0 ? (
              <>
                <span className="text-xs text-slate-400">Active filters:</span>
                {activeChips.map((c, i) => (
                  <ActiveChip key={i} label={c.label} onRemove={c.clear} />
                ))}
              </>
            ) : (
              <span className="text-xs text-slate-400">No active filters</span>
            )}
          </div>
          {isFiltered && (
            <button onClick={handleClearAll} className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1 shrink-0">
              <FaTimes className="text-[10px]" /> Clear all
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 -mt-2">
          {selectedCount > 0
            ? `${selectedCount} row${selectedCount > 1 ? 's' : ''} selected — exports will include only these rows.`
            : 'No rows selected — exports will include all filtered results.'}
        </p>
      </div>

      {/* ── Export buttons (unchanged) ── */}
      <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
        <button onClick={onExportPDF} className="flex gap-3 items-center flex-1 lg:w-52 p-3.5 border border-slate-200 rounded-2xl hover:border-red-400 hover:bg-red-50 transition-all bg-white shadow-sm group">
          <div className="w-9 h-9 bg-red-600 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm">
            <FaFilePdf size={16} />
          </div>
          <div className="text-left">
            <p className="font-bold text-xs text-slate-700 flex items-center">PDF report <SelectionBadge /></p>
            <p className="text-[10px] text-slate-400 mt-0.5">Export as PDF</p>
          </div>
        </button>
        <button onClick={onExportExcel} className="flex items-center gap-3 flex-1 lg:w-52 p-3.5 border border-slate-200 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all bg-white shadow-sm group">
          <div className="w-9 h-9 bg-green-600 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm">
            <FaFileExcel size={16} />
          </div>
          <div className="text-left">
            <p className="font-bold text-xs text-slate-700 flex items-center">Excel report <SelectionBadge /></p>
            <p className="text-[10px] text-slate-400 mt-0.5">Export as .xlsx</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SidebarActions;