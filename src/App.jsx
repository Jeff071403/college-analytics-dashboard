import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  User, 
  Globe, 
  Mail, 
  Phone, 
  X, 
  ExternalLink, 
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
  Home,
  Sun,
  Moon,
  Trash2,
  Plus,
  Search
} from 'lucide-react';

// Import newly created subcomponents
import DashboardView from './components/DashboardView';
import CollegesView from './components/CollegesView';
import AddCollegeView from './components/AddCollegeView';
import AnalyticsView from './components/AnalyticsView';
import ComparisonView from './components/ComparisonView';
import NaacRankingsView from './components/NaacRankingsView';
import NirfRankingsView from './components/NirfRankingsView';
import CollegeMapView from './components/CollegeMapView';
import AboutView from './components/AboutView';
import CollegeDetailView from './components/CollegeDetailView';
import RegistryEditorView from './components/RegistryEditorView';

export default function App() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dark / Light theme (EXACT ORIGINAL LOGIC)
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.background = '#0A0A1A';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.background = '#F3F4F6';
    }
  }, [darkMode]);
  
  // Navigation / View state
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Filter States (EXACT ORIGINAL LOGIC)
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedNaac, setSelectedNaac] = useState('');
  const [selectedAutonomous, setSelectedAutonomous] = useState('');
  const [selectedNirf, setSelectedNirf] = useState('');
  const [selectedUnivCategory, setSelectedUnivCategory] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  
  // Course Filter States (EXACT ORIGINAL LOGIC)
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [uniqueCourseNames, setUniqueCourseNames] = useState([]);
  
  // Dashboard stats from backend (EXACT ORIGINAL LOGIC)
  const [courseStats, setCourseStats] = useState({
    total_courses: 0,
    avg_courses: 0,
    highest_course_college: null,
    course_distribution: { UG: 0, PG: 0, Diploma: 0, PhD: 0 }
  });
  
  // Detail Modal State (EXACT ORIGINAL LOGIC)
  const [selectedCollege, setSelectedCollege] = useState(null);
  
  // Modal tab and courses (EXACT ORIGINAL LOGIC)
  const [modalTab, setModalTab] = useState('overview');
  const [selectedCollegeCourses, setSelectedCollegeCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Admin View States (EXACT ORIGINAL LOGIC)
  const [adminSearchText, setAdminSearchText] = useState('');
  const [selectedAdminCollege, setSelectedAdminCollege] = useState(null);
  
  // Admin course management states (EXACT ORIGINAL LOGIC)
  const [adminTab, setAdminTab] = useState('details'); // 'details' | 'courses'
  const [adminCourses, setAdminCourses] = useState([]);
  const [loadingAdminCourses, setLoadingAdminCourses] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    course_name: '',
    course_level: 'UG',
    course_category: 'Commerce',
    duration: 3
  });
  const [courseSaveStatus, setCourseSaveStatus] = useState(null);
  const [courseSaveMessage, setCourseSaveMessage] = useState('');

  // Form State (EXACT ORIGINAL LOGIC)
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
    nirf_rank_raw: 'Not Ranked',
    ownership: 'Private',
    google_rating: '4.0',
    latitude: '',
    longitude: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Autocomplete suggestions
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState(false);
  const globalSearchSuggestions = searchText.trim() !== ''
    ? colleges.filter(c => 
        c.college_name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.college_category.toLowerCase().includes(searchText.toLowerCase()) ||
        (c.university_category || '').toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 5)
    : [];

  const fetchAdminCourses = (collegeId) => {
    if (!collegeId) return;
    setLoadingAdminCourses(true);
    fetch(`/api/colleges/${collegeId}/courses`)
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          setAdminCourses(res.data);
        } else {
          setAdminCourses([]);
        }
        setLoadingAdminCourses(false);
      })
      .catch(err => {
        console.error('Error fetching admin courses:', err);
        setAdminCourses([]);
        setLoadingAdminCourses(false);
      });
  };

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
      nirf_rank_raw: college.nirf_rank_raw || 'Not Ranked',
      ownership: college.ownership || 'Private',
      google_rating: college.google_rating !== undefined ? String(college.google_rating) : '4.0',
      latitude: college.latitude !== null && college.latitude !== undefined ? String(college.latitude) : '',
      longitude: college.longitude !== null && college.longitude !== undefined ? String(college.longitude) : ''
    });
    setSaveStatus(null);
    setSaveMessage('');
    setAdminTab('details');
    setEditingCourse(null);
    setIsAddingCourse(false);
    setCourseSaveStatus(null);
    setCourseSaveMessage('');
    fetchAdminCourses(college.college_id);
  };

  const handleAddCourseClick = () => {
    setIsAddingCourse(true);
    setEditingCourse(null);
    setCourseForm({
      course_name: '',
      course_level: 'UG',
      course_category: 'Commerce',
      duration: 3
    });
    setCourseSaveStatus(null);
    setCourseSaveMessage('');
  };

  const handleEditCourseClick = (course) => {
    setEditingCourse(course);
    setIsAddingCourse(false);
    setCourseForm({
      course_name: course.course_name,
      course_level: course.course_level,
      course_category: course.course_category,
      duration: course.duration
    });
    setCourseSaveStatus(null);
    setCourseSaveMessage('');
  };

  const handleCourseSave = (e) => {
    e.preventDefault();
    if (!selectedAdminCollege) return;
    setCourseSaveStatus(null);
    setCourseSaveMessage('');

    const url = isAddingCourse 
      ? `/api/colleges/${selectedAdminCollege.college_id}/courses`
      : `/api/courses/${editingCourse.id}`;
    const method = isAddingCourse ? 'POST' : 'PUT';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseForm)
    })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          setCourseSaveStatus('success');
          setCourseSaveMessage(isAddingCourse ? 'Course added successfully!' : 'Course updated successfully!');
          
          fetchAdminCourses(selectedAdminCollege.college_id);
          setEditingCourse(null);
          setIsAddingCourse(false);

          // Update local colleges list course count
          const updatedCourseCountDiff = isAddingCourse ? 1 : 0;
          if (updatedCourseCountDiff !== 0) {
            setColleges(prev => prev.map(c => 
              c.college_id === selectedAdminCollege.college_id 
                ? { ...c, course_count: c.course_count + updatedCourseCountDiff } 
                : c
            ));
          }

          if (courseForm.course_name && !uniqueCourseNames.includes(courseForm.course_name)) {
            setUniqueCourseNames(prev => [...prev, courseForm.course_name].sort());
          }
        } else {
          setCourseSaveStatus('error');
          setCourseSaveMessage(res.message || 'Failed to save course');
        }
      })
      .catch(err => {
        setCourseSaveStatus('error');
        setCourseSaveMessage(err.message || 'Network error occurred while saving.');
      });
  };

  const handleCourseDelete = (course) => {
    if (!window.confirm(`Are you sure you want to delete the course "${course.course_name}"?`)) return;

    fetch(`/api/courses/${course.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          fetchAdminCourses(selectedAdminCollege.college_id);
          setColleges(prev => prev.map(c => 
            c.college_id === selectedAdminCollege.college_id 
              ? { ...c, course_count: Math.max(0, c.course_count - 1) } 
              : c
          ));
        } else {
          alert(res.message || 'Failed to delete course');
        }
      })
      .catch(err => {
        alert(err.message || 'Network error occurred while deleting.');
      });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedAdminCollege) return;
    setIsSaving(true);
    setSaveStatus(null);
    setSaveMessage('');
    const payload = { ...formState };
    fetch(`/api/colleges/${selectedAdminCollege.college_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
              c.college_id === selectedAdminCollege.college_id ? { ...c, ...res.data } : c
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

  const handleCollegeAdded = (newCol) => {
    setColleges(prev => [...prev, newCol]);
  };

  const handleCollegeDeleted = (deletedId) => {
    fetch(`/api/colleges/${deletedId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          setColleges(prev => prev.filter(c => c.college_id !== deletedId));
          if (selectedAdminCollege?.college_id === deletedId) {
            setSelectedAdminCollege(null);
          }
        } else {
          alert(res.message || 'Failed to delete college');
        }
      })
      .catch(err => {
        alert(err.message || 'Network error occurred while deleting.');
      });
  };

  // Debounce search text (EXACT ORIGINAL LOGIC)
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchText(searchText); }, 300);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Fetch unique course names on mount (EXACT ORIGINAL LOGIC)
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(res => { if (res.status === 'success') setUniqueCourseNames(res.data); })
      .catch(err => console.error('Error fetching course list:', err));
  }, []);

  // Fetch colleges list (EXACT ORIGINAL LOGIC)
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearchText.trim()) params.append('search', debouncedSearchText);
    if (selectedCourseLevel) params.append('course_level', selectedCourseLevel);
    if (selectedCourseName) params.append('course_name', selectedCourseName);
    fetch(`/api/colleges?${params.toString()}`)
      .then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); })
      .then(res => {
        if (res.status === 'success') {
          setColleges(res.data);
          if (res.stats) setCourseStats(res.stats);
        } else {
          throw new Error(res.message || 'Failed to load colleges');
        }
        setLoading(false);
      })
      .catch(err => { console.error('Error fetching colleges data:', err); setError(err.message); setLoading(false); });
  }, [debouncedSearchText, selectedCourseLevel, selectedCourseName]);

  // Filter options lists (EXACT ORIGINAL LOGIC)
  const categories = [...new Set(colleges.map(c => c.college_category))].sort();
  const locations = [...new Set(colleges.map(c => c.location_normalized))].sort();
  const naacGrades = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D', 'Not Accredited', 'Not Listed'];
  const autonomousStatuses = ['Yes', 'No', 'Unknown'];
  const universityCategories = [...new Set(colleges.map(c => c.university_category).filter(Boolean))].sort();
  const hostelFacilities = ['Boys & Girls', 'Girls Only', 'Boys Only', 'No Hostel Found'];

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedNaac('');
    setSelectedAutonomous('');
    setSelectedNirf('');
    setSelectedUnivCategory('');
    setSelectedHostel('');
    setSelectedCourseLevel('');
    setSelectedCourseName('');
    setActiveCategoryTab('All');
  };

  // Filter logic (EXACT ORIGINAL LOGIC)
  const filteredColleges = colleges.filter(college => {
    if (activeCategoryTab !== 'All' && college.college_category !== activeCategoryTab) return false;
    if (selectedCategory && college.college_category !== selectedCategory) return false;
    if (selectedLocation && college.location_normalized !== selectedLocation) return false;
    if (selectedNaac && college.naac_grade !== selectedNaac) return false;
    if (selectedAutonomous && college.autonomous !== selectedAutonomous) return false;
    if (selectedNirf === 'ranked' && !college.nirf_rank) return false;
    if (selectedNirf === 'unranked' && college.nirf_rank) return false;
    if (selectedUnivCategory && college.university_category !== selectedUnivCategory) return false;
    if (selectedHostel && college.hostel_facility !== selectedHostel) return false;
    return true;
  });

  const getCategoryEmoji = (catName = '') => {
    if (catName.includes('Arts')) return '🎨';
    if (catName.includes('Engineering')) return '⚙️';
    if (catName.includes('Medical') || catName.includes('Physio')) return '🏥';
    if (catName.includes('Pharmacy')) return '💊';
    if (catName.includes('Dental')) return '🦷';
    if (catName.includes('ITI')) return '🔧';
    return '🏛️';
  };

  const getNaacBadgeClass = (grade) => {
    if (['A++', 'A+', 'A'].includes(grade)) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (['B++', 'B+', 'B'].includes(grade)) return 'bg-accent-50 text-accent-800 border-accent-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const rankedCountTotal = colleges.filter(c => c.nirf_rank).length;
  const totalUnaccreditedCount = colleges.filter(c => c.naac_grade === 'Not Accredited' || c.naac_grade === 'Not Listed').length;
  const totalUnaccreditedPct = colleges.length > 0 ? Math.round((totalUnaccreditedCount / colleges.length) * 100) : 0;
  const thesisStatement = `${colleges.length} institutions · ${rankedCountTotal} NIRF ranked · ~${totalUnaccreditedPct}% unaccredited`;

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div id="app-root" className={darkMode ? 'dark' : ''} style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--page-bg)' }}>

      {/* ══════ SIDEBAR (RESTRUCTURED TO INCORPORATE NEW VIEWS WHILE KEEPING EXACT APPEARANCE) ══════ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏛️</div>
          <h2>College<br/>Analytics</h2>
          <p>Accreditation Registry</p>
        </div>

        <span className="sidebar-section-label">Main Menu</span>
        <button onClick={() => setCurrentView('dashboard')} className={`sidebar-nav-item${currentView === 'dashboard' ? ' active' : ''}`}>
          <Home className="nav-icon" /><span>Dashboard</span>
        </button>
        <button onClick={() => setCurrentView('explorer')} className={`sidebar-nav-item${currentView === 'explorer' ? ' active' : ''}`}>
          <Building2 className="nav-icon" /><span>Colleges</span>
        </button>
        <button onClick={() => setCurrentView('add_college')} className={`sidebar-nav-item${currentView === 'add_college' ? ' active' : ''}`}>
          <Plus className="nav-icon" /><span>Add College</span>
        </button>
        <button onClick={() => setCurrentView('admin')} className={`sidebar-nav-item${currentView === 'admin' ? ' active' : ''}`}>
          <Database className="nav-icon" /><span>Registry Editor</span>
        </button>

        <span className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Analytics & Rankings</span>
        <button onClick={() => setCurrentView('analytics')} className={`sidebar-nav-item${currentView === 'analytics' ? ' active' : ''}`}>
          <Award className="nav-icon" /><span>Analytics</span>
        </button>
        <button onClick={() => setCurrentView('comparison')} className={`sidebar-nav-item${currentView === 'comparison' ? ' active' : ''}`}>
          <Plus className="nav-icon" /><span>College Comparison</span>
        </button>
        <button onClick={() => setCurrentView('naac_rankings')} className={`sidebar-nav-item${currentView === 'naac_rankings' ? ' active' : ''}`}>
          <Award className="nav-icon" /><span>NAAC Rankings</span>
        </button>
        <button onClick={() => setCurrentView('nirf_rankings')} className={`sidebar-nav-item${currentView === 'nirf_rankings' ? ' active' : ''}`}>
          <Trophy className="nav-icon" /><span>NIRF Rankings</span>
        </button>
        <button onClick={() => setCurrentView('college_map')} className={`sidebar-nav-item${currentView === 'college_map' ? ' active' : ''}`}>
          <MapPin className="nav-icon" /><span>College Map</span>
        </button>

        <span className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Info</span>
        <button onClick={() => setCurrentView('about')} className={`sidebar-nav-item${currentView === 'about' ? ' active' : ''}`}>
          <Globe className="nav-icon" /><span>About</span>
        </button>

        <div style={{ marginTop: 'auto', padding: '1rem 1.25rem 0' }}>
          <div style={{ fontSize: '0.62rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin style={{ width: 12, height: 12 }} /><span>Tamil Nadu, India</span>
          </div>
        </div>
      </aside>

      {/* ══════ MAIN COLUMN ══════ */}
      <div className="main-col">

        {/* ─── TOPBAR (EXACT ORIGINAL LOGIC EXTENDED WITH AUTOCOMPLETE DROPDOWN) ─── */}
        <div className="topbar">
          <div className="topbar-search relative">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search colleges, courses..."
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value);
                setShowGlobalSearchDropdown(true);
              }}
              onFocus={() => setShowGlobalSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowGlobalSearchDropdown(false), 200)}
            />
            {showGlobalSearchDropdown && globalSearchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-lg z-[9999] max-h-56 overflow-y-auto">
                {globalSearchSuggestions.map(c => (
                  <button
                    key={c.college_id}
                    onClick={() => {
                      setSelectedCollege(c);
                      setSearchText('');
                      setShowGlobalSearchDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border-b border-gray-100 dark:border-slate-800 last:border-b-0 text-gray-800 dark:text-gray-200 block"
                  >
                    {c.college_name} <span className="text-[10px] text-gray-400">({c.college_category})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="topbar-spacer" />
          <span className="topbar-stat">{loading ? 'Loading...' : thesisStatement}</span>
          <button onClick={() => setDarkMode(d => !d)} className="theme-btn">
            {darkMode
              ? <><Sun style={{ width: 13, height: 13, color: '#FCD34D' }} /><span>Light</span></>
              : <><Moon style={{ width: 13, height: 13 }} /><span>Dark</span></>}
          </button>
        </div>

        {/* ─── PAGE CONTENT (DYNAMICALLY ROUTING NEW SUB-MODULES) ─── */}
        <div className="page-content">

          {/* Loading */}
          {loading && colleges.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading institutional data...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '1.5rem', textAlign: 'center', maxWidth: 480, margin: '3rem auto' }}>
              <AlertTriangle style={{ width: 32, height: 32, color: '#EF4444', margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#B91C1C' }}>Failed to load college data</p>
              <p style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: 4 }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.4rem 1rem', border: '1px solid #FECACA', background: '#fff', color: '#B91C1C', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          )}

          {/* Render views based on currentView */}
          {!loading && !error && (
            <>
              {currentView === 'dashboard' && (
                <DashboardView colleges={colleges} courseStats={courseStats} />
              )}

              {currentView === 'explorer' && (
                <CollegesView 
                  colleges={colleges}
                  onSelectCollege={setSelectedCollege}
                  onEditCollege={handleSelectAdminCollege}
                  onDeleteCollege={handleCollegeDeleted}
                  categories={categories}
                  locations={locations}
                  naacGrades={naacGrades}
                  autonomousStatuses={autonomousStatuses}
                  universityCategories={universityCategories}
                  hostelFacilities={hostelFacilities}
                  uniqueCourseNames={uniqueCourseNames}
                  searchText={searchText} setSearchText={setSearchText}
                  selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                  selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation}
                  selectedNaac={selectedNaac} setSelectedNaac={setSelectedNaac}
                  selectedAutonomous={selectedAutonomous} setSelectedAutonomous={setSelectedAutonomous}
                  selectedNirf={selectedNirf} setSelectedNirf={setSelectedNirf}
                  selectedUnivCategory={selectedUnivCategory} setSelectedUnivCategory={setSelectedUnivCategory}
                  selectedHostel={selectedHostel} setSelectedHostel={setSelectedHostel}
                  selectedCourseLevel={selectedCourseLevel} setSelectedCourseLevel={setSelectedCourseLevel}
                  selectedCourseName={selectedCourseName} setSelectedCourseName={setSelectedCourseName}
                  activeCategoryTab={activeCategoryTab} setActiveCategoryTab={setActiveCategoryTab}
                  handleClearFilters={handleClearFilters}
                  getCategoryEmoji={getCategoryEmoji}
                  getNaacBadgeClass={getNaacBadgeClass}
                  filteredColleges={filteredColleges}
                />
              )}

              {currentView === 'add_college' && (
                <AddCollegeView 
                  onCollegeAdded={handleCollegeAdded}
                  categories={categories}
                  locations={locations}
                  naacGrades={naacGrades}
                  universityCategories={universityCategories}
                  hostelFacilities={hostelFacilities}
                />
              )}

              {currentView === 'admin' && (
                <RegistryEditorView 
                  colleges={colleges}
                  selectedAdminCollege={selectedAdminCollege}
                  handleSelectAdminCollege={handleSelectAdminCollege}
                  adminSearchText={adminSearchText}
                  setAdminSearchText={setAdminSearchText}
                  adminTab={adminTab}
                  setAdminTab={setAdminTab}
                  adminCourses={adminCourses}
                  loadingAdminCourses={loadingAdminCourses}
                  editingCourse={editingCourse}
                  isAddingCourse={isAddingCourse}
                  courseForm={courseForm}
                  setCourseForm={setCourseForm}
                  courseSaveStatus={courseSaveStatus}
                  courseSaveMessage={courseSaveMessage}
                  handleAddCourseClick={handleAddCourseClick}
                  handleEditCourseClick={handleEditCourseClick}
                  handleCourseSave={handleCourseSave}
                  handleCourseDelete={handleCourseDelete}
                  formState={formState}
                  setFormState={setFormState}
                  isSaving={isSaving}
                  saveStatus={saveStatus}
                  saveMessage={saveMessage}
                  handleSave={handleSave}
                  naacGrades={naacGrades}
                  hostelFacilities={hostelFacilities}
                  getNaacBadgeClass={getNaacBadgeClass}
                  uniqueCourseNames={uniqueCourseNames}
                />
              )}

              {currentView === 'analytics' && (
                <AnalyticsView colleges={colleges} />
              )}

              {currentView === 'comparison' && (
                <ComparisonView colleges={colleges} />
              )}

              {currentView === 'naac_rankings' && (
                <NaacRankingsView colleges={colleges} onSelectCollege={setSelectedCollege} />
              )}

              {currentView === 'nirf_rankings' && (
                <NirfRankingsView colleges={colleges} onSelectCollege={setSelectedCollege} />
              )}

              {currentView === 'college_map' && (
                <CollegeMapView colleges={colleges} darkMode={darkMode} onSelectCollege={setSelectedCollege} />
              )}

              {currentView === 'about' && (
                <AboutView />
              )}
            </>
          )}

        </div>{/* end page-content */}
      </div>{/* end main-col */}

      {/* ══════ DETAIL MODAL (NEW COMPONENT - COMPREHENSIVE VIEW & MINI MAP) ══════ */}
      {selectedCollege && (
        <CollegeDetailView 
          college={selectedCollege} 
          onClose={() => setSelectedCollege(null)}
          onSelectRelated={(related) => setSelectedCollege(related)}
          allColleges={colleges}
        />
      )}

    </div>
  );
}
