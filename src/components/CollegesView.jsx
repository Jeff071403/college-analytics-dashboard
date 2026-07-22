import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Trophy, 
  Home, 
  Award, 
  RotateCcw, 
  Grid, 
  List, 
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown
} from 'lucide-react';

export default function CollegesView({ 
  colleges, 
  onSelectCollege, 
  onEditCollege, 
  onDeleteCollege, 
  categories, 
  locations, 
  naacGrades, 
  autonomousStatuses, 
  universityCategories, 
  hostelFacilities,
  uniqueCourseNames,
  
  // States from App.jsx parent
  searchText, setSearchText,
  selectedCategory, setSelectedCategory,
  selectedLocation, setSelectedLocation,
  selectedNaac, setSelectedNaac,
  selectedAutonomous, setSelectedAutonomous,
  selectedNirf, setSelectedNirf,
  selectedUnivCategory, setSelectedUnivCategory,
  selectedHostel, setSelectedHostel,
  selectedCourseLevel, setSelectedCourseLevel,
  selectedCourseName, setSelectedCourseName,
  selectedCoEd, setSelectedCoEd,
  selectedBus, setSelectedBus,
  selectedUgc, setSelectedUgc,
  activeCategoryTab, setActiveCategoryTab,
  handleClearFilters,
  
  // Custom states
  getCategoryEmoji,
  getNaacBadgeClass,
  filteredColleges
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  
  const [sortField, setSortField] = useState('college_name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Handling multi-column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedColleges = [...filteredColleges].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    // Sort logic
    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';
    
    if (typeof valA === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedColleges.length / itemsPerPage);
  const paginatedColleges = sortedColleges.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const activeFilterCount = [
    searchText.trim() !== '', selectedCategory !== '', selectedLocation !== '',
    selectedNaac !== '', selectedAutonomous !== '', selectedNirf !== '',
    selectedUnivCategory !== '', selectedHostel !== '',
    selectedCourseLevel !== '', selectedCourseName !== '',
    selectedCoEd !== '', selectedBus !== '', selectedUgc !== ''
  ].filter(Boolean).length;

  const handleCategorySelect = (catName) => {
    setActiveCategoryTab(catName);
    setSelectedCategory(catName === 'All' ? '' : catName);
    setCurrentPage(1);
  };

  // Exporters
  const exportCSV = () => {
    const headers = ['College Name,Category,Ownership,University,NAAC Grade,NIRF Rank,Co-Ed,Bus,UGC,Placement Score,Website\n'];
    const rows = sortedColleges.map(c => {
      const name = c.college_name.replace(/"/g, '""');
      const category = c.college_category;
      const ownership = c.ownership || 'Private';
      const university = (c.university_category || '').replace(/"/g, '""');
      const naac = c.naac_grade;
      const nirf = c.nirf_rank_raw;
      const coEd = c.co_ed || 'Co-ed';
      const bus = c.bus_facility || 'No';
      const ugc = c.ugc_recognized || 'No';
      const placement = c.placement_score !== undefined ? c.placement_score : 0;
      const website = c.website || '';
      return `"${name}","${category}","${ownership}","${university}","${naac}","${nirf}","${coEd}","${bus}","${ugc}","${placement}","${website}"`;
    });
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'colleges_list.csv';
    link.click();
  };

  const exportExcel = () => {
    let html = `<table><thead><tr><th>College Name</th><th>Category</th><th>Ownership</th><th>University</th><th>NAAC Grade</th><th>NIRF Rank</th><th>Co-Ed</th><th>Bus</th><th>UGC</th><th>Placement Score</th><th>Website</th></tr></thead><tbody>`;
    sortedColleges.forEach(c => {
      html += `<tr><td>${c.college_name}</td><td>${c.college_category}</td><td>${c.ownership || 'Private'}</td><td>${c.university_category || ''}</td><td>${c.naac_grade}</td><td>${c.nirf_rank_raw}</td><td>${c.co_ed || 'Co-ed'}</td><td>${c.bus_facility || 'No'}</td><td>${c.ugc_recognized || 'No'}</td><td>${c.placement_score || 0}</td><td>${c.website || ''}</td></tr>`;
    });
    html += '</tbody></table>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'colleges_list.xls';
    link.click();
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
      <head>
        <title>Colleges Registry Report</title>
        <style>
          body { font-family: sans-serif; font-size: 9px; padding: 20px; }
          h2 { text-align: center; color: #1e1b4b; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f3f4f6; color: #1e1b4b; }
        </style>
      </head>
      <body>
        <h2>Colleges Registry Database Report</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Total Records Shown: ${sortedColleges.length}</p>
        <table>
          <thead>
            <tr>
              <th>College Name</th>
              <th>Category</th>
              <th>Ownership</th>
              <th>University</th>
              <th>NAAC</th>
              <th>NIRF</th>
              <th>Co-Ed</th>
              <th>Bus</th>
              <th>UGC</th>
              <th>Placement</th>
            </tr>
          </thead>
          <tbody>
    `;
    sortedColleges.forEach(c => {
      html += `
        <tr>
          <td>${c.college_name}</td>
          <td>${c.college_category}</td>
          <td>${c.ownership || 'Private'}</td>
          <td>${c.university_category || 'N/A'}</td>
          <td>${c.naac_grade}</td>
          <td>${c.nirf_rank_raw}</td>
          <td>${c.co_ed || 'Co-ed'}</td>
          <td>${c.bus_facility || 'No'}</td>
          <td>${c.ugc_recognized || 'No'}</td>
          <td>${c.placement_score || 0}</td>
        </tr>
      `;
    });
    html += '</tbody></table></body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Toggle (Existing UI exact filter layout, extended with View Mode switch) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Colleges Explorer</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Accredited educational institutions registry database</p>
        </div>
        
        {/* Toggle Grid vs Table View and Exports */}
        <div className="flex items-center gap-2">
          {viewMode === 'table' && (
            <div className="flex gap-1.5 mr-2 border-r border-gray-200 dark:border-slate-800 pr-3">
              <button onClick={exportCSV} className="btn-ghost text-[10px] py-1 px-2.5 font-semibold">CSV</button>
              <button onClick={exportExcel} className="btn-ghost text-[10px] py-1 px-2.5 font-semibold">Excel</button>
              <button onClick={exportPDF} className="btn-ghost text-[10px] py-1 px-2.5 font-semibold">PDF</button>
            </div>
          )}
          
          <div className="bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg flex border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md flex items-center gap-1 ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid View (Original UI)"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center gap-1 ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Table View (Enhanced)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY PILLS (EXACT UNTOUCHED ORIGINAL UI) */}
      <div className="category-bar">
        <button onClick={() => handleCategorySelect('All')} className={`cat-pill${activeCategoryTab === 'All' ? ' active' : ''}`}>
          🏛️ All Colleges <span className="pill-count">{colleges.length}</span>
        </button>
        {Object.entries(
          colleges.reduce((acc, c) => { acc[c.college_category] = (acc[c.college_category] || 0) + 1; return acc; }, {})
        ).sort((a, b) => b[1] - a[1]).map(([catName, count]) => (
          <button
            key={catName}
            onClick={() => handleCategorySelect(catName)}
            className={`cat-pill${activeCategoryTab === catName ? ' active' : ''}`}
          >
            {getCategoryEmoji(catName)} {catName} <span className="pill-count">{count}</span>
          </button>
        ))}
      </div>

      {/* FILTER BAR (EXACT UNTOUCHED ORIGINAL UI) */}
      <div className="filter-bar">
        <div className="filter-bar-header">
          <span className="filter-bar-title">🔍 Filters</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {activeFilterCount > 0 && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-full px-2.5 py-0.5">
                {activeFilterCount} active
              </span>
            )}
            <button
              onClick={handleClearFilters}
              title="Clear all filters"
              style={{ fontSize: '0.68rem', color: activeFilterCount > 0 ? '#7C3AED' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--card-border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <RotateCcw style={{ width: 11, height: 11 }} /> Reset
            </button>
          </div>
        </div>
        
        <div className="filter-grid">
          <div>
            <select
              value={selectedCategory}
              onChange={e => {
                const val = e.target.value;
                setSelectedCategory(val);
                setActiveCategoryTab(val || 'All');
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedLocation} onChange={e => { setSelectedLocation(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All Regions</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedNaac} onChange={e => { setSelectedNaac(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All NAAC Grades</option>
              {naacGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedAutonomous} onChange={e => { setSelectedAutonomous(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All Autonomy</option>
              {autonomousStatuses.map(s => <option key={s} value={s}>Autonomous: {s}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedNirf} onChange={e => { setSelectedNirf(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All NIRF Status</option>
              <option value="ranked">NIRF Ranked</option>
              <option value="unranked">Unranked</option>
            </select>
          </div>
          <div>
            <select value={selectedUnivCategory} onChange={e => { setSelectedUnivCategory(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All Affiliations</option>
              {universityCategories.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedHostel} onChange={e => { setSelectedHostel(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All Hostels</option>
              {hostelFacilities.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <select 
              value={selectedCourseLevel} 
              onChange={e => { setSelectedCourseLevel(e.target.value); setCurrentPage(1); }} 
              className="filter-select" 
              style={{ color: selectedCourseLevel ? '#7C3AED' : 'var(--text-primary)', fontWeight: selectedCourseLevel ? 600 : 400 }}
            >
              <option value="" style={{ color: 'var(--text-primary)', fontWeight: 400 }}>All Course Levels</option>
              <option value="UG" style={{ color: '#1D4ED8', fontWeight: 600 }}>📘 UG — Undergraduate</option>
              <option value="PG" style={{ color: '#6D28D9', fontWeight: 600 }}>📗 PG — Postgraduate</option>
              <option value="Diploma" style={{ color: '#BE185D', fontWeight: 600 }}>📙 Diploma / Certificate</option>
              <option value="PhD" style={{ color: '#92400E', fontWeight: 600 }}>🎓 PhD — Research</option>
            </select>
          </div>
          <div>
            <select value={selectedCourseName} onChange={e => { setSelectedCourseName(e.target.value); setCurrentPage(1); }} className="filter-select" style={{ color: selectedCourseName ? '#7C3AED' : 'var(--text-primary)', fontWeight: selectedCourseName ? 600 : 400 }}>
              <option value="" style={{ color: 'var(--text-primary)', fontWeight: 400 }}>All Courses ({uniqueCourseNames.length})</option>
              {uniqueCourseNames.map(n => <option key={n} value={n} style={{ color: 'var(--text-primary)', fontWeight: 400 }}>{n}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedCoEd} onChange={e => { setSelectedCoEd(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All Gender Policies</option>
              <option value="Co-ed">Co-educational</option>
              <option value="Women">Women Only</option>
              <option value="Men">Men Only</option>
            </select>
          </div>
          <div>
            <select value={selectedBus} onChange={e => { setSelectedBus(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All Bus Status</option>
              <option value="Yes">Bus Facility Available</option>
              <option value="No">No Bus Facility</option>
            </select>
          </div>
          <div>
            <select value={selectedUgc} onChange={e => { setSelectedUgc(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="">All UGC Status</option>
              <option value="Yes">UGC Recognized</option>
              <option value="No">Not UGC Recognized</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW GRID MODE: Replicates original grid layout */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Registry Entries</h3>
            <span className="text-xs text-gray-500">Showing {filteredColleges.length} of {colleges.length}</span>
          </div>

          {filteredColleges.length > 0 ? (
            <div className="college-grid">
              {filteredColleges.map(college => (
                <div key={college.college_id} onClick={() => onSelectCollege(college)} className="college-card">
                  <div className="college-card-header">
                    <div className="college-card-icon">{getCategoryEmoji(college.college_category)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="college-card-title">{college.college_name}</h4>
                      <div className="college-card-meta">
                        <MapPin style={{ width: 11, height: 11 }} />{college.location_normalized}
                      </div>
                    </div>
                    <span className={`naac-badge ${getNaacBadgeClass(college.naac_grade)}`} style={{ border: '1px solid', borderRadius: 999, padding: '1px 7px', fontSize: '0.63rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {college.naac_grade}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{college.university_category}</p>
                  <div className="college-card-tags">
                    {college.autonomous === 'Yes' && <span className="tag" style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: '#DDD6FE' }}>Autonomous</span>}
                    {college.hostel_facility && college.hostel_facility !== 'No Hostel Found' && (
                      <span className="tag" style={{ background: '#FDF2F8', color: '#9D174D', borderColor: '#FBCFE8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Home style={{ width: 9, height: 9 }} />{college.hostel_facility}
                      </span>
                    )}
                    {college.nirf_rank_raw && college.nirf_rank_raw !== 'Not Ranked' && (
                      <span className="tag" style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Trophy style={{ width: 9, height: 9 }} />{college.nirf_rank_raw}
                      </span>
                    )}
                    <span className="tag" style={{ background: '#EEF2FF', color: '#3730A3', borderColor: '#C7D2FE' }}>📚 {college.course_count} Courses</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">No institutions match</h4>
              <p className="text-xs text-gray-500 mb-4">Try adjusting or clearing your filters.</p>
              <button onClick={handleClearFilters} className="btn-ghost text-xs font-semibold py-1.5 px-3">Clear all filters</button>
            </div>
          )}
        </div>
      )}

      {/* VIEW TABLE MODE: Renders professional grid list with full actions and pagination */}
      {viewMode === 'table' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-100 border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 font-semibold border-b border-gray-100 dark:border-slate-800">
                    <th onClick={() => handleSort('college_name')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      College Name <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('college_category')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      Category <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('ownership')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      Ownership <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('university_category')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      University <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                     <th onClick={() => handleSort('naac_grade')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      NAAC <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('nirf_rank')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      NIRF <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('co_ed')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      Co-Ed <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('bus_facility')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      Bus <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('ugc_recognized')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      UGC <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th onClick={() => handleSort('placement_score')} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                      Placement Score <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="p-3">Website</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-600 dark:text-gray-300">
                  {paginatedColleges.map((c) => (
                    <tr key={c.college_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-3 font-semibold text-gray-900 dark:text-white">{c.college_name}</td>
                      <td className="p-3">{c.college_category}</td>
                      <td className="p-3">{c.ownership || 'Private'}</td>
                      <td className="p-3 truncate max-w-[150px]">{c.university_category || 'Data Not Available'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${getNaacBadgeClass(c.naac_grade)}`}>
                          {c.naac_grade && c.naac_grade.trim() !== '' ? c.naac_grade : 'Not Accredited'}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{c.nirf_rank_raw && c.nirf_rank_raw.trim() !== '' ? c.nirf_rank_raw : 'Not Ranked'}</td>
                      <td className="p-3">{c.co_ed || 'Co-ed'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${c.bus_facility === 'Yes' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400'}`}>
                          {c.bus_facility || 'No'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${c.ugc_recognized === 'Yes' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400' : 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {c.ugc_recognized || 'No'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{c.placement_score !== undefined ? `${c.placement_score}/10` : '0.0/10'}</td>
                      <td className="p-3">
                        {c.website ? (
                          <a href={c.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                            Visit <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">Website Not Available</span>
                        )}
                      </td>
                      <td className="p-3 text-right flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => onSelectCollege(c)} 
                          className="p-1 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded border border-gray-100 dark:border-slate-700"
                          title="View Detail Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        </button>
                        <button 
                          onClick={() => onEditCollege(c)} 
                          className="p-1 hover:bg-amber-50 dark:hover:bg-slate-800 rounded border border-gray-100 dark:border-slate-700"
                          title="Edit Details & Courses"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${c.college_name}"?`)) {
                              onDeleteCollege(c.college_id);
                            }
                          }} 
                          className="p-1 hover:bg-rose-50 dark:hover:bg-slate-800 rounded border border-gray-100 dark:border-slate-700"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedColleges.length === 0 && (
                    <tr>
                      <td colSpan="12" className="p-8 text-center text-gray-400 italic">No colleges found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="text-[10px] text-gray-400">Showing {paginatedColleges.length} of {sortedColleges.length} entries</span>
                <div className="flex gap-1.5 items-center">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                    disabled={currentPage === 1}
                    className="p-1 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-gray-500 font-semibold px-2">Page {currentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                    disabled={currentPage === totalPages}
                    className="p-1 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 disabled:opacity-50"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
