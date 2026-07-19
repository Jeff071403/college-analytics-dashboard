import React from 'react';
import { Download } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';
import { downloadChartAsPng } from '../utils/chartExport';

export default function AnalyticsView({ colleges }) {
  const total = colleges.length;
  
  // 1. Ownership Count
  const govt = colleges.filter(c => c.ownership === 'Government').length;
  const privateColleges = colleges.filter(c => c.ownership === 'Private').length;
  const ownershipData = [
    { name: 'Government', value: govt },
    { name: 'Private', value: privateColleges }
  ];

  // 2. College Category Distribution
  const catCounts = colleges.reduce((acc, c) => {
    acc[c.college_category] = (acc[c.college_category] || 0) + 1;
    return acc;
  }, {});
  const catChartData = Object.entries(catCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  // 3. University Affiliation Breakdown
  const univCounts = colleges.reduce((acc, c) => {
    const key = (c.university_category || 'Other').split('(')[0].trim();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const univChartData = Object.entries(univCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);

  // 4. NAAC Grades
  const naacCounts = colleges.reduce((acc, c) => {
    const g = c.naac_grade || 'Not Listed';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const naacGrades = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D', 'Not Listed'];
  const naacChartData = naacGrades.map(g => ({ name: g, value: naacCounts[g] || 0 })).filter(i => i.value > 0);

  // 5. NIRF Rank vs. Google Rating Scatter
  const scatterData = colleges
    .filter(c => c.nirf_rank && c.google_rating)
    .map(c => ({
      name: c.college_name,
      nirf: c.nirf_rank,
      rating: c.google_rating
    }));

  // 6. Website Availability
  const withWebsite = colleges.filter(c => c.website && c.website.trim() !== '').length;
  const webData = [
    { name: 'Website Available', value: withWebsite },
    { name: 'No Website Listed', value: total - withWebsite }
  ];

  // 7. Location normalized
  const locCounts = colleges.reduce((acc, c) => {
    acc[c.location_normalized] = (acc[c.location_normalized] || 0) + 1;
    return acc;
  }, {});
  const locChartData = Object.entries(locCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 8);

  // 8. Stacked Government vs Private by Category
  const categories = [...new Set(colleges.map(c => c.college_category))];
  const stackedData = categories.map(cat => {
    const catColleges = colleges.filter(c => c.college_category === cat);
    return {
      category: cat,
      Government: catColleges.filter(c => c.ownership === 'Government').length,
      Private: catColleges.filter(c => c.ownership === 'Private').length
    };
  });

  // 9. Missing Data Analysis
  const missingEmail = colleges.filter(c => !c.email || c.email.trim() === '').length;
  const missingPhone = colleges.filter(c => !c.phone || c.phone.trim() === '').length;
  const missingWebsite = total - withWebsite;
  const missingNirf = colleges.filter(c => !c.nirf_rank).length;
  const missingCoords = colleges.filter(c => !c.latitude || !c.longitude).length;

  const missingData = [
    { name: 'Missing Email', value: Math.round((missingEmail / total) * 100) },
    { name: 'Missing Phone', value: Math.round((missingPhone / total) * 100) },
    { name: 'Missing Website', value: Math.round((missingWebsite / total) * 100) },
    { name: 'Unranked (NIRF)', value: Math.round((missingNirf / total) * 100) },
    { name: 'Missing Coordinates', value: Math.round((missingCoords / total) * 100) }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Deep-dive comparative datasets and quality assurance indicators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 1. Ownership Distribution (Pie) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-ownership">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Ownership Distribution</h3>
              <p className="text-[10px] text-gray-400">Government vs Private split</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-ownership', 'analytics_ownership.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ownershipData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  <Cell fill="#10B981" />
                  <Cell fill="#3B82F6" />
                </Pie>
                <Tooltip formatter={v => [`${v} colleges`, 'Count']} />
                <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. College Category Distribution (Donut) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-category">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">College Category Distribution</h3>
              <p className="text-[10px] text-gray-400">Total institutional category count</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-category', 'analytics_category.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                  {catChartData.map((_, i) => (
                    <Cell key={i} fill={['#6366F1','#10B981','#06B6D4','#8B5CF6','#F59E0B','#EC4899','#EF4444','#0D9488'][i % 8]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v} colleges`, 'Count']} />
                <Legend verticalAlign="bottom" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. University Distribution (Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-university">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">University Distribution</h3>
              <p className="text-[10px] text-gray-400">Affiliation numbers by university</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-university', 'analytics_university.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={univChartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tickFormatter={t => t.length > 17 ? t.slice(0, 14) + '...' : t} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={11} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. NAAC Grades (Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-naac">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">NAAC Grades</h3>
              <p className="text-[10px] text-gray-400">Accredited grades split count</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-naac', 'analytics_naac.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={naacChartData} margin={{ top: 10, bottom: 5, right: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. NIRF Rank vs Rating Scatter Plot */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-scatter">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">NIRF Rank vs Google Rating</h3>
              <p className="text-[10px] text-gray-400">Scatter correlation graph</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-scatter', 'analytics_scatter.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis type="number" dataKey="nirf" name="NIRF Rank" label={{ value: 'NIRF Rank', position: 'insideBottom', offset: -5, fontSize: 8 }} tick={{ fontSize: 8 }} />
                  <YAxis type="number" dataKey="rating" name="Rating" domain={[1.0, 5.0]} label={{ value: 'Google Rating', angle: -90, position: 'insideLeft', fontSize: 8 }} tick={{ fontSize: 8 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 10 }} />
                  <Scatter name="Colleges" data={scatterData} fill="#EC4899" shape="circle" line={false} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[11px] text-gray-400 italic">
                No colleges with both NIRF rank and Google rating found
              </div>
            )}
          </div>
        </div>

        {/* 6. Website Availability (Donut) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-website">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Website Availability</h3>
              <p className="text-[10px] text-gray-400">Web portals audit</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-website', 'analytics_website.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={webData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                  <Cell fill="#6366F1" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip formatter={v => [`${v} colleges`, 'Count']} />
                <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Location Distribution (Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-location">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Location Distribution</h3>
              <p className="text-[10px] text-gray-400">Regions distribution count</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-location', 'analytics_location.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locChartData} margin={{ top: 10, bottom: 5, right: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8.5 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Government vs Private Stacked (Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-stacked">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Government vs Private Stacked</h3>
              <p className="text-[10px] text-gray-400">Ownership mix by category</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-stacked', 'analytics_stacked.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} margin={{ top: 10, bottom: 5, right: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 8 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Government" stackId="a" fill="#10B981" />
                <Bar dataKey="Private" stackId="a" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 9. Missing Data Analysis (Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm" id="an-missing">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Missing Data Analysis</h3>
              <p className="text-[10px] text-gray-400">% of records with missing fields</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('an-missing', 'analytics_missing.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingData} layout="vertical" margin={{ left: 15, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 9 }} />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 8.5 }} />
                <Tooltip formatter={v => [`${v}%`, 'Percentage']} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#F87171" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
