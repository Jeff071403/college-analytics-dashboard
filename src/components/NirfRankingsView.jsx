import React, { useState } from 'react';
import { Search, Trophy, Download, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { downloadChartAsPng } from '../utils/chartExport';

export default function NirfRankingsView({ colleges, onSelectCollege }) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Sort: Lowest Rank First (e.g. 1, 2... 100), missing ranks at the end
  const sortedColleges = [...colleges].sort((a, b) => {
    if (a.nirf_rank && b.nirf_rank) return a.nirf_rank - b.nirf_rank;
    if (a.nirf_rank) return -1;
    if (b.nirf_rank) return 1;
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

  // Metrics
  const rankedColleges = colleges.filter(c => c.nirf_rank);
  const totalRanked = rankedColleges.length;
  const bestRank = totalRanked > 0 ? Math.min(...rankedColleges.map(c => c.nirf_rank)) : 'N/A';
  const averageRank = totalRanked > 0 ? Math.round(rankedColleges.reduce((sum, c) => sum + c.nirf_rank, 0) / totalRanked) : 'N/A';

  // Charts
  // Top 10 Ranked Colleges (Reversed value for chart display so taller bars mean better rank)
  const top10Ranked = [...rankedColleges]
    .sort((a,b) => a.nirf_rank - b.nirf_rank)
    .slice(0, 10)
    .map(c => ({
      name: c.college_name.length > 20 ? c.college_name.slice(0, 17) + '...' : c.college_name,
      rank: c.nirf_rank,
      chartScore: 201 - c.nirf_rank // 201 - rank so taller bar = better rank
    }));

  const rangeCounts = {
    'Top 50': colleges.filter(c => c.nirf_rank && c.nirf_rank <= 50).length,
    '51 - 100': colleges.filter(c => c.nirf_rank && c.nirf_rank > 50 && c.nirf_rank <= 100).length,
    '101 - 150': colleges.filter(c => c.nirf_rank && c.nirf_rank > 100 && c.nirf_rank <= 150).length,
    '151 - 200': colleges.filter(c => c.nirf_rank && c.nirf_rank > 150 && c.nirf_rank <= 200).length,
    'Unranked': colleges.length - totalRanked
  };
  const distributionData = Object.entries(rangeCounts).map(([name, value]) => ({ name, value })).filter(i => i.value > 0);

  // Exporters
  const exportCSV = () => {
    const headers = ['NIRF Rank,College Name,Category,Ownership,University,Website\n'];
    const rows = filtered.map(c => {
      const name = c.college_name.replace(/"/g, '""');
      const category = c.college_category;
      const ownership = c.ownership;
      const university = (c.university_category || '').replace(/"/g, '""');
      const website = c.website || '';
      return `"${c.nirf_rank_raw}","${name}","${category}","${ownership}","${university}","${website}"`;
    });
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nirf_rankings.csv';
    link.click();
  };

  const exportExcel = () => {
    let html = `<table><thead><tr><th>NIRF Rank</th><th>College Name</th><th>Category</th><th>Ownership</th><th>University</th><th>Website</th></tr></thead><tbody>`;
    filtered.forEach(c => {
      html += `<tr><td>${c.nirf_rank_raw}</td><td>${c.college_name}</td><td>${c.college_category}</td><td>${c.ownership}</td><td>${c.university_category || ''}</td><td>${c.website || ''}</td></tr>`;
    });
    html += '</tbody></table>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nirf_rankings.xls';
    link.click();
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
      <head>
        <title>NIRF Rankings Report</title>
        <style>
          body { font-family: sans-serif; font-size: 10px; padding: 20px; }
          h2 { text-align: center; color: #1e1b4b; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f3f4f6; color: #1e1b4b; }
        </style>
      </head>
      <body>
        <h2>NIRF National Institutional Rankings Report</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Total Ranked Institutions: ${rankedColleges.length}</p>
        <table>
          <thead>
            <tr>
              <th>NIRF Rank</th>
              <th>College Name</th>
              <th>Category</th>
              <th>Ownership</th>
              <th>University</th>
            </tr>
          </thead>
          <tbody>
    `;
    filtered.forEach(c => {
      html += `
        <tr>
          <td>${c.nirf_rank_raw}</td>
          <td>${c.college_name}</td>
          <td>${c.college_category}</td>
          <td>${c.ownership}</td>
          <td>${c.university_category || 'N/A'}</td>
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">NIRF National Rankings</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Institutional standings ordered by NIRF rank number first</p>
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
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Best NIRF Rank</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">{bestRank !== 'N/A' ? `#${bestRank}` : 'N/A'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Ranked Colleges</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">{totalRanked} / {colleges.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average NIRF Rank</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">{averageRank !== 'N/A' ? `#${averageRank}` : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top ranked bar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="nirf-top10">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Top 10 Ranked Colleges (Higher is Better)</h4>
            <button onClick={() => downloadChartAsPng('nirf-top10', 'nirf_top10.png')} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-48">
            {top10Ranked.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10Ranked} margin={{ left: -25, top: 5, right: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(value, name, props) => [`Rank #${props.payload.rank}`, 'NIRF Rank']} />
                  <Bar dataKey="chartScore" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">No ranked colleges to display</div>
            )}
          </div>
        </div>

        {/* Distribution Pie */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="nirf-dist">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">NIRF Ranking Distribution</h4>
            <button onClick={() => downloadChartAsPng('nirf-dist', 'nirf_distribution.png')} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-48 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                  {distributionData.map((_, i) => (
                    <Cell key={i} fill={['#F59E0B','#10B981','#3B82F6','#8B5CF6','#64748B'][i % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
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
                <th className="p-3 w-28">NIRF Rank</th>
                <th className="p-3">College Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Ownership</th>
                <th className="p-3">University</th>
                <th className="p-3 text-right">Website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-600 dark:text-gray-300">
              {paginated.map((c) => (
                <tr key={c.college_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer" onClick={() => onSelectCollege(c)}>
                  <td className="p-3 font-bold">
                    {c.nirf_rank ? (
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                        {c.nirf_rank_raw}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not Ranked</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-white">{c.college_name}</td>
                  <td className="p-3">{c.college_category}</td>
                  <td className="p-3">{c.ownership}</td>
                  <td className="p-3 truncate max-w-xs">{c.university_category || 'Data Not Available'}</td>
                  <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center justify-end gap-1">
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Website Not Available</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 italic">No colleges found matching criteria.</td>
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
