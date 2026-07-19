import React from 'react';
import { 
  Building2, 
  CheckCircle, 
  Award, 
  Trophy, 
  Globe, 
  Globe2, 
  BookOpen, 
  GraduationCap, 
  Home, 
  Star, 
  Download 
} from 'lucide-react';
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
  Legend 
} from 'recharts';
import { downloadChartAsPng } from '../utils/chartExport';

export default function DashboardView({ colleges, courseStats }) {
  // Classification Helpers
  const total = colleges.length;
  const govt = colleges.filter(c => c.ownership === 'Government').length;
  const privateColleges = colleges.filter(c => c.ownership === 'Private').length;
  const autonomous = colleges.filter(c => c.autonomous === 'Yes').length;
  
  const univDept = colleges.filter(c => {
    const uc = (c.university_category || '').toLowerCase();
    return uc.includes('university') && !uc.includes('affiliated') && !uc.includes('deemed');
  }).length;
  
  const engineering = colleges.filter(c => c.college_category === 'Engineering').length;
  const artsScience = colleges.filter(c => c.college_category === 'Arts & Science').length;
  
  const withWebsite = colleges.filter(c => c.website && c.website.trim() !== '').length;
  const withoutWebsite = total - withWebsite;
  
  const naacAccredited = colleges.filter(c => c.naac_grade && c.naac_grade !== 'Not Accredited' && c.naac_grade !== 'Not Listed').length;
  const nirfRanked = colleges.filter(c => c.nirf_rank).length;

  // KPI card configuration
  const kpis = [
    { label: 'Total Colleges', count: total, sub: 'All institutions', icon: Building2, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Government Colleges', count: govt, sub: 'State & Central managed', icon: Award, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Private Colleges', count: privateColleges, sub: 'Self-financing & aided', icon: CheckCircle, color: 'from-sky-500 to-sky-600' },
    { label: 'Autonomous Colleges', count: autonomous, sub: 'Academic autonomy', icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
    { label: 'University Depts', count: univDept, sub: 'Direct campus departments', icon: BookOpen, color: 'from-pink-500 to-pink-600' },
    { label: 'Engineering Colleges', count: engineering, sub: 'Technical institutions', icon: Trophy, color: 'from-amber-500 to-amber-600' },
    { label: 'Arts & Science Colleges', count: artsScience, sub: 'General education', icon: Building2, color: 'from-teal-500 to-teal-600' },
    { label: 'Colleges with Website', count: withWebsite, sub: 'Official portal listed', icon: Globe, color: 'from-violet-500 to-violet-600' },
    { label: 'Colleges without Website', count: withoutWebsite, sub: 'Portal missing', icon: Globe2, color: 'from-rose-500 to-rose-600' },
    { label: 'NAAC Accredited', count: naacAccredited, sub: 'Quality accredited', icon: Award, color: 'from-cyan-500 to-cyan-600' },
    { label: 'NIRF Ranked', count: nirfRanked, sub: 'Nationally ranked', icon: Star, color: 'from-orange-500 to-orange-600' }
  ];

  // 1. College Type Distribution
  const typeCounts = colleges.reduce((acc, c) => {
    acc[c.college_category] = (acc[c.college_category] || 0) + 1;
    return acc;
  }, {});
  const typeChartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  // 2. Ownership Distribution
  const ownershipChartData = [
    { name: 'Government', value: govt },
    { name: 'Private', value: privateColleges }
  ];
  const OWNERSHIP_COLORS = ['#10B981', '#3B82F6'];

  // 3. NAAC Grade Distribution
  const naacGrades = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D', 'Not Listed'];
  const naacCounts = colleges.reduce((acc, c) => {
    const g = c.naac_grade || 'Not Listed';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const naacChartData = naacGrades.map(g => ({ name: g, value: naacCounts[g] || 0 })).filter(item => item.value > 0);
  const getNaacColor = (g) => {
    if (['A++', 'A+', 'A'].includes(g)) return '#10B981';
    if (['B++', 'B+', 'B'].includes(g)) return '#F59E0B';
    return '#64748B';
  };

  // 4. NIRF Ranking Distribution
  const nirfRanges = {
    'Top 50': colleges.filter(c => c.nirf_rank && c.nirf_rank <= 50).length,
    '51 - 100': colleges.filter(c => c.nirf_rank && c.nirf_rank > 50 && c.nirf_rank <= 100).length,
    '101 - 150': colleges.filter(c => c.nirf_rank && c.nirf_rank > 100 && c.nirf_rank <= 150).length,
    '151 - 200': colleges.filter(c => c.nirf_rank && c.nirf_rank > 150 && c.nirf_rank <= 200).length,
    'Unranked': colleges.filter(c => !c.nirf_rank).length
  };
  const nirfChartData = Object.entries(nirfRanges).map(([name, value]) => ({ name, value })).filter(i => i.value > 0);

  // 5. Website Availability
  const websiteChartData = [
    { name: 'Available', value: withWebsite },
    { name: 'Not Available', value: withoutWebsite }
  ];
  const WEB_COLORS = ['#8B5CF6', '#EF4444'];

  // 6. Affiliation (University Category)
  const univCounts = colleges.reduce((acc, c) => {
    const key = (c.university_category || 'Other').split('(')[0].trim();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const univChartData = Object.entries(univCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 8);

  // 7. Location Distribution
  const locCounts = colleges.reduce((acc, c) => {
    acc[c.location_normalized] = (acc[c.location_normalized] || 0) + 1;
    return acc;
  }, {});
  const locChartData = Object.entries(locCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);

  // 8. Hostel Availability
  const hostelCounts = colleges.reduce((acc, c) => {
    const h = c.hostel_facility || 'No Hostel Found';
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, {});
  const hostelChartData = Object.entries(hostelCounts).map(([name, value]) => ({ name, value }));
  const HOSTEL_COLORS = { 'Boys & Girls': '#8B5CF6', 'Girls Only': '#EC4899', 'Boys Only': '#3B82F6', 'No Hostel Found': '#64748B' };

  // 9. Google Rating Distribution
  const ratingRanges = {
    '4.5 - 5.0': colleges.filter(c => c.google_rating >= 4.5).length,
    '4.0 - 4.4': colleges.filter(c => c.google_rating >= 4.0 && c.google_rating < 4.5).length,
    '3.5 - 3.9': colleges.filter(c => c.google_rating >= 3.5 && c.google_rating < 4.0).length,
    'Under 3.5': colleges.filter(c => c.google_rating > 0 && c.google_rating < 3.5).length
  };
  const ratingChartData = Object.entries(ratingRanges).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard Home</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Institutional overview and key metrics visualizations</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className={`bg-gradient-to-br ${kpi.color} rounded-xl p-4 text-white shadow hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-pointer`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-85">{kpi.label}</span>
                <div className="bg-white/20 rounded p-1">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold leading-none">{kpi.count}</div>
              <span className="text-[10px] opacity-75 mt-1 block">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Chart 1: College Category */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-cat">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">College Type Distribution</h3>
              <p className="text-[10px] text-gray-400">Colleges by discipline areas</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-cat', 'college_type_distribution.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11 }} />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={12}>
                  {typeChartData.map((_, i) => (
                    <Cell key={i} fill={['#6366F1','#10B981','#06B6D4','#8B5CF6','#F59E0B','#EC4899','#EF4444','#0D9488'][i % 8]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Ownership */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-ownership">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Ownership Distribution</h3>
              <p className="text-[10px] text-gray-400">Government vs Private</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-ownership', 'ownership_distribution.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ownershipChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {ownershipChartData.map((entry, idx) => (
                    <Cell key={idx} fill={OWNERSHIP_COLORS[idx % OWNERSHIP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v} colleges`, 'Count']} contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: NAAC Grades */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-naac">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">NAAC Grade Distribution</h3>
              <p className="text-[10px] text-gray-400">Quality accreditation tiers</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-naac', 'naac_grade_distribution.png')}
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={18}>
                  {naacChartData.map((entry, i) => (
                    <Cell key={i} fill={getNaacColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: NIRF Range */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-nirf">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">NIRF Ranking Distribution</h3>
              <p className="text-[10px] text-gray-400">Colleges grouped by national rank</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-nirf', 'nirf_distribution.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={nirfChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {nirfChartData.map((_, i) => (
                    <Cell key={i} fill={['#F59E0B','#10B981','#3B82F6','#8B5CF6','#64748B'][i % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v} colleges`, 'Count']} contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Web Availability */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-web">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Website Availability</h3>
              <p className="text-[10px] text-gray-400">Official web portal status</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-web', 'website_availability.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={websiteChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {websiteChartData.map((entry, idx) => (
                    <Cell key={idx} fill={WEB_COLORS[idx % WEB_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v} colleges`, 'Count']} contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: University Affiliation */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-univ">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Top University Affiliations</h3>
              <p className="text-[10px] text-gray-400">Colleges by affiliating university</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-univ', 'affiliation_distribution.png')}
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
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tickFormatter={t => t.length > 18 ? t.slice(0, 15) + '...' : t} tick={{ fontSize: 8.5, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Location normalized */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-loc">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Location Distribution</h3>
              <p className="text-[10px] text-gray-400">Top 10 regions by college count</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-loc', 'location_distribution.png')}
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8.5, fill: 'var(--text-secondary)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 8: Hostel Facility */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-hostel">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Hostel Availability</h3>
              <p className="text-[10px] text-gray-400">Residential facility breakdown</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-hostel', 'hostel_availability.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={hostelChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  {hostelChartData.map((entry, idx) => (
                    <Cell key={idx} fill={HOSTEL_COLORS[entry.name] || '#A78BFA'} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v} colleges`, 'Count']} contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 9: Google Ratings */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4" id="chart-rating">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Google Rating Distribution</h3>
              <p className="text-[10px] text-gray-400">Institutional ratings breakdown</p>
            </div>
            <button 
              onClick={() => downloadChartAsPng('chart-rating', 'rating_distribution.png')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingChartData} margin={{ top: 10, bottom: 5, right: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
