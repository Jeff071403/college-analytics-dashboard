import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCcw, 
  Building2, 
  MapPin, 
  User, 
  Globe, 
  Mail, 
  Phone, 
  X, 
  ExternalLink, 
  FileCheck2, 
  GraduationCap, 
  Award, 
  CheckCircle,
  HelpCircle,
  Trophy,
  Database,
  Edit3,
  Save,
  Check,
  Loader2,
  AlertTriangle,
  Home
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

export default function App() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation / View state
  const [currentView, setCurrentView] = useState('explorer');
  
  // Filter States
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedNaac, setSelectedNaac] = useState('');
  const [selectedAutonomous, setSelectedAutonomous] = useState('');
  const [selectedNirf, setSelectedNirf] = useState('');
  const [selectedUnivCategory, setSelectedUnivCategory] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  
  // Detail Modal State
  const [selectedCollege, setSelectedCollege] = useState(null);

  // Admin View States
  const [adminSearchText, setAdminSearchText] = useState('');
  const [selectedAdminCollege, setSelectedAdminCollege] = useState(null);
  const [formState, setFormState] = useState({
    college_name: '',
    college_category: '',
    location_raw: '',
    location_normalized: '',
    website: '',
    email: '',
    phone: '',
    naac_grade: 'Not Listed',
    principal_name: '',
    autonomous: 'Unknown',
    nirf_rank: '',
    university_category: 'Unknown',
    hostel_facility: 'No Hostel Found',
    nirf_rank_raw: 'Not Ranked'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSelectAdminCollege = (college) => {
    setSelectedAdminCollege(college);
    setFormState({
      college_name: college.college_name || '',
      college_category: college.college_category || '',
      location_raw: college.location_raw || '',
      location_normalized: college.location_normalized || '',
      website: college.website || '',
      email: college.email || '',
      phone: college.phone || '',
      naac_grade: college.naac_grade || 'Not Listed',
      principal_name: college.principal_name || '',
      autonomous: college.autonomous || 'Unknown',
      nirf_rank: college.nirf_rank !== null ? String(college.nirf_rank) : '',
      university_category: college.university_category || 'Unknown',
      hostel_facility: college.hostel_facility || 'No Hostel Found',
      nirf_rank_raw: college.nirf_rank_raw || 'Not Ranked'
    });
    setSaveStatus(null);
    setSaveMessage('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedAdminCollege) return;
    
    setIsSaving(true);
    setSaveStatus(null);
    setSaveMessage('');
    
    const payload = {
      ...formState
    };
    
    fetch(`/api/colleges/${selectedAdminCollege.college_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        setIsSaving(false);
        if (res.status === 'success') {
          setSaveStatus('success');
          setSaveMessage('College record updated successfully in database!');
          setColleges(prevColleges => 
            prevColleges.map(c => 
              c.college_id === selectedAdminCollege.college_id 
                ? { ...c, ...res.data }
                : c
            )
          );
          setSelectedAdminCollege(res.data);
        } else {
          setSaveStatus('error');
          setSaveMessage(res.message || 'Failed to save college details');
        }
      })
      .catch(err => {
        setIsSaving(false);
        setSaveStatus('error');
        setSaveMessage(err.message || 'Network error occurred while saving.');
      });
  };

  // Fetch data on mount
  useEffect(() => {
    fetch('/api/colleges')
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(res => {
        if (res.status === 'success') {
          setColleges(res.data);
        } else {
          throw new Error(res.message || 'Failed to load colleges');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Listen to Escape key for closing modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedCollege(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get dynamic unique filter options from the full dataset
  const categories = [...new Set(colleges.map(c => c.college_category))].sort();
  const locations = [...new Set(colleges.map(c => c.location_normalized))].sort();
  const naacGrades = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D', 'Not Accredited', 'Not Listed'];
  const autonomousStatuses = ['Yes', 'No', 'Unknown'];
  const universityCategories = [...new Set(colleges.map(c => c.university_category).filter(Boolean))].sort();
  const hostelFacilities = ['Boys & Girls', 'Girls Only', 'Boys Only', 'No Hostel Found'];

  // Clear all filters
  const handleClearFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedNaac('');
    setSelectedAutonomous('');
    setSelectedNirf('');
    setSelectedUnivCategory('');
    setSelectedHostel('');
  };

  // Determine active filter count
  const activeFilterCount = [
    searchText.trim() !== '',
    selectedCategory !== '',
    selectedLocation !== '',
    selectedNaac !== '',
    selectedAutonomous !== '',
    selectedNirf !== '',
    selectedUnivCategory !== '',
    selectedHostel !== ''
  ].filter(Boolean).length;

  // Filter Logic (AND logic combines all active filters)
  const filteredColleges = colleges.filter(college => {
    // 0. Primary Category Tab Focus
    if (activeCategoryTab !== 'All' && college.college_category !== activeCategoryTab) return false;

    // 1. Text Search (matches name or principal, case-insensitive)
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const nameMatch = college.college_name?.toLowerCase().includes(q);
      const principalMatch = college.principal_name?.toLowerCase().includes(q);
      if (!nameMatch && !principalMatch) return false;
    }
    
    // 2. Category
    if (selectedCategory && college.college_category !== selectedCategory) return false;
    
    // 3. Normalized Location
    if (selectedLocation && college.location_normalized !== selectedLocation) return false;
    
    // 4. NAAC Grade
    if (selectedNaac && college.naac_grade !== selectedNaac) return false;
    
    // 5. Autonomous
    if (selectedAutonomous && college.autonomous !== selectedAutonomous) return false;

    // 6. NIRF Rank Status
    if (selectedNirf === 'ranked' && !college.nirf_rank) return false;
    if (selectedNirf === 'unranked' && college.nirf_rank) return false;

    // 7. University Category
    if (selectedUnivCategory && college.university_category !== selectedUnivCategory) return false;

    // 8. Hostel Facility
    if (selectedHostel && college.hostel_facility !== selectedHostel) return false;
    
    return true;
  });

  // Calculate live statistics for filtered set
  const totalFiltered = filteredColleges.length;
  
  // % NAAC Accredited: (A++, A+, A, B++, B+, B, C, D are accredited; Not Accredited/Not Listed are not)
  const accreditedCount = filteredColleges.filter(c => 
    c.naac_grade !== 'Not Accredited' && c.naac_grade !== 'Not Listed'
  ).length;
  const pctAccredited = totalFiltered > 0 ? Math.round((accreditedCount / totalFiltered) * 100) : 0;

  // % Autonomous
  const autonomousCount = filteredColleges.filter(c => c.autonomous === 'Yes').length;
  const pctAutonomous = totalFiltered > 0 ? Math.round((autonomousCount / totalFiltered) * 100) : 0;

  // % Hostel Available
  const hostelCount = filteredColleges.filter(c => c.hostel_facility && c.hostel_facility !== 'No Hostel Found').length;
  const pctHostel = totalFiltered > 0 ? Math.round((hostelCount / totalFiltered) * 100) : 0;

  // Top University category in filtered view
  const univCountsForPill = filteredColleges.reduce((acc, c) => {
    acc[c.university_category] = (acc[c.university_category] || 0) + 1;
    return acc;
  }, {});
  const topUnivCategory = Object.entries(univCountsForPill)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Header Thesis Stat: calculated live from overall dataset
  const totalCollegesCount = colleges.length;
  const totalUnaccreditedCount = colleges.filter(c => 
    c.naac_grade === 'Not Accredited' || c.naac_grade === 'Not Listed'
  ).length;
  const totalUnaccreditedPct = totalCollegesCount > 0 ? Math.round((totalUnaccreditedCount / totalCollegesCount) * 100) : 0;
  const rankedCountTotal = colleges.filter(c => c.nirf_rank).length;
  const thesisStatement = `${totalCollegesCount} institutions · ${rankedCountTotal} NIRF ranked · ~${totalUnaccreditedPct}% carry no NAAC accreditation`;

  // --- Chart 1: Colleges by Category ---
  const categoryCounts = filteredColleges.reduce((acc, c) => {
    acc[c.college_category] = (acc[c.college_category] || 0) + 1;
    return acc;
  }, {});
  
  const categoryChartData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // --- Chart 1 Dynamic: region counts when tab is selected ---
  const regionCounts = filteredColleges.reduce((acc, c) => {
    acc[c.location_normalized] = (acc[c.location_normalized] || 0) + 1;
    return acc;
  }, {});
  
  const regionChartData = Object.entries(regionCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // --- Chart 2: Colleges by NAAC Grade ---
  const naacCounts = filteredColleges.reduce((acc, c) => {
    acc[c.naac_grade] = (acc[c.naac_grade] || 0) + 1;
    return acc;
  }, {});

  const naacChartData = naacGrades
    .map(grade => ({ name: grade, value: naacCounts[grade] || 0 }))
    .filter(item => item.value > 0);

  // --- Chart 3: Hostel Facilities Distribution ---
  const hostelCounts = filteredColleges.reduce((acc, c) => {
    acc[c.hostel_facility] = (acc[c.hostel_facility] || 0) + 1;
    return acc;
  }, {});
  
  const hostelChartData = Object.entries(hostelCounts)
    .map(([name, value]) => ({ name, value }));
    
  const HOSTEL_COLORS = {
    'Boys & Girls': '#8B5CF6',
    'Girls Only': '#EC4899',
    'Boys Only': '#3B82F6',
    'No Hostel Found': '#64748B'
  };

  // --- Chart 4: University Affiliations ---
  const univCounts = filteredColleges.reduce((acc, c) => {
    acc[c.university_category] = (acc[c.university_category] || 0) + 1;
    return acc;
  }, {});
  
  const univChartData = Object.entries(univCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Color Helper for NAAC Grades
  const getNaacColor = (grade) => {
    if (['A++', 'A+', 'A'].includes(grade)) return '#10b981'; // Emerald/Green
    if (['B++', 'B+', 'B'].includes(grade)) return '#d97706'; // Amber/Gold
    return '#64748b'; // Slate/Gray for C, D, Not Accredited, Not Listed
  };

  const getNaacBadgeClass = (grade) => {
    if (['A++', 'A+', 'A'].includes(grade)) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (['B++', 'B+', 'B'].includes(grade)) {
      return 'bg-accent-50 text-accent-800 border-accent-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER SECTION */}
      <header className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-8 shadow-sm mb-8 border border-purple-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-xl">
                🏛️
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider text-purple-700 uppercase block">
                  National Registry
                </span>
                <h1 className="text-3xl font-bold text-slate-900">
                  College Accreditation Explorer
                </h1>
              </div>
            </div>
          </div>
          <div className="text-slate-600 font-medium text-sm md:text-right">
            {loading ? (
              <span className="animate-pulse">Loading dataset...</span>
            ) : (
              <span className="text-xs text-slate-500">{thesisStatement}</span>
            )}
          </div>
        </div>

        {/* View Selection Tabs */}
        {!loading && !error && (
          <div className="flex items-center gap-6 mt-6 border-t border-purple-100 pt-4">
            <button 
              id="tab-explorer"
              onClick={() => setCurrentView('explorer')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                currentView === 'explorer' 
                  ? 'border-purple-600 text-purple-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Accreditation Explorer
            </button>
            <button 
              id="tab-admin"
              onClick={() => setCurrentView('admin')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                currentView === 'admin' 
                  ? 'border-purple-600 text-purple-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Database className="h-4 w-4" />
              Registry Editor
            </button>
          </div>
        )}

        {/* Category-Specific Focus Navigation pills */}
        {!loading && !error && currentView === 'explorer' && (
          <div className="mt-4 border-t border-purple-100 pt-4 animate-in fade-in duration-200">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700 block mb-2.5">
              Dashboard Category Focus
            </span>
            <div className="flex flex-wrap items-center gap-2 pb-1 max-h-[85px] overflow-y-auto scrollbar-thin">
              <button
                onClick={() => {
                  setActiveCategoryTab('All');
                  setSelectedCategory('');
                }}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-200 ${
                  activeCategoryTab === 'All'
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700'
                }`}
              >
                🏛️ All Colleges
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategoryTab === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {colleges.length}
                </span>
              </button>
              
              {Object.entries(
                colleges.reduce((acc, c) => {
                  acc[c.college_category] = (acc[c.college_category] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([catName, count]) => {
                  let emoji = '📚';
                  if (catName.includes('Arts')) emoji = '🎨';
                  else if (catName.includes('Engineering')) emoji = '⚙️';
                  else if (catName.includes('ITI')) emoji = '🔧';
                  else if (catName.includes('Dental')) emoji = '🦷';
                  else if (catName.includes('Pharmacy')) emoji = '💊';
                  else if (catName.includes('Physio') || catName.includes('Theraphy')) emoji = '🏥';
                  else if (catName.includes('Ayurveda') || catName.includes('Siddha') || catName.includes('Hemoepathy')) emoji = '🌿';
                  
                  const isActive = activeCategoryTab === catName;
                  return (
                    <button
                      key={catName}
                      onClick={() => {
                        setActiveCategoryTab(catName);
                      }}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-200 ${
                        isActive
                          ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{catName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-2 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 text-sm font-medium">Loading institutional data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4 text-center">
          <p className="text-red-700 font-medium">Failed to retrieve college database details.</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 border border-red-300 text-red-700 text-xs font-medium rounded hover:bg-red-100 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && currentView === 'explorer' && (
        <>
          {/* FILTER BAR */}
          <section className="bg-white/95 border border-purple-100 rounded-2xl p-6 mb-8 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-purple-700 bg-purple-50 px-3 py-1 rounded-lg font-medium">
                    {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
                  </span>
                  <button 
                    onClick={handleClearFilters}
                    className="text-xs text-accent-700 hover:text-accent-800 hover:underline flex items-center gap-1 font-medium transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Filters Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {/* Search text */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search college..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-700"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Location (Normalized) */}
              <div>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-700"
                >
                  <option value="">All Regions</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* NAAC Grade */}
              <div>
                <select
                  value={selectedNaac}
                  onChange={(e) => setSelectedNaac(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-700"
                >
                  <option value="">All NAAC Grades</option>
                  {naacGrades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              {/* Autonomous Status */}
              <div>
                <select
                  value={selectedAutonomous}
                  onChange={(e) => setSelectedAutonomous(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-700"
                >
                  <option value="">All Autonomy</option>
                  {autonomousStatuses.map(status => (
                    <option key={status} value={status}>Autonomous: {status}</option>
                  ))}
                </select>
              </div>

              {/* NIRF Rank Status */}
              <div>
                <select
                  value={selectedNirf}
                  onChange={(e) => setSelectedNirf(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-700"
                >
                  <option value="">All NIRF Status</option>
                  <option value="ranked">NIRF Ranked</option>
                  <option value="unranked">Unranked</option>
                </select>
              </div>

              {/* University Affiliation Category */}
              <div>
                <select
                  value={selectedUnivCategory}
                  onChange={(e) => setSelectedUnivCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-700"
                >
                  <option value="">All Affiliations</option>
                  {universityCategories.map(univ => (
                    <option key={univ} value={univ}>{univ}</option>
                  ))}
                </select>
              </div>

              {/* Hostel Facility */}
              <div>
                <select
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-700"
                >
                  <option value="">All Hostels</option>
                  {hostelFacilities.map(hostel => (
                    <option key={hostel} value={hostel}>{hostel}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* LIVE METRICS CARDS */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 animate-in fade-in duration-300">
            {[
              { title: 'Colleges Shown', value: totalFiltered, sub: `/ ${totalCollegesCount}`, caption: 'Institutions visible in selection', gradient: 'from-orange-400 via-rose-500 to-pink-500', icon: Building2 },
              { title: 'NAAC Accredited', value: `${pctAccredited}%`, sub: `(${accreditedCount} cols)`, caption: 'Accredited by NAAC standards', gradient: 'from-sky-500 to-blue-700', icon: Award },
              { title: 'Autonomous Status', value: `${pctAutonomous}%`, sub: `(${autonomousCount} cols)`, caption: 'Colleges marked autonomous', gradient: 'from-emerald-400 to-teal-600', icon: CheckCircle },
              { title: 'NIRF Ranked', value: filteredColleges.filter(c => c.nirf_rank).length, sub: 'colleges', caption: 'Ranked nationally in selection', gradient: 'from-violet-500 to-purple-700', icon: Trophy },
              { title: 'Hostel Facility', value: `${pctHostel}%`, sub: `(${hostelCount} cols)`, caption: 'Colleges with residential housing', gradient: 'from-fuchsia-500 to-pink-700', icon: Home },
              { title: 'Top Affiliation', value: topUnivCategory.length > 10 ? topUnivCategory.split(' ')[0] : topUnivCategory, sub: '', caption: topUnivCategory, gradient: 'from-amber-400 to-orange-500', icon: GraduationCap }
            ].map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className={`relative overflow-hidden rounded-[22px] p-5 text-white shadow-[0_16px_40px_-20px_rgba(127,90,240,0.45)] bg-gradient-to-br ${card.gradient} transition-transform duration-350 hover:scale-[1.02]`}>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
                  <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/95">{card.title}</span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="text-2xl font-bold tracking-tight">{card.value}</span>
                      <span className="pb-0.5 text-xs text-white/85">{card.sub}</span>
                    </div>
                    <p className="mt-2 text-xs text-white/95 truncate" title={card.caption}>{card.caption}</p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* CHARTS CONTAINER */}
          {totalFiltered > 0 ? (
            <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2 animate-in fade-in duration-300">
              {/* Chart 1: Categories */}
              <div className="flex flex-col rounded-[24px] border border-purple-100 bg-white p-6 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.25)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {activeCategoryTab === 'All' ? 'Count of Colleges by Category' : `Colleges by Region (${activeCategoryTab})`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeCategoryTab === 'All' ? 'Distribution across major academic disciplines' : `Geographic distribution of ${activeCategoryTab} institutions`}
                    </p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">Live view</span>
                </div>
                <div className="h-64 w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={activeCategoryTab === 'All' ? categoryChartData : regionChartData} 
                      layout="vertical" 
                      margin={{ top: 5, right: 24, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F1F7" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#64748b' }} 
                      />
                      <Tooltip cursor={{ fill: '#F8F5FF' }} contentStyle={{ background: '#fff', border: '1px solid #E9E2F7', borderRadius: '10px', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: NAAC Grades */}
              <div className="flex flex-col rounded-[24px] border border-purple-100 bg-white p-6 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.25)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Count of Colleges by NAAC Grade</h3>
                    <p className="mt-1 text-sm text-slate-500">Accreditation grade counts color-coded by performance tier</p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">Tiered</span>
                </div>
                <div className="h-64 w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={naacChartData} layout="vertical" margin={{ top: 5, right: 24, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F1F7" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#F8F5FF' }} contentStyle={{ background: '#fff', border: '1px solid #E9E2F7', borderRadius: '10px', fontSize: '12px' }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                        {naacChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getNaacColor(entry.name)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-4 text-[11px] font-medium text-slate-500">
                  <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500"></div><span>Tier A</span></div>
                  <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-500"></div><span>Tier B</span></div>
                  <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-slate-500"></div><span>Tier C/D/Other</span></div>
                </div>
              </div>

              {/* Chart 3: Hostel Facilities */}
              <div className="flex flex-col rounded-[24px] border border-purple-100 bg-white p-6 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.25)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Hostel Facility Distribution</h3>
                    <p className="mt-1 text-sm text-slate-500">Breakdown of student residential options</p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">Residential</span>
                </div>
                <div className="h-64 w-full flex-grow flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hostelChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {hostelChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={HOSTEL_COLORS[entry.name] || '#A78BFA'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} colleges`, 'Count']} contentStyle={{ background: '#fff', border: '1px solid #E9E2F7', borderRadius: '10px', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Top University Affiliations */}
              <div className="flex flex-col rounded-[24px] border border-purple-100 bg-white p-6 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.25)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Top University Affiliations</h3>
                    <p className="mt-1 text-sm text-slate-500">Distribution across governing universities</p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">Affiliations</span>
                </div>
                <div className="h-64 w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={univChartData} layout="vertical" margin={{ top: 5, right: 24, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F1F7" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} tickFormatter={(tick) => tick.length > 22 ? tick.substring(0, 19) + '...' : tick} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#F8F5FF' }} contentStyle={{ background: '#fff', border: '1px solid #E9E2F7', borderRadius: '10px', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[0, 8, 8, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          ) : null}

          {/* COLLEGES GRID SECTION */}
          <section className="mb-12">
            {filteredColleges.some(c => c.nirf_rank) && (
              <div className="mb-8 rounded-[24px] border border-purple-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 p-5 shadow-[0_16px_40px_-22px_rgba(127,90,240,0.45)]">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">NIRF Ranked Leaders</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Top performing institutions ranked nationally in the current view</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredColleges
                    .filter(c => c.nirf_rank)
                    .sort((a, b) => a.nirf_rank - b.nirf_rank)
                    .map(college => (
                      <div key={college.college_id} onClick={() => setSelectedCollege(college)} className="flex cursor-pointer items-center justify-between rounded-2xl border border-purple-100 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-purple-300">
                        <div className="min-w-0 pr-2">
                          <h4 className="truncate text-xs font-semibold text-slate-800">{college.college_name}</h4>
                          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.2em] text-slate-400">{college.college_category}</span>
                        </div>
                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">{college.nirf_rank_raw}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-purple-100 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">Registry Entries</h3>
              <span className="text-xs text-slate-500">Showing {totalFiltered} of {totalCollegesCount} institutions</span>
            </div>

            {totalFiltered > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredColleges.map((college) => (
                  <div key={college.college_id} onClick={() => setSelectedCollege(college)} className="group flex cursor-pointer flex-col justify-between rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-[0_20px_45px_-20px_rgba(127,90,240,0.35)] animate-in fade-in duration-200">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-700">{college.college_category}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {college.location_normalized}
                        </span>
                      </div>
                      <h4 className="min-h-[42px] text-sm font-semibold text-slate-800 transition-colors group-hover:text-purple-700 leading-snug">{college.college_name}</h4>
                      <p className="text-[11px] text-slate-400 mt-2 truncate italic" title={college.university_category}>
                        {college.university_category}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getNaacBadgeClass(college.naac_grade)}`}>NAAC: {college.naac_grade}</span>
                      {college.autonomous === 'Yes' && (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-700">Autonomous</span>
                      )}
                      {college.autonomous === 'Unknown' && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">Autonomy: Unknown</span>
                      )}
                      {college.hostel_facility && college.hostel_facility !== 'No Hostel Found' && (
                        <span className="flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-2.5 py-1 text-[10px] font-semibold text-pink-700">
                          <Home className="h-3 w-3" /> {college.hostel_facility}
                        </span>
                      )}
                      {college.nirf_rank_raw && college.nirf_rank_raw !== 'Not Ranked' && (
                        <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                          <Trophy className="h-3 w-3" />NIRF: {college.nirf_rank_raw}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-purple-200 bg-white/80 py-16 px-4 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-purple-200 bg-purple-50">
                  <HelpCircle className="h-6 w-6 text-purple-700" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">No institutions match the filter combination</h4>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">Try adjusting or clearing your search queries and dropdown values to find the registries you are looking for.</p>
                <button onClick={handleClearFilters} className="mt-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-purple-300 hover:text-purple-700">Clear all filters</button>
              </div>
            )}
          </section>
        </>
      )}

      {/* ADMIN PANEL */}
      {!loading && !error && currentView === 'admin' && (
        <section className="animate-in fade-in duration-200 animate-slide-in-to-top">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT SIDEBAR: COLLEGE LIST */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col max-h-[750px]">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Select College to Edit
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search by name..."
                    value={adminSearchText}
                    onChange={(e) => setAdminSearchText(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none placeholder-slate-400 text-slate-800"
                  />
                </div>
              </div>

              {/* College Scrollable List */}
              <div className="overflow-y-auto space-y-1 flex-grow pr-1 divide-y divide-slate-100 max-h-[600px]">
                {colleges
                  .filter(c => c.college_name.toLowerCase().includes(adminSearchText.toLowerCase()))
                  .map(college => {
                    const isSelected = selectedAdminCollege?.college_id === college.college_id;
                    return (
                      <button
                        key={college.college_id}
                        type="button"
                        onClick={() => handleSelectAdminCollege(college)}
                        className={`w-full text-left p-3 rounded-md transition-all flex items-center justify-between group ${
                          isSelected 
                            ? 'bg-accent-50/80 border-l-4 border-accent-600 text-accent-900 font-medium' 
                            : 'hover:bg-slate-50 text-slate-700 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-accent-900' : 'text-slate-800 group-hover:text-accent-800'}`}>
                            {college.college_name}
                          </h4>
                          <div className="flex gap-2 items-center mt-1 text-[10px] text-slate-400">
                            <span>ID: {college.college_id}</span>
                            <span>•</span>
                            <span className="truncate">{college.college_category}</span>
                          </div>
                        </div>
                        <Edit3 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-accent-600' : 'text-slate-300 group-hover:text-slate-500'}`} />
                      </button>
                    );
                  })}
                {colleges.filter(c => c.college_name.toLowerCase().includes(adminSearchText.toLowerCase())).length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No colleges match your search.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: LIVE EDITOR */}
            <div className="lg:col-span-8">
              {!selectedAdminCollege ? (
                /* EMPTY STATE */
                <div className="bg-white/85 border border-slate-200 border-dashed rounded-lg py-32 px-4 text-center shadow-xs flex flex-col items-center justify-center min-h-[450px]">
                  <div className="h-14 w-14 bg-accent-50 border border-accent-100 rounded-full flex items-center justify-center mb-4">
                    <Database className="h-7 w-7 text-accent-700" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">No College Selected for Editing</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Select an institution from the registry list on the left to start editing its record values in the database.
                  </p>
                </div>
              ) : (
                /* EDITOR FORM */
                <form 
                  onSubmit={handleSave} 
                  className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in zoom-in-99 duration-150"
                >
                  {/* Editor Header */}
                  <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-semibold text-accent-700 tracking-wider uppercase block mb-1">
                        Editing College ID: {selectedAdminCollege.college_id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-display leading-tight">
                        {formState.college_name || 'Unnamed Institution'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdminCollege(null);
                        setSaveStatus(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Save Status Alert Banner */}
                  {saveStatus && (
                    <div className={`p-4 border-b text-xs font-semibold flex items-center gap-2 ${
                      saveStatus === 'success' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-red-50 border-red-100 text-red-800'
                    }`}>
                      {saveStatus === 'success' ? (
                        <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0" />
                      )}
                      <span>{saveMessage}</span>
                    </div>
                  )}

                  {/* Form Grid Body */}
                  <div className="p-6 space-y-6">
                    {/* SECTION 1: Core Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                        1. Institutional Identity
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">College Name *</label>
                          <input 
                            type="text"
                            required
                            value={formState.college_name}
                            onChange={(e) => setFormState({...formState, college_name: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Category *</label>
                          <input 
                            type="text"
                            required
                            value={formState.college_category}
                            onChange={(e) => setFormState({...formState, college_category: e.target.value})}
                            placeholder="e.g. Engineering, Arts & Science"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Principal Name</label>
                          <input 
                            type="text"
                            value={formState.principal_name}
                            onChange={(e) => setFormState({...formState, principal_name: e.target.value})}
                            placeholder="e.g. Dr. Jane Doe"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Academic & Campus Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                        2. Academic & Campus Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">NAAC Grade *</label>
                          <select
                            value={formState.naac_grade}
                            onChange={(e) => setFormState({...formState, naac_grade: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-800"
                          >
                            {naacGrades.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Autonomous Status *</label>
                          <select
                            value={formState.autonomous}
                            onChange={(e) => setFormState({...formState, autonomous: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-800"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Hostel Facility *</label>
                          <select
                            value={formState.hostel_facility}
                            onChange={(e) => setFormState({...formState, hostel_facility: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none bg-white text-slate-800"
                          >
                            {hostelFacilities.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">NIRF Rank Description</label>
                          <input 
                            type="text"
                            value={formState.nirf_rank_raw}
                            onChange={(e) => setFormState({...formState, nirf_rank_raw: e.target.value})}
                            placeholder="e.g. (Engineering: 151-200) or 84"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">University Category / Affiliation *</label>
                        <input 
                          type="text"
                          required
                          value={formState.university_category}
                          onChange={(e) => setFormState({...formState, university_category: e.target.value})}
                          placeholder="e.g. University of Madras (Affiliated)"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    {/* SECTION 3: Location Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                        3. Geography
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Raw Location *</label>
                          <input 
                            type="text"
                            required
                            value={formState.location_raw}
                            onChange={(e) => setFormState({...formState, location_raw: e.target.value})}
                            placeholder="e.g. Guindy, Chennai"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Normalized Location / Region *</label>
                          <input 
                            type="text"
                            required
                            value={formState.location_normalized}
                            onChange={(e) => setFormState({...formState, location_normalized: e.target.value})}
                            placeholder="e.g. Chennai"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: Contact Information */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                        4. Contact & Online Presence
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Website URL</label>
                          <input 
                            type="url"
                            value={formState.website}
                            onChange={(e) => setFormState({...formState, website: e.target.value})}
                            placeholder="https://example.edu"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                          <input 
                            type="email"
                            value={formState.email}
                            onChange={(e) => setFormState({...formState, email: e.target.value})}
                            placeholder="admin@example.edu"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                          <input 
                            type="text"
                            value={formState.phone}
                            onChange={(e) => setFormState({...formState, phone: e.target.value})}
                            placeholder="+91 44 1234567"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-accent-600 focus:outline-none text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions Footer */}
                  <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectAdminCollege(selectedAdminCollege)}
                      disabled={isSaving}
                      className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold rounded text-slate-700 transition-all duration-200 shadow-sm hover:-translate-y-0.5 disabled:opacity-55"
                    >
                      Discard Edits
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-accent-700 hover:bg-accent-800 text-white text-xs font-bold rounded transition-all duration-200 shadow-sm flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* DETAIL MODAL */}
      {selectedCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setSelectedCollege(null)}></div>
          
          <div className="relative bg-white border border-slate-300 w-full max-w-lg rounded-lg shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="border-b border-slate-100 p-5 pr-12 flex justify-between items-start bg-slate-50">
              <div>
                <span className="text-[10px] font-semibold text-accent-700 tracking-wider uppercase block mb-1">
                  {selectedCollege.college_category}
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display leading-snug">
                  {selectedCollege.college_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCollege(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-all"
                aria-label="Close detail modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm">
              {/* Accreditation & Rank Status */}
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold mb-1">NAAC Grade</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${getNaacBadgeClass(selectedCollege.naac_grade)}`}>
                    {selectedCollege.naac_grade}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold mb-1">Autonomous Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${
                    selectedCollege.autonomous === 'Yes' 
                      ? 'bg-accent-50 text-accent-800 border-accent-200' 
                      : (selectedCollege.autonomous === 'No' ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-400 border-slate-100')
                  }`}>
                    {selectedCollege.autonomous}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold mb-1">NIRF Rank</span>
                  {selectedCollege.nirf_rank_raw && selectedCollege.nirf_rank_raw !== 'Not Ranked' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
                      <Trophy className="h-3 w-3 text-yellow-600" />
                      {selectedCollege.nirf_rank_raw}
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100">
                      Unranked
                    </span>
                  )}
                </div>
              </div>

              {/* Affiliation & Campus details */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold mb-1">University Category</span>
                  <span className="text-slate-800 text-xs font-semibold">{selectedCollege.university_category || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold mb-1">Hostel Facility</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                    selectedCollege.hostel_facility === 'No Hostel Found'
                      ? 'bg-slate-50 text-slate-500 border-slate-200'
                      : 'bg-pink-50 text-pink-800 border-pink-200'
                  }`}>
                    <Home className="h-3 w-3 shrink-0" />
                    {selectedCollege.hostel_facility || 'No Hostel Found'}
                  </span>
                </div>
              </div>

              {/* Location details */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Location</span>
                  <p className="text-slate-800">
                    {selectedCollege.location_raw}
                    {selectedCollege.location_raw !== selectedCollege.location_normalized && (
                      <span className="text-xs text-slate-400 block mt-0.5">
                        (Grouped under {selectedCollege.location_normalized} region)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Principal */}
              <div className="flex items-start gap-3">
                <User className="h-4.5 w-4.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Principal</span>
                  <p className="text-slate-800 font-medium">{selectedCollege.principal_name || 'Not Listed'}</p>
                </div>
              </div>

              {/* Contact Divider */}
              <div className="h-px bg-slate-100 my-2"></div>

              {/* Contact information */}
              <div className="space-y-3 pt-1">
                {/* Website */}
                {selectedCollege.website ? (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    <a 
                      href={selectedCollege.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent-700 hover:text-accent-800 hover:underline flex items-center gap-1 font-medium text-xs break-all"
                    >
                      {selectedCollege.website}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-400">
                    <Globe className="h-4.5 w-4.5 flex-shrink-0" />
                    <span className="text-xs italic">Website not available</span>
                  </div>
                )}

                {/* Email */}
                {selectedCollege.email ? (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    <a 
                      href={`mailto:${selectedCollege.email}`}
                      className="text-accent-700 hover:text-accent-800 hover:underline text-xs break-all"
                    >
                      {selectedCollege.email}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-400">
                    <Mail className="h-4.5 w-4.5 flex-shrink-0" />
                    <span className="text-xs italic">Email not available</span>
                  </div>
                )}

                {/* Phone */}
                {selectedCollege.phone ? (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    <a 
                      href={`tel:${selectedCollege.phone}`}
                      className="text-slate-700 hover:text-accent-800 text-xs hover:underline"
                    >
                      {selectedCollege.phone}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-400">
                    <Phone className="h-4.5 w-4.5 flex-shrink-0" />
                    <span className="text-xs italic">Phone not available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedCollege(null)}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold rounded text-slate-700 transition-all duration-200 shadow-sm hover:-translate-y-0.5"
              >
                Close Registry Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
