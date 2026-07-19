import React, { useState } from 'react';
import { Search, Award, Download, ArrowUpDown, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { downloadChartAsPng } from '../utils/chartExport';

export default function NaacRankingsView({ colleges, onSelectCollege }) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const naacOrder = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D', 'Not Accredited', 'Not Listed'];
  
  const getNaacIndex = (grade) => {
    const normalizedGrade = (grade && grade.trim() !== '') ? grade : 'Not Accredited';
    const idx = naacOrder.indexOf(normalizedGrade);
    return idx === -1 ? 99 : idx;
  };

  // 1. Sort colleges: highest grade first
  const sortedColleges = [...colleges].sort((a, b) => {
    const idxA = getNaacIndex(a.naac_grade);
    const idxB = getNaacIndex(b.naac_grade);
    if (idxA !== idxB) return idxA - idxB;
    return a.college_name.localeCompare(b.college_name);
  });

  // Filter
  const filtered = sortedColleges.filter(c => {
    const matchesSearch = c.college_name.toLowerCase().includes(search.toLowerCase()) ||
                          (c.university_category || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat ? c.college_category === selectedCat : true;
    return matchesSearch && matchesCat;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = [...new Set(colleges.map(c => c.college_category))].sort();

  // Cards data
  const accredited = colleges.filter(c => c.naac_grade && c.naac_grade !== 'Not Accredited' && c.naac_grade !== 'Not Listed');
  const totalAccredited = accredited.length;
  const highestGrade = accredited.length > 0 ? accredited[0].naac_grade : 'N/A';
  
  // Calculate average grade
  // A++=9, A+=8, A=7, B++=6, B+=5, B=4, C=3, D=2
  const gradeMapping = { 'A++': 9, 'A+': 8, 'A': 7, 'B++': 6, 'B+': 5, 'B': 4, 'C': 3, 'D': 2 };
  const totalAccreditedScore = accredited.reduce((sum, c) => sum + (gradeMapping[c.naac_grade] || 0), 0);
  const avgScore = totalAccredited > 0 ? Math.round((totalAccreditedScore / totalAccredited) * 10) / 10 : 0;
  
  const getAvgGradeText = (score) => {
    if (score >= 8.5) return 'A++';
    if (score >= 7.5) return 'A+';
    if (score >= 6.5) return 'A';
    if (score >= 5.5) return 'B++';
    if (score >= 4.5) return 'B+';
    if (score >= 3.5) return 'B';
    if (score >= 2.5) return 'C';
    return 'D';
  };

  const avgGradeText = totalAccredited > 0 ? `${getAvgGradeText(avgScore)} (Score: ${avgScore})` : 'N/A';

  // Charts
  const gradeCounts = colleges.reduce((acc, c) => {
    const g = c.naac_grade || 'Not Listed';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const naacChartData = naacOrder
    .map(g => ({ name: g, value: gradeCounts[g] || 0 }))
    .filter(i => i.value > 0);

  const accPercentData = [
    { name: 'Accredited', value: totalAccredited },
    { name: 'Not Accredited', value: colleges.length - totalAccredited }
  ];

  // Exporters
  const exportCSV = () => {
    const headers = ['Rank,College Name,Category,Ownership,University,Website,NAAC Grade\n'];
    const rows = filtered.map((c, i) => {
      const name = c.college_name.replace(/"/g, '""');
      const category = c.college_category;
      const ownership = c.ownership;
      const university = (c.university_category || '').replace(/"/g, '""');
      const website = c.website || '';
      return `${i + 1},"${name}","${category}","${ownership}","${university}","${website}","${c.naac_grade}"`;
    });
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'naac_rankings.csv';
    link.click();
  };

  const exportExcel = () => {
    // XLS HTML Template
    let html = `<table><thead><tr><th>Rank</th><th>College Name</th><th>Category</th><th>Ownership</th><th>University</th><th>Website</th><th>NAAC Grade</th></tr></thead><tbody>`;
    filtered.forEach((c, i) => {
      html += `<tr><td>${i+1}</td><td>${c.college_name}</td><td>${c.college_category}</td><td>${c.ownership}</td><td>${c.university_category || ''}</td><td>${c.website || ''}</td><td>${c.naac_grade}</td></tr>`;
    });
    html += '</tbody></table>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'naac_rankings.xls';
    link.click();
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
      <head>
        <title>NAAC Rankings Report</title>
        <style>
          body { font-family: sans-serif; font-size: 10px; padding: 20px; }
          h2 { text-align: center; color: #1e1b4b; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f3f4f6; color: #1e1b4b; }
        </style>
      </head>
      <body>
        <h2>NAAC Accreditation Rankings Report</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Total Institutions: ${filtered.length}</p>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>College Name</th>
              <th>Category</th>
              <th>Ownership</th>
              <th>University</th>
              <th>NAAC Grade</th>
            </tr>
          </thead>
          <tbody>
    `;
    filtered.forEach((c, i) => {
      html += `
        <tr>
          <td>${i+1}</td>
          <td>${c.college_name}</td>
          <td>${c.college_category}</td>
          <td>${c.ownership}</td>
          <td>${c.university_category || 'N/A'}</td>
          <td>${c.naac_grade}</td>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">NAAC Accreditation Rankings</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Accredited institutions sorted by high-to-low NAAC tiers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-ghost text-[10px] font-semibold py-1.5 px-3">Export CSV</button>
          <button onClick={exportExcel} className="btn-ghost text-[10px] font-semibold py-1.5 px-3">Export Excel</button>
          <button onClick={exportPDF} className="btn-ghost text-[10px] font-semibold py-1.5 px-3">Export PDF</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Highest Grade</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">{highestGrade}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Accredited</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">{totalAccredited} / {colleges.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average Grade</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">{avgGradeText}</span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="naac-dist">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Grade Tier Distribution</h4>
            <button onClick={() => downloadChartAsPng('naac-dist', 'naac_grades.png')} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={naacChartData} margin={{ left: -25, top: 5, right: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={20}>
                  {naacChartData.map((entry, idx) => (
                    <Cell key={idx} fill={getNaacIndex(entry.name) < 3 ? '#10B981' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accreditation ratio */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="naac-accreditation-ratio">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Accredited Percentage</h4>
            <button onClick={() => downloadChartAsPng('naac-accreditation-ratio', 'naac_ratio.png')} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-48 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={accPercentData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced filters & search */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by college name or university..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            className="form-input pl-9 text-xs dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <select 
          value={selectedCat} 
          onChange={e => { setSelectedCat(e.target.value); setCurrentPage(1); }} 
          className="form-input sm:w-48 text-xs dark:bg-slate-800 dark:border-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-100 border-collapse text-xs text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 font-semibold border-b border-gray-100 dark:border-slate-800">
                <th className="p-3 w-16">Rank</th>
                <th className="p-3">College Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Ownership</th>
                <th className="p-3">University</th>
                <th className="p-3">Website</th>
                <th className="p-3 text-right">NAAC Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-600 dark:text-gray-300">
              {paginated.map((c, idx) => {
                const rank = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <tr key={c.college_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer" onClick={() => onSelectCollege(c)}>
                    <td className="p-3 font-bold">{rank}</td>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">{c.college_name}</td>
                    <td className="p-3">{c.college_category}</td>
                    <td className="p-3">{c.ownership}</td>
                    <td className="p-3 truncate max-w-xs">{c.university_category || 'Data Not Available'}</td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Website Not Available</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        getNaacIndex(c.naac_grade) < 3 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {c.naac_grade && c.naac_grade.trim() !== '' ? c.naac_grade : 'Not Accredited'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400 italic">No colleges found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Showing {paginated.length} of {filtered.length} entries</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-gray-200 dark:border-slate-700 rounded text-[10px] bg-white dark:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border border-gray-200 dark:border-slate-700 rounded text-[10px] bg-white dark:bg-slate-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
